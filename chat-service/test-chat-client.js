const { io } = require('socket.io-client');

// Connect User A
const socketA = io('http://localhost:4000');
// Connect User B
const socketB = io('http://localhost:4000');

socketA.on('connect', () => {
    console.log('User A connected');
    socketA.emit('register', 'userA_123');
});

socketB.on('connect', () => {
    console.log('User B connected');
    socketB.emit('register', 'userB_456');

    // After 2 seconds, User A sends a message to User B
    setTimeout(() => {
        console.log('User A sending message to User B...');
        socketA.emit('send_message', {
            to: 'userB_456',
            content: 'Hello User B, this is a test message over RabbitMQ!',
            type: 'text'
        });
    }, 2000);
});

socketA.on('receive_message', (msg) => {
    console.log('\n[User A received message]', msg);
});

socketB.on('receive_message', (msg) => {
    console.log('\n[User B received message]', msg);
    
    console.log('\nTest successful. Exiting...');
    process.exit(0);
});

setTimeout(() => {
    console.log('Test timed out');
    process.exit(1);
}, 10000);
