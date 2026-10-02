import {
  GatewayStats,
  AgentRecord,
  ApprovalItem,
  LedgerBlock,
  ScenarioFixture,
  CheckpointSnapshot,
  MilestoneResult,
  InterceptionDecision,
  HoneypotAsset
} from './types';

const API_BASE = '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getStats(): Promise<GatewayStats> {
    const res = await fetch(`${API_BASE}/stats`);
    return res.json();
  },

  async getInterceptions(limit: number = 50): Promise<InterceptionDecision[]> {
    const res = await fetch(`${API_BASE}/interceptions?limit=${limit}`);
    return res.json();
  },

  async authorize(payload: {
    agent_id: string;
    tool_name: string;
    arguments: Record<string, any>;
    task_id: string;
    trace_id: string;
    token_epoch?: number;
  }): Promise<InterceptionDecision> {
    const res = await fetch(`${API_BASE}/authorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getAgents(): Promise<AgentRecord[]> {
    const res = await fetch(`${API_BASE}/agents`);
    return res.json();
  },

  async quarantineAgent(agent_id: string, reason?: string): Promise<AgentRecord> {
    const res = await fetch(`${API_BASE}/agents/${agent_id}/quarantine?reason=${encodeURIComponent(reason || 'Manual Analyst Action')}`, {
      method: 'POST',
    });
    return res.json();
  },

  async resetAgent(agent_id: string): Promise<AgentRecord> {
    const res = await fetch(`${API_BASE}/agents/${agent_id}/reset`, {
      method: 'POST',
    });
    return res.json();
  },

  async bumpAgentEpoch(agent_id: string): Promise<{ agent_id: string; new_epoch: number }> {
    const res = await fetch(`${API_BASE}/agents/${agent_id}/bump_epoch`, {
      method: 'POST',
    });
    return res.json();
  },

  async getApprovals(): Promise<ApprovalItem[]> {
    const res = await fetch(`${API_BASE}/approvals`);
    return res.json();
  },

  async resolveApproval(approval_id: string, action: 'APPROVE' | 'REJECT', note: string = '') {
    const res = await fetch(`${API_BASE}/approvals/${approval_id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, note }),
    });
    return res.json();
  },

  async getLedger(limit: number = 50): Promise<LedgerBlock[]> {
    const res = await fetch(`${API_BASE}/ledger?limit=${limit}`);
    return res.json();
  },

  async verifyLedgerIntegrity() {
    const res = await fetch(`${API_BASE}/ledger/verify`);
    return res.json();
  },

  async getPolicies() {
    const res = await fetch(`${API_BASE}/policies`);
    return res.json();
  },

  async togglePolicy(rule_id: string, enabled: boolean) {
    const res = await fetch(`${API_BASE}/policies/${rule_id}/toggle?enabled=${enabled}`, {
      method: 'POST',
    });
    return res.json();
  },

  async getScenarios(): Promise<ScenarioFixture[]> {
    const res = await fetch(`${API_BASE}/scenarios`);
    return res.json();
  },

  async replayScenario(scenario_id: string) {
    const res = await fetch(`${API_BASE}/scenarios/${scenario_id}/replay`, {
      method: 'POST',
    });
    return res.json();
  },

  async getCheckpoints(): Promise<CheckpointSnapshot[]> {
    const res = await fetch(`${API_BASE}/checkpoints`);
    return res.json();
  },

  async createCheckpoint(name: string, description: string = ''): Promise<CheckpointSnapshot> {
    const res = await fetch(`${API_BASE}/checkpoints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    return res.json();
  },

  async runMilestones(): Promise<MilestoneResult[]> {
    const res = await fetch(`${API_BASE}/milestones`);
    return res.json();
  },

  async getHoneypots(): Promise<HoneypotAsset[]> {
    const res = await fetch(`${API_BASE}/honeypots`);
    return res.json();
  },

  async simulateTraffic(): Promise<InterceptionDecision> {
    const res = await fetch(`${API_BASE}/simulate/traffic`, {
      method: 'POST',
    });
    return res.json();
  }
};

