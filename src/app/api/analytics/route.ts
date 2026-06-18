import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/utils';
import { subDays, format, parseISO, differenceInDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const todayStr = getLocalDateString();
    const today = parseISO(todayStr);

    // 1. Fetch all daily report scores and dates to calculate streak and average
    const { data: reports, error: reportsError } = await supabaseAdmin
      .from('daily_reports')
      .select('date, score')
      .order('date', { ascending: false });

    if (reportsError) {
      console.error('Error fetching analytics reports:', reportsError);
      return NextResponse.json({ error: 'Failed to fetch reports data' }, { status: 500 });
    }

    // 2. Fetch tasks for completion rate calculation (last 30 days)
    const thirtyDaysAgoStr = getLocalDateString(subDays(new Date(), 30));
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('is_completed')
      .gte('date', thirtyDaysAgoStr);

    if (tasksError) {
      console.error('Error fetching analytics tasks:', tasksError);
      return NextResponse.json({ error: 'Failed to fetch tasks data' }, { status: 500 });
    }

    // --- CALCULATIONS ---

    // A. Streak Calculation
    let streak = 0;
    if (reports && reports.length > 0) {
      const reportDatesSet = new Set(reports.map(r => r.date));
      
      const yesterdayStr = getLocalDateString(subDays(new Date(), 1));
      
      let currentCheckDate = new Date();
      let hasReport = reportDatesSet.has(getLocalDateString(currentCheckDate));
      
      // If no report today, check if yesterday had one to continue streak
      if (!hasReport) {
        currentCheckDate = subDays(new Date(), 1);
        hasReport = reportDatesSet.has(getLocalDateString(currentCheckDate));
      }

      if (hasReport) {
        streak = 1;
        while (true) {
          currentCheckDate = subDays(currentCheckDate, 1);
          const checkStr = getLocalDateString(currentCheckDate);
          if (reportDatesSet.has(checkStr)) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    // B. Average Score & Trend
    let averageScore = 50;
    let averageScoreTrend = 0;
    
    if (reports && reports.length > 0) {
      const totalScore = reports.reduce((sum, r) => sum + r.score, 0);
      averageScore = Math.round((totalScore / reports.length) * 10) / 10;

      // Calculate trend: last 30 days vs prior 30 days
      const thirtyDaysAgo = subDays(new Date(), 30);
      const sixtyDaysAgo = subDays(new Date(), 60);

      const last30Reports = reports.filter(r => parseISO(r.date) >= thirtyDaysAgo);
      const prior30Reports = reports.filter(r => {
        const d = parseISO(r.date);
        return d >= sixtyDaysAgo && d < thirtyDaysAgo;
      });

      const avgLast30 = last30Reports.length > 0
        ? last30Reports.reduce((sum, r) => sum + r.score, 0) / last30Reports.length
        : 50;

      const avgPrior30 = prior30Reports.length > 0
        ? prior30Reports.reduce((sum, r) => sum + r.score, 0) / prior30Reports.length
        : 50;

      averageScoreTrend = Math.round((avgLast30 - avgPrior30) * 10) / 10;
    }

    // C. Task Completion Rate
    let totalTasksCount = 0;
    let completedTasksCount = 0;
    let taskCompletionRate = 0;

    if (tasks && tasks.length > 0) {
      totalTasksCount = tasks.length;
      completedTasksCount = tasks.filter(t => t.is_completed).length;
      taskCompletionRate = Math.round((completedTasksCount / totalTasksCount) * 100);
    }

    // D. Weekly Trend (last 7 days, ending today)
    const weeklyTrend = [];
    const reportsMap = new Map(reports?.map(r => [r.date, r.score]) || []);

    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dStr = getLocalDateString(d);
      const score = reportsMap.has(dStr) ? (reportsMap.get(dStr) as number) : 50;
      weeklyTrend.push({
        date: dStr,
        dayName: format(d, 'eee'), // e.g. Mon, Tue
        score
      });
    }

    // E. Monthly Heatmap (last 30 days)
    const monthlyHeatmap = [];
    for (let i = 29; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dStr = getLocalDateString(d);
      const score = reportsMap.has(dStr) ? (reportsMap.get(dStr) as number) : 50;
      monthlyHeatmap.push({
        date: dStr,
        score
      });
    }

    return NextResponse.json({
      streak,
      averageScore,
      averageScoreTrend,
      totalTasks: totalTasksCount,
      completedTasks: completedTasksCount,
      taskCompletionRate,
      weeklyTrend,
      monthlyHeatmap
    });
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
