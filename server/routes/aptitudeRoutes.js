const express = require('express');
const { generateQuiz, getQuestions, submitQuiz } = require('../controllers/aptitudeController');
const { authorize, protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/questions', protect, getQuestions);
router.post('/generate', protect, authorize('student'), generateQuiz);
router.post('/prepare', protect, authorize('student'), generateQuiz);
router.post('/submit', protect, authorize('student'), submitQuiz);

module.exports = router;
