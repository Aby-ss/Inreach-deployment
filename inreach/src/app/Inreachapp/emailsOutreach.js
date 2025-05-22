const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const axios = require('axios');
const cheerio = require('cheerio');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to extract email from website
async function extractEmailFromWebsite(url) {
  try {
    console.log(`🌐 Scraping website: ${url}`);
    const response = await axios.get(url, { timeout: 10000 });
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Look for mailto links
    let email = null;
    $('a[href^="mailto:"]').each((_, element) => {
      const href = $(element).attr('href');
      email = href.replace('mailto:', '').trim();
    });

    // If no mailto link found, search in text
    if (!email) {
      const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
      const matches = html.match(emailRegex);
      if (matches && matches.length > 0) {
        email = matches[0];
      }
    }

    if (email) {
      console.log(`✅ Found email: ${email}`);
    } else {
      console.log(`❌ No email found`);
    }

    return email;
  } catch (error) {
    console.error(`❌ Error scraping ${url}:`, error.message);
    return null;
  }
}

// Function to detect column types
function detectColumnType(header, values) {
  const joined = values.join(" ").toLowerCase();

  if (/[\w.-]+@[\w.-]+\.\w+/.test(joined)) return "Email";
  if (/https?:\/\/(www\.)?linkedin\.com\/in\//.test(joined)) return "LinkedIn";
  if (/https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9_.]+/.test(joined)) return "Instagram";
  if (/https?:\/\/(www\.)?facebook\.com\/[A-Za-z0-9_.]+/.test(joined)) return "Facebook";
  if (/https?:\/\/|www\.[\w.-]+\.\w{2,}/.test(joined)) return "Website";
  if (/name|company|prospect/.test(header.toLowerCase())) return "Name";
  return "Unknown";
}

// Function to send email
async function sendEmail(to, subject, body) {
  try {
    // TODO: Implement your email sending logic here
    console.log(`📧 Sending email to: ${to}`);
    console.log(`📝 Subject: ${subject}`);
    console.log(`📄 Body: ${body}`);
    
    // Placeholder for actual email sending
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

// Main function to process CSV and send emails
async function processCSVAndSendEmails(filePath, emailTemplate) {
  try {
    // Read and parse CSV
    console.log(`📂 Reading CSV file: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data } = Papa.parse(fileContent, { header: true });

    // Detect column types
    const headers = Object.keys(data[0]);
    const columnTypes = {};
    headers.forEach(header => {
      const values = data.slice(0, 5).map(row => row[header] || "");
      columnTypes[header] = detectColumnType(header, values);
    });

    console.log("\n📊 Detected column types:");
    Object.entries(columnTypes).forEach(([header, type]) => {
      console.log(`   ${header}: ${type}`);
    });

    // Find website and name columns
    const websiteColumn = Object.entries(columnTypes).find(([_, type]) => type === "Website")?.[0];
    const nameColumn = Object.entries(columnTypes).find(([_, type]) => type === "Name")?.[0];

    if (!websiteColumn) {
      throw new Error("No website column found in CSV");
    }

    console.log("\n🚀 Starting email scraping and sending process...");

    const results = {
      successful: [],
      failed: []
    };

    // Process each row
    for (const row of data) {
      const website = row[websiteColumn];
      const name = row[nameColumn] || "Unknown";

      console.log(`\n👤 Processing: ${name}`);
      
      // Extract email from website
      const email = await extractEmailFromWebsite(website);
      
      if (!email) {
        console.log(`❌ Skipping ${name} - No email found`);
        results.failed.push({ name, reason: 'No email found' });
        continue;
      }

      // Send the email
      const success = await sendEmail(
        email,
        'Reaching out about potential collaboration',
        emailTemplate
      );

      if (success) {
        console.log(`✅ Email sent successfully to ${name}`);
        results.successful.push({ name, email });
      } else {
        console.log(`❌ Failed to send email to ${name}`);
        results.failed.push({ name, email, reason: 'Failed to send' });
      }
    }

    // Print summary
    console.log("\n📊 Summary:");
    console.log(`✅ Successfully sent: ${results.successful.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);

    if (results.failed.length > 0) {
      console.log("\n❌ Failed emails:");
      results.failed.forEach(({ name, reason }) => {
        console.log(`   - ${name}: ${reason}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// CLI interface
async function main() {
  try {
    // Get the directory of the current script
    const scriptDir = path.dirname(__filename);
    
    // Look for CSV files in the same directory
    const files = fs.readdirSync(scriptDir);
    const csvFiles = files.filter(file => file.endsWith('.csv'));
    
    if (csvFiles.length === 0) {
      throw new Error('No CSV files found in the current directory');
    }

    // Use the first CSV file found
    const filePath = path.join(scriptDir, csvFiles[0]);
    console.log(`📂 Using CSV file: ${csvFiles[0]}`);

    // Get email template
    const emailTemplate = await new Promise(resolve => {
      rl.question('\n📝 Enter your email template (press Enter twice to finish):\n', () => {
        let template = '';
        rl.on('line', (line) => {
          if (line === '') {
            rl.removeAllListeners('line');
            resolve(template.trim());
          } else {
            template += line + '\n';
          }
        });
      });
    });

    // Process CSV and send emails
    await processCSVAndSendEmails(filePath, emailTemplate);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run the CLI
main(); 