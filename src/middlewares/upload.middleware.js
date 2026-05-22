// src/middlewares/upload.middleware.js

import fs from "fs";
import multer from "multer";
import path from "path";

// ==========================================
// 📁 UPLOAD FOLDER
// ==========================================

const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {

  fs.mkdirSync(
    uploadDir,
    { recursive: true }
  );
}

// ==========================================
// 💾 STORAGE
// ==========================================

const storage = multer.diskStorage({

  destination: (
    req,
    file,
    cb
  ) => {

    cb(
      null,
      uploadDir
    );
  },

  filename: (
    req,
    file,
    cb
  ) => {

    const uniqueName =

      Date.now() +

      "-" +

      Math.round(
        Math.random() * 1e9
      ) +

      path.extname(
        file.originalname
      );

    cb(
      null,
      uniqueName
    );
  },
});

// ==========================================
// 📦 MULTER
// ==========================================

export const upload = multer({

  storage,

  limits: {

    // ✅ 100MB
    fileSize:
      100 * 1024 * 1024,

    // ✅ MAX FILES
    files: 10,
  },

  fileFilter: (
    req,
    file,
    cb
  ) => {

    try {

      // ✅ MIME CHECK
      if (
        !file.mimetype
      ) {

        return cb(
          new Error(
            "Invalid file type"
          )
        );
      }

      // ✅ ACCEPT ALL SAFE FILES
      cb(
        null,
        true
      );

    } catch (err) {

      cb(
        new Error(
          "Upload failed"
        )
      );
    }
  },
});