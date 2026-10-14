import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file = data.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No image file uploaded' }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = `data:${file.type};base64,${buffer.toString('base64')}`;

    const timestamp = Math.round(new Date().getTime() / 1000);

    // Generate SHA-1 signature
    const crypto = await import('crypto');
    const signature = crypto
      .createHash('sha1')
      .update(`folder=royal_step_products&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    const formData = new FormData();
    formData.append('file', base64Data);
    formData.append('api_key', apiKey || '');
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', 'royal_step_products');

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.secure_url) {
      return NextResponse.json({ url: result.secure_url });
    } else {
      return NextResponse.json({ error: 'Cloudinary upload failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Upload route error:', error);
    return NextResponse.json({ error: 'Server error during upload' }, { status: 500 });
  }
}