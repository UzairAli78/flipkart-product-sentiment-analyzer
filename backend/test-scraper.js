/**
 * test-scraper.js — Run this to diagnose what Flipkart actually returns
 * Usage: node test-scraper.js
 */

const axios   = require('axios');
const cheerio = require('cheerio');

const TEST_URL = 'https://www.flipkart.com/samsung-galaxy-watch7-44mm-lte/product-reviews/itmf8bef51645876?pid=SMWH2EHFNQMJHPHC&marketplace=FLIPKART&page=1';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function test() {
  console.log('Fetching:', TEST_URL);
  console.log('─'.repeat(60));

  try {
    const res = await axios.get(TEST_URL, { headers: HEADERS, timeout: 30000 });

    console.log('✅ HTTP Status:', res.status);
    console.log('Content-Length:', res.data.length, 'chars');
    console.log('─'.repeat(60));

    const $ = cheerio.load(res.data);

    // Print page title to confirm we got the right page
    console.log('Page title:', $('title').text().trim());
    console.log('─'.repeat(60));

    // Test every possible selector and report counts
    const selectors = {
      // Common Flipkart review selectors
      'div.EKFha-': $('div.EKFha-').length,
      'div[class*="EKFha"]': $('div[class*="EKFha"]').length,
      'div._1AtVbE': $('div._1AtVbE').length,
      'div.col': $('div.col').length,
      'p._2sc7ZR': $('p._2sc7ZR').length,
      'p._2V5EHH': $('p._2V5EHH').length,
      'p._2-N8zT': $('p._2-N8zT').length,
      'div._3LWZlK': $('div._3LWZlK').length,
      'div.t-ZTKy': $('div.t-ZTKy').length,
      'div._6K-7Co': $('div._6K-7Co').length,
      'div.ZmyHeo': $('div.ZmyHeo').length,
      'div[class*="review"]': $('div[class*="review"]').length,
      'div[class*="Review"]': $('div[class*="Review"]').length,
      // Newer selectors
      'div.RcXBOT': $('div.RcXBOT').length,
      'div.cPHDOP': $('div.cPHDOP').length,
      'div._11pzQk': $('div._11pzQk').length,
      'div.row': $('div.row').length,
    };

    console.log('SELECTOR COUNTS:');
    Object.entries(selectors).forEach(([sel, count]) => {
      const mark = count > 0 ? '✅' : '❌';
      console.log(`  ${mark} ${sel}: ${count}`);
    });

    console.log('─'.repeat(60));

    // Print first 2000 chars of raw HTML to see structure
    console.log('FIRST 2000 CHARS OF HTML:');
    console.log(res.data.substring(0, 2000));

    console.log('─'.repeat(60));

    // Look for the word "review" in class names
    const allDivClasses = new Set();
    $('div').each((_, el) => {
      const cls = $(el).attr('class') || '';
      if (cls) allDivClasses.add(cls.split(' ')[0]); // first class only
    });
    console.log('UNIQUE FIRST DIV CLASSES (first 40):');
    [...allDivClasses].slice(0, 40).forEach(c => console.log(' ', c));

  } catch (err) {
    console.error('❌ ERROR:', err.message);
    if (err.response) {
      console.error('HTTP Status:', err.response.status);
      console.error('Response headers:', err.response.headers);
    }
  }
}

test();
