/**
 * fallback.js — Loads fallback review dataset.
 * Uses the product URL/ASIN as a seed so different
 * products always produce different results.
 */

const fs = require("fs");
const path = require("path");

const FALLBACK_PATH = path.resolve(
  __dirname,
  "../../data/fallback_reviews.json",
);

/**
 * Seeded pseudo-random number generator (Mulberry32).
 * Same seed → same sequence, different seed → different sequence.
 */
function seededRandom(seed) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Converts a string (URL) into a numeric seed.
 */
function urlToSeed(url) {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Seeded Fisher-Yates shuffle.
 */
function seededShuffle(arr, seed) {
  const a = [...arr];
  const rand = seededRandom(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Returns a seeded-shuffled subset of fallback reviews.
 * Different URLs → different results. Same URL → same results (reproducible).
 *
 * @param {number} limit  - how many reviews to return
 * @param {string} url    - product URL used as shuffle seed
 */
function getFallbackReviews(limit = 20, url = "") {
  try {
    if (!fs.existsSync(FALLBACK_PATH)) {
      throw new Error("Fallback dataset missing at: " + FALLBACK_PATH);
    }

    const raw = fs.readFileSync(FALLBACK_PATH, "utf-8");
    const reviews = JSON.parse(raw);

    if (!Array.isArray(reviews) || reviews.length === 0) {
      throw new Error("Fallback dataset is empty or malformed.");
    }

    const seed = urlToSeed(url || String(Date.now()));
    const shuffled = seededShuffle(reviews, seed);
    const subset = shuffled.slice(0, Math.min(limit, shuffled.length));

    return subset.map((r, i) => ({ ...r, id: i + 1 }));
  } catch (err) {
    console.error("[Fallback] Failed to load dataset:", err.message);
    throw err;
  }
}

module.exports = { getFallbackReviews };
