const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const axios = require('axios');
const cheerio = require('cheerio');
const readline = require('readline');
const Mailjet = require('node-mailjet');

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

// Test function for Mailjet
async function testMailjetConnection(apiKey, apiSecret, senderEmail) {
  try {
    console.log('🔍 Testing Mailjet connection...');
    
    const mailjet = new Mailjet({
      apiKey: apiKey.trim(),
      apiSecret: apiSecret.trim(),
      options: {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    });

    // Test API connection
    console.log('Testing API connection...');
    const testResponse = await mailjet.get('user', { version: 'v3' }).request();
    console.log('✅ API Connection successful');
    console.log('User info:', testResponse.body);

    // Test email sending
    console.log('\nTesting email sending...');
    const testEmail = {
      Messages: [
        {
          From: {
            Email: senderEmail.trim(),
            Name: "Test Sender"
          },
          To: [
            {
              Email: senderEmail.trim(), // Send to self for testing
              Name: "Test Recipient"
            }
          ],
          Subject: "Test Email from Inreach",
          TextPart: "This is a test email to verify Mailjet configuration.",
          HTMLPart: "<h3>This is a test email to verify Mailjet configuration.</h3>"
        }
      ]
    };

    const sendResponse = await mailjet.post('send', { version: 'v3.1' }).request(testEmail);
    console.log('✅ Test email sent successfully');
    console.log('Message ID:', sendResponse.body.Messages[0].To[0].MessageID);
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    return false;
  }
}

// Main function to process CSV and send emails
async function processCSVAndSendEmails(filePath, userEmail, apiKey, apiSecret) {
  try {
    // First test the Mailjet connection
    console.log('🧪 Testing Mailjet configuration before processing...');
    const testResult = await testMailjetConnection(apiKey, apiSecret, userEmail);
    
    if (!testResult) {
      throw new Error('Mailjet test failed. Please check your configuration and try again.');
    }

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

    // Find email and name columns
    const emailColumn = Object.entries(columnTypes).find(([_, type]) => type === "Email")?.[0];
    const nameColumn = Object.entries(columnTypes).find(([_, type]) => type === "Name")?.[0];

    if (!emailColumn) {
      throw new Error("No email column found in CSV");
    }

    console.log("\n🚀 Starting email sending process...");

    const results = {
      successful: [],
      failed: []
    };

    // Initialize Mailjet
    const mailjet = new Mailjet({
      apiKey: apiKey.trim(),
      apiSecret: apiSecret.trim()
    });

    // Hardcoded test template
    const testTemplate = {
      text: `Hello [Name],

I hope this email finds you well. I'm reaching out to introduce our healthcare technology solutions that could benefit your practice.

Our platform helps healthcare providers streamline their operations and improve patient care through innovative digital solutions.

Would you be interested in learning more about how we can help your practice?

Best regards,
[Your Name]`,
      html: `<h2>Hello [Name],</h2>
<p>I hope this email finds you well. I'm reaching out to introduce our healthcare technology solutions that could benefit your practice.</p>
<p>Our platform helps healthcare providers streamline their operations and improve patient care through innovative digital solutions.</p>
<p>Would you be interested in learning more about how we can help your practice?</p>
<p>Best regards,<br>[Your Name]</p>`
    };

    // Process each row
    for (const row of data) {
      const email = row[emailColumn];
      const name = row[nameColumn] || "Unknown";

      console.log(`\n👤 Processing: ${name}`);
      console.log(`📧 Email: ${email}`);

      try {
        // Replace placeholders in the template
        const personalizedText = testTemplate.text.replace('[Name]', name);
        const personalizedHtml = testTemplate.html.replace('[Name]', name);

        const data = {
          Messages: [
            {
              From: {
                Email: userEmail.trim(),
                Name: userEmail.split('@')[0]
              },
              To: [
                {
                  Email: email.trim(),
                  Name: name
                }
              ],
              Subject: 'Healthcare Technology Solutions for Your Practice',
              TextPart: personalizedText,
              HTMLPart: personalizedHtml
            }
          ]
        };

        console.log(`📧 Sending email to: ${email}`);
        const response = await mailjet.post('send', { version: 'v3.1' }).request(data);
        
        if (response.body.Messages[0].Status === 'success') {
          console.log(`✅ Email sent successfully to ${name}`);
          results.successful.push({ name, email });
        } else {
          throw new Error('Mailjet API returned unsuccessful status');
        }
      } catch (error) {
        console.error(`❌ Error sending to ${email}:`, error.message);
        results.failed.push({ name, email, reason: error.message });
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
    // Get user's Mailjet credentials
    const userEmail = await new Promise(resolve => {
      rl.question('\n📧 Enter your sending email address: ', resolve);
    });

    const apiKey = await new Promise(resolve => {
      rl.question('🔑 Enter your Mailjet API Key: ', resolve);
    });

    const apiSecret = await new Promise(resolve => {
      rl.question('🔐 Enter your Mailjet API Secret: ', resolve);
    });

    // Test Mailjet configuration first
    console.log('\n🧪 Testing Mailjet configuration...');
    const testResult = await testMailjetConnection(apiKey, apiSecret, userEmail);
    
    if (!testResult) {
      console.log('\n❌ Mailjet test failed. Please check your configuration and try again.');
      return;
    }

    console.log('\n✅ Mailjet test successful! Proceeding with email sending...');

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

    // Process CSV and send emails
    await processCSVAndSendEmails(filePath, userEmail, apiKey, apiSecret);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run the CLI
main(); 