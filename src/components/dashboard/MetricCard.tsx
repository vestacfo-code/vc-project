import React from 'react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string;
  change: number;
  changeLabel?: string;
  status?: 'good' | 'warning' | 'critical';
  icon?: React.ReactNode;
}

const ArrowUp = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M6 9.5V2.5M6 2.5L2.5 6M6 2.5L9.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowDown = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M6 2.5V9.5M6 9.5L2.5 6M6 9.5L9.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const statusBorderMap: Record<NonNullable<MetricCardProps['status']>, string> = {
  good: 'border-l-4 border-l-green-400',
  warning: 'border-l-4 border-l-yellow-400',
  critical: 'border-l-4 border-l-red-400',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  changeLabel = 'vs last period',
  status,
  icon,
}) => {
  const isPositive = change >= 0;
  const changeColor = isPositive ? '#C8963E' : '#EF4444';
  const absChange = Math.abs(change);

  return (
    <div
      className={cn(
        'rounded-xl p-5 flex flex-col gap-3 shadow-sm',
        status ? statusBorderMap[status] : '',
      )}
      style={{ backgroundColor: '#1B3A5C' }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-sans font-medium uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'DM Sans', sans-serif" }}
        >
          {label}
        </span>
        {icon && (
          <span style={{ color: 'rgba(255,255,255,0.4)' }} className="flex items-center">
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <div
        className="text-3xl font-bold leading-none tracking-tight text-white"
        style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}
      >
        {value}
      </div>

      {/* Change indicator */}
      <div className="flex items-center gap-1.5">
        <span
          className="flex items-center gap-0.5 text-xs font-semibold"
          style={{ color: changeColor, fontFamily: "'DM Mono', monospace" }}
        >
          {isPositive ? <ArrowUp /> : <ArrowDown />}
          {isPositive ? '+' : '-'}{absChange.toFixed(1)}%
        </span>
        <span
          className="text-xs"
          style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'DM Sans', sans-serif" }}
        >
          {changeLabel}
        </span>
      </div>
    </div>
  );
};
