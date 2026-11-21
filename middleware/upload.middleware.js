const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage for project ZIPs (buggy + correct)
const projectStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/projects');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `project-${uniqueSuffix}${ext}`);
  },
});

// Storage for student submissions
const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/submissions');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `submission-${uniqueSuffix}${ext}`);
  },
});

// File filter: only ZIP files
const zipFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream',
    'application/x-zip',
  ];
  const allowedExts = ['.zip', '.ZIP'];
  const ext = path.extname(file.originalname);

  if (allowedMimeTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only ZIP files are allowed!'), false);
  }
};

const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 52428800; // 50MB default

// Upload for project (buggy + correct) — 2 files
const uploadProjectFiles = multer({
  storage: projectStorage,
  fileFilter: zipFileFilter,
  limits: { fileSize: maxSize },
}).fields([
  { name: 'buggyZip', maxCount: 1 },
  { name: 'correctZip', maxCount: 1 },
]);

// Upload for student submission — 1 file
const uploadSubmission = multer({
  storage: submissionStorage,
  fileFilter: zipFileFilter,
  limits: { fileSize: maxSize },
}).single('submittedZip');

module.exports = { uploadProjectFiles, uploadSubmission };
