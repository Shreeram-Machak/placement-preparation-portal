const express = require('express');
const { generateMockTest, getMockTestHistory, submitMockTest } = require('../controllers/mockTestController');
const { authorize, protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/history', protect, authorize('student'), getMockTestHistory);
router.post('/generate', protect, authorize('student'), generateMockTest);
router.post('/submit', protect, authorize('student'), submitMockTest);
module.exports = router;
