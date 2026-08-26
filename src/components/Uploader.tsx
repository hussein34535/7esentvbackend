'use client';

import { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { CloudinaryAsset } from '@/types/cloudinary.types';

interface UploaderProps {
    label: string;
    value: CloudinaryAsset | string | null;
    onChange: (value: CloudinaryAsset | string | null) => void;
}

export default function Uploader({ label, value, onChange }: UploaderProps) {
    const [loading, setLoading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);

        try {
            // 1. Get Signature & Config
            const signRes = await fetch('/api/sign-cloudinary', { method: 'POST' });
            const { signature, timestamp, cloud_name, api_key } = await signRes.json();

            // 2. Upload to Cloudinary
            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', api_key);
            formData.append('timestamp', timestamp);
            formData.append('signature', signature);
            formData.append('folder', '7esen-uploads');

            const url = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;

            const res = await fetch(url, { method: 'POST', body: formData });
            const data = await res.json();

            if (data.secure_url) {
                // Map to CloudinaryAsset structure
                const asset: CloudinaryAsset = {
                    id: Date.now(), // Temporary ID
                    name: data.original_filename,
                    hash: data.public_id,
                    ext: `.${data.format}`,
                    mime: `image/${data.format}`,
                    width: data.width,
                    height: data.height,
                    size: data.bytes,
                    url: data.secure_url,
                    provider: 'cloudinary',
                    formats: null,
                    alternativeText: '',
                    caption: '',
                    previewUrl: null,
                    provider_metadata: { public_id: data.public_id, resource_type: 'image' },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                onChange(asset);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-ink">{label}</label>

            {value ? (
                <div className="relative w-fit">
                    <div className="w-24 h-24 rounded-lg border border-line bg-surface2 overflow-hidden flex items-center justify-center">
                        <img src={typeof value === 'string' ? value : value.url} alt="Uploaded" className="object-contain w-full h-full" />
                    </div>
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        aria-label="Remove image"
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-surface border border-line text-inkmute hover:text-danger hover:border-danger/40 shadow-card transition-colors focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:outline-none"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleUpload}
                        className="hidden"
                        id={`upload-${label}`}
                        disabled={loading}
                    />
                    <label
                        htmlFor={`upload-${label}`}
                        className={`block border-2 border-dashed border-line hover:border-violet-500/40 rounded-2xl bg-surface2/50 p-8 text-center transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-violet-500/40 outline-none ${loading ? 'pointer-events-none' : ''}`}
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 mx-auto text-violet-500 animate-spin" />
                        ) : (
                            <Upload className="w-6 h-6 mx-auto text-inkmute" />
                        )}
                        <span className="block mt-2 text-sm font-medium text-inksoft pointer-events-none">
                            {loading ? 'Uploading...' : 'Click to upload'}
                        </span>
                        {!loading && (
                            <span className="block mt-0.5 text-xs text-inkmute pointer-events-none">PNG, JPG or WebP</span>
                        )}
                        {loading && (
                            <div className="mt-3 h-1.5 w-40 mx-auto bg-surface rounded-full overflow-hidden pointer-events-none">
                                <div className="h-full w-1/2 bg-violet-500 rounded-full animate-pulse" />
                            </div>
                        )}
                    </label>
                </div>
            )}
        </div>
    );
}
