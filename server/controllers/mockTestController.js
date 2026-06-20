const Question = require('../models/Question');
const Result = require('../models/Result');
const { generateMockTestQuestions } = require('../services/geminiService');

const MOCK_SIZE = 10;
const MOCK_DURATION_SECONDS = 15 * 60;
const allowedDifficulties = ['easy', 'medium', 'hard'];

const sanitizeQuestions = (questions) => questions.map((item) => ({
  _id: item._id,
  question: item.question || item.questionText,
  options: item.options,
  category: item.category,
  difficulty: item.difficulty,
}));

const generateMockTest = async (req, res) => {
  const company = String(req.body.company || 'General Placement').trim().slice(0, 60);
  const difficulty = allowedDifficulties.includes(req.body.difficulty) ? req.body.difficulty : 'medium';
  try {
    const generated = await generateMockTestQuestions({ company, count: MOCK_SIZE, difficulty });
    const saved = await Question.insertMany(generated);
    res.status(201).json({ company, difficulty, durationSeconds: MOCK_DURATION_SECONDS, questions: sanitizeQuestions(saved) });
  } catch (error) {
    if (error.status === 503) {
      let saved = await Question.find({ difficulty }).sort({ createdAt: -1 }).limit(MOCK_SIZE).lean();
      if (saved.length < 5) {
        saved = await Question.find().sort({ createdAt: -1 }).limit(MOCK_SIZE).lean();
      }
      if (saved.length >= 5) {
        return res.json({
          company,
          difficulty,
          durationSeconds: MOCK_DURATION_SECONDS,
          fallback: true,
          message: `${error.message} Using saved questions instead.`,
          questions: sanitizeQuestions(saved),
        });
      }
    }
    res.status(error.status || 500).json({ message: error.status ? error.message : 'Unable to generate mock test.' });
  }
};

const submitMockTest = async (req, res) => {
  try {
    const { answers = {}, company = 'General Placement', questionIds = [], timeTaken = 0 } = req.body;
    if (!Array.isArray(questionIds) || !questionIds.length) {
      return res.status(400).json({ message: 'No mock-test questions were submitted' });
    }

    const questions = await Question.find({ _id: { $in: questionIds } })
      .select('question questionText correctAnswer explanation category difficulty').lean();
    const questionMap = new Map(questions.map((item) => [String(item._id), item]));
    const review = questionIds.map((id) => questionMap.get(String(id))).filter(Boolean).map((item) => {
      const selectedAnswer = answers[String(item._id)] || '';
      return {
        questionId: item._id,
        question: item.question || item.questionText,
        selectedAnswer,
        correctAnswer: item.correctAnswer,
        explanation: item.explanation,
        category: item.category,
        isCorrect: selectedAnswer === item.correctAnswer,
      };
    });
    const correctAnswers = review.filter((item) => item.isCorrect).length;
    const attemptedQuestions = review.filter((item) => item.selectedAnswer).length;
    const totalQuestions = review.length;
    const wrongAnswers = attemptedQuestions - correctAnswers;
    const skippedQuestions = totalQuestions - attemptedQuestions;
    const percentage = totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const accuracy = attemptedQuestions ? Math.round((correctAnswers / attemptedQuestions) * 100) : 0;
    const categoryStats = review.reduce((stats, item) => {
      const category = item.category || 'General';
      const current = stats[category] || { correct: 0, total: 0 };
      current.total += 1;
      current.correct += item.isCorrect ? 1 : 0;
      stats[category] = current;
      return stats;
    }, {});
    const categoryPerformance = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      accuracy: Math.round((stats.correct / stats.total) * 100),
    })).sort((first, second) => second.accuracy - first.accuracy);
    const normalizedTimeTaken = Math.max(0, Number(timeTaken) || 0);

    await Result.create({
      userId: req.user._id,
      type: 'mock-test',
      topic: String(company).trim().slice(0, 60),
      score: correctAnswers,
      totalQuestions,
      correct: correctAnswers,
      percentage,
      wrong: wrongAnswers,
      skipped: skippedQuestions,
      timeTaken: normalizedTimeTaken,
    });

    res.status(201).json({
      score: correctAnswers,
      totalQuestions,
      attemptedQuestions,
      wrongAnswers,
      skippedQuestions,
      percentage,
      review,
      analytics: {
        accuracy,
        timeTaken: normalizedTimeTaken,
        strongArea: categoryPerformance[0]?.category || 'Not available',
        weakArea: categoryPerformance[categoryPerformance.length - 1]?.category || 'Not available',
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMockTestHistory = async (req, res) => {
  try {
    const company = String(req.query.company || 'General Placement').trim().slice(0, 60);
    const results = await Result.find({
      userId: req.user._id,
      type: 'mock-test',
      topic: company,
    }).sort({ createdAt: -1 }).select('correct totalQuestions createdAt percentage').lean();

    const percentages = results.map((item) => (
      item.percentage || (item.totalQuestions ? Math.round((item.correct / item.totalQuestions) * 100) : 0)
    ));

    res.json({
      attempts: results.length,
      lastAttempt: percentages[0] ?? null,
      bestScore: percentages.length ? Math.max(...percentages) : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { generateMockTest, getMockTestHistory, submitMockTest };
