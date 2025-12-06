"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtpEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const transporter = nodemailer_1.default.createTransport({
    host: env_1.config.email.host,
    port: env_1.config.email.port,
    secure: env_1.config.email.secure,
    auth: {
        user: env_1.config.email.user,
        pass: env_1.config.email.pass
    }
});
const sendOtpEmail = async (recipient, otp) => {
    await transporter.sendMail({
        from: env_1.config.email.from,
        to: recipient,
        subject: "SolveMyAllergies reset code",
        text: `Use ${otp} to verify your request`
    });
};
exports.sendOtpEmail = sendOtpEmail;
