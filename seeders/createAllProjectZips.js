const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const Project = require('../models/Project');
const User = require('../models/User');

const uploadsDir = path.resolve(__dirname, '../uploads/projects');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper to create a zip file with given entries via PowerShell
const createZipArchive = (outputPath, files) => {
  const tempDir = path.resolve(__dirname, '../uploads/temp_' + Date.now() + '_' + Math.random().toString(36).substring(7));
  fs.mkdirSync(tempDir, { recursive: true });
  for (const file of files) {
    const fullPath = path.resolve(tempDir, file.name);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, file.content, 'utf8');
  }
  if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${outputPath}' -Force"`);
  fs.rmSync(tempDir, { recursive: true, force: true });
  return outputPath;
};

// ─── 10 Complete Projects Code Templates ────────────────────────────
const getProjectFiles = (projectNumber, isBuggy) => {
  const bugNote = isBuggy
    ? `\n> ⚠️ **DEBUG CHALLENGE:** This project contains intentional bugs! Find and fix them before submitting back to your faculty.`
    : `\n> ✅ **SOLUTION CODE:** This is the clean, working reference project.`;

  switch (projectNumber) {
    case 1: // Todo List App
      return [
        {
          name: 'README.md',
          content: `# Todo List App (MERN Stack)${bugNote}

## Getting Started
1. Run \`cd server && npm install && npm start\`
2. Run \`cd client && npm install && npm start\`

## Bug Checklist to solve:
- useEffect infinite re-render loop
- DELETE route HTTP method mismatch
- Missing 'completed' field in Todo Mongoose schema
- Client API port configuration
`,
        },
        {
          name: 'server/package.json',
          content: JSON.stringify({
            name: 'todo-server',
            version: '1.0.0',
            main: 'server.js',
            scripts: { start: 'node server.js' },
            dependencies: { express: '^4.18.2', mongoose: '^7.6.3', cors: '^2.8.5', dotenv: '^16.3.1' }
          }, null, 2),
        },
        {
          name: 'server/models/Todo.js',
          content: isBuggy
            ? `const mongoose = require('mongoose');
// BUG: 'completed' boolean field is missing from schema
const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Todo', todoSchema);`
            : `const mongoose = require('mongoose');
const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Todo', todoSchema);`,
        },
        {
          name: 'server/routes/todoRoutes.js',
          content: isBuggy
            ? `const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');

router.get('/', async (req, res) => {
  const todos = await Todo.find().sort({ createdAt: -1 });
  res.json(todos);
});

router.post('/', async (req, res) => {
  const todo = await Todo.create(req.body);
  res.status(201).json(todo);
});

// BUG: Using router.get instead of router.delete
router.get('/:id', async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id);
  res.json({ message: 'Todo deleted' });
});

module.exports = router;`
            : `const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');

router.get('/', async (req, res) => {
  const todos = await Todo.find().sort({ createdAt: -1 });
  res.json(todos);
});

router.post('/', async (req, res) => {
  const todo = await Todo.create(req.body);
  res.status(201).json(todo);
});

router.delete('/:id', async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id);
  res.json({ message: 'Todo deleted successfully' });
});

module.exports = router;`,
        },
        {
          name: 'server/server.js',
          content: `const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const todoRoutes = require('./routes/todoRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/todos', todoRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Todo server running on port ' + PORT));`,
        },
        {
          name: 'client/src/App.jsx',
          content: isBuggy
            ? `import React, { useState, useEffect } from 'react';
import axios from 'axios';

// BUG: Port hardcoded to 3001 instead of 5000
const API_URL = 'http://localhost:3001/api/todos';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');

  // BUG: Missing dependency array causes infinite fetch loop!
  useEffect(() => {
    axios.get(API_URL).then(res => setTodos(res.data));
  });

  const addTodo = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await axios.post(API_URL, { title: text, completed: false });
    setTodos([res.data, ...todos]);
    setText('');
  };

  const deleteTodo = async (id) => {
    // BUG: Trying to delete via GET request
    await axios.get(\`\${API_URL}/\${id}\`);
    setTodos(todos.filter(t => t._id !== id));
  };

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h2>Todo App</h2>
      <form onSubmit={addTodo}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Add new task..." />
        <button type="submit">Add</button>
      </form>
      <ul>
        {todos.map(t => (
          <li key={t._id}>
            {t.title}
            <button onClick={() => deleteTodo(t._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}`
            : `import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/todos';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    axios.get(API_URL).then(res => setTodos(res.data));
  }, []);

  const addTodo = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await axios.post(API_URL, { title: text, completed: false });
    setTodos([res.data, ...todos]);
    setText('');
  };

  const deleteTodo = async (id) => {
    await axios.delete(\`\${API_URL}/\${id}\`);
    setTodos(todos.filter(t => t._id !== id));
  };

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h2>Todo App (Solution)</h2>
      <form onSubmit={addTodo}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Add new task..." />
        <button type="submit">Add</button>
      </form>
      <ul>
        {todos.map(t => (
          <li key={t._id}>
            {t.title}
            <button onClick={() => deleteTodo(t._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}`,
        },
      ];

    case 2: // Blog Application
      return [
        {
          name: 'README.md',
          content: `# Blog Application (MERN Stack)${bugNote}
Features: JWT Authentication, Posts listing, and slug-based lookup.
Bugs to fix in buggy version:
- JWT token not included in client authorization headers
- findById used on slug instead of findOne({ slug })
- CORS origin misconfigured
- Unhashed password saved in MongoDB
`,
        },
        {
          name: 'server/controllers/postController.js',
          content: isBuggy
            ? `const Post = require('../models/Post');
// BUG: Using findById with slug parameter
exports.getPostBySlug = async (req, res) => {
  const post = await Post.findById(req.params.slug);
  res.json(post);
};`
            : `const Post = require('../models/Post');
exports.getPostBySlug = async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug });
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.json(post);
};`,
        },
        {
          name: 'server/server.js',
          content: isBuggy
            ? `const express = require('express');
const cors = require('cors');
const app = express();
// BUG: CORS origin set to null blocks all browser requests
app.use(cors({ origin: null }));
app.use(express.json());
app.listen(5000, () => console.log('Blog server started on 5000'));`
            : `const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.listen(5000, () => console.log('Blog server started on 5000'));`,
        },
        {
          name: 'client/src/api.js',
          content: isBuggy
            ? `import axios from 'axios';
// BUG: Token exists in localStorage but is not set in Authorization header!
export const getPrivatePosts = () => axios.get('http://localhost:5000/api/posts');`
            : `import axios from 'axios';
export const getPrivatePosts = () => {
  const token = localStorage.getItem('token');
  return axios.get('http://localhost:5000/api/posts', {
    headers: { Authorization: \`Bearer \${token}\` }
  });
};`,
        },
      ];

    case 3: // E-Commerce Cart
      return [
        {
          name: 'README.md',
          content: `# E-Commerce Cart (MERN Stack)${bugNote}
Bugs to fix:
- Cart reducer mutates state directly
- Total price calculation uses string concatenation instead of numbers
- Quantity decrements into negative values
`,
        },
        {
          name: 'client/src/cartReducer.js',
          content: isBuggy
            ? `export const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      // BUG: Mutating state directly and total price concatenates as strings
      state.items.push(action.payload);
      state.total = state.total + action.payload.price; 
      return state;
    case 'DECREMENT_QTY':
      // BUG: No check for quantity < 0
      return {
        ...state,
        items: state.items.map(i => i.id === action.payload ? { ...i, qty: i.qty - 1 } : i)
      };
    default:
      return state;
  }
};`
            : `export const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      const newItems = [...state.items, action.payload];
      const newTotal = newItems.reduce((sum, item) => sum + (Number(item.price) * (item.qty || 1)), 0);
      return { ...state, items: newItems, total: newTotal };
    case 'DECREMENT_QTY':
      return {
        ...state,
        items: state.items
          .map(i => i.id === action.payload ? { ...i, qty: Math.max(0, i.qty - 1) } : i)
          .filter(i => i.qty > 0)
      };
    default:
      return state;
  }
};`,
        },
      ];

    case 4: // User Auth System
      return [
        {
          name: 'README.md',
          content: `# User Authentication System (MERN Stack)${bugNote}
Bugs to fix:
- bcrypt.compare parameters swapped (always returns false)
- JWT secret is hardcoded as empty string
- Auth middleware inspects req.headers.token instead of Bearer authorization
`,
        },
        {
          name: 'server/controllers/authController.js',
          content: isBuggy
            ? `const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  // BUG: bcrypt.compare arguments are inverted! (hashed, plain) instead of (plain, hashed)
  const isMatch = await bcrypt.compare(user.password, password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
  
  // BUG: Empty string used as JWT secret
  const token = jwt.sign({ id: user._id }, '', { expiresIn: '1d' });
  res.json({ token });
};`
            : `const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
  
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1d' });
  res.json({ token, user: { id: user._id, email: user.email } });
};`,
        },
      ];

    case 5: // Real-Time Chat App
      return [
        {
          name: 'README.md',
          content: `# Real-Time Chat Application (Socket.io + MERN)${bugNote}
Bugs to fix:
- Missing await on Message.create (messages never saved to MongoDB)
- socket.to(room).emit used omitting sender instead of io.to(room).emit
- React useEffect missing socket listener cleanup
`,
        },
        {
          name: 'server/socketHandler.js',
          content: isBuggy
            ? `const Message = require('./models/Message');
module.exports = (io, socket) => {
  socket.on('sendMessage', (data) => {
    // BUG: Missing await on database insertion
    Message.create({ room: data.room, sender: data.sender, text: data.text });
    // BUG: sender will not receive the message
    socket.to(data.room).emit('newMessage', data);
  });
};`
            : `const Message = require('./models/Message');
module.exports = (io, socket) => {
  socket.on('sendMessage', async (data) => {
    const savedMsg = await Message.create({ room: data.room, sender: data.sender, text: data.text });
    io.to(data.room).emit('newMessage', savedMsg);
  });
};`,
        },
      ];

    case 6: // Movie Search App
      return [
        {
          name: 'README.md',
          content: `# Movie Search App (OMDB + MERN)${bugNote}
Bugs to fix:
- OMDB API key undefined in process.env
- Unhandled Promise rejection on fetch network errors
- Rating parsed with parseInt on undefined value causing NaN
`,
        },
        {
          name: 'client/src/MovieSearch.jsx',
          content: isBuggy
            ? `export const searchMovies = (query) => {
  // BUG: OMDB_KEY is undefined
  const key = process.env.REACT_APP_OMDB_KEY;
  // BUG: No catch block for network failure
  return fetch(\`https://www.omdbapi.com/?apikey=\${key}&s=\${query}\`).then(r => r.json());
};`
            : `export const searchMovies = async (query) => {
  try {
    const key = process.env.REACT_APP_OMDB_KEY || 'demo_key';
    const res = await fetch(\`https://www.omdbapi.com/?apikey=\${key}&s=\${query}\`);
    return await res.json();
  } catch (err) {
    console.error('Movie fetch error:', err);
    return { Search: [], Error: err.message };
  }
};`,
        },
      ];

    case 7: // Student Management Dashboard
      return [
        {
          name: 'README.md',
          content: `# Student Management Dashboard (MERN Stack)${bugNote}
Bugs to fix:
- CORS disabled causing browser policy block
- GET /api/students missing await on database query
- Student update route registered as POST instead of PUT
`,
        },
        {
          name: 'server/routes/studentRoutes.js',
          content: isBuggy
            ? `const router = require('express').Router();
const Student = require('../models/Student');

// BUG: Missing await returns pending promise
router.get('/', (req, res) => {
  const list = Student.find();
  res.json(list);
});

// BUG: Update registered as POST instead of PUT
router.post('/update/:id', async (req, res) => {
  const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});
module.exports = router;`
            : `const router = require('express').Router();
const Student = require('../models/Student');

router.get('/', async (req, res) => {
  const list = await Student.find();
  res.json(list);
});

router.put('/update/:id', async (req, res) => {
  const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});
module.exports = router;`,
        },
      ];

    case 8: // Notes App
      return [
        {
          name: 'README.md',
          content: `# Notes Taking App (MERN Stack)${bugNote}
Bugs to fix:
- PUT route maps title to content field
- Note search query is case-sensitive ($regex missing 'i' flag)
`,
        },
        {
          name: 'server/controllers/noteController.js',
          content: isBuggy
            ? `const Note = require('../models/Note');
// BUG: Wrong field mapping in update
exports.updateNote = async (req, res) => {
  const note = await Note.findByIdAndUpdate(
    req.params.id,
    { title: req.body.content, content: req.body.title },
    { new: true }
  );
  res.json(note);
};

// BUG: Case-sensitive search
exports.searchNotes = async (req, res) => {
  const notes = await Note.find({ title: { $regex: req.query.q } });
  res.json(notes);
};`
            : `const Note = require('../models/Note');
exports.updateNote = async (req, res) => {
  const note = await Note.findByIdAndUpdate(
    req.params.id,
    { title: req.body.title, content: req.body.content },
    { new: true }
  );
  res.json(note);
};

exports.searchNotes = async (req, res) => {
  const notes = await Note.find({ title: { $regex: req.query.q, $options: 'i' } });
  res.json(notes);
};`,
        },
      ];

    case 9: // Job Portal
      return [
        {
          name: 'README.md',
          content: `# Job Portal Application (MERN Stack)${bugNote}
Bugs to fix:
- Pagination skips page 1 (skip calculated as page * limit instead of (page - 1) * limit)
- Missing populate('postedBy') on job details
`,
        },
        {
          name: 'server/controllers/jobController.js',
          content: isBuggy
            ? `const Job = require('../models/Job');
exports.getJobs = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  // BUG: page * limit skips first 10 items when page=1!
  const skip = page * limit;
  // BUG: missing populate('postedBy')
  const jobs = await Job.find().skip(skip).limit(limit);
  res.json(jobs);
};`
            : `const Job = require('../models/Job');
exports.getJobs = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;
  const jobs = await Job.find().populate('postedBy', 'name company').skip(skip).limit(limit);
  const total = await Job.countDocuments();
  res.json({ jobs, total, page, pages: Math.ceil(total / limit) });
};`,
        },
      ];

    case 10: // Recipe Sharing App
      return [
        {
          name: 'README.md',
          content: `# Recipe Sharing App (MERN Stack)${bugNote}
Bugs to fix:
- Multer destination set to root instead of uploads/images/
- Missing server base URL for recipe image path in response
- Ingredients stored as unparsed single string
`,
        },
        {
          name: 'server/middleware/upload.js',
          content: isBuggy
            ? `const multer = require('multer');
// BUG: Root path saves directly to filesystem root!
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, '/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
module.exports = multer({ storage });`
            : `const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/images')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
module.exports = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'), false);
  }
});`,
        },
      ];

    default:
      return [];
  }
};

// ─── Main Generator & Database Updater ──────────────────────────────
const generateAllZipsAndSeedDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();

    const faculty = await User.findOne({ role: 'faculty' });
    if (!faculty) {
      console.error('❌ Faculty user not found. Run seedProjects first.');
      process.exit(1);
    }

    console.log(`👨‍🏫 Using faculty account: ${faculty.email}`);
    console.log('📦 Generating 20 real ZIP archives (10 Buggy + 10 Correct)...');

    const projectNames = [
      { num: 1,  slug: 'todo-app',          title: 'Todo List App' },
      { num: 2,  slug: 'blog-app',          title: 'Blog Application' },
      { num: 3,  slug: 'ecommerce-cart',    title: 'E-Commerce Cart' },
      { num: 4,  slug: 'user-auth-system',  title: 'User Authentication System' },
      { num: 5,  slug: 'chat-app',          title: 'Real-Time Chat Application' },
      { num: 6,  slug: 'movie-search-app',  title: 'Movie Search App' },
      { num: 7,  slug: 'student-dashboard', title: 'Student Management Dashboard' },
      { num: 8,  slug: 'notes-app',         title: 'Notes Taking App' },
      { num: 9,  slug: 'job-portal',        title: 'Job Portal Application' },
      { num: 10, slug: 'recipe-app',        title: 'Recipe Sharing App' },
    ];

    for (const proj of projectNames) {
      // 1. Generate Buggy ZIP
      const buggyFileName = `project-${proj.num}-${proj.slug}-buggy.zip`;
      const buggyPath = path.resolve(uploadsDir, buggyFileName);
      const buggyFiles = getProjectFiles(proj.num, true);
      await createZipArchive(buggyPath, buggyFiles);

      // 2. Generate Correct ZIP
      const correctFileName = `project-${proj.num}-${proj.slug}-correct.zip`;
      const correctPath = path.resolve(uploadsDir, correctFileName);
      const correctFiles = getProjectFiles(proj.num, false);
      await createZipArchive(correctPath, correctFiles);

      console.log(`  ✓ #${proj.num} ${proj.title} -> Created Buggy & Correct ZIPs`);

      // 3. Update Project record in MongoDB
      await Project.findOneAndUpdate(
        { projectNumber: proj.num },
        {
          $set: {
            'buggyProject.zipFile': buggyPath,
            'buggyProject.originalName': `${proj.slug}-buggy.zip`,
            'correctProject.zipFile': correctPath,
            'correctProject.originalName': `${proj.slug}-solution.zip`,
          },
        },
        { new: true }
      );
    }

    console.log('\n🎉 ALL 10 PROJECTS WITH REAL ZIP FILES UPDATED IN DATABASE!');
    console.log('📁 Storage directory:', uploadsDir);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating project zips:', error);
    process.exit(1);
  }
};

generateAllZipsAndSeedDB();
