# AgentGuard (v2.4.1 Architecture Lock)
### Runtime Security & Integrity Gateway for Autonomous AI Agents

AgentGuard is an inline, pre-execution runtime security and authorization gateway positioned between autonomous AI agents and execution surfaces (tools, APIs, databases, files, and inter-agent communication channels).

---

## 🚀 Quick Start

### 1. Unified Launch
Both backend and frontend can be started with the provided script:
```bash
./start_agentguard.sh
```

- **Frontend Dashboard:** [http://127.0.0.1:5173](http://127.0.0.1:5173)
- **Backend API Docs (Swagger):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Direct Backend Health Check:** [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

## 🏛️ System Architecture & Invariants

```text
 ┌────────────────────────────────────────────────────────────┐
 │                  Autonomous Agent Mesh                     │
 │      [Planner-01]    [Researcher-01]    [Coder-01]         │
 └─────────────────────────────┬──────────────────────────────┘
                               │ Ed25519 Signed Token
                               ▼
 ┌────────────────────────────────────────────────────────────┐
 │               AgentGuard Security Gateway                  │
 │                                                            │
 │  Stage 1–6:   Identity, Capability & Honey Tripwire Scans  │
 │  Stage 7–15:  Parameter Normalization, CEL Policy & Risk   │
 │  Stage 16–20: Approval Gate, Outbox & Audit Ledger Commit │
 └──────────────┬──────────────────────────────┬──────────────┘
                │ Approved / Allowed           │ High-Impact
                ▼                              ▼
 ┌────────────────────────────┐   ┌───────────────────────────┐
 │ Docker Execution Sandbox   │   │ Human Approval Cockpit    │
 │ (No-Net, Read-Only, Drop)  │   │ (Redacted RFC-8785 JSON)  │
 └────────────────────────────┘   └───────────────────────────┘
```

1. **Pre-Execution Interception (FR-1):** Every action passes through `authorize(agent_id, tool_name, arguments, task_id, trace_id) -> Decision` before tool invocation. No post-block execution can ever occur (**0.00% Post-Block Execution Rate**).
2. **Deterministic Evaluation (FR-5, FR-9):** Evaluated strictly with Google Common Expression Language (`cel-python`). LLMs are strictly excluded from the decision path.
3. **Deception Tripwires & Instant Containment (FR-16):** Honey assets (e.g., `AG-HONEY-7F92-XK11`) trigger immediate Stage 5 short-circuit blocking, increments the agent's security epoch (invalidating all issued tokens), and quarantines the agent.
4. **Cryptographic Tamper-Evident Ledger (FR-18):** RFC-8785 canonical JSON hash-chain with SHA-256 state hashing and Merkle root calculation.

---

## 🛡️ The 20-Stage Normative Pipeline

| Stage # | Stage Name | Invariant Enforced |
|---|---|---|
| **Stage 1** | Identity & Signature Proof | Ed25519 token validation, epoch freshness check |
| **Stage 2** | Agent Task Lease Validation | Active lease window & task binding verification |
| **Stage 3** | Tool Capability Scope Grant | Checks if `tool_name` is within agent's granted scope |
| **Stage 4** | Rate Limiter & Token Bucket | Concurrency limits and burst window enforcement |
| **Stage 5** | Deception Asset Tripwire Scan | Scans for `AG-HONEY-*` tokens; triggers instant containment |
| **Stage 6** | Schema & Argument Strict Invariant | Adherence to JSON-Schema parameter contracts |
| **Stage 7** | Path Traversal & Filesystem Boundary | Blocks `../`, `%2e%2e`, and unauthorized root access |
| **Stage 8** | Network Socket & SSRF Restriction | Blocks loopback CIDRs, metadata IP `169.254.169.254` |
| **Stage 9** | Dangerous Syscall & Binary Blacklist | Blocks `rm -rf`, `mkfs`, `/bin/bash -i`, reverse shells |
| **Stage 10** | Unicode Homoglyph & Stego Normalization | Neutralizes zero-width and bidirectional override characters |
| **Stage 11** | SQL / CQL Injection & AST Invariant | Blocks SQL tautologies (`' OR '1'='1`) and `DROP TABLE` |
| **Stage 12** | Secret Leak & Canary Token Inspection | Detects exposed AWS keys, Bearer tokens, private keys |
| **Stage 13** | Deterministic CEL Precedence Engine | Evaluates precedence-ordered CEL rules |
| **Stage 14** | Composite Risk Scoring Engine | Aggregates risk score on a 0–100 scale |
| **Stage 15** | Circuit Breaker Threshold Evaluation | Trips agent to `QUARANTINED` on 3 violations / 60s |
| **Stage 16** | Human Approval Cockpit Checkpoint Gate | Holds high-impact actions (`execute_code`, risk ≥ 70) |
| **Stage 17** | Parameter Redaction & Sanitization | Structural redaction before ledger commit & human review |
| **Stage 18** | Isolation Sandbox Boundary Enforcement | Docker sandbox profile (Read-Only root, non-root, net=none) |
| **Stage 19** | Cryptographic Ledger Commit | Appends canonical event block to RFC-8785 hash-chain |
| **Stage 20** | Outbox & Execution Dispatch Finalization | Guarantees 0.00% post-block execution rate |

---

## 📍 Checkpoints & Verification Milestones

AgentGuard provides full checkpoint management:
1. **System State Checkpoints:** Snapshots capturing ledger height, head hash, quarantined agents, policy epoch, and SHA-256 state signatures.
2. **Security Verification Milestones (M1–M5 Suite):**
   - **M1 (Pre-Execution Invariant):** 0% unauthenticated tool execution; 0.00% post-block execution rate.
   - **M2 (Deception Containment):** Honey asset references cause 0 byte reads, instant epoch revocation, and quarantine.
   - **M3 (Approval Freshness):** Fingerprinted approval invalidation (`JCS SHA-256`) if task or security epoch changes.
   - **M4 (Tamper-Evident Ledger):** Canonical RFC-8785 JSON hash chain integrity verified across all blocks.
   - **M5 (Replay Determinism):** 100% reproducible decisions across attack fixtures `SCN-001` through `SCN-006`.

---

## 🎨 Warm Technical Security UI

Built with Next.js / Vite + React 19 + Tailwind CSS:
- **Base Canvas:** Cool Beige (`#FBF9F3`, `#F5F3ED`) with warm stone containers (`#EFECE4`)
- **Typography:** Plus Jakarta Sans & JetBrains Mono
- **Semantic Accents:** Deep Carbon Slate (`#1E232A`), Strict Emerald (`#16A34A`), Caution Amber (`#D97706`), High-Alert Crimson (`#DC2626`).
- **Real-time Gateway Connection:** WebSocket streaming (`/ws/stream`) with HTTP REST fallback.
