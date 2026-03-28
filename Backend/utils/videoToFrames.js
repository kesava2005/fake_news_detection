import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import fs from "fs";

ffmpeg.setFfmpegPath(ffmpegPath);

export const extractFrames = (videoPath) => {
  return new Promise((resolve, reject) => {
    const outputDir = path.join("uploads", `frames_${Date.now()}`);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    ffmpeg(videoPath)
      .output(path.join(outputDir, "frame-%03d.jpg"))
      .outputOptions([
        "-vf fps=1"
      ])
      .on("end", () => {
        const files = fs.readdirSync(outputDir)
          .map(file => path.join(outputDir, file));

        resolve(files);
      })
      .on("error", reject)
      .run();
  });
};