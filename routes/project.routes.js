const express = require('express');
const router = express.Router();
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  downloadBuggyZip,
  downloadCorrectZip,
} = require('../controllers/project.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { uploadProjectFiles } = require('../middleware/upload.middleware');

// All routes require login
router.use(protect);

// Both roles can view
router.get('/', getAllProjects);
router.get('/:id', getProjectById);

// Download routes
router.get('/:id/download/buggy', downloadBuggyZip);
router.get('/:id/download/correct', authorize('faculty'), downloadCorrectZip);

// Faculty only
router.post('/', authorize('faculty'), uploadProjectFiles, createProject);
router.put('/:id', authorize('faculty'), uploadProjectFiles, updateProject);
router.delete('/:id', authorize('faculty'), deleteProject);

module.exports = router;
