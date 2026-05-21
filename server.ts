import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload size limit to accept base64 images
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Initialize Gemini API client safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in the environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Format Gemini errors into extremely friendly human messages
function formatGeminiError(error: any): string {
  let message = "";
  if (error && typeof error === "object") {
    message = error.message || "";
  } else if (typeof error === "string") {
    message = error;
  }

  // Try to parse error message if it contains a stringified JSON body
  let errorObj: any = null;
  const jsonMatch = message.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    try {
      errorObj = JSON.parse(jsonMatch[1]);
    } catch (e) {
      // Ignored
    }
  }

  const code = errorObj?.error?.code || error?.status || error?.code || "";
  const rawMsg = errorObj?.error?.message || errorObj?.message || message || "";
  const status = errorObj?.error?.status || "";

  // 1. Quota / Rate limit (429)
  if (
    code === 429 || 
    status === "RESOURCE_EXHAUSTED" || 
    rawMsg.includes("RESOURCE_EXHAUSTED") || 
    rawMsg.includes("quota") || 
    rawMsg.includes("Quota exceeded") || 
    rawMsg.includes("429")
  ) {
    return "💡【服务器多模态额度达到配额上限】\n当前免费测试的大模型接口已达到今日（每分钟/全天）的试用流量控制配额。\n\n如何继续使用：\n1. 稍等约 1-2 分钟后再重试，一般可自动恢复。\n2. 强烈推荐点击右上角的「Settings」设置菜单，在「Local Environment Variables」里配置您专属于个人的「GEMINI_API_KEY」环境变量来解开此配额限制，即可畅爽极速体验！";
  }

  // 2. Invalid Key
  if (
    code === 400 && (rawMsg.includes("API key") || rawMsg.includes("not valid") || rawMsg.includes("invalid")) ||
    rawMsg.includes("API_KEY_INVALID")
  ) {
    return "❌ 您配置的 GEMINI_API_KEY 无效或已失效，请前往右上角「Settings」重新检验输入正确的 API 密钥！";
  }

  // 3. Simple descriptive fallback
  if (rawMsg) {
    // Clean up ugly curly braces or quotes from raw message
    const cleanMsg = rawMsg.replace(/[\{\}\[\]"']/g, "").trim();
    return `大模型处理遇到异常：${cleanMsg}`;
  }

  return "⚠️ 无法连接至大模型服务器。可能是网络波动或服务商发生暂时故障，请稍后刷新页面重新进行分析尝试。";
}

// REST API Endpoints
app.get("/api/health", (req: any, res: any) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!(process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY),
  });
});

// Endpoint: Proxy remote image and convert to Base64 to bypass CORS constraints
app.get("/api/proxy-image", async (req, res): Promise<any> => {
  try {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Missing 'url' query parameter." });
    }

    const fetched = await fetch(url);
    if (!fetched.ok) {
      return res.status(502).json({ error: `Remote server responded with status: ${fetched.status}` });
    }

    const contentType = fetched.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await fetched.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    res.json({
      success: true,
      mimeType: contentType,
      imageBase64: base64,
    });
  } catch (error: any) {
    console.error("Image proxy error:", error);
    res.status(500).json({ error: error.message || "Failed to proxy remote image." });
  }
});

// Endpoint: Multimodal analysis
app.post("/api/analyze-image", async (req, res): Promise<any> => {
  try {
    const { imageBase64, mimeType, mode, customPrompt, language } = req.body;

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: "Missing required fields: imageBase64 or mimeType" });
    }

    const ai = getGeminiClient();
    const isEn = language === "en";
    const languageText = isEn ? "English" : "Chinese";

    // Prepare image payload for the model
    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: imageBase64,
      },
    };

    if (mode === "features") {
      // 1. Detailed JSON Feature Extraction with M-CoT reasoning and Hallucination suppression calibrators
      const prompt = `Analyze this image and perform a detailed multi-modal visual feature extraction. Detect dominant colors with hex codes and estimated coverage percentages, identify key physical objects and their descriptions, evaluate the mood and atmosphere (direction of lighting, composition details, overall emotional vibe), detect aesthetic tags, and provide a clear, detailed general summary in ${languageText}. In addition, you must provide a detailed step-by-step Multimodal Chain-of-Thought (M-CoT) reasoning log detailing your steps of processing this image (3 steps: e.g. spatial mapping, local entity alignment, high-level aesthetic synthesis) and realistic grounding alignment confidence metrics (anti-hallucination index, cross-modal token alignment rating, and semantic information density). All text must be in ${languageText}.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [imagePart, prompt],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: `A professional design and semantic summary of the image in ${languageText}, around 100-150 words.`,
              },
              dominantColors: {
                type: Type.ARRAY,
                description: "List of top 3 to 5 dominant colors.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    colorName: { type: Type.STRING, description: `Color name in ${languageText} (e.g. 珊瑚橘, 莫兰迪蓝, or Coral Orange, Morandi Blue)` },
                    hex: { type: Type.STRING, description: "HEX color code (e.g. #FF6F61)" },
                    percentage: { type: Type.NUMBER, description: "Estimated percentage coverage (0-100)" },
                  },
                  required: ["colorName", "hex", "percentage"],
                },
              },
              keyObjects: {
                type: Type.ARRAY,
                description: "Main detected items or visual subjects.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: `Object name in ${languageText}` },
                    description: { type: Type.STRING, description: `Detailed visual description of this object in ${languageText}` },
                    prominence: { type: Type.STRING, description: `How central it is, e.g. '${isEn ? "Subject" : "主体"}', '${isEn ? "Background" : "背景"}', '${isEn ? "Foreground" : "点缀"}'` },
                  },
                  required: ["name", "description", "prominence"],
                },
              },
              moodAndAtmosphere: {
                type: Type.OBJECT,
                properties: {
                  dominantMood: { type: Type.STRING, description: `The overarching emotional vibe (e.g. peaceful, mysterious, sci-fi) in ${languageText}` },
                  lighting: { type: Type.STRING, description: `Lighting type description (e.g. soft natural light, hard rim light) in ${languageText}` },
                  composition: { type: Type.STRING, description: `Composition description (e.g. rule of thirds, diagonal composition) in ${languageText}` },
                  aestheticRating: { type: Type.INTEGER, description: "Aesthetic score from 1 to 10 based on rules of composition, color harmony, and lighting." },
                },
                required: ["dominantMood", "lighting", "composition", "aestheticRating"],
              },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: `5-8 semantic tags representing the style in ${languageText} (e.g. Minimalism, Retro Film, Cyberpunk, Cinematic).`,
              },
              steppedCoTReasoning: {
                type: Type.ARRAY,
                description: `Multimodal Chain-of-Thought (M-CoT) analytical step-by-step reasoning steps in ${languageText} explaining how the model formulated its analysis of the pixel inputs.`,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    stage: { type: Type.STRING, description: `Stage name in ${languageText} (e.g. Stage 1: Global Visual Mapping)` },
                    reasoning: { type: Type.STRING, description: `Deconstructive step reasoning text in ${languageText} (80-120 words).` },
                    confidence: { type: Type.NUMBER, description: "Confidence rating for this stage (0-100)" }
                  },
                  required: ["stage", "reasoning", "confidence"]
                }
              },
              groundingMetrics: {
                type: Type.OBJECT,
                description: "Multimodal confidence calibration indices based on cross-modal grounding.",
                properties: {
                  hallucinationIndex: { type: Type.NUMBER, description: "Hallucination mitigation/resistance rate (0-100)" },
                  crossModalAlignment: { type: Type.NUMBER, description: "Alignment score of pixels to descriptive tokens (0-100)" },
                  semanticDensity: { type: Type.NUMBER, description: "Semantic information richness density (0-100)" }
                },
                required: ["hallucinationIndex", "crossModalAlignment", "semanticDensity"]
              }
            },
            required: ["summary", "dominantColors", "keyObjects", "moodAndAtmosphere", "tags", "steppedCoTReasoning", "groundingMetrics"],
          },
        },
      });

      const responseText = response.text || "{}";
      const parsedData = JSON.parse(responseText.trim());
      return res.json({ success: true, data: parsedData });

    } else if (mode === "captions") {
      // 2. Multimodal Social Media Caption Generation (JSON Response)
      const targetLang = isEn ? "primarily English" : "Chinese";
      const creativeIdeationLang = isEn ? "English" : "Chinese";
      const prompt = `Generate highly engaging and creative social media captions based on the uploaded image. Provide three styles: 1. Xiaohongshu style (warm, engaging, rich emojis, structured headings in ${targetLang}), 2. Instagram aesthetic style (short, visually-focused, elegant copy in ${targetLang}), and 3. Professional LinkedIn style (objective, structured, business or engineering oriented in ${targetLang}). Include appropriate tags. Provide all descriptive recommendation advice in ${creativeIdeationLang}.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [imagePart, prompt],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              xiaohongshu: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: `Catchy Red Book title (爆款标题) with emojis in ${targetLang}` },
                  content: { type: Type.STRING, description: `Enthusiastic and warm post content in ${targetLang}, split into clean paragraphs with emojis` },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Xiaohongshu hashtags" },
                },
                required: ["title", "content", "tags"],
              },
              instagram: {
                type: Type.OBJECT,
                properties: {
                  content: { type: Type.STRING, description: `Aesthetic, bilingual or English minimalist copy with subtle tone in ${targetLang}` },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Instagram hashtags" },
                },
                required: ["content", "tags"],
              },
              linkedin: {
                type: Type.OBJECT,
                properties: {
                  content: { type: Type.STRING, description: `Structured, business/engineering perspective commentary, professional vocabulary in ${targetLang}` },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Professional hashtags" },
                },
                required: ["content", "tags"],
              },
              creativeIdeation: {
                type: Type.STRING,
                description: `A short professional recommendation in ${creativeIdeationLang} on how to optimize this post's layout or color scheme for target users.`,
              },
            },
            required: ["xiaohongshu", "instagram", "linkedin", "creativeIdeation"],
          },
        },
      });

      const responseText = response.text || "{}";
      const parsedData = JSON.parse(responseText.trim());
      return res.json({ success: true, data: parsedData });

    } else if (mode === "story") {
      // 3. Creative Storytelling Mode (Rich Markdown response)
      let prompt = customPrompt || "请根据这张图片的视觉氛围、元素以及所隐含的叙事可能性，创作一篇富有意境、情节饱满的微型小说。";
      if (isEn) {
        if (!customPrompt) {
          prompt = "Please compose an exquisite, emotionally rich micro-novel/prose in English (around 450 words) based on the uploaded image. Deliver elegant markdown formatting, bold core aesthetic sentences, a poetic title, and a prologue.";
        } else {
          prompt = `${customPrompt}\n\nCRITICAL: Please translate this template prompt instruction to English and generate the entire response story, poetry, title, and prologue in English. All output must be in English.`;
        }
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [imagePart, prompt],
      });

      return res.json({ success: true, markdown: response.text });
      
    } else if (mode === "qa") {
      // 4. Custom Dialogue Interactive QA Mode
      let prompt = customPrompt || "请分析这张图片。";
      if (isEn && (!customPrompt || customPrompt === "请分析这张图片。")) {
        prompt = "Please analyze this image and discuss its composition and themes.";
      } else if (isEn) {
        prompt = `${customPrompt}\n\nAnswer in English.`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [imagePart, prompt],
      });

      return res.json({ success: true, text: response.text });
    } else if (mode === "region") {
      // 5. Region of Interest Microscopic Detail Analysis (JSON Response)
      const { regionInfo } = req.body;
      const { xMin, yMin, xMax, yMax, label } = regionInfo || { xMin: 25, yMin: 25, xMax: 75, yMax: 75, label: "Focal region" };
      
      const prompt = `Analyze a specific coordinates-bounded sub-region of the provided image. The bounding box of the sub-region is:
- Horizontal percentage range: ${xMin}% to ${xMax}% from the left edge.
- Vertical percentage range: ${yMin}% to ${yMax}% from the top edge.
Label or brief keyword of this detail: ${label || "Focal Target Area"}.

Please look extremely closely at this region. Describe the texture, pattern, specific items, micro-features, or fine details that are present within this bounding box in ${languageText}.
Explain how this specific detail patterns into the overall aesthetic composition and why it is placed at these coordinates (in ${languageText}).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [imagePart, prompt],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              coordinates: { type: Type.STRING, description: "Normalized coordinate description e.g. 'X: 25%-75%, Y: 25%-75%'" },
              subRegionDescription: { type: Type.STRING, description: `Microscopic detail description in ${languageText} focusing specifically on what is present ONLY within this coordinate frame (100-200 words).` },
              microElements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: `List of 3 to 5 micro elements, textures, materials, or features discovered inside this box in ${languageText}.`
              },
              designPurpose: { type: Type.STRING, description: `Explain the visual weight, color contribution, and design composition meaning of this detail at these coordinates (in ${languageText}, 80-150 words).` }
            },
            required: ["coordinates", "subRegionDescription", "microElements", "designPurpose"]
          }
        }
      });

      const responseText = response.text || "{}";
      const parsedData = JSON.parse(responseText.trim());
      return res.json({ success: true, data: parsedData });
    } else {
      return res.status(400).json({ error: "Invalid mode argument" });
    }

  } catch (error: any) {
    console.error("Gemini Multi-modal processing error:", error);
    res.status(500).json({
      error: formatGeminiError(error),
    });
  }
});

// Endpoint: Image Generation / Style Painting using Gemini 2.5 Flash Image base
app.post("/api/generate-image", async (req, res): Promise<any> => {
  try {
    const { prompt, aspectRatio } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required for image generation" });
    }

    const ai = getGeminiClient();
    
    // Default model to 'gemini-2.5-flash-image' according to guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `${prompt}, high quality, beautiful digital illustration.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio || "1:1",
        },
      },
    });

    let base64Image = null;
    let descriptionText = "";

    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
        } else if (part.text) {
          descriptionText += part.text;
        }
      }
    }

    if (base64Image) {
      return res.json({
        success: true,
        imageUrl: `data:image/png;base64,${base64Image}`,
        description: descriptionText
      });
    } else if (response.text) {
      // Fallback if it generated descriptions or alternative response formats
      return res.json({
        success: false,
        message: "Model returned text but did not contain raw image data.",
        text: response.text
      });
    } else {
      return res.status(500).json({ error: "No image was returned from the generative model." });
    }

  } catch (error: any) {
    console.error("Image generation error:", error);
    res.status(500).json({
      error: formatGeminiError(error),
    });
  }
});

// Global Express Error Handler to prevent returning HTML for API errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction): any => {
  console.error("Express middleware/route error:", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "An internal server error occurred on the backend."
  });
});

// Setup Vite Dev server or production static serving
async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEVELOPMENT mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started successfully. Listening at http://localhost:${PORT}`);
  });
}

// Bypasses local listeners and Vite compiler mounting if deployed inside the Vercel Serverless environment
if (process.env.VERCEL) {
  console.log("Running within Vercel Serverless Function context, bypassing local listener.");
} else {
  initializeServer().catch((err) => {
    console.error("Failed to initialize backend server:", err);
  });
}

export default app;
