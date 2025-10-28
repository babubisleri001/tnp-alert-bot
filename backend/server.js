import express from 'express';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Validate required environment variables
if (!process.env.GMAIL || !process.env.GMAIL_PASS) {
  console.error('Error: GMAIL and GMAIL_PASS environment variables are required');
  process.exit(1);
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many subscription attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/subscribe', limiter);

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL,
    pass: process.env.GMAIL_PASS,
  },
});

function sendConfirmationEmail(email) {
  const mailOptions = {
    from: process.env.GMAIL,
    to: email,
    subject: 'Successfully Subscribed to BIT TNP Job Alerts!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50; text-align: center;">Welcome to BIT TNP Job Alerts!</h2>
        <p>Hi there,</p>
        <p>You've successfully subscribed to BIT's Job Alert Bot with email: <strong>${email}</strong></p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #27ae60; margin-top: 0;">✅ What happens next?</h3>
          <ul>
            <li>You'll receive email notifications when new job postings are found</li>
            <li>We check for new jobs every hour</li>
            <li>Only new opportunities will be sent to avoid spam</li>
          </ul>
        </div>
        <p>Stay tuned for amazing opportunities!</p>
        <hr style="margin: 20px 0;">
        <p style="color: #7f8c8d; font-size: 12px; text-align: center;">
          This is an automated message from BIT TNP Job Alert Bot<br>
          Thank you for subscribing!
        </p>
      </div>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(`Error sending confirmation to ${email}:`, error);
    } else {
      console.log(`Confirmation sent to ${email}: ${info.response}`);
    }
  });
}

// Helper function to safely read/write users.json
function readUsers() {
  try {
    if (!fs.existsSync('users.json')) {
      fs.writeFileSync('users.json', '[]');
      return [];
    }
    const raw = fs.readFileSync('users.json', 'utf-8');
    return raw.trim() === '' ? [] : JSON.parse(raw);
  } catch (error) {
    console.error('Error reading users.json:', error);
    return [];
  }
}

function writeUsers(users) {
  try {
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error writing users.json:', error);
    throw error;
  }
}

app.post('/subscribe', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required' 
    });
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please enter a valid email address' 
    });
  }

  try {
    const users = readUsers();
    
    // Check if email already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already subscribed' 
      });
    }

    // Add new user (no password needed)
    const userData = {
      email: email,
      subscribedAt: new Date().toISOString(),
      confirmed: true // Auto-confirm for now, can add email verification later
    };

    users.push(userData);
    writeUsers(users);

    sendConfirmationEmail(email);

    res.json({ 
      success: true, 
      message: 'Successfully subscribed! You will start receiving job alerts.' 
    });

  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error. Please try again.' 
    });
  }
});

app.get('/health', (req, res) => {
  try {
    const users = readUsers();
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      subscribers: users.length,
      mailer: 'configured' // Basic check that env vars are set
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/stats', (req, res) => {
  try {
    const users = readUsers();
    const seenJobs = fs.existsSync('seenJobs.json') ? JSON.parse(fs.readFileSync('seenJobs.json')) : [];
    
    res.json({
      totalSubscribers: users.length,
      totalJobsSeen: seenJobs.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});