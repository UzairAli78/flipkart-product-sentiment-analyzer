import React from 'react';
import './KeywordCloud.css';

export default function KeywordCloud({ keywords = [] }) {
  if (!keywords.length) return null;

  const maxCount = Math.max(...keywords.map(k => k.count), 1);

  return (
    <section className="keyword-cloud">
      <div className="keyword-cloud__header">
        <h3 className="keyword-cloud__title">🔑 Top Keywords</h3>
        <p className="keyword-cloud__sub">Most frequently mentioned words across all reviews</p>
      </div>

      <div className="keyword-cloud__tags">
        {keywords.map(({ word, count }, i) => {
          const weight = count / maxCount; // 0–1
          const size   = 12 + weight * 12; // 12px–24px
          const opacity = 0.4 + weight * 0.6;
          return (
            <span
              key={word}
              className="keyword-tag"
              style={{
                fontSize: `${size}px`,
                opacity,
                animationDelay: `${i * 50}ms`,
              }}
              title={`Appears ${count} time${count !== 1 ? 's' : ''}`}
            >
              {word}
              <sup className="keyword-tag__count">{count}</sup>
            </span>
          );
        })}
      </div>
    </section>
  );
}
