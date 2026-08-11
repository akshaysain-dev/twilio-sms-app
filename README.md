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

Clone the repository:

```bash
git clone https://github.com/akshaysain-dev/twilio-sms-app.git
