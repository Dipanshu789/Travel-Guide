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
  const headers = { 'Access-Control-Allow-Origin': '*' };
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }
    const token = authHeader.split('Bearer ')[1];
    const auth = getAuth();
    if (!auth) return NextResponse.json({ error: 'Backend Firebase Auth not configured' }, { status: 503, headers });
    
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const targetUid = url.searchParams.get('uid') || uid;

    if (type === 'followers') {
      const query = `
        SELECT u.uid, u.display_name, u.photo_url 
        FROM travel_followers f
        JOIN travel_users u ON f.follower_id = u.uid
        WHERE f.following_id = $1
      `;
      const { rows } = await pool.query(query, [targetUid]);
      return NextResponse.json({ followers: rows }, { headers });
    } else if (type === 'following') {
      const query = `
        SELECT u.uid, u.display_name, u.photo_url 
        FROM travel_followers f
        JOIN travel_users u ON f.following_id = u.uid
        WHERE f.follower_id = $1
      `;
      const { rows } = await pool.query(query, [targetUid]);
      return NextResponse.json({ following: rows }, { headers });
    } else {
      const followersQuery = `SELECT COUNT(*) FROM travel_followers WHERE following_id = $1`;
      const followingQuery = `SELECT COUNT(*) FROM travel_followers WHERE follower_id = $1`;
      const followersCount = await pool.query(followersQuery, [targetUid]);
      const followingCount = await pool.query(followingQuery, [targetUid]);
      
      return NextResponse.json({ 
        followersCount: parseInt(followersCount.rows[0].count),
        followingCount: parseInt(followingCount.rows[0].count)
      }, { headers });
    }
  } catch (error: any) {
    console.error('Error fetching connections:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
}

export async function POST(req: Request) {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }
    const token = authHeader.split('Bearer ')[1];
    const auth = getAuth();
    if (!auth) return NextResponse.json({ error: 'Backend config error' }, { status: 503, headers });
    
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const body = await req.json();
    const { action, targetUid } = body;

    if (!action || !targetUid) {
      return NextResponse.json({ error: 'Missing action or targetUid' }, { status: 400, headers });
    }

    if (action === 'follow') {
      await pool.query(
        `INSERT INTO travel_followers (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [uid, targetUid]
      );
    } else if (action === 'unfollow') {
      await pool.query(
        `DELETE FROM travel_followers WHERE follower_id = $1 AND following_id = $2`,
        [uid, targetUid]
      );
    } else if (action === 'remove_follower') {
      await pool.query(
        `DELETE FROM travel_followers WHERE follower_id = $1 AND following_id = $2`,
        [targetUid, uid]
      );
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers });
    }

    return NextResponse.json({ success: true, action, targetUid }, { headers });
  } catch (error: any) {
    console.error('Error in connections POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
}
