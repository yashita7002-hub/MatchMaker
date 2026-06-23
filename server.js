const { createServer } = require('http');
const express = require('express');
const next = require('next');
const { Server } = require('socket.io');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables (Next.js automatically loads .env.local, but for server.js we do it explicitly)
dotenv.config({ path: '.env.local' });
dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const PORT = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = express();

  // Cloudinary Config
  const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                        process.env.CLOUDINARY_API_KEY && 
                        process.env.CLOUDINARY_API_SECRET;
  
  if (hasCloudinary) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // Multer Disk Storage (always upload locally first)
  const uploadDir = path.join(__dirname, 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });
  const upload = multer({ storage });

  // Endpoint for file uploads
  server.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
      }

      // Default URL if Cloudinary fails (Next.js serves public folder at root)
      let imageUrl = `/uploads/${req.file.filename}`;

      // Try uploading to Cloudinary
      if (hasCloudinary) {
        try {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'project-matchmaker-chat',
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          });
          imageUrl = result.secure_url;
          
          // Optionally delete the local file after successful Cloudinary upload
          fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting local file:', err);
          });
        } catch (cloudinaryErr) {
          console.error('Cloudinary Upload Error (Falling back to local disk storage):', cloudinaryErr);
          // We don't delete the local file here, so it continues serving locally.
        }
      }

      return res.json({ success: true, imageUrl });
    } catch (error) {
      console.error('File Upload Error:', error);
      return res.status(500).json({ error: error.message || 'File upload failed' });
    }
  });

  // Handle all other requests with Next.js
  server.use((req, res) => {
    return handle(req, res);
  });

  const httpServer = createServer(server);

  // Initialize Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket Client Connected: ${socket.id}`);

    socket.on('join-room', ({ projectId }) => {
      socket.join(`room_${projectId}`);
      console.log(`Socket ${socket.id} joined room_${projectId}`);
    });

    socket.on('send-message', ({ projectId, message }) => {
      socket.to(`room_${projectId}`).emit('receive-message', message);
    });

    socket.on('typing-indicator', ({ projectId, userName, isTyping }) => {
      socket.to(`room_${projectId}`).emit('typing-update', { userName, isTyping });
    });

    socket.on('kanban-drag', ({ projectId, taskId, newStatus }) => {
      socket.to(`room_${projectId}`).emit('kanban-update', { taskId, newStatus });
    });

    socket.on('expense-update', ({ projectId }) => {
      socket.to(`room_${projectId}`).emit('expense-refresh');
    });

    socket.on('disconnect', () => {
      console.log(`Socket Client Disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
