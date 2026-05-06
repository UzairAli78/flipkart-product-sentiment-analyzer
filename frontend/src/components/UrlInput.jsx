import React, { useState, useCallback } from "react";
import "./UrlInput.css";

const DEMO_URL =
  "https://www.flipkart.com/apple-iphone-15-blue-128-gb/p/itmbf14ef54f645d";

export default function UrlInput({ onAnalyze, isLoading, onReset }) {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  const validate = useCallback((value) => {
    if (!value.trim()) return "Please enter a Flipkart product URL.";
    try {
      const parsed = new URL(value.trim());
      if (!parsed.hostname.includes("flipkart.com"))
        return "URL must be from flipkart.com.";
      if (!value.includes("/p/"))
        return "URL must be a product page containing /p/ in the path.";
    } catch {
      return "Please enter a valid URL starting with https://.";
    }
    return "";
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const error = validate(url);
      if (error) {
        setUrlError(error);
        return;
      }
      setUrlError("");
      onAnalyze(url.trim());
    },
    [url, validate, onAnalyze],
  );

  const handleChange = useCallback(
    (e) => {
      setUrl(e.target.value);
      if (urlError) setUrlError("");
    },
    [urlError],
  );

  const handleDemo = useCallback(() => {
    setUrl(DEMO_URL);
    setUrlError("");
  }, []);

  return (
    <section className="url-input">
      <div className="url-input__card">
        <div className="url-input__header">
          <h2 className="url-input__title">Analyze Flipkart Product Reviews</h2>
          <p className="url-input__subtitle">
            Paste any Flipkart product URL to run AI sentiment analysis on its
            customer reviews.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div
            className={`url-input__field ${urlError ? "url-input__field--error" : ""}`}
          >
            <span className="url-input__prefix">🔗</span>
            <input
              type="url"
              className="url-input__input"
              placeholder="https://www.flipkart.com/product-name/p/ITEMID"
              value={url}
              onChange={handleChange}
              disabled={isLoading}
              aria-label="Flipkart product URL"
              aria-describedby={urlError ? "url-error" : undefined}
              autoComplete="off"
              spellCheck="false"
            />
            {url && !isLoading && (
              <button
                type="button"
                className="url-input__clear"
                onClick={() => {
                  setUrl("");
                  setUrlError("");
                }}
                aria-label="Clear URL"
              >
                ✕
              </button>
            )}
          </div>

          {urlError && (
            <p id="url-error" className="url-input__error" role="alert">
              ⚠ {urlError}
            </p>
          )}

          <div className="url-input__actions">
            <button
              type="submit"
              className="url-input__btn url-input__btn--primary"
              disabled={isLoading || !url.trim()}
            >
              {isLoading ? (
                <>
                  <span className="url-input__btn-spinner" />
                  Analyzing…
                </>
              ) : (
                <>◈ Analyze Reviews</>
              )}
            </button>

            <button
              type="button"
              className="url-input__btn url-input__btn--ghost"
              onClick={handleDemo}
              disabled={isLoading}
            >
              Try Demo URL
            </button>

            {onReset && (
              <button
                type="button"
                className="url-input__btn url-input__btn--ghost"
                onClick={onReset}
                disabled={isLoading}
              >
                ↺ Reset
              </button>
            )}
          </div>
        </form>

        <p className="url-input__hint">
          <strong>How to get the URL:</strong> Go to any Flipkart product page →
          copy the URL from your browser address bar → paste it here. The URL
          must contain <code>/p/</code> in the path.
        </p>
      </div>
    </section>
  );
}
