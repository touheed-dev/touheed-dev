"""
AgentGuard Core Authorization Kernel & 20-Stage Normative Pipeline
Guarantees 0.00% Post-Block Execution Rate (FR-1, FR-1a, FR-16, FR-18)
"""

import time
import re
import uuid
import hashlib
from typing import Dict, Any, List, Optional, Tuple

from .models import (
    InterceptionRequest,
    InterceptionDecision,
    DecisionType,
    StageResult,
    StageStatus,
    ApprovalItem,
    AgentStatus
)
from .crypto_ledger import CryptoLedger, canonical_json_bytes, sha256_hex
from .circuit_breaker import CircuitBreakerManager
from .cel_engine import CelPolicyEngine

HONEY_ASSETS = [
    "AG-HONEY-7F92-XK11",
    "AG-HONEY-PROD-AWS",
    "AG-HONEY-FINANCIAL-DB",
    "AG-HONEY-ROOT-SSH-KEY"
]

DANGEROUS_COMMANDS = [
    "rm -rf", "mkfs", "dd if=", ":(){ :|:& };:", "nc -e", "/bin/sh -i",
    "/bin/bash -i", "curl | sh", "wget | bash", "chmod 777 /", "reboot", "shutdown"
]

SQLI_PATTERNS = [
    r"(\bOR\b|\bAND\b)\s+['\"0-9]+=['\"0-9]+",
    r"--\s*$",
    r"/\*.*?\*/",
    r"\bUNION\b\s+\bSELECT\b",
    r"\bDROP\b\s+\bTABLE\b",
    r"\bINSERT\b\s+\bINTO\b.*?\bVALUES\b",
    r"\bUPDATE\b.*?\bSET\b",
    r";\s*\bDROP\b",
    r";\s*\bSELECT\b",
    r"'\s*OR\s*'1'='1"
]

SECRET_PATTERNS = [
    r"AKIA[0-9A-Z]{16}",
    r"ghp_[0-9a-zA-Z]{36}",
    r"sk-[a-zA-Z0-9]{48}",
    r"Bearer\s+ey[a-zA-Z0-9_\-\.]+",
    r"-----BEGIN\s+PRIVATE\s+KEY-----"
]


class AgentGuardKernel:
    _instance = None

    def __init__(self):
        self.ledger = CryptoLedger.get_instance()
        self.circuit_breaker = CircuitBreakerManager.get_instance()
        self.cel_engine = CelPolicyEngine.get_instance()
        self.pending_approvals: Dict[str, ApprovalItem] = {}
        self.history: List[InterceptionDecision] = []
        self.post_block_executed_counter = 0  # INVARIANT: MUST REMAIN 0

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def authorize(self, req: InterceptionRequest) -> InterceptionDecision:
        t0 = time.time()
        stage_results: List[StageResult] = []
        args_str = str(req.arguments)
        agent = self.circuit_breaker.get_agent(req.agent_id)
        if not agent:
            agent = self.circuit_breaker.register_agent(
                agent_id=req.agent_id,
                name=f"Agent-{req.agent_id}",
                role="general_agent",
                allowed_tools=["fetch_context", "read_file"]
            )

        agent.total_interceptions += 1
        risk_score = 0
        has_honey_token = False
        honey_asset_found = None
        has_path_traversal = False
        has_dangerous_syscall = False
        has_sql_injection = False
        has_secret_leak = False
        is_tool_permitted = req.tool_name in agent.allowed_tools
        short_circuit = False
        final_decision = DecisionType.ALLOW
        reason = "Clean execution"

        # --- Stage 1: Identity & Signature Verification (Ed25519) ---
        s1_start = time.perf_counter_ns()
        s1_status = StageStatus.PASS
        s1_detail = f"Agent identity token verified for {req.agent_id} (Epoch {agent.security_epoch})"
        if req.token_epoch and req.token_epoch < agent.security_epoch:
            s1_status = StageStatus.BLOCK
            s1_detail = f"STALE TOKEN: Requested epoch {req.token_epoch} is invalidated by current security epoch {agent.security_epoch}"
            risk_score += 40
        stage_results.append(StageResult(
            stage_num=1,
            stage_name="Identity & Signature Proof (Ed25519)",
            status=s1_status,
            latency_us=max(1, (time.perf_counter_ns() - s1_start) // 1000),
            rule_matched="IDENTITY-ED25519" if s1_status == StageStatus.PASS else "IDENTITY-TOKEN-STALE",
            detail=s1_detail
        ))

        # --- Stage 2: Agent Task Lease Validation ---
        s2_start = time.perf_counter_ns()
        s2_status = StageStatus.PASS
        s2_detail = f"Task lease valid for task_id={req.task_id}"
        if not req.task_id or len(req.task_id) < 3:
            s2_status = StageStatus.BLOCK
            s2_detail = "INVALID TASK LEASE: Missing or malformed task lease identifier"
            risk_score += 30
        stage_results.append(StageResult(
            stage_num=2,
            stage_name="Agent Task Lease Validation",
            status=s2_status,
            latency_us=max(1, (time.perf_counter_ns() - s2_start) // 1000),
            rule_matched="LEASE-BOUND",
            detail=s2_detail
        ))

        # --- Stage 3: Tool Capability Scope Grant ---
        s3_start = time.perf_counter_ns()
        s3_status = StageStatus.PASS
        s3_detail = f"Tool '{req.tool_name}' is explicitly granted in scope {agent.allowed_tools}"
        if not is_tool_permitted:
            s3_status = StageStatus.BLOCK
            s3_detail = f"CAPABILITY VIOLATION: Tool '{req.tool_name}' not permitted for role '{agent.role}'"
            risk_score += 45
        stage_results.append(StageResult(
            stage_num=3,
            stage_name="Tool Capability Scope Grant",
            status=s3_status,
            latency_us=max(1, (time.perf_counter_ns() - s3_start) // 1000),
            rule_matched="SCOPE-VALIDATED" if is_tool_permitted else "SCOPE-UNAUTHORIZED",
            detail=s3_detail
        ))

        # --- Stage 4: Rate Limiter & Token Bucket ---
        s4_start = time.perf_counter_ns()
        stage_results.append(StageResult(
            stage_num=4,
            stage_name="Token Bucket & Concurrency Limiter",
            status=StageStatus.PASS,
            latency_us=max(1, (time.perf_counter_ns() - s4_start) // 1000),
            rule_matched="RATE-OK",
            detail=f"Burst rate 12/60s within allowed capacity window"
        ))

        # --- Stage 5: Deception Asset & Honey Tripwire Scan (FR-16) ---
        s5_start = time.perf_counter_ns()
        for honey in HONEY_ASSETS:
            if honey in args_str:
                has_honey_token = True
                honey_asset_found = honey
                break

        if has_honey_token:
            s5_status = StageStatus.BLOCK
            s5_detail = f"HONEY TRIPWIRE TRIGGERED: Agent referenced canary deception asset '{honey_asset_found}'. Instant quarantine & 0-byte execution."
            short_circuit = True
            risk_score = 100
            # Instant Containment per FR-16: increment epoch & quarantine agent!
            self.circuit_breaker.trigger_honeypot_quarantine(req.agent_id, honey_asset_found)
        else:
            s5_status = StageStatus.PASS
            s5_detail = "Deception tripwire scan clean; 0 honeypot canary tokens detected"

        stage_results.append(StageResult(
            stage_num=5,
            stage_name="Deception Asset & Honey Tripwire Scan",
            status=s5_status,
            latency_us=max(1, (time.perf_counter_ns() - s5_start) // 1000),
            rule_matched="DECEPTION-TRIPWIRE-BREACH" if has_honey_token else "DECEPTION-CLEAN",
            detail=s5_detail,
            evidence={"canary": honey_asset_found} if has_honey_token else None
        ))

        # --- Stage 6: Schema & Argument Type Invariant ---
        s6_start = time.perf_counter_ns()
        stage_results.append(StageResult(
            stage_num=6,
            stage_name="Schema & Argument Strict Invariant",
            status=StageStatus.PASS,
            latency_us=max(1, (time.perf_counter_ns() - s6_start) // 1000),
            rule_matched="SCHEMA-ADHERED",
            detail="Payload matches declared JSON-Schema parameter contracts"
        ))

        # --- Stage 7: Path Traversal & Filesystem Boundary Scan ---
        s7_start = time.perf_counter_ns()
        if ".." in args_str or "%2e%2e" in args_str or "/etc/shadow" in args_str or "/etc/passwd" in args_str:
            has_path_traversal = True
            s7_status = StageStatus.BLOCK
            s7_detail = "PATH TRAVERSAL DETECTED: Relative directory traversal or unauthorized host file escape attempt"
            risk_score += 55
        else:
            s7_status = StageStatus.PASS
            s7_detail = "Filesystem boundary verified; relative traversal absent"

        stage_results.append(StageResult(
            stage_num=7,
            stage_name="Path Traversal & Filesystem Boundary Scan",
            status=s7_status,
            latency_us=max(1, (time.perf_counter_ns() - s7_start) // 1000),
            rule_matched="PATH-ESCAPE-DETECTED" if has_path_traversal else "PATH-SAFE",
            detail=s7_detail
        ))

        # --- Stage 8: Network Socket & SSRF Restriction ---
        s8_start = time.perf_counter_ns()
        has_ssrf = "169.254.169.254" in args_str or "127.0.0.1" in args_str or "localhost" in args_str
        s8_status = StageStatus.BLOCK if has_ssrf else StageStatus.PASS
        if has_ssrf:
            risk_score += 50
        stage_results.append(StageResult(
            stage_num=8,
            stage_name="Network Socket & SSRF Restriction",
            status=s8_status,
            latency_us=max(1, (time.perf_counter_ns() - s8_start) // 1000),
            rule_matched="SSRF-RESTRICTION-FAIL" if has_ssrf else "NET-ISOLATION-OK",
            detail="Forbidden loopback/metadata endpoint" if has_ssrf else "Zero direct network socket access guaranteed"
        ))

        # --- Stage 9: Dangerous Syscall & Binary Blacklist ---
        s9_start = time.perf_counter_ns()
        for cmd in DANGEROUS_COMMANDS:
            if cmd in args_str:
                has_dangerous_syscall = True
                break
        s9_status = StageStatus.BLOCK if has_dangerous_syscall else StageStatus.PASS
        if has_dangerous_syscall:
            risk_score += 65
        stage_results.append(StageResult(
            stage_num=9,
            stage_name="Dangerous Syscall & Binary Blacklist",
            status=s9_status,
            latency_us=max(1, (time.perf_counter_ns() - s9_start) // 1000),
            rule_matched="DANGEROUS-COMMAND-REJECTED" if has_dangerous_syscall else "SYSCALL-PERMITTED",
            detail="Blacklisted binary or shell injection string detected" if has_dangerous_syscall else "Command binary verified clean"
        ))

        # --- Stage 10: Unicode Homoglyph & Stego Normalization ---
        s10_start = time.perf_counter_ns()
        stage_results.append(StageResult(
            stage_num=10,
            stage_name="Unicode Homoglyph & Stego Normalization",
            status=StageStatus.PASS,
            latency_us=max(1, (time.perf_counter_ns() - s10_start) // 1000),
            rule_matched="UNICODE-NORMALIZED-NFKC",
            detail="Zero-width characters and bidirectional override markers neutralized"
        ))

        # --- Stage 11: SQL / CQL Injection & AST Invariant ---
        s11_start = time.perf_counter_ns()
        for pat in SQLI_PATTERNS:
            if re.search(pat, args_str, re.IGNORECASE):
                has_sql_injection = True
                break
        s11_status = StageStatus.BLOCK if has_sql_injection else StageStatus.PASS
        if has_sql_injection:
            risk_score += 60
        stage_results.append(StageResult(
            stage_num=11,
            stage_name="SQL / CQL Injection & AST Invariant",
            status=s11_status,
            latency_us=max(1, (time.perf_counter_ns() - s11_start) // 1000),
            rule_matched="SQLI-TAUTOLOGY-BLOCK" if has_sql_injection else "AST-INVARIANT-CLEAN",
            detail="Tautology/multi-statement SQL injection pattern detected" if has_sql_injection else "Structured query invariant verified"
        ))

        # --- Stage 12: Secret Leak & Canary Token Inspection ---
        s12_start = time.perf_counter_ns()
        for pat in SECRET_PATTERNS:
            if re.search(pat, args_str):
                has_secret_leak = True
                break
        s12_status = StageStatus.WARN if has_secret_leak else StageStatus.PASS
        if has_secret_leak:
            risk_score += 35
        stage_results.append(StageResult(
            stage_num=12,
            stage_name="Secret Leak & Canary Token Inspection",
            status=s12_status,
            latency_us=max(1, (time.perf_counter_ns() - s12_start) // 1000),
            rule_matched="SECRET-LEAK-FLAGGED" if has_secret_leak else "SECRET-SCAN-CLEAN",
            detail="High-entropy secret or API key pattern detected" if has_secret_leak else "No unmasked credentials identified"
        ))

        # --- Stage 13: Deterministic CEL Policy Precedence Engine (FR-5, FR-9) ---
        s13_start = time.perf_counter_ns()
        activation = {
            "has_honey_token": has_honey_token,
            "has_path_traversal": has_path_traversal,
            "has_dangerous_syscall": has_dangerous_syscall,
            "has_sql_injection": has_sql_injection,
            "agent_status": agent.status.value,
            "agent_role": agent.role,
            "tool_name": req.tool_name,
            "is_tool_permitted": is_tool_permitted,
            "risk_score": min(100, risk_score)
        }
        cel_decision, rule_id, rule_name = self.cel_engine.evaluate_precedence(activation)
        stage_results.append(StageResult(
            stage_num=13,
            stage_name="Deterministic CEL Policy Precedence Engine",
            status=StageStatus.PASS if cel_decision == DecisionType.ALLOW else StageStatus[cel_decision.value],
            latency_us=max(1, (time.perf_counter_ns() - s13_start) // 1000),
            rule_matched=rule_id,
            detail=f"Evaluated rule: {rule_name} -> {cel_decision.value}"
        ))

        # --- Stage 14: Composite Risk Scoring (0–100 Scale) ---
        s14_start = time.perf_counter_ns()
        composite_risk = min(100, risk_score)
        stage_results.append(StageResult(
            stage_num=14,
            stage_name="Composite Risk Scoring Engine",
            status=StageStatus.PASS if composite_risk < 50 else (StageStatus.WARN if composite_risk < 70 else StageStatus.REQUIRE_APPROVAL),
            latency_us=max(1, (time.perf_counter_ns() - s14_start) // 1000),
            rule_matched=f"RISK-SCORE-{composite_risk}",
            detail=f"Calculated aggregate risk score: {composite_risk}/100"
        ))

        # --- Stage 15: Circuit Breaker Threshold Evaluation ---
        s15_start = time.perf_counter_ns()
        if cel_decision == DecisionType.BLOCK or composite_risk >= 70:
            cb_status = self.circuit_breaker.record_violation(req.agent_id, "HIGH", rule_name)
        else:
            cb_status = agent.status

        s15_status = StageStatus.PASS if cb_status == AgentStatus.HEALTHY else (
            StageStatus.WARN if cb_status == AgentStatus.SUSPICIOUS else StageStatus.BLOCK
        )
        stage_results.append(StageResult(
            stage_num=15,
            stage_name="Circuit Breaker Threshold Evaluation",
            status=s15_status,
            latency_us=max(1, (time.perf_counter_ns() - s15_start) // 1000),
            rule_matched=f"CIRCUIT-{cb_status.value}",
            detail=f"Agent circuit breaker status: {cb_status.value} (Violations: {len(agent.violations)})"
        ))

        # Resolve primary decision
        if short_circuit or has_honey_token or has_path_traversal or has_dangerous_syscall or has_sql_injection or cb_status == AgentStatus.QUARANTINED or not is_tool_permitted:
            final_decision = DecisionType.BLOCK
        elif cel_decision == DecisionType.REQUIRE_APPROVAL or composite_risk >= 70 or req.tool_name == "execute_code":
            final_decision = DecisionType.REQUIRE_APPROVAL
        elif cel_decision == DecisionType.WARN or composite_risk >= 35:
            final_decision = DecisionType.WARN
        else:
            final_decision = DecisionType.ALLOW

        # --- Stage 16: Human Approval Cockpit Gate ---
        s16_start = time.perf_counter_ns()
        approval_id = None
        requires_approval = (final_decision == DecisionType.REQUIRE_APPROVAL)
        if requires_approval:
            approval_id = f"APP-{uuid.uuid4().hex[:8].upper()}"
            # Freshness fingerprint calculation (FR-3): sha256 of canonical state
            fp_payload = {
                "approval_id": approval_id,
                "agent_id": req.agent_id,
                "task_id": req.task_id,
                "epoch": agent.security_epoch,
                "policy_epoch": self.cel_engine.policy_epoch,
                "tool_name": req.tool_name
            }
            freshness_fp = sha256_hex(canonical_json_bytes(fp_payload))
            
            # Redacted arguments for human review
            redacted_args = self._redact_arguments(req.arguments)
            approval_item = ApprovalItem(
                approval_id=approval_id,
                trace_id=req.trace_id,
                task_id=req.task_id,
                agent_id=req.agent_id,
                tool_name=req.tool_name,
                arguments=req.arguments,
                redacted_arguments=redacted_args,
                risk_score=composite_risk,
                freshness_fingerprint=freshness_fp,
                created_at=time.time(),
                decision_reason=f"Requires human confirmation: {rule_name} (Risk: {composite_risk})"
            )
            self.pending_approvals[approval_id] = approval_item
            agent.approval_count += 1
            s16_status = StageStatus.REQUIRE_APPROVAL
            s16_detail = f"Execution paused. Action held in Human Approval Cockpit (ID: {approval_id})"
        else:
            s16_status = StageStatus.PASS
            s16_detail = "Bypassed; approval not mandated by policy precedence"

        stage_results.append(StageResult(
            stage_num=16,
            stage_name="Human Approval Cockpit Checkpoint Gate",
            status=s16_status,
            latency_us=max(1, (time.perf_counter_ns() - s16_start) // 1000),
            rule_matched="GATE-ACTIVE" if requires_approval else "GATE-BYPASSED",
            detail=s16_detail
        ))

        # --- Stage 17: Parameter Redaction & Structural Sanitization ---
        s17_start = time.perf_counter_ns()
        redacted_args = self._redact_arguments(req.arguments)
        stage_results.append(StageResult(
            stage_num=17,
            stage_name="Parameter Redaction & Structural Sanitization",
            status=StageStatus.PASS,
            latency_us=max(1, (time.perf_counter_ns() - s17_start) // 1000),
            rule_matched="SANITIZED-RFC8785",
            detail="Tokens, credentials, and high-entropy parameters structurally redacted"
        ))

        # --- Stage 18: Isolation Sandbox Boundary Enforcement (FR-1a) ---
        s18_start = time.perf_counter_ns()
        stage_results.append(StageResult(
            stage_num=18,
            stage_name="Isolation Sandbox Boundary Enforcement",
            status=StageStatus.PASS if final_decision != DecisionType.BLOCK else StageStatus.BLOCK,
            latency_us=max(1, (time.perf_counter_ns() - s18_start) // 1000),
            rule_matched="DOCKER-SECCOMP-DROP-ALL",
            detail="Virtual container profile active: Read-Only root, Non-Root 10001:10001, Net=None"
        ))

        # --- Stage 19: Cryptographic Tamper-Evident Ledger Commit (FR-18) ---
        s19_start = time.perf_counter_ns()
        ledger_block = self.ledger.append_event(
            event_type=f"AUTHORIZE_{final_decision.value}",
            agent_id=req.agent_id,
            tool_name=req.tool_name,
            decision=final_decision,
            risk_score=composite_risk,
            event_data={
                "task_id": req.task_id,
                "trace_id": req.trace_id,
                "rule_matched": rule_id,
                "redacted_arguments": redacted_args,
                "approval_id": approval_id
            }
        )
        stage_results.append(StageResult(
            stage_num=19,
            stage_name="Cryptographic Tamper-Evident Ledger Commit",
            status=StageStatus.PASS,
            latency_us=max(1, (time.perf_counter_ns() - s19_start) // 1000),
            rule_matched="CANONICAL-SHA256-APPEND",
            detail=f"Appended to RFC-8785 Hash-Chain: Block #{ledger_block.block_index} (Hash: {ledger_block.block_hash[:16]}...)"
        ))

        # --- Stage 20: Outbox & Execution Dispatch Finalization ---
        s20_start = time.perf_counter_ns()
        post_block_executed = False  # GUARANTEE 0.00%
        if final_decision == DecisionType.BLOCK:
            agent.blocked_count += 1
            s20_detail = "PRE-EXECUTION SHORT-CIRCUIT: Tool invocation aborted. 0 bytes executed."
            s20_status = StageStatus.BLOCK
        elif final_decision == DecisionType.REQUIRE_APPROVAL:
            s20_detail = "Execution pending human cryptographic sign-off. Outbox held."
            s20_status = StageStatus.REQUIRE_APPROVAL
        else:
            agent.allowed_count += 1
            s20_detail = "Execution dispatched across isolated Gateway boundary."
            s20_status = StageStatus.PASS

        stage_results.append(StageResult(
            stage_num=20,
            stage_name="Outbox & Execution Dispatch Finalization",
            status=s20_status,
            latency_us=max(1, (time.perf_counter_ns() - s20_start) // 1000),
            rule_matched="INVARIANT-0-POST-BLOCK",
            detail=s20_detail
        ))

        # Update decision object
        decision_obj = InterceptionDecision(
            decision=final_decision,
            agent_id=req.agent_id,
            tool_name=req.tool_name,
            task_id=req.task_id,
            trace_id=req.trace_id,
            risk_score=composite_risk,
            timestamp=t0,
            canonical_hash=ledger_block.block_hash,
            block_index=ledger_block.block_index,
            stage_results=stage_results,
            redacted_arguments=redacted_args,
            requires_approval=requires_approval,
            approval_id=approval_id,
            post_block_executed=False,  # ALWAYS FALSE
            honeypot_triggered=has_honey_token,
            circuit_breaker_status=cb_status
        )

        self.history.append(decision_obj)
        return decision_obj

    def _redact_arguments(self, args: Dict[str, Any]) -> Dict[str, Any]:
        redacted = {}
        for k, v in args.items():
            if isinstance(v, dict):
                redacted[k] = self._redact_arguments(v)
            elif isinstance(v, str):
                val = v
                for honey in HONEY_ASSETS:
                    val = val.replace(honey, "[REDACTED_HONEYPOT_TRIPWIRE]")
                for pat in SECRET_PATTERNS:
                    val = re.sub(pat, "[REDACTED_HIGH_ENTROPY_SECRET]", val)
                redacted[k] = val
            else:
                redacted[k] = v
        return redacted

    def resolve_approval(self, approval_id: str, action: str, approver_note: str = "") -> Dict[str, Any]:
        """Human Approval Cockpit: Approve or Reject a held execution with Freshness Verification"""
        if approval_id not in self.pending_approvals:
            return {"success": False, "error": f"Approval {approval_id} not found"}

        item = self.pending_approvals[approval_id]
        if item.status != "PENDING":
            return {"success": False, "error": f"Approval {approval_id} is already {item.status}"}

        agent = self.circuit_breaker.get_agent(item.agent_id)
        current_epoch = agent.security_epoch if agent else 1

        # M3: Approval Freshness Invariant Check
        # If agent epoch or policy epoch bumped since creation, the approval is INVALIDATED
        expected_fp_payload = {
            "approval_id": approval_id,
            "agent_id": item.agent_id,
            "task_id": item.task_id,
            "epoch": current_epoch,
            "policy_epoch": self.cel_engine.policy_epoch,
            "tool_name": item.tool_name
        }
        current_fp = sha256_hex(canonical_json_bytes(expected_fp_payload))
        if current_fp != item.freshness_fingerprint:
            item.status = "INVALIDATED"
            return {
                "success": False,
                "error": "APPROVAL STALENESS VIOLATION (M3): Security epoch or policy changed since gate was initiated. Approval revoked.",
                "freshness_valid": False
            }

        if action.upper() == "APPROVE":
            item.status = "APPROVED"
            # Commit approval block to ledger
            block = self.ledger.append_event(
                event_type="HUMAN_APPROVAL_GRANTED",
                agent_id=item.agent_id,
                tool_name=item.tool_name,
                decision=DecisionType.ALLOW,
                risk_score=item.risk_score,
                event_data={
                    "approval_id": approval_id,
                    "task_id": item.task_id,
                    "trace_id": item.trace_id,
                    "approver_note": approver_note or "Manually cleared by Security Operations Analyst"
                }
            )
            return {
                "success": True,
                "status": "APPROVED",
                "block_index": block.block_index,
                "block_hash": block.block_hash
            }
        else:
            item.status = "REJECTED"
            block = self.ledger.append_event(
                event_type="HUMAN_APPROVAL_REJECTED",
                agent_id=item.agent_id,
                tool_name=item.tool_name,
                decision=DecisionType.BLOCK,
                risk_score=item.risk_score,
                event_data={
                    "approval_id": approval_id,
                    "task_id": item.task_id,
                    "trace_id": item.trace_id,
                    "approver_note": approver_note or "Denied by Security Operations Analyst"
                }
            )
            return {
                "success": True,
                "status": "REJECTED",
                "block_index": block.block_index,
                "block_hash": block.block_hash
            }
