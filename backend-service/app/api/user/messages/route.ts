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

// Fetch recent chats or messages for a specific conversation
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

    const url = new URL(req.url);
    const chatWith = url.searchParams.get('chatWith');

    if (chatWith) {
      // Fetch messages for a specific conversation
      let rows: any[] = [];
      let recipientAvatar = null;
      try {
        let queryStr = `
          SELECT * FROM travel_messages
          WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1)
          ORDER BY created_at ASC
        `;
        let queryParams = [uid, chatWith];

        if (chatWith.startsWith('group_')) {
          queryStr = `
            SELECT * FROM travel_messages
            WHERE recipient_id = $1
            ORDER BY created_at ASC
          `;
          queryParams = [chatWith];
        }

        const res = await pool.query(queryStr, queryParams);
        rows = res.rows;

        if (chatWith.startsWith('group_')) {
          const parts = chatWith.split('|');
          if (parts.length > 1 && parts[1]) {
            recipientAvatar = decodeURIComponent(parts[1]);
          }
        } else {
          const userRes = await pool.query(`SELECT photo_url FROM travel_users WHERE uid = $1`, [chatWith]);
          if (userRes.rows.length > 0) {
            recipientAvatar = userRes.rows[0].photo_url;
          }
        }
      } catch (dbErr) {
        console.warn('Database query for messages failed, falling back to empty messages:', dbErr);
        rows = [];
      }

      const messages = rows.map(row => ({
        id: row.id.toString(),
        senderId: row.sender_id,
        senderName: row.sender_name,
        recipientId: row.recipient_id,
        recipientName: row.recipient_name,
        text: row.message,
        time: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: row.sender_id === uid ? 'me' : 'them'
      }));

      return NextResponse.json({ messages, recipientAvatar }, { headers });
    } else {
      // Fetch list of recent chats with user avatars
      let rows: any[] = [];
      try {
        const res = await pool.query(`
          SELECT 
            m.other_user_id,
            m.other_user_name,
            m.last_message,
            m.created_at,
            u.photo_url as other_user_avatar
          FROM (
            SELECT 
              CASE WHEN recipient_id LIKE 'group_%' THEN recipient_id WHEN sender_id = $1 THEN recipient_id ELSE sender_id END as other_user_id,
              CASE WHEN recipient_id LIKE 'group_%' THEN recipient_name WHEN sender_id = $1 THEN recipient_name ELSE sender_name END as other_user_name,
              message as last_message,
              created_at
            FROM travel_messages
            WHERE sender_id = $1 OR recipient_id = $1 OR recipient_id LIKE 'group_%'
            ORDER BY created_at DESC
          ) m
          LEFT JOIN travel_users u ON m.other_user_id = u.uid
        `, [uid]);
        rows = res.rows;
      } catch (dbErr) {
        console.warn('Database query for recent chats failed, falling back to default chats:', dbErr);
        rows = [];
      }

      // Group by distinct other_user_id to get latest message per chat
      const seen = new Set();
      const chats: any[] = [];

      const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

      for (const row of rows) {
        if (!seen.has(row.other_user_id)) {
          seen.add(row.other_user_id);
          let avatar = row.other_user_avatar || DEFAULT_AVATAR;
          let id = row.other_user_id;
          if (id.startsWith('group_')) {
            const parts = id.split('|');
            if (parts.length > 1 && parts[1]) {
              avatar = decodeURIComponent(parts[1]);
            }
          }
          chats.push({
            id: row.other_user_id,
            name: row.other_user_name || 'Traveler',
            message: row.last_message,
            time: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unread: 0,
            avatarColor: id.startsWith('group_') ? '#FFD700' : '#6C63FF',
            avatar: avatar
          });
        }
      }

      // Also fetch all other registered users from travel_users so their database profile pictures are visible in the messages page
      try {
        const allUsersRes = await pool.query(`SELECT uid, display_name, photo_url FROM travel_users WHERE uid != $1`, [uid]);
        for (const u of allUsersRes.rows) {
          if (!seen.has(u.uid)) {
            seen.add(u.uid);
            chats.push({
              id: u.uid,
              name: u.display_name || 'Traveler',
              message: 'Tap to start chatting',
              time: '',
              unread: 0,
              avatarColor: '#4ECDC4',
              avatar: u.photo_url || DEFAULT_AVATAR
            });
          }
        }
      } catch (err) {
        console.warn('Failed to fetch all users for messages page:', err);
      }

      return NextResponse.json({ chats }, { headers });
    }
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
}

// Send a new message
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
    const { recipientId, recipientName, message } = body;

    if (!recipientId || !message) {
      return NextResponse.json({ error: 'Recipient ID and message are required' }, { status: 400, headers });
    }

    let storedMessage = null;
    try {
      const { rows } = await pool.query(`
        INSERT INTO travel_messages (sender_id, sender_name, recipient_id, recipient_name, message)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [senderId, senderName, recipientId, recipientName || 'Traveler', message]);
      storedMessage = rows[0];
    } catch (dbErr) {
      console.warn('Database insert for message failed, using fallback memory object:', dbErr);
      storedMessage = {
        id: Date.now(),
        sender_id: senderId,
        sender_name: senderName,
        recipient_id: recipientId,
        recipient_name: recipientName || 'Traveler',
        message: message,
        created_at: new Date().toISOString()
      };
    }

    return NextResponse.json({ success: true, message: storedMessage }, { status: 201, headers });
  } catch (error: any) {
    console.error('Error storing message:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
}
