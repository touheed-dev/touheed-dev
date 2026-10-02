"""
AgentGuard Models & Type Definitions
Version: v2.4.1 (Architecture Lock)
"""

from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import time


class DecisionType(str, Enum):
    ALLOW = "ALLOW"
    WARN = "WARN"
    REQUIRE_APPROVAL = "REQUIRE_APPROVAL"
    BLOCK = "BLOCK"


class AgentStatus(str, Enum):
    HEALTHY = "HEALTHY"
    SUSPICIOUS = "SUSPICIOUS"
    QUARANTINED = "QUARANTINED"
    REVOKED = "REVOKED"


class StageStatus(str, Enum):
    PASS = "PASS"
    ALLOW = "ALLOW"
    WARN = "WARN"
    REQUIRE_APPROVAL = "REQUIRE_APPROVAL"
    BLOCK = "BLOCK"
    SHORT_CIRCUIT = "SHORT_CIRCUIT"



class StageResult(BaseModel):
    stage_num: int
    stage_name: str
    status: StageStatus
    latency_us: int
    rule_matched: Optional[str] = None
    detail: str
    evidence: Optional[Dict[str, Any]] = None


class InterceptionRequest(BaseModel):
    agent_id: str
    tool_name: str
    arguments: Dict[str, Any]
    task_id: str
    trace_id: str
    token_epoch: Optional[int] = None
    signature: Optional[str] = None


class InterceptionDecision(BaseModel):
    decision: DecisionType
    agent_id: str
    tool_name: str
    task_id: str
    trace_id: str
    risk_score: int  # 0 to 100
    timestamp: float
    canonical_hash: str
    block_index: Optional[int] = None
    stage_results: List[StageResult]
    redacted_arguments: Dict[str, Any]
    requires_approval: bool = False
    approval_id: Optional[str] = None
    post_block_executed: bool = False  # Always False (0.00% invariant)
    honeypot_triggered: bool = False
    circuit_breaker_status: AgentStatus


class ApprovalItem(BaseModel):
    approval_id: str
    trace_id: str
    task_id: str
    agent_id: str
    tool_name: str
    arguments: Dict[str, Any]
    redacted_arguments: Dict[str, Any]
    risk_score: int
    freshness_fingerprint: str
    created_at: float
    status: str = "PENDING"  # PENDING, APPROVED, REJECTED, INVALIDATED
    decision_reason: str


class LedgerBlock(BaseModel):
    block_index: int
    timestamp: float
    prev_hash: str
    merkle_root: str
    state_hash: str
    canonical_payload: str
    event_type: str
    agent_id: str
    tool_name: str
    decision: DecisionType
    risk_score: int
    block_hash: str


class CheckpointSnapshot(BaseModel):
    checkpoint_id: str
    name: str
    timestamp: float
    ledger_height: int
    ledger_head_hash: str
    total_interceptions: int
    quarantined_agents_count: int
    pending_approvals_count: int
    policy_epoch: int
    state_signature: str
    description: str


class MilestoneResult(BaseModel):
    milestone_id: str
    title: str
    target_requirement: str
    status: str  # VERIFIED, FAILED
    verified_at: float
    details: str
    metrics: Dict[str, Any]
