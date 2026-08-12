// services/twilioService.js
//
// Twilio SMS logic — kept separate from UI/API logic as required.
// This reuses the exact working Twilio client setup and message.toJSON()
// pattern from the original index.js, refactored into reusable functions.

const twilio = require("twilio");
const fs = require("fs");
const path = require("path");

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

const responseFile = path.join(__dirname, "..", "data", "twilio-response.json");

/**
 * Read all previously stored Twilio responses.
 * Never throws — returns [] if file is missing or invalid.
 */
function readResponses() {
  if (!fs.existsSync(responseFile)) {
    return [];
  }
  try {
    const data = fs.readFileSync(responseFile, "utf8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("twilio-response.json read/parse failed. Starting with empty history.");
    return [];
  }
}

/**
 * Append new results to twilio-response.json without losing history.
 */
function saveResponses(newResults) {
  const existing = readResponses();
  const combined = existing.concat(newResults);
  fs.writeFileSync(responseFile, JSON.stringify(combined, null, 2), "utf8");
  return combined;
}

/**
 * Send a single SMS. Never throws — always resolves with a result object.
 * Matches the exact shape the original index.js saved to
 * twilio-response.json: full message.toJSON() nested under "response"
 * on success, and error/code/status on failure.
 */
async function sendSMS(orderNumber, phoneNumber) {
  try {
    const message = await client.messages.create({
      body: `New Order received: ${orderNumber}`,
      from: process.env.TWILIO_PHONE,
      to: phoneNumber,
    });

    const response = message.toJSON();

    console.log(`SMS sent | Order: ${orderNumber} | To: ${phoneNumber}`);

    return {
      orderNumber,
      phoneNumber,
      success: true,
      response: response,
    };
  } catch (error) {
    console.error(`SMS failed | Order: ${orderNumber} | To: ${phoneNumber} | ${error.message}`);

    return {
      orderNumber,
      phoneNumber,
      success: false,
      error: error.message,
      code: error.code || null,
      status: error.status || null,
    };
  }
}

/**
 * Execute an entire group: loop through every phone number,
 * send SMS to each, and keep going even if one fails.
 */
async function executeGroup(orderNumber, phoneNumbers) {
  const results = [];

  for (const phoneNumber of phoneNumbers) {
    const result = await sendSMS(orderNumber, phoneNumber);
    results.push(result);
  }

  saveResponses(results);

  const successful = results.filter((r) => r.success).length;
  const failed = results.length - successful;

  return {
    orderNumber,
    total: results.length,
    successful,
    failed,
    results,
  };
}

module.exports = {
  sendSMS,
  executeGroup,
  readResponses,
};
