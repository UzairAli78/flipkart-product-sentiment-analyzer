import React, { useCallback } from 'react';
import SummaryCards  from './SummaryCards';
import SentimentChart from './SentimentChart';
import KeywordCloud  from './KeywordCloud';
import ReviewList    from './ReviewList';
import './Dashboard.css';

export default function Dashboard({ data }) {
  const handleDownload = useCallback(() => {
    const exportData = {
      generatedAt: new Date().toISOString(),
      url: data.url,
      dataSource: data.dataSource,
      summary: {
        total:           data.total,
        positive:        data.positive,
        negative:        data.negative,
        neutral:         data.neutral,
        percentPositive: data.percentPositive,
        percentNegative: data.percentNegative,
        percentNeutral:  data.percentNeutral,
        averageRating:   data.averageRating,
      },
      topKeywords: data.topKeywords,
      reviews:     data.reviews,
    };

    const blob = new Blob(
      [JSON.stringify(exportData, null, 2)],
      { type: 'application/json' }
    );
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `sentiment-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data]);

  return (
    <div className="dashboard">
      {/* ── Top action bar ── */}
      <div className="dashboard__bar">
        <div className="dashboard__url">
          <span className="dashboard__url-label">Analyzed:</span>
          <span className="dashboard__url-value">{data.url}</span>
        </div>
        <button className="dashboard__download" onClick={handleDownload}>
          ⬇ Download Report
        </button>
      </div>

      {/* ── Summary cards + rating ── */}
      <SummaryCards data={data} />

      {/* ── Charts ── */}
      <SentimentChart data={data} />

      {/* ── Keyword cloud ── */}
      <KeywordCloud keywords={data.topKeywords || []} />

      {/* ── Individual reviews ── */}
      <ReviewList reviews={data.reviews || []} />
    </div>
  );
}
