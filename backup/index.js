require("dotenv").config();

const twilio = require("twilio");
const fs = require("fs");
const path = require("path");

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

const responseFile = path.join(__dirname, "twilio-response.json");
const ordersFile = path.join(__dirname, "orders.json");

// Fallback data
const fallbackOrders = [
  {
    orderNumber: "ORD-12345",
    phoneNumbers: [
      "+919876543210",
      "+919876543211",
      "+919876543212"
    ]
  }
];

// orders.json read karo
function getOrders() {
  if (fs.existsSync(ordersFile)) {
    try {
      const data = fs.readFileSync(ordersFile, "utf8");

      const orders = JSON.parse(data);

      console.log("Orders loaded from orders.json");

      return orders;
    } catch (error) {
      console.error(
        "orders.json read/parse failed. Using fallback data."
      );

      return fallbackOrders;
    }
  }

  console.log(
    "orders.json not found. Using fallback data."
  );

  return fallbackOrders;
}

async function sendOrderSMS() {
  const orders = getOrders();

  const responses = [];

  for (const order of orders) {
    for (const phoneNumber of order.phoneNumbers) {
      try {
        const message = await client.messages.create({
          body: `New Order received: ${order.orderNumber}`,
          from: process.env.TWILIO_PHONE,
          to: phoneNumber,
        });

        const response = message.toJSON();

        responses.push({
          orderNumber: order.orderNumber,
          phoneNumber: phoneNumber,
          success: true,
          response: response
        });

        console.log(
          `SMS sent | Order: ${order.orderNumber} | To: ${phoneNumber}`
        );

      } catch (error) {
        responses.push({
          orderNumber: order.orderNumber,
          phoneNumber: phoneNumber,
          success: false,
          error: error.message,
          code: error.code || null,
          status: error.status || null
        });

        console.error(
          `SMS failed | Order: ${order.orderNumber} | To: ${phoneNumber} | ${error.message}`
        );
      }
    }
  }

  fs.writeFileSync(
    responseFile,
    JSON.stringify(responses, null, 2),
    "utf8"
  );

  console.log(
    "All SMS responses saved to:",
    responseFile
  );
}

sendOrderSMS();