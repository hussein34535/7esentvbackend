export interface CloudinaryAsset {
    id: number;
    name: string;
    alternativeText: string | null;
    caption: string | null;
    width: number;
    height: number;
    formats: {
        thumbnail?: CloudinaryImageFormat;
        small?: CloudinaryImageFormat;
        medium?: CloudinaryImageFormat;
        large?: CloudinaryImageFormat;
    } | null;
    hash: string;
    ext: string;
    mime: string;
    size: number;
    url: string;
    previewUrl: string | null;
    provider: 'cloudinary';
    provider_metadata: {
        public_id: string;
        resource_type: string;
    } | null;
    createdAt: string;
    updatedAt: string;
}

export interface CloudinaryImageFormat {
    name: string;
    hash: string;
    ext: string;
    mime: string;
    width: number;
    height: number;
    size: number;
    path: string | null;
    url: string;
    provider_metadata: {
        public_id: string;
        resource_type: string;
    };
}
