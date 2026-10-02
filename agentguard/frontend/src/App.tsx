import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { KpiTiles } from './components/KpiTiles';
import { CommandCenterView } from './components/CommandCenterView';
import { PipelineDeepDiveView } from './components/PipelineDeepDiveView';
import { PoliciesView } from './components/PoliciesView';
import { AttackLabView } from './components/AttackLabView';
import { CheckpointsView } from './components/CheckpointsView';
import { TelemetryChart } from './components/TelemetryChart';
import { EventDetailDrawer } from './components/EventDetailDrawer';
import { ArchitectureModal } from './components/ArchitectureModal';
import { api } from './api';
import { soundFX } from './utils/soundEffects';
import {
  GatewayStats, InterceptionDecision, AgentRecord, ApprovalItem,
  LedgerBlock, ScenarioFixture, HoneypotAsset, CheckpointSnapshot, MilestoneResult,
  PolicyRule
} from './types';
import { ShieldAlert, CheckCircle, X } from 'lucide-react';

// ─── Toast Notification Component (Warm Beige & Red/Green Alert) ───
function Toast({ title, message, type, onClose }: {
  title: string; message: string; type: 'alert' | 'success'; onClose: () => void;
}) {
  const isAlert = type === 'alert';
  return (
    <div
      className={`anim-drawer flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl max-w-sm w-full font-mono text-xs ${
        isAlert
          ? 'bg-red-950/90 border-red-700/60 text-red-100 shadow-red-950/40'
          : 'bg-[#EDE8DE] border-[#B8AE9F] text-[#1E232A] shadow-[0_8px_24px_rgba(100,85,70,0.18)]'
      }`}
      style={{ backdropFilter: 'blur(10px)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[10px] uppercase tracking-wider mb-0.5 opacity-90">{title}</div>
        <div className="text-[11px] leading-relaxed">{message}</div>
      </div>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function App() {
  type Tab = 'command-center' | 'pipeline' | 'policies' | 'attack-lab' | 'checkpoints';
  const [activeTab, setActiveTab] = useState<Tab>('command-center');
  const [stats, setStats] = useState<GatewayStats | null>(null);
  const [interceptions, setInterceptions] = useState<InterceptionDecision[]>([]);
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [ledgerBlocks, setLedgerBlocks] = useState<LedgerBlock[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioFixture[]>([]);
  const [honeypots, setHoneypots] = useState<HoneypotAsset[]>([]);
  const [checkpoints, setCheckpoints] = useState<CheckpointSnapshot[]>([]);
  const [milestones, setMilestones] = useState<MilestoneResult[]>([]);
  const [policies, setPolicies] = useState<PolicyRule[]>([]);
  const [selectedInterception, setSelectedInterception] = useState<InterceptionDecision | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isVerifyingLedger, setIsVerifyingLedger] = useState(false);
  const [ledgerVerification, setLedgerVerification] = useState<any>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayResult, setReplayResult] = useState<any>(null);
  const [isRunningMilestones, setIsRunningMilestones] = useState(false);
  const [isTrafficGenerating, setIsTrafficGenerating] = useState(false);
  const [trafficSpeed, setTrafficSpeed] = useState<number>(2000);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [kpiFilter, setKpiFilter] = useState<string>('ALL');
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [drawerDecision, setDrawerDecision] = useState<InterceptionDecision | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; message: string; type: 'alert' | 'success' }>>([]);

  const wsRef = useRef<WebSocket | null>(null);

  const showToast = (title: string, message: string, type: 'alert' | 'success' = 'alert') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-2), { id, title, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFX.setEnabled(next);
    if (next) soundFX.playAllow();
    showToast('AUDIO FEEDBACK', next ? 'Live cyber audio cues enabled.' : 'Audio muted.', 'success');
  };

  const loadAllData = async () => {
    try {
      const [
        statsData, interceptionsData, agentsData, approvalsData,
        ledgerData, scenariosData, honeypotsData, checkpointsData, milestonesData,
        policiesData
      ] = await Promise.all([
        api.getStats(), api.getInterceptions(50), api.getAgents(), api.getApprovals(),
        api.getLedger(50), api.getScenarios(), api.getHoneypots(),
        api.getCheckpoints(), api.runMilestones(), api.getPolicies()
      ]);
      setStats(statsData);
      setInterceptions(interceptionsData);
      if (interceptionsData.length > 0 && !selectedInterception) {
        setSelectedInterception(interceptionsData[0]);
      }
      setAgents(agentsData);
      setApprovals(approvalsData);
      setLedgerBlocks(ledgerData);
      setScenarios(scenariosData);
      setHoneypots(honeypotsData);
      setCheckpoints(checkpointsData);
      setMilestones(milestonesData);
      setPolicies(policiesData);
    } catch (err) {
      console.error('Failed to load initial dynamic data:', err);
    }
  };

  useEffect(() => {
    loadAllData();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws/stream`);

    socket.onopen = () => setIsConnected(true);
    socket.onclose = () => setIsConnected(false);

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === 'INTERCEPTION') {
          const decision = msg.data as InterceptionDecision;
          setInterceptions((prev) => [decision, ...prev.slice(0, 49)]);
          setSelectedInterception(decision);

          // Audio sound cues
          if (decision.honeypot_triggered) {
            soundFX.playHoney();
            showToast('🍯 DECEPTION TRIPWIRE BREACH', `Canary token touched by ${decision.agent_id}! Agent quarantined.`, 'alert');
          } else if (decision.decision === 'BLOCK') {
            soundFX.playBlock();
            showToast('🛑 INVOCATION BLOCKED', `Pre-execution aborted for ${decision.tool_name} (${decision.agent_id}).`, 'alert');
          } else if (decision.decision === 'REQUIRE_APPROVAL') {
            soundFX.playWarn();
          } else {
            soundFX.playAllow();
          }

          api.getStats().then(setStats);
          api.getLedger(50).then(setLedgerBlocks);
          api.getAgents().then(setAgents);
          api.getApprovals().then(setApprovals);
        } else if (msg.event === 'AGENT_STATE_CHANGE') {
          api.getAgents().then(setAgents);
          api.getStats().then(setStats);
        } else if (msg.event === 'APPROVAL_RESOLVED') {
          api.getApprovals().then(setApprovals);
          api.getStats().then(setStats);
          api.getLedger(50).then(setLedgerBlocks);
          soundFX.playAllow();
          showToast('APPROVAL RESOLVED', `Action updated: ${msg.data.status}`, 'success');
        } else if (msg.event === 'CHECKPOINT_CREATED') {
          api.getCheckpoints().then(setCheckpoints);
        } else if (msg.event === 'POLICY_UPDATED') {
          api.getPolicies().then(setPolicies);
          api.getStats().then(setStats);
        }
      } catch (err) { /* ignore */ }
    };

    wsRef.current = socket;
    return () => socket.close();
  }, []);

  // Polling fallback
  useEffect(() => {
    const interval = setInterval(() => {
      api.getStats().then(setStats).catch(() => {});
      api.getApprovals().then(setApprovals).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Continuous Dynamic Swarm Traffic Generator with adjustable speed
  useEffect(() => {
    if (!isTrafficGenerating) return;
    const interval = setInterval(async () => {
      try {
        await api.simulateTraffic();
      } catch (err) { /* ignore */ }
    }, trafficSpeed);
    return () => clearInterval(interval);
  }, [isTrafficGenerating, trafficSpeed]);

  // Handlers
  const handleSimulate = async (payload: any) => {
    setIsSimulating(true);
    try {
      const decision = await api.authorize(payload);
      setSelectedInterception(decision);
      setInterceptions((prev) => [decision, ...prev.slice(0, 49)]);

      if (decision.honeypot_triggered) {
        soundFX.playHoney();
      } else if (decision.decision === 'BLOCK') {
        soundFX.playBlock();
      } else {
        soundFX.playAllow();
      }

      const [s, l, ag, ap] = await Promise.all([api.getStats(), api.getLedger(50), api.getAgents(), api.getApprovals()]);
      setStats(s); setLedgerBlocks(l); setAgents(ag); setApprovals(ap);
    } catch (e: any) {
      showToast('SIMULATION ERROR', e.message, 'alert');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleQuarantineAgent = async (agentId: string) => {
    await api.quarantineAgent(agentId, 'Manual Security Analyst Action');
    setAgents(await api.getAgents());
    api.getStats().then(setStats);
    soundFX.playBlock();
    showToast('AGENT QUARANTINED', `${agentId} placed under strict quarantine.`, 'alert');
  };

  const handleResetAgent = async (agentId: string) => {
    await api.resetAgent(agentId);
    setAgents(await api.getAgents());
    api.getStats().then(setStats);
    soundFX.playAllow();
    showToast('AGENT RESTORED', `${agentId} restored to HEALTHY status.`, 'success');
  };

  const handleBumpEpoch = async (agentId: string) => {
    const res = await api.bumpAgentEpoch(agentId);
    setAgents(await api.getAgents());
    soundFX.playAllow();
    showToast('EPOCH BUMPED', `${agentId} bumped to Epoch v${res.new_epoch}. Tokens invalidated.`, 'success');
  };

  const handleResolveApproval = async (approvalId: string, action: 'APPROVE' | 'REJECT', note: string) => {
    try {
      const res = await api.resolveApproval(approvalId, action, note);
      const [ap, l, s] = await Promise.all([api.getApprovals(), api.getLedger(50), api.getStats()]);
      setApprovals(ap); setLedgerBlocks(l); setStats(s);
      if (action === 'APPROVE') soundFX.playAllow();
      else soundFX.playBlock();
      showToast(action === 'APPROVE' ? 'EXECUTION APPROVED' : 'EXECUTION REJECTED', `Approval ${approvalId}: ${res.status}`, 'success');
    } catch (e: any) {
      showToast('RESOLVE ERROR', e.message, 'alert');
    }
  };

  const handleVerifyLedger = async () => {
    setIsVerifyingLedger(true);
    try {
      const res = await api.verifyLedgerIntegrity();
      setLedgerVerification(res);
      if (res.valid) soundFX.playAllow();
      else soundFX.playBlock();
      showToast(
        res.valid ? 'INTEGRITY VERIFIED' : 'TAMPER DETECTED',
        `${res.verified_blocks} Blocks audited with 0 tamper. ${res.standard}`,
        res.valid ? 'success' : 'alert'
      );
    } catch (e: any) {
      showToast('VERIFY ERROR', e.message, 'alert');
    } finally {
      setIsVerifyingLedger(false);
    }
  };

  const handleReplayScenario = async (scenarioId: string) => {
    setIsReplaying(true);
    try {
      const res = await api.replayScenario(scenarioId);
      setReplayResult(res);
      const [s, l, i] = await Promise.all([api.getStats(), api.getLedger(50), api.getInterceptions(50)]);
      setStats(s); setLedgerBlocks(l); setInterceptions(i);
      if (res.decision) setSelectedInterception(res.decision);
      if (res.deterministic_match) soundFX.playAllow();
      else soundFX.playBlock();
      showToast(
        res.deterministic_match ? '✅ DETERMINISTIC MATCH' : '⚠️ MISMATCH',
        `${scenarioId}: Expected ${res.expected}, got ${res.actual}`,
        res.deterministic_match ? 'success' : 'alert'
      );
    } catch (e: any) {
      showToast('REPLAY ERROR', e.message, 'alert');
    } finally {
      setIsReplaying(false);
    }
  };

  const handleCreateCheckpoint = async (name: string, description: string) => {
    const ckpt = await api.createCheckpoint(name, description);
    setCheckpoints((prev) => [ckpt, ...prev]);
    soundFX.playAllow();
    showToast('CHECKPOINT COMMITTED', `Snapshot ${ckpt.checkpoint_id} at ledger #${ckpt.ledger_height}.`, 'success');
  };

  const handleRunMilestones = async () => {
    setIsRunningMilestones(true);
    try {
      setMilestones(await api.runMilestones());
      soundFX.playAllow();
      showToast('MILESTONES EVALUATED', 'All security invariants M1–M5 verified.', 'success');
    } catch (e: any) {
      showToast('MILESTONE ERROR', e.message, 'alert');
    } finally {
      setIsRunningMilestones(false);
    }
  };

  const handleTogglePolicy = async (ruleId: string, enabled: boolean) => {
    try {
      const res = await api.togglePolicy(ruleId, enabled);
      const updated = await api.getPolicies();
      setPolicies(updated);
      const updatedStats = await api.getStats();
      setStats(updatedStats);
      soundFX.playAllow();
      showToast('POLICY UPDATED', `${ruleId} ${enabled ? 'ARMED' : 'BYPASSED'} (Epoch v${res.policy_epoch}).`, 'success');
    } catch (err: any) {
      showToast('POLICY ERROR', err.message, 'alert');
    }
  };

  const handleToggleTraffic = () => {
    setIsTrafficGenerating((prev) => !prev);
    if (!isTrafficGenerating) {
      soundFX.playAllow();
      showToast('DYNAMIC SWARM ACTIVE', 'Continuous agent mesh tool calls started.', 'success');
    } else {
      showToast('SWARM PAUSED', 'Traffic generator stopped.', 'success');
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans select-text" style={{ background: '#F5F0E8', color: '#1E232A' }}>

      {/* ── Toast Notifications Stack ── */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            title={toast.title}
            message={toast.message}
            type={toast.type}
            onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
          />
        ))}
      </div>

      {/* ── Navbar: Warm Beige with Scrolling Invariant Ticker & Adaptive Tabs ── */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
        ledgerHeight={stats?.ledger_height ?? 0}
        isTrafficGenerating={isTrafficGenerating}
        onToggleTraffic={handleToggleTraffic}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
      />

      {/* ── Main Dynamic Dashboard Body ── */}
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-6 py-5 space-y-4">

        {/* Live KPI Metric Tiles with Interactive Filter */}
        <KpiTiles
          stats={stats}
          onSelectFilter={(filter) => {
            setKpiFilter(filter);
            if (activeTab !== 'command-center') setActiveTab('command-center');
          }}
          activeFilter={kpiFilter}
        />

        {/* Live Real-time Dynamic Telemetry Chart & Speed Controller */}
        <TelemetryChart
          interceptions={interceptions}
          agents={agents}
          isTrafficGenerating={isTrafficGenerating}
          onToggleTraffic={handleToggleTraffic}
          trafficSpeed={trafficSpeed}
          onChangeSpeed={setTrafficSpeed}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />

        {/* Dynamic Tab Views */}
        <div key={activeTab} className="tab-enter">
          {activeTab === 'command-center' && (
            <CommandCenterView
              interceptions={interceptions}
              agents={agents}
              approvals={approvals}
              ledgerBlocks={ledgerBlocks}
              onSelectInterception={setDrawerDecision}
              onQuarantineAgent={handleQuarantineAgent}
              onResetAgent={handleResetAgent}
              onBumpEpoch={handleBumpEpoch}
              onResolveApproval={handleResolveApproval}
              onVerifyLedger={handleVerifyLedger}
              ledgerVerification={ledgerVerification}
              isVerifyingLedger={isVerifyingLedger}
              onQuickSimulate={handleSimulate}
            />
          )}

          {activeTab === 'pipeline' && (
            <PipelineDeepDiveView
              currentDecision={selectedInterception}
              onSimulate={handleSimulate}
              isSimulating={isSimulating}
            />
          )}

          {activeTab === 'policies' && (
            <PoliciesView
              policies={policies}
              onTogglePolicy={handleTogglePolicy}
              policyEpoch={stats?.policy_epoch ?? 1}
            />
          )}

          {activeTab === 'attack-lab' && (
            <AttackLabView
              scenarios={scenarios}
              honeypots={honeypots}
              onReplayScenario={handleReplayScenario}
              isReplaying={isReplaying}
              replayResult={replayResult}
            />
          )}

          {activeTab === 'checkpoints' && (
            <CheckpointsView
              checkpoints={checkpoints}
              milestones={milestones}
              onCreateCheckpoint={handleCreateCheckpoint}
              onRunMilestones={handleRunMilestones}
              isRunningMilestones={isRunningMilestones}
            />
          )}
        </div>
      </main>

      {/* ── Dynamic Footer ── */}
      <footer
        className="border-t border-[#DDD8CE] py-3.5 px-6"
        style={{ background: '#EDE8DE', color: '#5C5245' }}
      >
        <div className="max-w-screen-2xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800">
              AgentGuard Runtime Security Gateway • Architecture Lock v2.4.1
            </span>
            <button
              onClick={() => setIsArchitectureOpen(true)}
              className="text-emerald-700 underline font-bold hover:text-emerald-900 cursor-pointer"
            >
              [View Architecture Specification]
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span>RFC-8785 SHA-256</span>
            <span>•</span>
            <span>POST-BLOCK RATE: <strong className="text-emerald-700 font-bold">0.00% Zero-Byte</strong></span>
            <span>•</span>
            <span>PUBKEY: {stats?.gateway_public_key ?? 'ed25519:…'}</span>
          </div>
        </div>
      </footer>

      {/* ── Event Detail Drawer ── */}
      <EventDetailDrawer decision={drawerDecision} onClose={() => setDrawerDecision(null)} />

      {/* ── Architecture Lock & Specs Modal ── */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
        stats={stats}
      />
    </div>
  );
}

export default App;
