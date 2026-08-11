# Twilio SMS App

A simple Node.js application for sending SMS messages using the Twilio API.

The application accepts an order number, sends an SMS notification through Twilio, and saves the complete Twilio API response into a JSON file.

## Features

- Send SMS using Twilio
- Dynamic order number in SMS message
- Environment-based Twilio credentials
- Save complete Twilio API response
- Automatically overwrite the previous response
- Error handling with JSON response
- Secure configuration using `.env`
- GitHub-ready project structure

## Requirements

Before running the project, make sure you have:

- Node.js installed
- npm installed
- A Twilio account
- A Twilio phone number
- Twilio Account SID
- Twilio Auth Token

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/akshaysain-dev/twilio-sms-app.git
```

### 2. Go to the project directory

```bash
cd twilio-sms-app
```

### 3. Install dependencies

```bash
npm install
```

### 4. Install Twilio

If installing the Twilio package separately:

```bash
npm install twilio
```

`twilio` is used for connecting to the Twilio API and sending SMS messages.

### 5. Install dotenv

Install `dotenv` for loading environment variables from the `.env` file:

```bash
npm install dotenv
```

### 6. Create the environment file

Create a `.env` file in the project root:

```env
TWILIO_SID=your_twilio_account_sid
TWILIO_AUTH=your_twilio_auth_token
TWILIO_PHONE=your_twilio_phone_number
TO_PHONE=recipient_phone_number
```

Example:

```env
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH=your_auth_token
TWILIO_PHONE=+1234567890
TO_PHONE=+919876543210
```

**Important:** Never commit the `.env` file to GitHub because it contains sensitive Twilio credentials.

### 7. Run the application

```bash
node index.js
```

If the SMS is sent successfully, you will see:

```text
SMS sent successfully!
Message SID: SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Response saved to: twilio-response.json
```

## Usage

The order number is passed to the SMS function in `index.js`:

```javascript
sendOrderSMS("ORD-12345");
```

To send an SMS for another order, change the order number:

```javascript
sendOrderSMS("ORD-12346");
```

The SMS will contain:

```text
New Order received: ORD-12346
```

## Twilio Response

After the SMS is sent, the complete Twilio API response is saved in:

```text
twilio-response.json
```

The response file is automatically overwritten whenever a new SMS is sent, so only the latest response is stored.

## Error Handling

If the SMS fails, the error response is saved in the same JSON file.

Example:

```json
{
  "error": true,
  "message": "Error message",
  "code": null,
  "status": null
}
```

## Project Structure

```text
twilio-sms-app/
│
├── index.js
├── package.json
├── package-lock.json
├── .gitignore
├── .env                  # Local only - not committed
└── twilio-response.json  # Generated locally - not committed
```

## Dependencies

The project uses:

- Node.js
- Twilio Node.js SDK
- dotenv

## Security

The following files are excluded from Git:

```text
.env
node_modules/
twilio-response.json
```

Never expose your Twilio:

- Account SID
- Auth Token
- Phone numbers or other private credentials

## Future Improvements

- REST API endpoint for sending SMS
- Laravel integration
- Automatic SMS when an order is created
- Delivery status tracking
- Twilio webhooks
- SMS logs and history
