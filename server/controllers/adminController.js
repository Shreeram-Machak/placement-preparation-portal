const CodingProblem = require('../models/CodingProblem');
const Company = require('../models/Company');
const MockTestDefinition = require('../models/MockTestDefinition');
const Question = require('../models/Question');
const TestResult = require('../models/TestResult');
const User = require('../models/User');

const startOfUtcDay = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
const percentage = (correct, total) => (total ? Math.round((correct / total) * 100) : 0);

const buildDailySeries = (items, dateField = 'createdAt', days = 7) => {
  const dayMap = new Map();
  Array.from({ length: days }, (_, index) => {
    const date = startOfUtcDay(new Date());
    date.setUTCDate(date.getUTCDate() - (days - 1 - index));
    const key = date.toISOString().slice(0, 10);
    dayMap.set(key, { date: key.slice(5), count: 0 });
    return key;
  });

  items.forEach((item) => {
    const key = startOfUtcDay(new Date(item[dateField])).toISOString().slice(0, 10);
    if (dayMap.has(key)) dayMap.get(key).count += 1;
  });

  return [...dayMap.values()];
};

const sendError = (res, error, fallback) => res.status(error.name === 'ValidationError' ? 400 : 500).json({
  message: error.code === 11000 ? 'An item with this name already exists.' : error.message || fallback,
});

const getOverview = async (req, res) => {
  try {
    const [students, admins, questions, codingProblems, mockTests, activeCompanies, results, recentRegistrations, recentUsers] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'admin' }),
      Question.countDocuments(),
      CodingProblem.countDocuments(),
      MockTestDefinition.countDocuments(),
      Company.countDocuments(),
      TestResult.find().select('testType correctAnswers totalQuestions createdAt').sort({ createdAt: -1 }).lean(),
      User.find({ role: 'student' }).select('name email createdAt').sort({ createdAt: -1 }).limit(5).lean(),
      User.find({ role: 'student' }).select('createdAt').sort({ createdAt: -1 }).lean(),
    ]);
    const attemptsPerDay = buildDailySeries(results);
    const weeklyUserGrowth = buildDailySeries(recentUsers);
    const aptitude = results.filter((item) => item.testType === 'aptitude');
    const coding = results.filter((item) => item.testType === 'coding');
    const sumFor = (items, field) => items.reduce((sum, item) => sum + (item[field] || 0), 0);

    res.json({
      totalStudents: students,
      totalAdmins: admins,
      totalQuestions: questions,
      codingProblems,
      totalMockTests: mockTests,
      activeCompanies,
      totalResults: results.length,
      recentRegistrations,
      weeklyUserGrowth,
      testAttemptsPerDay: attemptsPerDay,
      performanceComparison: [
        { module: 'Aptitude', score: percentage(sumFor(aptitude, 'correctAnswers'), sumFor(aptitude, 'totalQuestions')) },
        { module: 'Coding', score: percentage(sumFor(coding, 'correctAnswers'), sumFor(coding, 'totalQuestions')) },
      ],
    });
  } catch (error) { sendError(res, error, 'Unable to load admin overview.'); }
};

const listQuestions = async (req, res) => {
  try { res.json(await Question.find().sort({ createdAt: -1 }).lean()); }
  catch (error) { sendError(res, error, 'Unable to load questions.'); }
};

const createQuestion = async (req, res) => {
  try { res.status(201).json(await Question.create(req.body)); }
  catch (error) { sendError(res, error, 'Unable to create question.'); }
};

const updateQuestion = async (req, res) => {
  try {
    const item = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Question not found.' });
    res.json(item);
  } catch (error) { sendError(res, error, 'Unable to update question.'); }
};

const deleteQuestion = async (req, res) => {
  try {
    const item = await Question.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Question not found.' });
    res.json({ message: 'Question deleted.' });
  } catch (error) { sendError(res, error, 'Unable to delete question.'); }
};

const listCodingProblems = async (req, res) => {
  try { res.json(await CodingProblem.find().sort({ createdAt: -1 }).lean()); }
  catch (error) { sendError(res, error, 'Unable to load coding problems.'); }
};

const createCodingProblem = async (req, res) => {
  try { res.status(201).json(await CodingProblem.create(req.body)); }
  catch (error) { sendError(res, error, 'Unable to create coding problem.'); }
};

const updateCodingProblem = async (req, res) => {
  try {
    const item = await CodingProblem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Coding problem not found.' });
    res.json(item);
  } catch (error) { sendError(res, error, 'Unable to update coding problem.'); }
};

const deleteCodingProblem = async (req, res) => {
  try {
    const item = await CodingProblem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Coding problem not found.' });
    res.json({ message: 'Coding problem deleted.' });
  } catch (error) { sendError(res, error, 'Unable to delete coding problem.'); }
};

const listCompanies = async (req, res) => {
  try { res.json(await Company.find().sort({ name: 1 }).lean()); }
  catch (error) { sendError(res, error, 'Unable to load companies.'); }
};

const createCompany = async (req, res) => {
  try { res.status(201).json(await Company.create(req.body)); }
  catch (error) { sendError(res, error, 'Unable to create company.'); }
};

const updateCompany = async (req, res) => {
  try {
    const item = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Company not found.' });
    res.json(item);
  } catch (error) { sendError(res, error, 'Unable to update company.'); }
};

const deleteCompany = async (req, res) => {
  try {
    const item = await Company.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Company not found.' });
    await MockTestDefinition.updateMany({ company: item._id }, { $set: { company: null } });
    res.json({ message: 'Company deleted.' });
  } catch (error) { sendError(res, error, 'Unable to delete company.'); }
};

const listMockTests = async (req, res) => {
  try { res.json(await MockTestDefinition.find().populate('company', 'name').sort({ createdAt: -1 }).lean()); }
  catch (error) { sendError(res, error, 'Unable to load mock tests.'); }
};

const createMockTest = async (req, res) => {
  try { res.status(201).json(await (await MockTestDefinition.create(req.body)).populate('company', 'name')); }
  catch (error) { sendError(res, error, 'Unable to create mock test.'); }
};

const updateMockTest = async (req, res) => {
  try {
    const item = await MockTestDefinition.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('company', 'name');
    if (!item) return res.status(404).json({ message: 'Mock test not found.' });
    res.json(item);
  } catch (error) { sendError(res, error, 'Unable to update mock test.'); }
};

const deleteMockTest = async (req, res) => {
  try {
    const item = await MockTestDefinition.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Mock test not found.' });
    res.json({ message: 'Mock test deleted.' });
  } catch (error) { sendError(res, error, 'Unable to delete mock test.'); }
};

const listUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 }).lean();
    const results = await TestResult.find({ user: { $in: users.map((user) => user._id) } })
      .select('user correctAnswers totalQuestions createdAt')
      .lean();
    const now = startOfUtcDay(new Date()).getTime();
    const day = 24 * 60 * 60 * 1000;
    const enrichedUsers = users.map((user) => {
      const userResults = results.filter((result) => String(result.user) === String(user._id));
      const correct = userResults.reduce((sum, result) => sum + result.correctAnswers, 0);
      const total = userResults.reduce((sum, result) => sum + result.totalQuestions, 0);
      const activityDays = [...new Set(userResults.map((result) => startOfUtcDay(new Date(result.createdAt)).getTime()))]
        .sort((first, second) => second - first);
      let streak = 0;
      if (activityDays.length && now - activityDays[0] <= day) {
        streak = 1;
        for (let index = 1; index < activityDays.length; index += 1) {
          if (activityDays[index - 1] - activityDays[index] !== day) break;
          streak += 1;
        }
      }
      return {
        ...user,
        testsTaken: userResults.length,
        averageScore: percentage(correct, total),
        streak,
        status: userResults.length ? 'Active' : 'New',
      };
    });
    res.json(enrichedUsers);
  }
  catch (error) { sendError(res, error, 'Unable to load users.'); }
};

const listResults = async (req, res) => {
  try {
    const results = await TestResult.find().populate('user', 'name email role').populate('codingProblem', 'title').sort({ createdAt: -1 }).limit(500).lean();
    res.json(results);
  } catch (error) { sendError(res, error, 'Unable to load results.'); }
};

const getReport = async (req, res) => {
  try {
    const [byType, recentResults, topicAttempts, codingProblems] = await Promise.all([
      TestResult.aggregate([
      { $group: { _id: '$testType', attempts: { $sum: 1 }, averageScore: { $avg: { $cond: [{ $gt: ['$totalQuestions', 0] }, { $multiply: [{ $divide: ['$correctAnswers', '$totalQuestions'] }, 100] }, 0] } } } },
      { $sort: { _id: 1 } },
      ]),
      TestResult.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(100).lean(),
      Question.aggregate([
        { $group: { _id: '$category', attempts: { $sum: 1 } } },
        { $sort: { attempts: -1 } },
      ]),
      CodingProblem.countDocuments(),
    ]);
    const allResults = await TestResult.find().select('testType correctAnswers totalQuestions createdAt').lean();
    const aptitudeResults = allResults.filter((item) => item.testType === 'aptitude');
    const codingResults = allResults.filter((item) => item.testType === 'coding');
    const mockResults = allResults.filter((item) => item.testType === 'mock-test');
    const sumFor = (items, field) => items.reduce((sum, item) => sum + (item[field] || 0), 0);
    const codingSolved = codingResults.filter((item) => item.correctAnswers === item.totalQuestions).length;

    res.json({
      generatedAt: new Date(),
      byType,
      recentResults,
      mostAttemptedTopics: topicAttempts.map((item) => ({ topic: item._id || 'General', attempts: item.attempts })),
      dailyAttempts: buildDailySeries(allResults, 'createdAt', 14),
      summary: {
        averageAptitudeScore: percentage(sumFor(aptitudeResults, 'correctAnswers'), sumFor(aptitudeResults, 'totalQuestions')),
        codingCompletionRate: codingProblems ? Math.round((codingSolved / codingProblems) * 100) : 0,
        mockTestPerformance: percentage(sumFor(mockResults, 'correctAnswers'), sumFor(mockResults, 'totalQuestions')),
      },
    });
  } catch (error) { sendError(res, error, 'Unable to generate report.'); }
};

module.exports = {
  createCodingProblem, createCompany, createMockTest, createQuestion, deleteCodingProblem,
  deleteCompany, deleteMockTest, deleteQuestion, getOverview, getReport, listCodingProblems,
  listCompanies, listMockTests, listQuestions, listResults, listUsers, updateCodingProblem,
  updateCompany, updateMockTest, updateQuestion,
};
