import { useEffect, useRef, useState } from 'react';
import type { Point } from '../api/client';

type PointCanvasProps = {
    imageUrl: string;
    points: Point[];
    onAddPoint: (p: Point) => void;
    maskUrl?: string;
    loading?: boolean;
};

export function PointCanvas({ imageUrl, points, onAddPoint, maskUrl, loading }: PointCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const maskImgRef = useRef<HTMLImageElement | null>(null);
    const [maskVersion, setMaskVersion] = useState(0);

    useEffect(() => {
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
            imgRef.current = img;
            const canvas = canvasRef.current;
            if (!canvas) return;
            canvas.width = img.width;
            canvas.height = img.height;
            draw();
        };
    }, [imageUrl]);

    useEffect(() => {
        draw();
    }, [points]);

    // Load mask image when URL changes
    useEffect(() => {
        if (!maskUrl) {
            maskImgRef.current = null;
            draw();
            return;
        }
        const maskImg = new Image();
        maskImg.src = maskUrl;
        maskImg.onload = () => {
            maskImgRef.current = maskImg;
            // bump version to force redraw even if same URL set twice
            setMaskVersion((v) => v + 1);
            draw();
        };
    }, [maskUrl]);

    function draw() {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        // Overlay mask if available (tinted)
        const maskImg = maskImgRef.current;
        if (maskImg) {
            ctx.save();
            // Draw a semi-transparent orange overlay clipped by the mask
            ctx.globalAlpha = 0.45;
            ctx.fillStyle = '#ea580c';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'destination-in';
            ctx.globalAlpha = 1.0;
            ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
            ctx.restore();
        }
        // Draw points
        ctx.fillStyle = 'rgba(234,88,12,0.95)';
        for (const p of points) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
        const canvas = e.currentTarget;
        const rect = canvas.getBoundingClientRect();
        const displayX = e.clientX - rect.left;
        const displayY = e.clientY - rect.top;
        // Convert from displayed CSS size to canvas intrinsic size
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = Math.round(displayX * scaleX);
        const y = Math.round(displayY * scaleY);
        onAddPoint({ x, y });
    }

    return (
        <div style={{ position: 'relative', maxWidth: '100%' }}>
            <canvas
                ref={canvasRef}
                onClick={handleClick}
                style={{ cursor: 'crosshair', maxWidth: '100%', height: 'auto', display: 'block' }}
            />
            {loading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', color: 'white' }}>
                    Segmenting…
                </div>
            )}
        </div>
    );
}



