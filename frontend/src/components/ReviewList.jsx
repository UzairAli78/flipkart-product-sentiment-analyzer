import React, { useState, useMemo } from 'react';
import './ReviewList.css';

const SENTIMENT_CONFIG = {
  positive: { color: 'var(--positive)', bg: 'var(--positive-dim)', icon: '😊', label: 'Positive' },
  negative: { color: 'var(--negative)', bg: 'var(--negative-dim)', icon: '😞', label: 'Negative' },
  neutral:  { color: 'var(--neutral)',  bg: 'var(--neutral-dim)',  icon: '😐', label: 'Neutral'  },
};

function StarRow({ rating }) {
  return (
    <span className="review-stars" aria-label={`${rating} out of 5 stars`}>
      {[1,2,3,4,5].map(n => (
        <span key={n} className={n <= rating ? 'star star--filled' : 'star'}>★</span>
      ))}
    </span>
  );
}

function ReviewCard({ review, index }) {
  const config = SENTIMENT_CONFIG[review.sentiment] || SENTIMENT_CONFIG.neutral;
  return (
    <div
      className="review-card"
      style={{ '--delay': `${index * 40}ms`, '--sentiment-color': config.color, '--sentiment-bg': config.bg }}
    >
      <div className="review-card__header">
        <div className="review-card__left">
          <div className="review-card__avatar">
            {review.author.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="review-card__author">{review.author}</p>
            <p className="review-card__date">{review.date}</p>
          </div>
        </div>
        <div className="review-card__right">
          <StarRow rating={review.rating} />
          <span className="review-card__badge">
            {config.icon} {config.label}
          </span>
        </div>
      </div>

      {review.title && (
        <p className="review-card__title">"{review.title}"</p>
      )}
      <p className="review-card__text">{review.text}</p>

      <div className="review-card__footer">
        <span className="review-card__score">
          Confidence: {(review.sentimentScore * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

const FILTERS = ['all', 'positive', 'neutral', 'negative'];
const PAGE_SIZE = 5;

export default function ReviewList({ reviews = [] }) {
  const [filter, setFilter] = useState('all');
  const [page, setPage]     = useState(1);

  const filtered = useMemo(
    () => filter === 'all' ? reviews : reviews.filter(r => r.sentiment === filter),
    [reviews, filter]
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilter = (f) => {
    setFilter(f);
    setPage(1);
  };

  if (!reviews.length) return null;

  return (
    <section className="review-list" aria-label="Individual reviews">
      <div className="review-list__header">
        <h3 className="review-list__title">Individual Reviews</h3>
        <p className="review-list__count">{filtered.length} of {reviews.length}</p>
      </div>

      {/* Filter tabs */}
      <div className="review-list__filters" role="tablist">
        {FILTERS.map(f => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            className={`filter-btn ${filter === f ? 'filter-btn--active' : ''} filter-btn--${f}`}
            onClick={() => handleFilter(f)}
          >
            {f === 'all' ? `All (${reviews.length})` :
             f === 'positive' ? `😊 Positive (${reviews.filter(r=>r.sentiment==='positive').length})` :
             f === 'neutral'  ? `😐 Neutral (${reviews.filter(r=>r.sentiment==='neutral').length})` :
             `😞 Negative (${reviews.filter(r=>r.sentiment==='negative').length})`}
          </button>
        ))}
      </div>

      {/* Review cards */}
      {visible.length === 0 ? (
        <p className="review-list__empty">No {filter} reviews found.</p>
      ) : (
        <div className="review-list__cards">
          {visible.map((r, i) => (
            <ReviewCard key={r.id} review={r} index={i} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="review-list__pagination">
          <button
            className="page-btn"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >← Prev</button>
          <span className="page-info">{page} / {totalPages}</span>
          <button
            className="page-btn"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >Next →</button>
        </div>
      )}
    </section>
  );
}
