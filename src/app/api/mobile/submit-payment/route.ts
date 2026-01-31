
import { NextResponse } from 'next/server';
import { submitPaymentRequest } from '@/app/actions';

export async function POST(request: Request) {
    try {
        const { uid, packageId, receiptImage } = await request.json();

        if (!uid || !packageId || !receiptImage) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await submitPaymentRequest(uid, Number(packageId), receiptImage);

        if (result.success) {
            return NextResponse.json({ success: true, message: 'Request submitted successfully' });
        } else {
            return NextResponse.json({ error: result.error || 'Failed to submit' }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
