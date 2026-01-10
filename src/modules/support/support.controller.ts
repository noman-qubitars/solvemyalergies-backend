import { Request, Response } from "express";
import { sendFeedbackEmail } from "../../services/mailService";

export const sendFeedback = async (req: Request, res: Response) => {
  try {
    const { fullName, email, emoji, message } = req.body;
    const adminEmail = "nomanshabbir10@gmail.com";

    // Send email to admin (hardcoded email address)
    await sendFeedbackEmail(fullName, email, emoji, message, adminEmail);

    res.status(200).json({
      success: true,
      message: "Feedback sent successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send feedback",
    });
  }
};