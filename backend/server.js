import express from 'express';
import fs from 'fs';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const ENCRYPTION_KEY = process.env.SECRET_KEY || '12345678901234567890123456789012'; // 32-char key

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function sendConfirmationEmail(email) {
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL,
    to: email,
    subject: '🎉 Successfully Subscribed to BIT TNP Job Alerts!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50; text-align: center;">🎉 Welcome to BIT TNP Job Alerts!</h2>
        <p>Hi there,</p>
        <p>You've successfully subscribed to BIT's Job Alert Bot with email: <strong>${email}</strong></p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #27ae60; margin-top: 0;">✅ What happens next?</h3>
          <ul>
            <li>📧 You'll receive email notifications when new job postings are found</li>
            <li>⏰ We check for new jobs every hour</li>
            <li>🎯 Only new opportunities will be sent to avoid spam</li>
          </ul>
        </div>
        <p>Stay tuned for amazing opportunities! 🚀</p>
        <hr style="margin: 20px 0;">
        <p style="color: #7f8c8d; font-size: 12px; text-align: center;">
          This is an automated message from BIT TNP Job Alert Bot 🤖<br>
          Thank you for subscribing!
        </p>
      </div>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error(`❌ Error sending confirmation: ${error}`);
    }
    console.log(`📩 Confirmation sent to ${email}: ${info.response}`);
  });
}

app.post('/subscribe', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and password are required' 
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please enter a valid email address' 
    });
  }

  try {
    // Initialize users file if it doesn't exist
    if (!fs.existsSync('users.json')) {
      fs.writeFileSync('users.json', '[]');
    }

    let users = JSON.parse(fs.readFileSync('users.json'));

    // Check if user already exists
    const existingUser = users.find(user => {
      // Handle both encrypted and non-encrypted emails for backward compatibility
      const userEmail = user.email.includes(':') ? decrypt(user.email) : user.email;
      return userEmail === email;
    });

    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already subscribed' 
      });
    }

    const userData = {
      email: email, // Store email as plain text for GitHub Actions
      password: encrypt(password),
      subscribedAt: new Date().toISOString(),
    };

    users.push(userData);
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));

    // Send confirmation email
    sendConfirmationEmail(email);

    res.json({ 
      success: true, 
      message: 'Successfully subscribed! You will start receiving job alerts.' 
    });

  } catch (error) {
    console.error('❌ Subscription error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error. Please try again.' 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    subscribers: fs.existsSync('users.json') ? JSON.parse(fs.readFileSync('users.json')).length : 0
  });
});

// Get subscribers count (for admin)
app.get('/stats', (req, res) => {
  try {
    const users = fs.existsSync('users.json') ? JSON.parse(fs.readFileSync('users.json')) : [];
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

function decrypt(text) {
  try {
    const [ivHex, encrypted] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('❌ Decryption failed:', error.message);
    return text; // Return original if decryption fails
  }
}

app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
});