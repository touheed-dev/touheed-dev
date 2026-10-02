"""
AgentGuard Deterministic CEL Policy Precedence Engine (FR-5, FR-9)
Executes Common Expression Language without LLMs in the decision path
"""

import threading
from typing import List, Dict, Any, Tuple
import celpy

from .models import DecisionType


class PolicyRule:
    def __init__(self, rule_id: str, name: str, cel_expression: str, decision: DecisionType, priority: int, description: str):
        self.rule_id = rule_id
        self.name = name
        self.cel_expression = cel_expression
        self.decision = decision
        self.priority = priority  # lower number = higher precedence
        self.description = description
        self.enabled = True
        self._compiled_program = None
        self._compile()

    def _compile(self):
        try:
            env = celpy.Environment()
            ast = env.compile(self.cel_expression)
            self._compiled_program = env.program(ast)
        except Exception as e:
            print(f"Warning: Failed to compile CEL expression for {self.rule_id}: {e}")
            self._compiled_program = None

    def evaluate(self, activation_dict: Dict[str, Any]) -> bool:
        if not self.enabled:
            return False
        if self._compiled_program is None:
            self._compile()
            if self._compiled_program is None:
                return False
        try:
            cel_activation = celpy.json_to_cel(activation_dict)
            res = self._compiled_program.evaluate(cel_activation)
            return bool(res)
        except Exception as e:
            # Deterministic fail-safe fallback
            return False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "name": self.name,
            "cel_expression": self.cel_expression,
            "decision": self.decision.value,
            "priority": self.priority,
            "description": self.description,
            "enabled": self.enabled
        }


class CelPolicyEngine:
    _instance = None
    _lock = threading.Lock()

    def __init__(self):
        self.rules: List[PolicyRule] = []
        self._mutex = threading.Lock()
        self.policy_epoch = 1
        self._init_default_rules()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def _init_default_rules(self):
        default_specs = [
            (
                "POL-001",
                "Honey Deception Tripwire Containment",
                'has_honey_token == true',
                DecisionType.BLOCK,
                10,
                "Strict short-circuit block if any honeypot canary asset is referenced in arguments"
            ),
            (
                "POL-002",
                "Filesystem Directory Traversal Defense",
                'has_path_traversal == true',
                DecisionType.BLOCK,
                20,
                "Fail-closed on relative path traversal sequence (../) or unauthorized filesystem root escape"
            ),
            (
                "POL-003",
                "Quarantine State Enforcement",
                'agent_status == "QUARANTINED" || agent_status == "REVOKED"',
                DecisionType.BLOCK,
                30,
                "Revoke tool execution access for agents currently under quarantine or revocation"
            ),
            (
                "POL-004",
                "Dangerous Syscall & Binary Blacklist",
                'has_dangerous_syscall == true',
                DecisionType.BLOCK,
                40,
                "Forbid shell commands executing destructive utilities (rm -rf, mkfs, reverse shell)"
            ),
            (
                "POL-005",
                "SQL Injection & AST Tautology Invariant",
                'has_sql_injection == true',
                DecisionType.BLOCK,
                45,
                "Block SQL queries containing SQLi signatures, tautologies, or unauthorized DDL drops"
            ),
            (
                "POL-006",
                "High-Impact Code Execution Approval Gate",
                'tool_name == "execute_code" && agent_role != "admin_coder"',
                DecisionType.REQUIRE_APPROVAL,
                50,
                "Require Human Approval Cockpit sign-off prior to executing dynamic arbitrary code"
            ),
            (
                "POL-007",
                "Capability Scope Boundary",
                'is_tool_permitted == false',
                DecisionType.BLOCK,
                60,
                "Reject invocations of tools outside the agent\'s explicitly declared capability scope"
            ),
            (
                "POL-008",
                "Composite Risk Threshold Gate",
                'risk_score >= 70',
                DecisionType.REQUIRE_APPROVAL,
                70,
                "Route actions with composite risk score of 70 or higher to human approval cockpit"
            ),
            (
                "POL-009",
                "Suspicious Activity Warning",
                'risk_score >= 35 && risk_score < 70',
                DecisionType.WARN,
                80,
                "Flag telemetry warning on elevated risk score between 35 and 69"
            ),
            (
                "POL-010",
                "Default Clean Execution Invariant",
                'true == true',
                DecisionType.ALLOW,
                100,
                "Permit clean, validated invocations adhering to all strict invariants"
            )
        ]

        for rid, name, expr, dec, prio, desc in default_specs:
            self.rules.append(PolicyRule(rid, name, expr, dec, prio, desc))

        self.rules.sort(key=lambda r: r.priority)

    def evaluate_precedence(self, activation_dict: Dict[str, Any]) -> Tuple[DecisionType, str, str]:
        with self._mutex:
            for rule in self.rules:
                if rule.enabled and rule.evaluate(activation_dict):
                    return rule.decision, rule.rule_id, rule.name
            return DecisionType.ALLOW, "POL-DEFAULT", "Default Permissive Invariant"

    def get_all_rules(self) -> List[Dict[str, Any]]:
        with self._mutex:
            return [r.to_dict() for r in self.rules]

    def update_rule(self, rule_id: str, enabled: bool) -> bool:
        with self._mutex:
            for r in self.rules:
                if r.rule_id == rule_id:
                    r.enabled = enabled
                    self.policy_epoch += 1
                    return True
            return False
