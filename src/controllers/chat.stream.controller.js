// src/controllers/chat.stream.controller.js
import fs from "fs";
import { getAIStream } from "../services/aiRouter.service.js";

import { detectTool } from "../ai/toolRouter.js";

import { handleFile } from "../ai/tools/file.tool.js";
import { handleAudio } from "../ai/tools/audio.tool.js";
import { handleOCR } from "../ai/tools/ocr.tool.js";

import {
  generateImage,
  generateVariations,
} from "../ai/tools/image.tool.js";

import { editImage } from "../ai/tools/image.edit.tool.js";

import { getLiveNews } from "../ai/tools/news.tool.js";

import { createPDF } from "../ai/tools/pdf.tool.js";

import { generateResume } from "../ai/tools/resume.tool.js";

import { handleVision } from "../ai/tools/vision.tool.js";
import { handleVideo } from "../ai/tools/video.tool.js";
import {
  readPDF
}
from "../ai/tools/pdf.tool.js";


// ==========================================
// SSE HELPERS
// ==========================================

function done(
  res,
  ping
) {

  clearInterval(ping);

  if (
    res.writableEnded ||
    res.destroyed
  ) {
    return;
  }

  try {

    // ✅ FINAL JSON EVENT
    res.write(
      `data: ${JSON.stringify({
        done: true
      })}\n\n`
    );

    // ✅ FINAL SSE CLOSE
    res.write(
      "data: [DONE]\n\n"
    );

    res.end();

  } catch (err) {

    console.error(
      "DONE ERROR:",
      err.message
    );
  }
}

function send(res, type, content) {

  if (
    res.writableEnded ||
    res.destroyed
  ) {
    return;
  }

  try {

    res.write(
`data: ${JSON.stringify({
    type,
    content,
  })}\n\n`
);

// ✅ IMPORTANT
res.flush?.();


  } catch (err) {

    console.error(
      "SEND ERROR:",
      err.message
    );
  }
}

function sendDownload(
  res,
  name,
  url,
  fileType = "file"
) {

  if (
    !url ||
    res.writableEnded ||
    res.destroyed
  ) {
    return;
  }

  try {

    res.write(
      `data: ${JSON.stringify({

        type: "download",

        content: {
          name,
          url,
          fileType,
        },

      })}\n\n`
    );

  } catch (err) {

    console.error(
      "DOWNLOAD ERROR:",
      err.message
    );
  }
}

function startSSE(res) {

  // ======================================
  // ✅ SSE HEADERS
  // ======================================

  res.writeHead(200, {

    "Content-Type":
      "text/event-stream",

    "Cache-Control":
      "no-cache, no-transform",

    Connection:
      "keep-alive",

    "X-Accel-Buffering":
      "no",
  });

  // ✅ IMPORTANT
  res.flushHeaders?.();

  // ======================================
  // ❤️ KEEP ALIVE
  // ======================================

  return setInterval(() => {

    if (
      !res.writableEnded
    ) {

    res.write(
  `event: ping\ndata: ok\n\n`
);
    }

  }, 15000);
}

function getLastText(messages = []) {

  const last =
    messages[messages.length - 1];

  if (!last) return "";

  // Flutter array content
  if (
    Array.isArray(last.content)
  ) {

    const txt =
      last.content.find(
        (p) => p.type === "text"
      );

    return (
      txt?.text?.trim() || ""
    );
  }

  return String(
    last.content || ""
  ).trim();
}

// ==========================================
// MAIN CONTROLLER
// ==========================================

export const chatStreamController = [

  async (req, res) => {

    const ping =
      startSSE(res);

    // =====================================
    // CLIENT DISCONNECT
    // =====================================

    req.on("close", () => {

      console.log(
        "🔌 Client disconnected"
      );

      clearInterval(ping);

      try {

        if (
          !res.writableEnded &&
          !res.destroyed
        ) {

          res.end();
        }

      } catch (err) {

        console.error(
          "CLOSE ERROR:",
          err.message
        );
      }
    });

    try {

      // ======================================
      // PARSE MESSAGES
      // ======================================

      const messages =
        typeof req.body.messages ===
        "string"

          ? JSON.parse(
              req.body.messages
            )

          : req.body.messages || [];

      const prompt =
        getLastText(messages);

      // ======================================
      // FILES
      // ======================================

      const rawFiles =
  req.files

    ? Array.isArray(req.files)

      ? req.files

      : Object.values(
          req.files
        ).flat()

    : req.file

    ? [req.file]

    : [];
      // ======================================
      // NORMALIZE FILES
      // ======================================

    const files = rawFiles.map((f) => {

  let buffer = null;

  // ======================================
  // MEMORY STORAGE
  // ======================================

  if (f.buffer) {

    buffer = f.buffer;
  }

  // ======================================
  // DISK STORAGE
  // ======================================

  else if (f.path) {

    try {

      buffer = fs.readFileSync(
        f.path
      );

    } catch (err) {

      console.error(
        "FILE READ ERROR:",
        err
      );
    }
  }

  return {

   name:
  f.originalname ||
  f.name ||
  "file",

    originalname:
      f.originalname,

    mimetype:
      f.mimetype,

    mimeType:
      f.mimetype,

    path:
      f.path || null,

    size:
      f.size,

    buffer,
  };
});

      const file =
        files[0];

        if (
  file &&
  !file.buffer &&
  !file.path
) {

  send(
    res,
    "text",
    "⚠️ Invalid uploaded file."
  );

  return done(
    res,
    ping
  );
}

      // ======================================
      // DETECT TOOL
      // ======================================

      const tool =
  detectTool(
    prompt || "",
    files || []
  ) || "groq_chat";

      console.log(
        "🧠 TOOL:",
        tool
      );

      // ======================================
      // FILE MODE
      // ======================================

      if (file) {

      const mime = String(
  file.mimeType ||
  file.mimetype ||
  file.type ||
  ""
)
.toLowerCase()
.trim();

        console.log(
  "📦 FINAL MIME:",
  mime
);
        // ====================================
        // 🎨 IMAGE VARIATIONS
        // ====================================

        if (
          tool ===
          "image_variation"
        ) {

          try {

            const imgs =
              await generateVariations(
                prompt,
                3
              );

            imgs.forEach(
              (img) => {

                send(
                  res,
                  "image",
                  img
                );
              }
            );

            return done(
              res,
              ping
            );

          } catch (err) {

            console.error(
              "VARIATION ERROR:",
              err
            );

            send(
              res,
              "text",
              "⚠️ Image variation failed."
            );

            return done(
              res,
              ping
            );
          }
        }

        // ====================================
        // 🖌 IMAGE EDIT
        // ====================================

        if (
          tool ===
          "image_edit"
        ) {

          try {

            const out =
              await editImage(
                file,
                prompt
              );

            if (
              typeof out === "string"
            ) {

              send(
                res,
                "image",
                out
              );

              sendDownload(
                res,
                "Edited Image",
                out,
                "image"
              );

            } else if (
              out?.url
            ) {

              send(
                res,
                "image",
                out.url
              );

              sendDownload(
                res,
                "Edited Image",
                out.url,
                "image"
              );

            } else {

              send(
                res,
                "text",
                out?.text ||
                "⚠️ Image edit failed."
              );
            }

            return done(
              res,
              ping
            );

          } catch (err) {

            console.error(
              "EDIT ERROR:",
              err
            );

            send(
              res,
              "text",
              "⚠️ Failed to edit image."
            );

            return done(
              res,
              ping
            );
          }
        }

        // ====================================
        // 🎬 IMAGE TO VIDEO
        // ====================================

        if (
          tool ===
          "image_video"
        ) {

          send(
            res,
            "text",
            "⚠️ Image to video temporarily disabled."
          );

          return done(
            res,
            ping
          );
        }

        // ====================================
        // 🖼 IMAGE / OCR / CAMERA AI
        // ====================================

        if (
          mime.startsWith(
            "image/"
          )
        ) {

          try {

            // ==================================
            // IMAGE GENERATION
            // ==================================

            if (
  tool ===
  "image_generation"
) {

              const out =
                await generateImage(
                  prompt
                );

              if (
                out?.type ===
                "image"
              ) {

                send(
                  res,
                  "image",
                  out.url
                );

                sendDownload(
                  res,
                  "Generated Image",
                  out.url,
                  "image"
                );

              } else {

                send(
                  res,
                  "text",
                  out?.text ||
                  "⚠️ Image generation failed."
                );
              }

              return done(
                res,
                ping
              );
            }

            // ==================================
            // OCR / VISION
            // ==================================

            let result = "";

            const lower =
              prompt.toLowerCase();

            // OCR
            if (

              lower.includes(
                "extract text"
              ) ||

              lower.includes(
                "ocr"
              ) ||

              lower.includes(
                "read text"
              ) ||

              lower.includes(
                "scan text"
              ) ||

              lower.includes(
                "document"
              ) ||

               lower.includes(
    "summarize this document"
  )

            ) {

              result =
                await handleOCR(
                  file,
                  prompt
                );

            } else {

              // Vision AI
              if (
  !file.buffer
) {

  send(
    res,
    "text",
    "⚠️ Image buffer missing."
  );

  return done(
    res,
    ping
  );
}

result =
console.log(
  "🖼 IMAGE BUFFER:",
  !!file.buffer,
  file.buffer?.length
);

  await handleVision(
    {
      buffer: file.buffer,
      mimetype:
        file.mimetype,
      originalname:
  file.originalname ||
  file.name,
    },
    prompt
  );
            }

   // ==================================
// SEND IMAGE RESULT
// ==================================

if (

  result?.type === "image" ||

  result?.image ||

  result?.url

) {

  const imageUrl =

    result?.image ||

    result?.url ||

    result;

  res.write(
  `data: ${JSON.stringify({

    type: "image",

    url: imageUrl,

    text: "Image generated"

  })}\n\n`
);

res.flush?.();

  sendDownload(
    res,
    "Generated Image",
    imageUrl,
    "image"
  );

} else {

  send(
    res,

    result?.type || "text",

    typeof result === "string"

      ? result

      : result?.text ||

        "⚠️ Empty AI response."
  );
}

            return done(
              res,
              ping
            );

          } catch (err) {

            console.error(
              "IMAGE ERROR:",
              err
            );

            send(
              res,
              "text",
              "⚠️ Failed to read image."
            );

            return done(
              res,
              ping
            );
          }
        }

        

        // ====================================
        // 🎧 AUDIO
        // ====================================

        else if (
          mime.startsWith(
            "audio/"
          )
        ) {

          try {

            const out =
              await handleAudio(
                file,
                prompt
              );

            if (
              out?.transcript
            ) {

              send(
                res,
                "audio",
                out.transcript
              );

            } else {

              send(
                res,
                "text",
                out?.text ||
                "⚠️ Audio processing failed."
              );
            }

            return done(
              res,
              ping
            );

          } catch (err) {

            console.error(
              "AUDIO ERROR:",
              err
            );

            send(
              res,
              "text",
              "⚠️ Failed to process audio."
            );

            return done(
              res,
              ping
            );
          }
        }

       // ====================================
// 🎬 VIDEO AI
// ====================================

else if (
  mime.startsWith("video/")
) {

  try {

    const out =
      await handleVideo(
        file,
        prompt
      );

    if (
  out?.type === "video"
) {

  res.write(
  `data: ${JSON.stringify({

    type: "video",

    url:
      out?.url || "",

    text:
      out?.text ||
      "Video processed"

  })}\n\n`
);

res.flush?.();

  if (out?.text) {

    send(
      res,
      "text",
      out.text
    );
  }

} else {

  send(
    res,
    out?.type || "text",

    out?.text ||
    "⚠️ Video AI failed."
  );
}

    return done(
      res,
      ping
    );

  } catch (err) {

    console.error(
      "VIDEO ERROR:",
      err
    );

    send(
      res,
      "text",
      "⚠️ Failed to process video."
    );

    return done(
      res,
      ping
    );
  }
}
        

       // ====================================
       // 📄 DOCUMENTS / PDF / TXT / DOCX
       // ====================================

else if (

  mime.includes("pdf") ||

  mime.includes("officedocument") ||

  mime.includes("msword") ||

  mime.includes("word") ||

  mime.includes("sheet") ||

  mime.includes("excel") ||

  mime.includes("text") ||

  mime.includes("csv") ||

  mime.includes("json")

) {

  try {

    if (
      !file.buffer &&
      !file.path
    ) {

      send(
        res,
        "text",
        "⚠️ Document buffer missing."
      );

      return done(
        res,
        ping
      );
    }

    const out =
      await handleFile({

        buffer:
          file.buffer ||

          fs.readFileSync(
            file.path
          ),

        path:
          file.path,

        mimetype:
          file.mimetype ||

          file.mimeType,

        originalname:
          file.originalname ||

          file.name,
      });

    // ===============================
    // FAILED
    // ===============================

    if (
      !out ||
      !out.text
    ) {

      send(
        res,
        "text",
        "⚠️ Failed to read PDF."
      );

    } else {

      // =============================
      // SUCCESS
      // =============================

      send(
        res,
        "text",

`📄 ${
  out.fileName ||
  "Document"
}

${out.text}`
      );
    }

    return done(
      res,
      ping
    );

  } catch (err) {

    console.error(
      "DOCUMENT ERROR:",
      err
    );

    send(
      res,
      "text",
      "⚠️ Failed to process document."
    );

    return done(
      res,
      ping
    );
  }
}

        // ====================================
        // ❌ UNSUPPORTED
        // ====================================

        else {

          send(
            res,
            "text",
            `⚠️ Unsupported file type: ${mime}`
          );

          return done(
            res,
            ping
          );
        }
      }

      // ====================================
      // 📄 RESUME
      // ====================================

      if (
        tool ===
        "resume"
      ) {

        const url =
          await generateResume(
            prompt
          );

        sendDownload(
          res,
          "Resume",
          url,
          "pdf"
        );

        return done(
          res,
          ping
        );
      }

      // ====================================
      // 📄 PDF
      // ====================================

      if (
        tool ===
        "pdf"
      ) {

        const url =
          await createPDF(
            "DevU AI",
            prompt
          );

        sendDownload(
          res,
          "PDF",
          url,
          "pdf"
        );

        return done(
          res,
          ping
        );
      }

      // ====================================
      // 🔎 SEARCH / NEWS
      // ====================================

      if (
        tool ===
        "search"
      ) {

        const news =
          await getLiveNews(
            prompt
          );

        send(
          res,
          "text",
          news
        );

        return done(
          res,
          ping
        );
      }

      // ======================================
      // 💬 NORMAL AI CHAT
      // ======================================
  
    const aiResult =
await getAIStream(
tool,
Array.isArray(messages)
? messages
: []
);

const stream =
aiResult?.stream;

const usedModel =
aiResult?.usedModel ||
"unknown";


      let hasResponse =
        false;

      let chunk = "";

      if (!stream) {

  send(
    res,
    "text",
    "⚠️ AI stream failed."
  );

 return done(
    res,
    ping
  );
}

 console.log("🧠 MODEL:", usedModel);

console.log(
"🧠 STREAM:",
stream
);

console.log(
"🧠 STREAM TYPE:",
typeof stream
);

console.log(
"🧠 ITERATOR:",
typeof stream?.[
Symbol.asyncIterator
]
);


// ======================================
// 🔥 STREAM TOKENS
// ======================================
if (

!stream ||

typeof stream?.[
Symbol.asyncIterator
] !== "function"

) {

console.error(
"❌ INVALID STREAM:",
stream
);

send(
res,
"text",
"⚠️ Invalid AI stream."
);

return done(
res,
ping
);
}
  
try {

for await (const tokenRaw of stream) {

if (
  res.destroyed ||
  res.writableEnded
) {
  break;
}

const token =
  String(tokenRaw || "");

if (!token.trim()) {
  continue;
}

hasResponse = true;

chunk += token;

if (

chunk.length > 40 ||

token.includes("\n")

)
 {

  send(
    res,
    "text",
    chunk
  );

  chunk = "";
}

}

} catch (streamErr) {

console.error(
"STREAM ITERATION ERROR:",
streamErr
);

if (
!res.writableEnded
) {


send(
  res,
  "text",
  "⚠️ Stream interrupted."
);
}
}



// ======================================
// SEND REMAINING
// ======================================

if (chunk.trim()) {

  send(
    res,
    "text",
    chunk
  );
}

// ======================================
// EMPTY RESPONSE
// ======================================

if (!hasResponse) {

  send(
    res,
    "text",
    "⚠️ AI returned empty response."
  );
}

console.log(
"✅ Stream completed"
);


return done(
res,
ping
);

    } catch (err) {

      console.error(
  "STREAM ERROR:",
  err?.message || err
);

      send(
        res,
        "text",
        "⚠️ Server error"
      );

      return done(
        res,
        ping
      );
    }
  },
];