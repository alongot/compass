/**
 * Backend Proxy Server for UCSB API
 * Keeps your API key secure on the server side
 *
 * Run with: npm run server
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { execFile } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = 3001;

// UCSB API configuration
const UCSB_API_KEY = process.env.UCSB_API_KEY;
const UCSB_BASE_URL = 'https://api.ucsb.edu/academics/curriculums/v1';

// Middleware
app.use(cors());
app.use(express.json());

// File upload config
const upload = multer({
  dest: path.join(__dirname, 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  }
});

// User data helpers
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

function getUsersDb() {
  if (!existsSync(USERS_FILE)) {
    mkdirSync(path.dirname(USERS_FILE), { recursive: true });
    writeFileSync(USERS_FILE, '[]');
    return [];
  }
  return JSON.parse(readFileSync(USERS_FILE, 'utf-8'));
}

function saveUsersDb(users) {
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Helper function to call UCSB API
async function callUcsbApi(endpoint) {
  const response = await fetch(`${UCSB_BASE_URL}${endpoint}`, {
    headers: {
      'ucsb-api-key': UCSB_API_KEY,
      'ucsb-api-version': '1.0',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`UCSB API error: ${response.status}`);
  }

  return response.json();
}

// Routes

// GET /api/courses - Fetch courses by quarter and subject
app.get('/api/courses', async (req, res) => {
  try {
    const { quarter, subjectCode } = req.query;

    if (!quarter || !subjectCode) {
      return res.status(400).json({ error: 'quarter and subjectCode required' });
    }

    const data = await callUcsbApi(
      `/classes/search?quarter=${quarter}&subjectCode=${subjectCode}&pageSize=100`
    );
    res.json(data);
  } catch (error) {
    console.error('Error fetching courses:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/course - Fetch single course details
app.get('/api/course', async (req, res) => {
  try {
    const { quarter, courseId } = req.query;

    if (!quarter || !courseId) {
      return res.status(400).json({ error: 'quarter and courseId required' });
    }

    const data = await callUcsbApi(
      `/classes/search?quarter=${quarter}&courseId=${encodeURIComponent(courseId)}`
    );
    res.json(data);
  } catch (error) {
    console.error('Error fetching course:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/departments - Fetch all subject areas
app.get('/api/departments', async (req, res) => {
  try {
    // Note: Check UCSB API docs for exact endpoint
    const data = await callUcsbApi('/subjectAreas');
    res.json(data);
  } catch (error) {
    console.error('Error fetching departments:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/search - Search courses by keyword
app.get('/api/search', async (req, res) => {
  try {
    const { quarter, query } = req.query;

    if (!quarter || !query) {
      return res.status(400).json({ error: 'quarter and query required' });
    }

    const data = await callUcsbApi(
      `/classes/search?quarter=${quarter}&courseId=${encodeURIComponent(query)}&pageSize=50`
    );
    res.json(data);
  } catch (error) {
    console.error('Error searching courses:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// USER MANAGEMENT ENDPOINTS
// ============================================================================

// GET /api/users - List all users
app.get('/api/users', (req, res) => {
  try {
    const users = getUsersDb();
    res.json(users);
  } catch (error) {
    console.error('Error reading users:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users - Create a new user
app.post('/api/users', (req, res) => {
  try {
    const {
      firstName, lastName, school, major, transcript,
      student_type, source_institution_id, target_major_id,
      majorId, currentQuarter,
    } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'firstName and lastName are required' });
    }

    const isTransfer = student_type === 'transfer';
    if (!isTransfer && (!school || !major)) {
      return res.status(400).json({ error: 'school and major are required for UCSB students' });
    }

    const users = getUsersDb();
    const newUser = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      firstName,
      lastName,
      school: school || 'Transfer Student',
      major: major || '',
      ...(majorId ? { majorId } : {}),
      ...(currentQuarter ? { currentQuarter } : {}),
      ...(isTransfer ? { student_type, source_institution_id, target_major_id } : {}),
      createdAt: new Date().toISOString(),
      transcript: transcript || { completed: [], failed: [], withdrawn: [], in_progress: [] },
    };
    users.push(newUser);
    saveUsersDb(users);
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id - Get a single user
app.get('/api/users/:id', (req, res) => {
  try {
    const users = getUsersDb();
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Error reading user:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:id - Update a user
app.put('/api/users/:id', (req, res) => {
  try {
    const users = getUsersDb();
    const index = users.findIndex(u => u.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'User not found' });
    users[index] = { ...users[index], ...req.body, id: users[index].id };
    saveUsersDb(users);
    res.json(users[index]);
  } catch (error) {
    console.error('Error updating user:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/users/:id - Delete a user
app.delete('/api/users/:id', (req, res) => {
  try {
    let users = getUsersDb();
    const before = users.length;
    users = users.filter(u => u.id !== req.params.id);
    if (users.length === before) return res.status(404).json({ error: 'User not found' });
    saveUsersDb(users);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// TRANSCRIPT PARSING ENDPOINT
// ============================================================================

// POST /api/transcript/parse - Upload and parse a transcript PDF
app.post('/api/transcript/parse', upload.single('transcript'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded' });
  }

  const filePath = req.file.path;
  const scriptPath = path.join(__dirname, 'scripts', 'transcriptparser.py');
  const pythonCmd = process.env.PYTHON_CMD || 'python';

  execFile(pythonCmd, [scriptPath, filePath, '--json'], { timeout: 30000 }, (error, stdout, stderr) => {
    // Clean up uploaded file
    try { unlinkSync(filePath); } catch (e) { /* ignore */ }

    if (error) {
      console.error('Transcript parse error:', stderr || error.message);
      return res.status(500).json({ error: 'Failed to parse transcript. Make sure Python and pdfplumber are installed.' });
    }

    try {
      const parsed = JSON.parse(stdout);
      res.json(parsed);
    } catch (e) {
      console.error('Failed to parse transcript output:', stdout);
      res.status(500).json({ error: 'Failed to parse transcript output' });
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', apiKeyConfigured: !!UCSB_API_KEY });
});

// Start server
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`API Key configured: ${UCSB_API_KEY ? 'Yes' : 'No - check .env file'}`);
});
