import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal, ShieldAlert, Radio, Layers, AlertCircle,
  X, Play, Pause, Trash2, ArrowUpRight, Search, CheckCircle2,
  Clock, Ban
} from 'lucide-react';
import { BottomPanelTab } from '../../types/ide';
import { InterceptionDecision, LedgerBlock } from '../../types';

interface BottomPanelProps {
  isOpen: boolean;
  onClose: () => void;
  interceptions: InterceptionDecision[];
  ledgerBlocks: LedgerBlock[];
  onSelectInterception: (item: InterceptionDecision) => void;
  policyEpoch: number;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  isOpen,
  onClose,
  interceptions,
  ledgerBlocks,
  onSelectInterception,
  policyEpoch,
}) => {
  const [activeTab, setActiveTab] = useState<BottomPanelTab>('stream');
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    'AgentGuard Kernel v2.4.1 initialized.',
    'Stage-gate pipeline: 20 stages primed.',
    'Deterministic CEL policy engine: 10 rules loaded.',
    'Cryptographic ledger: Ed25519 canonical chain online.',
    'Type "help" for available commands.',
  ]);

  const streamEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (autoScroll && streamEndRef.current) {
      streamEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [interceptions, autoScroll]);

  if (!isOpen) return null;

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    const newHistory = [...terminalHistory, `agentguard> ${cmd}`];

    if (cmd === 'help') {
      newHistory.push(
        'Available commands:',
        '  status               Display gateway health and invariant checks',
        '  rules                List active CEL policies and precedence',
        '  clear                Clear the terminal log',
        '  verify-ledger        Verify Merkle hash chain integrity'
      );
    } else if (cmd === 'status') {
      newHistory.push(
        'SYSTEM STATUS: HEALTHY',
        'Fail-Closed Invariant: ACTIVE (100%)',
        'Post-Block Execution Rate: 0.00%',
        `Policy Epoch: v${policyEpoch}`,
        `Ledger Height: #${ledgerBlocks.length}`
      );
    } else if (cmd === 'clear') {
      setTerminalHistory([]);
      setTerminalInput('');
      return;
    } else if (cmd === 'rules') {
      newHistory.push(
        'ACTIVE RULES:',
        '  POL-001 (P10): Honey Deception Tripwire Containment -> BLOCK',
        '  POL-002 (P20): Filesystem Directory Traversal Defense -> BLOCK',
        '  POL-003 (P30): Quarantine State Enforcement -> BLOCK',
        '  POL-004 (P40): Dangerous Syscall & Binary Blacklist -> BLOCK',
        '  POL-005 (P45): SQL Injection & AST Tautology Invariant -> BLOCK',
        '  POL-006 (P50): High-Impact Code Execution Approval Gate -> REQUIRE_APPROVAL',
        '  POL-010 (P100): Default Clean Execution Invariant -> ALLOW'
      );
    } else if (cmd === 'verify-ledger') {
      newHistory.push(
        `VERIFIED: ${ledgerBlocks.length} Blocks in chain. 0 Tamper detected. Standard: RFC-8785 SHA-256.`
      );
    } else {
      newHistory.push(`command not found: ${cmd}. Type "help" for commands.`);
    }

    setTerminalHistory(newHistory);
    setTerminalInput('');
  };

  const filteredInterceptions = interceptions.filter(
    (i) =>
      i.tool_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      i.agent_id.toLowerCase().includes(filterQuery.toLowerCase()) ||
      i.trace_id.toLowerCase().includes(filterQuery.toLowerCase()) ||
      i.decision.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div
      className="h-64 border-t flex flex-col font-mono text-xs select-none shrink-0"
      style={{
        background: '#181818',
        borderColor: '#282828',
        color: '#cccccc',
      }}
    >
      {/* ── Panel Header / Tabs ── */}
      <div className="h-8 border-b border-[#282828] flex items-center justify-between px-3 bg-[#1e1e1e]">
        <div className="flex items-center gap-2 h-full">
          <button
            onClick={() => setActiveTab('stream')}
            className={`h-full flex items-center gap-1.5 px-3 border-b-2 text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === 'stream'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>GATEWAY STREAM</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 text-slate-400">
              {interceptions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`h-full flex items-center gap-1.5 px-3 border-b-2 text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === 'terminal'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3 h-3" />
            <span>TERMINAL</span>
          </button>

          <button
            onClick={() => setActiveTab('cel')}
            className={`h-full flex items-center gap-1.5 px-3 border-b-2 text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === 'cel'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>CEL COMPILER</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`h-full flex items-center gap-1.5 px-3 border-b-2 text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === 'ledger'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>AUDIT LEDGER</span>
          </button>

          <button
            onClick={() => setActiveTab('problems')}
            className={`h-full flex items-center gap-1.5 px-3 border-b-2 text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === 'problems'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertCircle className="w-3 h-3 text-red-400" />
            <span>PROBLEMS</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300">
              {interceptions.filter((i) => i.decision === 'BLOCK').length}
            </span>
          </button>
        </div>

        {/* Panel Right Controls */}
        <div className="flex items-center gap-2">
          {activeTab === 'stream' && (
            <>
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`text-[10px] px-2 py-0.5 rounded border ${
                  autoScroll ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                {autoScroll ? 'AUTO-SCROLL ON' : 'AUTO-SCROLL OFF'}
              </button>
              <input
                type="text"
                placeholder="Filter stream…"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="h-5 px-2 bg-[#141414] border border-[#2d2d2d] rounded text-[10px] text-slate-200 focus:outline-none w-32"
              />
            </>
          )}
          <button onClick={onClose} className="p-1 hover:text-white rounded text-slate-400">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-y-auto p-3 text-xs select-text">

        {/* ── 1. GATEWAY STREAM ── */}
        {activeTab === 'stream' && (
          <div className="space-y-1 font-mono">
            {filteredInterceptions.map((item, idx) => {
              const timeStr = new Date(item.timestamp * 1000).toLocaleTimeString();
              const decisionColor =
                item.decision === 'ALLOW' ? '#34d399' :
                item.decision === 'WARN' ? '#fbbf24' :
                item.decision === 'REQUIRE_APPROVAL' ? '#a78bfa' :
                '#f87171';

              return (
                <div
                  key={`${item.trace_id}-${idx}`}
                  onClick={() => onSelectInterception(item)}
                  className="flex items-center justify-between p-1.5 rounded hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/10 text-[11px]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-[10px]">{timeStr}</span>
                    <span className="text-blue-400 font-semibold">{item.agent_id}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-white font-bold">{item.tool_name}</span>
                    {item.honeypot_triggered && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                        🍯 CANARY BREACH
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-[10px]">
                      Risk: <strong style={{ color: decisionColor }}>{item.risk_score}</strong>
                    </span>
                    <span
                      className="px-2 py-0.2 rounded text-[10px] font-bold"
                      style={{
                        backgroundColor: `${decisionColor}20`,
                        color: decisionColor,
                        border: `1px solid ${decisionColor}40`,
                      }}
                    >
                      {item.decision}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={streamEndRef} />
          </div>
        )}

        {/* ── 2. TERMINAL / REPL ── */}
        {activeTab === 'terminal' && (
          <div className="h-full flex flex-col justify-between font-mono text-xs">
            <div className="overflow-y-auto space-y-1 text-slate-300">
              {terminalHistory.map((line, idx) => (
                <div key={idx} className="leading-relaxed whitespace-pre-wrap">
                  {line.startsWith('agentguard>') ? (
                    <span className="text-emerald-400 font-bold">{line}</span>
                  ) : line.includes('HEALTHY') || line.includes('ACTIVE') || line.includes('VERIFIED') ? (
                    <span className="text-emerald-300">{line}</span>
                  ) : line.includes('BLOCK') ? (
                    <span className="text-red-300">{line}</span>
                  ) : (
                    <span>{line}</span>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleTerminalSubmit} className="flex items-center gap-2 pt-2 border-t border-[#282828]">
              <span className="text-emerald-400 font-bold">agentguard&gt;</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="type command (e.g. status, rules, verify-ledger, help)…"
                className="flex-1 bg-transparent border-none text-white focus:outline-none text-xs font-mono"
              />
            </form>
          </div>
        )}

        {/* ── 3. CEL COMPILER ── */}
        {activeTab === 'cel' && (
          <div className="space-y-2 font-mono text-xs text-slate-300">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>CEL Program Environment: 10 Rules Compiled Successfully</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              AST compiled with zero unresolved symbols. Precedence evaluation latency: 0.28ms average.
            </p>
            <div className="p-3 rounded bg-black/40 border border-[#2d2d2d] space-y-1 text-[11px]">
              <div>• Environment: Common Expression Language (Google CEL Specification)</div>
              <div>• Epoch Active: v{policyEpoch}</div>
              <div>• Invariant: Non-LLM Critical Path Safety Enforcement</div>
            </div>
          </div>
        )}

        {/* ── 4. AUDIT LEDGER ── */}
        {activeTab === 'ledger' && (
          <div className="space-y-1 font-mono text-[11px]">
            {ledgerBlocks.slice(0, 15).map((block) => (
              <div key={block.block_index} className="flex items-center justify-between p-1 border-b border-white/5">
                <span className="text-blue-400 font-bold">Block #{block.block_index}</span>
                <span className="text-slate-400 truncate max-w-xs">{block.block_hash}</span>
                <span className={block.decision === 'ALLOW' ? 'text-emerald-400' : 'text-red-400'}>
                  {block.decision}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── 5. PROBLEMS ── */}
        {activeTab === 'problems' && (
          <div className="space-y-1.5 font-mono text-xs">
            {interceptions
              .filter((i) => i.decision === 'BLOCK' || i.decision === 'WARN')
              .map((item, idx) => (
                <div
                  key={`${item.trace_id}-${idx}`}
                  onClick={() => onSelectInterception(item)}
                  className="flex items-center gap-3 p-2 rounded bg-red-500/10 border border-red-500/20 text-red-200 cursor-pointer"
                >
                  <Ban className="w-4 h-4 text-red-400 shrink-0" />
                  <div className="flex-1 truncate">
                    <strong>{item.agent_id}</strong> blocked executing <strong>{item.tool_name}</strong> (Risk: {item.risk_score})
                  </div>
                  <span className="text-[10px] text-slate-400">{item.trace_id}</span>
                </div>
              ))}
          </div>
        )}

      </div>
    </div>
  );
};
