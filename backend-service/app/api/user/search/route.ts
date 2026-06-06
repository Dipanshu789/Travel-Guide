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
    
    await auth.verifyIdToken(token);

    const url = new URL(req.url);
    const q = url.searchParams.get('q');
    
    if (!q || q.trim() === '') {
      return NextResponse.json({ users: [] }, { headers });
    }

    const searchQuery = `%${q}%`;
    const { rows } = await pool.query(
      `SELECT uid, display_name, photo_url, bio FROM travel_users WHERE display_name ILIKE $1 LIMIT 50`,
      [searchQuery]
    );

    return NextResponse.json({ users: rows }, { headers });
  } catch (error: any) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
}
