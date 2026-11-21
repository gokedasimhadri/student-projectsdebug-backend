const asyncHandler = require('express-async-handler');
const Assignment = require('../models/Assignment');
const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Create assignment (Faculty assigns project to student(s))
// @route   POST /api/assignments
// @access  Private (Faculty only)
const createAssignment = asyncHandler(async (req, res) => {
  const { projectId, studentIds, dueDate, instructions } = req.body;

  if (!projectId || !studentIds || !dueDate) {
    res.status(400);
    throw new Error('Project, student(s), and due date are required');
  }

  // Validate project exists
  const project = await Project.findById(projectId);
  if (!project || !project.isActive) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Validate due date is in future
  if (new Date(dueDate) <= new Date()) {
    res.status(400);
    throw new Error('Due date must be in the future');
  }

  // Support assigning to multiple students
  const studentIdArray = Array.isArray(studentIds) ? studentIds : [studentIds];

  const results = {
    successful: [],
    failed: [],
  };

  for (const studentId of studentIdArray) {
    try {
      // Validate student exists
      const student = await User.findOne({ _id: studentId, role: 'student' });
      if (!student) {
        results.failed.push({ studentId, reason: 'Student not found' });
        continue;
      }

      // Check duplicate assignment
      const existing = await Assignment.findOne({
        project: projectId,
        assignedTo: studentId,
      });

      if (existing) {
        results.failed.push({
          studentId,
          studentName: student.name,
          reason: 'Already assigned this project',
        });
        continue;
      }

      const assignment = await Assignment.create({
        project: projectId,
        assignedTo: studentId,
        assignedBy: req.user._id,
        dueDate,
        instructions: instructions || '',
      });

      await assignment.populate([
        { path: 'project', select: 'title difficulty' },
        { path: 'assignedTo', select: 'name email rollNumber' },
      ]);

      results.successful.push(assignment);
    } catch (err) {
      results.failed.push({ studentId, reason: err.message });
    }
  }

  res.status(201).json({
    success: true,
    message: `Assigned to ${results.successful.length} student(s). ${results.failed.length} failed.`,
    data: results,
  });
});

// @desc    Get all assignments
//          Faculty: sees all their assignments
//          Student: sees only their assignments
// @route   GET /api/assignments
// @access  Private
const getAssignments = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === 'faculty') {
    query.assignedBy = req.user._id;
  } else {
    query.assignedTo = req.user._id;
  }

  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }

  const assignments = await Assignment.find(query)
    .populate('project', 'title description difficulty techStack buggyProject.bugCount buggyProject.zipFile buggyProject.originalName buggyProject.bugsDescription')
    .populate('assignedTo', 'name email rollNumber department')
    .populate('assignedBy', 'name email')
    .sort({ createdAt: -1 });

  // Update overdue status
  const now = new Date();
  for (const assignment of assignments) {
    if (assignment.status === 'pending' && assignment.dueDate < now) {
      assignment.status = 'overdue';
      await assignment.save();
    }
  }

  res.json({
    success: true,
    count: assignments.length,
    data: assignments,
  });
});

// @desc    Get single assignment
// @route   GET /api/assignments/:id
// @access  Private
const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate('project')
    .populate('assignedTo', 'name email rollNumber department')
    .populate('assignedBy', 'name email');

  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }

  // Students can only see their own assignments
  if (
    req.user.role === 'student' &&
    assignment.assignedTo._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to view this assignment');
  }

  // Hide correct project from students
  if (req.user.role === 'student' && assignment.project) {
    const projectData = assignment.project.toObject();
    delete projectData.correctProject;
    assignment.project = projectData;
  }

  res.json({ success: true, data: assignment });
});

// @desc    Update assignment status or details
// @route   PATCH /api/assignments/:id
// @access  Private (Faculty only)
const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);

  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }

  if (assignment.assignedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this assignment');
  }

  assignment.dueDate = req.body.dueDate || assignment.dueDate;
  assignment.instructions = req.body.instructions ?? assignment.instructions;
  assignment.status = req.body.status || assignment.status;

  const updated = await assignment.save();
  res.json({ success: true, message: 'Assignment updated', data: updated });
});

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private (Faculty only)
const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);

  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }

  if (assignment.assignedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this assignment');
  }

  await assignment.deleteOne();
  res.json({ success: true, message: 'Assignment deleted successfully' });
});

// @desc    Get assignment stats for faculty dashboard
// @route   GET /api/assignments/stats
// @access  Private (Faculty only)
const getAssignmentStats = asyncHandler(async (req, res) => {
  const stats = await Assignment.aggregate([
    { $match: { assignedBy: req.user._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const formatted = { pending: 0, submitted: 0, evaluated: 0, overdue: 0, total: 0 };
  stats.forEach((s) => {
    formatted[s._id] = s.count;
    formatted.total += s.count;
  });

  res.json({ success: true, data: formatted });
});

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getAssignmentStats,
};
