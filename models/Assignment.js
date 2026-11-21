const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty is required'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'evaluated', 'overdue'],
      default: 'pending',
    },
    instructions: {
      type: String,
      default: '',
      maxlength: [500, 'Instructions cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate assignment of same project to same student
assignmentSchema.index({ project: 1, assignedTo: 1 }, { unique: true });

// Virtual: check if overdue
assignmentSchema.virtual('isOverdue').get(function () {
  return this.status === 'pending' && new Date() > this.dueDate;
});

module.exports = mongoose.model('Assignment', assignmentSchema);
