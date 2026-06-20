const CodingProblem = require('../models/CodingProblem');
const Result = require('../models/Result');
const { runCode, runCustomInput } = require('../services/codeRunnerService');

const starterProblems = [
  {
    title: 'Sum of Two Numbers',
    difficulty: 'easy',
    description: 'Read two integers and return their sum.',
    constraints: '-10^9 <= a, b <= 10^9',
    sampleInput: '4 7',
    sampleOutput: '11',
    tags: ['math', 'basics'],
    testCases: [
      { input: '4 7', output: '11' },
      { input: '-5 8', output: '3' },
      { input: '100 250', output: '350', isHidden: true },
    ],
  },
  {
    title: 'Reverse a String',
    difficulty: 'easy',
    description: 'Return the supplied string in reverse order.',
    constraints: '1 <= string length <= 1000',
    sampleInput: 'placement',
    sampleOutput: 'tnemecalp',
    tags: ['strings'],
    testCases: [
      { input: 'placement', output: 'tnemecalp' },
      { input: 'code', output: 'edoc' },
      { input: 'level', output: 'level', isHidden: true },
    ],
  },
  {
    title: 'Find the Maximum',
    difficulty: 'medium',
    description: 'Given space-separated integers, return the largest value.',
    constraints: '1 <= number count <= 10^5',
    sampleInput: '5 12 3 19 7',
    sampleOutput: '19',
    tags: ['arrays'],
    testCases: [
      { input: '5 12 3 19 7', output: '19' },
      { input: '-8 -2 -15', output: '-2' },
      { input: '42', output: '42', isHidden: true },
    ],
  },
  {
    title: 'Count Vowels',
    difficulty: 'easy',
    description: 'Return the number of vowels in the supplied string.',
    constraints: '1 <= string length <= 1000',
    sampleInput: 'interview',
    sampleOutput: '4',
    tags: ['strings', 'counting'],
    testCases: [
      { input: 'interview', output: '4' },
      { input: 'rhythm', output: '0' },
      { input: 'AEIOU', output: '5', isHidden: true },
    ],
  },
  {
    title: 'Palindrome Check',
    difficulty: 'medium',
    description: 'Return true when the input string reads the same forwards and backwards.',
    constraints: '1 <= string length <= 1000',
    sampleInput: 'level',
    sampleOutput: 'true',
    tags: ['strings', 'two-pointers'],
    testCases: [
      { input: 'level', output: 'true' },
      { input: 'coding', output: 'false' },
      { input: 'madam', output: 'true', isHidden: true },
    ],
  },
  {
    title: 'Second Largest Number',
    difficulty: 'medium',
    description: 'Return the second largest distinct number from space-separated integers.',
    constraints: '2 <= number count <= 10^5',
    sampleInput: '10 5 8 10 3',
    sampleOutput: '8',
    tags: ['arrays', 'sorting'],
    testCases: [
      { input: '10 5 8 10 3', output: '8' },
      { input: '4 1 2 3', output: '3' },
      { input: '-1 -5 -2', output: '-2', isHidden: true },
    ],
  },
  {
    title: 'Valid Parentheses',
    difficulty: 'hard',
    description: 'Return true if every bracket in the string is correctly matched and nested.',
    constraints: '1 <= string length <= 10^5',
    sampleInput: '{[()]}',
    sampleOutput: 'true',
    tags: ['stack', 'strings'],
    testCases: [
      { input: '{[()]}', output: 'true' },
      { input: '([)]', output: 'false' },
      { input: '(()', output: 'false', isHidden: true },
    ],
  },
  {
    title: 'Longest Word',
    difficulty: 'medium',
    description: 'Return the longest word in the sentence. If tied, return the first one.',
    constraints: '1 <= sentence length <= 10^4',
    sampleInput: 'practice makes placement perfect',
    sampleOutput: 'placement',
    tags: ['strings'],
    testCases: [
      { input: 'practice makes placement perfect', output: 'placement' },
      { input: 'code every day', output: 'every' },
      { input: 'one three seven', output: 'three', isHidden: true },
    ],
  },
  {
    title: 'Array Rotation',
    difficulty: 'hard',
    description: 'The first number is k. Rotate the remaining numbers to the right by k positions and return them space-separated.',
    constraints: '1 <= array length <= 10^5',
    sampleInput: '2\n1 2 3 4 5',
    sampleOutput: '4 5 1 2 3',
    tags: ['arrays', 'rotation'],
    testCases: [
      { input: '2\n1 2 3 4 5', output: '4 5 1 2 3' },
      { input: '1\n7 8 9', output: '9 7 8' },
      { input: '3\n1 2 3', output: '1 2 3', isHidden: true },
    ],
  },
  {
    title: 'Even or Odd',
    difficulty: 'easy',
    description: 'Return Even if the input integer is even, otherwise return Odd.',
    constraints: '-10^9 <= n <= 10^9',
    sampleInput: '24',
    sampleOutput: 'Even',
    tags: ['math', 'conditionals'],
    testCases: [
      { input: '24', output: 'Even' },
      { input: '17', output: 'Odd' },
      { input: '-8', output: 'Even', isHidden: true },
    ],
  },
  {
    title: 'Factorial',
    difficulty: 'easy',
    description: 'Return the factorial of the non-negative input integer.',
    constraints: '0 <= n <= 12',
    sampleInput: '5',
    sampleOutput: '120',
    tags: ['math', 'loops'],
    testCases: [
      { input: '5', output: '120' },
      { input: '0', output: '1' },
      { input: '7', output: '5040', isHidden: true },
    ],
  },
  {
    title: 'Sum of Array',
    difficulty: 'easy',
    description: 'Return the sum of all space-separated integers.',
    constraints: '1 <= number count <= 10^5',
    sampleInput: '1 2 3 4 5',
    sampleOutput: '15',
    tags: ['arrays', 'math'],
    testCases: [
      { input: '1 2 3 4 5', output: '15' },
      { input: '-3 10 -2', output: '5' },
      { input: '100', output: '100', isHidden: true },
    ],
  },
  {
    title: 'Remove Duplicates',
    difficulty: 'medium',
    description: 'Remove duplicate space-separated integers while preserving their first-seen order.',
    constraints: '1 <= number count <= 10^5',
    sampleInput: '1 2 2 3 1 4',
    sampleOutput: '1 2 3 4',
    tags: ['arrays', 'hashing'],
    testCases: [
      { input: '1 2 2 3 1 4', output: '1 2 3 4' },
      { input: '5 5 5', output: '5' },
      { input: '-1 0 -1 2', output: '-1 0 2', isHidden: true },
    ],
  },
  {
    title: 'Character Frequency',
    difficulty: 'medium',
    description: 'The first line contains a string and the second line a character. Return its occurrence count.',
    constraints: '1 <= string length <= 10^5',
    sampleInput: 'placement preparation\na',
    sampleOutput: '3',
    tags: ['strings', 'hashing'],
    testCases: [
      { input: 'placement preparation\na', output: '3' },
      { input: 'mississippi\ns', output: '4' },
      { input: 'coding\nz', output: '0', isHidden: true },
    ],
  },
  {
    title: 'Binary Search',
    difficulty: 'medium',
    description: 'The first line is a sorted array and the second line is the target. Return its zero-based index or -1.',
    constraints: '1 <= array length <= 10^5',
    sampleInput: '1 3 5 7 9\n7',
    sampleOutput: '3',
    tags: ['arrays', 'searching'],
    testCases: [
      { input: '1 3 5 7 9\n7', output: '3' },
      { input: '2 4 6 8\n5', output: '-1' },
      { input: '-5 -1 0 4\n-5', output: '0', isHidden: true },
    ],
  },
  {
    title: 'Anagram Check',
    difficulty: 'medium',
    description: 'Two words are provided on separate lines. Return true if they are anagrams, otherwise false.',
    constraints: '1 <= word length <= 10^5',
    sampleInput: 'listen\nsilent',
    sampleOutput: 'true',
    tags: ['strings', 'sorting'],
    testCases: [
      { input: 'listen\nsilent', output: 'true' },
      { input: 'hello\nworld', output: 'false' },
      { input: 'triangle\nintegral', output: 'true', isHidden: true },
    ],
  },
  {
    title: 'Maximum Subarray Sum',
    difficulty: 'hard',
    description: 'Return the maximum possible sum of a contiguous subarray.',
    constraints: '1 <= array length <= 10^5',
    sampleInput: '-2 1 -3 4 -1 2 1 -5 4',
    sampleOutput: '6',
    tags: ['arrays', 'dynamic-programming'],
    testCases: [
      { input: '-2 1 -3 4 -1 2 1 -5 4', output: '6' },
      { input: '-5 -2 -8', output: '-2' },
      { input: '1 2 3 4', output: '10', isHidden: true },
    ],
  },
  {
    title: 'Merge Sorted Arrays',
    difficulty: 'hard',
    description: 'Two sorted arrays are provided on separate lines. Return one merged sorted array.',
    constraints: 'Combined length <= 2 * 10^5',
    sampleInput: '1 3 5\n2 4 6',
    sampleOutput: '1 2 3 4 5 6',
    tags: ['arrays', 'two-pointers'],
    testCases: [
      { input: '1 3 5\n2 4 6', output: '1 2 3 4 5 6' },
      { input: '1 2\n3 4', output: '1 2 3 4' },
      { input: '-3 0 7\n-2 5', output: '-3 -2 0 5 7', isHidden: true },
    ],
  },
  {
    title: 'First Non-Repeating Character',
    difficulty: 'hard',
    description: 'Return the first character that appears exactly once, or -1 if none exists.',
    constraints: '1 <= string length <= 10^5',
    sampleInput: 'swiss',
    sampleOutput: 'w',
    tags: ['strings', 'hashing'],
    testCases: [
      { input: 'swiss', output: 'w' },
      { input: 'aabbcc', output: '-1' },
      { input: 'placement', output: 'p', isHidden: true },
    ],
  },
  {
    title: 'Climbing Stairs',
    difficulty: 'hard',
    description: 'You may climb one or two steps at a time. Return the number of distinct ways to reach step n.',
    constraints: '1 <= n <= 45',
    sampleInput: '5',
    sampleOutput: '8',
    tags: ['dynamic-programming'],
    testCases: [
      { input: '5', output: '8' },
      { input: '2', output: '2' },
      { input: '10', output: '89', isHidden: true },
    ],
  },
];

const ensureStarterProblems = async () => {
  await Promise.all(starterProblems.map((problem) => CodingProblem.updateOne(
    { title: problem.title },
    { $setOnInsert: problem },
    { upsert: true },
  )));
};

const calculateStreak = (results) => {
  const day = 24 * 60 * 60 * 1000;
  const dates = [...new Set(results.map((result) => {
    const date = new Date(result.createdAt);
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }))].sort((a, b) => b - a);

  if (!dates.length) return 0;
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (today - dates[0] > day) return 0;

  let streak = 1;
  for (let index = 1; index < dates.length; index += 1) {
    if (dates[index - 1] - dates[index] !== day) break;
    streak += 1;
  }
  return streak;
};

const getProblems = async (req, res) => {
  try {
    await ensureStarterProblems();
    const filter = ['easy', 'medium', 'hard'].includes(req.query.difficulty)
      ? { difficulty: req.query.difficulty }
      : {};
    const problems = await CodingProblem.find(filter).sort({ difficulty: 1, createdAt: 1 }).lean();
    const results = await Result.find({
      userId: req.user._id,
      type: 'coding',
      problemId: { $ne: null },
    }).select('problemId correct totalQuestions createdAt').lean();
    const statusMap = new Map();

    results.forEach((result) => {
      const problemId = String(result.problemId);
      const status = result.correct === result.totalQuestions ? 'solved' : 'attempted';
      if (status === 'solved' || !statusMap.has(problemId)) statusMap.set(problemId, status);
    });

    const allProblemCounts = await CodingProblem.aggregate([
      { $group: { _id: '$difficulty', count: { $sum: 1 } } },
    ]);
    const difficultyStats = { easy: 0, medium: 0, hard: 0 };
    allProblemCounts.forEach((item) => { difficultyStats[item._id] = item.count; });

    res.json({
      problems: problems.map((problem) => ({
        ...problem,
        status: statusMap.get(String(problem._id)) || 'not-started',
      })),
      stats: {
        total: await CodingProblem.countDocuments(),
        solved: [...statusMap.values()].filter((status) => status === 'solved').length,
        streak: calculateStreak(results),
        difficulties: difficultyStats,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveCodingResult = async (req, res) => {
  try {
    const { language = '', problemId, passedTests = 0, status = '', totalTests = 0, timeTaken = 0 } = req.body;
    const problem = await CodingProblem.findById(problemId).select('_id');
    if (!problem) return res.status(404).json({ message: 'Coding problem not found' });

    const safeTotal = Math.max(1, Number(totalTests) || 1);
    const safePassed = Math.min(safeTotal, Math.max(0, Number(passedTests) || 0));

    const result = await Result.create({
      userId: req.user._id,
      type: 'coding',
      topic: 'Coding',
      problemId: problem._id,
      score: safePassed,
      totalQuestions: safeTotal,
      correct: safePassed,
      percentage: Math.round((safePassed / safeTotal) * 100),
      wrong: safeTotal - safePassed,
      skipped: 0,
      passedTests: safePassed,
      totalTests: safeTotal,
      status: String(status || (safePassed === safeTotal ? 'Accepted' : 'Failed')).trim().slice(0, 40),
      language: String(language).trim().slice(0, 30),
      timeTaken: Math.max(0, Number(timeTaken) || 0),
    });

    res.status(201).json({
      resultId: result._id,
      passedTests: safePassed,
      totalTests: safeTotal,
      solved: safePassed === safeTotal,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const executeCode = async (req, res) => {
  try {
    const { problemId, language = 'javascript', code = '', customInput } = req.body;
    if (!['javascript', 'python', 'java', 'cpp'].includes(language)) {
      return res.status(400).json({ message: 'Unsupported coding language' });
    }
    if (!String(code).trim()) return res.status(400).json({ message: 'Code is required' });

    const problem = await CodingProblem.findById(problemId).lean();
    if (!problem) return res.status(404).json({ message: 'Coding problem not found' });

    if (typeof customInput === 'string') {
      const customResult = await runCustomInput({ language, code, input: customInput });
      return res.json({ customResult });
    }

    const execution = await runCode({ language, code, testCases: problem.testCases });
    res.json({
      results: execution.results,
      passedTests: execution.results.filter((result) => result.passed).length,
      totalTests: execution.results.length,
      runtimeMs: Math.round(execution.runtimeMs),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { ensureStarterProblems, executeCode, getProblems, saveCodingResult };
