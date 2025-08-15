import puppeteer from "puppeteer-core";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const scrapeArticle = async (url) => {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: "/usr/bin/google-chrome",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // ✅ NEW RESILIENT LOGIC
    try {
      // We'll TRY to wait for a common selector, but with a shorter timeout.
      await page.waitForSelector("article, .story-content, .article-body", {
        timeout: 15000, // Wait a max of 15 seconds
      });
    } catch (error) {
      // If the selector is not found, we'll log a warning but continue instead of crashing.
      console.warn(
        `Warning: Main article selector not found on ${url}. The page might be protected or have an unusual structure. Proceeding anyway.`
      );
    }

    // Get the full HTML content of the page regardless of the selector wait.
    const pageContent = await page.evaluate(
      () => document.documentElement.outerHTML
    );

    // Use JSDOM and Readability to parse the document
    const dom = new JSDOM(pageContent, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (article && article.content) {
      // Return the sanitized HTML content from Readability
      return {
        title: article.title,
        content: article.content,
      };
    } else {
      // Fallback if Readability fails
      console.error(`Readability failed to parse article at ${url}`);
      return {
        title: "Content not found",
        content:
          "<p>Could not automatically extract the article content. The website may be using a format that is not supported.</p>",
      };
    }
  } catch (error) {
    console.error(`Scraping error on ${url}:`, error.message);
    return {
      title: "Scraping Failed",
      content: `<p>Could not retrieve the article. The server encountered an error: ${error.message}</p>`,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

export default scrapeArticle;
