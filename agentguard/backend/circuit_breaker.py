"""
AgentGuard Circuit Breaker & Agent Identity Registry
Tracks rolling violation windows, security epochs, and autonomous quarantine
"""

import time
import threading
from typing import Dict, List, Optional, Any
from .models import AgentStatus


class AgentRecord:
    def __init__(self, agent_id: str, name: str, role: str, allowed_tools: List[str]):
        self.agent_id = agent_id
        self.name = name
        self.role = role
        self.allowed_tools = allowed_tools
        self.status: AgentStatus = AgentStatus.HEALTHY
        self.security_epoch: int = 1
        self.created_at: float = time.time()
        self.violations: List[float] = []  # timestamps of violations
        self.quarantine_reason: Optional[str] = None
        self.total_interceptions: int = 0
        self.blocked_count: int = 0
        self.allowed_count: int = 0
        self.approval_count: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "role": self.role,
            "allowed_tools": self.allowed_tools,
            "status": self.status.value,
            "security_epoch": self.security_epoch,
            "created_at": self.created_at,
            "active_violations_60s": len([t for t in self.violations if time.time() - t <= 60.0]),
            "quarantine_reason": self.quarantine_reason,
            "total_interceptions": self.total_interceptions,
            "blocked_count": self.blocked_count,
            "allowed_count": self.allowed_count,
            "approval_count": self.approval_count
        }


class CircuitBreakerManager:
    _instance = None
    _lock = threading.Lock()

    def __init__(self):
        self.agents: Dict[str, AgentRecord] = {}
        self._mutex = threading.Lock()
        self._init_default_roster()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def _init_default_roster(self):
        # Default agents per PRD
        self.register_agent(
            agent_id="planner-01",
            name="Planner Autonomous Agent",
            role="planner",
            allowed_tools=["fetch_context", "summarize_plan", "read_file", "search_knowledge"]
        )
        self.register_agent(
            agent_id="researcher-01",
            name="Web & Data Researcher",
            role="researcher",
            allowed_tools=["query_database", "search_web", "parse_document", "read_file"]
        )
        self.register_agent(
            agent_id="coder-01",
            name="Execution & Code Agent",
            role="coder",
            allowed_tools=["read_file", "write_file", "execute_code", "run_linter"]
        )
        self.register_agent(
            agent_id="external-scout",
            name="External Swarm Delegate",
            role="scout",
            allowed_tools=["fetch_context"]
        )

    def register_agent(self, agent_id: str, name: str, role: str, allowed_tools: List[str]) -> AgentRecord:
        with self._mutex:
            if agent_id not in self.agents:
                rec = AgentRecord(agent_id, name, role, allowed_tools)
                self.agents[agent_id] = rec
            return self.agents[agent_id]

    def get_agent(self, agent_id: str) -> Optional[AgentRecord]:
        with self._mutex:
            return self.agents.get(agent_id)

    def get_all_agents(self) -> List[Dict[str, Any]]:
        with self._mutex:
            return [rec.to_dict() for rec in self.agents.values()]

    def record_violation(self, agent_id: str, severity: str, reason: str) -> AgentStatus:
        with self._mutex:
            rec = self.agents.get(agent_id)
            if not rec:
                rec = AgentRecord(agent_id, f"Agent-{agent_id}", "unknown", [])
                self.agents[agent_id] = rec

            now = time.time()
            rec.violations.append(now)
            # Prune violations older than 60s
            rec.violations = [t for t in rec.violations if now - t <= 60.0]

            # Circuit breaker trip logic: 3 medium/high violations within 60s -> QUARANTINED
            if len(rec.violations) >= 3 and rec.status != AgentStatus.QUARANTINED:
                rec.status = AgentStatus.QUARANTINED
                rec.quarantine_reason = f"Circuit breaker tripped: {len(rec.violations)} violations within 60s ({reason})"
                rec.security_epoch += 1  # Invalidate active tokens
            elif len(rec.violations) >= 1 and rec.status == AgentStatus.HEALTHY:
                rec.status = AgentStatus.SUSPICIOUS

            return rec.status

    def trigger_honeypot_quarantine(self, agent_id: str, honey_asset: str) -> AgentStatus:
        """FR-16 Deception Tripwire: Immediate quarantine and epoch bump"""
        with self._mutex:
            rec = self.agents.get(agent_id)
            if not rec:
                rec = AgentRecord(agent_id, f"Agent-{agent_id}", "unknown", [])
                self.agents[agent_id] = rec

            rec.status = AgentStatus.QUARANTINED
            rec.security_epoch += 1  # Instant token invalidation
            rec.quarantine_reason = f"DECEPTION TRIPWIRE BREACH: Reference to honey asset '{honey_asset}' detected. Zero-byte execution enforced."
            rec.blocked_count += 1
            return rec.status

    def manual_quarantine(self, agent_id: str, reason: str) -> Optional[AgentRecord]:
        with self._mutex:
            rec = self.agents.get(agent_id)
            if rec:
                rec.status = AgentStatus.QUARANTINED
                rec.security_epoch += 1
                rec.quarantine_reason = f"Manual quarantine by Security Analyst: {reason}"
            return rec

    def reset_agent(self, agent_id: str) -> Optional[AgentRecord]:
        with self._mutex:
            rec = self.agents.get(agent_id)
            if rec:
                rec.status = AgentStatus.HEALTHY
                rec.violations.clear()
                rec.quarantine_reason = None
            return rec

    def bump_epoch(self, agent_id: str) -> int:
        with self._mutex:
            rec = self.agents.get(agent_id)
            if rec:
                rec.security_epoch += 1
                return rec.security_epoch
            return 1
