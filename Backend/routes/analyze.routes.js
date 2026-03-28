import express from "express";

import {

    analyzeText,
    analyzeImage,
    analyzeVideo

} from "../controllers/analyze.controller.js";

import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "uploads/"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit (important for video)
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image") ||
      file.mimetype.startsWith("video")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"), false);
    }
  }
});

const router = express.Router();

router.post("/text", analyzeText);
router.post("/image", upload.single("image"), analyzeImage);
router.post("/video", upload.single("video"), analyzeVideo);

export default router;