// src/middlewares/upload.middleware.js

import fs from "fs";
import multer from "multer";
import path from "path";

const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {

    const uniqueName =

      Date.now() +

      "-" +

      Math.round(Math.random() * 1e9) +

      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

export const upload = multer({

  storage,

  limits: {

    fileSize:
      100 * 1024 * 1024,

    files: 10,
  },

  fileFilter: (req, file, cb) => {

    if (!file.mimetype) {
      return cb(
        new Error("Invalid file")
      );
    }

    cb(null, true);
  },
});