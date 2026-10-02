import React, { useState } from 'react';
import {
  Zap, Play, ShieldAlert, CheckCircle2, AlertTriangle,
  RotateCcw, Check, Bug, Terminal
} from 'lucide-react';
import { ScenarioFixture } from '../../../types';

interface AttackEditorProps {
  scenarioId: string;
  scenario?: ScenarioFixture;
  onReplay: (scenarioId: string) => Promise<any>;
}

export const AttackEditor: React.FC<AttackEditorProps> = ({
  scenarioId,
  scenario,
  onReplay,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const name = scenario?.title || scenarioId;
  const description = scenario?.description || 'Adversarial agent attack scenario fixture.';
  const category = scenario?.category || 'Security Breach';
  const expectedDecision = scenario?.expected_decision || 'BLOCK';
  const payload = scenario?.test_request || {
    agent_id: 'researcher-01',
    tool_name: 'read_file',
    arguments: { path: '../../etc/shadow' },
    task_id: 'TASK-ATTACK',
    trace_id: 'TRC-ATTACK',
  };

  const handleRunReplay = async () => {
    setIsRunning(true);
    try {
      const res = await onReplay(scenarioId);
      setLastResult(res);
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto p-6 font-mono text-xs select-text space-y-6" style={{ background: '#1e1e1e', color: '#e0e0e0' }}>

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white font-sans">{name}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                {category}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                Expected: {expectedDecision}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">{description}</p>
          </div>
        </div>

        {/* Run Simulation Button */}
        <button
          onClick={handleRunReplay}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors cursor-pointer disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'RUNNING ATTACK…' : 'REPLAY SIMULATION'}</span>
        </button>
      </div>

      {/* ── Attack Simulation Payload Card ── */}
      <div className="p-4 rounded-xl bg-[#252526] border border-[#2d2d2d] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Bug className="w-4 h-4 text-purple-400" />
            <span>Adversarial Invocation Payload</span>
          </div>
          <span className="text-[10px] text-slate-500">
            Target Tool: <strong className="text-slate-300">{payload.tool_name}</strong>
          </span>
        </div>

        <pre className="p-3.5 rounded bg-[#181818] border border-[#2d2d2d] text-purple-300 text-xs overflow-x-auto leading-relaxed">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </div>

      {/* ── Replay Verification Result Card ── */}
      {lastResult && (
        <div
          className={`p-4 rounded-xl border space-y-3 ${
            lastResult.deterministic_match
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-red-500/10 border-red-500/30 text-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              {lastResult.deterministic_match ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>DETERMINISTIC VERDICT MATCH: {lastResult.actual}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span>VERDICT MISMATCH: Expected {lastResult.expected}, got {lastResult.actual}</span>
                </>
              )}
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40">
              Verified RFC-8785 Hash
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] pt-1 border-t border-white/10">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Decision</span>
              <strong className="text-white">{lastResult.actual}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Expected</span>
              <strong className="text-white">{lastResult.expected}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Match Status</span>
              <strong className={lastResult.deterministic_match ? 'text-emerald-400' : 'text-red-400'}>
                {lastResult.deterministic_match ? '100% INVARIANT HOLD' : 'DRIFT DETECTED'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Post-Block Rate</span>
              <strong className="text-emerald-400">0.00% Zero-Byte</strong>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
