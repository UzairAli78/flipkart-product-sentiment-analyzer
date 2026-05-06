import React, { useState, useCallback } from "react";
import axios from "axios";
import UrlInput from "./components/UrlInput";
import Dashboard from "./components/Dashboard";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function App() {
  const [status, setStatus] = useState("idle");
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAnalyze = useCallback(async (url) => {
    setStatus("loading");
    setData(null);
    setErrorMsg("");

    try {
      const response = await axios.post(
        `${API_BASE}/api/analyze`,
        { url },
        {
          timeout: 150_000,
        },
      );

      if (response.data.success) {
        setData(response.data);
        setStatus("success");
      } else {
        throw new Error(response.data.error || "Unknown error from server.");
      }
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.message ||
        "Something went wrong. Please try again.";
      setErrorMsg(message);
      setStatus("error");
    }
  }, []);

  const handleReset = useCallback(() => {
    setStatus("idle");
    setData(null);
    setErrorMsg("");
  }, []);

  return (
    <div className="app">
      {/* ── Decorative background ── */}
      <div className="app__bg" aria-hidden="true">
        <div className="app__bg-orb app__bg-orb--1" />
        <div className="app__bg-orb app__bg-orb--2" />
        <div className="app__bg-grid" />
      </div>

      {/* ── Header ── */}
      <header className="app__header">
        <div className="app__logo">
          <span className="app__logo-icon">◈</span>
          <span className="app__logo-text">FlipSense</span>
        </div>
        <p className="app__tagline">
          AI-Powered Flipkart Product Review Sentiment Analyzer
        </p>
      </header>

      {/* ── Main content ── */}
      <main className="app__main">
        <UrlInput
          onAnalyze={handleAnalyze}
          isLoading={status === "loading"}
          onReset={status !== "idle" ? handleReset : undefined}
        />

        {status === "loading" && (
          <div className="app__loading" role="status" aria-live="polite">
            <div className="app__spinner" />
            <div className="app__loading-text">
              <p className="app__loading-title">Analyzing Flipkart reviews…</p>
              <p className="app__loading-sub">
                Scraping product page → Running AI sentiment model
              </p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="app__error" role="alert">
            <span className="app__error-icon">⚠</span>
            <div>
              <p className="app__error-title">Analysis Failed</p>
              <p className="app__error-msg">{errorMsg}</p>
            </div>
          </div>
        )}

        {status === "success" && data && <Dashboard data={data} />}
      </main>

      {/* ── Footer ── */}
      <footer className="app__footer">
        <p>
          FlipSense · Open-source · No paid APIs · DistilBERT + VADER NLP ·
          Flipkart Product Reviews
        </p>
      </footer>
    </div>
  );
}
