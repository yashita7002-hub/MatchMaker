const { createServer } = require('http');
const express = require('express');
const next = require('next');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables (Next.js automatically loads .env.local, but for server.js we do it explicitly)
dotenv.config({ path: '.env.local' });
dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const PORT = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = express();
  server.set('trust proxy', 1);

  // Handle all other requests with Next.js
  server.use((req, res) => {
    return handle(req, res);
  });

  const httpServer = createServer(server);

  // Initialize Socket.io
  const io = new Server(httpServer, {
    allowRequest: (request, callback) => {
      const origin = request.headers.origin;
      if (!origin) return callback(null, true);
      try {
        const originHost = new URL(origin).host;
        callback(null, originHost === request.headers.host || origin === process.env.APP_ORIGIN);
      } catch {
        callback(null, false);
      }
    },
  });

  let socketDbPromise = null;
  mongoose.connection.on('disconnected', () => {
    socketDbPromise = null;
  });
  const ensureSocketDb = async () => {
    if (mongoose.connection.readyState === 1) return;
    if (mongoose.connection.readyState === 2) {
      await mongoose.connection.asPromise();
      return;
    }
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');
    if (!socketDbPromise) {
      socketDbPromise = mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false })
        .catch((error) => {
          socketDbPromise = null;
          throw error;
        });
    }
    await socketDbPromise;
  };
  const getSocketUserId = (socket) => {
    const cookie = socket.handshake.headers.cookie || '';
    const sessionCookie = cookie.split(';').map(part => part.trim()).find(part => part.startsWith('session_user_id='));
    const id = sessionCookie ? decodeURIComponent(sessionCookie.slice('session_user_id='.length)) : '';
    return mongoose.isValidObjectId(id) ? id : null;
  };
  const asObjectId = (value) => mongoose.isValidObjectId(value) ? new mongoose.Types.ObjectId(value) : null;
  const canJoinProject = async (projectId, userId) => {
    await ensureSocketDb();
    const projectObjectId = asObjectId(projectId);
    if (!projectObjectId) return false;
    return Boolean(await mongoose.connection.db.collection('projects').findOne({
      _id: projectObjectId,
      members: asObjectId(userId),
    }, { projection: { _id: 1 } }));
  };
  const canJoinConversation = async (conversationId, userId) => {
    await ensureSocketDb();
    const conversationObjectId = asObjectId(conversationId);
    if (!conversationObjectId) return false;
    return Boolean(await mongoose.connection.db.collection('conversations').findOne({
      _id: conversationObjectId,
      participants: asObjectId(userId),
    }, { projection: { _id: 1, participants: 1 } }));
  };
  const publicChatMessage = (message) => {
    const messageId = message._id.toString();
    return {
      ...message,
      imageUrl: message.imageUrl
        ? `/api/chat/attachments/download?messageId=${messageId}&legacy=1&inline=1`
        : '',
      attachments: (message.attachments || []).map((attachment, index) => ({
        ...attachment,
        url: `/api/chat/attachments/download?messageId=${messageId}&index=${index}&inline=1`,
      })),
    };
  };
  const getAuthorizedRoomRecipients = async (room, excludeSocketId, authorize) => {
    const recipients = await io.in(room).fetchSockets();
    const authorized = [];
    for (const recipient of recipients) {
      if (recipient.id !== excludeSocketId && await authorize(recipient.data.userId)) authorized.push(recipient);
    }
    return authorized;
  };
  const emitToAuthorizedRoom = async (room, excludeSocketId, event, payload, authorize) => {
    const recipients = await getAuthorizedRoomRecipients(room, excludeSocketId, authorize);
    recipients.forEach(recipient => recipient.emit(event, payload));
    return recipients.map(recipient => recipient.data.userId);
  };
  const emitToProject = (projectId, excludeSocketId, event, payload) =>
    emitToAuthorizedRoom(
      `room_${projectId}`,
      excludeSocketId,
      event,
      payload,
      recipientId => canJoinProject(projectId, recipientId),
    );
  const emitToConversation = (conversationId, excludeSocketId, event, payload) =>
    emitToAuthorizedRoom(
      `conversation_${conversationId}`,
      excludeSocketId,
      event,
      payload,
      recipientId => canJoinConversation(conversationId, recipientId),
    );
  const onlineSockets = new Map();
  io.use(async (socket, next) => {
    try {
      const userId = getSocketUserId(socket);
      if (!userId) return next(new Error('Authentication required'));
      await ensureSocketDb();
      const exists = await mongoose.connection.db.collection('users').findOne(
        { _id: asObjectId(userId) },
        { projection: { _id: 1 } },
      );
      if (!exists) return next(new Error('Authentication required'));
      socket.data.userId = userId;
      next();
    } catch (error) {
      console.error('Socket authentication failed:', error);
      next(new Error('Authentication unavailable'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket Client Connected: ${socket.id}`);
    const userId = socket.data.userId;
    if (!onlineSockets.has(userId)) onlineSockets.set(userId, new Set());
    onlineSockets.get(userId).add(socket.id);

    socket.on('register-global', () => {
      socket.join(`global_${userId}`);
    });

    socket.on('notify-users', async (payload = {}) => {
      try {
        const { userIds, notification } = payload && typeof payload === 'object' ? payload : {};
        if (!Array.isArray(userIds) || !notification?._id) return;
        await ensureSocketDb();
        for (const recipientId of userIds) {
          const recipientObjectId = asObjectId(recipientId);
          const notificationObjectId = asObjectId(notification._id);
          if (!recipientObjectId || !notificationObjectId) continue;
          const persisted = await mongoose.connection.db.collection('notifications').findOne({
            _id: notificationObjectId,
            userId: recipientObjectId,
          });
          if (persisted) {
            io.to(`global_${recipientId}`).emit('new-notification', {
              ...persisted,
              _id: persisted._id.toString(),
              userId: persisted.userId.toString(),
              createdAt: persisted.createdAt?.toISOString?.() || persisted.createdAt,
            });
          }
        }
      } catch (error) {
        console.error('Socket notification delivery failed:', error);
      }
    });

    socket.on('join-room', async (payload = {}) => {
      try {
        const { projectId } = payload && typeof payload === 'object' ? payload : {};
        if (await canJoinProject(projectId, userId)) {
          socket.join(`room_${projectId}`);
          console.log(`Socket ${socket.id} joined authorized project room`);
          await ensureSocketDb();
          const project = await mongoose.connection.db.collection('projects').findOne(
            { _id: asObjectId(projectId) },
            { projection: { members: 1 } },
          );
          const memberIds = (project?.members || []).map(id => id.toString());
          socket.emit('project-presence', {
            projectId,
            onlineUserIds: memberIds.filter(id => onlineSockets.has(id) && onlineSockets.get(id).size > 0),
          });
          await emitToProject(projectId, socket.id, 'user-online', { userId, projectId });
        }
      } catch (error) {
        console.error('Project room authorization failed:', error);
      }
    });

    socket.on('join-conversation', async (payload = {}) => {
      try {
        const { conversationId } = payload && typeof payload === 'object' ? payload : {};
        if (!(await canJoinConversation(conversationId, userId))) return;
        socket.join(`conversation_${conversationId}`);
        const conversation = await mongoose.connection.db.collection('conversations').findOne(
          { _id: asObjectId(conversationId) },
          { projection: { participants: 1 } },
        );
        const participants = (conversation?.participants || []).map(id => id.toString());
        socket.emit('conversation-presence', {
          conversationId,
          onlineUserIds: participants.filter(id => onlineSockets.has(id) && onlineSockets.get(id).size > 0),
        });
        await emitToConversation(conversationId, socket.id, 'user-online', { userId, conversationId });
      } catch (error) {
        console.error('Conversation room authorization failed:', error);
      }
    });

    socket.on('send-message', async (payload = {}) => {
      try {
        const { projectId, message, messageId } = payload && typeof payload === 'object' ? payload : {};
        const id = messageId || message?._id;
        if (!(await canJoinProject(projectId, userId))) return;
        await ensureSocketDb();
        const messages = mongoose.connection.db.collection('messages');
        const persisted = await messages.findOne({
          _id: asObjectId(id),
          projectId: asObjectId(projectId),
          userId: asObjectId(userId),
        });
        if (!persisted) return;
        const recipients = await getAuthorizedRoomRecipients(
          `room_${projectId}`,
          socket.id,
          recipientId => canJoinProject(projectId, recipientId),
        );
        const recipientIds = [...new Set(recipients.map(recipient => recipient.data.userId))];
        if (recipientIds.length > 0) {
          await messages.updateOne(
            { _id: persisted._id },
            { $addToSet: { deliveredTo: { $each: recipientIds.map(asObjectId) } } },
          );
        }
        const deliveredMessage = await messages.findOne({ _id: persisted._id });
        const safeMessage = publicChatMessage(deliveredMessage || persisted);
        recipients.forEach(recipient => recipient.emit('receive-message', safeMessage));
        socket.emit('project-message-updated', safeMessage);
      } catch (error) {
        console.error('Project message broadcast failed:', error);
      }
    });

    socket.on('project-message-updated', async (payload = {}) => {
      try {
        const { projectId, messageId } = payload && typeof payload === 'object' ? payload : {};
        if (!(await canJoinProject(projectId, userId))) return;
        await ensureSocketDb();
        const persisted = await mongoose.connection.db.collection('messages').findOne({
          _id: asObjectId(messageId),
          projectId: asObjectId(projectId),
        });
        if (persisted) await emitToProject(projectId, socket.id, 'project-message-updated', publicChatMessage(persisted));
      } catch (error) {
        console.error('Project message update broadcast failed:', error);
      }
    });

    socket.on('send-direct-message', async (payload = {}) => {
      try {
        const { conversationId, messageId } = payload && typeof payload === 'object' ? payload : {};
        if (!(await canJoinConversation(conversationId, userId))) return;
        await ensureSocketDb();
        const messages = mongoose.connection.db.collection('messages');
        const persisted = await messages.findOne({
          _id: asObjectId(messageId),
          conversationId: asObjectId(conversationId),
          userId: asObjectId(userId),
        });
        if (!persisted) return;
        const conversation = await mongoose.connection.db.collection('conversations').findOne(
          { _id: asObjectId(conversationId) },
          { projection: { participants: 1 } },
        );
        const recipientIds = (conversation?.participants || [])
          .map(id => id.toString())
          .filter(id => id !== userId && io.sockets.adapter.rooms.get(`global_${id}`)?.size);
        if (recipientIds.length > 0) {
          await messages.updateOne(
            { _id: persisted._id },
            { $addToSet: { deliveredTo: { $each: recipientIds.map(asObjectId) } } },
          );
        }
        const deliveredMessage = await messages.findOne({ _id: persisted._id });
        const safeMessage = publicChatMessage(deliveredMessage || persisted);
        recipientIds.forEach(id => io.to(`global_${id}`).emit('receive-direct-message', safeMessage));
        socket.emit('direct-message-updated', safeMessage);
      } catch (error) {
        console.error('Direct message broadcast failed:', error);
      }
    });

    socket.on('direct-message-updated', async (payload = {}) => {
      try {
        const { conversationId, messageId } = payload && typeof payload === 'object' ? payload : {};
        if (!(await canJoinConversation(conversationId, userId))) return;
        await ensureSocketDb();
        const persisted = await mongoose.connection.db.collection('messages').findOne({
          _id: asObjectId(messageId),
          conversationId: asObjectId(conversationId),
        });
        if (persisted) await emitToConversation(conversationId, socket.id, 'direct-message-updated', publicChatMessage(persisted));
      } catch (error) {
        console.error('Direct message update broadcast failed:', error);
      }
    });

    socket.on('direct-read', async (payload = {}) => {
      try {
        const { conversationId, messageIds } = payload && typeof payload === 'object' ? payload : {};
        if (!(await canJoinConversation(conversationId, userId)) || !Array.isArray(messageIds)) return;
        await ensureSocketDb();
        const validIds = messageIds.map(asObjectId).filter(Boolean);
        if (validIds.length === 0) return;
        const messages = await mongoose.connection.db.collection('messages').find({
          _id: { $in: validIds },
          conversationId: asObjectId(conversationId),
          readBy: asObjectId(userId),
        }).toArray();
        messages.forEach(message => {
          emitToConversation(conversationId, socket.id, 'direct-message-updated', publicChatMessage(message))
            .catch(error => console.error('Direct receipt delivery failed:', error));
        });
      } catch (error) {
        console.error('Direct read receipt broadcast failed:', error);
      }
    });

    socket.on('project-message-read', async (payload = {}) => {
      try {
        const { projectId, messageId } = payload && typeof payload === 'object' ? payload : {};
        if (!(await canJoinProject(projectId, userId))) return;
        await ensureSocketDb();
        const persisted = await mongoose.connection.db.collection('messages').findOne({
          _id: asObjectId(messageId),
          projectId: asObjectId(projectId),
          readBy: asObjectId(userId),
        });
        if (persisted) await emitToProject(projectId, socket.id, 'project-message-updated', publicChatMessage(persisted));
      } catch (error) {
        console.error('Project read receipt broadcast failed:', error);
      }
    });

    socket.on('direct-typing', async (payload = {}) => {
      try {
        const { conversationId, isTyping } = payload && typeof payload === 'object' ? payload : {};
        if (!(await canJoinConversation(conversationId, userId))) return;
        await ensureSocketDb();
        const sender = await mongoose.connection.db.collection('users').findOne(
          { _id: asObjectId(userId) },
          { projection: { name: 1 } },
        );
        await emitToConversation(conversationId, socket.id, 'direct-typing', {
          conversationId,
          userId,
          userName: sender?.name || 'A teammate',
          isTyping: Boolean(isTyping),
        });
      } catch (error) {
        console.error('Direct typing broadcast failed:', error);
      }
    });

    socket.on('typing-indicator', async (payload = {}) => {
      try {
        const { projectId, isTyping } = payload && typeof payload === 'object' ? payload : {};
        if (!(await canJoinProject(projectId, userId))) return;
        await ensureSocketDb();
        const sender = await mongoose.connection.db.collection('users').findOne(
          { _id: asObjectId(userId) },
          { projection: { name: 1 } },
        );
        await emitToProject(projectId, socket.id, 'typing-update', {
          projectId,
          userName: sender?.name || 'A teammate',
          isTyping: Boolean(isTyping),
        });
      } catch (error) {
        console.error('Typing broadcast failed:', error);
      }
    });

    socket.on('kanban-drag', async (payload = {}) => {
      try {
        const { projectId, taskId } = payload && typeof payload === 'object' ? payload : {};
        if (!(await canJoinProject(projectId, userId))) return;
        await ensureSocketDb();
        const task = await mongoose.connection.db.collection('kanbantasks').findOne({
          _id: asObjectId(taskId),
          projectId: asObjectId(projectId),
        }, { projection: { status: 1 } });
        if (task) await emitToProject(projectId, socket.id, 'kanban-update', { taskId, newStatus: task.status });
      } catch (error) {
        console.error('Kanban update broadcast failed:', error);
      }
    });

    socket.on('expense-update', async (payload = {}) => {
      try {
        const { projectId } = payload && typeof payload === 'object' ? payload : {};
        if (await canJoinProject(projectId, userId)) await emitToProject(projectId, socket.id, 'expense-refresh', {});
      } catch (error) {
        console.error('Expense update broadcast failed:', error);
      }
    });

    socket.on('disconnect', async () => {
      const sockets = onlineSockets.get(userId);
      sockets?.delete(socket.id);
      if (sockets?.size === 0) {
        onlineSockets.delete(userId);
        socket.rooms.forEach(room => {
          if (room.startsWith('conversation_')) {
            const conversationId = room.slice('conversation_'.length);
            emitToConversation(conversationId, socket.id, 'user-offline', { userId, conversationId })
              .catch(error => console.error('Direct presence delivery failed:', error));
          } else if (room.startsWith('room_')) {
            const projectId = room.slice('room_'.length);
            emitToProject(projectId, socket.id, 'user-offline', { userId, projectId })
              .catch(error => console.error('Project presence delivery failed:', error));
          }
        });
      }
      console.log(`Socket Client Disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);

    const runDeadlineCheck = () => {
      const headers = process.env.CRON_SECRET
        ? { Authorization: `Bearer ${process.env.CRON_SECRET}` }
        : {};
      fetch(`http://localhost:${PORT}/api/cron/deadlines`, { method: 'POST', headers })
        .catch(err => console.error('Deadline cron error:', err.message));
    };

    setTimeout(runDeadlineCheck, 30000);
    setInterval(runDeadlineCheck, 60 * 60 * 1000);
  });
});
