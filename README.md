# FlipSense — AI Flipkart Review Sentiment Analyzer

> **100% free & open-source. No paid APIs. Uses DistilBERT (HuggingFace) with VADER as automatic fallback.**

---

## 📌 Project Overview

FlipSense is a full-stack AI web application that analyzes Flipkart product reviews and classifies them as **Positive**, **Neutral**, or **Negative** using a pre-trained DistilBERT NLP model. Results are displayed in a modern dashboard with charts, sentiment cards, keyword extraction, and a paginated review list.

---

## 🏗️ Architecture

```
User Browser (React — port 3000)
        │
        │  POST /api/analyze
        ▼
Node.js / Express (port 5000)
  ├── Validates Flipkart URL
  ├── Attempts axios + cheerio scraping
  │     └── Falls back to Indian review dataset if blocked
  └── POST /sentiment
        │
        ▼
  Python / FastAPI (port 8000)
    ├── DistilBERT (primary NLP model)
    └── VADER (automatic fallback)
        │
        ▼
  Sentiment results returned to Node.js
        │
        ▼
  Aggregated JSON response → React Dashboard
```

---

## 📁 Folder Structure

```
amazon-sentiment-analyzer/
│
├── backend/                        # Node.js + Express API server
│   ├── server.js                   # Entry point: middleware, routes, error handling
│   ├── package.json                # Dependencies (axios, cheerio, express, etc.)
│   ├── .env                        # Environment variables (copied from .env.example)
│   ├── .env.example                # Template for environment config
│   ├── routes/
│   │   └── analyze.js              # POST /api/analyze — main analysis endpoint
│   └── services/
│       ├── scraper.js              # axios+cheerio Flipkart scraper
│       └── fallback.js             # URL-seeded fallback dataset loader
│
├── ai-service/                     # Python FastAPI AI service
│   ├── main.py                     # FastAPI app with /sentiment endpoint
│   ├── sentiment.py                # DistilBERT + VADER sentiment engine
│   └── requirements.txt            # Python dependencies
│
├── frontend/                       # React.js UI (Vite)
│   ├── index.html                  # Root HTML (Vite entry point)
│   ├── vite.config.js              # Vite config with proxy to backend
│   ├── package.json                # Frontend dependencies
│   └── src/
│       ├── index.jsx               # React root entry
│       ├── index.css               # Global CSS variables and reset
│       ├── App.jsx                 # Root component and state management
│       ├── App.css                 # App-level styles
│       └── components/
│           ├── UrlInput.jsx/css    # Flipkart URL input form with validation
│           ├── Dashboard.jsx/css   # Orchestrates all result components + JSON download
│           ├── SummaryCards.jsx/css  # Average rating hero + stat cards
│           ├── SentimentChart.jsx/css # Bar and pie chart toggle (Recharts)
│           ├── KeywordCloud.jsx/css   # Top 10 keyword visualization
│           └── ReviewList.jsx/css    # Paginated and filterable review list
│
├── data/
│   └── fallback_reviews.json       # 50 realistic Indian Flipkart-style reviews
│
└── README.md
```

---

## ⚙️ Prerequisites

| Tool    | Minimum Version | Check Command      |
| ------- | --------------- | ------------------ |
| Node.js | 18+             | `node --version`   |
| npm     | 9+              | `npm --version`    |
| Python  | 3.9+            | `python --version` |
| pip     | 22+             | `pip --version`    |

---

## 🚀 Step-by-Step Setup

### Step 1 — Backend (Node.js)

```powershell
cd amazon-sentiment-analyzer\backend
cp .env.example .env
npm install
npm audit   # should show: found 0 vulnerabilities
```

### Step 2 — AI Service (Python)

```powershell
cd ..\ai-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

> ⚠️ PyTorch downloads ~800 MB on first install. This is a one-time download — be patient.

### Step 3 — Frontend (React + Vite)

```powershell
cd ..\frontend
npm install
npm audit   # should show: found 0 vulnerabilities
```

---

## ▶️ Running the Project

Open **3 separate terminals**:

### Terminal 1 — AI Service

```powershell
cd amazon-sentiment-analyzer\ai-service
venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Expected output:

```
INFO: Uvicorn running on http://0.0.0.0:8000
INFO: ✅ DistilBERT loaded successfully.
```

> First startup takes 1–2 minutes to load DistilBERT. Subsequent starts are instant.

### Terminal 2 — Backend

```powershell
cd amazon-sentiment-analyzer\backend
npm run dev
```

Expected output:

```
✅ Backend running on http://localhost:5000
   AI Service expected at: http://localhost:8000
```

### Terminal 3 — Frontend

```powershell
cd amazon-sentiment-analyzer\frontend
npm run dev
```

Browser opens at **http://localhost:3000**

---

## 🧭 How to Use

1. Go to **https://www.flipkart.com**
2. Search for any product (phone, watch, laptop, etc.)
3. Click on the product to open its page
4. Copy the full URL from your browser address bar
5. Paste it into FlipSense and click **Analyze Reviews**
6. View the full sentiment dashboard

**Example URL format:**

```
https://www.flipkart.com/samsung-galaxy-watch7-44mm-lte/p/itmf8bef51645876
```

---

## 🔍 Health Check Endpoints

```powershell
# Backend health
curl http://localhost:5000/health

# AI service health
curl http://localhost:8000/health

# Combined check (backend pings AI service)
curl http://localhost:5000/api/analyze/health

# Which NLP model is active
curl http://localhost:8000/engine
```

---

## 📊 Example API Response

```json
{
  "success": true,
  "requestId": "a1b2c3d4",
  "dataSource": "fallback",
  "url": "https://www.flipkart.com/...",
  "total": 40,
  "positive": 22,
  "negative": 12,
  "neutral": 6,
  "percentPositive": 55.0,
  "percentNegative": 30.0,
  "percentNeutral": 15.0,
  "averageRating": 3.65,
  "topKeywords": [
    { "word": "quality", "count": 18 },
    { "word": "delivery", "count": 14 }
  ],
  "reviews": [
    {
      "id": 1,
      "author": "Rahul Sharma, Delhi",
      "rating": 5,
      "title": "Absolutely worth every rupee!",
      "text": "Been using this for 2 months...",
      "date": "14 Apr, 2025",
      "sentiment": "positive",
      "sentimentScore": 0.9987
    }
  ]
}
```

---

## ⚙️ Environment Variables

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
AI_SERVICE_URL=http://localhost:8000
ALLOWED_ORIGINS=http://localhost:3000
SCRAPE_TIMEOUT=30000
MAX_RETRIES=2
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=20
```

---

## 🛡️ Error Handling

| Scenario                       | Behavior                                           |
| ------------------------------ | -------------------------------------------------- |
| Invalid URL entered            | Client + server validation with clear message      |
| Non-Flipkart URL               | Rejected with helpful error                        |
| Flipkart blocks scraping (403) | Automatic fallback to `data/fallback_reviews.json` |
| No reviews found on page       | Fallback to dataset                                |
| AI service is down             | HTTP 502 with message to start Python service      |
| Rate limit exceeded            | HTTP 429 with retry message                        |

---

## 🎁 Features

| Feature                | Details                                                                |
| ---------------------- | ---------------------------------------------------------------------- |
| **Sentiment Analysis** | DistilBERT classifies each review as Positive / Neutral / Negative     |
| **Average Rating**     | Computed from all review star ratings                                  |
| **Bar Chart**          | Sentiment distribution with color coding                               |
| **Pie Chart**          | Toggle between bar and pie view                                        |
| **Keyword Cloud**      | Top 10 most mentioned words across all reviews                         |
| **Review List**        | Paginated, filterable by sentiment tab                                 |
| **Confidence Score**   | Each review shows the AI model's confidence %                          |
| **Download Report**    | One-click JSON export of full analysis results                         |
| **Fallback Dataset**   | 50 realistic Indian Flipkart-style reviews — different results per URL |
| **Rate Limiting**      | 20 requests per minute per client                                      |
| **Zero paid APIs**     | Fully free and open-source stack                                       |

---

## 🧪 Tech Stack

### Backend

| Tool               | Purpose               |
| ------------------ | --------------------- |
| Node.js + Express  | API server            |
| axios + cheerio    | Flipkart HTTP scraper |
| express-validator  | Input validation      |
| helmet + cors      | Security middleware   |
| morgan             | Request logging       |
| express-rate-limit | Rate limiting         |

### AI Service

| Tool                     | Purpose                     |
| ------------------------ | --------------------------- |
| Python + FastAPI         | AI microservice             |
| DistilBERT (HuggingFace) | Primary NLP sentiment model |
| VADER                    | Automatic fallback NLP      |
| Pydantic                 | Request/response validation |
| uvicorn                  | ASGI server                 |

### Frontend

| Tool                       | Purpose                                |
| -------------------------- | -------------------------------------- |
| React 18                   | UI framework                           |
| Vite                       | Build tool (replaces Create React App) |
| Recharts                   | Bar and pie charts                     |
| axios                      | HTTP requests to backend               |
| DM Sans + DM Serif Display | Typography                             |

---

## 🐛 Troubleshooting

**Frontend shows blank page**
→ Check browser console (F12). Make sure `src/index.js` is deleted and only `src/index.jsx` exists. Ensure `index.html` is in the `frontend/` root, not inside `public/`.

**"process is not defined" error**
→ In `App.jsx`, replace `process.env.REACT_APP_API_URL` with `import.meta.env.VITE_API_URL`.

**"Cannot connect to AI service"**
→ Start the Python FastAPI service first (Terminal 1). First startup takes 1–2 minutes.

**DistilBERT fails to load**
→ VADER automatically takes over. No action needed.

**torch not installing**
→ Run: `pip install torch --index-url https://download.pytorch.org/whl/cpu`

**npm audit shows vulnerabilities in frontend**
→ These come from `react-scripts`. The project uses **Vite** — ensure `package.json` uses `vite` and `@vitejs/plugin-react`, not `react-scripts`.

**Flipkart returns 403**
→ This is expected. Flipkart blocks all automated requests. The system automatically uses the fallback dataset of 50 realistic Indian reviews.

**Port already in use**
→ Change `PORT=5001` in `backend/.env` or kill the process using the port.

---

## 📝 Note on Scraping

Flipkart actively blocks all automated HTTP requests with a 403 response. This is an enterprise-level anti-scraping measure that affects all scraping tools regardless of implementation. The system handles this gracefully by loading a curated dataset of 50 realistic Flipkart-style reviews with Indian names, cities, and review writing patterns. Different product URLs produce different shuffled subsets of 40 reviews from this pool, ensuring varied results per product.

---

## 📄 License

MIT — free to use, modify, and distribute.
