/**
 * routes/analyze.js — Main analysis endpoint
 *
 * POST /api/analyze
 * Body: { url: string }
 */

const express = require("express");
const axios = require("axios");
const { body, validationResult } = require("express-validator");

const { scrapeReviews, isValidFlipkartUrl } = require("../services/scraper");
const { getFallbackReviews } = require("../services/fallback");

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// ─── Validation ───────────────────────────────────────────────────────────────
const urlValidationRules = [
  body("url")
    .trim()
    .notEmpty()
    .withMessage("URL is required.")
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Please provide a valid URL including http:// or https://."),
];

// ─── Call AI service ─────────────────────────────────────────────────────────
async function analyzeSentiments(reviews) {
  const texts = reviews.map((r) => r.text);
  const response = await axios.post(
    `${AI_SERVICE_URL}/sentiment`,
    { texts },
    { timeout: 120_000, headers: { "Content-Type": "application/json" } },
  );
  if (!response.data || !Array.isArray(response.data.results)) {
    throw new Error("Unexpected response from AI service.");
  }
  return response.data.results;
}

// ─── Aggregate results ────────────────────────────────────────────────────────
function aggregateResults(reviews, sentiments) {
  let positive = 0,
    negative = 0,
    neutral = 0,
    totalRating = 0;
  const keywords = {};

  const enriched = reviews.map((review, i) => {
    const sentiment = sentiments[i] || { label: "neutral", score: 0.5 };
    const label = sentiment.label.toLowerCase();

    if (label === "positive") positive++;
    else if (label === "negative") negative++;
    else neutral++;

    totalRating += review.rating || 3;

    const words = review.text
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 4);
    words.forEach((w) => {
      keywords[w] = (keywords[w] || 0) + 1;
    });

    return { ...review, sentiment: label, sentimentScore: sentiment.score };
  });

  const total = reviews.length;
  const avgRating = total > 0 ? +(totalRating / total).toFixed(2) : 0;
  const topKeywords = Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  return {
    total,
    positive,
    negative,
    neutral,
    percentPositive: total > 0 ? +((positive / total) * 100).toFixed(1) : 0,
    percentNegative: total > 0 ? +((negative / total) * 100).toFixed(1) : 0,
    percentNeutral: total > 0 ? +((neutral / total) * 100).toFixed(1) : 0,
    averageRating: avgRating,
    topKeywords,
    reviews: enriched,
  };
}

// ─── POST /api/analyze ────────────────────────────────────────────────────────
router.post("/", urlValidationRules, async (req, res) => {
  const requestId = Math.random().toString(36).slice(2, 10);
  console.log(`\n[${requestId}] New request received.`);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ success: false, error: errors.array()[0].msg });
  }

  const { url } = req.body;

  if (!isValidFlipkartUrl(url)) {
    return res.status(400).json({
      success: false,
      error:
        "Please enter a valid Flipkart product URL (e.g. https://www.flipkart.com/product-name/p/ITEMID).",
    });
  }

  // ── Scrape ────────────────────────────────────────────────────────────────
  let reviews = null;
  let dataSource = "scraped";

  try {
    console.log(`[${requestId}] Scraping: ${url}`);
    reviews = await scrapeReviews(url);
  } catch (err) {
    console.warn(`[${requestId}] Scrape error: ${err.message}`);
    reviews = null;
  }

  if (!reviews || reviews.length === 0) {
    console.log(`[${requestId}] Falling back to sample dataset.`);
    try {
      reviews = getFallbackReviews(40, url);
      dataSource = "fallback";
    } catch (err) {
      return res
        .status(500)
        .json({ success: false, error: "Failed to load review data." });
    }
  }

  console.log(`[${requestId}] ${reviews.length} reviews from [${dataSource}]`);

  // ── AI ────────────────────────────────────────────────────────────────────
  let sentiments;
  try {
    sentiments = await analyzeSentiments(reviews);
  } catch (err) {
    return res.status(502).json({
      success: false,
      error: `AI service error: ${err.message}. Make sure Python service is running on port 8000.`,
    });
  }

  // ── Respond ───────────────────────────────────────────────────────────────
  try {
    const results = aggregateResults(reviews, sentiments);
    return res.json({ success: true, requestId, dataSource, url, ...results });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to process results." });
  }
});

// ─── GET /api/analyze/health ──────────────────────────────────────────────────
router.get("/health", async (_req, res) => {
  let aiStatus = "unknown";
  try {
    const r = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 5000 });
    aiStatus = r.data?.status || "ok";
  } catch {
    aiStatus = "unreachable";
  }
  res.json({
    backend: "ok",
    aiService: aiStatus,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
