import { useState } from 'react';

type InpaintFormProps = {
    onSubmit: (prompt: string) => void;
    disabled?: boolean;
};

export function InpaintForm({ onSubmit, disabled }: InpaintFormProps) {
    const [prompt, setPrompt] = useState('');
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit(prompt.trim());
            }}
            className="flex gap-2 items-center"
        >
            <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what to replace with"
                className="flex-1 border rounded px-3 py-2"
            />
            <button
                disabled={disabled || !prompt.trim()}
                className="px-3 py-2 rounded bg-green-600 text-white disabled:opacity-50"
            >
                Inpaint
            </button>
        </form>
    );
}



