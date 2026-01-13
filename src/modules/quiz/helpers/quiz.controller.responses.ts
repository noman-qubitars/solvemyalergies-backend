import { Response } from "express";

export const sendAnswerSuccessResponse = (
  res: Response,
  userAnswer: any,
  statusCode: number = 201
) => {
  res.status(statusCode).json({
    success: true,
    message:
      statusCode === 201
        ? "Answer saved successfully"
        : "Answer updated successfully",
    data: {
      id: userAnswer._id,
      userId: userAnswer.userId,
      answers: userAnswer.answers,
      assignedSessions: (userAnswer as any).assignedSessions,
      sessionAssignments: (userAnswer as any).sessionAssignments,
      createdAt: userAnswer.createdAt,
      updatedAt: userAnswer.updatedAt,
    },
  });
};

export const sendPatchAnswerSuccessResponse = (res: Response, userAnswer: any) => {
  res.status(200).json({
    success: true,
    message: "Answer updated successfully",
    data: {
      id: userAnswer._id,
      userId: userAnswer.userId,
      answers: userAnswer.answers,
      photo: userAnswer.photo,
      file: userAnswer.file,
      createdAt: userAnswer.createdAt,
      updatedAt: userAnswer.updatedAt,
    },
  });
};

export const sendSessionCalculationResponse = (res: Response, userAnswer: any) => {
  res.status(200).json({
    success: true,
    message: "Sessions calculated successfully",
    data: {
      assignedSessions: (userAnswer as any).assignedSessions,
      sessionAssignments: (userAnswer as any).sessionAssignments,
    },
  });
};

export const sendErrorResponse = (
  res: Response,
  statusCode: number,
  message: string
) => {
  res.status(statusCode).json({
    success: false,
    message,
  });
};

export const sendInternalErrorResponse = (res: Response, error: any) => {
  res.status(500).json({
    success: false,
    message: error.message || "Internal server error",
  });
};