"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.verifyOtp = exports.forgotPassword = exports.signin = exports.signup = void 0;
const authService_1 = require("../services/authService");
const determineStatus = (message) => {
    if (message === "Account already exists" || message === "Invalid credentials" || message === "Invalid or expired code") {
        return 400;
    }
    if (message === "Account not found") {
        return 404;
    }
    return 422;
};
const handleError = (res, error) => {
    const message = error instanceof Error ? error.message : "Unexpected error";
    res.status(determineStatus(message)).json({ error: message });
};
const signup = async (req, res) => {
    try {
        const result = await (0, authService_1.signup)(req.body);
        res.status(201).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
};
exports.signup = signup;
const signin = async (req, res) => {
    try {
        const result = await (0, authService_1.signin)(req.body);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
};
exports.signin = signin;
const forgotPassword = async (req, res) => {
    try {
        const result = await (0, authService_1.requestPasswordReset)(req.body.email);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
};
exports.forgotPassword = forgotPassword;
const verifyOtp = async (req, res) => {
    try {
        const result = await (0, authService_1.verifyOtp)(req.body.email, req.body.code);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
};
exports.verifyOtp = verifyOtp;
const resetPassword = async (req, res) => {
    try {
        const body = { email: req.body.email, code: req.body.code, password: req.body.password };
        const result = await (0, authService_1.resetPassword)(body);
        res.status(200).json(result);
    }
    catch (error) {
        handleError(res, error);
    }
};
exports.resetPassword = resetPassword;
