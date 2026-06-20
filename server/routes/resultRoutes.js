const express = require('express');
const {
  getAllResults,
  getMyResults,
  saveResult,
  saveAptitudeResult,
  saveMockTestResult,
} = require('../controllers/resultController');
const { authorize, protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, authorize('student'), saveResult);
router.post('/aptitude', protect, authorize('student'), saveAptitudeResult);
router.post('/mock-test', protect, authorize('student'), saveMockTestResult);
router.get('/my', protect, getMyResults);
router.get('/my-results', protect, getMyResults);
router.get('/admin/all', protect, authorize('admin'), getAllResults);

module.exports = router;
