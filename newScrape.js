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

    try {
      await page.waitForSelector("article, .story-content, .article-body", {
        timeout: 15000,
      });
    } catch (error) {
      console.warn(
        `Warning: Main article selector not found on ${url}. Proceeding anyway.`
      );
    }

    let pageContent = await page.evaluate(
      () => document.documentElement.outerHTML
    );

    // ✅ NEW: Clean the HTML by removing all style and script tags.
    // This prevents JSDOM from crashing on unparsable CSS.
    pageContent = pageContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    pageContent = pageContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

    // Use JSDOM with the CLEANED HTML
    const dom = new JSDOM(pageContent, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (article && article.content) {
      return {
        title: article.title,
        content: article.content,
      };
    } else {
      console.error(`Readability failed to parse article at ${url}`);
      return {
        title: "Content not found",
        content: "<p>Could not automatically extract the article content.</p>",
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
