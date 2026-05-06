import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  PieChart, Pie, Legend, ResponsiveContainer,
} from 'recharts';
import './SentimentChart.css';

const COLORS = {
  positive: '#22c55e',
  neutral:  '#f59e0b',
  negative: '#ef4444',
};

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, percent } = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__name" style={{ color: COLORS[name.toLowerCase()] }}>
        {name}
      </p>
      <p className="chart-tooltip__value">{value} reviews</p>
      {percent !== undefined && (
        <p className="chart-tooltip__pct">{(percent * 100).toFixed(1)}% of total</p>
      )}
    </div>
  );
}

// ── Custom Pie Label ──────────────────────────────────────────────────────────
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
      fontSize={12} fontFamily="DM Sans, sans-serif" fontWeight="600">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function SentimentChart({ data }) {
  const [view, setView] = useState('bar'); // 'bar' | 'pie'

  const { positive, negative, neutral,
          percentPositive, percentNegative, percentNeutral } = data;

  const chartData = [
    { name: 'Positive', value: positive,  pct: percentPositive },
    { name: 'Neutral',  value: neutral,   pct: percentNeutral  },
    { name: 'Negative', value: negative,  pct: percentNegative },
  ];

  return (
    <section className="chart-section">
      <div className="chart-section__header">
        <h3 className="chart-section__title">Sentiment Distribution</h3>
        <div className="chart-toggle" role="tablist">
          <button
            role="tab"
            aria-selected={view === 'bar'}
            className={`chart-toggle__btn ${view === 'bar' ? 'active' : ''}`}
            onClick={() => setView('bar')}
          >Bar</button>
          <button
            role="tab"
            aria-selected={view === 'pie'}
            className={`chart-toggle__btn ${view === 'pie' ? 'active' : ''}`}
            onClick={() => setView('pie')}
          >Pie</button>
        </div>
      </div>

      <div className="chart-section__body">
        {view === 'bar' ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} barCategoryGap="35%"
              margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#7e92b0', fontSize: 13, fontFamily: 'DM Sans' }}
                axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#7e92b0', fontSize: 12, fontFamily: 'DM Sans' }}
                axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name.toLowerCase()]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                innerRadius={55}
                paddingAngle={4}
                dataKey="value"
                labelLine={false}
                label={PieLabel}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name.toLowerCase()]}
                    stroke="rgba(0,0,0,0.3)" strokeWidth={2} />
                ))}
              </Pie>
              <Legend
                formatter={(value) => (
                  <span style={{ color: '#7e92b0', fontSize: 13 }}>{value}</span>
                )}
              />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}

        {/* Percentage bars below chart */}
        <div className="chart-section__bars">
          {chartData.map(({ name, value, pct }) => (
            <div key={name} className="pct-bar">
              <div className="pct-bar__label">
                <span className="pct-bar__dot" style={{ background: COLORS[name.toLowerCase()] }} />
                <span>{name}</span>
              </div>
              <div className="pct-bar__track">
                <div
                  className="pct-bar__fill"
                  style={{ width: `${pct}%`, background: COLORS[name.toLowerCase()] }}
                />
              </div>
              <span className="pct-bar__pct">{pct}%</span>
              <span className="pct-bar__count">({value})</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
