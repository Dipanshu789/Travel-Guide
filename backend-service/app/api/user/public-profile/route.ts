import { NextResponse } from 'next/server';
import { getAuth } from '../../../../src/lib/firebaseAdmin';
import pool from '../../../../src/lib/db';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    if (!auth) return NextResponse.json({ error: 'Backend config error' }, { status: 503, headers });
    
    const decodedToken = await auth.verifyIdToken(token);
    const viewerUid = decodedToken.uid;

    const url = new URL(req.url);
    const uid = url.searchParams.get('uid');
    
    if (!uid) {
      return NextResponse.json({ error: 'Missing uid parameter' }, { status: 400, headers });
    }

    // Get basic profile
    const profileQuery = `SELECT uid, display_name, photo_url, bio FROM travel_users WHERE uid = $1`;
    const profileRes = await pool.query(profileQuery, [uid]);

    if (profileRes.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers });
    }

    const profile = profileRes.rows[0];

    // Get post count
    const postsQuery = `SELECT COUNT(*) FROM travel_posts WHERE user_id = $1`;
    const postsRes = await pool.query(postsQuery, [uid]);
    const postCount = parseInt(postsRes.rows[0].count);

    // Get follower counts
    const followersQuery = `SELECT COUNT(*) FROM travel_followers WHERE following_id = $1`;
    const followingQuery = `SELECT COUNT(*) FROM travel_followers WHERE follower_id = $1`;
    const followersCountRes = await pool.query(followersQuery, [uid]);
    const followingCountRes = await pool.query(followingQuery, [uid]);

    // Check if viewer is following this user
    let isFollowing = false;
    if (viewerUid !== uid) {
      const isFollowingQuery = `SELECT 1 FROM travel_followers WHERE follower_id = $1 AND following_id = $2`;
      const isFollowingRes = await pool.query(isFollowingQuery, [viewerUid, uid]);
      isFollowing = isFollowingRes.rows.length > 0;
    }

    return NextResponse.json({ 
      profile: {
        uid: profile.uid,
        displayName: profile.display_name,
        photoURL: profile.photo_url,
        bio: profile.bio
      },
      stats: {
        posts: postCount,
        followers: parseInt(followersCountRes.rows[0].count),
        following: parseInt(followingCountRes.rows[0].count)
      },
      isFollowing
    }, { headers });
  } catch (error: any) {
    console.error('Error fetching public profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
}
