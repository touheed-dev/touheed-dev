import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Bot, Wrench, ShieldCheck, AlertTriangle,
  Zap, File, Terminal, Play, Pause, Database, X, Command
} from 'lucide-react';
import { EditorFileType } from '../../types/ide';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFile: (file: { path: string; title: string; type: EditorFileType; dataId?: string }) => void;
  onToggleSidebar: () => void;
  onToggleBottomPanel: () => void;
  onToggleTraffic: () => void;
  isTrafficGenerating: boolean;
  onVerifyLedger: () => void;
  onOpenSpecs: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenFile,
  onToggleSidebar,
  onToggleBottomPanel,
  onToggleTraffic,
  isTrafficGenerating,
  onVerifyLedger,
  onOpenSpecs,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const items = [
    // Agents
    { category: 'Agents', title: 'researcher.agent', desc: 'Researcher Autonomous Agent', type: 'agent' as EditorFileType, id: 'researcher-01', path: 'agents/researcher.agent' },
    { category: 'Agents', title: 'coder.agent', desc: 'Autonomous Coder Agent', type: 'agent' as EditorFileType, id: 'coder-02', path: 'agents/coder.agent' },
    { category: 'Agents', title: 'crawler.agent', desc: 'Web Scraping Swarm Agent', type: 'agent' as EditorFileType, id: 'crawler-03', path: 'agents/crawler.agent' },
    { category: 'Agents', title: 'executor.agent', desc: 'Workflow Orchestrator Agent', type: 'agent' as EditorFileType, id: 'executor-04', path: 'agents/executor.agent' },

    // Policies
    { category: 'Policies', title: 'secrets-policy.cel (POL-001)', desc: 'Honey Deception Tripwire Containment', type: 'policy' as EditorFileType, id: 'POL-001', path: 'policies/secrets-policy.cel' },
    { category: 'Policies', title: 'path-traversal.cel (POL-002)', desc: 'Filesystem Directory Traversal Defense', type: 'policy' as EditorFileType, id: 'POL-002', path: 'policies/path-traversal.cel' },
    { category: 'Policies', title: 'quarantine-policy.cel (POL-003)', desc: 'Quarantine State Enforcement', type: 'policy' as EditorFileType, id: 'POL-003', path: 'policies/quarantine-policy.cel' },
    { category: 'Policies', title: 'code-execution.cel (POL-006)', desc: 'Code Execution Approval Gate', type: 'policy' as EditorFileType, id: 'POL-006', path: 'policies/code-execution.cel' },

    // Tools
    { category: 'Tools', title: 'search_documents.tool', desc: 'Knowledge Base Vector Search', type: 'tool' as EditorFileType, id: 'search_documents', path: 'tools/search_documents.tool' },
    { category: 'Tools', title: 'read_secrets.tool', desc: 'Access Vault Credentials (Canary Bound)', type: 'tool' as EditorFileType, id: 'read_secrets', path: 'tools/read_secrets.tool' },
    { category: 'Tools', title: 'execute_code.tool', desc: 'Dynamic Code Execution MicroVM', type: 'tool' as EditorFileType, id: 'execute_code', path: 'tools/execute_code.tool' },

    // Attacks
    { category: 'Attacks', title: 'prompt-injection.attack', desc: 'Adversarial Prompt Injection Scenario', type: 'attack' as EditorFileType, id: 'scn_prompt_injection', path: 'attacks/prompt-injection.attack' },
    { category: 'Attacks', title: 'secret-access.attack', desc: 'Honey-Token Canary Breach Scenario', type: 'attack' as EditorFileType, id: 'scn_canary_touch', path: 'attacks/secret-access.attack' },

    // Incidents
    { category: 'Incidents', title: 'INC-2026-091.incident', desc: 'Deception Tripwire Canary Breach', type: 'incident' as EditorFileType, id: 'INC-2026-091', path: 'incidents/INC-2026-091.incident' },
    { category: 'Incidents', title: 'INC-2026-084.incident', desc: 'Path Traversal Root Escape Attempt', type: 'incident' as EditorFileType, id: 'INC-2026-084', path: 'incidents/INC-2026-084.incident' },

    // Commands
    { category: 'Commands', title: isTrafficGenerating ? 'Swarm: Pause Mesh Traffic' : 'Swarm: Start Mesh Traffic', desc: 'Toggle background agent simulation', action: onToggleTraffic },
    { category: 'Commands', title: 'View: Toggle Primary Sidebar', desc: 'Show or hide the explorer/navigation sidebar (⌘B)', action: onToggleSidebar },
    { category: 'Commands', title: 'View: Toggle Bottom Panel', desc: 'Show or hide the terminal and stream panel (⌘J)', action: onToggleBottomPanel },
    { category: 'Commands', title: 'Ledger: Verify Merkle Hash Integrity', desc: 'Audit cryptographic SHA-256 chain blocks', action: onVerifyLedger },
    { category: 'Commands', title: 'Security: Open Architecture Specification', desc: 'View Zero-Bypass Specification & Threat Model', action: onOpenSpecs },
  ];

  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.desc.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filtered[selectedIndex];
      if (selected) {
        if ('action' in selected && selected.action) {
          selected.action();
        } else if ('type' in selected) {
          onOpenFile({
            path: selected.path!,
            title: selected.title,
            type: selected.type as EditorFileType,
            dataId: selected.id,
          });
        }
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20"
      style={{ background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-xl rounded-xl border shadow-2xl overflow-hidden anim-slide-down flex flex-col max-h-[460px]"
        style={{
          background: '#1e1e1e',
          borderColor: '#388bfd',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 0 1px #388bfd',
        }}
      >
        {/* Input */}
        <div className="p-3 border-b border-[#2d2d2d] flex items-center gap-2.5 bg-[#252526]">
          <Search className="w-4 h-4 text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search agents, tools, policies, incidents..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-white font-mono text-xs focus:outline-none placeholder-slate-500"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 border border-white/10 text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-1 font-mono text-xs space-y-0.5">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              No matching files or commands found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={`${item.category}-${item.title}`}
                  onClick={() => {
                    if ('action' in item && item.action) {
                      item.action();
                    } else if ('type' in item) {
                      onOpenFile({
                        path: item.path!,
                        title: item.title,
                        type: item.type as EditorFileType,
                        dataId: item.id,
                      });
                    }
                    onClose();
                  }}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#04395e] text-white' : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.category === 'Agents' && <Bot className="w-4 h-4 text-blue-400 shrink-0" />}
                    {item.category === 'Policies' && <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {item.category === 'Tools' && <Wrench className="w-4 h-4 text-amber-400 shrink-0" />}
                    {item.category === 'Attacks' && <Zap className="w-4 h-4 text-purple-400 shrink-0" />}
                    {item.category === 'Incidents' && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
                    {item.category === 'Commands' && <Command className="w-4 h-4 text-slate-400 shrink-0" />}

                    <div>
                      <div className="font-semibold text-xs">{item.title}</div>
                      <div className="text-[10px] text-slate-400">{item.desc}</div>
                    </div>
                  </div>

                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 text-slate-400 uppercase">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
