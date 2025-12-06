import "dotenv/config";
import mongoose from "mongoose";
import { DailySessionQuestion } from "../models/DailySessionQuestion";
import { config } from "../config/env";

const questionsData = [
  {
    questionId: "question_1",
    questionText: "How do you feel today?",
    questionType: "single",
    order: 1
  },
  {
    questionId: "question_2",
    questionText: "Rate your symptoms no. 1 (Headache)",
    questionType: "rating",
    order: 2
  },
  {
    questionId: "question_3",
    questionText: "Rate your symptoms no. 2 (Eye symptom)",
    questionType: "rating",
    order: 3
  },
  {
    questionId: "question_4",
    questionText: "Rate your symptoms no. 3 (Fatigue)",
    questionType: "rating",
    order: 4
  },
  {
    questionId: "question_5",
    questionText: "Rate previous day's sleep and overall rest",
    questionType: "rating",
    order: 5
  },
  {
    questionId: "question_6",
    questionText: "Did you take your supplements today?",
    questionType: "single",
    order: 6
  },
  {
    questionId: "question_7",
    questionText: "Additional feedback",
    questionType: "text",
    order: 7
  }
];

const seedDailySessionQuestions = async () => {
  try {
    await mongoose.connect(config.databaseUrl);
    console.log("Connected to MongoDB");

    for (const questionData of questionsData) {
      const existingQuestion = await DailySessionQuestion.findOne({ 
        questionId: questionData.questionId 
      });
      
      if (existingQuestion) {
        await DailySessionQuestion.updateOne(
          { questionId: questionData.questionId },
          questionData
        );
        console.log(`Updated question: ${questionData.questionId}`);
      } else {
        await DailySessionQuestion.create(questionData);
        console.log(`Created question: ${questionData.questionId} - ${questionData.questionText.substring(0, 50)}...`);
      }
    }

    console.log("Daily session questions seeded successfully!");
    await mongoose.disconnect();
    console.log("Database disconnected");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding daily session questions:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedDailySessionQuestions();