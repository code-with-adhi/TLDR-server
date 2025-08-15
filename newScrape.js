import puppeteer from "puppeteer-core";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const scrapeArticle = async (url) => {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: "/usr/bin/google-chrome",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Optimization to block unnecessary resources
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (
        req.resourceType() === "image" ||
        req.resourceType() === "stylesheet" ||
        req.resourceType() === "font"
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

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
        content: article.content,
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
    return {
      title: "Scraping Failed",
      content: `Could not retrieve the article. The server encountered an error: ${error.message}`,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

export default scrapeArticle;
