const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    techStack: {
      type: [String],
      required: [true, 'Tech stack is required'],
      default: ['MongoDB', 'Express.js', 'React.js', 'Node.js'],
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    totalMarks: {
      type: Number,
      default: 100,
    },
    // Category 1: Buggy project
    buggyProject: {
      zipFile: {
        type: String, // File path
        default: '',
      },
      originalName: {
        type: String,
        default: '',
      },
      bugsDescription: {
        type: [String], // List of intentional bugs
        default: [],
      },
      bugCount: {
        type: Number,
        default: 0,
      },
    },
    // Category 2: Correct project
    correctProject: {
      zipFile: {
        type: String, // File path
        default: '',
      },
      originalName: {
        type: String,
        default: '',
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    thumbnail: {
      type: String,
      default: '',
    },
    projectNumber: {
      type: Number,
      unique: true,
    },
  },
  { timestamps: true }
);

// Auto-increment project number
projectSchema.pre('save', async function (next) {
  if (this.isNew && !this.projectNumber) {
    const lastProject = await this.constructor.findOne().sort({ projectNumber: -1 });
    this.projectNumber = lastProject ? lastProject.projectNumber + 1 : 1;
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
