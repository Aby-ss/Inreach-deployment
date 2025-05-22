"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { useRef, useEffect } from "react";
import Mailjet from 'node-mailjet';
import axios from 'axios';
import * as cheerio from 'cheerio';

export default function Home() {

  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [columns, setColumns] = useState({});
  const [manualMode, setManualMode] = useState(false);
  const [confirmedManual, setConfirmedManual] = useState(false);
  const [columnIndexMap, setColumnIndexMap] = useState(null);
  const [text, setText] = useState("");
  const [generatedEmails, setGeneratedEmails] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [numCopies, setNumCopies] = useState(1);
  const [selectedEmailIndex, setSelectedEmailIndex] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [sendResults, setSendResults] = useState(null);
  const [mailjetConfig, setMailjetConfig] = useState({
    apiKey: '',
    apiSecret: '',
    senderEmail: ''
  });
  const [emailTemplate, setEmailTemplate] = useState('');

  const textareaRef = useRef(null);

  const detectColumnType = (header, values) => {
    const joined = values.join(" ").toLowerCase();

    if (/[\w.-]+@[\w.-]+\.\w+/.test(joined)) return "Email";
    if (/https?:\/\/(www\.)?linkedin\.com\/in\//.test(joined)) return "LinkedIn";
    if (/https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9_.]+/.test(joined)) return "Instagram";
    if (/https?:\/\/(www\.)?facebook\.com\/[A-Za-z0-9_.]+/.test(joined)) return "Facebook";
    if (/https?:\/\/|www\.[\w.-]+\.\w{2,}/.test(joined)) return "Website";
    if (/name|company|prospect/.test(header.toLowerCase())) return "Name";
    return "Unknown";
  };

  useEffect(() => {
    // Auto-expand the textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [text]);

  const handleChange = (e) => {
    const words = e.target.value.trim().split(/\s+/);
    if (words.length <= 150) {
      setText(e.target.value);
    }
  };

  const getColumnIndexes = (columns, headers) => {
    const indexMap = {};
    for (const [header, type] of Object.entries(columns)) {
      const index = headers.indexOf(header);
      if (index !== -1) {
        indexMap[type.toLowerCase()] = index;
      }
    }
    return indexMap;
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setManualMode(false);
    setConfirmedManual(false);
    setColumnIndexMap(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data.slice(0, 5);
        const headers = Object.keys(rows[0]);

        const detected = {};
        headers.forEach((header) => {
          const values = rows.map((row) => row[header] || "");
          detected[header] = detectColumnType(header, values);
        });

        setColumns(detected);
        setPreviewData(rows);
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleCheckboxChange = (header, type) => {
    setColumns((prev) => ({
      ...prev,
      [header]: prev[header] === type ? "Unknown" : type,
    }));
  };

  const handleAcceptColumns = () => {
    const headers = Object.keys(previewData[0] || {});
    const map = getColumnIndexes(columns, headers);
    setColumnIndexMap(map);
    alert("✅ Column detection accepted.");
    console.log("📊 Final column indexes map:", map);
  };

  const handleManualInput = () => {
    setManualMode(true);
  };

  const handleConfirmManual = () => {
    setConfirmedManual(true);
    const headers = Object.keys(previewData[0] || {});
    const map = getColumnIndexes(columns, headers);
    setColumnIndexMap(map);
    alert("✅ Manual column selection confirmed.");
    console.log("🛠️ Final manual column indexes map:", map);
  };

  const handleGenerateCopies = async () => {
    if (!text || !columnIndexMap) {
      alert("Please provide business context and upload a file first.");
      return;
    }

    setIsGenerating(true);
    try {
      const newEmails = [];
      for (let i = 0; i < numCopies; i++) {
        // Get the business context from the textarea
        const businessContext = text;

        // Prepare the prompt for the LLM
        const prompt = `
          You are an expert cold email strategist. Use the business context below to generate a personalized cold email.
          Make sure the email is short and to the point, the very first paragraph or few sentences should be the hook that grabs attention.
          And use no emojis.

          📌 Business Context:
          ${businessContext}

          Generate a cold email that:
          1. Has a strong hook in the first few sentences
          2. Is personalized to the recipient
          3. Is concise and to the point
          4. Has a clear call to action
        `;

        // Call the local Ollama LLM
        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'mistral',
            prompt: prompt,
            stream: false,
          }),
        });

        const data = await response.json();
        newEmails.push(data.response);
      }
      
      setGeneratedEmails(prev => [...prev, ...newEmails]);
    } catch (error) {
      console.error("Error generating copies:", error);
      alert("Error generating copies. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to extract email from website
  const extractEmailFromWebsite = async (url) => {
    try {
      // Ensure URL has proper protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      console.log(`🌐 Scraping website: ${url}`);
      
      // Use a CORS proxy
      const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      
      // Add headers to mimic a browser request
      const response = await axios.get(corsProxyUrl, {
        timeout: 15000, // Increased timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Accept all status codes less than 500
        }
      });

      if (response.status !== 200) {
        console.log(`❌ Website returned status code: ${response.status}`);
        return null;
      }

      const html = response.data;
      const $ = cheerio.load(html);
      
      // Look for mailto links
      let email = null;
      $('a[href^="mailto:"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          email = href.replace('mailto:', '').trim();
        }
      });

      // If no mailto link found, search in text
      if (!email) {
        const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
        const matches = html.match(emailRegex);
        if (matches && matches.length > 0) {
          // Filter out common false positives
          email = matches.find(match => 
            !match.includes('example.com') && 
            !match.includes('domain.com') &&
            !match.includes('yourdomain.com') &&
            !match.includes('email.com')
          );
        }
      }

      if (email) {
        console.log(`✅ Found email: ${email}`);
      } else {
        console.log(`❌ No email found`);
      }

      return email;
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(`❌ Error scraping ${url}: Server responded with status ${error.response.status}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error(`❌ Error scraping ${url}: No response received. Trying alternative method...`);
        try {
          // Try alternative CORS proxy
          const altProxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
          const altResponse = await axios.get(altProxyUrl, {
            timeout: 15000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Origin': 'http://localhost:3000'
            }
          });
          
          if (altResponse.status === 200) {
            const html = altResponse.data;
            const $ = cheerio.load(html);
            
            // Look for mailto links
            let email = null;
            $('a[href^="mailto:"]').each((_, element) => {
              const href = $(element).attr('href');
              if (href) {
                email = href.replace('mailto:', '').trim();
              }
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
              console.log(`✅ Found email using alternative method: ${email}`);
              return email;
            }
          }
        } catch (altError) {
          console.error(`❌ Alternative method also failed for ${url}`);
        }
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error(`❌ Error scraping ${url}: ${error.message}`);
      }
      return null;
    }
  };

  const handleSendEmails = async () => {
    if (selectedEmailIndex === null) {
      alert("Please select an email template first");
      return;
    }

    if (!mailjetConfig.apiKey || !mailjetConfig.apiSecret || !mailjetConfig.senderEmail) {
      alert("Please fill in all Mailjet configuration fields");
      return;
    }

    setIsSending(true);
    try {
      const mailjet = new Mailjet({
        apiKey: mailjetConfig.apiKey,
        apiSecret: mailjetConfig.apiSecret
      });

      const results = {
        successful: [],
        failed: []
      };

      // Find website column
      const websiteColumn = Object.keys(previewData[0]).find(key => 
        columns[key] === 'Website' || 
        key.toLowerCase().includes('website') ||
        key.toLowerCase().includes('url') ||
        columns[key]?.toLowerCase().includes('website')
      );

      if (!websiteColumn) {
        throw new Error("No website column found in CSV");
      }

      // Process each recipient
      for (const row of previewData) {
        const website = row[websiteColumn];
        if (!website) {
          console.log('❌ Skipping row - No website URL found');
          continue;
        }

        const nameColumn = Object.keys(row).find(key => 
          columns[key] === 'Name' || 
          key.toLowerCase().includes('name') ||
          columns[key]?.toLowerCase().includes('name')
        );
        const recipientName = nameColumn ? row[nameColumn] : 'Unknown';

        console.log(`\n👤 Processing: ${recipientName}`);
        console.log(`🌐 Website: ${website}`);

        // Extract email from website
        const recipientEmail = await extractEmailFromWebsite(website);
        
        if (!recipientEmail) {
          console.log(`❌ Skipping ${recipientName} - No email found`);
          results.failed.push({
            name: recipientName,
            reason: 'No email found on website'
          });
          continue;
        }

        try {
          const data = {
            Messages: [
              {
                From: {
                  Email: mailjetConfig.senderEmail,
                  Name: mailjetConfig.senderEmail.split('@')[0]
                },
                To: [
                  {
                    Email: recipientEmail,
                    Name: recipientName
                  }
                ],
                Subject: 'Reaching out about potential collaboration',
                TextPart: generatedEmails[selectedEmailIndex]
              }
            ]
          };

          console.log(`📧 Sending email to: ${recipientEmail}`);
          const response = await mailjet.post('send', { version: 'v3.1' }).request(data);
          
          if (response.body.Messages[0].Status === 'success') {
            console.log(`✅ Email sent successfully to ${recipientName}`);
            results.successful.push({
              name: recipientName,
              email: recipientEmail
            });
          } else {
            console.log(`❌ Failed to send email to ${recipientName}`);
            results.failed.push({
              name: recipientName,
              email: recipientEmail,
              reason: 'Failed to send'
            });
          }
        } catch (error) {
          console.error(`Error sending to ${recipientEmail}:`, error);
          results.failed.push({
            name: recipientName,
            email: recipientEmail,
            reason: error.message
          });
        }
      }

      setSendResults(results);
      
      // Show summary
      const successCount = results.successful.length;
      const failCount = results.failed.length;
      alert(`Email sending complete!\n✅ Successfully sent: ${successCount}\n❌ Failed: ${failCount}`);
    } catch (error) {
      console.error('Error sending emails:', error);
      alert('Error sending emails. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 sm:p-20">
      <main className="flex flex-col gap-8 items-center w-full">
        <h1 className="gabarito-semibold tracking-tighter text-7xl text-center max-w-[950px]">
          Upload the contact spreadsheet
        </h1>

        <div
          {...getRootProps()}
          className="w-[500px] h-20 border-4 text-xl border-dashed border-gray-400 gabarito-medium rounded-xl flex items-center justify-center text-[#AEAEAE] cursor-pointer hover:border-[#686AF1] transition text-center"
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the file here...</p>
          ) : (
            <p>Drag & Drag a CSV File or Click to Choose</p>
          )}
        </div>

        {uploadedFileName && (
          <p className="text-green-600 gabarito-medium">
            ✅ File uploaded: <span className="gabarito-semibold text-lg">{uploadedFileName}</span>
          </p>
        )}

        {previewData.length > 0 && (
          <div className="relative w-full max-w-5xl overflow-hidden rounded-xl border border-gray-300 shadow-sm mt-8 bg-[#FEFEFE]">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr>
                  {Object.keys(previewData[0]).map((key, i) => (
                    <th
                      key={i}
                      className="p-2 border-b text-xl gabarito-semibold tracking-tight text-left text-black"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((value, j) => (
                      <td
                        key={j}
                        className="p-2 text-lg gabarito-medium tracking-tighter text-[#BEBEBE] text-left truncate max-w-[200px]"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-[#FEFEFE] to-transparent pointer-events-none" />
          </div>
        )}


        {previewData.length > 0 && !manualMode && (
          <>
            <div className="mt-8 space-y-3">
              {Object.entries(columns).map(([header, type], i) => (
                <div key={i} className="flex items-center gap-3">
                  <img src="/GreenTick.png" alt="check" className="w-9 h-auto mt-1" />
                  <p className="text-black text-xl gabarito-semibold">
                    Column {i + 1} detected as: <em>{type}</em> (<span className="font-medium">{header}</span>)
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleAcceptColumns}
                className="bg-[#00D091] text-white px-6 py-3 rounded-full hover:bg-[#00C187] transition gabarito-medium"
              >
                Accurate Detection
              </button>
              <button
                onClick={handleManualInput}
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-full hover:bg-gray-300 transition gabarito-medium"
              >
                Manually Define
              </button>
            </div>
          </>
        )}

        {manualMode && (
          <div className="mt-8 max-w-4xl w-full">
            <h2 className="text-xl tracking-tight gabarito-semibold mb-4">Select column types manually</h2>
            {Object.keys(columns).map((header, i) => (
              <div key={i} className="mb-3 p-4 bg-gray-50 border rounded-xl flex flex-col gap-2">
                <p className="tracking-tight gabarito-medium">{header}</p>
                <div className="flex gap-4 flex-wrap gabarito-medium">
                  {["Email", "LinkedIn", "Instagram", "Facebook", "Website", "Name"].map((type) => (
                    <label key={type} className="flex items-center gap-2 gabarito-medium">
                      <input
                        type="checkbox"
                        checked={columns[header] === type}
                        onChange={() => handleCheckboxChange(header, type)}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-6 flex justify-center">
              <button
                onClick={handleConfirmManual}
                className="gabarito-medium bg-[#00D091] text-white text-xl px-6 py-3 rounded-full hover:bg-[#00C187] transition"
              >
                Confirm column selection
              </button>
            </div>
          </div>
        )}

        {uploadedFileName && (
          <div className="px-6 py-10 flex flex-col items-center">
            <h1 className="gabarito-semibold tracking-tighter text-7xl max-w-[950px] text-center">
              Explain your business briefly
            </h1>

            <textarea
              ref={textareaRef}
              className="mt-6 w-full max-w-[950px] bg-[#FEFEFE] border border-[#CDCDCD] rounded-lg p-4 text-base gabarito-medium text-[#C0C0C0] resize-none overflow-hidden"
              rows={1}
              value={text}
              placeholder="I run a marketing agency targeting small software business ..."
              onChange={handleChange}
            />

            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="flex items-center gap-4">
                <label className="gabarito-medium text-gray-700">
                  Number of copies:
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={numCopies}
                    onChange={(e) => setNumCopies(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="ml-2 w-16 px-2 py-1 border border-gray-300 rounded-md"
                  />
                </label>
              </div>
              <button
                onClick={handleGenerateCopies}
                disabled={isGenerating}
                className={`gabarito-semibold text-white text-2xl px-6 py-3 rounded-full transition ${
                  isGenerating ? 'bg-gray-400' : 'bg-[#00D091] hover:bg-[#00C187]'
                }`}
              >
                {isGenerating ? 'Generating...' : 'Generate Copies'}
              </button>
            </div>

            {generatedEmails.length > 0 && (
              <div className="mt-8 w-full max-w-6xl">
                <h2 className="text-2xl gabarito-semibold mb-4">Generated Emails</h2>
                
                {/* Add Mailjet Configuration Section */}
                <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200">
                  <h3 className="text-xl gabarito-semibold mb-4">Mailjet Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm gabarito-medium text-gray-700 mb-1">
                        Sender Email
                      </label>
                      <input
                        type="email"
                        value={mailjetConfig.senderEmail}
                        onChange={(e) => setMailjetConfig(prev => ({ ...prev, senderEmail: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md gabarito-medium"
                        placeholder="your-email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm gabarito-medium text-gray-700 mb-1">
                        Mailjet API Key
                      </label>
                      <input
                        type="password"
                        value={mailjetConfig.apiKey}
                        onChange={(e) => setMailjetConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md gabarito-medium"
                        placeholder="Your Mailjet API Key"
                      />
                    </div>
                    <div>
                      <label className="block text-sm gabarito-medium text-gray-700 mb-1">
                        Mailjet API Secret
                      </label>
                      <input
                        type="password"
                        value={mailjetConfig.apiSecret}
                        onChange={(e) => setMailjetConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md gabarito-medium"
                        placeholder="Your Mailjet API Secret"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {generatedEmails.map((email, index) => (
                    <div 
                      key={index} 
                      className={`p-6 rounded-xl border shadow-sm cursor-pointer transition-all duration-300 ease-in-out ${
                        selectedEmailIndex === index 
                          ? 'bg-[#EDFCF7] border-[#00D091]' 
                          : 'bg-white border-gray-200'
                      }`}
                      onClick={() => setSelectedEmailIndex(index)}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg gabarito-semibold">Email {index + 1}</h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(email);
                            alert('Email copied to clipboard!');
                          }}
                          className="text-[#00D091] hover:text-[#00C187] gabarito-medium"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="whitespace-pre-wrap text-gray-700 gabarito-medium">
                        {email}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-center">
                  <button
                    onClick={handleSendEmails}
                    disabled={isSending || selectedEmailIndex === null}
                    className={`gabarito-semibold text-white text-2xl px-6 py-3 rounded-full transition-all duration-300 ease-in-out ${
                      isSending || selectedEmailIndex === null
                        ? 'bg-gray-400'
                        : 'bg-[#00D091] hover:bg-[#00C187]'
                    }`}
                  >
                    {isSending ? 'Sending...' : 'Send Emails'}
                  </button>
                </div>

                {sendResults && (
                  <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
                    <h3 className="text-xl gabarito-semibold mb-4">Sending Results</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-lg gabarito-medium text-[#00D091]">✅ Successful ({sendResults.successful.length})</h4>
                        <ul className="mt-2 space-y-2">
                          {sendResults.successful.map((result, index) => (
                            <li key={index} className="text-gray-700">
                              {result.name} ({result.email})
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-lg gabarito-medium text-red-500">❌ Failed ({sendResults.failed.length})</h4>
                        <ul className="mt-2 space-y-2">
                          {sendResults.failed.map((result, index) => (
                            <li key={index} className="text-gray-700">
                              {result.name} - {result.reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
