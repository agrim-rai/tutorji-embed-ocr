import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import ChatbotSession from '@/models/ChatbotSession';
import Summary from '@/models/summary';

export async function GET() {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    // Get current date and time boundaries
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    
    // Get week boundaries
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    
    // Get month boundaries
    const monthStart = new Date(todayStart);
    monthStart.setDate(monthStart.getDate() - 30);

    // === USER ANALYTICS ===
    
    // Total users ever
    const totalUsers = await User.countDocuments();
    
    // Users registered today
    const usersToday = await User.countDocuments({
      createdAt: { $gte: todayStart }
    });
    
    // Users registered yesterday
    const usersYesterday = await User.countDocuments({
      createdAt: { 
        $gte: yesterdayStart,
        $lt: todayStart
      }
    });
    
    // Users registered this week
    const usersThisWeek = await User.countDocuments({
      createdAt: { $gte: weekStart }
    });
    
    // Users registered this month
    const usersThisMonth = await User.countDocuments({
      createdAt: { $gte: monthStart }
    });
    
    // Average credits per user
    const creditStats = await User.aggregate([
      {
        $group: {
          _id: null,
          avgCredits: { $avg: '$credits' },
          totalCredits: { $sum: '$credits' },
          maxCredits: { $max: '$credits' },
          minCredits: { $min: '$credits' }
        }
      }
    ]);
    
    // Daily user registrations for the last 7 days
    const dailyUsers = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: weekStart }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // === CHATBOT SESSION ANALYTICS ===
    
    // Total sessions ever
    const totalSessions = await ChatbotSession.countDocuments();
    
    // Sessions created today
    const sessionsToday = await ChatbotSession.countDocuments({
      createdAt: { $gte: todayStart }
    });
    
    // Sessions created yesterday
    const sessionsYesterday = await ChatbotSession.countDocuments({
      createdAt: { 
        $gte: yesterdayStart,
        $lt: todayStart
      }
    });
    
    // Sessions created this week
    const sessionsThisWeek = await ChatbotSession.countDocuments({
      createdAt: { $gte: weekStart }
    });
    
    // Sessions created this month
    const sessionsThisMonth = await ChatbotSession.countDocuments({
      createdAt: { $gte: monthStart }
    });
    
    // Daily sessions for the last 7 days
    const dailySessions = await ChatbotSession.aggregate([
      {
        $match: {
          createdAt: { $gte: weekStart }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Weekly sessions for the last 4 weeks
    const weeklySessions = await ChatbotSession.aggregate([
      {
        $match: {
          createdAt: { $gte: monthStart }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            week: { $week: "$createdAt" }
          },
          count: { $sum: 1 },
          startDate: { $min: "$createdAt" }
        }
      },
      {
        $sort: { startDate: 1 }
      }
    ]);

    // === ADDITIONAL ANALYTICS ===
    
    // Users by credit ranges
    const creditDistribution = await User.aggregate([
      {
        $bucket: {
          groupBy: "$credits",
          boundaries: [0, 1, 5, 10, 15, 20, 25, 30],
          default: "30+",
          output: {
            count: { $sum: 1 },
            avgCredits: { $avg: "$credits" }
          }
        }
      }
    ]);
    
    // === STEP BREAKDOWN (SUMMARY) ANALYTICS ===
    
    // Total step breakdowns ever
    const totalStepBreakdowns = await Summary.countDocuments();
    
    // Step breakdowns created today
    const stepBreakdownsToday = await Summary.countDocuments({
      createdAt: { $gte: todayStart }
    });
    
    // Step breakdowns created yesterday
    const stepBreakdownsYesterday = await Summary.countDocuments({
      createdAt: { 
        $gte: yesterdayStart,
        $lt: todayStart
      }
    });
    
    // Step breakdowns created this week
    const stepBreakdownsThisWeek = await Summary.countDocuments({
      createdAt: { $gte: weekStart }
    });
    
    // Step breakdowns created this month
    const stepBreakdownsThisMonth = await Summary.countDocuments({
      createdAt: { $gte: monthStart }
    });
    
    // Daily step breakdowns for the last 7 days
    const dailyStepBreakdowns = await Summary.aggregate([
      {
        $match: {
          createdAt: { $gte: weekStart }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Top 5 most active users for step breakdowns
    const topStepBreakdownUsers = await Summary.aggregate([
      {
        $group: {
          _id: "$useremail",
          totalUsage: { $sum: 1 },
          lastUsed: { $max: "$createdAt" },
          firstUsed: { $min: "$createdAt" }
        }
      },
      {
        $sort: { totalUsage: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    // Unique users who used step breakdown feature
    const uniqueStepBreakdownUsers = await Summary.distinct("useremail");
    const uniqueStepBreakdownUsersCount = uniqueStepBreakdownUsers.length;
    
    // Step breakdown usage by user distribution
    const stepBreakdownUserDistribution = await Summary.aggregate([
      {
        $group: {
          _id: "$useremail",
          count: { $sum: 1 }
        }
      },
      {
        $bucket: {
          groupBy: "$count",
          boundaries: [1, 2, 5, 10, 25, 50],
          default: "50+",
          output: {
            userCount: { $sum: 1 },
            avgUsage: { $avg: "$count" }
          }
        }
      }
    ]);
    
    // Weekly step breakdown trends for the last 4 weeks
    const weeklyStepBreakdowns = await Summary.aggregate([
      {
        $match: {
          createdAt: { $gte: monthStart }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            week: { $week: "$createdAt" }
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: "$useremail" },
          startDate: { $min: "$createdAt" }
        }
      },
      {
        $addFields: {
          uniqueUserCount: { $size: "$uniqueUsers" }
        }
      },
      {
        $sort: { startDate: 1 }
      }
    ]);
    
    // Hourly usage pattern for step breakdowns (last 7 days)
    const hourlyStepBreakdownPattern = await Summary.aggregate([
      {
        $match: {
          createdAt: { $gte: weekStart }
        }
      },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Recent activity (last 10 users and sessions)
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email createdAt credits');
      
    const recentSessions = await ChatbotSession.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('sessionId createdAt');
      
    // Recent step breakdowns
    const recentStepBreakdowns = await Summary.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('useremail createdAt imageurl');

    // Calculate growth rates
    const userGrowthRate = usersYesterday > 0 ? 
      ((usersToday - usersYesterday) / usersYesterday * 100).toFixed(1) : 
      (usersToday > 0 ? 100 : 0);
      
    const sessionGrowthRate = sessionsYesterday > 0 ? 
      ((sessionsToday - sessionsYesterday) / sessionsYesterday * 100).toFixed(1) : 
      (sessionsToday > 0 ? 100 : 0);
      
    const stepBreakdownGrowthRate = stepBreakdownsYesterday > 0 ? 
      ((stepBreakdownsToday - stepBreakdownsYesterday) / stepBreakdownsYesterday * 100).toFixed(1) : 
      (stepBreakdownsToday > 0 ? 100 : 0);

    const analytics = {
      users: {
        total: totalUsers,
        today: usersToday,
        yesterday: usersYesterday,
        thisWeek: usersThisWeek,
        thisMonth: usersThisMonth,
        growthRate: parseFloat(userGrowthRate),
        daily: dailyUsers,
        recent: recentUsers
      },
      sessions: {
        total: totalSessions,
        today: sessionsToday,
        yesterday: sessionsYesterday,
        thisWeek: sessionsThisWeek,
        thisMonth: sessionsThisMonth,
        growthRate: parseFloat(sessionGrowthRate),
        daily: dailySessions,
        weekly: weeklySessions,
        recent: recentSessions
      },
      stepBreakdowns: {
        total: totalStepBreakdowns,
        today: stepBreakdownsToday,
        yesterday: stepBreakdownsYesterday,
        thisWeek: stepBreakdownsThisWeek,
        thisMonth: stepBreakdownsThisMonth,
        growthRate: parseFloat(stepBreakdownGrowthRate),
        uniqueUsers: uniqueStepBreakdownUsersCount,
        daily: dailyStepBreakdowns,
        weekly: weeklyStepBreakdowns,
        hourlyPattern: hourlyStepBreakdownPattern,
        topUsers: topStepBreakdownUsers,
        userDistribution: stepBreakdownUserDistribution,
        recent: recentStepBreakdowns
      },
      credits: {
        average: creditStats[0]?.avgCredits?.toFixed(2) || 0,
        total: creditStats[0]?.totalCredits || 0,
        max: creditStats[0]?.maxCredits || 0,
        min: creditStats[0]?.minCredits || 0,
        distribution: creditDistribution
      },
      meta: {
        lastUpdated: new Date().toISOString(),
        dateRange: {
          today: todayStart.toISOString(),
          weekStart: weekStart.toISOString(),
          monthStart: monthStart.toISOString()
        }
      }
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
} 