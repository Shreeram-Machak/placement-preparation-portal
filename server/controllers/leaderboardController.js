const Result = require('../models/Result');

const emptyStats = (user) => ({
  user,
  aptitudeBest: 0,
  mockBest: 0,
  codingSolved: new Set(),
  correct: 0,
  total: 0,
});

const publicUser = (user) => ({
  id: user?._id,
  name: user?.name || 'Student',
  email: user?.email || '',
});

const getLeaderboard = async (req, res) => {
  try {
    const results = await Result.find()
      .populate('userId', 'name email')
      .select('userId type percentage correct totalQuestions problemId status')
      .lean();

    const stats = new Map();
    results.forEach((result) => {
      if (!result.userId) return;
      const userKey = String(result.userId._id);
      const current = stats.get(userKey) || emptyStats(result.userId);

      if (result.type === 'aptitude') current.aptitudeBest = Math.max(current.aptitudeBest, result.percentage || 0);
      if (result.type === 'mock-test') current.mockBest = Math.max(current.mockBest, result.percentage || 0);
      if (result.type === 'coding' && (result.status === 'Accepted' || result.percentage === 100) && result.problemId) {
        current.codingSolved.add(String(result.problemId));
      }

      current.correct += result.correct || 0;
      current.total += result.totalQuestions || 0;
      stats.set(userKey, current);
    });

    const rows = [...stats.values()].map((item) => ({
      user: publicUser(item.user),
      aptitudeScore: item.aptitudeBest,
      mockTestScore: item.mockBest,
      codingProblemsSolved: item.codingSolved.size,
      overallReadiness: item.total ? Math.round((item.correct / item.total) * 100) : 0,
    }));

    const topBy = (key) => [...rows].sort((first, second) => second[key] - first[key]).slice(0, 10);

    res.json({
      aptitude: topBy('aptitudeScore'),
      mockTests: topBy('mockTestScore'),
      coding: topBy('codingProblemsSolved'),
      overall: topBy('overallReadiness'),
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load leaderboard.' });
  }
};

module.exports = { getLeaderboard };
