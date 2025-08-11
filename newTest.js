// newTest.js
import scrapeArticle from "./newScrape.js";

const url =
  "https://www.thehindu.com/sci-tech/spacex-delivers-four-astronauts-to-international-space-station-just-15-hours-after-launch/article69886733.ece";

console.log("🔗 Scraping article:", url);

scrapeArticle(url)
  .then(({ title, date, content }) => {
    console.log("\n=== SCRAPED CONTENT ===\n");
    console.log("📰 Title:", title);
    console.log("📅 Date:", date);
    console.log("\n📝 Content Preview:\n");
    console.log(content.slice(0, 2000)); // Only previewing first 2000 characters
  })
  .catch((err) => {
    console.error("❌ Error during scraping:", err);
  });
