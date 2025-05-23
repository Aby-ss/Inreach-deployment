import { NextResponse } from 'next/server';
import Mailjet from 'node-mailjet';

export async function POST(request) {
  try {
    const { 
      recipients, 
      emailTemplate, 
      mailjetConfig 
    } = await request.json();

    // Initialize Mailjet
    const mailjet = new Mailjet({
      apiKey: mailjetConfig.apiKey.trim(),
      apiSecret: mailjetConfig.apiSecret.trim(),
      options: {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    });

    // Test the connection first
    try {
      console.log('🔍 Testing Mailjet connection...');
      const testResponse = await mailjet.get('user', { version: 'v3' }).request();
      console.log('✅ API Connection successful');
      console.log('User info:', testResponse.body);

      // Test email sending
      console.log('\nTesting email sending...');
      const testEmail = {
        Messages: [
          {
            From: {
              Email: mailjetConfig.senderEmail.trim(),
              Name: "Test Sender"
            },
            To: [
              {
                Email: mailjetConfig.senderEmail.trim(), // Send to self for testing
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
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      if (error.response) {
        console.error('API Response:', error.response.data);
      }
      return NextResponse.json(
        { error: 'Failed to connect to Mailjet API. Please check your credentials.' },
        { status: 400 }
      );
    }

    const results = {
      successful: [],
      failed: []
    };

    const senderName = mailjetConfig.senderEmail.split('@')[0];

    // Process each recipient
    for (const recipient of recipients) {
      const { email, name, company } = recipient;
      
      console.log(`\n👤 Processing: ${name}`);
      console.log(`📧 Email: ${email}`);

      try {
        // Replace placeholders in the email template
        let personalizedEmail = emailTemplate
          .replace(/\[first name\]/gi, name.split(' ')[0])
          .replace(/\[full name\]/gi, name)
          .replace(/\[sender name\]/gi, senderName)
          .replace(/\[sender email\]/gi, mailjetConfig.senderEmail)
          .replace(/\[company\]/gi, company)
          .replace(/\[organization\]/gi, company)
          .replace(/\[business\]/gi, company);

        const data = {
          Messages: [
            {
              From: {
                Email: mailjetConfig.senderEmail.trim(),
                Name: senderName
              },
              To: [
                {
                  Email: email.trim(),
                  Name: name
                }
              ],
              Subject: 'Healthcare Technology Solutions for Your Practice',
              TextPart: personalizedEmail,
              HTMLPart: personalizedEmail.replace(/\n/g, '<br>')
            }
          ]
        };

        console.log(`📧 Sending email to: ${email}`);
        const response = await mailjet.post('send', { version: 'v3.1' }).request(data);
        
        if (response.body.Messages[0].Status === 'success') {
          console.log(`✅ Email sent successfully to ${name}`);
          results.successful.push({
            name,
            email
          });
        } else {
          throw new Error('Mailjet API returned unsuccessful status');
        }
      } catch (error) {
        console.error(`❌ Error sending to ${email}:`, error.message);
        results.failed.push({
          name,
          email,
          reason: error.message
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in send-emails API:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 