import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import scrapeArticle from "./newScrape.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = 5000;

// ✅ Define the allowed origins for CORS
// in server/index.js

// ✅ Add "http://localhost:3000" to this list
const allowedOrigins = [
  "http://localhost:5173", // Your previous port, can be kept or removed
  "http://localhost:3000", // The port from your error message
  process.env.CLIENT_URL, // This is for your deployed Vercel URL
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests if the origin is in our whitelist or if there's no origin (e.g., server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Route 1: Get latest news from GNews API
app.get("/api/news", async (req, res) => {
  try {
    const response = await axios.get(
      `https://gnews.io/api/v4/top-headlines?lang=en&country=in&max=10&apikey=${GNEWS_API_KEY}`
    );
    const news = response.data.articles.map((article, index) => ({
      id: index + 1,
      title: article.title,
      description: article.description,
      url: article.url,
      image: article.image,
      publishedAt: article.publishedAt,
      source: article.source.name,
    }));
    res.json(news);
  } catch (error) {
    console.error("Error fetching news from GNews:", error.message);
    res.status(500).json({ error: "Failed to fetch news." });
  }
});

// Route 2: Scrape full content from a specific news URL
app.get("/api/newScrape", async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "Missing URL parameter" });
  }
  try {
    const articleData = await scrapeArticle(url);
    res.json(articleData);
  } catch (error) {
    console.error("Scraping error:", error.message);
    res.status(500).json({ error: "Failed to scrape the article." });
  }
});

// Route 3: Summarize an article using the Gemini API
app.post("/api/summarize", async (req, res) => {
  try {
    const { articleText } = req.body;
    if (!articleText) {
      return res.status(400).json({ error: "Article text is required." });
    }
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Summarize the following article:\n\n${articleText}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summaryText = response.text();
    res.json({ summary: summaryText });
  } catch (err) {
    console.error("Error in summarization endpoint:", err);
    res
      .status(500)
      .json({ error: "Internal server error during summarization." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
