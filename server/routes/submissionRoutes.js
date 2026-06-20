const express = require('express');
const { saveCodingSubmission } = require('../controllers/resultController');
const { authorize, protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/coding', protect, authorize('student'), saveCodingSubmission);

module.exports = router;
