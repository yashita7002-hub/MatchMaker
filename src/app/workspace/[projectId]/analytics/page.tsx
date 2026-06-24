"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';
import styles from './page.module.css';

interface Contributor {
  userId: {
    _id: string;
    name: string;
    githubUsername: string;
    avatarUrl: string;
  };
  tasksCompleted: number;
  discussionsCreated: number;
  messagesCount: number;
  lastActivity: string;
}

interface VelocityData {
  date: string;
  tasksCompleted: number;
}

interface ExpenseTrend {
  date: string;
  totalAmount: number;
  category: string;
}

interface Analytics {
  taskCompletionRate: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  reviewTasks: number;
  totalExpenses: number;
  discussionCount: number;
  messageCount: number;
  projectProgress: number;
  teamActivityCount: number;
  expenseTrends: ExpenseTrend[];
}

interface Project {
  _id: string;
  title: string;
  description: string;
  status: string;
  ownerId: { name: string; githubUsername: string };
  members: any[];
}

export default function AnalyticsDashboard() {
  const params = useParams();
  const router = useRouter();
  const { user } = useApp();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [topContributors, setTopContributors] = useState<Contributor[]>([]);
  const [teamVelocity, setTeamVelocity] = useState<VelocityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [projectRes, analyticsRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/analytics`),
        ]);

        if (!projectRes.ok) {
          throw new Error('Failed to fetch project');
        }

        const projectData = await projectRes.json();
        setProject(projectData.project);

        if (!analyticsRes.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData.analytics);
        setTopContributors(analyticsData.topContributors || []);
        setTeamVelocity(analyticsData.teamVelocity || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, user, router]);

  if (!user) return null;
  if (loading) return <div className={styles.container}><p>Loading analytics...</p></div>;
  if (error) return <div className={styles.container}><p className={styles.error}>Error: {error}</p></div>;
  if (!project || !analytics) return <div className={styles.container}><p>No data available</p></div>;

  const expensesByCategory = analytics.expenseTrends.reduce((acc, trend) => {
    const existing = acc.find(e => e.category === trend.category);
    if (existing) {
      existing.amount += trend.totalAmount;
    } else {
      acc.push({ category: trend.category, amount: trend.totalAmount });
    }
    return acc;
  }, [] as { category: string; amount: number }[]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href={`/workspace/${projectId}`} className={styles.backLink}>
          ← Back to Workspace
        </Link>
        <h1>{project.title} - Analytics Dashboard</h1>
        <p className={styles.description}>{project.description}</p>
      </div>

      {/* Key Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Project Progress</div>
          <div className={styles.metricValue}>{analytics.projectProgress}%</div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${analytics.projectProgress}%` }}
            />
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Task Completion Rate</div>
          <div className={styles.metricValue}>{analytics.taskCompletionRate}%</div>
          <p className={styles.metricDetail}>
            {analytics.completedTasks} of {analytics.totalTasks} tasks completed
          </p>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Team Activity</div>
          <div className={styles.metricValue}>{analytics.teamActivityCount}</div>
          <p className={styles.metricDetail}>actions this week</p>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Total Expenses</div>
          <div className={styles.metricValue}>${analytics.totalExpenses.toFixed(2)}</div>
          <p className={styles.metricDetail}>{expensesByCategory.length} categories</p>
        </div>
      </div>

      {/* Task Statistics */}
      <div className={styles.section}>
        <h2>Task Statistics</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statColor} style={{ backgroundColor: '#4CAF50' }} />
            <div className={styles.statInfo}>
              <div className={styles.statName}>Completed</div>
              <div className={styles.statValue}>{analytics.completedTasks}</div>
            </div>
          </div>

          <div className={styles.statItem}>
            <div className={styles.statColor} style={{ backgroundColor: '#FF9800' }} />
            <div className={styles.statInfo}>
              <div className={styles.statName}>In Progress</div>
              <div className={styles.statValue}>{analytics.inProgressTasks}</div>
            </div>
          </div>

          <div className={styles.statItem}>
            <div className={styles.statColor} style={{ backgroundColor: '#2196F3' }} />
            <div className={styles.statInfo}>
              <div className={styles.statName}>To Do</div>
              <div className={styles.statValue}>{analytics.todoTasks}</div>
            </div>
          </div>

          <div className={styles.statItem}>
            <div className={styles.statColor} style={{ backgroundColor: '#9C27B0' }} />
            <div className={styles.statInfo}>
              <div className={styles.statName}>In Review</div>
              <div className={styles.statValue}>{analytics.reviewTasks}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className={styles.section}>
        <h2>Team Engagement</h2>
        <div className={styles.engagementGrid}>
          <div className={styles.engagementCard}>
            <div className={styles.engagementLabel}>Discussions</div>
            <div className={styles.engagementValue}>{analytics.discussionCount}</div>
          </div>

          <div className={styles.engagementCard}>
            <div className={styles.engagementLabel}>Messages</div>
            <div className={styles.engagementValue}>{analytics.messageCount}</div>
          </div>

          <div className={styles.engagementCard}>
            <div className={styles.engagementLabel}>Team Members</div>
            <div className={styles.engagementValue}>{project.members.length}</div>
          </div>
        </div>
      </div>

      {/* Top Contributors */}
      {topContributors.length > 0 && (
        <div className={styles.section}>
          <h2>Top Contributors</h2>
          <div className={styles.contributorsList}>
            {topContributors.map((contributor, index) => (
              <div key={index} className={styles.contributorCard}>
                <div className={styles.rank}>{index + 1}</div>
                <img 
                  src={contributor.userId.avatarUrl} 
                  alt={contributor.userId.name}
                  className={styles.avatar}
                />
                <div className={styles.contributorInfo}>
                  <div className={styles.contributorName}>{contributor.userId.name}</div>
                  <div className={styles.contributorUsername}>@{contributor.userId.githubUsername}</div>
                </div>
                <div className={styles.contributorStats}>
                  <div className={styles.stat}>
                    <div className={styles.statLabel}>Tasks</div>
                    <div className={styles.statNumber}>{contributor.tasksCompleted}</div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statLabel}>Discussion</div>
                    <div className={styles.statNumber}>{contributor.discussionsCreated}</div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statLabel}>Messages</div>
                    <div className={styles.statNumber}>{contributor.messagesCount}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense Breakdown */}
      {expensesByCategory.length > 0 && (
        <div className={styles.section}>
          <h2>Expense Breakdown by Category</h2>
          <div className={styles.expensesList}>
            {expensesByCategory.map((expense, index) => (
              <div key={index} className={styles.expenseItem}>
                <div className={styles.expenseCategory}>{expense.category}</div>
                <div className={styles.expenseAmount}>${expense.amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Velocity */}
      {teamVelocity.length > 0 && (
        <div className={styles.section}>
          <h2>Team Velocity (Last 7 Days)</h2>
          <div className={styles.velocityChart}>
            {teamVelocity.map((day, index) => (
              <div key={index} className={styles.velocityBar}>
                <div className={styles.barLabel}>{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                <div className={styles.barContainer}>
                  <div 
                    className={styles.bar}
                    style={{ height: `${Math.max(day.tasksCompleted * 20, 20)}px` }}
                  >
                    <span className={styles.barValue}>{day.tasksCompleted}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
