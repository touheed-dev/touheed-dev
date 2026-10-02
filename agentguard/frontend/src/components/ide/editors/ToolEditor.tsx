import React, { useState } from 'react';
import {
  Wrench, ShieldAlert, CheckCircle2, AlertTriangle, Key,
  Lock, Play, Copy, Check, Terminal
} from 'lucide-react';
import { ToolDefinition } from '../../../types/ide';

interface ToolEditorProps {
  toolName: string;
  tool?: ToolDefinition;
  onSimulateTool?: (toolName: string, args: Record<string, any>) => void;
}

export const ToolEditor: React.FC<ToolEditorProps> = ({
  toolName,
  tool,
  onSimulateTool,
}) => {
  const [testArgs, setTestArgs] = useState<string>('{\n  "path": "/sandbox/public.txt"\n}');
  const [copied, setCopied] = useState(false);

  const category = tool?.category || 'General Capability';
  const riskLevel = tool?.risk_level || 'MEDIUM';
  const description = tool?.description || 'Agent runtime capability tool interface.';
  const requiresApproval = tool?.requires_approval ?? false;
  const isSensitive = tool?.is_sensitive ?? false;
  const canaryMonitored = tool?.canary_monitored ?? false;
  const allowedRoles = tool?.allowed_roles || ['researcher', 'analyst', 'coder'];
  const schema = tool?.schema || { query: 'string' };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulate = () => {
    if (!onSimulateTool) return;
    try {
      const parsed = JSON.parse(testArgs);
      onSimulateTool(toolName, parsed);
    } catch (e) {
      alert('Invalid JSON in arguments');
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto p-6 font-mono text-xs select-text space-y-6" style={{ background: '#1e1e1e', color: '#e0e0e0' }}>

      {/* ── Top Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white font-sans">{toolName}.tool</h1>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  riskLevel === 'SAFE'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : riskLevel === 'CRITICAL'
                    ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                RISK: {riskLevel}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                {category}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">{description}</p>
          </div>
        </div>

        {/* Quick Test Button */}
        {onSimulateTool && (
          <button
            onClick={handleSimulate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Test Invocator</span>
          </button>
        )}
      </div>

      {/* ── Security Profile Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-[#252526] border border-[#2d2d2d] space-y-1">
          <span className="text-[10px] uppercase text-slate-400">Human Dual-Key Sign-off</span>
          <div className="text-sm font-bold font-sans flex items-center gap-1.5 text-white">
            {requiresApproval ? (
              <span className="text-purple-400">REQUIRED (Stage 15 Gate)</span>
            ) : (
              <span className="text-slate-400">Not Mandatory</span>
            )}
          </div>
          <p className="text-[10px] text-slate-500">Dual-key cryptographic sign-off</p>
        </div>

        <div className="p-3 rounded-lg bg-[#252526] border border-[#2d2d2d] space-y-1">
          <span className="text-[10px] uppercase text-slate-400">Deception Canary Tripwire</span>
          <div className="text-sm font-bold font-sans flex items-center gap-1.5 text-white">
            {canaryMonitored ? (
              <span className="text-red-400">ARMED (Stage 5 Tripwire)</span>
            ) : (
              <span className="text-slate-400">Unmonitored</span>
            )}
          </div>
          <p className="text-[10px] text-slate-500">Short-circuits quarantine within &lt; 1ms</p>
        </div>

        <div className="p-3 rounded-lg bg-[#252526] border border-[#2d2d2d] space-y-1">
          <span className="text-[10px] uppercase text-slate-400">MicroVM Isolation Level</span>
          <div className="text-sm font-bold font-sans text-emerald-400">
            gVisor Sandbox Isolated
          </div>
          <p className="text-[10px] text-slate-500">Egress filter & PID namespace locked</p>
        </div>
      </div>

      {/* ── Schema and Test Invocator ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Schema */}
        <div className="p-4 rounded-xl bg-[#252526] border border-[#2d2d2d] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
              Parameter Schema Definition
            </span>
            <button
              onClick={handleCopySchema}
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 rounded bg-[#181818] border border-[#2d2d2d] text-emerald-400 text-[11px] overflow-x-auto leading-relaxed">
            {JSON.stringify(schema, null, 2)}
          </pre>
        </div>

        {/* Test Payload */}
        <div className="p-4 rounded-xl bg-[#252526] border border-[#2d2d2d] space-y-2">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-300 block">
            Test Invocation Payload (JSON)
          </span>
          <textarea
            rows={6}
            value={testArgs}
            onChange={(e) => setTestArgs(e.target.value)}
            className="w-full p-2.5 rounded bg-[#181818] border border-[#2d2d2d] text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* ── Allowed Roles ── */}
      <div className="p-4 rounded-xl bg-[#252526] border border-[#2d2d2d] space-y-2">
        <span className="text-xs uppercase font-bold tracking-wider text-slate-300 block">
          Authorized Principal Roles
        </span>
        <div className="flex flex-wrap gap-2 pt-1">
          {allowedRoles.map((r) => (
            <span key={r} className="px-2.5 py-1 rounded bg-[#181818] border border-[#2d2d2d] text-slate-300 font-semibold text-[11px]">
              {r}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
};
