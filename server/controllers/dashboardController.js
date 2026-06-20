const Result = require("../models/Result");

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const startOfUtcDay = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const calculateCurrentStreak = (results) => {
  if (!results.length) return 0;

  const activityDays = [
    ...new Set(results.map((result) => startOfUtcDay(result.createdAt).getTime())),
  ].sort((a, b) => b - a);

  const today = startOfUtcDay(new Date()).getTime();
  const latestActivity = activityDays[0];

  if (today - latestActivity > DAY_IN_MS) return 0;

  let streak = 1;
  for (let index = 1; index < activityDays.length; index += 1) {
    if (activityDays[index - 1] - activityDays[index] !== DAY_IN_MS) break;
    streak += 1;
  }

  return streak;
};

const percentageForResults = (results) => {
  const correct = results.reduce((sum, result) => sum + result.correct, 0);
  const total = results.reduce((sum, result) => sum + result.totalQuestions, 0);
  return total ? Math.round((correct / total) * 100) : null;
};

const buildWeeklyProgress = (results) => Array.from({ length: 7 }, (_, index) => {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - (6 - index));
  const dayResults = results.filter((result) => startOfUtcDay(new Date(result.createdAt)).getTime() === date.getTime());

  return {
    day: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
    aptitude: percentageForResults(dayResults.filter((result) => result.type === 'aptitude')),
    coding: percentageForResults(dayResults.filter((result) => result.type === 'coding')),
    mockTests: percentageForResults(dayResults.filter((result) => result.type === 'mock-test')),
  };
});

const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;

    const results = await Result.find({ userId })
      .select("type topic score totalQuestions correct percentage createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const mockTestsAttempted = results.filter((result) => result.type === "mock-test").length;
    const questionsSolved = results.reduce((sum, result) => sum + result.correct, 0);
    const totalQuestions = results.reduce((sum, result) => sum + result.totalQuestions, 0);
    const readiness = totalQuestions > 0
      ? Math.min(100, Math.round((questionsSolved / totalQuestions) * 100))
      : 0;
    const currentStreak = calculateCurrentStreak(results);
    const aptitudeResults = results.filter((result) => result.type === "aptitude");
    const codingResults = results.filter((result) => result.type === "coding");
    const aptitudeCorrect = aptitudeResults.reduce((sum, result) => sum + result.correct, 0);
    const aptitudeTotal = aptitudeResults.reduce((sum, result) => sum + result.totalQuestions, 0);
    const codingCorrect = codingResults.reduce((sum, result) => sum + result.correct, 0);
    const codingTotal = codingResults.reduce((sum, result) => sum + result.totalQuestions, 0);
    const weeklyProgress = buildWeeklyProgress([...results].reverse());

    const recentActivity = results.slice(0, 4).map((result) => [
      `Completed ${result.type.replace("-", " ")} test`,
      result.type === "mock-test" ? "Mock Test" : result.type,
      new Date(result.createdAt).toLocaleDateString(),
      result.type === "coding" ? "code" : result.type === "mock-test" ? "calendar" : "chart",
    ]);

    res.json({
      user: {
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
      stats: [
        {
          title: "Questions Solved",
          value: String(questionsSolved),
          suffix: "Correct",
          change: `${results.length} tests completed`,
          color: "purple",
          icon: "chart",
        },
        {
          title: "Mock Tests Attempted",
          value: String(mockTestsAttempted),
          suffix: "Tests",
          change: "Saved in your test history",
          color: "orange",
          icon: "calendar",
        },
        {
          title: "Placement Readiness",
          value: `${readiness}%`,
          suffix: readiness >= 70 ? "Keep it up!" : "Keep practicing",
          change: "Based on test results",
          color: "blue",
          icon: "trophy",
        },
        {
          title: "Current Streak",
          value: String(currentStreak),
          suffix: currentStreak === 1 ? "Day" : "Days",
          change: currentStreak > 0 ? "Keep the streak alive" : "Complete a test today",
          color: "green",
          icon: "calendar",
        },
      ],
      currentStreak,
      subjectProgress: {
        overall: readiness,
        aptitude: aptitudeTotal > 0 ? Math.round((aptitudeCorrect / aptitudeTotal) * 100) : 0,
        coding: codingTotal > 0 ? Math.round((codingCorrect / codingTotal) * 100) : 0,
        mockTests: mockTestsAttempted > 0 ? Math.min(100, mockTestsAttempted * 10) : 0,
        interviewPrep: readiness > 0 ? Math.max(20, readiness - 20) : 0,
      },
      weeklyProgress,
      activities: recentActivity.length
        ? recentActivity
        : [["Create your first test result", "Progress", "Today", "chart"]],
      mockTests: [
        ["TCS NQT Mock Test", "Aptitude", "120 mins", "Advanced", "MAY 25"],
        ["Infosys Springboard", "Aptitude", "90 mins", "Intermediate", "MAY 28"],
        ["Wipro Elite Mock", "Aptitude", "100 mins", "Advanced", "MAY 30"],
      ],
      companies: [
        ["Amazon", "120 Questions Practiced", "80%", "amazon"],
        ["Microsoft", "95 Questions Practiced", "65%", "microsoft"],
        ["Google", "80 Questions Practiced", "55%", "google"],
        ["TCS", "70 Questions Practiced", "45%", "tcs"],
      ],
      recommendations: [
        ["Data Structures in C++", "Continue Learning", "60%", "code", "mint"],
        ["Quantitative Aptitude", "Practice Now", "45%", "chart", "lavender"],
        ["Take a Mock Test", "12 Tests Available", "", "calendar", "peach"],
        ["Resume Review", "Get Expert Review", "", "file", "sky"],
      ],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProgressData = async (req, res) => {
  try {
    const results = await Result.find({ userId: req.user._id })
      .populate('problemId', 'title')
      .sort({ createdAt: 1 })
      .lean();

    const analyticsResults = results;

    const summaryFor = (testType) => {
      const typeResults = analyticsResults.filter((result) => result.type === testType);
      const correct = typeResults.reduce((sum, result) => sum + result.correct, 0);
      const total = typeResults.reduce((sum, result) => sum + result.totalQuestions, 0);
      const scores = typeResults.map((result) => result.totalQuestions
        ? Math.round((result.correct / result.totalQuestions) * 100)
        : 0);
      return {
        attempts: typeResults.length,
        accuracy: total ? Math.round((correct / total) * 100) : 0,
        bestScore: scores.length ? Math.max(...scores) : 0,
        questions: total,
        correct,
      };
    };

    const moduleProgress = {
      aptitude: summaryFor('aptitude'),
      coding: summaryFor('coding'),
      mockTests: summaryFor('mock-test'),
    };
    const totalCorrect = analyticsResults.reduce((sum, result) => sum + result.correct, 0);
    const totalQuestions = analyticsResults.reduce((sum, result) => sum + result.totalQuestions, 0);
    const totalTime = analyticsResults.reduce((sum, result) => sum + (result.timeTaken || 0), 0);
    const overallAccuracy = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    const trendDays = Array.from({ length: 14 }, (_, index) => {
      const date = new Date();
      date.setUTCHours(0, 0, 0, 0);
      date.setUTCDate(date.getUTCDate() - (13 - index));
      const dayResults = analyticsResults.filter((result) => startOfUtcDay(new Date(result.createdAt)).getTime() === date.getTime());
      const correct = dayResults.reduce((sum, result) => sum + result.correct, 0);
      const total = dayResults.reduce((sum, result) => sum + result.totalQuestions, 0);
      return {
        date: date.toISOString().slice(5, 10),
        attempts: dayResults.length,
        accuracy: total ? Math.round((correct / total) * 100) : null,
      };
    });

    const percentageFor = (result) => result.totalQuestions
      ? Math.round((result.correct / result.totalQuestions) * 100)
      : 0;

    const aptitudeHistory = analyticsResults
      .filter((result) => result.type === 'aptitude')
      .map((result, index) => ({
        label: `Test ${index + 1}`,
        date: new Date(result.createdAt).toISOString().slice(5, 10),
        score: percentageFor(result),
      }));

    const codingSolvedHistory = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setUTCHours(0, 0, 0, 0);
      date.setUTCDate(date.getUTCDate() - (6 - index));
      const solved = analyticsResults.filter((result) =>
        result.type === 'coding' &&
        result.correct > 0 &&
        startOfUtcDay(new Date(result.createdAt)).getTime() === date.getTime()
      ).length;

      return {
        date: date.toISOString().slice(5, 10),
        solved,
      };
    });

    const mockTestScores = analyticsResults
      .filter((result) => result.type === 'mock-test')
      .map((result) => ({
        label: result.topic || 'Mock Test',
        date: new Date(result.createdAt).toISOString().slice(5, 10),
        score: percentageFor(result),
      }));

    const weeklyImprovement = Array.from({ length: 4 }, (_, index) => {
      const weekEnd = new Date();
      weekEnd.setUTCHours(23, 59, 59, 999);
      weekEnd.setUTCDate(weekEnd.getUTCDate() - ((3 - index) * 7));

      const weekStart = new Date(weekEnd);
      weekStart.setUTCDate(weekStart.getUTCDate() - 6);
      weekStart.setUTCHours(0, 0, 0, 0);

      const weekResults = analyticsResults.filter((result) => {
        const createdAt = new Date(result.createdAt);
        return createdAt >= weekStart && createdAt <= weekEnd;
      });
      const correct = weekResults.reduce((sum, result) => sum + result.correct, 0);
      const total = weekResults.reduce((sum, result) => sum + result.totalQuestions, 0);

      return {
        label: `Week ${index + 1}`,
        accuracy: total ? Math.round((correct / total) * 100) : 0,
        attempts: weekResults.length,
      };
    }).map((week, index, weeks) => ({
      ...week,
      improvement: index === 0 ? 0 : week.accuracy - weeks[index - 1].accuracy,
    }));

    const recentAttempts = [...analyticsResults].reverse().slice(0, 10).map((result) => ({
      id: result._id,
      type: result.type,
      title: result.type === 'coding'
        ? result.problemId?.title || 'Coding Problem'
        : result.type === 'mock-test'
          ? result.topic || 'Placement Mock Test'
          : 'Aptitude Test',
      score: result.correct,
      total: result.totalQuestions,
      percentage: result.totalQuestions ? Math.round((result.correct / result.totalQuestions) * 100) : 0,
      timeTaken: result.timeTaken || 0,
      createdAt: result.createdAt,
    }));

    const weakestModule = Object.entries(moduleProgress)
      .filter(([, value]) => value.attempts > 0)
      .sort((first, second) => first[1].accuracy - second[1].accuracy)[0]?.[0] || 'aptitude';

    res.json({
      overview: {
        attempts: analyticsResults.length,
        questionsSolved: totalCorrect,
        overallAccuracy,
        currentStreak: calculateCurrentStreak(analyticsResults),
        timeSpentSeconds: totalTime,
      },
      moduleProgress,
      trendDays,
      aptitudeHistory,
      codingSolvedHistory,
      mockTestScores,
      weeklyImprovement,
      recentAttempts,
      isSampleData: false,
      recommendation: results.length
        ? `Focus next on ${weakestModule === 'mockTests' ? 'mock tests' : weakestModule} to improve your overall readiness.`
        : 'Complete an aptitude test, coding problem, or mock test to start building your progress analytics.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load progress analytics.' });
  }
};

module.exports = { getDashboardData, getProgressData };
