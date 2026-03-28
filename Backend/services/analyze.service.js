import { GoogleGenerativeAI } from "@google/generative-ai";
import { retry } from "../utils/retry.js";
import dotenv from "dotenv";
import { RealityDefender } from "@realitydefender/realitydefender";
import fs from "fs";
import axios from "axios";

dotenv.config();

export const analyzeTextService = async (text) => {
  
  if (!text) {
    return new Error("Text is missing in the request : (analyze-text-service)");
  }

  try {

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.2,
      },
    });


    const prompt = `
            You are an expert fact-checking AI.

            Your task is to analyze the given text and determine whether it is REAL news or FAKE news.

            Instructions:
            1. Carefully analyze the content for factual accuracy, tone, exaggeration, and credibility.
            2. Look for signs of misinformation such as:
              - Sensational or emotional language
              - Lack of verifiable sources
              - Conspiracy-style claims
              - Mismatched or misleading headlines
            3. Do NOT assume the text is true.
            4. Be objective and unbiased.

            Output Format (STRICT JSON ONLY):
            {
              "label": "REAL" or "FAKE",
              "confidence": percentage (0 to 100),
              "reason": "brief explanation of why this classification was made"
            }

            Text to analyze:
            """
            ${text}
            """
            `;

    const result = await retry(() => model.generateContent(prompt), 3, 20000);


    const rawText = result.response.text();

    const cleaned = rawText.replace(/```json|```/g, "").trim();

    try {
      const data = JSON.parse(cleaned);

      //lets say result be json as {label : "fake" , confidence : "98.7", reason : "...."}

      return data;
    } catch (err) {
      return new Error(`Error in parsing (text-analyze-service): ${err}`);
    }
  } catch (err) {
    return new Error(`Error in analyzeTextService: ${err}`);
  }
};

export const analyzeImageService = async (image_path) => {
  if (!image_path)
    return new Error("Image is not found : (analyze.service.js)");

  try {
    
    const realityDefenderAI = new RealityDefender({
      apiKey: process.env.DEFENDER_API_KEY,
    });

    console.log(image_path);

    const result = await retry(() => realityDefenderAI.detect({filePath : image_path}), 3, 20000);
    return result;

  } catch (err) {
    return new Error(`Error in analyzeImageService : ${err}`);
  }
};

export const analyzeVideoService = async (framePaths) => {
  if (!framePaths || framePaths.length === 0) {
    throw new Error("No frames provided");
  }

  try {
    const base64Images = framePaths.map((path) => {
      const buffer = fs.readFileSync(path);
      return buffer.toString("base64");
    });

    const payload = {
      req_id: `req-${Date.now()}`,
      doc_base64: base64Images,
      doc_type: "image",
      isIOS: false,
      orientation: 0
    };

    const response = await axios.post(
      "https://ping.arya.ai/api/v1/deepfake-detection",
      payload,
      {
        headers: {
          token: process.env.ARYA_API_KEY,
          "Content-Type": "application/json"
        },
        maxBodyLength: Infinity
      }
    );

    return response.data;

  } catch (err) {
    throw new Error(`Error in analyzeVideoService: ${err.message}`);
  }
};