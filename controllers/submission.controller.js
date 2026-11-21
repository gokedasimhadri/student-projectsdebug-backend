const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');

// @desc    Student submits fixed ZIP
// @route   POST /api/submissions
// @access  Private (Student only)
const createSubmission = asyncHandler(async (req, res) => {
  const { assignmentId } = req.body;

  if (!assignmentId) {
    res.status(400);
    throw new Error('Assignment ID is required');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Please upload your fixed ZIP file');
  }

  // Validate assignment
  const assignment = await Assignment.findById(assignmentId).populate('project');

  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }

  // Confirm it's the student's assignment
  if (assignment.assignedTo.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('This assignment does not belong to you');
  }

  if (assignment.status === 'evaluated') {
    res.status(400);
    throw new Error('This assignment has already been evaluated');
  }

  // Check for existing submission (re-submission)
  const existingSubmission = await Submission.findOne({
    assignment: assignmentId,
    student: req.user._id,
  }).sort({ attemptNumber: -1 });

  const attemptNumber = existingSubmission ? existingSubmission.attemptNumber + 1 : 1;

  // Delete old submission file if re-submitting
  if (existingSubmission && existingSubmission.submittedZip.zipFile) {
    if (fs.existsSync(existingSubmission.submittedZip.zipFile)) {
      fs.unlinkSync(existingSubmission.submittedZip.zipFile);
    }
    await existingSubmission.deleteOne();
  }

  const submission = await Submission.create({
    assignment: assignmentId,
    student: req.user._id,
    project: assignment.project._id,
    submittedZip: {
      zipFile: req.file.path,
      originalName: req.file.originalname,
      fileSize: req.file.size,
    },
    attemptNumber,
  });

  // Update assignment status
  assignment.status = 'submitted';
  await assignment.save();

  res.status(201).json({
    success: true,
    message: `Solution submitted successfully (Attempt #${attemptNumber})`,
    data: submission,
  });
});

// @desc    Get all submissions
//          Faculty: all submissions for their assignments
//          Student: own submissions
// @route   GET /api/submissions
// @access  Private
const getSubmissions = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === 'student') {
    query.student = req.user._id;
  }

  const submissions = await Submission.find(query)
    .populate({
      path: 'assignment',
      populate: {
        path: 'assignedBy',
        select: 'name email',
      },
    })
    .populate('student', 'name email rollNumber department')
    .populate('project', 'title difficulty buggyProject.bugsDescription buggyProject.bugCount')
    .populate('evaluation.evaluatedBy', 'name email')
    .sort({ submittedAt: -1 });

  res.json({ success: true, count: submissions.length, data: submissions });
});

// @desc    Get single submission
// @route   GET /api/submissions/:id
// @access  Private
const getSubmissionById = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id)
    .populate('assignment')
    .populate('student', 'name email rollNumber department')
    .populate('project', 'title difficulty buggyProject')
    .populate('evaluation.evaluatedBy', 'name email');

  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }

  // Students can only view their own submission
  if (
    req.user.role === 'student' &&
    submission.student._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to view this submission');
  }

  res.json({ success: true, data: submission });
});

// @desc    Faculty evaluates submission and gives marks
// @route   PATCH /api/submissions/:id/evaluate
// @access  Private (Faculty only)
const evaluateSubmission = asyncHandler(async (req, res) => {
  const { marks, feedback, bugsFixed, bugsMissed } = req.body;

  if (marks === undefined || marks === null) {
    res.status(400);
    throw new Error('Marks are required for evaluation');
  }

  if (marks < 0 || marks > 100) {
    res.status(400);
    throw new Error('Marks must be between 0 and 100');
  }

  const submission = await Submission.findById(req.params.id).populate({
    path: 'assignment',
    select: 'assignedBy status',
  });

  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }

  // Only the assigning faculty can evaluate
  if (submission.assignment.assignedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to evaluate this submission');
  }

  submission.evaluation = {
    marks,
    feedback: feedback || '',
    bugsFixed: bugsFixed || [],
    bugsMissed: bugsMissed || [],
    evaluatedBy: req.user._id,
    evaluatedAt: new Date(),
    isEvaluated: true,
  };

  await submission.save();

  // Update assignment status
  await Assignment.findByIdAndUpdate(submission.assignment._id, {
    status: 'evaluated',
  });

  await submission.populate('evaluation.evaluatedBy', 'name email');

  res.json({
    success: true,
    message: 'Submission evaluated successfully',
    data: submission,
  });
});

// @desc    Download student's submitted ZIP (Faculty only)
// @route   GET /api/submissions/:id/download
// @access  Private (Faculty only)
const downloadSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id).populate(
    'student',
    'name rollNumber'
  );

  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }

  if (
    !submission.submittedZip.zipFile ||
    !fs.existsSync(submission.submittedZip.zipFile)
  ) {
    res.status(404);
    throw new Error('Submitted file not found on server');
  }

  const filename =
    submission.submittedZip.originalName ||
    `${submission.student.name}-submission.zip`;
  res.download(submission.submittedZip.zipFile, filename);
});

// @desc    Get submission stats (marks overview)
// @route   GET /api/submissions/stats
// @access  Private (Faculty only)
const getSubmissionStats = asyncHandler(async (req, res) => {
  const stats = await Submission.aggregate([
    { $match: { 'evaluation.isEvaluated': true } },
    {
      $group: {
        _id: '$project',
        avgMarks: { $avg: '$evaluation.marks' },
        maxMarks: { $max: '$evaluation.marks' },
        minMarks: { $min: '$evaluation.marks' },
        totalSubmissions: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'projects',
        localField: '_id',
        foreignField: '_id',
        as: 'project',
      },
    },
    { $unwind: '$project' },
    { $project: { 'project.title': 1, avgMarks: 1, maxMarks: 1, minMarks: 1, totalSubmissions: 1 } },
  ]);

  res.json({ success: true, data: stats });
});

module.exports = {
  createSubmission,
  getSubmissions,
  getSubmissionById,
  evaluateSubmission,
  downloadSubmission,
  getSubmissionStats,
};
