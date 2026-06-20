const express = require('express');
const { evaluateAnswer, nextQuestion } = require('../controllers/interviewController');
const { authorize, protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.post('/question', protect, authorize('student'), nextQuestion);
router.post('/feedback', protect, authorize('student'), evaluateAnswer);

module.exports = router;
