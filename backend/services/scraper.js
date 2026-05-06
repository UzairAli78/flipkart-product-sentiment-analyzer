/**
 * scraper.js — Flipkart review scraper using axios + cheerio
 *
 * Flipkart review pages are server-side rendered, so we don't
 * need a full browser (Puppeteer). A plain HTTP request with
 * correct headers is enough. This is also much harder to block.
 *
 * Confirmed CSS selectors (from Flipkart HTML inspection):
 *   Names:   p._2sc7ZR._2V5EHH
 *   Titles:  p._2-N8zT
 *   Ratings: div._3LWZlK._1BLPMq
 *   Reviews: div.t-ZTKy
 */

const axios = require("axios");
const cheerio = require("cheerio");

const SCRAPE_TIMEOUT = parseInt(process.env.SCRAPE_TIMEOUT) || 30_000;
const MAX_PAGES = 4; // scrape up to 4 pages → up to 40 reviews

// ─── Headers that mimic a real browser ───────────────────────────────────────
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Upgrade-Insecure-Requests": "1",
};

/**
 * Validates that the URL is a Flipkart product URL.
 */
function isValidFlipkartUrl(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "www.flipkart.com" ||
      parsed.hostname === "flipkart.com"
    );
  } catch {
    return false;
  }
}

/**
 * Extracts the item ID and slug from a Flipkart product URL.
 *
 * Input:  https://www.flipkart.com/samsung-galaxy-watch7-44mm-lte/p/itmf8bef51645876?pid=XYZ
 * Slug:   samsung-galaxy-watch7-44mm-lte
 * ItemId: itmf8bef51645876
 * PID:    XYZ  (from query param)
 */
function parseFlipkartUrl(productUrl) {
  try {
    const parsed = new URL(productUrl);
    const parts = parsed.pathname.split("/").filter(Boolean);
    // pathname looks like: /slug/p/itemid
    const pIndex = parts.indexOf("p");
    const slug = parts[0] || "";
    const itemId = pIndex !== -1 ? parts[pIndex + 1] : null;
    const pid = parsed.searchParams.get("pid") || itemId;
    return { slug, itemId, pid };
  } catch {
    return { slug: "", itemId: null, pid: null };
  }
}

/**
 * Builds the Flipkart product-reviews URL for a given page number.
 */
function buildReviewsUrl(productUrl, page = 1) {
  const { slug, itemId, pid } = parseFlipkartUrl(productUrl);
  if (!itemId) return null;

  return (
    `https://www.flipkart.com/${slug}/product-reviews/${itemId}` +
    `?pid=${pid}&marketplace=FLIPKART&page=${page}`
  );
}

/**
 * Fetches and parses one page of Flipkart reviews.
 * Returns an array of review objects (may be empty).
 */
async function fetchReviewPage(url) {
  const response = await axios.get(url, {
    headers: HEADERS,
    timeout: SCRAPE_TIMEOUT,
    // Follow redirects automatically
    maxRedirects: 5,
  });

  if (response.status !== 200) {
    throw new Error(`HTTP ${response.status} from Flipkart`);
  }

  const $ = cheerio.load(response.data);

  // ── Detect bot block or empty page ─────────────────────────────────────────
  const bodyText = $("body").text();
  if (
    bodyText.includes("robot") ||
    bodyText.includes("captcha") ||
    bodyText.includes("Access Denied")
  ) {
    console.warn("[Scraper] Bot-block detected on page.");
    return null; // null = hard block, stop all retries
  }

  // ── Extract reviews ─────────────────────────────────────────────────────────
  const reviews = [];

  // Each review is a row block. We collect all fields in parallel arrays
  // then zip them together.
  const names = [];
  const titles = [];
  const ratings = [];
  const texts = [];
  const dates = [];

  // Customer names
  $("p._2sc7ZR._2V5EHH").each((_, el) => {
    names.push($(el).text().trim());
  });

  // Review titles
  $("p._2-N8zT").each((_, el) => {
    titles.push($(el).text().trim());
  });

  // Ratings (e.g. "4" or "3")
  $("div._3LWZlK._1BLPMq").each((_, el) => {
    const r = parseFloat($(el).text().trim());
    ratings.push(isNaN(r) ? 3 : Math.min(5, Math.max(1, r)));
  });

  // Review body text
  $("div.t-ZTKy").each((_, el) => {
    // Get only the inner text, skipping nested read-more buttons
    const text = $(el).find("div").first().text().trim() || $(el).text().trim();
    texts.push(text);
  });

  // Dates — appear alongside names in same parent
  $("p._2sc7ZR:not(._2V5EHH)").each((_, el) => {
    dates.push($(el).text().trim());
  });

  // Zip arrays into review objects
  const count = Math.max(names.length, texts.length, ratings.length);

  for (let i = 0; i < count; i++) {
    const text = texts[i] || "";
    if (!text || text.length < 5) continue;

    reviews.push({
      author: names[i] || `Customer ${i + 1}`,
      title: titles[i] || "Review",
      rating: ratings[i] !== undefined ? ratings[i] : 3,
      text,
      date: dates[i] || "",
    });
  }

  return reviews;
}

/**
 * Main scrape function — scrapes up to MAX_PAGES pages (10 reviews/page).
 * Returns array of review objects or null if scraping completely failed.
 *
 * @param {string} productUrl
 * @returns {Promise<Array|null>}
 */
async function scrapeReviews(productUrl) {
  if (!isValidFlipkartUrl(productUrl)) {
    throw new Error(
      "Invalid Flipkart URL. Please enter a valid Flipkart product link " +
        "(e.g. https://www.flipkart.com/product-name/p/ITEMID).",
    );
  }

  const { itemId } = parseFlipkartUrl(productUrl);
  if (!itemId) {
    throw new Error(
      "Could not find product ID in URL. Make sure the URL contains /p/ITEMID.",
    );
  }

  const allReviews = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = buildReviewsUrl(productUrl, page);
    if (!url) break;

    console.log(`[Scraper] Fetching page ${page}/${MAX_PAGES}: ${url}`);

    try {
      const pageReviews = await fetchReviewPage(url);

      if (pageReviews === null) {
        // Hard block — stop immediately
        console.warn("[Scraper] Hard block detected. Stopping.");
        break;
      }

      if (pageReviews.length === 0) {
        // No reviews on this page — no more pages
        console.log(
          `[Scraper] Page ${page} returned 0 reviews. Stopping pagination.`,
        );
        break;
      }

      allReviews.push(...pageReviews);
      console.log(
        `[Scraper] Page ${page}: got ${pageReviews.length} reviews. Total: ${allReviews.length}`,
      );

      // Polite delay between pages (1.5–2.5s)
      if (page < MAX_PAGES) {
        const delay = 1500 + Math.random() * 1000;
        await new Promise((r) => setTimeout(r, delay));
      }
    } catch (err) {
      console.error(`[Scraper] Page ${page} failed: ${err.message}`);
      // Continue to next page rather than crashing entirely
      if (page === 1) {
        // If even the first page fails, give up and return null for fallback
        return null;
      }
      break;
    }
  }

  if (allReviews.length === 0) {
    console.warn(
      "[Scraper] No reviews extracted from any page. Using fallback.",
    );
    return null;
  }

  // Assign sequential IDs
  const numbered = allReviews.map((r, i) => ({ ...r, id: i + 1 }));
  console.log(`[Scraper] ✅ Total reviews scraped: ${numbered.length}`);
  return numbered;
}

module.exports = { scrapeReviews, isValidFlipkartUrl, parseFlipkartUrl };
