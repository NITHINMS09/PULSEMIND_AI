'use client';
import { useState, useEffect, useRef } from 'react';
import { Complaint, ComplaintMessage, COMPLAINT_STATUS_CONFIG, ComplaintStatus } from '@/types';
import { chatApi, escalationApi, resolutionApi } from '@/lib/api';
import StatusProgressBar from './StatusProgressBar';
import SLACountdown from './SLACountdown';
import ConfidenceMeter from './ConfidenceMeter';

interface ComplaintDrawerProps {
  complaint: Complaint | null;
  onClose: () => void;
  isOpen: boolean;
  userRole?: string;
}

export default function ComplaintDrawer({ complaint, onClose, isOpen, userRole = 'EMPLOYEE' }: ComplaintDrawerProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'chat'>('details');
  const [messages, setMessages] = useState<ComplaintMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [solution, setSolution] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [showEscalate, setShowEscalate] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (complaint?.id && isOpen) {
      loadMessages();
    }
  }, [complaint?.id, isOpen]);

  async function loadMessages() {
    if (!complaint) return;
    try {
      const { data } = await chatApi.getMessages(complaint.id, 50);
      const msgs = data?.data || data || [];
      setMessages(Array.isArray(msgs) ? msgs.reverse() : []);
    } catch { setMessages([]); }
  }

  async function sendMessage() {
    if (!complaint || !newMessage.trim()) return;
    setIsSending(true);
    try {
      await chatApi.sendMessage(complaint.id, newMessage.trim());
      setNewMessage('');
      await loadMessages();
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (e) { console.error(e); }
    setIsSending(false);
  }

  async function handleEscalate() {
    if (!complaint || !escalateReason.trim()) return;
    try {
      await escalationApi.escalate(complaint.id, escalateReason);
      setShowEscalate(false);
      setEscalateReason('');
    } catch (e) { console.error(e); }
  }

  async function handleSubmitSolution() {
    if (!complaint || !solution.trim()) return;
    try {
      await resolutionApi.submitSolution(complaint.id, solution);
      setShowSolution(false);
      setSolution('');
    } catch (e) { console.error(e); }
  }

  if (!isOpen || !complaint) return null;

  const feedback = complaint.feedback;
  const sla = complaint.slaRecord;
  const config = COMPLAINT_STATUS_CONFIG[complaint.status as ComplaintStatus] || COMPLAINT_STATUS_CONFIG.SUBMITTED;
  const isTeam = userRole !== 'EMPLOYEE';

  const tabs = [
    { key: 'details', label: 'Details', icon: '📋' },
    { key: 'timeline', label: 'Timeline', icon: '📊' },
    { key: 'chat', label: 'Chat', icon: '💬' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full z-50 w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">#{complaint.id.slice(0, 8)}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${config.bgColor} ${config.color}`}>
                  {config.label}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  complaint.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                  complaint.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                  complaint.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {complaint.priority}
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-800 mt-1 line-clamp-1">
                {feedback?.title || 'Complaint'}
              </h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              ✕
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 mt-3">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === tab.key ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-500 hover:bg-slate-50'
                }`}>
                <span>{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'details' && (
            <div className="p-5 space-y-4">
              {/* Status Progress Bar */}
              <StatusProgressBar status={complaint.status as ComplaintStatus} />

              {/* SLA Timer */}
              {sla && (
                <SLACountdown
                  deadline={sla.resolutionDeadline}
                  isBreached={sla.isResolutionBreached}
                  isPaused={!!sla.pausedAt}
                />
              )}

              {/* AI Confidence */}
              {feedback?.confidenceScore && (
                <ConfidenceMeter score={feedback.confidenceScore} />
              )}

              {/* Author info */}
              {complaint.author && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Employee</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
                      {complaint.author.firstName?.[0]}{complaint.author.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{complaint.author.firstName} {complaint.author.lastName}</p>
                      <p className="text-xs text-slate-500">{feedback?.department?.name || 'Unknown Dept'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Content */}
              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">Description</h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-200">
                  {feedback?.content || 'No content'}
                </p>
              </div>

              {/* AI Analysis */}
              {feedback?.aiAnalysis && (
                <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100">
                  <h4 className="text-[10px] uppercase tracking-wider text-indigo-500 font-semibold mb-2">🤖 AI Analysis</h4>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="text-center">
                      <span className="text-lg">{feedback.aiAnalysis.emotion === 'frustration' ? '😤' : feedback.aiAnalysis.emotion === 'anxiety' ? '😰' : feedback.aiAnalysis.emotion === 'anger' ? '😡' : '😐'}</span>
                      <p className="text-[10px] text-slate-500 capitalize">{feedback.aiAnalysis.emotion}</p>
                    </div>
                    <div className="text-center">
                      <span className={`text-sm font-bold ${(feedback.aiAnalysis.sentiment as number) > 0 ? 'text-teal-600' : 'text-red-600'}`}>
                        {((feedback.aiAnalysis.sentiment as number) * 100).toFixed(0)}%
                      </span>
                      <p className="text-[10px] text-slate-500">Sentiment</p>
                    </div>
                    <div className="text-center">
                      <span className={`text-sm font-bold ${(feedback.aiAnalysis.toxicityScore as number) > 0.3 ? 'text-red-600' : 'text-teal-600'}`}>
                        {((feedback.aiAnalysis.toxicityScore as number) * 100).toFixed(0)}%
                      </span>
                      <p className="text-[10px] text-slate-500">Toxicity</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">{feedback.aiAnalysis.summary}</p>
                </div>
              )}

              {/* Solution (if waiting for employee) */}
              {complaint.aiResolution && complaint.status === 'WAITING_FOR_EMPLOYEE' && (
                <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
                  <h4 className="text-[10px] uppercase tracking-wider text-purple-500 font-semibold mb-2">📋 Proposed Solution</h4>
                  <p className="text-sm text-slate-700">{complaint.aiResolution}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="p-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Resolution History</h4>
              {complaint.resolutionHistory && complaint.resolutionHistory.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-200" />
                  <div className="space-y-4">
                    {complaint.resolutionHistory.map((entry, i) => {
                      const entryConfig = COMPLAINT_STATUS_CONFIG[entry.toStatus as ComplaintStatus] || { color: 'text-slate-600', bgColor: 'bg-slate-50', label: entry.toStatus };
                      return (
                        <div key={entry.id || i} className="relative pl-8">
                          <div className={`absolute left-1.5 w-3 h-3 rounded-full border-2 border-white ${
                            i === 0 ? 'bg-indigo-500' : 'bg-slate-300'
                          }`} />
                          <div className={`rounded-lg p-2.5 ${entryConfig.bgColor} border border-slate-200/50`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold uppercase ${entryConfig.color}`}>{entryConfig.label}</span>
                              <span className="text-[10px] text-slate-400">← {COMPLAINT_STATUS_CONFIG[entry.fromStatus as ComplaintStatus]?.label || entry.fromStatus}</span>
                            </div>
                            {entry.note && <p className="text-xs text-slate-600">{entry.note}</p>}
                            <p className="text-[10px] text-slate-400 mt-1">{new Date(entry.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">No history yet</div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">No messages yet. Start the conversation.</div>
                ) : (
                  messages.map((msg) => {
                    const isOwnMessage = msg.senderType === (isTeam ? 'TEAM' : 'EMPLOYEE');
                    return (
                      <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                          isOwnMessage ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'
                        }`}>
                          <p className={`text-[10px] font-semibold mb-0.5 ${isOwnMessage ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : 'Unknown'}
                          </p>
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-[9px] mt-1 ${isOwnMessage ? 'text-indigo-300' : 'text-slate-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex-shrink-0 border-t border-slate-200 p-4 space-y-2">
          {activeTab === 'chat' && (
            <div className="flex gap-2">
              <input
                type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..." disabled={isSending}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
              />
              <button onClick={sendMessage} disabled={isSending || !newMessage.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                Send
              </button>
            </div>
          )}

          {activeTab !== 'chat' && isTeam && (
            <div className="flex gap-2">
              <button onClick={() => setShowSolution(true)}
                className="flex-1 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
                📝 Submit Solution
              </button>
              <button onClick={() => setShowEscalate(true)}
                className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
                ⬆️ Escalate
              </button>
            </div>
          )}

          {/* Solution dialog */}
          {showSolution && (
            <div className="bg-teal-50 rounded-lg p-3 border border-teal-200">
              <textarea value={solution} onChange={(e) => setSolution(e.target.value)} rows={3}
                placeholder="Describe the solution..." className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-teal-200" />
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setShowSolution(false)} className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={handleSubmitSolution} className="px-3 py-1.5 bg-teal-600 text-white text-xs rounded-lg font-medium hover:bg-teal-700">Submit</button>
              </div>
            </div>
          )}

          {/* Escalate dialog */}
          {showEscalate && (
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <select value={escalateReason} onChange={(e) => setEscalateReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 mb-2">
                <option value="">Select reason...</option>
                <option value="Complexity Exceeds Scope">Complexity Exceeds Scope</option>
                <option value="Employee Dissatisfied">Employee Dissatisfied</option>
                <option value="Policy Decision Required">Policy Decision Required</option>
                <option value="Legal Risk">Legal Risk</option>
                <option value="Sensitive Issue">Sensitive Issue</option>
              </select>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowEscalate(false)} className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={handleEscalate} disabled={!escalateReason} className="px-3 py-1.5 bg-orange-500 text-white text-xs rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50">Escalate</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
