import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Replicate from "replicate";
import ascii85 from "ascii85";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // GitHub OAuth authorization URL generator
  app.get("/api/auth/github/url", (req, res) => {
    const { state } = req.query;
    
    // Check if we can extract a client ID from the state object (falls back to env)
    let clientId = process.env.GITHUB_CLIENT_ID;
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state as string, "base64").toString("utf-8"));
        if (decoded.clientId) {
          clientId = decoded.clientId;
        }
      } catch (e) {
        console.error("Error decoding state for client_id:", e);
      }
    }

    if (!clientId) {
      return res.status(400).json({ error: "Missing GitHub Client ID" });
    }

    const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/github/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "repo,user",
      state: state as string || ""
    });

    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    res.json({ url: authUrl });
  });

  // GitHub OAuth callback route
  app.get("/api/auth/github/callback", async (req, res) => {
    const { code, state } = req.query;
    
    let clientId = process.env.GITHUB_CLIENT_ID;
    let clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state as string, "base64").toString("utf-8"));
        if (decoded.clientId) clientId = decoded.clientId;
        if (decoded.clientSecret) clientSecret = decoded.clientSecret;
      } catch (e) {
        console.error("Error decoding callback state:", e);
      }
    }

    if (!clientId || !clientSecret) {
      return res.send(`
        <html>
          <body style="font-family: sans-serif; background: #0f0f11; color: #fff; text-align: center; padding-top: 50px;">
            <div style="background: #1a1a1e; max-width: 450px; margin: 0 auto; padding: 30px; border-radius: 12px; border: 1px solid #333;">
              <h3 style="color: #ef4444; margin-top: 0;">تنبيه: البيانات غير مكتملة</h3>
              <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6;">لم يتم إعداد Client ID أو Client Secret لـ GitHub في بيئة الخادم أو الإعدادات المحلية.</p>
              <button onclick="window.close()" style="background: #ef4444; border: none; color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-top: 15px;">إغلاق</button>
            </div>
          </body>
        </html>
      `);
    }

    try {
      const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          state
        })
      });

      const data: any = await response.json();
      if (data.error) {
        throw new Error(data.error_description || data.error);
      }

      const token = data.access_token;
      
      res.send(`
        <html>
          <body style="font-family: sans-serif; background: #0f0f11; color: #fff; text-align: center; padding-top: 100px;">
            <div style="background: #1a1a1e; max-width: 450px; margin: 0 auto; padding: 40px; border-radius: 12px; border: 1px solid #22c55e;">
              <h3 style="color: #22c55e; margin-top: 0; font-size: 22px;">تم الاتصال بنجاح!</h3>
              <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6;">تم ربط حسابك في GitHub بنجاح ومصادقة التطبيق. جاري العودة للمشهد وإغلاق هذه النافذة...</p>
              <div style="width: 24px; height: 24px; border: 3px solid #333; border-top-color: #22c55e; border-radius: 50%; animation: spin 1s infinite linear; margin: 20px auto;"></div>
              <style>
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              </style>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'GITHUB_AUTH_SUCCESS', token: '${token}' }, '*');
                  setTimeout(() => {
                    window.close();
                  }, 1000);
                } else {
                  window.location.href = '/';
                }
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("GitHub exchange token error:", error);
      res.send(`
        <html>
          <body style="font-family: sans-serif; background: #0f0f11; color: #fff; text-align: center; padding-top: 50px;">
            <div style="background: #1a1a1e; max-width: 450px; margin: 0 auto; padding: 30px; border-radius: 12px; border: 1px solid #ef4444;">
              <h3 style="color: #ef4444; margin-top: 0;">فشل الاتصال</h3>
              <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6;">حدث خطأ أثناء تبادل الرموز مع GitHub: ${error.message}</p>
              <button onclick="window.close()" style="background: #ef4444; border: none; color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-top: 15px;">إغلاق</button>
            </div>
          </body>
        </html>
      `);
    }
  });

  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, image, images, aspectRatio, resolution, negativePrompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const replicateApiToken = process.env.VITE_REPLICATE_API_TOKEN || process.env.REPLICATE_API_TOKEN || "r8_LYEuUd7ipxNxocBQwlmWuIg4OpXo6Ym4BGh16";
      if (!replicateApiToken) {
        return res.status(500).json({ error: "Replicate API Token is not set" });
      }

      const replicate = new Replicate({
        auth: replicateApiToken,
      });

      let finalPrompt = prompt;
      if (negativePrompt && negativePrompt.trim() !== "") {
        finalPrompt += `\nNegative prompt: ${negativePrompt}`;
      }

      const inputImages = images && Array.isArray(images) && images.length > 0 ? images : (image ? [image] : null);

      const input: any = { 
        prompt: finalPrompt,
        safety_filter_level: "block_low_and_above",
        allow_fallback_model: true
      };

      if (aspectRatio) {
        input.aspect_ratio = aspectRatio;
      }
      if (resolution) {
        input.resolution = resolution === "8K" ? "4K" : resolution;
      }
      if (inputImages && inputImages.length > 0) {
        input.image = inputImages[0];
        input.image_input = inputImages;
      }

      // Run in parallel to maximize speed
      const replicateModel = "google/nano-banana-pro";
      const promises = Array.from({ length: 1 }).map(async () => {
        try {
          return await replicate.run(replicateModel, { input });
        } catch (err: any) {
          console.error(`Error with ${replicateModel}:`, err);
          throw err;
        }
      });

      const settledResults = await Promise.allSettled(promises);
      
      const results = settledResults
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => r.value);

      if (results.length === 0 && settledResults.length > 0) {
        // If all failed, throw the first error
        throw (settledResults[0] as PromiseRejectedResult).reason;
      }

      const outputs = results.map((output: any) => {
        let imageUrl = output;
        if (output && typeof output.url === 'function') {
          imageUrl = output.url().toString();
        } else if (Array.isArray(output) && output.length > 0) {
          if (typeof output[0].url === 'function') {
            imageUrl = output[0].url().toString();
          } else {
            imageUrl = output[0];
          }
        }
        return imageUrl;
      });

      res.json({ outputs });
    } catch (error: any) {
      console.error("Error generating image:", error);
      if (error.logs) {
        console.log("Replicate logs:", error.logs);
      }
      
      let errorMessage = error.message || "Failed to generate image";
      
      // Handle Replicate 402 Payment Required
      if (errorMessage.includes("402") || errorMessage.toLowerCase().includes("insufficient credit")) {
        errorMessage = "رصيدك في Replicate غير كافٍ. يرجى شحن حسابك للمتابعة.";
      }
      
      res.status(error.status || 500).json({ error: errorMessage });
    }
  });

  app.get("/api/proxy", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: "URL is required" });
      }

      // Only allow proxying valid images / http/https urls
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return res.status(400).json({ error: "Invalid URL protocol" });
      }

      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).json({ error: `Failed to fetch target URL: ${response.statusText}` });
      }

      const contentType = response.headers.get("content-type");
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }
      
      // Set caching headers to prevent repeatedly fetching the same image
      res.setHeader("Cache-Control", "public, max-age=31536000");

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.send(buffer);
    } catch (error: any) {
      console.error("Error in image proxy:", error);
      res.status(500).json({ error: error.message || "Failed to proxy image" });
    }
  });

  app.post("/api/translate-prompt", async (req, res) => {
    console.log("Received translate-prompt request");
    try {
      const { prompt, image } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const replicateApiToken = process.env.VITE_REPLICATE_API_TOKEN || process.env.REPLICATE_API_TOKEN || "r8_LYEuUd7ipxNxocBQwlmWuIg4OpXo6Ym4BGh16";
      if (!replicateApiToken) {
        return res.status(500).json({ error: "Replicate API Token is not set" });
      }

      const replicate = new Replicate({
        auth: replicateApiToken,
      });

      let finalPrompt = `Translate the following prompt to English. If it is already in English, return it as is. \n\nReturn ONLY the translated prompt in English, without any conversational text, quotes, or explanations:\n\nOriginal prompt: ${prompt}`;

      if (image) {
        try {
          console.log("Encoding image to Base85...");
          const base64Data = image.split(',')[1] || image;
          const buf = Buffer.from(base64Data, 'base64');
          // Use ascii85 if available, otherwise fallback to a simple string or log error
          if (ascii85 && typeof ascii85.encode === 'function') {
            const b85 = ascii85.encode(buf).toString();
            finalPrompt += `\n\n[Attached Image Data in Base85 encoding: ${b85}]`;
            console.log("Image encoded successfully");
          } else {
            console.warn("ascii85.encode is not a function, skipping image encoding");
          }
        } catch (e) {
          console.error("Failed to encode image to Base85:", e);
        }
      }

      const input = {
        prompt: finalPrompt,
        system_instruction: "You are an expert translator. Your task is to translate any non-English prompts to English accurately. Do not add any extra details or enhance the prompt. Simply provide the English translation. Always output the result in English.",
        thinking_level: "medium",
        temperature: 1,
        max_output_tokens: 1000
      };

      console.log("Calling Replicate with Gemini 3.1 Pro (thinking_level: high)...");
      const output: any = await replicate.run("google/gemini-3.1-pro", { input });
      console.log("Replicate response received");
      
      let enhancedPrompt = "";
      if (Array.isArray(output)) {
        enhancedPrompt = output.join("").trim();
      } else if (typeof output === 'string') {
        enhancedPrompt = output.trim();
      }

      res.json({ enhancedPrompt });
    } catch (error: any) {
      console.error("Error enhancing prompt:", error);
      let errorMessage = error.message || "Failed to enhance prompt";
      if (errorMessage.includes("402") || errorMessage.toLowerCase().includes("insufficient credit")) {
        errorMessage = "رصيدك في Replicate غير كافٍ. يرجى شحن حسابك للمتابعة.";
      }
      res.status(error.status || 500).json({ error: errorMessage });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
