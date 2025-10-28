#  Training and Placement Job Alert Bot - https://tnp-alert.vercel.app/

An automated job alert system that scrapes the BIT Mesra Training & Placement (TnP) portal and sends email notifications to subscribers when new job opportunities are posted.

## Screenshots

<img width="1897" height="836" alt="image" src="https://github.com/user-attachments/assets/ba8e4714-74d3-4ba6-9bc9-43daa571ea12" />
<img width="1195" height="679" alt="image" src="https://github.com/user-attachments/assets/93fc43de-0f6e-4199-9689-7506a140d6c4" />
<img width="1528" height="637" alt="image" src="https://github.com/user-attachments/assets/ccb0b11a-6bd4-4324-90c0-476836b1ed55" />


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
- **HTML/CSS/JavaScript** web interface 
- **Responsive design** for mobile and desktop
- **Simple subscription form** with email-only input
- **AJAX form submission** with real-time feedback

##  Quick Start

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
   Copy `.env.example` to `.env` in the `backend` directory:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your actual credentials:
   ```env
   PASSWORD=your_tnp_portal_password
   GMAIL=your_gmail@gmail.com
   GMAIL_PASS=your_gmail_app_password
   PORT=5000
   ```

4. **Start the services**
   
   **For API server only:**
   ```bash
   npm run start:api
   ```
   
   **For job scraper worker only:**
   ```bash
   npm run start:worker
   ```
   
   **For development (API server):**
   ```bash
   npm run dev
   ```

5. **Serve the frontend**
   Open `frontend/index.html` in a web browser or serve it using a local server.

##  How to Subscribe

1. **Subscribe via Web Interface**
   - Visit the frontend page
   - Enter your Gmail address
   - Click "Notify Me"
   - You'll receive a confirmation email

2. **Confirmation**
   - Check your email for the confirmation message
   - Job alerts will start within the next hour

##  Security Features

- **Single Sender System**: Uses one verified Gmail account to send all notifications
- **No Password Storage**: Subscribers only provide email addresses
- **Input Validation**: Email format validation and required field checks
- **Rate Limiting**: Prevents abuse with request rate limiting
- **Duplicate Prevention**: Prevents multiple subscriptions with the same email
- **Secure Headers**: CORS and security headers implemented

##  Development

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
- `express-rate-limit`: Rate limiting
- `dotenv`: Environment variables

##  Deployment

### Backend Deployment (Render)
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard:
   - `PASSWORD`: Your TnP portal password
   - `GMAIL`: Your Gmail address
   - `GMAIL_PASS`: Your Gmail app password
   - `PORT`: 5000 (or leave default)
3. Deploy as a Node.js service
4. **Important**: Deploy both API and Worker services separately:
   - API Service: Use `npm run start:api`
   - Worker Service: Use `npm run start:worker`

### Frontend Deployment
- Deploy to any static hosting service (Vercel, GitHub Pages)
- The frontend automatically detects the API endpoint based on the domain

##  Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Disclaimer

This bot is for educational purposes and personal use. Please ensure compliance with:
- BIT Mesra's terms of service
- Gmail's usage policies
- Applicable data protection regulations

## Recent Improvements

### Security & Architecture Updates
- **Removed password collection**: No longer stores user Gmail passwords
- **Single sender system**: Uses one verified Gmail account for all notifications
- **Improved deduplication**: Stable job IDs prevent duplicate notifications
- **Rate limiting**: Added protection against abuse
- **Better error handling**: Comprehensive error handling throughout
- **Process separation**: API and worker can run independently

### User Experience Improvements
- **Simplified subscription**: Only email required, no passwords
- **Real-time feedback**: AJAX form submission with success/error messages
- **Better email templates**: Improved HTML email formatting
- **Automatic endpoint detection**: Frontend works with local and production APIs

## Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Verify your Gmail App Password is correctly set up
- Check that all required environment variables are configured

---

**Made with ❤️ by Shubham Mishra**
