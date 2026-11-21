const express = require('express');
const router = express.Router();
const {
  createSubmission,
  getSubmissions,
  getSubmissionById,
  evaluateSubmission,
  downloadSubmission,
  getSubmissionStats,
} = require('../controllers/submission.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { uploadSubmission } = require('../middleware/upload.middleware');

router.use(protect);

// Stats — faculty only
router.get('/stats', authorize('faculty'), getSubmissionStats);

// Both roles — filtered by role in controller
router.get('/', getSubmissions);
router.get('/:id', getSubmissionById);

// Student only — submit solution
router.post('/', authorize('student'), uploadSubmission, createSubmission);

// Faculty only — evaluate and download
router.patch('/:id/evaluate', authorize('faculty'), evaluateSubmission);
router.get('/:id/download', authorize('faculty'), downloadSubmission);

module.exports = router;
