// src/middlewares/upload.middleware.js

import multer from "multer";

// ==========================================
// 🔥 MEMORY STORAGE
// ==========================================

const storage =
  multer.memoryStorage();

// ==========================================
// 📦 MULTER CONFIG
// ==========================================

export const upload = multer({

  storage,

  limits: {

    // ✅ 30MB
    fileSize:
      30* 1024 * 1024,

    // ✅ MAX FILES
    files: 20,
  },

  fileFilter: (
    req,
    file,
    cb
  ) => {

    try {

      // ✅ MIME VALIDATION
      if (
        !file.mimetype
      ) {

        return cb(
          new Error(
            "Invalid file type"
          )
        );
      }

      // ✅ ACCEPT FILE
      cb(null, true);

    } catch (err) {

      cb(
        new Error(
          "Upload failed"
        )
      );
    }
  },
});