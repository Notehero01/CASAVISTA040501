require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const { initDatabase, initAdmin, usePostgres } = require('./utils/db');

// Routes
const authRoutes = require('./routes/auth');
const annunciRoutes = require('./routes/annunci');
const chatRoutes = require('./routes/chat');
const amministrazioniRoutes = require('./routes/amministrazioni');
const uploadRoutes = require('./routes/upload');

const productionOrigins = (process.env.CLIENT_ORIGIN || 'https://casavista.it,https://www.casavista.it')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const uploadPath = process.env.UPLOAD_PATH
  ? path.resolve(process.env.UPLOAD_PATH)
  : path.join(__dirname, '../uploads');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? productionOrigins
      : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? productionOrigins
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // 100 richieste per IP
  message: 'Troppe richieste, riprova più tardi.'
});
app.use(limiter);

// Stricter rate limit for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Tropppi tentativi di login, riprova più tardi.'
});
app.use('/api/auth/login', authLimiter);

// Body parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(uploadPath));

const startupPromise = initDatabase()
  .then(() => initAdmin())
  .then(() => {
    console.log(`Database pronto: ${usePostgres ? 'PostgreSQL' : 'JSON files'}`);
  });

app.use(async (req, res, next) => {
  try {
    await startupPromise;
    next();
  } catch (error) {
    console.error('Database startup error:', error);
    res.status(500).json({ message: 'Database non disponibile.' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/annunci', annunciRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/amministrazioni', amministrazioniRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Serve il frontend React quando backend e frontend sono nello stesso container.
if (process.env.NODE_ENV === 'production') {
  const publicDir = path.join(__dirname, '../public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(publicDir, 'index.html'));
    });
  }
}

// Socket.io per chat real-time
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('Client connesso:', socket.id);

  // Registra utente
  socket.on('register', (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`Utente ${userId} registrato`);
  });

  // Unisciti a una conversazione
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  // Nuovo messaggio
  socket.on('send_message', (data) => {
    const { conversationId, message, receiverId } = data;
    
    // Invia a tutti nella stanza
    io.to(conversationId).emit('new_message', message);
    
    // Notifica il receiver se online
    const receiverSocketId = connectedUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('notification', {
        type: 'new_message',
        conversationId,
        message
      });
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    socket.to(data.conversationId).emit('user_typing', {
      userId: data.userId,
      conversationId: data.conversationId
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
    console.log('Client disconnesso:', socket.id);
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File troppo grande. Max 5MB.' });
    }
    return res.status(400).json({ message: 'Errore upload.' });
  }
  
  res.status(500).json({ 
    message: process.env.NODE_ENV === 'production' 
      ? 'Errore del server.' 
      : err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint non trovato.' });
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🏠 CasaVista Backend                                     ║
║                                                            ║
║   Port: ${PORT}                                              ║
║   Env:  ${process.env.NODE_ENV || 'development'}                      ║
║                                                            ║
║   Admin: ${process.env.ADMIN_EMAIL}              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = { io };
