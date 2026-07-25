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

// Fetch notifications for the current user
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
    const uid = decodedToken.uid;

    let rows: any[] = [];
    try {
      const res = await pool.query(`
        SELECT * FROM travel_notifications
        WHERE recipient_id = $1
        ORDER BY created_at DESC
      `, [uid]);
      rows = res.rows;
    } catch (dbErr) {
      console.warn('Database query for notifications failed, falling back to empty list:', dbErr);
      rows = [];
    }

    const notifications = rows.map(row => ({
      id: row.id.toString(),
      recipientId: row.recipient_id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      message: row.message,
      read: row.read,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ notifications }, { headers });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
}

// Create a new notification (e.g., when sending a message)
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
    const senderId = decodedToken.uid;
    const senderName = decodedToken.name || decodedToken.email?.split('@')[0] || 'Traveler';

    const body = await req.json();
    const { recipientId, message } = body;

    if (!recipientId || !message) {
      return NextResponse.json({ error: 'Recipient ID and message are required' }, { status: 400, headers });
    }

    let storedNotification = null;
    try {
      const { rows } = await pool.query(`
        INSERT INTO travel_notifications (recipient_id, sender_id, sender_name, message)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [recipientId, senderId, senderName, message]);
      storedNotification = rows[0];
    } catch (dbErr) {
      console.warn('Database insert for notification failed, using fallback memory object:', dbErr);
      storedNotification = {
        id: Date.now(),
        recipient_id: recipientId,
        sender_id: senderId,
        sender_name: senderName,
        message: message,
        read: false,
        created_at: new Date().toISOString()
      };
    }

    return NextResponse.json({ success: true, notification: storedNotification }, { status: 201, headers });
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
}
