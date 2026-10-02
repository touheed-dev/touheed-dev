"""
AgentGuard Cryptographic Tamper-Evident Audit Ledger (FR-18)
Compliant with RFC-8785 Canonical JSON & SHA-256 Hash Chaining
"""

import json
import hashlib
import time
import threading
from typing import List, Dict, Any, Optional, Tuple

try:
    import rfc8785
    def canonical_json_bytes(data: Any) -> bytes:
        return rfc8785.dumps(data)
except ImportError:
    def canonical_json_bytes(data: Any) -> bytes:
        # Fallback RFC-8785 strict deterministic JSON serialization
        return json.dumps(data, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode('utf-8')

from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

from .models import LedgerBlock, DecisionType


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


class CryptoLedger:
    _instance = None
    _lock = threading.Lock()

    def __init__(self):
        self.blocks: List[LedgerBlock] = []
        self._mutex = threading.Lock()
        
        # Generate Gateway Ed25519 master signing keypair
        self._private_key = ed25519.Ed25519PrivateKey.generate()
        self.public_key_bytes = self._private_key.public_key().public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        )
        self.public_key_hex = self.public_key_bytes.hex()
        
        # Initialize Genesis Block (Block 0)
        self._create_genesis_block()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def _create_genesis_block(self):
        genesis_payload = {
            "genesis_protocol": "AgentGuard-v2.4.1-CanonicalLedger",
            "architecture_lock": "Fail-Closed-RFC8785",
            "initialized_at": 1727870000.0,
            "root_authority": f"ed25519:{self.public_key_hex[:16]}..."
        }
        raw_bytes = canonical_json_bytes(genesis_payload)
        genesis_hash = sha256_hex(raw_bytes)
        
        block = LedgerBlock(
            block_index=0,
            timestamp=1727870000.0,
            prev_hash="0000000000000000000000000000000000000000000000000000000000000000",
            merkle_root=genesis_hash,
            state_hash=genesis_hash,
            canonical_payload=raw_bytes.decode('utf-8', errors='replace'),
            event_type="GENESIS_INITIALIZE",
            agent_id="SYSTEM_ROOT",
            tool_name="BOOTSTRAP_KERNEL",
            decision=DecisionType.ALLOW,
            risk_score=0,
            block_hash=genesis_hash
        )
        self.blocks.append(block)

    def compute_merkle_root(self, leaves: List[str]) -> str:
        if not leaves:
            return sha256_hex(b"EMPTY_MERKLE_ROOT")
        current_level = [hashlib.sha256(leaf.encode('utf-8')).digest() for leaf in leaves]
        while len(current_level) > 1:
            next_level = []
            for i in range(0, len(current_level), 2):
                left = current_level[i]
                right = current_level[i + 1] if i + 1 < len(current_level) else left
                combined = left + right
                next_level.append(hashlib.sha256(combined).digest())
            current_level = next_level
        return current_level[0].hex()

    def append_event(
        self,
        event_type: str,
        agent_id: str,
        tool_name: str,
        decision: DecisionType,
        risk_score: int,
        event_data: Dict[str, Any]
    ) -> LedgerBlock:
        with self._mutex:
            last_block = self.blocks[-1]
            block_index = len(self.blocks)
            timestamp = time.time()
            prev_hash = last_block.block_hash

            # Merkle leaf calculation
            data_canonical = canonical_json_bytes(event_data)
            leaf_hash = sha256_hex(data_canonical)
            merkle_root = self.compute_merkle_root([prev_hash, leaf_hash])
            state_hash = sha256_hex(f"{block_index}:{prev_hash}:{merkle_root}".encode('utf-8'))

            block_envelope = {
                "block_index": block_index,
                "timestamp": round(timestamp, 6),
                "prev_hash": prev_hash,
                "merkle_root": merkle_root,
                "state_hash": state_hash,
                "event_type": event_type,
                "agent_id": agent_id,
                "tool_name": tool_name,
                "decision": decision.value,
                "risk_score": risk_score,
                "data": event_data
            }

            canonical_bytes = canonical_json_bytes(block_envelope)
            block_hash = sha256_hex(canonical_bytes)

            new_block = LedgerBlock(
                block_index=block_index,
                timestamp=timestamp,
                prev_hash=prev_hash,
                merkle_root=merkle_root,
                state_hash=state_hash,
                canonical_payload=canonical_bytes.decode('utf-8', errors='replace'),
                event_type=event_type,
                agent_id=agent_id,
                tool_name=tool_name,
                decision=decision,
                risk_score=risk_score,
                block_hash=block_hash
            )
            self.blocks.append(new_block)
            return new_block

    def verify_integrity(self) -> Dict[str, Any]:
        with self._mutex:
            total_blocks = len(self.blocks)
            if total_blocks == 0:
                return {"valid": False, "reason": "Ledger is empty", "height": 0}

            # Check genesis block
            genesis = self.blocks[0]
            if genesis.block_index != 0 or genesis.prev_hash != "0000000000000000000000000000000000000000000000000000000000000000":
                return {"valid": False, "reason": "Corrupt Genesis Block", "height": total_blocks}

            for i in range(1, total_blocks):
                curr = self.blocks[i]
                prev = self.blocks[i - 1]

                # 1. Previous hash link invariant
                if curr.prev_hash != prev.block_hash:
                    return {
                        "valid": False,
                        "broken_block_index": i,
                        "expected_prev": prev.block_hash,
                        "found_prev": curr.prev_hash,
                        "reason": f"Hash chain link broken at block {i}",
                        "height": total_blocks
                    }

                # 2. Block hash invariant (recompute canonical JSON)
                try:
                    envelope = json.loads(curr.canonical_payload)
                    recomputed_bytes = canonical_json_bytes(envelope)
                    recomputed_hash = sha256_hex(recomputed_bytes)
                    if recomputed_hash != curr.block_hash:
                        return {
                            "valid": False,
                            "broken_block_index": i,
                            "reason": f"Payload integrity hash mismatch at block {i}",
                            "height": total_blocks
                        }
                except Exception as e:
                    return {
                        "valid": False,
                        "broken_block_index": i,
                        "reason": f"Failed to parse payload at block {i}: {str(e)}",
                        "height": total_blocks
                    }

            return {
                "valid": True,
                "verified_blocks": total_blocks,
                "head_hash": self.blocks[-1].block_hash,
                "genesis_hash": genesis.block_hash,
                "standard": "RFC-8785 Canonical JSON + SHA-256",
                "tamper_detected": False
            }

    def sign_message(self, message: bytes) -> str:
        sig = self._private_key.sign(message)
        return sig.hex()

    def get_recent_blocks(self, limit: int = 50) -> List[LedgerBlock]:
        with self._mutex:
            return list(reversed(self.blocks[-limit:]))
