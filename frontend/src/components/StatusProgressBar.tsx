'use client';
import React from 'react';
import { ComplaintStatus, COMPLAINT_STATUS_CONFIG } from '@/types';

const PROGRESS_STEPS: { status: ComplaintStatus; label: string; icon: string }[] = [
  { status: 'SUBMITTED', label: 'Submitted', icon: '📝' },
  { status: 'AI_PROCESSING', label: 'AI Analysis', icon: '🤖' },
  { status: 'HUMAN_TEAM_ASSIGNED', label: 'Team Assigned', icon: '👥' },
  { status: 'IN_PROGRESS', label: 'In Progress', icon: '⚙️' },
  { status: 'WAITING_FOR_EMPLOYEE', label: 'Your Review', icon: '📋' },
  { status: 'RESOLVED', label: 'Resolved', icon: '✅' },
];

const BRANCH_STATUSES = ['ESCALATED', 'REOPENED'] as const;

function getStepIndex(status: ComplaintStatus): number {
  const idx = PROGRESS_STEPS.findIndex(s => s.status === status);
  if (idx >= 0) return idx;
  if (status === 'AI_RESPONDED') return 1;
  if (status === 'ESCALATED') return 3;
  if (status === 'REOPENED') return 3;
  if (status === 'CLOSED') return 5;
  return 0;
}

export default function StatusProgressBar({ status, className = '' }: { status: ComplaintStatus; className?: string }) {
  const currentIdx = getStepIndex(status);
  const isBranch = BRANCH_STATUSES.includes(status as any);
  const config = COMPLAINT_STATUS_CONFIG[status];

  return (
    <div className={`w-full ${className}`}>
      {/* Branch indicator */}
      {isBranch && (
        <div className={`mb-3 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${config.bgColor} ${config.color}`}>
          <span>{status === 'ESCALATED' ? '⚠️' : '🔄'}</span>
          <span>{config.label}</span>
          <span className="opacity-60">— Complaint has been {status.toLowerCase()}</span>
        </div>
      )}

      {/* Progress bar */}
      <div className="flex items-center w-full">
        {PROGRESS_STEPS.map((step, i) => {
          const isPast = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isFuture = i > currentIdx;

          return (
            <React.Fragment key={step.status}>
              {/* Step circle */}
              <div className="flex flex-col items-center relative" style={{ minWidth: 48 }}>
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500 ${
                    isPast
                      ? 'bg-teal-500 text-white shadow-md shadow-teal-200'
                      : isCurrent
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-4 ring-indigo-100 animate-pulse'
                      : 'bg-slate-100 text-slate-400 border-2 border-slate-200'
                  }`}
                >
                  {isPast ? '✓' : step.icon}
                </div>
                <span className={`text-[10px] mt-1.5 text-center whitespace-nowrap font-medium ${
                  isCurrent ? 'text-indigo-700' : isPast ? 'text-teal-700' : 'text-slate-400'
                }`}>
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {i < PROGRESS_STEPS.length - 1 && (
                <div className="flex-1 h-[3px] mx-1 rounded-full overflow-hidden bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      isPast ? 'bg-teal-500' : isCurrent ? 'bg-indigo-400 w-1/2' : ''
                    }`}
                    style={{ width: isPast ? '100%' : isCurrent ? '50%' : '0%' }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
