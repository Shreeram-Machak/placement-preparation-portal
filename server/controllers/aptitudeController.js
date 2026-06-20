const Question = require('../models/Question');
const Result = require('../models/Result');
const {
  allowedCategories,
  allowedDifficulties,
  generateAptitudeQuestions,
} = require('../services/geminiService');
const QUIZ_SIZE = 5;

const validateFilters = (category, difficulty) => {
  if (category && category !== 'all' && !allowedCategories.includes(category)) {
    return 'Invalid question category';
  }

  if (difficulty && difficulty !== 'all' && !allowedDifficulties.includes(difficulty)) {
    return 'Invalid difficulty';
  }

  return null;
};

const buildQuestionFilter = (category, difficulty) => {
  const filter = {};
  if (category && category !== 'all') filter.category = category;
  if (difficulty && difficulty !== 'all') filter.difficulty = difficulty;
  return filter;
};

const sanitizeQuestions = (questions) => questions.map((item) => ({
  _id: item._id,
  question: item.question || item.questionText,
  options: item.options,
  category: item.category,
  difficulty: item.difficulty,
}));

const getQuestions = async (req, res) => {
  try {
    const { category, difficulty } = req.query;
    const validationError = validateFilters(category, difficulty);
    if (validationError) return res.status(400).json({ message: validationError });
    const filter = buildQuestionFilter(category, difficulty);

    const questions = await Question.find(filter)
      .select('question questionText options category difficulty')
      .sort({ createdAt: -1 })
      .limit(QUIZ_SIZE)
      .lean();

    res.json({ questions: sanitizeQuestions(questions) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generateQuiz = async (req, res) => {
  const { category = 'quantitative', difficulty = 'medium' } = req.body;

  try {
    if (category === 'all' || difficulty === 'all') {
      return res.status(400).json({
        message: 'Select one topic and one difficulty before generating questions.',
      });
    }
    const validationError = validateFilters(category, difficulty);
    if (validationError) return res.status(400).json({ message: validationError });

    const generatedQuestions = await generateAptitudeQuestions({
      category,
      difficulty,
      count: QUIZ_SIZE,
    });
    const savedQuestions = await Question.insertMany(generatedQuestions);

    res.status(201).json({
      generatedCount: savedQuestions.length,
      questions: sanitizeQuestions(savedQuestions),
    });
  } catch (error) {
    if (error.status === 503) {
      const savedQuestions = await Question.find(buildQuestionFilter(category, difficulty))
        .select('question questionText options category difficulty')
        .sort({ createdAt: -1 })
        .limit(QUIZ_SIZE)
        .lean();

      if (savedQuestions.length > 0) {
        return res.json({
          generatedCount: 0,
          fallback: true,
          message: `${error.message} Using saved questions instead.`,
          questions: sanitizeQuestions(savedQuestions),
        });
      }
    }

    const status = error.status >= 400 && error.status < 600 ? error.status : 500;
    res.status(status).json({
      message: status === 500 ? 'Unable to generate aptitude questions with Gemini.' : error.message,
    });
  }
};

const submitQuiz = async (req, res) => {
  try {
    const { answers = {}, questionIds = [], timeTaken = 0 } = req.body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ message: 'No questions were submitted' });
    }

    const questions = await Question.find({ _id: { $in: questionIds } })
      .select('question questionText options correctAnswer explanation category difficulty')
      .lean();

    const questionMap = new Map(questions.map((item) => [String(item._id), item]));
    const orderedQuestions = questionIds
      .map((id) => questionMap.get(String(id)))
      .filter(Boolean);

    const review = orderedQuestions.map((item) => {
      const selectedAnswer = answers[String(item._id)] || '';
      const isCorrect = selectedAnswer === item.correctAnswer;

      return {
        questionId: item._id,
        question: item.question || item.questionText,
        selectedAnswer,
        correctAnswer: item.correctAnswer,
        explanation: item.explanation,
        isCorrect,
      };
    });

    const correctAnswers = review.filter((item) => item.isCorrect).length;
    const attemptedQuestions = review.filter((item) => item.selectedAnswer).length;
    const totalQuestions = review.length;
    const wrongAnswers = attemptedQuestions - correctAnswers;
    const skippedQuestions = totalQuestions - attemptedQuestions;
    const percentage = totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : 0;

    await Result.create({
      userId: req.user._id,
      type: 'aptitude',
      topic: orderedQuestions[0]?.category || '',
      score: correctAnswers,
      totalQuestions,
      correct: correctAnswers,
      percentage,
      wrong: wrongAnswers,
      skipped: skippedQuestions,
      timeTaken: Math.max(0, Number(timeTaken) || 0),
    });

    res.status(201).json({
      score: correctAnswers,
      totalQuestions,
      attemptedQuestions,
      wrongAnswers,
      skippedQuestions,
      percentage,
      review,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { generateQuiz, getQuestions, submitQuiz };
