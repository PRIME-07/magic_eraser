export type Point = { x: number; y: number };

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

function toReadableError(prefix: string, err: unknown) {
    if (err instanceof Error) return new Error(`${prefix}: ${err.message}`);
    return new Error(prefix);
}

export async function segmentObject(imageFile: File, points: Point[]): Promise<Blob> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('points', JSON.stringify(points));

    try {
        const response = await fetch(`${API_BASE_URL}/segment-object`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(text || `Request failed (${response.status})`);
        }
        return await response.blob();
    } catch (e) {
        throw toReadableError(`Network error contacting ${API_BASE_URL}/segment-object`, e);
    }
}

export async function replaceObject(imageFile: File, maskFile: File, prompt: string): Promise<Blob> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('mask', maskFile);
    formData.append('prompt', prompt);

    try {
        const response = await fetch(`${API_BASE_URL}/replace-object`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(text || `Request failed (${response.status})`);
        }
        return await response.blob();
    } catch (e) {
        throw toReadableError(`Network error contacting ${API_BASE_URL}/replace-object`, e);
    }
}



