import React, { useState } from 'react';
import {
  ChevronRight, ChevronDown, File, Bot, Wrench, ShieldCheck,
  ShieldAlert, AlertTriangle, GitCommit, Zap, UserCheck, Database,
  Network, Settings, Plus, Search, CheckCircle2, Clock, Ban,
  Folder, FolderOpen, RefreshCw, Key
} from 'lucide-react';
import { SidebarView, EditorFileType, ToolDefinition, IncidentRecord } from '../../types/ide';
import { INITIAL_EXPLORER_TREE } from '../../services/ideData';
import { AgentRecord, PolicyRule, ApprovalItem, LedgerBlock, InterceptionDecision, ScenarioFixture } from '../../types';

interface SidebarProps {
  activeView: SidebarView;
  onOpenFile: (file: { path: string; title: string; type: EditorFileType; dataId?: string; meta?: any }) => void;
  agents: AgentRecord[];
  policies: PolicyRule[];
  tools: ToolDefinition[];
  incidents: IncidentRecord[];
  approvals: ApprovalItem[];
  ledgerBlocks: LedgerBlock[];
  interceptions: InterceptionDecision[];
  scenarios: ScenarioFixture[];
  onTogglePolicy: (ruleId: string, enabled: boolean) => void;
  onResolveApproval: (id: string, action: 'APPROVE' | 'REJECT', note: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onOpenFile,
  agents,
  policies,
  tools,
  incidents,
  approvals,
  ledgerBlocks,
  interceptions,
  scenarios,
  onTogglePolicy,
  onResolveApproval,
}) => {
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFolder = (folder: string) => {
    setCollapsedFolders((prev) => ({ ...prev, [folder]: !prev[folder] }));
  };

  const getFileIcon = (type: EditorFileType) => {
    switch (type) {
      case 'agent': return <Bot className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case 'policy': return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'tool': return <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'attack': return <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      case 'incident': return <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />;
      case 'trace': return <GitCommit className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      default: return <File className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div
      className="w-64 border-r flex flex-col h-full select-none shrink-0"
      style={{
        background: '#1e1e1e',
        borderColor: '#282828',
        color: '#cccccc',
      }}
    >
      {/* ── View Header ── */}
      <div className="h-9 px-3 border-b flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-slate-400 border-[#282828]">
        <span>{activeView.toUpperCase().replace('-', ' ')}</span>
        {activeView === 'explorer' && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onOpenFile({ path: 'agents/new-agent.agent', title: 'new-agent.agent', type: 'agent' })}
              className="p-1 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Create New Agent (.agent)"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Search Bar inside sidebar ── */}
      <div className="p-2 border-b border-[#282828]">
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={`Filter ${activeView}…`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-6 bg-[#161616] border border-[#2d2d2d] rounded px-2 pl-6 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>
      </div>

      {/* ── Main Sidebar Content Body ── */}
      <div className="flex-1 overflow-y-auto p-1 text-xs">

        {/* ── 1. EXPLORER VIEW ── */}
        {activeView === 'explorer' && (
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>PROJECT ROOT (AGENTGUARD)</span>
            </div>

            {INITIAL_EXPLORER_TREE.map((section) => {
              const isCollapsed = collapsedFolders[section.folder];
              const visibleFiles = section.files.filter((f) =>
                f.name.toLowerCase().includes(searchQuery.toLowerCase())
              );
              if (searchQuery && visibleFiles.length === 0) return null;

              return (
                <div key={section.folder} className="space-y-0.5">
                  {/* Folder Row */}
                  <div
                    onClick={() => toggleFolder(section.folder)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 cursor-pointer text-slate-300 font-mono text-[11px]"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    {isCollapsed ? (
                      <Folder className="w-3.5 h-3.5 text-amber-500/80" />
                    ) : (
                      <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span className="font-semibold">{section.folder}</span>
                  </div>

                  {/* Files inside folder */}
                  {!isCollapsed && (
                    <div className="pl-4 space-y-0.5">
                      {visibleFiles.map((file) => (
                        <div
                          key={file.path}
                          onClick={() =>
                            onOpenFile({
                              path: file.path,
                              title: file.name,
                              type: file.type,
                              dataId: file.id,
                            })
                          }
                          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 cursor-pointer text-slate-300 font-mono text-[11px] group transition-colors"
                        >
                          {getFileIcon(file.type)}
                          <span className="truncate group-hover:text-white">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── 2. AGENTS VIEW ── */}
        {activeView === 'agents' && (
          <div className="space-y-1">
            {agents
              .filter((a) => a.agent_id.toLowerCase().includes(searchQuery.toLowerCase()) || a.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((ag) => (
                <div
                  key={ag.agent_id}
                  onClick={() =>
                    onOpenFile({
                      path: `agents/${ag.agent_id}.agent`,
                      title: `${ag.agent_id}.agent`,
                      type: 'agent',
                      dataId: ag.agent_id,
                    })
                  }
                  className="p-2 rounded hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/10 transition-all font-mono space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <Bot className="w-3.5 h-3.5 text-blue-400" />
                      <span>{ag.agent_id}</span>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        ag.status === 'HEALTHY'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : ag.status === 'QUARANTINED'
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {ag.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{ag.role}</div>
                  <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5">
                    <span>Epoch v{ag.security_epoch}</span>
                    <span>Blocks: {ag.blocked_count}</span>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ── 3. TOOLS VIEW ── */}
        {activeView === 'tools' && (
          <div className="space-y-1">
            {tools
              .filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((tool) => (
                <div
                  key={tool.name}
                  onClick={() =>
                    onOpenFile({
                      path: `tools/${tool.name}.tool`,
                      title: `${tool.name}.tool`,
                      type: 'tool',
                      dataId: tool.name,
                    })
                  }
                  className="p-2 rounded hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/10 transition-all font-mono space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <Wrench className="w-3.5 h-3.5 text-amber-400" />
                      <span>{tool.name}</span>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        tool.risk_level === 'SAFE'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : tool.risk_level === 'CRITICAL'
                          ? 'text-red-400 bg-red-500/10'
                          : 'text-amber-400 bg-amber-500/10'
                      }`}
                    >
                      {tool.risk_level}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{tool.description}</div>
                </div>
              ))}
          </div>
        )}

        {/* ── 4. POLICIES VIEW ── */}
        {activeView === 'policies' && (
          <div className="space-y-1">
            {policies
              .filter((p) => p.rule_id.toLowerCase().includes(searchQuery.toLowerCase()) || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((rule) => (
                <div
                  key={rule.rule_id}
                  onClick={() =>
                    onOpenFile({
                      path: `policies/${rule.rule_id.toLowerCase()}.cel`,
                      title: `${rule.rule_id}.cel`,
                      type: 'policy',
                      dataId: rule.rule_id,
                    })
                  }
                  className="p-2 rounded hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/10 transition-all font-mono space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{rule.rule_id}</span>
                    </div>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-white/5 text-slate-400">
                      P{rule.priority}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300 font-semibold truncate">{rule.name}</div>
                  <div className="text-[9px] text-slate-500 truncate">{rule.cel_expression}</div>
                </div>
              ))}
          </div>
        )}

        {/* ── 5. INCIDENTS VIEW ── */}
        {activeView === 'incidents' && (
          <div className="space-y-1">
            {incidents
              .filter((inc) => inc.incident_id.toLowerCase().includes(searchQuery.toLowerCase()) || inc.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((inc) => (
                <div
                  key={inc.incident_id}
                  onClick={() =>
                    onOpenFile({
                      path: `incidents/${inc.incident_id}.incident`,
                      title: `${inc.incident_id}.incident`,
                      type: 'incident',
                      dataId: inc.incident_id,
                    })
                  }
                  className="p-2 rounded hover:bg-white/5 cursor-pointer border border-transparent hover:border-red-500/20 transition-all font-mono space-y-1 bg-red-500/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-red-400">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      <span>{inc.incident_id}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-red-500/20 text-red-300">
                      {inc.severity}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-200 font-medium truncate">{inc.title}</div>
                  <div className="text-[9px] text-slate-400 truncate">Agent: {inc.agent_id}</div>
                </div>
              ))}
          </div>
        )}

        {/* ── 6. APPROVALS VIEW ── */}
        {activeView === 'approvals' && (
          <div className="space-y-2">
            {approvals.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs font-mono">
                No pending human approvals.
              </div>
            ) : (
              approvals.map((appr) => (
                <div key={appr.approval_id} className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 font-mono space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-400">{appr.tool_name}</span>
                    <span className="text-[9px] text-slate-400">{appr.agent_id}</span>
                  </div>
                  <p className="text-[10px] text-slate-300">{appr.decision_reason}</p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => onResolveApproval(appr.approval_id, 'APPROVE', 'Approved via IDE Cockpit')}
                      className="flex-1 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      APPROVE
                    </button>
                    <button
                      onClick={() => onResolveApproval(appr.approval_id, 'REJECT', 'Rejected via IDE Cockpit')}
                      className="flex-1 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      REJECT
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── 7. TRACES VIEW ── */}
        {activeView === 'traces' && (
          <div className="space-y-1">
            {interceptions.map((item, i) => (
              <div
                key={`${item.trace_id}-${i}`}
                onClick={() =>
                  onOpenFile({
                    path: `traces/${item.trace_id}.trace`,
                    title: `${item.trace_id}.trace`,
                    type: 'trace',
                    dataId: item.trace_id,
                    meta: item,
                  })
                }
                className="p-2 rounded hover:bg-white/5 cursor-pointer font-mono border border-transparent hover:border-white/10 text-[11px] space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-200">
                    <GitCommit className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="truncate">{item.tool_name}</span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      item.decision === 'ALLOW' ? 'text-emerald-400 bg-emerald-500/10' :
                      item.decision === 'BLOCK' ? 'text-red-400 bg-red-500/10' :
                      item.decision === 'REQUIRE_APPROVAL' ? 'text-purple-400 bg-purple-500/10' :
                      'text-amber-400 bg-amber-500/10'
                    }`}
                  >
                    {item.decision}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-400">
                  <span>{item.agent_id}</span>
                  <span>Risk: {item.risk_score}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 8. ATTACK LAB VIEW ── */}
        {activeView === 'attack-lab' && (
          <div className="space-y-1">
            {scenarios.map((scn) => (
              <div
                key={scn.scenario_id}
                onClick={() =>
                  onOpenFile({
                    path: `attacks/${scn.scenario_id}.attack`,
                    title: `${(scn.title || scn.scenario_id).toLowerCase().replace(/\s+/g, '-')}.attack`,
                    type: 'attack',
                    dataId: scn.scenario_id,
                    meta: scn,
                  })
                }
                className="p-2 rounded hover:bg-white/5 cursor-pointer font-mono border border-transparent hover:border-purple-500/20 text-[11px] space-y-1"
              >
                <div className="flex items-center gap-1.5 font-bold text-purple-400">
                  <Zap className="w-3.5 h-3.5" />
                  <span className="truncate">{scn.title || scn.scenario_id}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">{scn.description}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── 9. AUDIT LEDGER VIEW ── */}
        {activeView === 'audit' && (
          <div className="space-y-1">
            {ledgerBlocks.slice(0, 20).map((block) => (
              <div
                key={block.block_index}
                className="p-2 rounded bg-white/5 border border-white/5 font-mono text-[10px] space-y-1"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-blue-400">Block #{block.block_index}</span>
                  <span className={block.decision === 'ALLOW' ? 'text-emerald-400' : 'text-red-400'}>
                    {block.decision}
                  </span>
                </div>
                <div className="text-slate-400 truncate">
                  Hash: {block.block_hash.slice(0, 20)}…
                </div>
                <div className="text-slate-500 text-[9px]">
                  {block.agent_id} → {block.tool_name}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 10. GRAPH VIEW ── */}
        {activeView === 'graph' && (
          <div className="p-3 text-center space-y-3 font-mono text-xs">
            <p className="text-slate-400">Interactive Mesh Topology Graph</p>
            <button
              onClick={() => onOpenFile({ path: 'topology.graph', title: 'AgentMesh.graph', type: 'graph' })}
              className="w-full py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition-colors"
            >
              Open Topology Canvas
            </button>
          </div>
        )}

        {/* ── 11. SECURITY VIEW ── */}
        {activeView === 'security' && (
          <div className="space-y-3 p-1 font-mono text-xs">
            <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-[11px]">
                <ShieldCheck className="w-4 h-4" />
                <span>FAIL-CLOSED INVARIANT</span>
              </div>
              <p className="text-[10px] text-slate-300">
                100% deterministic safety gating. Any unhandled panic or timeout yields immediate HARD_BLOCK.
              </p>
            </div>

            <div className="p-2.5 rounded bg-blue-500/10 border border-blue-500/30 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-400 text-[11px]">
                <Key className="w-4 h-4" />
                <span>RFC-8785 ED25519</span>
              </div>
              <p className="text-[10px] text-slate-300">
                Canonical JSON SHA-256 Merkle chain with zero-byte post-block execution rate.
              </p>
            </div>
          </div>
        )}

        {/* ── 12. SETTINGS VIEW ── */}
        {activeView === 'settings' && (
          <div className="p-2 space-y-3 font-mono text-xs text-slate-300">
            <div className="font-bold text-slate-100 uppercase tracking-wider text-[10px]">
              IDE Configuration
            </div>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Auto-Scroll Stream</span>
              <input type="checkbox" defaultChecked className="accent-blue-500" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Fail-Closed Simulation</span>
              <input type="checkbox" defaultChecked className="accent-blue-500" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Canary Token Traps</span>
              <input type="checkbox" defaultChecked className="accent-blue-500" />
            </label>
          </div>
        )}

      </div>
    </div>
  );
};
