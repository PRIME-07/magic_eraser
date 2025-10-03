from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import io
import json
from PIL import Image
import torch
from transformers import SamModel, SamProcessor
from diffusers import AutoPipelineForInpainting # Use the auto pipeline for better model support
from contextlib import asynccontextmanager

# A dictionary to hold our models
ml_models = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Server Startup")
    if torch.cuda.is_available():
        device = "cuda"
        torch_dtype = torch.float16
        print(f"Attempting to load models onto device: '{device}'")
        print(f"CUDA Device Name: {torch.cuda.get_device_name(0)}")
    elif torch.backends.mps.is_available():
        device = "mps"
        torch_dtype = torch.float16
        print(f"Attempting to load models onto device: '{device}'")
    else:
        device = "cpu"
        torch_dtype = torch.float32
        print(f"Attempting to load models onto device: '{device}'")
    
    ml_models["device"] = device
    ml_models["torch_dtype"] = torch_dtype

    # Load SAM Model
    sam_model_id = "facebook/sam-vit-large"
    try:
        sam_model = SamModel.from_pretrained(sam_model_id).to(device)
        sam_processor = SamProcessor.from_pretrained(sam_model_id)
        ml_models["sam_model"] = sam_model
        ml_models["sam_processor"] = sam_processor
        print("✅ SAM models loaded successfully.")
    except Exception as e:
        print(f"❌ Failed to load SAM models: {e}")

    # UPGRADE: Load the superior SDXL Inpainting Model
    inpaint_model_id = "diffusers/stable-diffusion-xl-1.0-inpainting-0.1"
    try:
        # Using AutoPipelineForInpainting is more flexible
        inpaint_pipeline = AutoPipelineForInpainting.from_pretrained(
            inpaint_model_id,
            torch_dtype=torch_dtype,
            variant="fp16" # Use the fp16 variant for speed and memory efficiency
        ).to(device)
        ml_models["inpaint_pipeline"] = inpaint_pipeline
        print("✅ SDXL Inpainting model loaded successfully.")
    except Exception as e:
        print(f"❌ Failed to load Inpainting model: {e}")

    print("Server ready.")
    
    yield
    
    # Shutdown
    print("Server Shutdown")
    ml_models.clear()
    print("✅ Models and resources cleared.")


app = FastAPI(
    title="Interactive Object Eraser API",
    description="API for object segmentation and generative inpainting.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
origins = ["http://localhost:3000", "http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Point(BaseModel):
    x: int = Field(..., description="The x-coordinate of the point.")
    y: int = Field(..., description="The y-coordinate of the point.")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Interactive Object Eraser API!"}

@app.post("/segment-object", response_class=StreamingResponse)
async def segment_object(
    image: UploadFile = File(..., description="The image to process."),
    points: str = Form(..., description='A JSON string of a list of point objects.')
):
    sam_model = ml_models.get("sam_model")
    sam_processor = ml_models.get("sam_processor")
    device = ml_models.get("device")

    if not all([sam_model, sam_processor, device]):
        raise HTTPException(status_code=503, detail="SAM models are not loaded.")

    image_bytes = await image.read()
    raw_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    points_data = json.loads(points)
    parsed_points = [Point(**p) for p in points_data]
    input_points = [[[p.x, p.y] for p in parsed_points]]

    inputs = sam_processor(raw_image, input_points=input_points, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = sam_model(**inputs)
    masks = sam_processor.image_processor.post_process_masks(
        outputs.pred_masks.cpu(), inputs["original_sizes"].cpu(), inputs["reshaped_input_sizes"].cpu()
    )[0]
    mask = masks[0, 0]
    mask_image = Image.fromarray(mask.numpy().astype('uint8') * 255)

    mask_buffer = io.BytesIO()
    mask_image.save(mask_buffer, format="PNG")
    mask_buffer.seek(0)
    return StreamingResponse(mask_buffer, media_type="image/png")

@app.post("/replace-object", response_class=StreamingResponse)
async def replace_object(
    image: UploadFile = File(..., description="The original image."),
    mask: UploadFile = File(..., description="The mask image where the object is white."),
    prompt: str = Form(..., description="A text description of what to replace the object with.")
):
    """Replace an object using Stable Diffusion Inpainting with a text prompt."""
    inpaint_pipeline = ml_models.get("inpaint_pipeline")
    if not inpaint_pipeline:
        raise HTTPException(status_code=503, detail="Inpainting model is not loaded.")

    image_bytes = await image.read()
    init_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    
    mask_bytes = await mask.read()
    mask_image = Image.open(io.BytesIO(mask_bytes)).convert("RGB")

    if init_image.size != mask_image.size:
         mask_image = mask_image.resize(init_image.size)
    
    # IMPROVEMENT: A more robust negative prompt for SDXL
    negative_prompt = "worst quality, low quality, normal quality, lowres, blurry, watermark, text, signature, ugly, deformed"

    # IMPROVEMENT: Use better parameters for high-quality generation
    inpainted_image = inpaint_pipeline(
        prompt=prompt,
        image=init_image,
        mask_image=mask_image,
        negative_prompt=negative_prompt,
        num_inference_steps=35,  # SDXL needs fewer steps than 1.5
        guidance_scale=8.0,      # A good starting point for SDXL
        strength=0.98,           # High strength for complete replacement
    ).images[0]

    img_buffer = io.BytesIO()
    inpainted_image.save(img_buffer, format="PNG")
    img_buffer.seek(0)

    return StreamingResponse(img_buffer, media_type="image/png")