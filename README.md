#  Training and Placement Job Alert Bot - https://tnp-alert.vercel.app/

An automated job alert system that scrapes the BIT Mesra Training & Placement (TnP) portal and sends email notifications to subscribers when new job opportunities are posted.

## Features

- **Automated Job Scraping**: Monitors the TnP portal every hour for new job postings
- **Email Notifications**: Sends personalized email alerts to subscribers
- **User-Friendly Frontend**: Simple web interface for subscription management
- **Secure Authentication**: Encrypted storage of user credentials
- **Duplicate Prevention**: Tracks seen jobs to avoid spam notifications
- **Real-time Monitoring**: Health check endpoints for system status through uptimerobot

## Architecture

The project consists of two main components:

### Backend (`/backend`)
- **Node.js/Express** server handling user subscriptions
- **Puppeteer** for web scraping the TnP portal
- **Nodemailer** for sending email notifications
- **Node-cron** for scheduled job monitoring
- **Crypto** for secure credential encryption

### Frontend (`/frontend`)
- **CSS** web interface 
- **Responsive design** for mobile and desktop
- **Simple subscription form** with email and app password fields

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- Gmail account with App Password enabled via 2FA
- Access to BIT Mesra TnP portal

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/job-alert-bot.git
   cd job-alert-bot
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the `backend` directory:
   ```env
   PASSWORD=your_tnp_portal_password
   GMAIL=your_gmail@gmail.com
   GMAIL_PASS=your_gmail_app_password
   SECRET_KEY=your_32_character_encryption_key
   ```

4. **Start the backend server**
   ```bash
   npm start
   ```

5. **Serve the frontend**
   Open `frontend/index.html` in a web browser or serve it using a local server.

## 📧 How to Subscribe

1. **Generate Google App Password**
   - Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Generate a new app password for "Mail"
   - Use this password instead of your regular Gmail password

2. **Subscribe via Web Interface**
   - Visit the frontend page
   - Enter your Gmail address
   - Enter your Google App Password
   - Click "Notify Me"

3. **Confirmation**
   - You'll receive a confirmation email
   - Job alerts will start within the next hour

## 🔒 Security Features

- **Encrypted Storage**: User passwords are encrypted using AES-256-CBC
- **Input Validation**: Email format validation and required field checks
- **Duplicate Prevention**: Prevents multiple subscriptions with the same email
- **Secure Headers**: CORS and security headers implemented
- 

## 🛠️ Development

### Project Structure
```
job-alert-bot/
├── backend/
│   ├── index.js          # Main scraping logic
│   ├── server.js         # Express server
│   ├── package.json      # Dependencies
│   ├── users.json        # Subscriber database
│   └── seenJobs.json     # Job tracking
├── frontend/
│   ├── index.html        # Subscription form
│   ├── style.css         # Styling
│   └── *.png            # Assets
└── README.md
```

### Key Dependencies

**Backend:**
- `puppeteer`: Web scraping
- `nodemailer`: Email sending
- `node-cron`: Scheduled tasks
- `express`: Web server
- `crypto`: Encryption
- `dotenv`: Environment variables

## 🚀 Deployment

### Backend Deployment (Render)
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy as a Node.js service

### Frontend Deployment
- Deploy to any static hosting service ( Vercel, GitHub Pages)
- Update the API endpoint in `index.html` to point to your deployed backend

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This bot is for educational purposes and personal use. Please ensure compliance with:
- BIT Mesra's terms of service
- Gmail's usage policies
- Applicable data protection regulations

## 📞 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Verify your Google App Password is correctly set up

---

**Made with ❤️ by Shubham Mishra**
