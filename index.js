// server/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import scrapeArticle from "./newScrape.js"; // Make sure this file exists and exports properly
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Route 1: Get latest news from GNews API
app.get("/api/news", async (req, res) => {
  try {
    const response = await axios.get(
      `https://gnews.io/api/v4/top-headlines?lang=en&country=in&max=10&apikey=${GNEWS_API_KEY}`
    );

    // This console.log will show you the exact data returned by the API
    console.log("GNews API response status:", response.status);
    console.log("GNews API response data:", response.data);

    if (!response.data || !response.data.articles) {
      console.error("GNews API response is not in the expected format.");
      return res
        .status(500)
        .json({ error: "Failed to fetch news from GNews." });
    }

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
    // This will print the full error from Axios, including any messages from GNews
    console.error("Error fetching news from GNews:", error.message);
    if (error.response) {
      console.error("GNews API Error Response Data:", error.response.data);
    }
    res.status(500).json({ error: "Failed to fetch news." });
  }
});
// Route 2: Scrape full content from a specific news URL
app.get("/api/scrape", async (req, res) => {
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

    if (!GEMINI_API_KEY) {
      return res
        .status(500)
        .json({ error: "Gemini API key is not configured on the server." });
    }

    // Configure the Gemini API client
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Corrected model name
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Prepare the prompt
    const prompt = `Summarize the following article:\n\n${articleText}`;

    // Call the Gemini API
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
