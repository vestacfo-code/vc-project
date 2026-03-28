import React from 'react';
import { cn } from '@/lib/utils';

interface DailyBriefingCardProps {
  hotelName: string;
  date: string;
  headline: string;
  body: string;
  status: 'on_track' | 'attention_needed' | 'critical';
  metrics: {
    occupancy: number;   // 0-1
    revpar: number;
    laborCostRatio: number; // 0-1
  };
}

const statusConfig = {
  on_track: {
    label: 'On Track',
    bg: '#D1FAE5',
    text: '#065F46',
    dot: '#10B981',
  },
  attention_needed: {
    label: 'Attention Needed',
    bg: '#FEF3C7',
    text: '#92400E',
    dot: '#F59E0B',
  },
  critical: {
    label: 'Critical',
    bg: '#FEE2E2',
    text: '#991B1B',
    dot: '#EF4444',
  },
};

interface MetricChipProps {
  label: string;
  value: string;
  subtext?: string;
}

const MetricChip: React.FC<MetricChipProps> = ({ label, value, subtext }) => (
  <div
    className="flex flex-col gap-0.5 px-3 py-2 rounded-lg"
    style={{ backgroundColor: 'rgba(27,58,92,0.07)' }}
  >
    <span
      className="text-[10px] uppercase tracking-widest font-medium"
      style={{ color: '#2E6DA4', fontFamily: "'DM Sans', sans-serif" }}
    >
      {label}
    </span>
    <span
      className="text-sm font-bold leading-none"
      style={{ color: '#1B3A5C', fontFamily: "'DM Mono', monospace" }}
    >
      {value}
    </span>
    {subtext && (
      <span
        className="text-[10px]"
        style={{ color: 'rgba(27,58,92,0.5)', fontFamily: "'DM Sans', sans-serif" }}
      >
        {subtext}
      </span>
    )}
  </div>
);

export const DailyBriefingCard: React.FC<DailyBriefingCardProps> = ({
  hotelName,
  date,
  headline,
  body,
  status,
  metrics,
}) => {
  const cfg = statusConfig[status];

  const formattedDate = (() => {
    try {
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return date;
    }
  })();

  return (
    <div
      className="rounded-2xl shadow-md p-6 flex flex-col gap-4 relative overflow-hidden"
      style={{ backgroundColor: '#F7F4EE' }}
    >
      {/* Top row: hotel name + date + status badge */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className="text-xs uppercase tracking-widest font-medium mb-0.5"
            style={{ color: '#2E6DA4', fontFamily: "'DM Sans', sans-serif" }}
          >
            {hotelName}
          </p>
          <p
            className="text-sm"
            style={{ color: 'rgba(27,58,92,0.55)', fontFamily: "'DM Sans', sans-serif" }}
          >
            {formattedDate}
          </p>
        </div>

        {/* Status badge */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0"
          style={{ backgroundColor: cfg.bg }}
        >
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: cfg.dot }}
          />
          <span
            className="text-xs font-semibold whitespace-nowrap"
            style={{ color: cfg.text, fontFamily: "'DM Sans', sans-serif" }}
          >
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Headline */}
      <h2
        className="text-xl font-bold leading-snug"
        style={{ color: '#1B3A5C', fontFamily: "'Cormorant Garamond', Georgia, serif" }}
      >
        {headline}
      </h2>

      {/* Gold divider */}
      <div
        className="h-px w-16 rounded-full"
        style={{ backgroundColor: '#C8963E' }}
      />

      {/* Body */}
      <p
        className="text-sm leading-relaxed"
        style={{ color: 'rgba(27,58,92,0.75)', fontFamily: "'DM Sans', sans-serif" }}
      >
        {body}
      </p>

      {/* Metric chips */}
      <div className="flex flex-wrap gap-2 pt-1">
        <MetricChip
          label="Occupancy"
          value={`${(metrics.occupancy * 100).toFixed(1)}%`}
        />
        <MetricChip
          label="RevPAR"
          value={`$${metrics.revpar.toFixed(2)}`}
        />
        <MetricChip
          label="Labor Cost"
          value={`${(metrics.laborCostRatio * 100).toFixed(1)}%`}
          subtext="of revenue"
        />
      </div>

      {/* Decorative gold corner accent */}
      <div
        className="absolute top-0 right-0 w-1 h-16 rounded-bl-full"
        style={{ backgroundColor: '#C8963E', opacity: 0.25 }}
      />
    </div>
  );
};
