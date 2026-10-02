import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Pause, Play, Trash2, Copy, Download, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { InterceptionDecision } from '../types';

interface LiveAuditTerminalProps {
  interceptions: InterceptionDecision[];
  isOpenDefault?: boolean;
}

export const LiveAuditTerminal: React.FC<LiveAuditTerminalProps> = ({
  interceptions,
  isOpenDefault = false,
}) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [displayLogs, setDisplayLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Format decisions into RFC-5424 style log lines
  useEffect(() => {
    if (isPaused) return;

    const lines = [...interceptions].reverse().map((item) => {
      const date = new Date(item.timestamp * 1000).toISOString();
      const statusTag = item.decision === 'BLOCK' ? 'CRIT' : item.decision === 'WARN' ? 'WARN' : 'INFO';
      const shortHash = item.canonical_hash ? item.canonical_hash.slice(0, 16) + '...' : 'uncommitted';
      const canaryFlag = item.honeypot_triggered ? ' [DECEPTION_TRIPWIRE_TRIGGERED]' : '';
      return `[${date}] [${statusTag}] [AGENTGUARD-GW] agent="${item.agent_id}" tool="${item.tool_name}" decision="${item.decision}" risk=${item.risk_score} block_index=${item.block_index ?? 'NA'} hash=${shortHash}${canaryFlag}`;
    });

    setDisplayLogs(lines);
  }, [interceptions, isPaused]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isOpen && !isPaused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayLogs, isOpen, isPaused]);

  const handleCopy = () => {
    navigator.clipboard.writeText(displayLogs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([displayLogs.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agentguard-audit-stream-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setDisplayLogs([]);
  };

  return (
    <div
      className="rounded-xl border overflow-hidden font-mono text-xs shadow-sm transition-all"
      style={{ background: '#EDE8DE', borderColor: '#D6CFC3' }}
    >
      {/* Terminal Header Bar */}
      <div
        className="px-4 py-2.5 flex items-center justify-between border-b cursor-pointer select-none"
        style={{ background: '#E4DDD2', borderColor: '#D6CFC3' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-700" />
          <span className="font-bold text-[11px] text-[#1E232A]">
            Live Syslog / RFC-5424 Audit Terminal
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border" style={{ background: '#FAF7F2', borderColor: '#D6CFC3', color: '#047857' }}>
            {displayLogs.length} entries
          </span>
          {isPaused && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              PAUSED
            </span>
          )}
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 rounded hover:bg-[#FAF7F2] transition-colors text-[#5C5245] hover:text-[#1E232A] cursor-pointer"
            title={isPaused ? 'Resume live log stream' : 'Pause log stream'}
          >
            {isPaused ? <Play className="w-3 h-3 text-emerald-700" /> : <Pause className="w-3 h-3" />}
          </button>
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-[#FAF7F2] transition-colors text-[#5C5245] hover:text-[#1E232A] cursor-pointer"
            title="Copy all logs"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-1 rounded hover:bg-[#FAF7F2] transition-colors text-[#5C5245] hover:text-[#1E232A] cursor-pointer"
            title="Export .log file"
          >
            <Download className="w-3 h-3" />
          </button>
          <button
            onClick={handleClear}
            className="p-1 rounded hover:bg-[#FAF7F2] transition-colors text-[#5C5245] hover:text-red-700 cursor-pointer"
            title="Clear terminal buffer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <div className="h-3 w-px bg-[#D6CFC3] mx-1" />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded hover:bg-[#FAF7F2] transition-colors text-[#5C5245] cursor-pointer"
          >
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Screen */}
      {isOpen && (
        <div
          ref={scrollRef}
          className="h-48 overflow-y-auto p-3 text-[10px] space-y-1 select-text"
          style={{ background: '#1A1D20', color: '#D4D0C8' }}
        >
          {displayLogs.length === 0 ? (
            <div className="text-gray-500 italic p-2">Awaiting real-time audit records from AgentGuard Gateway...</div>
          ) : (
            displayLogs.map((log, i) => {
              const isBlock = log.includes('decision="BLOCK"') || log.includes('[CRIT]');
              const isApproval = log.includes('decision="REQUIRE_APPROVAL"');
              const isWarn = log.includes('decision="WARN"');
              const isCanary = log.includes('DECEPTION_TRIPWIRE_TRIGGERED');

              let lineClass = 'text-gray-300';
              if (isCanary) lineClass = 'text-purple-400 font-bold bg-purple-950/40 px-1 rounded';
              else if (isBlock) lineClass = 'text-red-400 font-semibold';
              else if (isApproval) lineClass = 'text-amber-400 font-semibold';
              else if (isWarn) lineClass = 'text-yellow-300';
              else lineClass = 'text-emerald-400/90';

              return (
                <div key={i} className={`font-mono leading-tight hover:bg-white/5 py-0.5 px-1 rounded ${lineClass}`}>
                  {log}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
