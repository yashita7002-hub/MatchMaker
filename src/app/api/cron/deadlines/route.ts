import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import KanbanTask from '@/models/KanbanTask';
import Project from '@/models/Project';
import Notification from '@/models/Notification';
import { createNotification } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    if (secret) {
      const auth = req.headers.get('Authorization');
      if (auth !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    await connectDB();

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const tasks = await KanbanTask.find({
      status: { $ne: 'done' },
      dueDate: { $ne: '' },
      assignedUserId: { $exists: true, $ne: null },
      deadlineNotified: false,
    });

    const created: string[] = [];

    for (const task of tasks) {
      if (!task.dueDate || !task.assignedUserId) continue;

      const due = new Date(task.dueDate);
      if (isNaN(due.getTime())) continue;
      if (due < now || due > in24h) continue;

      const link = `/workspace/${task.projectId}?task=${task._id}`;
      const existing = await Notification.findOne({
        userId: task.assignedUserId,
        type: 'deadline',
        link,
      });
      if (existing) continue;

      const project = await Project.findById(task.projectId).select('title');
      const projectTitle = project?.title || 'your project';

      await createNotification(
        task.assignedUserId.toString(),
        'deadline',
        `Task "${task.title}" in ${projectTitle} is due within 24 hours`,
        link
      );
      
      task.deadlineNotified = true;
      await task.save();

      created.push(task._id.toString());
    }

    return NextResponse.json({ success: true, notificationsCreated: created.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
