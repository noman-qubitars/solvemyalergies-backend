import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError && error.issues && error.issues.length > 0) {
        const firstIssue = error.issues[0];
        let errorMessage = firstIssue.message;
        
        if (firstIssue.code === "invalid_type") {
          const fieldName = firstIssue.path.length > 0 
            ? firstIssue.path.join(".") 
            : "Field";
          const received = (firstIssue as any).received;
          if (received === "undefined") {
            errorMessage = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
          } else {
            errorMessage = `${fieldName}: ${firstIssue.message}`;
          }
        } else if (firstIssue.path.length > 0) {
          const fieldName = firstIssue.path.join(".");
          errorMessage = `${fieldName}: ${firstIssue.message}`;
        }
        
        return res.status(400).json({
          success: false,
          message: errorMessage
        });
      }
      return res.status(400).json({
        success: false,
        message: "Validation error"
      });
    }
  };
};