"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.verifyOtp = exports.requestPasswordReset = exports.signin = exports.signup = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const User_1 = require("../models/User");
const OtpToken_1 = require("../models/OtpToken");
const mailService_1 = require("./mailService");
const SALT_ROUNDS = 10;
const OTP_LENGTH = 6;
const createToken = (userId) => {
    return jsonwebtoken_1.default.sign({ sub: userId }, env_1.config.jwtSecret, { expiresIn: "1h" });
};
const generateOtpCode = () => {
    const min = 10 ** (OTP_LENGTH - 1);
    const max = 10 ** OTP_LENGTH - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
};
const createOtpRecord = async (userId, code) => {
    const hashedCode = await bcrypt_1.default.hash(code, SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + env_1.config.otpExpirationMinutes * 60 * 1000);
    return OtpToken_1.OtpToken.create({
        code: hashedCode,
        expiresAt,
        userId
    });
};
const getValidOtp = async (userId, code) => {
    const now = new Date();
    const record = await OtpToken_1.OtpToken.findOne({
        userId,
        used: false,
        expiresAt: { $gt: now }
    }).sort({ createdAt: -1 });
    if (!record) {
        throw new Error("Invalid or expired code");
    }
    const match = await bcrypt_1.default.compare(code, record.code);
    if (!match) {
        throw new Error("Invalid or expired code");
    }
    return record;
};
const signup = async (payload) => {
    const existing = await User_1.User.findOne({ email: payload.email });
    if (existing) {
        throw new Error("Account already exists");
    }
    const hashedPassword = await bcrypt_1.default.hash(payload.password, SALT_ROUNDS);
    const user = await User_1.User.create({
        email: payload.email,
        password: hashedPassword,
        name: payload.name
    });
    return { token: createToken(user._id.toString()), userId: user._id.toString() };
};
exports.signup = signup;
const signin = async (payload) => {
    const user = await User_1.User.findOne({ email: payload.email });
    if (!user) {
        throw new Error("Invalid credentials");
    }
    const isValid = await bcrypt_1.default.compare(payload.password, user.password);
    if (!isValid) {
        throw new Error("Invalid credentials");
    }
    return { token: createToken(user._id.toString()), userId: user._id.toString() };
};
exports.signin = signin;
const requestPasswordReset = async (email) => {
    const user = await User_1.User.findOne({ email });
    if (!user) {
        throw new Error("Account not found");
    }
    const otp = generateOtpCode();
    await createOtpRecord(user._id.toString(), otp);
    await (0, mailService_1.sendOtpEmail)(user.email, otp);
    return { message: "Code sent" };
};
exports.requestPasswordReset = requestPasswordReset;
const verifyOtp = async (email, code) => {
    const user = await User_1.User.findOne({ email });
    if (!user) {
        throw new Error("Account not found");
    }
    await getValidOtp(user._id.toString(), code);
    return { message: "Code valid" };
};
exports.verifyOtp = verifyOtp;
const resetPassword = async (payload) => {
    const user = await User_1.User.findOne({ email: payload.email });
    if (!user) {
        throw new Error("Account not found");
    }
    const record = await getValidOtp(user._id.toString(), payload.code);
    await OtpToken_1.OtpToken.updateOne({ _id: record._id }, { used: true });
    const hashedPassword = await bcrypt_1.default.hash(payload.password, SALT_ROUNDS);
    await User_1.User.updateOne({ _id: user._id }, { password: hashedPassword });
    return { message: "Password updated" };
};
exports.resetPassword = resetPassword;
