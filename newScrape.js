// server/newScrape.js

import puppeteer from "puppeteer";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const scrapeArticle = async (url) => {
  let browser = null;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Wait for the main content to load
    // await page.waitForSelector("body", { timeout: 60000 });
    await page.waitForSelector("article, .story-content, .article-body", {
      timeout: 60000,
    });

    // Get the full HTML content of the page
    // const pageContent = await page.content();
    const pageContent = await page.evaluate(
      () => document.documentElement.outerHTML
    );

    // Use JSDOM to create a DOM document from the HTML
    const dom = new JSDOM(pageContent, { url });

    // Use Readability to parse the document
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (article) {
      // Clean up content and return
      return {
        title: article.title,
        content: article.textContent,
      };
    } else {
      // Fallback if Readability fails
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
    return { title: "", content: "" };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

export default scrapeArticle;
