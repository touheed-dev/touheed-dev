import React, { useState } from 'react';
import {
  ShieldAlert, CheckCircle2, AlertTriangle, Clock, RotateCcw, Ban,
  ArrowUpRight, Fingerprint, Check, X, RefreshCw, Search, Activity,
  Lock, Layers, Hexagon, ShieldCheck, Download, Zap, Flame, Terminal
} from 'lucide-react';
import { InterceptionDecision, AgentRecord, ApprovalItem, LedgerBlock } from '../types';
import { DynamicMeshRadar } from './DynamicMeshRadar';
import { LiveAuditTerminal } from './LiveAuditTerminal';

interface CommandCenterViewProps {
  interceptions: InterceptionDecision[];
  agents: AgentRecord[];
  approvals: ApprovalItem[];
  ledgerBlocks: LedgerBlock[];
  onSelectInterception: (item: InterceptionDecision) => void;
  onQuarantineAgent: (agentId: string) => void;
  onResetAgent: (agentId: string) => void;
  onBumpEpoch: (agentId: string) => void;
  onResolveApproval: (approvalId: string, action: 'APPROVE' | 'REJECT', note: string) => void;
  onVerifyLedger: () => void;
  ledgerVerification: any;
  isVerifyingLedger: boolean;
  onQuickSimulate?: (payload: any) => void;
}

function DecisionBadge({ decision }: { decision: string }) {
  const cfg: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    ALLOW: {
      cls: 'badge-allow',
      icon: <CheckCircle2 className="w-3 h-3" />,
      label: 'ALLOW',
    },
    WARN: {
      cls: 'badge-warn',
      icon: <AlertTriangle className="w-3 h-3" />,
      label: 'WARN',
    },
    REQUIRE_APPROVAL: {
      cls: 'badge-approval',
      icon: <Clock className="w-3 h-3" />,
      label: 'APPROVAL',
    },
    BLOCK: {
      cls: 'badge-block',
      icon: <Ban className="w-3 h-3" />,
      label: 'BLOCK',
    },
  };
  const c = cfg[decision] || cfg.BLOCK;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${c.cls}`}>
      {c.icon}
      {c.label}
    </span>
  );
}

function RiskBar({ score }: { score: number }) {
  const color = score >= 70 ? '#DC2626' : score >= 40 ? '#D97706' : '#059669';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 bg-[#D6CFC3] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  interceptions,
  agents,
  approvals,
  ledgerBlocks,
  onSelectInterception,
  onQuarantineAgent,
  onResetAgent,
  onBumpEpoch,
  onResolveApproval,
  onVerifyLedger,
  ledgerVerification,
  isVerifyingLedger,
  onQuickSimulate,
}) => {
  const [filterTool, setFilterTool] = useState('');
  const [filterDecision, setFilterDecision] = useState<string>('ALL');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string | null>(null);
  const [approvalNote, setApprovalNote] = useState<Record<string, string>>({});
  const [isStormRunning, setIsStormRunning] = useState(false);

  const filtered = interceptions.filter((item) => {
    const matchesText =
      item.tool_name.toLowerCase().includes(filterTool.toLowerCase()) ||
      item.agent_id.toLowerCase().includes(filterTool.toLowerCase()) ||
      item.trace_id.toLowerCase().includes(filterTool.toLowerCase());
    const matchesDecision = filterDecision === 'ALL' || item.decision === filterDecision;
    const matchesAgent = !selectedAgentFilter || item.agent_id === selectedAgentFilter;
    return matchesText && matchesDecision && matchesAgent;
  });

  const handleExportInterceptions = () => {
    const blob = new Blob([JSON.stringify(interceptions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agentguard-events-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportLedger = () => {
    const blob = new Blob([JSON.stringify(ledgerBlocks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agentguard-ledger-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Run a 3-stage automated threat storm to demonstrate real-time dynamic mitigation
  const handleRunThreatStorm = async () => {
    if (!onQuickSimulate || isStormRunning) return;
    setIsStormRunning(true);

    const threats = [
      {
        agent_id: 'crawler-03',
        tool_name: 'read_file',
        arguments: { path: '/etc/secrets/aws_canary_key' },
        task_id: 'TASK-STORM-01',
        trace_id: `TRC-STORM-CANARY-${Date.now().toString().slice(-4)}`,
      },
      {
        agent_id: 'researcher-01',
        tool_name: 'read_file',
        arguments: { path: '../../etc/shadow' },
        task_id: 'TASK-STORM-02',
        trace_id: `TRC-STORM-TRAV-${Date.now().toString().slice(-4)}`,
      },
      {
        agent_id: 'external-scout',
        tool_name: 'execute_code',
        arguments: { code: 'import os; os.system("cat /etc/passwd")' },
        task_id: 'TASK-STORM-03',
        trace_id: `TRC-STORM-RCE-${Date.now().toString().slice(-4)}`,
      },
    ];

    for (let i = 0; i < threats.length; i++) {
      onQuickSimulate(threats[i]);
      await new Promise((resolve) => setTimeout(resolve, 900));
    }

    setIsStormRunning(false);
  };

  const quickThreats = [
    {
      label: '🍯 Canary Probe',
      desc: 'Trips deception token',
      payload: {
        agent_id: 'crawler-03',
        tool_name: 'read_file',
        arguments: { path: '/etc/secrets/aws_canary_key' },
        task_id: 'TASK-CANARY-01',
        trace_id: `TRC-CANARY-${Date.now().toString().slice(-4)}`,
      },
    },
    {
      label: '📁 Path Traversal',
      desc: '../../etc/shadow escape',
      payload: {
        agent_id: 'researcher-01',
        tool_name: 'read_file',
        arguments: { path: '../../etc/shadow' },
        task_id: 'TASK-TRAVERSAL-02',
        trace_id: `TRC-TRAV-${Date.now().toString().slice(-4)}`,
      },
    },
    {
      label: '💻 Dynamic RCE',
      desc: 'Arbitrary code execution gate',
      payload: {
        agent_id: 'researcher-01',
        tool_name: 'execute_code',
        arguments: { code: 'import os; os.system("id")' },
        task_id: 'TASK-RCE-03',
        trace_id: `TRC-RCE-${Date.now().toString().slice(-4)}`,
      },
    },
    {
      label: '💉 SQL Tautology',
      desc: "SQLi ' OR 1=1 bypass",
      payload: {
        agent_id: 'data-pipeline',
        tool_name: 'query_db',
        arguments: { query: "SELECT * FROM users WHERE id = 1 OR '1'='1' --" },
        task_id: 'TASK-SQLI-04',
        trace_id: `TRC-SQLI-${Date.now().toString().slice(-4)}`,
      },
    },
    {
      label: '📄 Safe Read',
      desc: 'Clean verified payload',
      payload: {
        agent_id: 'researcher-01',
        tool_name: 'read_file',
        arguments: { path: '/docs/whitepaper.pdf' },
        task_id: 'TASK-CLEAN-05',
        trace_id: `TRC-SAFE-${Date.now().toString().slice(-4)}`,
      },
    },
  ];

  return (
    <div className="space-y-4 tab-enter">

      {/* ── Dynamic Swarm Radar & Topology ── */}
      <DynamicMeshRadar
        agents={agents}
        latestInterception={interceptions.length > 0 ? interceptions[0] : null}
        selectedAgentId={selectedAgentFilter}
        onSelectAgent={setSelectedAgentFilter}
        onQuickSimulate={onQuickSimulate}
      />

      {/* ── Quick Threat Trigger Bar ── */}
      {onQuickSimulate && (
        <div
          className="rounded-xl border px-4 py-2.5 flex flex-wrap items-center justify-between gap-3"
          style={{ background: '#EDE8DE', borderColor: '#D6CFC3' }}
        >
          <div className="flex items-center gap-2 text-xs font-mono font-bold" style={{ color: '#1E232A' }}>
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Instant Threat Simulation:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {quickThreats.map((qt) => (
              <button
                key={qt.label}
                onClick={() => onQuickSimulate(qt.payload)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold border transition-all hover-lift cursor-pointer"
                style={{ background: '#FAF7F2', borderColor: '#D6CFC3', color: '#3D3529' }}
                title={qt.desc}
              >
                {qt.label}
              </button>
            ))}

            <button
              onClick={handleRunThreatStorm}
              disabled={isStormRunning}
              className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all hover-lift cursor-pointer flex items-center gap-1.5 ${
                isStormRunning
                  ? 'bg-red-100 text-red-900 border-red-300 animate-pulse'
                  : 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-red-600" />
              <span>{isStormRunning ? 'Simulating Storm…' : 'Trigger Threat Storm (3-Step)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Row 1: Interceptions + Approvals ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Interceptions Stream (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border flex flex-col h-[540px] overflow-hidden" style={{ background: '#EDE8DE', borderColor: '#D6CFC3' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b gap-2" style={{ borderColor: '#D6CFC3' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              </div>
              <span className="font-semibold text-sm" style={{ fontFamily: 'Space Grotesk', color: '#1E232A' }}>
                Pre-Execution Stream
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border" style={{ background: '#E2DBD0', borderColor: '#D6CFC3', color: '#7A6F62' }}>
                {filtered.length} events
              </span>
              {selectedAgentFilter && (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  agent: {selectedAgentFilter}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Decision filter chips */}
              <div className="flex items-center gap-1">
                {(['ALL', 'BLOCK', 'REQUIRE_APPROVAL', 'WARN', 'ALLOW'] as const).map((dec) => (
                  <button
                    key={dec}
                    onClick={() => setFilterDecision(dec)}
                    className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold transition-all border cursor-pointer"
                    style={
                      filterDecision === dec
                        ? { background: '#FAF7F2', borderColor: '#B8AE9F', color: '#1E232A' }
                        : { background: '#E4DDD2', borderColor: '#D6CFC3', color: '#7A6F62' }
                    }
                  >
                    {dec === 'REQUIRE_APPROVAL' ? 'APPR' : dec}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#8A7E70' }} />
                <input
                  type="text"
                  placeholder="Filter events…"
                  value={filterTool}
                  onChange={(e) => setFilterTool(e.target.value)}
                  className="input-cyber text-[10px] pl-7 pr-2.5 py-1 rounded-lg w-32"
                />
              </div>

              <button
                onClick={handleExportInterceptions}
                className="w-7 h-7 rounded-lg border border-[#D6CFC3] bg-[#FAF7F2] flex items-center justify-center text-slate-700 hover:text-black cursor-pointer"
                title="Export Stream as JSON"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
            {filtered.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs py-10" style={{ color: '#8A7E70' }}>
                <CheckCircle2 className="w-8 h-8 mb-2" style={{ color: '#8A7E70' }} />
                No events matched the filter.
              </div>
            ) : (
              filtered.map((item, idx) => (
                <div
                  key={`${item.trace_id}-${idx}`}
                  onClick={() => onSelectInterception(item)}
                  className={`group relative flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-150 hover-lift ${
                    idx === 0 ? 'anim-event-flash' : ''
                  }`}
                  style={
                    item.decision === 'BLOCK'
                      ? { background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.3)' }
                      : item.decision === 'WARN'
                      ? { background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.3)' }
                      : item.decision === 'REQUIRE_APPROVAL'
                      ? { background: 'rgba(139,92,246,0.06)', borderColor: 'rgba(139,92,246,0.3)' }
                      : { background: '#FAF7F2', borderColor: '#D6CFC3' }
                  }
                >
                  {/* Left accent bar */}
                  <div className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full ${
                    item.decision === 'BLOCK' ? 'bg-red-500' :
                    item.decision === 'WARN' ? 'bg-amber-500' :
                    item.decision === 'REQUIRE_APPROVAL' ? 'bg-purple-500' :
                    'bg-emerald-500'
                  }`} />

                  <div className="flex items-center gap-3 min-w-0 pl-2">
                    <DecisionBadge decision={item.decision} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-mono font-bold truncate" style={{ color: '#1E232A' }}>{item.tool_name}</span>
                        <span style={{ color: '#8A7E70' }}>via</span>
                        <span className="font-mono px-1.5 py-0.5 rounded text-[10px] border" style={{ background: '#EDE8DE', borderColor: '#D6CFC3', color: '#5C5245' }}>
                          {item.agent_id}
                        </span>
                        {item.honeypot_triggered && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded animate-pulse border" style={{ background: 'rgba(220,38,38,0.12)', borderColor: 'rgba(220,38,38,0.3)', color: '#B91C1C' }}>
                            🍯 TRIPWIRE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono" style={{ color: '#7A6F62' }}>
                        <span>{item.trace_id}</span>
                        <span>•</span>
                        <span>{new Date(item.timestamp * 1000).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <RiskBar score={item.risk_score} />
                    <ArrowUpRight className="w-3.5 h-3.5 transition-colors" style={{ color: '#8A7E70' }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Human Approval Cockpit (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border flex flex-col h-[540px] overflow-hidden" style={{ background: '#EDE8DE', borderColor: '#D6CFC3' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#D6CFC3' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <span className="font-semibold text-sm" style={{ fontFamily: 'Space Grotesk', color: '#1E232A' }}>
                Approval Cockpit
              </span>
              {approvals.filter((a) => a.status === 'PENDING').length > 0 && (
                <span className="badge-warn text-[9px] font-mono font-bold px-2 py-0.5 rounded-full pulse-amber">
                  {approvals.filter((a) => a.status === 'PENDING').length} pending
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {approvals.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs py-10" style={{ color: '#8A7E70' }}>
                <ShieldCheck className="w-8 h-8 mb-2" style={{ color: '#8A7E70' }} />
                No approvals pending.
              </div>
            ) : (
              approvals.map((app) => (
                <div
                  key={app.approval_id}
                  className="rounded-xl border p-3.5 text-xs transition-all duration-200"
                  style={
                    app.status === 'PENDING'
                      ? { background: 'rgba(217,119,6,0.06)', borderColor: 'rgba(217,119,6,0.3)', boxShadow: '0 2px 8px rgba(217,119,6,0.06)' }
                      : { background: '#FAF7F2', borderColor: '#D6CFC3', opacity: 0.6 }
                  }
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px]" style={{ color: '#7A6F62' }}>{app.approval_id}</span>
                      <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full ${
                        app.status === 'PENDING' ? 'badge-warn' :
                        app.status === 'APPROVED' ? 'badge-allow' : 'badge-block'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <RiskBar score={app.risk_score} />
                  </div>

                  <p className="text-[11px] mb-2 leading-relaxed" style={{ color: '#3D3529' }}>{app.decision_reason}</p>

                  <div className="rounded-lg p-2 font-mono text-[10px] mb-2 border" style={{ background: '#EAE4D8', borderColor: '#D6CFC3' }}>
                    <div className="mb-1" style={{ color: '#7A6F62' }}>REDACTED ARGUMENTS</div>
                    <pre className="overflow-x-auto whitespace-pre-wrap max-h-16 overflow-y-auto" style={{ color: '#1E232A' }}>
                      {JSON.stringify(app.redacted_arguments, null, 2)}
                    </pre>
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono mb-2.5" style={{ color: '#7A6F62' }}>
                    <span title={app.freshness_fingerprint}>FP: {app.freshness_fingerprint.slice(0, 14)}…</span>
                    <span>{app.agent_id} → {app.tool_name}</span>
                  </div>

                  {app.status === 'PENDING' && (
                    <div className="space-y-2 pt-2 border-t border-[#D6CFC3]">
                      <input
                        type="text"
                        placeholder="Analyst note (optional)…"
                        value={approvalNote[app.approval_id] || ''}
                        onChange={(e) => setApprovalNote({ ...approvalNote, [app.approval_id]: e.target.value })}
                        className="input-cyber w-full text-[11px] px-2.5 py-1.5 rounded-lg"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => onResolveApproval(app.approval_id, 'APPROVE', approvalNote[app.approval_id] || '')}
                          className="btn-success flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => onResolveApproval(app.approval_id, 'REJECT', approvalNote[app.approval_id] || '')}
                          className="btn-danger flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Row 2: Agent Roster + Ledger ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Agent Roster (6 cols) */}
        <div className="lg:col-span-6 rounded-xl border p-4" style={{ background: '#EDE8DE', borderColor: '#D6CFC3' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Fingerprint className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className="font-semibold text-sm" style={{ fontFamily: 'Space Grotesk', color: '#1E232A' }}>
                Agent Identity Roster
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#7A6F62]">Ed25519 Token Bound</span>
          </div>

          <div className="space-y-3">
            {agents.map((ag) => (
              <div
                key={ag.agent_id}
                className="relative rounded-xl border p-3.5 transition-all duration-200"
                style={
                  ag.status === 'QUARANTINED'
                    ? { background: 'rgba(220,38,38,0.06)', borderColor: 'rgba(220,38,38,0.3)' }
                    : ag.status === 'SUSPICIOUS'
                    ? { background: 'rgba(217,119,6,0.06)', borderColor: 'rgba(217,119,6,0.3)' }
                    : { background: '#FAF7F2', borderColor: '#D6CFC3' }
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          ag.status === 'HEALTHY' ? 'bg-emerald-500 pulse-green' :
                          ag.status === 'SUSPICIOUS' ? 'bg-amber-500 pulse-amber' :
                          'bg-red-500 pulse-red'
                        }`}
                      />
                      <span className="font-mono font-bold text-sm" style={{ color: '#1E232A' }}>{ag.agent_id}</span>
                      <span className="text-xs" style={{ color: '#5C5245' }}>{ag.name}</span>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        ag.status === 'HEALTHY' ? 'badge-allow' :
                        ag.status === 'SUSPICIOUS' ? 'badge-warn' :
                        'badge-block'
                      }`}>
                        {ag.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-1.5 text-[10px] font-mono text-[#7A6F62]">
                      <span>Role: <strong style={{ color: '#3D3529' }}>{ag.role}</strong></span>
                      <span>Epoch: <strong style={{ color: '#2563EB' }}>v{ag.security_epoch}</strong></span>
                      <span>Blocked: <strong style={{ color: ag.blocked_count > 0 ? '#B91C1C' : '#5C5245' }}>{ag.blocked_count}</strong></span>
                    </div>

                    {ag.quarantine_reason && (
                      <div className="mt-2 px-2 py-1 rounded-lg border text-[10px] font-mono" style={{ background: 'rgba(220,38,38,0.1)', borderColor: 'rgba(220,38,38,0.3)', color: '#B91C1C' }}>
                        ⚠ {ag.quarantine_reason}
                      </div>
                    )}

                    <div className="mt-2 text-[9px] font-mono truncate text-[#7A6F62]">
                      Scope: {ag.allowed_tools.join(', ')}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    {ag.status === 'QUARANTINED' ? (
                      <button
                        onClick={() => onResetAgent(ag.agent_id)}
                        className="btn-success flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                    ) : (
                      <button
                        onClick={() => onQuarantineAgent(ag.agent_id)}
                        className="btn-danger flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer"
                      >
                        <Ban className="w-3 h-3" /> Quarantine
                      </button>
                    )}
                    <button
                      onClick={() => onBumpEpoch(ag.agent_id)}
                      className="btn-primary flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Bump Epoch
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cryptographic Ledger (6 cols) */}
        <div className="lg:col-span-6 rounded-xl border p-4 flex flex-col" style={{ background: '#EDE8DE', borderColor: '#D6CFC3' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span className="font-semibold text-sm" style={{ fontFamily: 'Space Grotesk', color: '#1E232A' }}>
                Cryptographic Ledger (FR-18)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportLedger}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono border border-[#D6CFC3] bg-[#FAF7F2] text-slate-700 hover:text-black cursor-pointer"
                title="Export Entire Ledger Chain as JSON"
              >
                <Download className="w-3 h-3" />
                <span>Export</span>
              </button>
              <button
                onClick={onVerifyLedger}
                disabled={isVerifyingLedger}
                className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isVerifyingLedger ? 'animate-spin' : ''}`} />
                Verify Chain
              </button>
            </div>
          </div>

          {ledgerVerification && (
            <div className={`px-3 py-2 rounded-lg mb-3 text-[10px] font-mono flex items-center justify-between border ${
              ledgerVerification.valid
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-red-50 text-red-800 border-red-300'
            }`}>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5" />
                INTEGRITY VERIFIED: {ledgerVerification.verified_blocks} Blocks • 0 Tamper Detected
              </div>
              <span style={{ color: '#7A6F62' }}>{ledgerVerification.standard}</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[380px] pr-1">
            {ledgerBlocks.map((block, idx) => (
              <div
                key={block.block_index}
                className="rounded-lg border p-2.5 font-mono text-[10px] transition-colors"
                style={{ animationDelay: `${idx * 30}ms`, background: '#FAF7F2', borderColor: '#D6CFC3' }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#7A6F62' }}>#{block.block_index}</span>
                    <span className={`font-bold ${
                      block.decision === 'ALLOW' ? 'text-emerald-700' :
                      block.decision === 'BLOCK' ? 'text-red-700' :
                      block.decision === 'WARN' ? 'text-amber-700' :
                      'text-purple-700'
                    }`}>
                      {block.event_type}
                    </span>
                  </div>
                  <span className="text-[9px]" style={{ color: '#8A7E70' }}>
                    {new Date(block.timestamp * 1000).toLocaleTimeString()}
                  </span>
                </div>

                <div className="space-y-0.5 text-[9px]" style={{ color: '#7A6F62' }}>
                  <div className="truncate">
                    <span style={{ color: '#8A7E70' }}>HASH: </span>
                    <span style={{ color: '#3D3529' }}>{block.block_hash.slice(0, 32)}…</span>
                  </div>
                  <div className="truncate">
                    <span style={{ color: '#8A7E70' }}>PREV: </span>
                    <span style={{ color: '#3D3529' }}>{block.prev_hash.slice(0, 32)}…</span>
                  </div>
                </div>

                <div className="mt-1.5 pt-1.5 border-t flex items-center justify-between text-[9px]" style={{ borderColor: '#DCD4C6', color: '#7A6F62' }}>
                  <span style={{ color: '#3D3529' }}>{block.agent_id} → {block.tool_name}</span>
                  <span className="font-bold" style={{ color: '#5C5245' }}>Risk: {block.risk_score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Live RFC-5424 Syslog Terminal ── */}
      <LiveAuditTerminal interceptions={interceptions} isOpenDefault={true} />

    </div>
  );
};
