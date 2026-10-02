import React, { useState } from 'react';
import {
  ShieldAlert, ShieldCheck, Filter, Search, Zap,
  ToggleLeft, ToggleRight, CheckCircle2, AlertTriangle, Clock, Ban,
  FileCode, Play, Sparkles, RefreshCw
} from 'lucide-react';
import { PolicyRule, DecisionType } from '../types';

interface PoliciesViewProps {
  policies: PolicyRule[];
  onTogglePolicy: (ruleId: string, enabled: boolean) => void;
  policyEpoch: number;
}

export const PoliciesView: React.FC<PoliciesViewProps> = ({
  policies,
  onTogglePolicy,
  policyEpoch,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [filterDecision, setFilterDecision] = useState<'ALL' | DecisionType>('ALL');

  // Interactive Sandbox State
  const [sandboxContext, setSandboxContext] = useState({
    agent_id: 'researcher-01',
    agent_status: 'HEALTHY',
    agent_role: 'analyst',
    tool_name: 'read_file',
    has_honey_token: false,
    has_path_traversal: false,
    has_dangerous_syscall: false,
    has_sql_injection: false,
    is_tool_permitted: true,
    risk_score: 25,
  });
  const [simulatedMatch, setSimulatedMatch] = useState<{
    matchedRule: PolicyRule | null;
    decision: DecisionType;
    reason: string;
  } | null>(null);

  const filtered = policies.filter((rule) => {
    const matchesText =
      rule.rule_id.toLowerCase().includes(filterQuery.toLowerCase()) ||
      rule.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      rule.cel_expression.toLowerCase().includes(filterQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesDecision = filterDecision === 'ALL' || rule.decision === filterDecision;
    return matchesText && matchesDecision;
  });

  const getDecisionBadge = (decision: DecisionType) => {
    switch (decision) {
      case 'BLOCK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono badge-block">
            <Ban className="w-3 h-3" /> BLOCK
          </span>
        );
      case 'REQUIRE_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono badge-approval">
            <Clock className="w-3 h-3" /> APPROVAL
          </span>
        );
      case 'WARN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono badge-warn">
            <AlertTriangle className="w-3 h-3" /> WARN
          </span>
        );
      case 'ALLOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono badge-allow">
            <CheckCircle2 className="w-3 h-3" /> ALLOW
          </span>
        );
    }
  };

  const handleRunSandbox = () => {
    // Client-side simulation of the CEL deterministic precedence order
    let match: PolicyRule | null = null;
    let finalDecision: DecisionType = 'ALLOW';
    let finalReason = 'Default Clean Execution Invariant satisfied.';

    // Sort by priority ascending
    const activeRules = [...policies].filter((r) => r.enabled).sort((a, b) => a.priority - b.priority);

    for (const r of activeRules) {
      if (r.rule_id === 'POL-001' && sandboxContext.has_honey_token) {
        match = r;
        break;
      }
      if (r.rule_id === 'POL-002' && sandboxContext.has_path_traversal) {
        match = r;
        break;
      }
      if (r.rule_id === 'POL-003' && (sandboxContext.agent_status === 'QUARANTINED' || sandboxContext.agent_status === 'REVOKED')) {
        match = r;
        break;
      }
      if (r.rule_id === 'POL-004' && sandboxContext.has_dangerous_syscall) {
        match = r;
        break;
      }
      if (r.rule_id === 'POL-005' && sandboxContext.has_sql_injection) {
        match = r;
        break;
      }
      if (r.rule_id === 'POL-006' && sandboxContext.tool_name === 'execute_code' && sandboxContext.agent_role !== 'admin_coder') {
        match = r;
        break;
      }
      if (r.rule_id === 'POL-007' && !sandboxContext.is_tool_permitted) {
        match = r;
        break;
      }
      if (r.rule_id === 'POL-008' && sandboxContext.risk_score >= 70) {
        match = r;
        break;
      }
      if (r.rule_id === 'POL-009' && sandboxContext.risk_score >= 35 && sandboxContext.risk_score < 70) {
        match = r;
        break;
      }
      if (r.rule_id === 'POL-010') {
        match = r;
        break;
      }
    }

    if (match) {
      finalDecision = match.decision;
      finalReason = `Matched Rule ${match.rule_id}: ${match.name} (Priority ${match.priority})`;
    }

    setSimulatedMatch({
      matchedRule: match,
      decision: finalDecision,
      reason: finalReason,
    });
  };

  return (
    <div className="space-y-4 tab-enter">
      {/* ── Top Header Card ── */}
      <div
        className="rounded-xl border p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{ background: '#EDE8DE', borderColor: '#D6CFC3' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base tracking-tight" style={{ fontFamily: 'Space Grotesk', color: '#1E232A' }}>
                Deterministic CEL Security Policies
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-700 border-amber-500/30">
                Policy Epoch v{policyEpoch}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: '#6A5F52' }}>
              Common Expression Language rules evaluated strictly in descending order of precedence without non-deterministic LLMs in the critical path.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono" style={{ color: '#7A6F62' }}>
          <span className="px-2.5 py-1 rounded-lg border bg-[#FAF7F2] border-[#D6CFC3] font-semibold text-slate-800">
            {policies.filter((p) => p.enabled).length}/{policies.length} Active Rules
          </span>
          <span className="px-2.5 py-1 rounded-lg border bg-[#FAF7F2] border-[#D6CFC3] font-semibold text-emerald-700">
            Zero-Bypass Architecture
          </span>
        </div>
      </div>

      {/* ── Main Layout: Rules Table + Interactive Sandbox ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ── Left (7 cols): Policy Rules Matrix ── */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          {/* Filter Bar */}
          <div
            className="rounded-xl border p-3 flex flex-wrap items-center justify-between gap-3"
            style={{ background: '#EDE8DE', borderColor: '#D6CFC3' }}
          >
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search rule ID, expression, or keywords…"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="input-cyber text-xs pl-8 pr-3 py-1.5 rounded-lg w-full"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {(['ALL', 'BLOCK', 'REQUIRE_APPROVAL', 'WARN', 'ALLOW'] as const).map((dec) => (
                <button
                  key={dec}
                  onClick={() => setFilterDecision(dec)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all border cursor-pointer"
                  style={
                    filterDecision === dec
                      ? { background: '#FAF7F2', borderColor: '#B8AE9F', color: '#1E232A', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }
                      : { background: '#E4DDD2', borderColor: '#D6CFC3', color: '#6A5F52' }
                  }
                >
                  {dec === 'REQUIRE_APPROVAL' ? 'APPROVAL' : dec}
                </button>
              ))}
            </div>
          </div>

          {/* Rules List */}
          <div className="space-y-2.5">
            {filtered.map((rule) => (
              <div
                key={rule.rule_id}
                className="rounded-xl border p-3.5 transition-all hover-lift"
                style={{
                  background: rule.enabled ? '#EDE8DE' : '#E6E0D5',
                  borderColor: rule.enabled ? '#D6CFC3' : '#CCC4B8',
                  opacity: rule.enabled ? 1 : 0.65,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded border bg-[#FAF7F2] border-[#D6CFC3] text-slate-800">
                      {rule.rule_id}
                    </span>
                    <span className="font-semibold text-sm" style={{ color: '#1E232A' }}>
                      {rule.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-800 border border-amber-500/20">
                      P{rule.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {getDecisionBadge(rule.decision)}
                    <button
                      onClick={() => onTogglePolicy(rule.rule_id, !rule.enabled)}
                      className="flex items-center gap-1 text-xs font-mono font-semibold px-2 py-1 rounded-lg border transition-all cursor-pointer"
                      style={
                        rule.enabled
                          ? { background: 'rgba(5,150,105,0.1)', borderColor: 'rgba(5,150,105,0.3)', color: '#047857' }
                          : { background: 'rgba(100,100,100,0.1)', borderColor: 'rgba(100,100,100,0.2)', color: '#666' }
                      }
                      title={rule.enabled ? 'Click to disable rule' : 'Click to enable rule'}
                    >
                      {rule.enabled ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-600" />
                          <span>ARMED</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-slate-500" />
                          <span>BYPASSED</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs mt-2" style={{ color: '#5C5245' }}>
                  {rule.description}
                </p>

                {/* CEL Expression Box */}
                <div className="mt-2.5 p-2 rounded-lg bg-[#FAF7F2] border border-[#DCD4C7] flex items-center justify-between font-mono text-xs overflow-x-auto">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <code className="text-slate-800">{rule.cel_expression}</code>
                  </div>
                  <span className="text-[9px] uppercase font-bold text-slate-600 shrink-0 ml-3">
                    CEL AST COMPILED
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right (5 cols): Live CEL Sandbox Evaluator ── */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          <div
            className="rounded-xl border p-4 flex flex-col h-full"
            style={{ background: '#EDE8DE', borderColor: '#D6CFC3' }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#D6CFC3]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk', color: '#1E232A' }}>
                    CEL Rule Simulator Sandbox
                  </h3>
                  <p className="text-[10px] text-slate-700">Test activation variables against live policy precedence</p>
                </div>
              </div>
              <button
                onClick={handleRunSandbox}
                className="btn-cyber flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Evaluate
              </button>
            </div>

            {/* Sandbox Inputs */}
            <div className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-700 uppercase block mb-1">
                    Agent Status
                  </label>
                  <select
                    value={sandboxContext.agent_status}
                    onChange={(e) => setSandboxContext({ ...sandboxContext, agent_status: e.target.value })}
                    className="input-cyber w-full py-1.5 px-2.5 rounded-lg text-xs"
                  >
                    <option value="HEALTHY">HEALTHY</option>
                    <option value="SUSPICIOUS">SUSPICIOUS</option>
                    <option value="QUARANTINED">QUARANTINED</option>
                    <option value="REVOKED">REVOKED</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-700 uppercase block mb-1">
                    Tool Target
                  </label>
                  <select
                    value={sandboxContext.tool_name}
                    onChange={(e) => setSandboxContext({ ...sandboxContext, tool_name: e.target.value })}
                    className="input-cyber w-full py-1.5 px-2.5 rounded-lg text-xs"
                  >
                    <option value="read_file">read_file</option>
                    <option value="execute_code">execute_code (dynamic)</option>
                    <option value="query_db">query_db (SQL)</option>
                    <option value="shell_exec">shell_exec (CLI)</option>
                    <option value="unauthorized_api">unauthorized_api</option>
                  </select>
                </div>
              </div>

              {/* Checkbox triggers */}
              <div className="p-3 rounded-lg border bg-[#FAF7F2] border-[#D6CFC3] space-y-2">
                <span className="text-[10px] font-mono font-bold text-slate-700 uppercase block">
                  Synthetic Threat Flags
                </span>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sandboxContext.has_honey_token}
                    onChange={(e) => setSandboxContext({ ...sandboxContext, has_honey_token: e.target.checked })}
                    className="rounded border-[#B8AE9F] text-emerald-600 focus:ring-0"
                  />
                  <span className="text-slate-800">Reference Honey-Token Canary (Tripwire)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sandboxContext.has_path_traversal}
                    onChange={(e) => setSandboxContext({ ...sandboxContext, has_path_traversal: e.target.checked })}
                    className="rounded border-[#B8AE9F] text-emerald-600 focus:ring-0"
                  />
                  <span className="text-slate-800">Filesystem Traversal Sequence (<code>../../etc/shadow</code>)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sandboxContext.has_dangerous_syscall}
                    onChange={(e) => setSandboxContext({ ...sandboxContext, has_dangerous_syscall: e.target.checked })}
                    className="rounded border-[#B8AE9F] text-emerald-600 focus:ring-0"
                  />
                  <span className="text-slate-800">Destructive Syscall (<code>rm -rf /</code>, reverse shell)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sandboxContext.has_sql_injection}
                    onChange={(e) => setSandboxContext({ ...sandboxContext, has_sql_injection: e.target.checked })}
                    className="rounded border-[#B8AE9F] text-emerald-600 focus:ring-0"
                  />
                  <span className="text-slate-800">SQL Injection Tautology (<code>' OR 1=1 --</code>)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!sandboxContext.is_tool_permitted}
                    onChange={(e) => setSandboxContext({ ...sandboxContext, is_tool_permitted: !e.target.checked })}
                    className="rounded border-[#B8AE9F] text-emerald-600 focus:ring-0"
                  />
                  <span className="text-slate-800">Out of Scope / Unauthorized Capability</span>
                </label>
              </div>

              {/* Risk Slider */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="font-bold text-slate-700 uppercase">Composite Risk Score</span>
                  <span className="font-bold text-slate-900">{sandboxContext.risk_score} / 100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sandboxContext.risk_score}
                  onChange={(e) => setSandboxContext({ ...sandboxContext, risk_score: parseInt(e.target.value) })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Simulation Result */}
              {simulatedMatch && (
                <div
                  className="p-3.5 rounded-xl border mt-3 space-y-2 tab-enter"
                  style={{
                    background:
                      simulatedMatch.decision === 'BLOCK'
                        ? 'rgba(239, 68, 68, 0.08)'
                        : simulatedMatch.decision === 'REQUIRE_APPROVAL'
                        ? 'rgba(168, 85, 247, 0.08)'
                        : simulatedMatch.decision === 'WARN'
                        ? 'rgba(245, 158, 11, 0.08)'
                        : 'rgba(16, 185, 129, 0.08)',
                    borderColor:
                      simulatedMatch.decision === 'BLOCK'
                        ? 'rgba(239, 68, 68, 0.3)'
                        : simulatedMatch.decision === 'REQUIRE_APPROVAL'
                        ? 'rgba(168, 85, 247, 0.3)'
                        : simulatedMatch.decision === 'WARN'
                        ? 'rgba(245, 158, 11, 0.3)'
                        : 'rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700">
                      Evaluated Gateway Verdict
                    </span>
                    {getDecisionBadge(simulatedMatch.decision)}
                  </div>
                  <div className="font-mono text-xs font-semibold text-slate-900">
                    {simulatedMatch.reason}
                  </div>
                  {simulatedMatch.matchedRule && (
                    <div className="text-[11px] font-mono text-slate-700 bg-white/40 p-2 rounded border border-black/5">
                      Matched: <strong>{simulatedMatch.matchedRule.rule_id}</strong> — {simulatedMatch.matchedRule.cel_expression}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
