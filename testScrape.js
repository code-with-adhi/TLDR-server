import scrapeArticle from "./scrape.js";

const testUrl =
  "https://www.thehindu.com/sci-tech/spacex-delivers-four-astronauts-to-international-space-station-just-15-hours-after-launch/article69886733.ece";

const fetchAndScrape = async () => {
  console.log("🔗 Scraping article:", testUrl);

  try {
    const { title, date, content } = await scrapeArticle(testUrl);

    console.log("\n=== SCRAPED CONTENT ===\n");
    console.log("📰 Title:", title);
    console.log("📅 Date:", date);

    if (typeof content === "string") {
      console.log("\n📝 Content Preview:\n");
      console.log(content.slice(0, 1000)); // Preview first 1000 chars
    } else {
      console.error("❌ Content is not a string. Here’s what it is:", content);
    }
  } catch (err) {
    console.error("❌ Error during API fetch or scraping:");
    console.error(err);
  }
};

fetchAndScrape();
