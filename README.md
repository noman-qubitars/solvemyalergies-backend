# SolveMyAllergies Backend

## Overview

This project exposes a Node.js backend with Mongoose/MongoDB and nodemailer OTP support for authentication flows. Routes under `/auth` support signup, signin, forgot password, OTP verification, and password reset steps.

## Getting Started

1. Copy `.env.example` to `.env` and fill in production values for the MongoDB Atlas URI, JWT secret, and SMTP credentials.
2. Run `npm install` to install dependencies.
3. Use `npm run dev` while developing or `npm run build && npm start` for production.

## Environment Variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret for signing authentication tokens |
| `PORT` | HTTP port (default 4000) |
| `OTP_EXPIRATION_MINUTES` | Expiration time for OTP codes |
| `EMAIL_HOST` | SMTP host |
| `EMAIL_PORT` | SMTP port |
| `EMAIL_SECURE` | `true` for TLS, `false` otherwise |
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASS` | SMTP password |
| `EMAIL_FROM` | Sender address for OTP emails |

## Database

The project uses Mongoose with MongoDB. Models are defined in `src/models/`:
- `User` model for user accounts
- `OtpToken` model for OTP verification codes

## Authentication Flow

- `POST /auth/signup` expects `{ email, password, name? }` and returns a JWT.
- `POST /auth/signin` verifies credentials and returns a JWT.
- `POST /auth/forgot-password` generates an OTP, stores it, and emails it via nodemailer.
- `POST /auth/otp` validates the OTP without consuming it.
- `POST /auth/reset-password` consumes the OTP and updates the password.

## Testing

Manual testing can be done via curl/Postman against the `localhost:${PORT}` endpoint. Ensure the SMTP credentials allow sending OTP emails before running the forgot-password flow.

