const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const Project = require('../models/Project');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getAllProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ isActive: true })
    .populate('createdBy', 'name email')
    .sort({ projectNumber: 1 });

  res.json({
    success: true,
    count: projects.length,
    data: projects,
  });
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).populate(
    'createdBy',
    'name email'
  );

  if (!project || !project.isActive) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Students cannot see correct project file path
  const projectData = project.toObject();
  if (req.user.role === 'student') {
    delete projectData.correctProject;
  }

  res.json({ success: true, data: projectData });
});

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Faculty only)
const createProject = asyncHandler(async (req, res) => {
  const { title, description, techStack, difficulty, totalMarks, bugsDescription } = req.body;

  if (!title || !description) {
    res.status(400);
    throw new Error('Title and description are required');
  }

  // Check project limit per faculty
  const existingCount = await Project.countDocuments({
    createdBy: req.user._id,
    isActive: true,
  });

  if (existingCount >= 10) {
    res.status(400);
    throw new Error('Maximum 10 projects allowed per faculty account');
  }

  const projectData = {
    title,
    description,
    techStack: techStack
      ? JSON.parse(techStack)
      : ['MongoDB', 'Express.js', 'React.js', 'Node.js'],
    difficulty: difficulty || 'Medium',
    totalMarks: totalMarks || 100,
    createdBy: req.user._id,
    buggyProject: {
      bugsDescription: bugsDescription ? JSON.parse(bugsDescription) : [],
      bugCount: bugsDescription ? JSON.parse(bugsDescription).length : 0,
    },
  };

  // Handle uploaded files
  if (req.files) {
    if (req.files.buggyZip) {
      projectData.buggyProject.zipFile = req.files.buggyZip[0].path;
      projectData.buggyProject.originalName = req.files.buggyZip[0].originalname;
    }
    if (req.files.correctZip) {
      projectData.correctProject = {
        zipFile: req.files.correctZip[0].path,
        originalName: req.files.correctZip[0].originalname,
      };
    }
  }

  const project = await Project.create(projectData);

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: project,
  });
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Faculty only)
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project || !project.isActive) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Only the creator can update
  if (project.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this project');
  }

  const { title, description, techStack, difficulty, totalMarks, bugsDescription } = req.body;

  project.title = title || project.title;
  project.description = description || project.description;
  project.difficulty = difficulty || project.difficulty;
  project.totalMarks = totalMarks || project.totalMarks;

  if (techStack) project.techStack = JSON.parse(techStack);
  if (bugsDescription) {
    const bugs = JSON.parse(bugsDescription);
    project.buggyProject.bugsDescription = bugs;
    project.buggyProject.bugCount = bugs.length;
  }

  // Handle new file uploads
  if (req.files) {
    if (req.files.buggyZip) {
      // Delete old file
      if (project.buggyProject.zipFile && fs.existsSync(project.buggyProject.zipFile)) {
        fs.unlinkSync(project.buggyProject.zipFile);
      }
      project.buggyProject.zipFile = req.files.buggyZip[0].path;
      project.buggyProject.originalName = req.files.buggyZip[0].originalname;
    }
    if (req.files.correctZip) {
      if (project.correctProject.zipFile && fs.existsSync(project.correctProject.zipFile)) {
        fs.unlinkSync(project.correctProject.zipFile);
      }
      project.correctProject.zipFile = req.files.correctZip[0].path;
      project.correctProject.originalName = req.files.correctZip[0].originalname;
    }
  }

  const updatedProject = await project.save();
  res.json({ success: true, message: 'Project updated', data: updatedProject });
});

// @desc    Delete project (soft delete)
// @route   DELETE /api/projects/:id
// @access  Private (Faculty only)
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project || !project.isActive) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (project.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this project');
  }

  project.isActive = false;
  await project.save();

  res.json({ success: true, message: 'Project deleted successfully' });
});

// @desc    Download buggy ZIP
// @route   GET /api/projects/:id/download/buggy
// @access  Private (Both roles, but students need assignment)
const downloadBuggyZip = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project || !project.isActive) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (!project.buggyProject.zipFile || !fs.existsSync(project.buggyProject.zipFile)) {
    res.status(404);
    throw new Error('Buggy ZIP file not found');
  }

  const filename = project.buggyProject.originalName || `${project.title}-buggy.zip`;
  res.download(project.buggyProject.zipFile, filename);
});

// @desc    Download correct ZIP (Faculty only)
// @route   GET /api/projects/:id/download/correct
// @access  Private (Faculty only)
const downloadCorrectZip = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project || !project.isActive) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (!project.correctProject.zipFile || !fs.existsSync(project.correctProject.zipFile)) {
    res.status(404);
    throw new Error('Correct ZIP file not found');
  }

  const filename = project.correctProject.originalName || `${project.title}-correct.zip`;
  res.download(project.correctProject.zipFile, filename);
});

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  downloadBuggyZip,
  downloadCorrectZip,
};
