import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { InferenceClient } from "@huggingface/inference";


if (!process.env.HF_TOKEN) {
  throw new Error("HF_TOKEN missing");
}

const app = express();
app.use(express.json());

const client = new InferenceClient(process.env.HF_TOKEN);

app.post("/predict", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text missing" });
  }

  try {

    const output = await client.textClassification({
      model: "mrm8488/bert-tiny-finetuned-fake-news-detection",
      inputs: text,
    });

    const realObj = output.find(o => o.label.toLowerCase().includes("label_1"));
    const fakeObj = output.find(o => o.label.toLowerCase().includes("label_0"));

    if (!realObj || !fakeObj) {
      return res.status(500).json({
        error: "Unexpected model output",
        output
      });
    }

    if (realObj.score > fakeObj.score) {
      return res.json({
        label: "Real News",
        score: realObj.score 
      });
    }

    return res.json({
      label: "Fake News",
      score: fakeObj.score
    });


  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Prediction failed",
      details: err.message,
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
