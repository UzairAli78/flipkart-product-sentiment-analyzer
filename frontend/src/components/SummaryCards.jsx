import React from 'react';
import './SummaryCards.css';

function StatCard({ label, value, subvalue, color, icon, delay = 0 }) {
  return (
    <div
      className="stat-card"
      style={{
        '--card-color': color,
        '--card-color-dim': `${color}1a`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__body">
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
        {subvalue && <p className="stat-card__sub">{subvalue}</p>}
      </div>
    </div>
  );
}

function StarRating({ rating }) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="star-rating" aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(full)}
      {half ? '½' : ''}
      {'☆'.repeat(empty)}
    </span>
  );
}

export default function SummaryCards({ data }) {
  const {
    total, positive, negative, neutral,
    percentPositive, percentNegative, percentNeutral,
    averageRating, dataSource,
  } = data;

  return (
    <section className="summary" aria-label="Analysis summary">
      {/* Data source badge */}
      <div className="summary__badge">
        <span className={`badge ${dataSource === 'scraped' ? 'badge--live' : 'badge--fallback'}`}>
          {dataSource === 'scraped' ? '🟢 Live Data' : '📂 Sample Dataset'}
        </span>
        <span className="summary__count">{total} reviews analyzed</span>
      </div>

      {/* Star rating hero */}
      <div className="summary__rating-hero">
        <div className="summary__rating-num">{averageRating}</div>
        <div className="summary__rating-stars">
          <StarRating rating={averageRating} />
          <span className="summary__rating-label">Average Rating</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="summary__cards">
        <StatCard
          label="Positive"
          value={positive}
          subvalue={`${percentPositive}%`}
          color="#22c55e"
          icon="😊"
          delay={0}
        />
        <StatCard
          label="Neutral"
          value={neutral}
          subvalue={`${percentNeutral}%`}
          color="#f59e0b"
          icon="😐"
          delay={60}
        />
        <StatCard
          label="Negative"
          value={negative}
          subvalue={`${percentNegative}%`}
          color="#ef4444"
          icon="😞"
          delay={120}
        />
        <StatCard
          label="Total Reviews"
          value={total}
          subvalue="analyzed"
          color="#3b82f6"
          icon="📊"
          delay={180}
        />
      </div>
    </section>
  );
}
