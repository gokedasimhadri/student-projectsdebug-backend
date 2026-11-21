
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/error.middleware');

// Import Routes
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const submissionRoutes = require('./routes/submission.routes');

// Initialize Express
const app = express();

// Connect to MongoDB
connectDB();

// ─── CORS CONFIGURATION ──────────────────────────────────────

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',

  // Production Frontend
  'https://student-projectsdebug-frontend.vercel.app',

  // Environment Variable
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {

    // Allow requests without origin (Postman, curl, mobile apps)
    if (!origin) {
      return callback(null, true);
    }

    // Allow configured origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error('CORS Blocked Origin:', origin);

    return callback(
      new Error(`CORS blocked: ${origin}`)
    );
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization'
  ],
};

// Apply CORS before routes
app.use(cors(corsOptions));

// ─── BODY PARSING MIDDLEWARE ─────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// ─── LOGGER ──────────────────────────────────────────────────

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── STATIC FILES ────────────────────────────────────────────

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// ─── API ROUTES ──────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);

// ─── HEALTH CHECK ────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MERN Bug Arena API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── 404 HANDLER ─────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────

app.use(errorHandler);

// ─── START SERVER ────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\n====================================');
  console.log('🚀 MERN Bug Arena Backend Started');
  console.log('====================================');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health: /api/health`);
  console.log('====================================\n');

  console.log('Allowed CORS Origins:');

  allowedOrigins.forEach((origin) => {
    console.log(`✅ ${origin}`);
  });
});
