const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const PORT = process.env.PORT || 4000;

// Create HTTP server
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Set to track connected sockets
let socketsConnected = new Set();

// Handle socket connections
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socketsConnected.add(socket.id);
  io.emit('clients-total', socketsConnected.size);

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
    socketsConnected.delete(socket.id);
    io.emit('clients-total', socketsConnected.size);
  });

  // Handle incoming messages
  socket.on('message', (data) => {
    // Validate message data if necessary
    if (data && typeof data === 'object' && data.message) {
      socket.broadcast.emit('chat-message', data);
    } else {
      console.error('Invalid message data:', data);
    }
  });

  // Handle typing feedback 
  socket.on('typing', (data) => {
    if (data && data.username) {
      socket.broadcast.emit('typing', { username: data.username }); // Fixed the event name
    }
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`💬 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});