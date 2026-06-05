import { NextResponse } from 'next/server';
import { getAuth } from '../../../../src/lib/firebaseAdmin';
import pool from '../../../../src/lib/db';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
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

    const { rows } = await pool.query('SELECT * FROM travel_users WHERE uid = $1', [uid]);

    if (rows.length === 0) {
      // Return defaults if user doesn't exist in DB yet
      return NextResponse.json({ 
        profile: { 
          displayName: decodedToken.name || '', 
          email: decodedToken.email || '',
          bio: '',
          photoURL: ''
        } 
      }, { headers });
    }

    const dbUser = rows[0];
    return NextResponse.json({ 
      profile: { 
        displayName: dbUser.display_name,
        bio: dbUser.bio,
        photoURL: dbUser.photo_url,
        email: decodedToken.email
      } 
    }, { headers });

  } catch (error: any) {
    console.error('Error fetching profile from NeonDB:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
}

export async function PATCH(req: Request) {
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
      return NextResponse.json({ error: 'Backend Firebase keys not configured' }, { status: 503, headers });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const body = await req.json();
    const { displayName, bio, photoURL } = body;

    // Upsert into travel_users table
    await pool.query(`
      INSERT INTO travel_users (uid, display_name, bio, photo_url, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (uid) DO UPDATE SET
        display_name = COALESCE(EXCLUDED.display_name, travel_users.display_name),
        bio = COALESCE(EXCLUDED.bio, travel_users.bio),
        photo_url = COALESCE(EXCLUDED.photo_url, travel_users.photo_url),
        updated_at = CURRENT_TIMESTAMP
    `, [uid, displayName, bio, photoURL]);

    return NextResponse.json({ success: true, message: 'Profile updated in NeonDB' }, { headers });
  } catch (error: any) {
    console.error('Error updating profile in NeonDB:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
}
