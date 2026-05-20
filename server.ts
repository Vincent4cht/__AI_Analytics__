import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to support large transcripts
  app.use(express.json({ limit: "15mb" }));

  // Initialize helper for Gemini
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!aiClient) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error("找不到 GEMINI_API_KEY。請確認您已在 Settings > Secrets 綁定正確的金鑰。");
      }
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // API router for generating meeting minutes & translating
  app.post("/api/generate", async (req, res) => {
    try {
      const { transcript, tone = "專業", language = "繁體中文", focus = "綜合總結" } = req.body;

      if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
        res.status(400).json({ error: "請輸入或貼上有效的會議記錄或逐字稿內容。" });
        return;
      }

      const ai = getGeminiClient();

      // Configure prompt modifiers matching UI choices
      let tonePrompt = "";
      if (tone === "簡潔") {
        tonePrompt = "請以精確、高度簡練的方式進行摘要，避免冗長描述，多用短句與清晰列點。";
      } else if (tone === "詳細") {
        tonePrompt = "請盡可能保留完整的脈絡與發言細節，記錄討論過程中的討論過程與每位發言人的核心論點。";
      } else {
        tonePrompt = "請使用商業專業、言簡意賅的語氣，字句兼顧流暢度與專業感。";
      }

      let focusPrompt = "";
      if (focus === "待辦事項與行動") {
        focusPrompt = "請特別著重於提取『待辦與行動清單』，並在報告中以顯眼的視覺標記與格式描述責任歸屬、時間點與優先度。";
      } else if (focus === "核心決策與討論") {
        focusPrompt = "請特別著重於『核心決策與討論要點』，完整交代所有關鍵決策背後的權衡、提案原因與共識。";
      } else {
        focusPrompt = "請均衡且全面地呈現會議的基本資訊、核心總結、重點事項與待辦事項清單。";
      }

      const translationLanguageHeader = language === "繁體中文" ? "英文" : language;

      const systemInstruction = `
你是一位專業的會議記錄助理。請根據使用者提供的會議逐字稿，整理出結構化的會議紀錄。
請務必遵守以下輸出格式要求：

1. **會議主題與時間**：擷取會議的主案、主題與具體時間（若逐字稿中未提及確切時間，請推估或註記『未明記』）。
2. **與會者**：列出參與會議的人員（精確擷取發言人員，並整理為列表）。
3. **會議重點總結**：用 3 到 5 個重點總結會議內容（每個重點應字意清晰、論述完整）。
4. **Action Items (待辦事項)**：明確列出接下來的待辦事項與負責人（如有明確時限請一併標註）。
5. **${translationLanguageHeader} 翻譯版**：將上述 1~4 點的內容完整且專業地翻譯成『${translationLanguageHeader}』。
6. **關鍵字提取**：額外提取出 5-10 個最重要的會議核心關鍵字，並以整齊的列表形式呈現。

請以 Markdown 格式輸出，所有繁體中文部分（第 1~4 點及第 6 點）必須使用**繁體中文**回覆，不要包含任何額外的問候語或結語。

寫作建議與重點修飾：
- ${tonePrompt}
- ${focusPrompt}
`;

      const userPrompt = `
以下是需要整理的會議逐字稿與筆記：
---
${transcript}
---

請開始整理與翻譯，並直接輸出最終的 Markdown 格式會議記錄。
`;

      // Call gemini-3.5-flash which is ideal for summarization, reasoning & swift responses
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.3, // Objective summaries
        },
      });

      const textResult = response.text;
      if (!textResult) {
        throw new Error("模型產出內容為空，請確認逐字稿並重試。");
      }

      res.json({ result: textResult });
    } catch (error: any) {
      console.error("Gemini API proxy error:", error);
      res.status(500).json({ error: error?.message || "無法與 AI 伺服器連線，請確認 API 金鑰設置。" });
    }
  });

  // Serve Vit dev server or build files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`Serving static files from ${distPath}`);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Startup error:", err);
});
