import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';
import fs from 'fs';
import cron from 'node-cron';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const ENCRYPTION_KEY = process.env.SECRET_KEY || '12345678901234567890123456789012';
const USERNAME = 'TPBIT-BTECH1063922';
const PASSWORD = process.env.PASSWORD;
const GMAIL = process.env.GMAIL;
const GMAIL_PASS = process.env.GMAIL_PASS;

function decrypt(text) {
  const [ivHex, encrypted] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}


let seenJobs = fs.existsSync('seenJobs.json')
  ? JSON.parse(fs.readFileSync('seenJobs.json'))
  : [];

async function run() {
  const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

  const page = await browser.newPage();

  try {
    console.log(' Opening login page...');
    await page.goto('https://tp.bitmesra.co.in/login.html', { waitUntil: 'networkidle2' });

    console.log(' Filling credentials...');
    await page.type('#identity', USERNAME);
    await page.type('#password', PASSWORD);

    await Promise.all([
      page.click("input[type='submit']"),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    const currentUrl = page.url();
    console.log(' Logged in. Final URL:', currentUrl);
    if (!currentUrl.includes('index.html')) throw new Error(' Login failed.');

    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const jobs = await page.evaluate(() => {
      return [...document.querySelectorAll('table tbody tr')].map(row => {
        const cols = row.querySelectorAll('td');
        return {
          company: cols[0]?.innerText.trim(),
          deadline: cols[1]?.innerText.trim(),
          posted: cols[2]?.innerText.trim(),
          link: cols[3]?.querySelector('a')?.href || 'N/A',
        };
      });
    });

    const newJobs = jobs.filter(job =>
      !seenJobs.find(j => j.company === job.company && j.deadline === job.deadline)
    );

    if (newJobs.length === 0) {
      console.log(' No new jobs.');
    } else {
      console.log(` ${newJobs.length} new job(s) found!`);
      console.table(newJobs);
      const users = JSON.parse(fs.readFileSync('users.json'));

      for (const { email, password } of users) {
        const userEmail = decrypt(email);
        const userPass = decrypt(password);

        await sendEmail(newJobs, userEmail, userPass);
      }




      seenJobs = jobs;
      fs.writeFileSync('seenJobs.json', JSON.stringify(seenJobs, null, 2));
    }

  } catch (err) {
    console.error(' Error:', err.message);
  } finally {
    await browser.close();
  }
}

async function sendEmail(jobs, to, pass) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: to,
      pass,
    },
  });

  const body = jobs.map(job =>
    `Company: ${job.company}\nDeadline: ${job.deadline}\nPosted: ${job.posted}\nLink: ${job.link}`
  ).join('\n\n');

  const mailOptions = {
    from: to,
    to,
    subject: ` ${jobs.length} New Job(s) from BIT TNP`,
    text: body,
  };

  await transporter.sendMail(mailOptions);
  console.log(` Email sent to ${to}`);
}

cron.schedule('*/60 * * * *', run);
run();
