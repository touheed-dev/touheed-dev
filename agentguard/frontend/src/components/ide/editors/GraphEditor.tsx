import React from 'react';
import { Network, Bot, Shield, Wrench, ShieldCheck, Zap } from 'lucide-react';
import { AgentRecord } from '../../../types';

interface GraphEditorProps {
  agents: AgentRecord[];
}

export const GraphEditor: React.FC<GraphEditorProps> = ({ agents }) => {
  return (
    <div className="h-full flex flex-col p-6 font-mono text-xs select-text overflow-y-auto space-y-6" style={{ background: '#1e1e1e', color: '#e0e0e0' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-4 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <Network className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white font-sans">Mesh Topology Canvas</h1>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Live zero-trust boundary graph between Autonomous Agents, the Gateway, and Capability Tools.
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          Zero-Trust Boundary: ARMED
        </span>
      </div>

      {/* ── Visual Flow Diagram ── */}
      <div className="p-8 rounded-2xl bg-[#161616] border border-[#2d2d2d] flex flex-col items-center justify-center min-h-[440px] space-y-8 relative overflow-hidden">

        {/* Level 1: Agents */}
        <div className="flex flex-wrap items-center justify-center gap-6 z-10">
          {agents.map((ag) => (
            <div
              key={ag.agent_id}
              className={`p-3 rounded-xl border flex items-center gap-3 min-w-[180px] shadow-lg ${
                ag.status === 'HEALTHY'
                  ? 'bg-[#252526] border-[#388bfd]/50 text-white'
                  : ag.status === 'QUARANTINED'
                  ? 'bg-red-950/40 border-red-500/50 text-red-200'
                  : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
              }`}
            >
              <Bot className="w-5 h-5 text-blue-400" />
              <div>
                <div className="font-bold text-xs">{ag.agent_id}</div>
                <div className="text-[10px] text-slate-400">{ag.role}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Down Arrow / Gateway Interceptor */}
        <div className="flex flex-col items-center gap-2 z-10">
          <div className="w-0.5 h-6 bg-blue-500/60" />
          <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-blue-950/60 to-purple-950/60 border border-emerald-500/40 flex items-center gap-3 shadow-2xl">
            <Shield className="w-6 h-6 text-emerald-400 animate-pulse" />
            <div>
              <div className="font-bold text-sm text-white font-sans">AgentGuard Runtime Gateway</div>
              <div className="text-[10px] text-slate-300">
                20-Stage Pipeline • Fail-Closed Invariant • CEL Precedence Engine
              </div>
            </div>
          </div>
          <div className="w-0.5 h-6 bg-emerald-500/60" />
        </div>

        {/* Level 3: Tools & Policies */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 z-10 w-full max-w-3xl">
          <div className="p-3 rounded-xl bg-[#252526] border border-[#2d2d2d] text-center space-y-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto" />
            <div className="font-bold text-slate-200 text-xs">Deterministic CEL</div>
            <div className="text-[9px] text-slate-400">10 Invariant Rules</div>
          </div>

          <div className="p-3 rounded-xl bg-[#252526] border border-[#2d2d2d] text-center space-y-1">
            <Zap className="w-4 h-4 text-amber-400 mx-auto" />
            <div className="font-bold text-slate-200 text-xs">Canary Tripwires</div>
            <div className="text-[9px] text-slate-400">0.12ms Quarantine</div>
          </div>

          <div className="p-3 rounded-xl bg-[#252526] border border-[#2d2d2d] text-center space-y-1">
            <Wrench className="w-4 h-4 text-blue-400 mx-auto" />
            <div className="font-bold text-slate-200 text-xs">Capability Tools</div>
            <div className="text-[9px] text-slate-400">Sandbox MicroVM</div>
          </div>

          <div className="p-3 rounded-xl bg-[#252526] border border-[#2d2d2d] text-center space-y-1">
            <Shield className="w-4 h-4 text-purple-400 mx-auto" />
            <div className="font-bold text-slate-200 text-xs">RFC-8785 Ledger</div>
            <div className="text-[9px] text-slate-400">Ed25519 Signatures</div>
          </div>
        </div>

      </div>

    </div>
  );
};
