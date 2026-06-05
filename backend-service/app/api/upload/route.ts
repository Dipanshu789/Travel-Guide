import { NextResponse } from 'next/server';
import cloudinary from '../../../src/lib/cloudinary';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }

    const body = await req.json();
    const { file, folder, brightness, contrast, saturation } = body;

    if (!file) {
      return NextResponse.json({ error: 'Missing file data (Base64)' }, { status: 400, headers });
    }

    // Cloudinary requires integers between -99 and 100
    const parseFilter = (val: any) => {
      if (val === undefined || val === null) return 0;
      let intVal = Math.round(Number(val));
      if (intVal < -99) intVal = -99;
      if (intVal > 100) intVal = 100;
      return intVal;
    };

    const b = parseFilter(brightness);
    const c = parseFilter(contrast);
    const s = parseFilter(saturation);

    // Build transformation array if edit sliders are used
    const transformation: any[] = [];
    if (b !== 0) transformation.push({ effect: `brightness:${b}` });
    if (c !== 0) transformation.push({ effect: `contrast:${c}` });
    if (s !== 0) transformation.push({ effect: `saturation:${s}` });

    const uploadOptions: any = {
      folder: folder || 'travel_guide_uploads',
      resource_type: 'auto',
    };

    if (transformation.length > 0) {
      uploadOptions.transformation = transformation;
    }

    const uploadResponse = await cloudinary.uploader.upload(file, uploadOptions);

    return NextResponse.json({ url: uploadResponse.secure_url }, { headers });
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload image' }, { status: 500, headers });
  }
}
