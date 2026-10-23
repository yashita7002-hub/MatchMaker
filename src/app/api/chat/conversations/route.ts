import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Conversation from '@/models/Conversation';
import Message, { IMessage } from '@/models/Message';
import User from '@/models/User';
import Project from '@/models/Project';
import { getSessionUser } from '@/lib/auth';
import { protectChatMessage } from '@/lib/chat-message-response';

export async function GET(req: Request) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const query = url.searchParams.get('q')?.trim();
    if (query) {
      if (query.length < 2) return NextResponse.json({ users: [] });
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const users = await User.find({
        _id: { $ne: user._id },
        $or: [
          { name: { $regex: escaped, $options: 'i' } },
          { githubUsername: { $regex: escaped, $options: 'i' } },
        ],
      }).select('_id name githubUsername avatarUrl').limit(10);
      return NextResponse.json({ users });
    }

    const conversations = await Conversation.find({ participants: user._id })
      .populate('participants', 'name githubUsername avatarUrl')
      .populate<{ lastMessage: IMessage | null }>('lastMessage')
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .limit(100)
      .lean();

    const directRows = await Promise.all(conversations.map(async conversation => ({
      ...conversation,
      type: 'direct' as const,
      lastMessage: conversation.lastMessage ? protectChatMessage(conversation.lastMessage) : null,
      unreadCount: await Message.countDocuments({
        conversationId: conversation._id,
        userId: { $ne: user._id },
        readBy: { $ne: user._id },
        isDeleted: false,
      }),
    })));
    const projects = await Project.find({ members: user._id })
      .populate('members', 'name githubUsername avatarUrl')
      .select('_id title members')
      .lean();
    const groupRows = await Promise.all(projects.map(async project => {
      const [lastMessage, unreadCount] = await Promise.all([
        Message.findOne({ projectId: project._id }).sort({ createdAt: -1 }).lean(),
        Message.countDocuments({
          projectId: project._id,
          userId: { $ne: user._id },
          readBy: { $ne: user._id },
          isDeleted: false,
        }),
      ]);
      return {
        _id: project._id.toString(),
        projectId: project._id.toString(),
        type: 'group' as const,
        title: project.title,
        participants: project.members,
        lastMessage: lastMessage ? protectChatMessage(lastMessage) : null,
        lastMessageAt: lastMessage?.createdAt,
        unreadCount,
      };
    }));
    const rows = [...directRows, ...groupRows].sort((left, right) =>
      new Date(right.lastMessageAt || 0).getTime() - new Date(left.lastMessageAt || 0).getTime(),
    );
    return NextResponse.json({ conversations: rows });
  } catch (error) {
    console.error('Chat conversation list failed:', error);
    return NextResponse.json({ error: 'Unable to load conversations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const otherUserId = typeof body.userId === 'string' ? body.userId : '';
    if (!/^[a-f\d]{24}$/i.test(otherUserId) || otherUserId === user._id.toString()) {
      return NextResponse.json({ error: 'Choose another valid user' }, { status: 400 });
    }
    const otherUser = await User.findById(otherUserId).select('_id');
    if (!otherUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const ids = [user._id.toString(), otherUser._id.toString()].sort();
    const directKey = ids.join(':');
    let conversation;
    try {
      conversation = await Conversation.findOneAndUpdate(
        { directKey },
        { $setOnInsert: { type: 'direct', participants: ids, directKey } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      ).populate('participants', 'name githubUsername avatarUrl');
    } catch (error) {
      if (!(typeof error === 'object' && error !== null && 'code' in error && error.code === 11000)) throw error;
      conversation = await Conversation.findOne({ directKey }).populate('participants', 'name githubUsername avatarUrl');
      if (!conversation) throw error;
    }

    return NextResponse.json({ conversation }, { status: 200 });
  } catch (error) {
    console.error('Direct conversation creation failed:', error);
    return NextResponse.json({ error: 'Unable to start conversation' }, { status: 500 });
  }
}
