# 🪄 Magic Eraser: AI-Powered Object Removal and Replacement  

An interactive, **full-stack web application** that allows users to seamlessly **remove or replace objects within an image** using state-of-the-art AI models.  

Simply upload an image, click to select an object, and describe what you want to see in its place.  

---

## ✨ Features  

- 🎨 **Object Erasing & Replacement** – Remove unwanted objects or replace them with AI-generated content.  
- 🖼️ **Interactive UI** – Click directly on the object to erase and describe what should appear in its place.  
- ⚡ **AI-Powered** – Leverages modern deep learning models for high-quality inpainting.  
- 🧩 **Modular Full-Stack** – FastAPI backend + React (Vite) frontend for smooth performance.  

---

## 🛠️ Core Technologies  

### 🔹 Back-End (AI Engine)  
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/)  
- **AI/ML:** [PyTorch](https://pytorch.org/)  
- **Models:**  
  - [`facebook/sam-vit-large`](https://huggingface.co/facebook/sam-vit-large) – *Segment Anything Model (SAM)* for precise object segmentation.  
  - [`diffusers/stable-diffusion-xl-1.0-inpainting-0.1`](https://huggingface.co/stabilityai/stable-diffusion-xl-1.0-inpainting-0.1) – *SDXL Inpainting* for high-quality generative fill.  
- **Libraries:** Hugging Face `transformers` and `diffusers`.  

### 🔹 Front-End (User Interface)  
- **Framework:** [React (Vite)](https://vitejs.dev/)  
- **Language:** TypeScript  
- **Styling:** Tailwind CSS  
- **API Communication:** Axios  

---

## 🚀 Getting Started  

Follow these instructions to set up and run the project on your local machine.  

### ✅ Prerequisites  
Make sure you have the following installed:  
- [Conda](https://docs.conda.io/en/latest/) – For managing the Python environment.  
- [Node.js & npm](https://nodejs.org/) – For frontend dependencies.  
- [Git](https://git-scm.com/) – For cloning the repository.  

---

### 1️⃣ Back-End Setup  

The back-end server handles all the AI model processing.  

```bash
# 1. Clone the repository (if you haven't already)
git clone <your-repository-url>
cd magic_eraser

# 2. Create and activate the Conda environment
conda create --name magic-eraser python=3.9 -y
conda activate magic-eraser

# 3. Install Python dependencies
pip install -r requirements.txt
```

⚠️ Note: The first time you run the server, it will download the AI models (several GBs). This may take some time depending on your internet connection.

---

### 2️⃣ Front-End Setup

The front-end is a React + Vite application.

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install Node.js dependencies
npm install
```

---

## ⚙️ Running the Application

You need to run both back-end and front-end servers in separate terminals.


# ▶️ Start Back-End Server

```bash
# From the root directory (with conda environment active)
uvicorn main:app --reload
```

API will be available at: http://127.0.0.1:8000

```bash
# From the frontend directory
npm run dev
```

Application will open automatically at: http://localhost:5173

---

## 📝 How to Use

1) Upload Image – Click "Upload Image" and select an image file.

2) Select Object – Click directly on the object to remove or replace. The app generates a segmentation mask automatically.

3) Describe – In the "Inpaint" text box, type a prompt describing what should appear.

    Example: To remove an object, describe the background (e.g., "a grassy field").

4) Generate – Click "Inpaint". The backend processes the request and returns the edited image.

5) View Result – The final image appears in the "Result" section.

---

## 📌 Example Workflow

1) Upload an image of a park.

2) Select a person you want to remove.

3) Type "a grassy field with trees" in the prompt box.

4) Generate → See the person seamlessly replaced with realistic background.