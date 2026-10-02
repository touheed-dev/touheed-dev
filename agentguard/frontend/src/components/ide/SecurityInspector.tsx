import React, { useState } from 'react';
import {
  Shield, X, ShieldAlert, CheckCircle2, Clock, Ban,
  Lock, Copy, Check, Terminal, ExternalLink, RefreshCw
} from 'lucide-react';
import { InterceptionDecision } from '../../types';

interface SecurityInspectorProps {
  decision: InterceptionDecision | null;
  onClose: () => void;
  onQuarantineAgent: (agentId: string) => void;
  onBumpEpoch: (agentId: string) => void;
  onOpenFullTrace: (traceId: string) => void;
}

export const SecurityInspector: React.FC<SecurityInspectorProps> = ({
  decision,
  onClose,
  onQuarantineAgent,
  onBumpEpoch,
  onOpenFullTrace,
}) => {
  const [copied, setCopied] = useState(false);

  if (!decision) {
    return (
      <aside
        className="w-72 border-l flex flex-col h-full p-4 text-xs font-mono select-none"
        style={{ background: '#1e1e1e', borderColor: '#282828', color: '#8b949e' }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#282828] text-slate-300 font-bold">
          <span>SECURITY INSPECTOR</span>
          <button onClick={onClose} className="p-1 hover:text-white rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-slate-500">
          <Shield className="w-8 h-8 text-slate-600 mb-2" />
          <p>No action selected.</p>
          <span className="text-[10px] mt-1 text-slate-600">
            Click any event in the live stream or traces list to inspect zero-trust properties.
          </span>
        </div>
      </aside>
    );
  }

  const decisionColor =
    decision.decision === 'ALLOW' ? '#34d399' :
    decision.decision === 'WARN' ? '#fbbf24' :
    decision.decision === 'REQUIRE_APPROVAL' ? '#a78bfa' :
    '#f87171';

  const handleCopyHash = () => {
    navigator.clipboard.writeText(decision.canonical_hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside
      className="w-80 border-l flex flex-col h-full overflow-y-auto text-xs font-mono select-text shrink-0"
      style={{ background: '#1e1e1e', borderColor: '#282828', color: '#cccccc' }}
    >
      {/* ── Header ── */}
      <div className="h-9 px-3 border-b border-[#282828] flex items-center justify-between bg-[#181818] select-none shrink-0">
        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>Security Inspector</span>
        </span>
        <button onClick={onClose} className="p-1 hover:text-white rounded text-slate-400">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="p-4 space-y-4 flex-1">

        {/* Action Decision Badge Banner */}
        <div
          className="p-3 rounded-lg border flex items-center justify-between"
          style={{
            backgroundColor: `${decisionColor}12`,
            borderColor: `${decisionColor}35`,
          }}
        >
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400">Gateway Verdict</div>
            <div className="text-sm font-bold font-sans" style={{ color: decisionColor }}>
              {decision.decision}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-wider text-slate-400">Risk Score</div>
            <div className="text-sm font-bold font-sans" style={{ color: decisionColor }}>
              {decision.risk_score} <span className="text-[10px] text-slate-500 font-normal">/ 100</span>
            </div>
          </div>
        </div>

        {/* Identity & Scope */}
        <div className="space-y-2 pb-3 border-b border-[#2d2d2d]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Agent & Tool Target
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded bg-[#181818] border border-[#2d2d2d]">
              <span className="text-slate-500 block text-[9px]">AGENT ID</span>
              <strong className="text-slate-200">{decision.agent_id}</strong>
            </div>
            <div className="p-2 rounded bg-[#181818] border border-[#2d2d2d]">
              <span className="text-slate-500 block text-[9px]">TARGET TOOL</span>
              <strong className="text-white">{decision.tool_name}</strong>
            </div>
          </div>
          <div className="p-2 rounded bg-[#181818] border border-[#2d2d2d] text-[11px]">
            <span className="text-slate-500 block text-[9px]">TRACE ID</span>
            <span className="text-blue-400">{decision.trace_id}</span>
          </div>
        </div>

        {/* Invariant & Honeypot Status */}
        <div className="space-y-2 pb-3 border-b border-[#2d2d2d]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Zero-Trust Invariants
          </span>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between p-1.5 rounded bg-black/20">
              <span className="text-slate-400">Post-Block Execution:</span>
              <span className="font-bold text-emerald-400">0.00% Zero-Byte</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-black/20">
              <span className="text-slate-400">Canary Tripwire:</span>
              <span className={decision.honeypot_triggered ? 'font-bold text-red-400' : 'text-emerald-400'}>
                {decision.honeypot_triggered ? 'BREACHED' : 'CLEAN'}
              </span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-black/20">
              <span className="text-slate-400">Circuit Breaker:</span>
              <span className="text-slate-200 font-bold">{decision.circuit_breaker_status}</span>
            </div>
          </div>
        </div>

        {/* Evaluated Payload Arguments */}
        <div className="space-y-1.5 pb-3 border-b border-[#2d2d2d]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Sanitized Request Arguments
          </span>
          <pre className="p-2.5 rounded bg-[#181818] border border-[#2d2d2d] text-emerald-400 text-[10px] overflow-x-auto max-h-36">
            {JSON.stringify(decision.redacted_arguments, null, 2)}
          </pre>
        </div>

        {/* Cryptographic Hash */}
        <div className="space-y-1 pb-3 border-b border-[#2d2d2d]">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>RFC-8785 HASH</span>
            <button onClick={handleCopyHash} className="hover:text-white flex items-center gap-1">
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <code className="text-blue-300 break-all text-[10px] bg-[#181818] p-2 rounded block border border-[#2d2d2d]">
            {decision.canonical_hash}
          </code>
        </div>

        {/* Quick Remediation Controls */}
        <div className="space-y-2 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Analyst Enforcement Actions
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onQuarantineAgent(decision.agent_id)}
              className="py-1.5 px-2 rounded bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 font-bold text-[10px] transition-colors cursor-pointer"
            >
              Quarantine Agent
            </button>
            <button
              onClick={() => onBumpEpoch(decision.agent_id)}
              className="py-1.5 px-2 rounded bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-[10px] transition-colors cursor-pointer"
            >
              Bump Epoch
            </button>
          </div>
          <button
            onClick={() => onOpenFullTrace(decision.trace_id)}
            className="w-full py-1.5 px-2 rounded bg-[#282828] hover:bg-[#333333] border border-[#3c3c3c] text-white font-bold text-[10px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Open Full 20-Stage Trace</span>
          </button>
        </div>

      </div>
    </aside>
  );
};
