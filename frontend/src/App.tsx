import { useEffect, useMemo, useState } from 'react';
import { Uploader } from './components/Uploader';
import { PointCanvas } from './components/PointCanvas';
import { MaskPreview } from './components/MaskPreview';
import { InpaintForm } from './components/InpaintForm';
import { replaceObject, segmentObject, type Point } from './api/client';
import './App.css';

function App() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [points, setPoints] = useState<Point[]>([]);
    const [maskBlob, setMaskBlob] = useState<Blob | null>(null);
    const [inpaintBlob, setInpaintBlob] = useState<Blob | null>(null);
    const [loadingMask, setLoadingMask] = useState(false);
    const [loadingInpaint, setLoadingInpaint] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const saved = localStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark') return saved;
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
    });

    const maskUrl = useMemo(() => (maskBlob ? URL.createObjectURL(maskBlob) : undefined), [maskBlob]);
    const inpaintUrl = useMemo(() => (inpaintBlob ? URL.createObjectURL(inpaintBlob) : undefined), [inpaintBlob]);
    const isDark = theme === 'dark';

    function handleImageSelected(file: File) {
        setImageFile(file);
        setImageUrl(URL.createObjectURL(file));
        setPoints([]);
        setMaskBlob(null);
        setInpaintBlob(null);
        setError(null);
    }

    async function handleSegment() {
        if (!imageFile || points.length === 0) return;
        setLoadingMask(true);
        setError(null);
        try {
            const blob = await segmentObject(imageFile, points);
            setMaskBlob(blob);
        } catch (e: any) {
            setError(e?.message ?? 'Failed to get mask');
        } finally {
            setLoadingMask(false);
        }
    }

    function clearSelection() {
        setPoints([]);
        setMaskBlob(null);
        setInpaintBlob(null);
        setError(null);
    }

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    function toggleTheme() {
        setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
    }

    async function handleInpaint(prompt: string) {
        if (!imageFile || !maskBlob) return;
        setLoadingInpaint(true);
        setError(null);
        try {
            const maskFile = new File([maskBlob], 'mask.png', { type: 'image/png' });
            const blob = await replaceObject(imageFile, maskFile, prompt);
            setInpaintBlob(blob);
        } catch (e: any) {
            setError(e?.message ?? 'Failed to inpaint');
        } finally {
            setLoadingInpaint(false);
        }
    }

    return (
        <div className={isDark ? "min-h-screen bg-neutral-950 text-gray-100" : "min-h-screen bg-neutral-100 text-gray-900"}>
            <header className={isDark ? "sticky top-0 z-10 bg-neutral-950/70 backdrop-blur border-b border-transparent" : "sticky top-0 z-10 bg-neutral-100/80 backdrop-blur border-b border-transparent"}>
                <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
                    <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
                        Magic Eraser
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className={isDark ? "text-xs sm:text-sm text-gray-400" : "text-xs sm:text-sm text-gray-500"}>SAM + Stable Diffusion Inpainting</div>
                        <button
                            onClick={toggleTheme}
                            className={isDark ? "px-3 py-1.5 rounded-md text-sm border border-orange-700 text-orange-300 hover:bg-orange-950" : "px-3 py-1.5 rounded-md text-sm border border-orange-300 text-orange-700 hover:bg-orange-50"}
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? 'Light' : 'Dark'} Mode
                        </button>
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-6xl px-4 py-6 grid gap-6 md:grid-cols-2">
                <section className="space-y-4">
                    <div className={isDark ? "rounded-xl bg-neutral-900 p-4 shadow-sm shadow-black/40" : "rounded-xl bg-neutral-200 p-4 shadow-sm shadow-black/10"}>
                        <div className="flex flex-wrap items-center gap-2">
                            <Uploader label="Upload Image" accept="image/*" onFileSelected={handleImageSelected} />
                            <button
                                onClick={clearSelection}
                                className="px-3 py-2 rounded-md text-sm bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-50"
                                disabled={!imageUrl}
                            >
                                Clear Selection
                            </button>
                        </div>
                    </div>
                    <div className={isDark ? "rounded-xl bg-neutral-900 p-3 shadow-sm shadow-black/40" : "rounded-xl bg-neutral-200 p-3 shadow-sm shadow-black/10"}>
                        {imageUrl ? (
                            <PointCanvas
                                imageUrl={imageUrl}
                                points={points}
                                onAddPoint={async (p) => {
                                    const next = [...points, p];
                                    setPoints(next);
                                    setLoadingMask(true);
                                    setError(null);
                                    try {
                                        if (imageFile) {
                                            const blob = await segmentObject(imageFile, next);
                                            setMaskBlob(blob);
                                        }
                                    } catch (e: any) {
                                        setError(e?.message ?? 'Failed to get mask');
                                    } finally {
                                        setLoadingMask(false);
                                    }
                                }}
                                maskUrl={maskBlob ? URL.createObjectURL(maskBlob) : undefined}
                                loading={loadingMask}
                            />
                        ) : (
                            <div className={isDark ? "aspect-video grid place-items-center text-sm text-gray-400" : "aspect-video grid place-items-center text-sm text-gray-500"}>Upload an image to begin</div>
                        )}
                    </div>
                </section>
                <section className="space-y-4">
                    <div className={isDark ? "rounded-xl bg-neutral-900 p-4 shadow-sm shadow-black/40" : "rounded-xl bg-neutral-200 p-4 shadow-sm shadow-black/10"}>
                        <h3 className="font-medium mb-2">Mask Preview</h3>
                        <MaskPreview maskUrl={maskUrl} />
                    </div>
                    <div className={isDark ? "rounded-xl bg-neutral-900 p-4 shadow-sm shadow-black/40" : "rounded-xl bg-neutral-200 p-4 shadow-sm shadow-black/10"}>
                        <h3 className="font-medium mb-2">Inpaint</h3>
                        <InpaintForm onSubmit={handleInpaint} disabled={!maskBlob || loadingInpaint} />
                    </div>
                    {inpaintUrl && (
                        <div className={isDark ? "rounded-xl bg-neutral-900 p-4 shadow-sm shadow-black/40" : "rounded-xl bg-neutral-200 p-4 shadow-sm shadow-black/10"}>
                            <h3 className="font-medium mb-2">Result</h3>
                            <div className="w-full flex justify-center">
                                <img src={inpaintUrl} alt="Inpainted" className="h-auto max-h-[70vh] w-auto max-w-full rounded-lg" />
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className={isDark ? "rounded-md border border-red-800 bg-red-950 text-red-300 text-sm p-3" : "rounded-md border border-red-300 bg-red-50 text-red-700 text-sm p-3"}>{error}</div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default App;

