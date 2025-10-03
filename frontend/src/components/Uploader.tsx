import { useRef } from 'react';

type UploaderProps = {
    label: string;
    accept?: string;
    onFileSelected: (file: File) => void;
};

export function Uploader({ label, accept, onFileSelected }: UploaderProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    return (
        <div>
            <button
                onClick={() => inputRef.current?.click()}
                className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
                {label}
            </button>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onFileSelected(file);
                }}
            />
        </div>
    );
}



