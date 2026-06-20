const express = require('express');
const admin = require('../controllers/adminController');
const { authorize, protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect, authorize('admin'));
router.get('/overview', admin.getOverview);
router.get('/questions', admin.listQuestions);
router.post('/questions', admin.createQuestion);
router.put('/questions/:id', admin.updateQuestion);
router.delete('/questions/:id', admin.deleteQuestion);
router.get('/coding', admin.listCodingProblems);
router.post('/coding', admin.createCodingProblem);
router.put('/coding/:id', admin.updateCodingProblem);
router.delete('/coding/:id', admin.deleteCodingProblem);
router.get('/companies', admin.listCompanies);
router.post('/companies', admin.createCompany);
router.put('/companies/:id', admin.updateCompany);
router.delete('/companies/:id', admin.deleteCompany);
router.get('/mock-tests', admin.listMockTests);
router.post('/mock-tests', admin.createMockTest);
router.put('/mock-tests/:id', admin.updateMockTest);
router.delete('/mock-tests/:id', admin.deleteMockTest);
router.get('/users', admin.listUsers);
router.get('/results', admin.listResults);
router.get('/reports', admin.getReport);

module.exports = router;
