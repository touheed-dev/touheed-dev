import React from 'react';
import {
  X, Bot, ShieldCheck, Wrench, Zap, AlertTriangle,
  GitCommit, Network, File, SplitSquareVertical, Maximize2
} from 'lucide-react';
import { OpenTab, ToolDefinition, IncidentRecord } from '../../types/ide';
import { AgentRecord, PolicyRule, ScenarioFixture, InterceptionDecision } from '../../types';
import { AgentEditor } from './editors/AgentEditor';
import { PolicyEditor } from './editors/PolicyEditor';
import { ToolEditor } from './editors/ToolEditor';
import { AttackEditor } from './editors/AttackEditor';
import { TraceEditor } from './editors/TraceEditor';
import { IncidentEditor } from './editors/IncidentEditor';
import { GraphEditor } from './editors/GraphEditor';

interface EditorAreaProps {
  openTabs: OpenTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  agents: AgentRecord[];
  policies: PolicyRule[];
  tools: ToolDefinition[];
  incidents: IncidentRecord[];
  scenarios: ScenarioFixture[];
  interceptions: InterceptionDecision[];
  policyEpoch: number;
  onQuarantineAgent: (agentId: string) => void;
  onResetAgent: (agentId: string) => void;
  onBumpEpoch: (agentId: string) => void;
  onTogglePolicy: (ruleId: string, enabled: boolean) => void;
  onReplayScenario: (scenarioId: string) => Promise<any>;
  onSimulateTool?: (toolName: string, args: Record<string, any>) => void;
}

export const EditorArea: React.FC<EditorAreaProps> = ({
  openTabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  agents,
  policies,
  tools,
  incidents,
  scenarios,
  interceptions,
  policyEpoch,
  onQuarantineAgent,
  onResetAgent,
  onBumpEpoch,
  onTogglePolicy,
  onReplayScenario,
  onSimulateTool,
}) => {
  const activeTab = openTabs.find((t) => t.id === activeTabId) || openTabs[0];

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'agent': return <Bot className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case 'policy': return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'tool': return <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'attack': return <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      case 'incident': return <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />;
      case 'trace': return <GitCommit className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      case 'graph': return <Network className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      default: return <File className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  if (!activeTab || openTabs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 font-mono text-xs select-none space-y-4" style={{ background: '#1e1e1e' }}>
        <Bot className="w-12 h-12 text-slate-600 mb-2" />
        <h2 className="text-sm font-bold text-slate-300 font-sans">No Files Open in Workspace</h2>
        <p className="max-w-sm text-slate-500">
          Select an agent, policy, tool, or incident from the Explorer on the left, or press <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-slate-300">⌘P</kbd> to search.
        </p>
      </div>
    );
  }

  // Find relevant item data
  const currentAgent = agents.find((a) => a.agent_id === activeTab.dataId);
  const currentPolicy = policies.find((p) => p.rule_id === activeTab.dataId);
  const currentTool = tools.find((t) => t.name === activeTab.dataId);
  const currentIncident = incidents.find((i) => i.incident_id === activeTab.dataId);
  const currentScenario = scenarios.find((s) => s.scenario_id === activeTab.dataId);
  const currentTrace = activeTab.meta || interceptions.find((i) => i.trace_id === activeTab.dataId);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none" style={{ background: '#1e1e1e' }}>

      {/* ── IDE Tab Bar ── */}
      <div className="h-9 border-b border-[#282828] flex items-center justify-between overflow-x-auto bg-[#181818] select-none shrink-0 pr-2">
        <div className="flex items-center h-full">
          {openTabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`ide-tab h-full flex items-center gap-2 px-3 text-xs font-mono cursor-pointer border-r border-[#282828] group transition-colors ${
                  isActive ? 'active' : ''
                }`}
              >
                {getTabIcon(tab.type)}
                <span className="truncate max-w-[140px]">{tab.title}</span>
                {tab.isDirty && <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="w-4 h-4 rounded flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Tab Right Controls */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <button className="p-1 hover:text-white rounded hover:bg-white/10" title="Split Editor Right">
            <SplitSquareVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Active Editor Body ── */}
      <div className="flex-1 overflow-hidden">
        {activeTab.type === 'agent' && (
          <AgentEditor
            agentId={activeTab.dataId || 'researcher-01'}
            agent={currentAgent}
            onQuarantine={onQuarantineAgent}
            onReset={onResetAgent}
            onBumpEpoch={onBumpEpoch}
          />
        )}
        {activeTab.type === 'policy' && (
          <PolicyEditor
            ruleId={activeTab.dataId || 'POL-001'}
            rule={currentPolicy}
            onTogglePolicy={onTogglePolicy}
            policyEpoch={policyEpoch}
          />
        )}
        {activeTab.type === 'tool' && (
          <ToolEditor
            toolName={activeTab.dataId || 'search_documents'}
            tool={currentTool}
            onSimulateTool={onSimulateTool}
          />
        )}
        {activeTab.type === 'attack' && (
          <AttackEditor
            scenarioId={activeTab.dataId || 'scn_prompt_injection'}
            scenario={currentScenario}
            onReplay={onReplayScenario}
          />
        )}
        {activeTab.type === 'trace' && (
          <TraceEditor
            traceId={activeTab.dataId || 'TRC-001'}
            decision={currentTrace}
          />
        )}
        {activeTab.type === 'incident' && (
          <IncidentEditor
            incidentId={activeTab.dataId || 'INC-2026-091'}
            incident={currentIncident}
            onQuarantineAgent={onQuarantineAgent}
            onResetAgent={onResetAgent}
            onBumpEpoch={onBumpEpoch}
          />
        )}
        {activeTab.type === 'graph' && (
          <GraphEditor agents={agents} />
        )}
      </div>

    </div>
  );
};
