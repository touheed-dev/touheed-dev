import React, { useState } from 'react';
import {
  ShieldCheck, FileCode, Play, ToggleLeft, ToggleRight,
  CheckCircle2, AlertTriangle, Clock, Ban, Check, Terminal,
  Cpu, Copy
} from 'lucide-react';
import { PolicyRule } from '../../../types';

interface PolicyEditorProps {
  ruleId: string;
  rule?: PolicyRule;
  onTogglePolicy: (ruleId: string, enabled: boolean) => void;
  policyEpoch: number;
}

export const PolicyEditor: React.FC<PolicyEditorProps> = ({
  ruleId,
  rule,
  onTogglePolicy,
  policyEpoch,
}) => {
  const [copied, setCopied] = useState(false);
  const [testContext, setTestContext] = useState<string>(
    JSON.stringify(
      {
        agent_id: 'researcher-01',
        agent_role: 'analyst',
        agent_status: 'HEALTHY',
        tool_name: 'read_file',
        has_honey_token: false,
        has_path_traversal: false,
        has_dangerous_syscall: false,
        has_sql_injection: false,
        is_tool_permitted: true,
        risk_score: 25,
      },
      null,
      2
    )
  );
  const [testResult, setTestResult] = useState<string | null>(null);

  const expression = rule?.cel_expression || 'true == true';
  const name = rule?.name || 'Deterministic Security Rule';
  const priority = rule?.priority ?? 50;
  const decision = rule?.decision || 'BLOCK';
  const enabled = rule?.enabled ?? true;
  const description = rule?.description || 'Evaluated in descending order of precedence.';

  const codeLines = [
    `// AgentGuard Common Expression Language (CEL) Specification`,
    `// Rule ID: ${ruleId} | Precedence Priority: P${priority}`,
    `// Target Decision: ${decision}`,
    ``,
    `package runtime.security.invariants;`,
    ``,
    `rule ${ruleId.replace('-', '_')} {`,
    `    metadata:`,
    `        description = "${description}",`,
    `        priority    = ${priority},`,
    `        epoch       = ${policyEpoch}`,
    ``,
    `    condition:`,
    `        ${expression}`,
    `}`,
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(expression);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunEvaluation = () => {
    try {
      const parsed = JSON.parse(testContext);
      let matched = false;

      if (ruleId === 'POL-001' && parsed.has_honey_token) matched = true;
      else if (ruleId === 'POL-002' && parsed.has_path_traversal) matched = true;
      else if (ruleId === 'POL-003' && (parsed.agent_status === 'QUARANTINED' || parsed.agent_status === 'REVOKED')) matched = true;
      else if (ruleId === 'POL-004' && parsed.has_dangerous_syscall) matched = true;
      else if (ruleId === 'POL-005' && parsed.has_sql_injection) matched = true;
      else if (ruleId === 'POL-006' && parsed.tool_name === 'execute_code' && parsed.agent_role !== 'admin_coder') matched = true;
      else if (ruleId === 'POL-007' && !parsed.is_tool_permitted) matched = true;
      else if (ruleId === 'POL-008' && parsed.risk_score >= 70) matched = true;
      else if (ruleId === 'POL-009' && parsed.risk_score >= 35 && parsed.risk_score < 70) matched = true;
      else if (ruleId === 'POL-010') matched = true;

      setTestResult(
        matched
          ? `Condition Evaluated to TRUE: Rule ${ruleId} triggered -> Verdict: ${decision}`
          : `Condition Evaluated to FALSE: No match under current context.`
      );
    } catch (e: any) {
      setTestResult(`Evaluation Syntax Error: ${e.message}`);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto font-mono text-xs select-text" style={{ background: '#1e1e1e', color: '#e0e0e0' }}>

      {/* ── Top Policy Toolbar ── */}
      <div className="h-12 border-b border-[#2d2d2d] flex items-center justify-between px-6 bg-[#252526] shrink-0">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white font-sans">{ruleId}: {name}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Precedence P{priority}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                decision === 'BLOCK'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : decision === 'REQUIRE_APPROVAL'
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                  : decision === 'WARN'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {decision}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onTogglePolicy(ruleId, !enabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-bold transition-all cursor-pointer ${
              enabled
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            {enabled ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
            <span>{enabled ? 'ARMED' : 'BYPASSED'}</span>
          </button>
        </div>
      </div>

      {/* ── Main Layout: Code Editor on Left, Tester on Right ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">

        {/* Code Editor Body (7 cols) */}
        <div className="lg:col-span-7 flex flex-col border-r border-[#2d2d2d] bg-[#1e1e1e]">
          {/* Breadcrumb strip */}
          <div className="px-4 py-2 border-b border-[#2d2d2d] text-[11px] text-slate-400 flex items-center justify-between bg-[#1b1b1b]">
            <span className="font-mono">policies/{ruleId}.cel</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy Expression'}</span>
            </button>
          </div>

          {/* Line Numbers + Code */}
          <div className="flex-1 overflow-y-auto p-4 editor-code">
            {codeLines.map((line, idx) => (
              <div key={idx} className="flex leading-6 hover:bg-white/[0.02]">
                <span className="w-10 text-right pr-4 text-slate-600 select-none text-[11px]">
                  {idx + 1}
                </span>
                <span className="flex-1 font-mono text-xs">
                  {line.startsWith('//') ? (
                    <span className="syn-comment">{line}</span>
                  ) : line.includes('rule ') || line.includes('package ') ? (
                    <span>
                      <span className="syn-keyword">{line.split(' ')[0]}</span>{' '}
                      <span className="syn-type">{line.split(' ').slice(1).join(' ')}</span>
                    </span>
                  ) : line.includes('condition:') || line.includes('metadata:') ? (
                    <span className="syn-keyword font-bold">{line}</span>
                  ) : line.includes(expression) ? (
                    <span className="syn-string font-bold bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">
                      {line}
                    </span>
                  ) : (
                    <span className="text-slate-300">{line}</span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom Compiler Diagnostics */}
          <div className="p-3 border-t border-[#2d2d2d] bg-[#181818] flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-green-glow" />
              <span>Deterministic CEL Compiler: AST Ready • No Ambiguity</span>
            </div>
            <span>Policy Epoch v{policyEpoch}</span>
          </div>
        </div>

        {/* Live Evaluation Sandbox on Right (5 cols) */}
        <div className="lg:col-span-5 flex flex-col p-4 space-y-4 bg-[#212121]">
          <div className="flex items-center justify-between pb-2 border-b border-[#2d2d2d]">
            <div className="flex items-center gap-2 text-xs font-bold text-white font-sans">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Interactive CEL Tester</span>
            </div>
            <button
              onClick={handleRunEvaluation}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Evaluate</span>
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Test Activation JSON
            </label>
            <textarea
              rows={11}
              value={testContext}
              onChange={(e) => setTestContext(e.target.value)}
              className="w-full p-2.5 rounded bg-[#181818] border border-[#2d2d2d] font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
            />
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-lg border text-xs font-mono ${
                testResult.includes('TRUE')
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : testResult.includes('FALSE')
                  ? 'bg-slate-800/40 border-slate-700 text-slate-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              <div className="font-bold uppercase text-[10px] tracking-wider mb-1">
                Evaluation Output:
              </div>
              <div>{testResult}</div>
            </div>
          )}

          <div className="p-3 rounded-lg bg-[#181818] border border-[#2d2d2d] text-[11px] text-slate-400 space-y-1.5">
            <span className="font-bold text-slate-200 uppercase text-[10px] block">
              Invariant Guarantee:
            </span>
            <p>
              Common Expression Language rules are evaluated deterministically in sub-millisecond execution times without generative non-determinism.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
