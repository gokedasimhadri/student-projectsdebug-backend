const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
    },
    submittedZip: {
      zipFile: {
        type: String,
        required: [true, 'Submitted ZIP file is required'],
      },
      originalName: {
        type: String,
        default: '',
      },
      fileSize: {
        type: Number,
        default: 0,
      },
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    // Re-submission count
    attemptNumber: {
      type: Number,
      default: 1,
    },
    // Evaluation by faculty
    evaluation: {
      marks: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },
      grade: {
        type: String,
        enum: ['A+', 'A', 'B+', 'B', 'C', 'D', 'F', null],
        default: null,
      },
      feedback: {
        type: String,
        default: '',
        maxlength: [1000, 'Feedback cannot exceed 1000 characters'],
      },
      bugsFixed: {
        type: [String],
        default: [],
      },
      bugsMissed: {
        type: [String],
        default: [],
      },
      evaluatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      evaluatedAt: {
        type: Date,
        default: null,
      },
      isEvaluated: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

// Auto-calculate grade from marks
submissionSchema.pre('save', function (next) {
  if (this.evaluation.marks !== null) {
    const marks = this.evaluation.marks;
    if (marks >= 90) this.evaluation.grade = 'A+';
    else if (marks >= 80) this.evaluation.grade = 'A';
    else if (marks >= 70) this.evaluation.grade = 'B+';
    else if (marks >= 60) this.evaluation.grade = 'B';
    else if (marks >= 50) this.evaluation.grade = 'C';
    else if (marks >= 40) this.evaluation.grade = 'D';
    else this.evaluation.grade = 'F';
  }
  next();
});

module.exports = mongoose.model('Submission', submissionSchema);
