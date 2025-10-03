type MaskPreviewProps = {
    maskUrl?: string;
};

export function MaskPreview({ maskUrl }: MaskPreviewProps) {
    if (!maskUrl) return null;
    return (
        <div>
            <h3 className="font-semibold mb-2">Mask Preview</h3>
            <img src={maskUrl} alt="Mask" className="max-w-full h-auto border" />
        </div>
    );
}



