'use client';
import { useEffect, useState } from 'react';

interface SLACountdownProps {
  deadline: string;
  isBreached: boolean;
  isPaused?: boolean;
  label?: string;
  compact?: boolean;
}

function getTimeRemaining(deadline: string) {
  const now = Date.now();
  const target = new Date(deadline).getTime();
  const diff = target - now;

  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, totalMs: 0, percent: 0 };

  return {
    hours: Math.floor(diff / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    totalMs: diff,
    percent: 100,
  };
}

function getTimerColor(hoursRemaining: number, isBreached: boolean) {
  if (isBreached) return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', ring: 'ring-red-500', dot: 'bg-red-500' };
  if (hoursRemaining <= 1) return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', ring: 'ring-red-400', dot: 'bg-red-500' };
  if (hoursRemaining <= 4) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', ring: 'ring-amber-400', dot: 'bg-amber-500' };
  return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', ring: 'ring-teal-400', dot: 'bg-teal-500' };
}

export default function SLACountdown({ deadline, isBreached, isPaused, label = 'Resolution', compact = false }: SLACountdownProps) {
  const [time, setTime] = useState(getTimeRemaining(deadline));

  useEffect(() => {
    if (isPaused || isBreached) return;
    const timer = setInterval(() => {
      setTime(getTimeRemaining(deadline));
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline, isPaused, isBreached]);

  const colors = getTimerColor(time.hours, isBreached);
  const isPulsing = time.hours <= 1 && !isBreached && !isPaused;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} ${isPulsing ? 'animate-pulse' : ''}`} />
        {isBreached ? (
          <span>BREACHED</span>
        ) : isPaused ? (
          <span>PAUSED</span>
        ) : (
          <span>{String(time.hours).padStart(2, '0')}:{String(time.minutes).padStart(2, '0')}:{String(time.seconds).padStart(2, '0')}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-3 ${colors.bg} ${colors.border} ${isPulsing ? 'ring-2 ring-offset-1 ' + colors.ring : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label} SLA</span>
        {isBreached && (
          <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full uppercase">Breached</span>
        )}
        {isPaused && (
          <span className="px-2 py-0.5 bg-slate-500 text-white text-[10px] font-bold rounded-full uppercase">Paused</span>
        )}
      </div>

      {isBreached ? (
        <div className={`text-center py-1 font-bold text-lg ${colors.text}`}>
          ⚠️ SLA Breached
        </div>
      ) : isPaused ? (
        <div className="text-center py-1 font-bold text-lg text-slate-500">
          ⏸ Timer Paused
        </div>
      ) : (
        <div className="flex items-center justify-center gap-1">
          {[
            { val: time.hours, label: 'h' },
            { val: time.minutes, label: 'm' },
            { val: time.seconds, label: 's' },
          ].map((unit, i) => (
            <div key={i} className="flex items-baseline gap-0.5">
              <span className={`text-xl font-mono font-bold ${colors.text} tabular-nums`}>
                {String(unit.val).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">{unit.label}</span>
              {i < 2 && <span className={`text-lg font-bold ${colors.text} mx-0.5 opacity-50`}>:</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
