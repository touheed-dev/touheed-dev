import React, { useState } from 'react';
import {
  Bot, Shield, Play, Pause, Ban, RotateCcw,
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, KeyRound,
  FileText, Activity, ShieldAlert, Cpu
} from 'lucide-react';
import { AgentRecord } from '../../../types';

interface AgentEditorProps {
  agentId: string;
  agent?: AgentRecord;
  onQuarantine: (agentId: string) => void;
  onReset: (agentId: string) => void;
  onBumpEpoch: (agentId: string) => void;
  onOpenTrace?: (agentId: string) => void;
}

export const AgentEditor: React.FC<AgentEditorProps> = ({
  agentId,
  agent,
  onQuarantine,
  onReset,
  onBumpEpoch,
  onOpenTrace,
}) => {
  const [isPaused, setIsPaused] = useState(false);

  // Extended mock metadata for the agent
  const role = agent?.role || 'Autonomous Mesh Worker';
  const owner = `${agentId.split('-')[0]}@agentguard.ai`;
  const assignedTask =
    agentId === 'researcher-01'
      ? 'Research university AI security papers & compile adversarial prompt vectors.'
      : agentId === 'coder-02'
      ? 'Refactor backend API endpoints, migrate schemas, and run regression tests.'
      : agentId === 'crawler-03'
      ? 'Crawl public documentation sites, parse release notes, and index changelogs.'
      : 'Orchestrate multi-step data pipelines and execute scheduled sync workflows.';

  const allowedTools = agent?.allowed_tools || ['search_documents', 'read_public_file'];
  const forbiddenTools = [
    'read_secrets',
    'send_external_request',
    'execute_code',
    'modify_system_config',
  ].filter((t) => !allowedTools.includes(t));

  const status = agent?.status || 'HEALTHY';
  const securityState =
    status === 'QUARANTINED'
      ? 'COMPROMISED'
      : status === 'SUSPICIOUS'
      ? 'EXPOSED'
      : 'CLEAN';

  const trustScore =
    status === 'QUARANTINED' ? 14 : status === 'SUSPICIOUS' ? 58 : 96;

  const trustColor =
    trustScore >= 80 ? '#34d399' : trustScore >= 50 ? '#fbbf24' : '#f87171';

  return (
    <div className="h-full flex flex-col overflow-y-auto p-6 font-mono text-xs select-text space-y-6" style={{ background: '#1e1e1e', color: '#e0e0e0' }}>

      {/* ── Header Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <Bot className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white font-sans">{agentId}</h1>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  status === 'HEALTHY'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : status === 'QUARANTINED'
                    ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                {status}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                Security State: {securityState}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">{role}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Pause / Resume */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#282828] hover:bg-[#333333] border border-[#3c3c3c] text-slate-200 transition-colors cursor-pointer"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isPaused ? 'RESUME' : 'PAUSE'}</span>
          </button>

          {/* Quarantine / Reset */}
          {status === 'QUARANTINED' ? (
            <button
              onClick={() => onReset(agentId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RECOVER / RESET</span>
            </button>
          ) : (
            <button
              onClick={() => onQuarantine(agentId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 font-bold transition-colors cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>QUARANTINE</span>
            </button>
          )}

          {/* Bump Epoch */}
          <button
            onClick={() => onBumpEpoch(agentId)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 transition-colors cursor-pointer"
            title="Bump Epoch to invalidate compromised credentials"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>BUMP EPOCH (v{agent?.security_epoch ?? 1})</span>
          </button>
        </div>
      </div>

      {/* ── Key Metrics Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-[#252526] border border-[#2d2d2d] space-y-1">
          <div className="text-[10px] uppercase text-slate-400">Trust Score</div>
          <div className="text-xl font-bold font-sans flex items-center gap-2" style={{ color: trustColor }}>
            {trustScore}
            <span className="text-xs text-slate-500 font-normal">/ 100</span>
          </div>
          <div className="w-full bg-[#181818] h-1.5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${trustScore}%`, backgroundColor: trustColor }} />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#252526] border border-[#2d2d2d] space-y-1">
          <div className="text-[10px] uppercase text-slate-400">Active Epoch</div>
          <div className="text-xl font-bold font-sans text-blue-400">
            v{agent?.security_epoch ?? 1}
          </div>
          <div className="text-[10px] text-slate-500">Token freshness verified</div>
        </div>

        <div className="p-3 rounded-lg bg-[#252526] border border-[#2d2d2d] space-y-1">
          <div className="text-[10px] uppercase text-slate-400">Blocked Actions</div>
          <div className="text-xl font-bold font-sans text-red-400">
            {agent?.blocked_count ?? 0}
          </div>
          <div className="text-[10px] text-slate-500">Zero post-block breaches</div>
        </div>

        <div className="p-3 rounded-lg bg-[#252526] border border-[#2d2d2d] space-y-1">
          <div className="text-[10px] uppercase text-slate-400">Risk Threshold Limit</div>
          <div className="text-xl font-bold font-sans text-amber-400">
            50 <span className="text-xs text-slate-500 font-normal">MAX</span>
          </div>
          <div className="text-[10px] text-slate-500">Dual-key approval above 50</div>
        </div>
      </div>

      {/* ── Metadata & Task ── */}
      <div className="p-4 rounded-xl bg-[#252526] border border-[#2d2d2d] space-y-3">
        <h2 className="text-xs uppercase font-bold tracking-wider text-slate-300">
          Agent Identity & Runtime Scope
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Assigned Objective / Task:</span>
            <div className="p-2.5 rounded bg-[#181818] border border-[#2d2d2d] text-slate-200">
              {assignedTask}
            </div>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Authorized Owner / Principal:</span>
            <div className="p-2.5 rounded bg-[#181818] border border-[#2d2d2d] text-slate-200">
              {owner}
            </div>
          </div>
        </div>
      </div>

      {/* ── Allowed vs Forbidden Tools ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Allowed */}
        <div className="p-4 rounded-xl bg-[#252526] border border-[#2d2d2d] space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Allowed Tools ({allowedTools.length})</span>
          </div>
          <div className="space-y-1.5 pt-1">
            {allowedTools.map((tool: string) => (
              <div key={tool} className="flex items-center justify-between p-2 rounded bg-[#181818] border border-[#2d2d2d]">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-slate-200 font-semibold">{tool}</span>
                </div>
                <span className="text-[10px] text-slate-500">AUTHORIZED</span>
              </div>
            ))}
          </div>
        </div>

        {/* Forbidden */}
        <div className="p-4 rounded-xl bg-[#252526] border border-[#2d2d2d] space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
            <XCircle className="w-4 h-4" />
            <span>Forbidden Tools & Boundaries ({forbiddenTools.length})</span>
          </div>
          <div className="space-y-1.5 pt-1">
            {forbiddenTools.map((tool: string) => (
              <div key={tool} className="flex items-center justify-between p-2 rounded bg-red-500/5 border border-red-500/20">
                <div className="flex items-center gap-2">
                  <span className="text-red-400 font-bold">✕</span>
                  <span className="text-slate-300 font-semibold">{tool}</span>
                </div>
                <span className="text-[10px] text-red-400 font-bold">FAIL-CLOSED BLOCK</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quarantine Invariant Notice ── */}
      {status === 'QUARANTINED' && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 space-y-1">
          <div className="flex items-center gap-2 font-bold text-red-400">
            <ShieldAlert className="w-4 h-4" />
            <span>AGENT UNDER ACTIVE STRICT QUARANTINE</span>
          </div>
          <p className="text-xs text-slate-300">
            {agent?.quarantine_reason || 'Deception canary tripwire breach detected. Pre-execution circuit breaker has severed all external tool execution permissions.'}
          </p>
        </div>
      )}

    </div>
  );
};
