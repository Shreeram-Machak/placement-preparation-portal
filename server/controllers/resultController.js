const mongoose = require('mongoose');
const CodingProblem = require('../models/CodingProblem');
const Result = require('../models/Result');

const clampNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
};

const getRequestUserId = (req) => String(req.user._id);

const validateUserId = (req, res) => {
  const bodyUserId = req.body.userId ? String(req.body.userId) : getRequestUserId(req);
  if (bodyUserId !== getRequestUserId(req)) {
    res.status(403).json({ message: 'You can only save results for your own account.' });
    return null;
  }
  return req.user._id;
};

const buildResultPayload = ({ req, resultType, topic = '', problemId = null }) => {
  const totalQuestions = clampNumber(req.body.totalQuestions ?? req.body.totalTests);
  const correct = clampNumber(req.body.correct ?? req.body.correctAnswers ?? req.body.score ?? req.body.passedTests);
  const submittedSkipped = req.body.skipped ?? req.body.skippedQuestions;
  const skippedQuestions = submittedSkipped === undefined
    ? 0
    : clampNumber(submittedSkipped);
  const submittedWrong = req.body.wrong ?? req.body.wrongAnswers;
  const wrongAnswers = submittedWrong === undefined
    ? Math.max(0, totalQuestions - skippedQuestions - correct)
    : clampNumber(submittedWrong);
  const computedPercentage = totalQuestions
    ? Math.round((correct / totalQuestions) * 100)
    : 0;
  const percentage = Math.min(100, clampNumber(req.body.percentage, computedPercentage));

  return {
    userId: req.user._id,
    type: resultType,
    topic: String(topic || req.body.topic || '').trim().slice(0, 80),
    problemId,
    score: clampNumber(req.body.score, correct),
    totalQuestions,
    percentage,
    correct,
    wrong: wrongAnswers,
    skipped: skippedQuestions,
    status: String(req.body.status || '').trim().slice(0, 40),
    passedTests: clampNumber(req.body.passedTests, correct),
    totalTests: clampNumber(req.body.totalTests, totalQuestions),
    language: String(req.body.language || '').trim().slice(0, 30),
    timeTaken: clampNumber(req.body.timeTaken),
  };
};

const serializeResult = (result) => ({
  id: result._id,
  userId: result.userId,
  type: result.type,
  topic: result.topic,
  problemId: result.problemId,
  score: result.score,
  totalQuestions: result.totalQuestions,
  percentage: result.percentage || (result.totalQuestions
    ? Math.round((result.correct / result.totalQuestions) * 100)
    : 0),
  correct: result.correct,
  wrong: result.wrong,
  skipped: result.skipped,
  status: result.status,
  passedTests: result.passedTests,
  totalTests: result.totalTests,
  language: result.language,
  createdAt: result.createdAt,
});

const saveResult = async (req, res) => {
  try {
    const userId = validateUserId(req, res);
    if (!userId) return;

    const resultType = String(req.body.type || '').trim();
    if (!['aptitude', 'mock-test', 'coding'].includes(resultType)) {
      return res.status(400).json({ message: 'type must be aptitude, mock-test, or coding.' });
    }

    let problemId = null;
    if (resultType === 'coding') {
      if (!mongoose.Types.ObjectId.isValid(req.body.problemId)) {
        return res.status(400).json({ message: 'Valid problemId is required for coding results.' });
      }
      const problem = await CodingProblem.findById(req.body.problemId).select('_id');
      if (!problem) return res.status(404).json({ message: 'Coding problem not found.' });
      problemId = problem._id;
    }

    const result = await Result.create(buildResultPayload({ req, resultType, problemId }));
    res.status(201).json({ message: 'Result saved.', result: serializeResult(result) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveAptitudeResult = async (req, res) => {
  req.body.type = 'aptitude';
  return saveResult(req, res);
};

const saveMockTestResult = async (req, res) => {
  req.body.type = 'mock-test';
  req.body.topic = req.body.topic || req.body.mockCompany || req.body.company || 'Placement Mock Test';
  return saveResult(req, res);
};

const getMyResults = async (req, res) => {
  try {
    const results = await Result.find({ userId: req.user._id })
      .populate('problemId', 'title')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ results: results.map(serializeResult) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllResults = async (req, res) => {
  try {
    const results = await Result.find()
      .populate('userId', 'name email role')
      .populate('problemId', 'title')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ results: results.map(serializeResult) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveCodingSubmission = async (req, res) => {
  try {
    const userId = validateUserId(req, res);
    if (!userId) return;

    if (!mongoose.Types.ObjectId.isValid(req.body.problemId)) {
      return res.status(400).json({ message: 'Valid problemId is required.' });
    }

    const problem = await CodingProblem.findById(req.body.problemId).select('_id');
    if (!problem) return res.status(404).json({ message: 'Coding problem not found.' });

    const totalTests = Math.max(1, clampNumber(req.body.totalTests, 1));
    const passedTests = Math.min(totalTests, clampNumber(req.body.passedTests));
    const status = req.body.status || (passedTests === totalTests ? 'Accepted' : 'Failed');

    const result = await Result.create({
      userId: req.user._id,
      type: 'coding',
      problemId: problem._id,
      topic: req.body.topic || 'Coding',
      score: passedTests,
      totalQuestions: totalTests,
      correct: passedTests,
      percentage: Math.round((passedTests / totalTests) * 100),
      wrong: totalTests - passedTests,
      skipped: 0,
      passedTests,
      totalTests,
      status: String(status).trim().slice(0, 40),
      language: String(req.body.language || '').trim().slice(0, 30),
      timeTaken: clampNumber(req.body.timeTaken),
    });

    res.status(201).json({ message: 'Coding submission saved.', submission: serializeResult(result) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllResults,
  getMyResults,
  saveResult,
  saveAptitudeResult,
  saveCodingSubmission,
  saveMockTestResult,
};
