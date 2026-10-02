import { DecisionType, AgentStatus, InterceptionDecision, AgentRecord, ApprovalItem, LedgerBlock, PolicyRule, ScenarioFixture, HoneypotAsset } from '../types';

export type SidebarView =
  | 'explorer'
  | 'agents'
  | 'tools'
  | 'policies'
  | 'security'
  | 'incidents'
  | 'traces'
  | 'attack-lab'
  | 'approvals'
  | 'audit'
  | 'graph'
  | 'settings';

export type EditorFileType =
  | 'agent'
  | 'policy'
  | 'tool'
  | 'attack'
  | 'trace'
  | 'incident'
  | 'graph'
  | 'config';

export interface OpenTab {
  id: string;
  path: string;
  title: string;
  type: EditorFileType;
  isDirty?: boolean;
  dataId?: string; // e.g. agent_id, rule_id, trace_id, incident_id
  meta?: any;
}

export type BottomPanelTab =
  | 'stream'
  | 'terminal'
  | 'cel'
  | 'ledger'
  | 'problems';

export interface IncidentRecord {
  incident_id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  agent_id: string;
  title: string;
  description: string;
  timestamp: number;
  status: 'ACTIVE' | 'CONTAINED' | 'RESOLVED';
  tripwire_token?: string;
  trace_id: string;
  rule_violated?: string;
  containment_action: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';
  allowed_roles: string[];
  requires_approval: boolean;
  schema: Record<string, string>;
  is_sensitive: boolean;
  canary_monitored: boolean;
}

export interface AgentIdeRecord extends AgentRecord {
  owner: string;
  assigned_task: string;
  forbidden_tools: string[];
  data_scope: string[];
  communication_permissions: string[];
  maximum_risk: number;
  trust_score: number;
  security_state: 'CLEAN' | 'EXPOSED' | 'SUSPICIOUS' | 'COMPROMISED' | 'QUARANTINED' | 'RECOVERED';
  is_paused?: boolean;
}
