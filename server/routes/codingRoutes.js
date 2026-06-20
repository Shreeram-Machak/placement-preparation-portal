const express = require('express');
const { executeCode, getProblems, saveCodingResult } = require('../controllers/codingController');
const { authorize, protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/problems', protect, getProblems);
router.post('/run', protect, authorize('student'), executeCode);
router.post('/results', protect, authorize('student'), saveCodingResult);

module.exports = router;
