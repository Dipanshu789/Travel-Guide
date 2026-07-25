const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const amqp = require('amqplib');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict to your frontend domain
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 4000;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://user:password@localhost:5672';
const EXCHANGE_NAME = 'chat_exchange';

let channel = null;

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    
    // Use a direct exchange to route messages to specific user queues
    await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
    
    console.log('Connected to RabbitMQ successfully');
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    // Retry connection after 5 seconds
    setTimeout(connectRabbitMQ, 5000);
  }
}

connectRabbitMQ();

// Map to keep track of connected users and their consumer tags
const activeConsumers = new Map();

io.on('connection', async (socket) => {
  console.log(`New client connected: ${socket.id}`);
  
  // 1. Authenticate / Register User Connection
  socket.on('register', async (userId) => {
    if (!userId) return;
    
    console.log(`User ${userId} registered on socket ${socket.id}`);
    socket.userId = userId;

    if (!channel) {
        console.error('RabbitMQ channel not ready');
        return;
    }

    try {
        // Create a unique queue for this user
        // Using exclusive: true means the queue is deleted when connection closes,
        // but for a robust chat app we might want durable queues.
        // For this real-time first step, an exclusive queue tied to the active service is okay,
        // or we can make a durable queue so messages wait if they are offline.
        // Let's use a durable queue so messages aren't lost if they briefly disconnect.
        const q = await channel.assertQueue(`user_${userId}_queue`, { durable: true });
        
        // Bind the queue to the exchange with their userId as the routing key
        await channel.bindQueue(q.queue, EXCHANGE_NAME, userId);

        // Consume messages intended for this user
        const { consumerTag } = await channel.consume(q.queue, (msg) => {
          if (msg !== null) {
            const messageData = JSON.parse(msg.content.toString());
            console.log(`Routing message to ${userId}:`, messageData);
            
            // Emit to the specific connected socket
            socket.emit('receive_message', messageData);
            
            // Acknowledge the message was processed
            channel.ack(msg);
          }
        });

        // Store the consumer tag to cancel it on disconnect
        activeConsumers.set(socket.id, consumerTag);

    } catch (error) {
        console.error(`Error setting up queue for user ${userId}:`, error);
    }
  });

  // 2. Handle sending messages
  socket.on('send_message', async (data) => {
    // data expected: { to: 'recipientId', content: 'hello', type: 'text' | 'shared_post' }
    if (!channel) return;

    const senderId = socket.userId;
    const recipientId = data.to;
    
    if (!senderId || !recipientId) {
        console.error('Missing sender or recipient ID');
        return;
    }

    const messagePayload = {
      id: Date.now().toString(),
      from: senderId,
      to: recipientId,
      content: data.content,
      type: data.type || 'text',
      timestamp: new Date().toISOString(),
      ...(data.postData ? { postData: data.postData } : {})
    };

    try {
      // Publish to the exchange with the recipient's userId as routing key
      channel.publish(
        EXCHANGE_NAME, 
        recipientId, 
        Buffer.from(JSON.stringify(messagePayload)),
        { persistent: true }
      );
      
      console.log(`Message published from ${senderId} to ${recipientId}`);
      
      // Optionally acknowledge to sender that message was sent
      socket.emit('message_sent', messagePayload);
      
      // Also send the message back to the sender so they see it in their own UI immediately
      socket.emit('receive_message', messagePayload);

    } catch (error) {
      console.error('Error publishing message:', error);
    }
  });

  // 3. Handle Disconnect
  socket.on('disconnect', async () => {
    console.log(`Client disconnected: ${socket.id} (User: ${socket.userId})`);
    
    const consumerTag = activeConsumers.get(socket.id);
    if (consumerTag && channel) {
        try {
            await channel.cancel(consumerTag);
            activeConsumers.delete(socket.id);
        } catch (error) {
            console.error('Error cancelling consumer:', error);
        }
    }
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', rabbitmq: channel ? 'connected' : 'disconnected' });
});

server.listen(PORT, () => {
  console.log(`Chat Service listening on port ${PORT}`);
});
