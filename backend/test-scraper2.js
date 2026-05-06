/**
 * test-scraper2.js — Deep diagnostic for Flipkart review page
 * Usage: node test-scraper2.js
 */

const axios   = require('axios');
const cheerio = require('cheerio');
const fs      = require('fs');

const TEST_URL = 'https://www.flipkart.com/samsung-galaxy-watch7-44mm-lte/product-reviews/itmf8bef51645876?pid=SMWH2EHFNQMJHPHC&marketplace=FLIPKART&page=1';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-IN,en-US;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
};

async function test() {
  console.log('Fetching Flipkart reviews page...');

  try {
    const res = await axios.get(TEST_URL, { headers: HEADERS, timeout: 30000 });
    const html = res.data;
    const $    = cheerio.load(html);

    // Save full HTML to file so we can inspect it
    fs.writeFileSync('flipkart-page.html', html);
    console.log('✅ Full HTML saved to flipkart-page.html (' + html.length + ' chars)');
    console.log('─'.repeat(60));

    // ── 1. Look for JSON data in script tags ──────────────────────────
    console.log('SEARCHING SCRIPT TAGS FOR REVIEW DATA...');
    let foundJson = false;
    $('script').each((i, el) => {
      const content = $(el).html() || '';
      if (
        content.includes('reviewText') ||
        content.includes('ratingCount') ||
        content.includes('reviewerName') ||
        content.includes('"reviews"') ||
        content.includes('starRating')
      ) {
        console.log(`✅ Script tag ${i} contains review-related JSON (${content.length} chars)`);
        // Save first 3000 chars of this script
        fs.writeFileSync(`script-tag-${i}.txt`, content.substring(0, 5000));
        console.log(`   Saved to script-tag-${i}.txt`);
        foundJson = true;
      }
    });
    if (!foundJson) console.log('❌ No script tags with review JSON found.');
    console.log('─'.repeat(60));

    // ── 2. Search for text that appears in actual reviews ─────────────
    console.log('SEARCHING FOR KNOWN REVIEW TEXT...');
    // We know from the screenshot: "Anfas Shaheer, Navi Mumbai" is a reviewer
    // "The only drawback I felt about this device is the battery life" is review text
    const knownTexts = [
      'Anfas Shaheer',
      'battery life',
      'Delightful',
      'Most Helpful',
      'Certified Buyer',
      'READ MORE',
    ];
    knownTexts.forEach(text => {
      const found = html.includes(text);
      console.log(`  ${found ? '✅' : '❌'} "${text}": ${found ? 'FOUND' : 'not found'}`);
    });
    console.log('─'.repeat(60));

    // ── 3. Extract section of HTML around known review text ───────────
    const batteryIdx = html.indexOf('battery life');
    if (batteryIdx !== -1) {
      console.log('FOUND "battery life" IN HTML. Context (±500 chars):');
      console.log(html.substring(Math.max(0, batteryIdx - 500), batteryIdx + 500));
      console.log('─'.repeat(60));
    }

    const certifiedIdx = html.indexOf('Certified Buyer');
    if (certifiedIdx !== -1) {
      console.log('FOUND "Certified Buyer". Context (±300 chars):');
      console.log(html.substring(Math.max(0, certifiedIdx - 300), certifiedIdx + 300));
      console.log('─'.repeat(60));
    }

    // ── 4. Find all unique data-* attributes ──────────────────────────
    console.log('DATA ATTRIBUTES FOUND:');
    const dataAttrs = new Set();
    $('[data-id], [data-testid], [data-review], [data-rating]').each((_, el) => {
      const attrs = el.attribs;
      Object.keys(attrs).filter(k => k.startsWith('data-')).forEach(k => dataAttrs.add(k));
    });
    if (dataAttrs.size > 0) {
      [...dataAttrs].forEach(a => console.log('  ✅', a));
    } else {
      console.log('  ❌ None found');
    }
    console.log('─'.repeat(60));

    // ── 5. Print all unique class names that appear more than 5 times ─
    console.log('FREQUENTLY USED CLASS NAMES (>5 times, likely list items):');
    const classCount = {};
    $('[class]').each((_, el) => {
      const classes = ($(el).attr('class') || '').split(/\s+/);
      classes.forEach(c => {
        if (c) classCount[c] = (classCount[c] || 0) + 1;
      });
    });
    Object.entries(classCount)
      .filter(([, v]) => v > 5)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .forEach(([cls, cnt]) => console.log(`  ${cnt}x  .${cls}`));

  } catch (err) {
    console.error('❌ ERROR:', err.message);
    if (err.response) console.error('Status:', err.response.status);
  }
}

test();
