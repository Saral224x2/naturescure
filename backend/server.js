const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db"); // Database connection
const userRoutes = require("./routes/userRoutes");
const plantRoutes = require("./routes/PlantRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");
const emailRoutes = require("./routes/emailRoutes");
const { uploadMiddleware } = require("./Middleware/multer");
const path = require("path");
const axios = require("axios");

const _dirname = path.resolve();
dotenv.config();

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.BASE_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Connect to MongoDB
connectDB();

// ✅ Routes
app.use("/api/users", userRoutes);
app.use("/api/plants", plantRoutes);
app.use("/api", orderRoutes);
app.use("/api", cartRoutes);
app.use("/api", protectedRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/email", emailRoutes);

app.post("/upload", uploadMiddleware, (req, res) => {
  res.json({ message: "File uploaded successfully!", file: req.file });
});


// ✅ OpenRouter Chatbot Route (Plants/Medicine Focused)
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        max_tokens: 600,
        messages: [
          {
            role: "system",
            content: `
You are an expert virtual assistant for "Nature's Cure," a virtual herbal garden platform.

Your responsibilities:

1. Answer all questions related to medicinal plants, herbs, trees, AYUSH practices, and their uses.
2. Answer general questions about the Nature's Cure platform, such as purpose, developers, features, and history.
   - The platform was developed by the team "Codex Squad" with the following members:
     • Mohammad Umar – Full Stack Developer & Team Leader
     • Divyanshu Kushwaha – Full Stack Developer
     • Saral Singh – Backend Developer
     • Hradyansh Dosar – Content & Research Analyst
3. Respond to greetings, small talk, or casual chat (e.g., "Hi", "Hello", "Tell me about yourself").
4. Provide friendly, educational, and engaging responses, including fun facts about plants like Tulsi, Giloy, Ashwagandha, Neem, Aloe Vera, Amla, Jamun, Brahmi, Shatavari, Turmeric.
5. Encourage users to explore features of Nature's Cure (interactive 3D models, quizzes, virtual tours, plant info, search & filter).
6. Respond in the language of the user. You can answer in English, Hindi, or any other language requested by the user.
7. If the question is unrelated to plants or Nature's Cure, politely respond: "Sorry, I can only answer questions about medicinal plants, herbs, or the Nature's Cure platform."

Keep answers concise, friendly, informative, and engaging, and adapt the language based on the user's input.
            `,
          },
          { role: "user", content: message },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiReply = response.data?.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";
    res.json({ reply: aiReply });
  } catch (error) {
    console.error("❌ OpenRouter API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch AI response." });
  }
});

// textToSpeech
app.post("/api/tts", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });

  try {
    const murfRes = await axios.post(
      "https://api.murf.ai/v1/speech/generate",
      {
        "voice_id":"en-US-natalie",
        "multiNativeLocale":"hi-IN",
        style: "Conversational",
        text,
        format: "mp3",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.MURF_API_KEY,
        },
      }
    );

    res.status(200).json(murfRes.data);
  } catch (err) {
    console.error("❌ Murf API error:", err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});


// ✅ Serve Frontend
app.use(express.static(path.join(_dirname, "/frontend/dist")));
app.get("*", (_, res) => {
  res.sendFile(path.resolve(_dirname, "frontend", "dist", "index.html"));
});

// ✅ Server Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));