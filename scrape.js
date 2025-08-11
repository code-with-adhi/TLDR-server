import axios from "axios";
import * as cheerio from "cheerio";

const scrapeArticle = async (url) => {
  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    const title = $("h1.headline").first().text().trim();

    const date = $('meta[property="article:published_time"]').attr("content");

    let articleText = "";

    $(".articlebodycontent p").each((i, el) => {
      const paragraph = $(el).text().trim();
      if (paragraph.length > 0) {
        articleText += paragraph + "\n\n";
      }
    });

    return {
      title,
      date,
      content: articleText.trim(),
    };
  } catch (err) {
    console.error("Scraping failed:", err.message);
    return { title: "", date: "", content: "" };
  }
};

export default scrapeArticle;
