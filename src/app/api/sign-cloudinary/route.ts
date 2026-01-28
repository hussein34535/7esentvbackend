import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});

export async function POST() {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const cloud_name = process.env.CLOUDINARY_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.CLOUDINARY_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const api_secret = process.env.CLOUDINARY_SECRET || process.env.CLOUDINARY_API_SECRET;

    if (!cloud_name || !api_key || !api_secret) {
        console.error("Missing Cloudinary Env Vars:", { cloud_name, api_key: !!api_key, api_secret: !!api_secret });
        return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    const signature = cloudinary.utils.api_sign_request({
        timestamp: timestamp,
        folder: '7esen-uploads',
    }, api_secret);

    return NextResponse.json({
        timestamp,
        signature,
        cloud_name,
        api_key
    });
}
