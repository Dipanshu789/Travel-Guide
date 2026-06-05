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

export async function GET(req: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }

    const token = authHeader.split('Bearer ')[1];
    const auth = getAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Backend Firebase Auth not configured' }, { status: 503, headers });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const { rows } = await pool.query(`
      SELECT * FROM travel_posts 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [uid]);

    // Map rows to match the frontend expectations
    const posts = rows.map(row => ({
      id: row.id.toString(),
      userId: row.user_id,
      image: row.image_url,
      caption: row.caption,
      createdAt: row.created_at,
      likes: row.likes,
      comments: row.comments
    }));

    return NextResponse.json({ posts }, { headers });
  } catch (error: any) {
    console.error('Error fetching posts from NeonDB:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
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

    const token = authHeader.split('Bearer ')[1];
    const auth = getAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Backend Firebase Auth not configured' }, { status: 503, headers });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const body = await req.json();
    const { image, caption } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400, headers });
    }

    // Ensure the user exists in the NeonDB travel_users table first
    await pool.query(`
      INSERT INTO travel_users (uid, display_name, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (uid) DO NOTHING
    `, [uid, decodedToken.name || 'Traveler']);

    const { rows } = await pool.query(`
      INSERT INTO travel_posts (user_id, image_url, caption)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [uid, image, caption || '']);

    const newPost = rows[0];

    return NextResponse.json({ 
      success: true, 
      post: {
        id: newPost.id.toString(),
        userId: newPost.user_id,
        image: newPost.image_url,
        caption: newPost.caption,
        createdAt: newPost.created_at,
        likes: newPost.likes,
        comments: newPost.comments
      }
    }, { status: 201, headers });
  } catch (error: any) {
    console.error('Error creating post in NeonDB:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
}
