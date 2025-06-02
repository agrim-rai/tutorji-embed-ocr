import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import ChatbotSession from '@/models/ChatbotSession';

export async function GET() {
  try {
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
    
    // Recent activity (last 10 users and sessions)
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email createdAt credits');
      
    const recentSessions = await ChatbotSession.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('sessionId createdAt');

    // Calculate growth rates
    const userGrowthRate = usersYesterday > 0 ? 
      ((usersToday - usersYesterday) / usersYesterday * 100).toFixed(1) : 
      (usersToday > 0 ? 100 : 0);
      
    const sessionGrowthRate = sessionsYesterday > 0 ? 
      ((sessionsToday - sessionsYesterday) / sessionsYesterday * 100).toFixed(1) : 
      (sessionsToday > 0 ? 100 : 0);

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