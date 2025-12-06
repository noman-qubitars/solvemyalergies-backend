import "dotenv/config";
import mongoose from "mongoose";
import { Question } from "../models/Question";
import { config } from "../config/env";

const questionsData = {
  "question_1": "When you have allergy symptoms, how badly are you affected?",
  "question_2": "Please select top 3 symptoms that apply to you:",
  "question_3": "What are the symptoms of your headache? Select up to 4:",
  "question_4": "What are your sinus / nose symptoms? Select up to 4:",
  "question_5": "What are our eye symptoms? Select up to 4:",
  "question_6": "For your throat symptoms, select up to 4:",
  "question_7": "Please select up to 4 of the lung symptoms that apply:",
  "question_8": "I get plenty of rest at night:",
  "question_9": "Please select all that apply to fatigue:",
  "question_10": "I am genetically:",
  "question_11": "I still have a menstrual cycle:",
  "question_12": "My menstrual cycle is:",
  "question_13": "I am pre or post menopausal",
  "question_14": "I have severe post menopausal symptoms",
  "question_15": "I eat a breakfast that includes protein every day or almost every day.",
  "question_16": "I consume caffeinated products on a regular basis. For example, I consume at least 1 cup of coffee, tea, or caffeinated soda al least 3 times per week.",
  "question_17": "My diet is:",
  "question_18": "I take calcium and/or magnesium supplements (not including multivitamins)",
  "question_19": "I have high blood pressure or take blood pressure medication:",
  "question_20": "I have been diagnosed with over active adrenal glands, or Cushing Syndrome",
  "question_21": "I engage in enjoyable/fun/relaxing activites at least once a week.",
  "question_22": "Do you take medication(s) to address psychological imbalances?",
  "question_23": "Please select if you take the following medications:",
  "question_24": "I had something major happen to me physically (for example, being in a major motor vehicle accident, a traumatic fall, surgery, other physical trauma, giving birth).",
  "question_25": "I was told that there was difficulty in my mother's pregnancy and/or birth with me.",
  "question_26": "I had trauma in my childhood",
  "question_27": "I had trauma in my pre-teen or teen years",
  "question_28": "I had trauma in my adult life",
  "question_29": "I consider myself empathic, or I take on the emotions of others, or I am aware of energy and how it affects me:",
  "question_30": "My vision of my future is truly hopeful, bright, and fulfilling. I feel good about it.",
  "question_31": "I feel that my life path or purpose may be significantly blocked.",
  "question_32": "I rely significantly on intuition.",
  "question_33": "If I imagine being outdoors in the sun:",
  "question_34": "I suspect that I have, or have been diagnosed with:",
  "question_35": "I have significant allergies or reactions to the following foods:",
  "question_36": "I exercise:",
  "question_37": "With regards to taking pills:",
  "question_38": "Soon you will receive your sessions calendar, with your personalized sessions available to you. Each session takes 3-15 mins, depending on if a few moments of exercise is included in that session. Would you rather work with your sessions:"
};

const determineQuestionType = (questionId: string, questionText: string): "single" | "multi" => {
  if (questionId === "question_23") {
    return "single";
  }
  if (questionId === "question_35") {
    return "multi";
  }
  const multiKeywords = ["select top", "select up to", "select all", "select if"];
  const lowerText = questionText.toLowerCase();
  return multiKeywords.some(keyword => lowerText.includes(keyword)) ? "multi" : "single";
};

const seedQuestions = async () => {
  try {
    await mongoose.connect(config.databaseUrl);
    console.log("Connected to MongoDB");

    for (const [questionId, questionText] of Object.entries(questionsData)) {
      const existingQuestion = await Question.findOne({ questionId });
      
      if (existingQuestion) {
        console.log(`Question ${questionId} already exists, skipping...`);
        continue;
      }

      const questionType = determineQuestionType(questionId, questionText);
      
      const question = await Question.create({
        questionId,
        questionText,
        questionType
      });

      console.log(`Created question: ${questionId} - ${questionText.substring(0, 50)}...`);
    }

    console.log("Questions seeded successfully!");
    await mongoose.disconnect();
    console.log("Database disconnected");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding questions:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedQuestions();