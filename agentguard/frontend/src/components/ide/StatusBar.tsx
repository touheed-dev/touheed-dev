import React from 'react';
import {
  GitBranch, Radio, Shield, Lock, AlertCircle,
  AlertTriangle, Database, CheckCircle2, BookOpen
} from 'lucide-react';

interface StatusBarProps {
  ledgerHeight: number;
  isConnected: boolean;
  blockedCount: number;
  warnCount: number;
  activePoliciesCount: number;
  onOpenSpecs: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  ledgerHeight,
  isConnected,
  blockedCount,
  warnCount,
  activePoliciesCount,
  onOpenSpecs,
}) => {
  return (
    <footer
      className="h-6 border-t flex items-center justify-between px-3 text-[11px] font-mono select-none z-30 shrink-0"
      style={{
        background: '#111111',
        borderColor: '#242424',
        color: '#8b949e',
      }}
    >
      {/* ── Left Status Items ── */}
      <div className="flex items-center gap-4">
        {/* Branch / Workspace */}
        <div className="flex items-center gap-1 text-slate-300">
          <GitBranch className="w-3 h-3 text-blue-400" />
          <span>main*</span>
        </div>

        {/* Ledger Height */}
        <div className="flex items-center gap-1">
          <Database className="w-3 h-3 text-purple-400" />
          <span>LEDGER #{ledgerHeight}</span>
        </div>

        {/* Errors / Warnings */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-red-400 font-bold">
            <AlertCircle className="w-3 h-3" />
            {blockedCount}
          </span>
          <span className="flex items-center gap-1 text-amber-400 font-bold">
            <AlertTriangle className="w-3 h-3" />
            {warnCount}
          </span>
        </div>

        {/* Fail-Closed Indicator */}
        <div className="hidden sm:flex items-center gap-1 text-emerald-400">
          <Lock className="w-2.5 h-2.5" />
          <span>FAIL-CLOSED: 100%</span>
        </div>
      </div>

      {/* ── Right Status Items ── */}
      <div className="flex items-center gap-4">
        {/* Active Policies */}
        <span className="hidden md:inline text-slate-400">
          CEL: {activePoliciesCount} Rules Active
        </span>

        {/* Specs Modal Button */}
        <button
          onClick={onOpenSpecs}
          className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Open Architecture & Threat Model Specs"
        >
          <BookOpen className="w-3 h-3 text-emerald-400" />
          <span>Architecture Specs</span>
        </button>

        {/* WebSocket Connection status */}
        <div className="flex items-center gap-1.5 font-bold">
          <span
            className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 pulse-green-glow' : 'bg-red-400'}`}
          />
          <span className={isConnected ? 'text-emerald-400' : 'text-red-400'}>
            {isConnected ? 'WS LIVE' : 'DISCONNECTED'}
          </span>
        </div>

        {/* Invariant guarantee */}
        <span className="text-[10px] text-emerald-400 font-bold">
          POST-BLOCK: 0.00%
        </span>
      </div>
    </footer>
  );
};
