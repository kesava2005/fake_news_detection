import {
    
    analyzeTextService,
    analyzeImageService,
    analyzeVideoService

} from "../services/analyze.service.js";

import { extractFrames } from "../utils/videoToFrames.js";

import fs from "fs";

export const analyzeText = async (req, res) =>{

    try{

        const text = req.body.text;

        if(!text) return res.status(400).json({"success" : false, "error" : "Text is missing in the request"});

        const data = await analyzeTextService(text);

        if (data instanceof Error) {
            return res.status(500).json({
                success: false,
                error: data.message
            });
        }

        return res.json({"success" : true, ...data});

    }

    catch(err){

        return res.status(500).json({"success" : false, "err" : err});

    }

}

export const analyzeImage = async (req, res) =>{

    try{

        const image_path = req.file?.path;

        console.log(image_path);

        if(!image_path) return res.status(400).json({"success" : false, "error" : "image path is missing in the request"});

        const data = await analyzeImageService(image_path);

        if (data instanceof Error) {
            return res.status(500).json({
                success: false,
                error: data.message
            });
        }

        return res.json({"success" : true, ...data});

    }

    catch(err){

        return res.status(500).json({"success" : false, "err" : err});

    }

}

export const analyzeVideo = async (req, res) => {
  try {
    const videoPath = req.file?.path;

    if (!videoPath) {
      return res.status(400).json({
        success: false,
        error: "Video file missing"
      });
    }

    const frames = await extractFrames(videoPath);

    const batches = chunkArray(frames, 5);

    const results = [];

    for (const batch of batches) {
      try {
        const result = await analyzeVideoService(batch);
        results.push(result.result);
      } catch (err) {
        console.log("Batch error:", err.message);
      }
    }

    const fakeCount = results.filter(r => r !== "AUTHENTIC").length;
    const realCount = results.length - fakeCount;

    const finalLabel = fakeCount > realCount ? "FAKE" : "REAL";

    const confidence = Math.round(
      (Math.max(fakeCount, realCount) / results.length) * 100
    );

    frames.forEach(f => { try { fs.unlinkSync(f); } catch {} });
    try { fs.unlinkSync(videoPath); } catch {}

    return res.json({
      success: true,
      batches: results.length,
      finalLabel,
      confidence
    });

  } catch (error) {
    console.error("Video analysis error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Video analysis failed"
    });
  }
};