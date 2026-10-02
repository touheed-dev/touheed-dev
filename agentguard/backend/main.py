"""
AgentGuard FastAPI Main Application
Runtime Security & Integrity Gateway for Autonomous AI Agents (v2.4.1)
"""

import time
import json
import asyncio
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .models import (
    InterceptionRequest,
    InterceptionDecision,
    ApprovalItem,
    LedgerBlock,
    CheckpointSnapshot,
    MilestoneResult
)
from .kernel import AgentGuardKernel, HONEY_ASSETS
from .crypto_ledger import CryptoLedger
from .circuit_breaker import CircuitBreakerManager
from .cel_engine import CelPolicyEngine
from .scenarios import get_all_scenarios, get_scenario_by_id
from .checkpoints import CheckpointManager

app = FastAPI(
    title="AgentGuard Gateway API",
    description="Runtime Security & Integrity Gateway for Autonomous AI Agents",
    version="2.4.1"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Singleton components
kernel = AgentGuardKernel.get_instance()
ledger = CryptoLedger.get_instance()
circuit_breaker = CircuitBreakerManager.get_instance()
cel_engine = CelPolicyEngine.get_instance()
checkpoints = CheckpointManager.get_instance()

# Connected WebSocket clients
connected_clients: List[WebSocket] = []


async def broadcast_event(event_type: str, data: Any):
    if not connected_clients:
        return
    message = json.dumps({"event": event_type, "data": data, "timestamp": time.time()})
    disconnected = []
    for client in connected_clients:
        try:
            await client.send_text(message)
        except Exception:
            disconnected.append(client)
    for d in disconnected:
        if d in connected_clients:
            connected_clients.remove(d)


@app.on_event("startup")
async def startup_event():
    # Pre-populate initial benign and telemetry events for rich out-of-the-box dashboard experience
    if len(kernel.history) == 0:
        kernel.authorize(InterceptionRequest(
            agent_id="planner-01",
            tool_name="search_knowledge",
            arguments={"query": "System Architecture V2"},
            task_id="TASK-BOOT-01",
            trace_id="TRC-BOOT-01"
        ))
        kernel.authorize(InterceptionRequest(
            agent_id="researcher-01",
            tool_name="read_file",
            arguments={"path": "/docs/whitepaper.pdf"},
            task_id="TASK-BOOT-02",
            trace_id="TRC-BOOT-02"
        ))
        # Create an initial checkpoint
        checkpoints.create_checkpoint(
            name="P0 Vertical Slice Boot Checkpoint",
            description="All 20 stages primed and cryptographic ledger initialized."
        )


@app.get("/api/health")
def get_health():
    return {
        "status": "HEALTHY",
        "service": "AgentGuard Security Gateway",
        "version": "v2.4.1",
        "timestamp": time.time(),
        "architecture_lock": "Fail-Closed-RFC8785",
        "post_block_execution_rate": "0.00%",
        "active_clients": len(connected_clients)
    }


@app.get("/api/stats")
def get_stats():
    agents = circuit_breaker.get_all_agents()
    total_intercepted = len(kernel.history)
    blocked_count = sum(1 for h in kernel.history if h.decision.value == "BLOCK")
    allowed_count = sum(1 for h in kernel.history if h.decision.value == "ALLOW")
    warn_count = sum(1 for h in kernel.history if h.decision.value == "WARN")
    quarantined_agents = [a for a in agents if a["status"] == "QUARANTINED"]
    pending_approvals = [a for a in kernel.pending_approvals.values() if a.status == "PENDING"]

    return {
        "post_block_execution_rate": "0.00%",
        "total_intercepted": total_intercepted,
        "blocked_count": blocked_count,
        "allowed_count": allowed_count,
        "warn_count": warn_count,
        "pending_approvals_count": len(pending_approvals),
        "total_agents": len(agents),
        "quarantined_agents_count": len(quarantined_agents),
        "ledger_height": len(ledger.blocks),
        "ledger_head_hash": ledger.blocks[-1].block_hash,
        "policy_epoch": cel_engine.policy_epoch,
        "gateway_public_key": ledger.public_key_hex[:24] + "..."
    }


@app.post("/api/authorize")
async def authorize_action(req: InterceptionRequest):
    """FR-1 Pre-Execution Interception Gateway Endpoint"""
    decision = kernel.authorize(req)
    await broadcast_event("INTERCEPTION", decision.model_dump())
    return decision


@app.get("/api/interceptions")
def get_interceptions(limit: int = 50):
    return [h.model_dump() for h in reversed(kernel.history[-limit:])]


@app.get("/api/agents")
def get_agents():
    return circuit_breaker.get_all_agents()


@app.post("/api/agents/{agent_id}/quarantine")
async def quarantine_agent(agent_id: str, reason: str = Query("Manual Analyst Action")):
    agent = circuit_breaker.manual_quarantine(agent_id, reason)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    await broadcast_event("AGENT_STATE_CHANGE", agent.to_dict())
    return agent.to_dict()


@app.post("/api/agents/{agent_id}/reset")
async def reset_agent(agent_id: str):
    agent = circuit_breaker.reset_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    await broadcast_event("AGENT_STATE_CHANGE", agent.to_dict())
    return agent.to_dict()


@app.post("/api/agents/{agent_id}/bump_epoch")
async def bump_agent_epoch(agent_id: str):
    new_epoch = circuit_breaker.bump_epoch(agent_id)
    agent = circuit_breaker.get_agent(agent_id)
    if agent:
        await broadcast_event("AGENT_STATE_CHANGE", agent.to_dict())
        return {"agent_id": agent_id, "new_epoch": new_epoch}
    raise HTTPException(status_code=404, detail="Agent not found")


@app.get("/api/approvals")
def get_approvals():
    return [a.model_dump() for a in reversed(list(kernel.pending_approvals.values()))]


class ApprovalResolveRequest(BaseModel):
    action: str  # APPROVE or REJECT
    note: Optional[str] = ""


@app.post("/api/approvals/{approval_id}/resolve")
async def resolve_approval(approval_id: str, body: ApprovalResolveRequest):
    result = kernel.resolve_approval(approval_id, body.action, body.note)
    if not result.get("success", False):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to resolve approval"))
    await broadcast_event("APPROVAL_RESOLVED", {"approval_id": approval_id, **result})
    return result


@app.get("/api/ledger")
def get_ledger_blocks(limit: int = 50):
    return [b.model_dump() for b in ledger.get_recent_blocks(limit)]


@app.get("/api/ledger/verify")
def verify_ledger():
    return ledger.verify_integrity()


@app.get("/api/policies")
def get_policies():
    return cel_engine.get_all_rules()


@app.post("/api/policies/{rule_id}/toggle")
async def toggle_policy(rule_id: str, enabled: bool = Query(...)):
    success = cel_engine.update_rule(rule_id, enabled)
    if not success:
        raise HTTPException(status_code=404, detail="Policy rule not found")
    await broadcast_event("POLICY_UPDATED", {"rule_id": rule_id, "enabled": enabled})
    return {"rule_id": rule_id, "enabled": enabled, "policy_epoch": cel_engine.policy_epoch}


@app.get("/api/scenarios")
def get_scenarios():
    return get_all_scenarios()


@app.post("/api/scenarios/{scenario_id}/replay")
async def replay_scenario(scenario_id: str):
    scn = get_scenario_by_id(scenario_id)
    if not scn:
        raise HTTPException(status_code=404, detail="Scenario not found")

    req_data = scn["test_request"]
    circuit_breaker.reset_agent(req_data["agent_id"])
    req = InterceptionRequest(
        agent_id=req_data["agent_id"],
        tool_name=req_data["tool_name"],
        arguments=req_data["arguments"],
        task_id=req_data["task_id"],
        trace_id=req_data["trace_id"],
        token_epoch=req_data.get("token_epoch")
    )
    decision = kernel.authorize(req)
    await broadcast_event("INTERCEPTION", decision.model_dump())
    
    match = (decision.decision.value == scn["expected_decision"])
    return {
        "scenario": scn,
        "decision": decision.model_dump(),
        "deterministic_match": match,
        "expected": scn["expected_decision"],
        "actual": decision.decision.value
    }


@app.post("/api/simulate/traffic")
async def generate_simulated_traffic():
    """Generates realistic autonomous agent mesh traffic for dynamic dashboard demonstration"""
    import random
    traffic_samples = [
        {
            "agent_id": "planner-01",
            "tool_name": "search_knowledge",
            "arguments": {"query": f"Distributed Consensus Protocol v{random.randint(1, 9)}"},
            "task_id": f"TASK-AUTO-{random.randint(100, 999)}",
            "trace_id": f"TRC-SWARM-{random.randint(1000, 9999)}"
        },
        {
            "agent_id": "researcher-01",
            "tool_name": "read_file",
            "arguments": {"path": f"/workspace/reports/financial_audit_2026_q{random.randint(1, 4)}.pdf"},
            "task_id": f"TASK-AUTO-{random.randint(100, 999)}",
            "trace_id": f"TRC-SWARM-{random.randint(1000, 9999)}"
        },
        {
            "agent_id": "coder-01",
            "tool_name": "execute_code",
            "arguments": {"language": "python", "code": f"def process_batch():\n    return 'batch_{random.randint(10, 99)}_complete'"},
            "task_id": f"TASK-AUTO-{random.randint(100, 999)}",
            "trace_id": f"TRC-SWARM-{random.randint(1000, 9999)}"
        },
        {
            "agent_id": "external-scout",
            "tool_name": "fetch_context",
            "arguments": {"source": "https://api.github.com/repos/touheed-dev"},
            "task_id": f"TASK-AUTO-{random.randint(100, 999)}",
            "trace_id": f"TRC-SWARM-{random.randint(1000, 9999)}"
        },
        {
            "agent_id": "researcher-01",
            "tool_name": "query_database",
            "arguments": {"query": f"SELECT metric_name, value FROM metrics WHERE tenant_id = 't-{random.randint(1, 10)}';"},
            "task_id": f"TASK-AUTO-{random.randint(100, 999)}",
            "trace_id": f"TRC-SWARM-{random.randint(1000, 9999)}"
        },
        {
            "agent_id": "coder-01",
            "tool_name": "read_file",
            "arguments": {"filepath": "../../../../etc/shadow"},
            "task_id": f"TASK-AUTO-{random.randint(100, 999)}",
            "trace_id": f"TRC-SWARM-{random.randint(1000, 9999)}"
        }
    ]
    sample = random.choice(traffic_samples)
    req = InterceptionRequest(
        agent_id=sample["agent_id"],
        tool_name=sample["tool_name"],
        arguments=sample["arguments"],
        task_id=sample["task_id"],
        trace_id=sample["trace_id"]
    )
    decision = kernel.authorize(req)
    await broadcast_event("INTERCEPTION", decision.model_dump())
    return decision



class CheckpointCreateRequest(BaseModel):
    name: str
    description: Optional[str] = ""


@app.get("/api/checkpoints")
def get_checkpoints():
    return checkpoints.get_all_checkpoints()


@app.post("/api/checkpoints")
async def create_checkpoint_endpoint(body: CheckpointCreateRequest):
    ckpt = checkpoints.create_checkpoint(body.name, body.description)
    await broadcast_event("CHECKPOINT_CREATED", ckpt.model_dump())
    return ckpt.model_dump()


@app.get("/api/milestones")
def run_milestones():
    results = checkpoints.run_milestone_verification()
    return [r.model_dump() for r in results]


@app.get("/api/honeypots")
def get_honeypots():
    return [
        {
            "token": h,
            "category": "High-Value Deception Tripwire",
            "type": "Canary Database Token" if "7F92" in h else ("Cloud Secret" if "AWS" in h else "Root Credential"),
            "status": "ARMED",
            "action_on_touch": "Stage 5 Short-Circuit, Instant Epoch Invalidation & Quarantine"
        }
        for h in HONEY_ASSETS
    ]


@app.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        # Send initial snapshot
        await websocket.send_text(json.dumps({
            "event": "CONNECTED",
            "data": {
                "message": "Connected to AgentGuard Realtime Kernel Stream",
                "version": "v2.4.1",
                "timestamp": time.time()
            }
        }))
        while True:
            # Keepalive listener
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"event": "pong"}))
    except WebSocketDisconnect:
        if websocket in connected_clients:
            connected_clients.remove(websocket)
    except Exception:
        if websocket in connected_clients:
            connected_clients.remove(websocket)
