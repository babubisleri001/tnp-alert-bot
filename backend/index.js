import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';
import fs from 'fs';
import cron from 'node-cron';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

if (!process.env.PASSWORD || !process.env.GMAIL || !process.env.GMAIL_PASS) {
  console.error('Error: PASSWORD, GMAIL, and GMAIL_PASS environment variables are required');
  process.exit(1);
}

const USERNAME = 'TPBIT-BTECH1063922';
const PASSWORD = process.env.PASSWORD;
const GMAIL = process.env.GMAIL;
const GMAIL_PASS = process.env.GMAIL_PASS;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL,
    pass: GMAIL_PASS,
  },
});

function readSeenJobs() {
  try {
    if (!fs.existsSync('seenJobs.json')) {
      fs.writeFileSync('seenJobs.json', '[]');
      return [];
    }
    const raw = fs.readFileSync('seenJobs.json', 'utf-8');
    return raw.trim() === '' ? [] : JSON.parse(raw);
  } catch (error) {
    console.error('Error reading seenJobs.json:', error);
    return [];
  }
}

function writeSeenJobs(jobs) {
  try {
    fs.writeFileSync('seenJobs.json', JSON.stringify(jobs, null, 2));
  } catch (error) {
    console.error('Error writing seenJobs.json:', error);
    throw error;
  }
}

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

// Generate a stable job ID for deduplication
function generateJobId(job) {
  const data = `${job.company}-${job.deadline}-${job.posted}-${job.link}`;
  return crypto.createHash('md5').update(data).digest('hex');
}

async function run() {
  console.log(`[${new Date().toISOString()}] Starting job scraping...`);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    console.log('Opening login page...');
    await page.goto('https://tp.bitmesra.co.in/login.html', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    console.log('Filling credentials...');
    await page.type('#identity', USERNAME);
    await page.type('#password', PASSWORD);

    await Promise.all([
      page.click("input[type='submit']"),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
    ]);

    const currentUrl = page.url();
    console.log('Logged in. Final URL:', currentUrl);
    if (!currentUrl.includes('index.html')) {
      throw new Error('Login failed - redirected to unexpected page');
    }

    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const jobs = await page.evaluate(() => {
      return [...document.querySelectorAll('table tbody tr')].map(row => {
        const cols = row.querySelectorAll('td');
        return {
          company: cols[0]?.innerText.trim() || 'Unknown',
          deadline: cols[1]?.innerText.trim() || 'Unknown',
          posted: cols[2]?.innerText.trim() || 'Unknown',
          link: cols[3]?.querySelector('a')?.href || 'N/A',
        };
      });
    });

    console.log(`Found ${jobs.length} total jobs on the portal`);

    // Read existing seen jobs
    const seenJobs = readSeenJobs();
    const seenJobIds = new Set(seenJobs.map(job => job.id));

    // Find new jobs using stable IDs
    const newJobs = jobs.filter(job => {
      const jobId = generateJobId(job);
      return !seenJobIds.has(jobId);
    }).map(job => ({
      ...job,
      id: generateJobId(job),
      scrapedAt: new Date().toISOString()
    }));

    if (newJobs.length === 0) {
      console.log('No new jobs found.');
    } else {
      console.log(`${newJobs.length} new job(s) found!`);
      console.table(newJobs.map(job => ({
        company: job.company,
        deadline: job.deadline,
        posted: job.posted
      })));

      // Get confirmed subscribers
      const users = readUsers().filter(user => user.confirmed);
      
      if (users.length === 0) {
        console.log('No confirmed subscribers found.');
      } else {
        console.log(`Sending notifications to ${users.length} subscribers...`);
        
        // Send emails to all subscribers
        const emailPromises = users.map(user => 
          sendEmail(newJobs, user.email)
        );
        
        await Promise.allSettled(emailPromises);
      }

      // Update seen jobs with new jobs
      const updatedSeenJobs = [...seenJobs, ...newJobs];
      writeSeenJobs(updatedSeenJobs);
      
      console.log(`Updated seen jobs database with ${newJobs.length} new entries`);
    }

  } catch (err) {
    console.error('Scraping error:', err.message);
  } finally {
    await browser.close();
  }
}

async function sendEmail(jobs, toEmail) {
  try {
    const jobListHtml = jobs.map(job => `
      <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; background-color: #f9f9f9;">
        <h3 style="color: #2c3e50; margin-top: 0;">${job.company}</h3>
        <p><strong>Deadline:</strong> ${job.deadline}</p>
        <p><strong>Posted:</strong> ${job.posted}</p>
        <p><strong>Link:</strong> <a href="${job.link}" target="_blank">View Details</a></p>
      </div>
    `).join('');

    const mailOptions = {
      from: GMAIL,
      to: toEmail,
      subject: `${jobs.length} New Job(s) from BIT TNP`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50; text-align: center;">New Job Opportunities!</h2>
          <p>Hi there,</p>
          <p>We found <strong>${jobs.length} new job posting(s)</strong> on the BIT TnP portal:</p>
          ${jobListHtml}
          <hr style="margin: 20px 0;">
          <p style="color: #7f8c8d; font-size: 12px; text-align: center;">
            This is an automated message from BIT TNP Job Alert Bot<br>
            <a href="https://tnp-alert.vercel.app">Manage Subscription</a>
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error(`Failed to send email to ${toEmail}:`, error.message);
  }
}

// Schedule to run every hour at minute 0
cron.schedule('0 * * * *', () => {
  console.log('Scheduled job scraping triggered');
  run().catch(error => {
    console.error('Scheduled job failed:', error);
  });
});

// Run immediately on startup
console.log('Starting job alert bot...');
run().catch(error => {
  console.error('Initial job run failed:', error);
});