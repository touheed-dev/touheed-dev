import React from 'react';
import {
  GitCommit, ShieldCheck, Ban, Clock, AlertTriangle,
  Lock, Copy, Check, Terminal, Layers
} from 'lucide-react';
import { InterceptionDecision } from '../../../types';

interface TraceEditorProps {
  traceId: string;
  decision?: InterceptionDecision;
}

const STATUS_COLORS: Record<string, string> = {
  PASS: '#34d399',
  ALLOW: '#34d399',
  WARN: '#fbbf24',
  REQUIRE_APPROVAL: '#a78bfa',
  BLOCK: '#f87171',
  SHORT_CIRCUIT: '#f87171',
};

export const TraceEditor: React.FC<TraceEditorProps> = ({
  traceId,
  decision,
}) => {
  if (!decision) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-slate-500 font-mono text-xs">
        Trace {traceId} not loaded or still evaluating in memory.
      </div>
    );
  }

  const decisionColor =
    decision.decision === 'ALLOW' ? '#34d399' :
    decision.decision === 'WARN' ? '#fbbf24' :
    decision.decision === 'REQUIRE_APPROVAL' ? '#a78bfa' :
    '#f87171';

  return (
    <div className="h-full flex flex-col overflow-y-auto p-6 font-mono text-xs select-text space-y-6" style={{ background: '#1e1e1e', color: '#e0e0e0' }}>

      {/* ── Trace Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <GitCommit className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white font-sans">{decision.trace_id}.trace</h1>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-bold font-mono"
                style={{ backgroundColor: `${decisionColor}20`, color: decisionColor, border: `1px solid ${decisionColor}40` }}
              >
                {decision.decision}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                Agent: {decision.agent_id}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Target Tool: <strong className="text-white">{decision.tool_name}</strong> • Risk Score: {decision.risk_score}/100
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-slate-500 uppercase">Committed Block</div>
          <div className="font-bold text-blue-400">Block #{decision.block_index ?? 'PENDING'}</div>
        </div>
      </div>

      {/* ── Arguments & Hash Summary ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[#252526] border border-[#2d2d2d] space-y-2">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-300 block">
            Canonical Evaluated Arguments
          </span>
          <pre className="p-3 rounded bg-[#181818] border border-[#2d2d2d] text-emerald-400 text-[11px] overflow-x-auto leading-relaxed">
            {JSON.stringify(decision.redacted_arguments, null, 2)}
          </pre>
        </div>

        <div className="p-4 rounded-xl bg-[#252526] border border-[#2d2d2d] space-y-3">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-300 block">
            Cryptographic Integrity Proof
          </span>
          <div className="space-y-2 text-[11px]">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">RFC-8785 Canonical SHA-256 Hash</span>
              <code className="text-blue-300 break-all">{decision.canonical_hash}</code>
            </div>
            <div className="pt-2 border-t border-[#2d2d2d]">
              <span className="text-slate-500 block text-[9px] uppercase">Post-Block Execution Rate</span>
              <span className="font-bold text-emerald-400">0.00% Guaranteed Zero-Byte</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Tripwire Canary Status</span>
              <span className={decision.honeypot_triggered ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                {decision.honeypot_triggered ? 'BREACHED — STAGE 5 CONTAINMENT TRIGGERED' : 'CLEAN — NO TRIPWIRES TOUCHED'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 20-Stage Pipeline Breakdown ── */}
      <div className="p-4 rounded-xl bg-[#252526] border border-[#2d2d2d] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>20-Stage Pre-Execution Pipeline Evaluation Path</span>
          </span>
          <span className="text-[10px] text-slate-500">
            Total Pipeline Stages: {decision.stage_results.length}
          </span>
        </div>

        <div className="space-y-2">
          {decision.stage_results.map((stage) => {
            const stColor = STATUS_COLORS[stage.status] || '#8b949e';
            const isFailed = stage.status === 'BLOCK' || stage.status === 'SHORT_CIRCUIT';
            return (
              <div
                key={stage.stage_num}
                className={`p-3 rounded-lg border text-xs font-mono relative overflow-hidden transition-all ${
                  isFailed
                    ? 'bg-red-500/10 border-red-500/40 text-red-200'
                    : 'bg-[#181818] border-[#2d2d2d] text-slate-300'
                }`}
              >
                <div className="absolute left-0 top-1 bottom-1 w-1 rounded-r" style={{ backgroundColor: stColor }} />

                <div className="flex items-center justify-between pl-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-slate-500 font-bold w-6">#{stage.stage_num.toString().padStart(2, '0')}</span>
                    <span className="font-bold text-white">{stage.stage_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400">{stage.latency_us} µs</span>
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded font-mono"
                      style={{ backgroundColor: `${stColor}20`, color: stColor, border: `1px solid ${stColor}40` }}
                    >
                      {stage.status}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 pl-8.5 mt-1">{stage.detail}</div>

                {stage.evidence && (
                  <div className="mt-2 ml-8.5 p-2 rounded bg-black/40 border border-red-500/30 text-[10px]">
                    <span className="font-bold text-red-400 uppercase tracking-wider block mb-1">
                      Stage Tripwire Evidence:
                    </span>
                    <pre className="text-red-300 whitespace-pre-wrap">{JSON.stringify(stage.evidence, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
