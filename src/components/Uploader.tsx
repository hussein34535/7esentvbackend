'use client';

import { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { CloudinaryAsset } from '@/types/cloudinary.types';

interface UploaderProps {
    label: string;
    value: CloudinaryAsset | null;
    onChange: (value: CloudinaryAsset | null) => void;
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
            <label className="block text-sm font-medium text-slate-300">{label}</label>

            {value ? (
                <div className="relative w-24 h-24 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center group overflow-hidden">
                    <img src={value.url} alt="Uploaded" className="object-contain w-full h-full" />
                    <button
                        onClick={() => onChange(null)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
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
                        className={`flex items-center justify-center w-24 h-24 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-emerald-500 hover:text-emerald-500 text-slate-500 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                    </label>
                </div>
            )}
        </div>
    );
}
