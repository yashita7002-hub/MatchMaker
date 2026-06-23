const { createServer } = require('http');
const express = require('express');
const next = require('next');
const { Server } = require('socket.io');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
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
    console.log(`Cloudinary configured: cloud_name=${process.env.CLOUDINARY_CLOUD_NAME}, api_key=${process.env.CLOUDINARY_API_KEY?.slice(0, 4)}...`);
  } else {
    console.warn('Cloudinary NOT configured. Missing env vars:', {
      CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
    });
  }

  // Multer Memory Storage - keeps file in RAM, not on disk (works on Railway's ephemeral FS)
  const storage = multer.memoryStorage();
  const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

  // Endpoint for file uploads
  server.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
      }

      // In production, Cloudinary is required (Railway has ephemeral filesystem)
      if (hasCloudinary) {
        try {
          // Upload directly from buffer - no temp file needed
          const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: 'project-matchmaker-chat',
                resource_type: 'image',
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            uploadStream.end(req.file.buffer);
          });

          return res.json({ success: true, imageUrl: uploadResult.secure_url });
        } catch (cloudinaryErr) {
          console.error('Cloudinary Upload Error:', cloudinaryErr);
          if (process.env.NODE_ENV === 'production') {
            return res.status(500).json({ error: 'Image upload failed. Cloudinary is required in production.' });
          }
        }
      }

      // Local dev fallback: return the file as a base64 data URL
      const base64 = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
      return res.json({ success: true, imageUrl: dataUrl });
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
