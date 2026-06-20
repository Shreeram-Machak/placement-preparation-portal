const express = require('express');
const {
  applyToCompany,
  getCompanies,
  getMyApplications,
  updateApplicationStatus,
} = require('../controllers/companyController');
const { authorize, protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/', protect, getCompanies);
router.get('/applications/my', protect, authorize('student'), getMyApplications);
router.patch('/applications/:id/status', protect, authorize('admin'), updateApplicationStatus);
router.post('/:id/apply', protect, authorize('student'), applyToCompany);

module.exports = router;
