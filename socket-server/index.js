import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
console.log("CLOUD_NAME =", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API_KEY exists =", !!process.env.CLOUDINARY_API_KEY);
console.log("API_SECRET exists =", !!process.env.CLOUDINARY_API_SECRET);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});


let storage;
const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                      process.env.CLOUDINARY_API_KEY && 
                      process.env.CLOUDINARY_API_SECRET;

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'project-matchmaker-chat',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    },
  });
  console.log('Multer initialized with Cloudinary Storage.');
} else {
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });
  console.log('Multer initialized with Local Disk Storage (uploads/).');
}

const upload = multer({ storage });


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.post('/api/upload', (req, res, next) => {
   upload.single('image')(req, res, (err) => {
  if (err) {
    console.error('FULL MULTER ERROR:', err);

    return res.status(500).json({
      error: err.message,
      stack: err.stack,
      details: err
    });
  }

  next();
});
}
  

, (req, res) => {
  console.log('Final handler reached');

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    let imageUrl = '';
    if (hasCloudinary) {
      imageUrl = req.file.path || req.file.secure_url;
    } else {
      imageUrl = `http://localhost:3001/uploads/${req.file.filename}`;
    }

    return res.json({ success: true, imageUrl });
  } catch (error) {
    console.error('File Upload Error:', error);
    return res.status(500).json({ error: error.message || 'File upload failed' });
  }
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

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Real-time Socket Server running on port ${PORT}`);
});
