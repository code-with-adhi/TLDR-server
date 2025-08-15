import puppeteer from "puppeteer";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const scrapeArticle = async (url) => {
  let browser = null;
  try {
    // ✅ Added launch arguments for production environments like Render
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--single-process",
        "--no-zygote",
      ],
      // This helps in some environments, but can be removed if not needed.
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    await page.waitForSelector("article, .story-content, .article-body", {
      timeout: 60000,
    });

    const pageContent = await page.evaluate(
      () => document.documentElement.outerHTML
    );

    const dom = new JSDOM(pageContent, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (article) {
      return {
        title: article.title,
        content: article.textContent,
      };
    } else {
      console.error(`Readability failed to parse article at ${url}`);
      const fallbackContent = await page.evaluate(() => {
        return (
          document.querySelector("article")?.innerText ||
          document.querySelector(".story-content")?.innerText ||
          document.querySelector(".article-body")?.innerText ||
          ""
        );
      });
      return { title: await page.title(), content: fallbackContent };
    }
  } catch (error) {
    console.error(`Scraping error on ${url}:`, error.message);
    // Return a more informative error object
    return {
      title: "Error",
      content: `Failed to scrape the article. ${error.message}`,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

export default scrapeArticle;
