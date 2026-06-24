import connectDB from '@/lib/db';
import ProjectAnalytics from '@/models/ProjectAnalytics';
import KanbanTask from '@/models/KanbanTask';
import Expense from '@/models/Expense';
import Discussion from '@/models/Discussion';
import Message from '@/models/Message';
import Project from '@/models/Project';

/**
 * Calculate and update project analytics
 */
export async function updateProjectAnalytics(projectId: string): Promise<void> {
  try {
    await connectDB();

    // Fetch all project data
    const [tasks, expenses, discussions, messages, project] = await Promise.all([
      KanbanTask.find({ projectId }),
      Expense.find({ projectId }),
      Discussion.find({ projectId }),
      Message.find({ projectId }),
      Project.findById(projectId),
    ]);

    if (!project) {
      throw new Error('Project not found');
    }

    // Calculate task statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const todoTasks = tasks.filter(t => t.status === 'todo').length;
    const reviewTasks = tasks.filter(t => t.status === 'review').length;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate project progress (based on task completion)
    const projectProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate contribution statistics by member
    const contributionStats = project.members.map(memberId => {
      const memberTasks = tasks.filter(
        t => t.assignedUserId?.toString() === memberId.toString() && t.status === 'done'
      );
      const memberDiscussions = discussions.filter(d => d.creatorId?.toString() === memberId.toString());
      const memberMessages = messages.filter(m => m.userId?.toString() === memberId.toString());

      return {
        userId: memberId,
        tasksCompleted: memberTasks.length,
        discussionsCreated: memberDiscussions.length,
        messagesCount: memberMessages.length,
        lastActivity: new Date(),
      };
    });

    // Calculate expense trends
    const expenseTrendMap = new Map<string, { totalAmount: number; category: string }>();
    expenses.forEach(exp => {
      const dateKey = new Date(exp.createdAt).toISOString().split('T')[0];
      const key = `${dateKey}-${exp.category}`;
      const existing = expenseTrendMap.get(key) || { totalAmount: 0, category: exp.category };
      existing.totalAmount += exp.amount;
      expenseTrendMap.set(key, existing);
    });

    const expenseTrends = Array.from(expenseTrendMap.entries()).map(([key, value]) => ({
      date: new Date(key.split('-').slice(0, 3).join('-')),
      totalAmount: value.totalAmount,
      category: value.category,
    }));

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Calculate team activity count
    const teamActivityCount = messages.length + discussions.length + tasks.filter(t => t.updatedAt && new Date(t.updatedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length;

    // Update or create analytics document
    const analytics = await ProjectAnalytics.findOneAndUpdate(
      { projectId },
      {
        teamActivityCount,
        taskCompletionRate: Math.round(taskCompletionRate),
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        reviewTasks,
        contributionStats,
        expenseTrends,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        discussionCount: discussions.length,
        messageCount: messages.length,
        projectProgress: Math.round(projectProgress),
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Updated analytics for project ${projectId}`);
  } catch (error: any) {
    console.error('❌ Error updating analytics:', error.message);
    throw error;
  }
}

/**
 * Get project analytics
 */
export async function getProjectAnalytics(projectId: string) {
  try {
    await connectDB();

    // Update analytics first to ensure fresh data
    await updateProjectAnalytics(projectId);

    const analytics = await ProjectAnalytics.findOne({ projectId })
      .populate('contributionStats.userId', 'name githubUsername avatarUrl');

    return analytics;
  } catch (error: any) {
    console.error('❌ Error fetching analytics:', error.message);
    throw error;
  }
}

/**
 * Get top contributors for a project
 */
export async function getTopContributors(projectId: string, limit: number = 5) {
  try {
    await connectDB();

    const analytics = await ProjectAnalytics.findOne({ projectId })
      .populate('contributionStats.userId', 'name githubUsername avatarUrl');

    if (!analytics) {
      return [];
    }

    return analytics.contributionStats
      .sort((a, b) => (b.tasksCompleted + b.messagesCount + b.discussionsCreated) - (a.tasksCompleted + a.messagesCount + a.discussionsCreated))
      .slice(0, limit);
  } catch (error: any) {
    console.error('❌ Error fetching top contributors:', error.message);
    throw error;
  }
}

/**
 * Calculate team velocity (tasks completed per day)
 */
export async function getTeamVelocity(projectId: string, days: number = 7) {
  try {
    await connectDB();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const tasks = await KanbanTask.find({
      projectId,
      status: 'done',
      updatedAt: { $gte: startDate },
    });

    const velocityMap = new Map<string, number>();
    tasks.forEach(task => {
      const dateKey = new Date(task.updatedAt).toISOString().split('T')[0];
      velocityMap.set(dateKey, (velocityMap.get(dateKey) || 0) + 1);
    });

    return Array.from(velocityMap.entries()).map(([date, count]) => ({
      date,
      tasksCompleted: count,
    }));
  } catch (error: any) {
    console.error('❌ Error calculating team velocity:', error.message);
    throw error;
  }
}
