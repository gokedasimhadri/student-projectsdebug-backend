const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Project = require('../models/Project');

const projects = [
  {
    projectNumber: 1,
    title: 'Todo List App',
    description:
      'A full-stack Todo application with CRUD operations. Students must fix bugs in React hooks and Express API routes.',
    techStack: ['MongoDB', 'Express.js', 'React.js', 'Node.js'],
    difficulty: 'Easy',
    totalMarks: 100,
    buggyProject: {
      bugsDescription: [
        "useEffect missing dependency array — causes infinite re-render loop",
        "DELETE /api/todos/:id route uses wrong HTTP method (GET instead of DELETE)",
        "mongoose model 'Todo' schema is missing 'completed' field",
        "Frontend: axios base URL hardcoded to wrong port (3001 instead of 5000)",
      ],
      bugCount: 4,
    },
  },
  {
    projectNumber: 2,
    title: 'Blog Application',
    description:
      'A blog app with user authentication, post creation, and comments. JWT token not being sent in API headers.',
    techStack: ['MongoDB', 'Express.js', 'React.js', 'Node.js', 'JWT'],
    difficulty: 'Medium',
    totalMarks: 100,
    buggyProject: {
      bugsDescription: [
        "JWT token not included in Authorization header for protected routes",
        "Mongoose: findById() used instead of findOne() for slug-based post lookup",
        "React: state not resetting after post creation (form stays filled)",
        "CORS origin set to null — blocks all frontend requests",
        "Password not hashed before saving new user (bcrypt.hash missing)",
      ],
      bugCount: 5,
    },
  },
  {
    projectNumber: 3,
    title: 'E-Commerce Cart',
    description:
      'Shopping cart with product listing, add-to-cart, and total price calculation. Multiple logic bugs to fix.',
    techStack: ['MongoDB', 'Express.js', 'React.js', 'Node.js', 'Redux'],
    difficulty: 'Hard',
    totalMarks: 100,
    buggyProject: {
      bugsDescription: [
        "Cart state not updating — reducer returns state instead of new object (mutability bug)",
        "Price total calculation uses string concatenation instead of numeric addition",
        "Product quantity goes negative — no minimum 0 validation in reducer",
        "API: GET /api/products not populating 'category' ref in Mongoose query",
        "React useSelector returns undefined — wrong state key referenced",
      ],
      bugCount: 5,
    },
  },
  {
    projectNumber: 4,
    title: 'User Authentication System',
    description:
      'Full auth system with register, login, JWT, and protected routes. bcrypt and middleware bugs present.',
    techStack: ['MongoDB', 'Express.js', 'React.js', 'Node.js', 'JWT', 'bcrypt'],
    difficulty: 'Medium',
    totalMarks: 100,
    buggyProject: {
      bugsDescription: [
        "bcrypt.compare() arguments swapped — always returns false (login always fails)",
        "JWT secret is hardcoded as empty string '' — tokens are insecure",
        "Protect middleware checks req.headers.token instead of req.headers.authorization",
        "Register route missing duplicate email check — allows duplicate accounts",
        "React: Login form does not clear error message on successful login",
      ],
      bugCount: 5,
    },
  },
  {
    projectNumber: 5,
    title: 'Real-Time Chat Application',
    description:
      'Socket.io chat app with rooms. Room join logic is broken and messages are not saved to MongoDB.',
    techStack: ['MongoDB', 'Express.js', 'React.js', 'Node.js', 'Socket.io'],
    difficulty: 'Hard',
    totalMarks: 100,
    buggyProject: {
      bugsDescription: [
        "socket.join(room) called before room validation — users join wrong room",
        "Message not saved to DB — await missing on Message.create()",
        "socket.to(room).emit() used instead of io.to(room).emit() — sender misses message",
        "React: useEffect socket listeners not cleaned up — duplicate messages on re-render",
        "CORS for socket.io not configured — connection refused from browser",
      ],
      bugCount: 5,
    },
  },
  {
    projectNumber: 6,
    title: 'Movie Search App',
    description:
      'App that searches movies via OMDB API and saves favorites to MongoDB. API key and error handling bugs.',
    techStack: ['MongoDB', 'Express.js', 'React.js', 'Node.js', 'OMDB API'],
    difficulty: 'Easy',
    totalMarks: 100,
    buggyProject: {
      bugsDescription: [
        "OMDB API key not loaded from .env — process.env.OMDB_KEY is undefined",
        "fetch() error not caught — app crashes on network failure",
        "React: search input updates but API not called — onChange handler missing",
        "Favorite already exists error not handled — duplicate favorites allowed",
        "Movie rating displayed as NaN — parseInt() applied to undefined value",
      ],
      bugCount: 5,
    },
  },
  {
    projectNumber: 7,
    title: 'Student Management Dashboard',
    description:
      'Admin dashboard to manage students with CRUD. CORS misconfiguration and broken route handlers.',
    techStack: ['MongoDB', 'Express.js', 'React.js', 'Node.js'],
    difficulty: 'Medium',
    totalMarks: 100,
    buggyProject: {
      bugsDescription: [
        "CORS not configured — all API requests blocked with CORS policy error",
        "GET /api/students returns undefined — res.json(students) missing await",
        "Student update route uses POST instead of PUT method",
        "Mongoose: student search query uses $equal instead of correct $eq operator",
        "React table: key prop missing on list items — console error and re-render issue",
      ],
      bugCount: 5,
    },
  },
  {
    projectNumber: 8,
    title: 'Notes Taking App',
    description:
      'Notes app with create, edit, delete, and search. PUT route bug and React form state bug.',
    techStack: ['MongoDB', 'Express.js', 'React.js', 'Node.js'],
    difficulty: 'Easy',
    totalMarks: 100,
    buggyProject: {
      bugsDescription: [
        "PUT /api/notes/:id updates 'title' field with 'content' value — wrong field mapping",
        "React: note edit form does not populate existing note data (useState initial value empty)",
        "Note search is case-sensitive — $regex missing 'i' (case-insensitive) flag",
        "Delete confirmation dialog missing — notes deleted without user confirmation",
        "Notes not sorted by updatedAt — displays in creation order only",
      ],
      bugCount: 5,
    },
  },
  {
    projectNumber: 9,
    title: 'Job Portal Application',
    description:
      'Job listing and application portal. Pagination logic is wrong and Mongoose populate() is missing.',
    techStack: ['MongoDB', 'Express.js', 'React.js', 'Node.js'],
    difficulty: 'Hard',
    totalMarks: 100,
    buggyProject: {
      bugsDescription: [
        "Pagination: skip() value calculated as page*limit instead of (page-1)*limit — skips first page",
        "Job.find().populate() missing 'postedBy' ref — company info is null in response",
        "Job application does not check if user already applied — duplicate applications allowed",
        "React: job filter state not reset when changing category — stale filter persists",
        "Salary range filter uses $gt/$lt with string comparison instead of number",
      ],
      bugCount: 5,
    },
  },
  {
    projectNumber: 10,
    title: 'Recipe Sharing App',
    description:
      'Recipe app with image upload and rating system. Multer config and image path bugs.',
    techStack: ['MongoDB', 'Express.js', 'React.js', 'Node.js', 'Multer'],
    difficulty: 'Medium',
    totalMarks: 100,
    buggyProject: {
      bugsDescription: [
        "Multer destination path wrong — images saved to root instead of uploads/images/",
        "Image URL in response missing base URL — frontend displays broken image",
        "Recipe rating: average not recalculated after new rating — shows stale average",
        "File type validation missing — allows non-image files to be uploaded as recipe images",
        "Recipe ingredients stored as single string instead of array — split() not called",
      ],
      bugCount: 5,
    },
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Project.deleteMany({});
    await User.deleteMany({ role: 'faculty', email: 'faculty@gmail.com' });

    console.log('🗑️  Old data cleared');

    // Create a default faculty user
    const faculty = await User.create({
      name: 'Dr. Faculty Admin',
      email: 'faculty@gmail.com',
      password: 'faculty123',
      role: 'faculty',
      department: 'Computer Science',
    });

    console.log(`👨‍🏫 Faculty created: ${faculty.email}`);

    // Create all 10 projects
    const createdProjects = await Promise.all(
      projects.map((p) =>
        Project.create({ ...p, createdBy: faculty._id })
      )
    );

    console.log(`\n✅ ${createdProjects.length} Projects seeded successfully!\n`);
    createdProjects.forEach((p) => {
      console.log(`  📦 #${p.projectNumber} ${p.title} (${p.difficulty}) — ${p.buggyProject.bugCount} bugs`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Database seeded successfully!');
    console.log('📧 Faculty Login: faculty@gmail.com');
    console.log('🔑 Password: faculty123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
