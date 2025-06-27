const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

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
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL,
    to: email,
    subject: '🎉 Subscribed to Job Alerts!',
    text: `Hi there,

You’ve successfully subscribed to BIT's Job Alert Bot.

You’ll start receiving email notifications whenever new job postings are found.

Cheers,  
Job Alert Bot 🤖`,
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
  if (!email || !password) return res.status(400).send('Missing fields');

  const userData = {
   
    password: encrypt(password),
    subscribedAt: new Date(),
  };

  let users = [];
  if (fs.existsSync('users.json')) {
    users = JSON.parse(fs.readFileSync('users.json'));
  }

  users.push(userData);
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
sendConfirmationEmail(email); // ✅ Send confirmation
res.send('✅ Subscribed successfully! You’ll start receiving alerts.');
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
});
