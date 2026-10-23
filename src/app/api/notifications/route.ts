import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Notification from '@/models/Notification';
import { getSessionUser } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(req: Request) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(50);
      
    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    if (body.conversationId || body.projectId) {
      const conversationId = body.conversationId;
      const projectId = body.projectId;
      if (
        (conversationId && (typeof conversationId !== 'string' || !mongoose.isValidObjectId(conversationId)))
        || (projectId && (typeof projectId !== 'string' || !mongoose.isValidObjectId(projectId)))
        || Boolean(conversationId) === Boolean(projectId)
      ) {
        return NextResponse.json({ error: 'Invalid chat notification target' }, { status: 400 });
      }
      const linkFilter = conversationId
        ? { link: `/messages?conversation=${conversationId}` }
        : { link: { $regex: `^/workspace/${projectId}(?:\\?|$)` } };
      await Notification.updateMany({
        userId: user._id,
        isRead: false,
        type: { $in: ['message', 'reply', 'mention'] },
        ...linkFilter,
      }, { isRead: true });
      return NextResponse.json({ success: true });
    }
    
    // If notificationId is provided, mark that specific one as read
    if (body.notificationId) {
      await Notification.findOneAndUpdate(
        { _id: body.notificationId, userId: user._id },
        { isRead: true }
      );
    } else {
      // Otherwise mark all as read for this user
      await Notification.updateMany({ userId: user._id, isRead: false }, { isRead: true });
    }
      
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Server Error' }, { status: 500 });
  }
}
