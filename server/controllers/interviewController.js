const { evaluateInterviewAnswer, generateInterviewQuestion } = require('../services/geminiService');

const allowedTopics = ['HR', 'DBMS', 'OS', 'CN', 'OOPs', 'DSA'];
const validateTopic = (topic) => allowedTopics.includes(topic) ? topic : 'HR';

const nextQuestion = async (req, res) => {
  try {
    const topic = validateTopic(req.body.topic);
    const previousQuestions = Array.isArray(req.body.previousQuestions)
      ? req.body.previousQuestions.map((item) => String(item).slice(0, 300)).slice(-10)
      : [];
    res.json(await generateInterviewQuestion({ topic, previousQuestions }));
  } catch (error) {
    res.status(error.status || 500).json({ message: error.status ? error.message : 'Unable to generate an interview question.' });
  }
};

const evaluateAnswer = async (req, res) => {
  try {
    const topic = validateTopic(req.body.topic);
    const question = String(req.body.question || '').trim().slice(0, 1000);
    const answer = String(req.body.answer || '').trim().slice(0, 6000);
    if (!question || !answer) return res.status(400).json({ message: 'Question and answer are required.' });
    if (answer.length < 20) return res.status(400).json({ message: 'Write a more complete answer before requesting feedback.' });
    res.json(await evaluateInterviewAnswer({ question, answer, topic }));
  } catch (error) {
    res.status(error.status || 500).json({ message: error.status ? error.message : 'Unable to evaluate the interview answer.' });
  }
};

module.exports = { evaluateAnswer, nextQuestion };
