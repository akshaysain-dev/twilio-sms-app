require("dotenv").config();

const twilio = require("twilio");
const fs = require("fs");
const path = require("path");

const client = twilio(
    process.env.TWILIO_SID,
    process.env.TWILIO_AUTH
);

const responseFile = path.join(__dirname, "twilio-response.json");

async function sendOrderSMS(corpOrderNum) {
    try {
        const message = await client.messages.create({
            body: `New Order received: ${corpOrderNum}`,
            from: process.env.TWILIO_PHONE,
            to: process.env.TO_PHONE
        });

        // Twilio SDK object ko plain JSON object me convert karo
        const response = message.toJSON();

        // Existing file overwrite ho jayegi
        fs.writeFileSync(
            responseFile,
            JSON.stringify(response, null, 2),
            "utf8"
        );

        console.log("SMS sent successfully!");
        console.log("Message SID:", message.sid);
        console.log("Response saved to:", responseFile);

    } catch (error) {

        const errorResponse = {
            error: true,
            message: error.message,
            code: error.code || null,
            status: error.status || null
        };

        fs.writeFileSync(
            responseFile,
            JSON.stringify(errorResponse, null, 2),
            "utf8"
        );

        console.error("Failed to send SMS:", error.message);
    }
}

sendOrderSMS("ORD-12345");