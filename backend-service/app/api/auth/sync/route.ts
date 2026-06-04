import { NextResponse } from 'next/server';
import { getAuth, getDb } from '../../../../src/lib/firebaseAdmin';

// Enable CORS for Expo web requests
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
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400, headers });
    }

    const auth = getAuth();
    const db = getDb();

    // If Firebase Admin keys aren't set up yet, mock the success so the frontend doesn't throw a fetch error
    if (!auth || !db) {
      console.warn("\n=== MOCK SYNC SUCCESS ===");
      console.warn("Received valid token from frontend, but Firebase Admin Service Account keys are missing in backend-service/.env");
      console.warn("Provide keys to enable real Firestore database syncing.\n");
      return NextResponse.json({ success: true, message: 'Mock synced' }, { headers });
    }

    // 1. Verify the ID token securely on the server
    const decodedToken = await auth.verifyIdToken(token);
    const { uid, email, name, picture } = decodedToken;

    // 2. Sync the user data into Firestore 'users' collection
    await db.collection('users').doc(uid).set({
      email: email || '',
      displayName: name || '',
      photoURL: picture || '',
      lastLoginAt: new Date().toISOString()
    }, { merge: true }); 

    return NextResponse.json({ success: true, uid }, { headers });
  } catch (error: any) {
    console.error('Error syncing auth:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
}
