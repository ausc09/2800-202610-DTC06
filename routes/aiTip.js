const express = require("express");
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");
const User = require("../models/User");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post("/api/ai-foraging-tip", async (req, res) => {
  try {
    const { imageBase64, plantName,
            scientificName, season,
            location } = req.body;

    // VALIDATION: check image exists
    if (!imageBase64) {
      return res.status(400).json({
        error: "No image provided"
      });
    }

    // GUARDRAIL: rate limit (DB-based)
    const user = await User.findById(req.user._id);

    if (user.aiTipLastUsed) {
      const lastUsed = new Date(user.aiTipLastUsed);
      const now = new Date();
      const isSameDay =
        lastUsed.getFullYear() === now.getFullYear()
        && lastUsed.getMonth() === now.getMonth()
        && lastUsed.getDate() === now.getDate();

      if (isSameDay) {
        return res.status(429).json({
          error: "RATE_LIMITED",
          message: "You've reached today's limit (1 per day). Try again tomorrow!"
        });
      }
    }

    // PERSONALIZATION: plant context in prompt
    const prompt = `You are a foraging safety expert.
                    The user is viewing: "${plantName}"
                    (${scientificName}).
                    Season: ${season}. Location: ${location}.

                    Analyze this photo and provide:
                    1. Whether this matches ${plantName}
                    2. Foraging tips specific to this plant
                    3. Best time to harvest
                    4. How to prepare/eat safely
                    5. WARNING: any toxic lookalikes

                    IMPORTANT: If the photo does not show
                    a plant, respond with exactly:
                    {"error": "NOT_A_PLANT"}

                    If you are less than 70% confident in ID,
                    start with: "⚠️ Low confidence:"

                    Keep response under 150 words.
                    Be practical and safety-focused.`;

    // MULTI-STEP: call Gemini Vision API
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [
        {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
            { text: prompt },
          ],
        },
      ],
    });

    const reply = response.text;

    // VALIDATION: check if not a plant
    if (reply.includes('"error"')
        && reply.includes("NOT_A_PLANT")) {
      return res.json({
        success: false,
        error: "NOT_A_PLANT",
        message: "No plant detected in photo."
      });
    }

    // GUARDRAIL: confidence check
    const lowConfidence =
      reply.startsWith("⚠️ Low confidence");

    // Record usage in DB
    await User.findByIdAndUpdate(req.user._id, {
      aiTipLastUsed: new Date(),
    });

    return res.json({
      success: true,
      tip: reply,
      lowConfidence,
    });

  } catch (err) {
    console.error("AI Tip error:", err);
    res.status(500).json({
      error: "AI analysis failed"
    });
  }
});

module.exports = router;
