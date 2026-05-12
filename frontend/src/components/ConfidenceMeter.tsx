'use client';
import { AIConfidenceScore } from '@/types';

interface ConfidenceMeterProps {
  score: AIConfidenceScore;
  compact?: boolean;
}

function getColor(val: number) {
  if (val >= 80) return { stroke: '#0d9488', text: 'text-teal-700', bg: 'bg-teal-50', label: 'High' };
  if (val >= 60) return { stroke: '#0284c7', text: 'text-sky-700', bg: 'bg-sky-50', label: 'Good' };
  if (val >= 40) return { stroke: '#d97706', text: 'text-amber-700', bg: 'bg-amber-50', label: 'Fair' };
  return { stroke: '#dc2626', text: 'text-red-700', bg: 'bg-red-50', label: 'Low' };
}

export default function ConfidenceMeter({ score, compact = false }: ConfidenceMeterProps) {
  const overall = Math.round(score.overallScore);
  const color = getColor(overall);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (overall / 100) * circumference;

  const subScores = [
    { label: 'Classification', value: Math.round(score.classificationScore), icon: '🏷️' },
    { label: 'Sentiment', value: Math.round(score.sentimentScore), icon: '💭' },
    { label: 'Routing', value: Math.round(score.routingScore), icon: '🔀' },
    { label: 'Resolution', value: Math.round(score.resolutionScore), icon: '✅' },
  ];

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg ${color.bg} border border-opacity-30`}>
        <div className="relative w-7 h-7">
          <svg className="w-7 h-7 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="4" />
            <circle cx="40" cy="40" r="34" fill="none" stroke={color.stroke} strokeWidth="4"
              strokeDasharray={2 * Math.PI * 34} strokeDashoffset={2 * Math.PI * 34 - (overall / 100) * 2 * Math.PI * 34}
              strokeLinecap="round" className="transition-all duration-700" />
          </svg>
        </div>
        <span className={`text-xs font-bold ${color.text}`}>{overall}%</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">AI Confidence</span>
        {score.requiresHuman && (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">Needs Human</span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Circular gauge */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="#f1f5f9" strokeWidth="5" />
            <circle cx="40" cy="40" r="36" fill="none" stroke={color.stroke} strokeWidth="5"
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round" className="transition-all duration-1000 ease-out" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-lg font-bold ${color.text}`}>{overall}%</span>
            <span className="text-[9px] text-slate-400 font-medium">{color.label}</span>
          </div>
        </div>

        {/* Sub-scores */}
        <div className="flex-1 grid grid-cols-2 gap-2">
          {subScores.map((sub) => {
            const subColor = getColor(sub.value);
            return (
              <div key={sub.label} className="flex items-center gap-1.5">
                <span className="text-xs">{sub.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-medium">{sub.label}</span>
                    <span className={`text-[10px] font-bold ${subColor.text}`}>{sub.value}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 rounded-full mt-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${sub.value}%`, backgroundColor: subColor.stroke }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {score.humanEscalationReason && (
        <p className="mt-2 text-[10px] text-amber-700 bg-amber-50 rounded px-2 py-1">
          ⚠️ {score.humanEscalationReason}
        </p>
      )}
    </div>
  );
}
