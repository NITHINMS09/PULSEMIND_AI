'use client';
import { useEffect, useState } from 'react';
import { teamsApi, routingApi } from '@/lib/api';
import { Team, RoutingRule, RoutingAnalysis } from '@/types';

export default function RoutingConfigPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [testText, setTestText] = useState('');
  const [testResult, setTestResult] = useState<RoutingAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [tRes, rRes] = await Promise.all([teamsApi.list(), routingApi.listRules()]);
      setTeams(tRes.data?.data || tRes.data || []);
      setRules(rRes.data?.data || rRes.data || []);
    } catch { }
    setLoading(false);
  }

  async function handleTest() {
    if (!testText.trim()) return;
    setTesting(true);
    try {
      const { data } = await routingApi.test(testText);
      setTestResult(data?.data || data);
    } catch { setTestResult(null); }
    setTesting(false);
  }

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">🔀 Routing Configuration</h1>
          <p className="text-sm text-slate-500 mt-1">Manage AI routing rules and test complaint routing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">🧪 Test Routing Engine</h3>
          <textarea value={testText} onChange={(e) => setTestText(e.target.value)} rows={4}
            placeholder="Paste complaint text to test routing..." className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 mb-3" />
          <button onClick={handleTest} disabled={testing || !testText.trim()}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {testing ? 'Analyzing...' : '🔍 Analyze & Route'}
          </button>

          {testResult && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Detected Intent:</span>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">{testResult.detectedIntent}</span>
                {testResult.requiresHuman && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">⚠️ Needs Human</span>
                )}
              </div>

              <div>
                <span className="text-xs text-slate-500 font-medium block mb-1">Keywords:</span>
                <div className="flex flex-wrap gap-1">
                  {testResult.extractedKeywords.map((kw, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-full">{kw}</span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-medium block mb-2">Recommended Teams:</span>
                {testResult.recommendations.map((rec, i) => (
                  <div key={i} className={`flex items-center justify-between p-2.5 rounded-lg border mb-1.5 ${i === 0 ? 'bg-teal-50 border-teal-200' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700">#{i + 1}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{rec.teamName}</p>
                        <p className="text-[10px] text-slate-400">{rec.teamType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${rec.confidence >= 70 ? 'text-teal-600' : rec.confidence >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                        {rec.confidence}%
                      </p>
                      <p className="text-[10px] text-slate-400">confidence</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Routing Rules */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">📋 Active Routing Rules</h3>
          <div className="space-y-3">
            {rules.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-sm">No routing rules configured</p>
            ) : (
              rules.map((rule) => {
                const keywords: string[] = JSON.parse(rule.keywords || '[]');
                return (
                  <div key={rule.id} className="border border-slate-200 rounded-lg p-3 hover:border-indigo-200 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">{rule.name}</span>
                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded">{rule.team?.name || '—'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-teal-500' : 'bg-slate-300'}`} />
                        <span className="text-[10px] text-slate-400">{rule.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {keywords.slice(0, 8).map((kw, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded">{kw}</span>
                      ))}
                      {keywords.length > 8 && <span className="text-[10px] text-slate-400">+{keywords.length - 8} more</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Teams Overview */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">🏢 Teams Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {teams.map((team) => (
            <div key={team.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-200 transition-colors">
              <p className="text-sm font-semibold text-slate-800">{team.name}</p>
              <p className="text-[10px] text-slate-400 uppercase mb-2">{team.type}</p>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-50 rounded-lg p-1.5">
                  <p className="text-sm font-bold text-indigo-600">{team.memberCount || 0}</p>
                  <p className="text-[9px] text-slate-400">Members</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-1.5">
                  <p className="text-sm font-bold text-amber-600">{team.activeComplaints || 0}</p>
                  <p className="text-[9px] text-slate-400">Active</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
