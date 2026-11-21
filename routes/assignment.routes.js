const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getAssignmentStats,
} = require('../controllers/assignment.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

// Stats — faculty only
router.get('/stats', authorize('faculty'), getAssignmentStats);

// Both roles
router.get('/', getAssignments);
router.get('/:id', getAssignmentById);

// Faculty only
router.post('/', authorize('faculty'), createAssignment);
router.patch('/:id', authorize('faculty'), updateAssignment);
router.delete('/:id', authorize('faculty'), deleteAssignment);

module.exports = router;
