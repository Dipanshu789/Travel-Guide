import { NextResponse } from 'next/server';
import { getAuth, getDb } from '../../../../src/lib/firebaseAdmin';

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
    const db = getDb();

    if (!auth || !db) {
      // Return 503 so the frontend knows the backend is offline and falls back to local auth data
      return NextResponse.json({ error: 'Backend Firebase keys not configured' }, { status: 503, headers });
    }

    // Verify token
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Fetch user from Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      // Fallback to token data if document doesn't exist yet
      return NextResponse.json({ 
        profile: { 
          displayName: decodedToken.name || '', 
          email: decodedToken.email || '' 
        } 
      }, { headers });
    }

    return NextResponse.json({ profile: userDoc.data() }, { headers });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
}
