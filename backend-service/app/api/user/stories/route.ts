import { NextResponse } from 'next/server';
import { getAuth } from '../../../../src/lib/firebaseAdmin';
import pool from '../../../../src/lib/db';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Fetch active stories (created within the last 24 hours)
export async function GET(req: Request) {
  const headers = { 'Access-Control-Allow-Origin': '*' };

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }

    const token = authHeader.split('Bearer ')[1];
    const auth = getAuth();
    if (!auth) return NextResponse.json({ error: 'Auth not configured' }, { status: 503, headers });

    const decodedToken = await auth.verifyIdToken(token);
    // In a real app we'd fetch followed users' stories. 
    // Here we fetch all stories globally that haven't expired for demonstration.
    const { rows } = await pool.query(`
      SELECT ts.*, tu.display_name, tu.photo_url as user_avatar
      FROM travel_stories ts
      JOIN travel_users tu ON ts.user_id = tu.uid
      WHERE ts.expires_at > CURRENT_TIMESTAMP
      ORDER BY ts.created_at DESC
    `);

    const stories = rows.map(row => ({
      id: row.id.toString(),
      userId: row.user_id,
      userName: row.display_name,
      userAvatar: row.user_avatar,
      image: row.image_url,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    }));

    return NextResponse.json({ stories }, { headers });
  } catch (error: any) {
    console.error('Error fetching stories:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
}

// Create a new story
export async function POST(req: Request) {
  const headers = { 'Access-Control-Allow-Origin': '*' };

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }

    const token = authHeader.split('Bearer ')[1];
    const auth = getAuth();
    if (!auth) return NextResponse.json({ error: 'Auth not configured' }, { status: 503, headers });

    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400, headers });
    }

    const { rows } = await pool.query(`
      INSERT INTO travel_stories (user_id, image_url, expires_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '24 hours')
      RETURNING *
    `, [uid, image]);

    return NextResponse.json({ success: true, story: rows[0] }, { status: 201, headers });
  } catch (error: any) {
    console.error('Error creating story:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
}
