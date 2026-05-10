from __future__ import annotations

from dataclasses import dataclass, field
from threading import Lock
from time import time_ns
from typing import Any
from uuid import uuid4

from src.simulation import ComparisonWorld, SimulationConfig, create_comparison_world, serialize_increment
from src.simulation.core import make_seed


@dataclass(slots=True)
class SimulationSession:
    session_id: str
    world: ComparisonWorld
    total_steps: int

    def advance(self, steps: int = 1) -> dict[str, Any]:
        from src.simulation import step_comparison_world

        primary_state = getattr(self.world, self.world.primary_strategy)
        remaining = max(0, self.total_steps - primary_state.step)
        actual_steps = max(0, min(steps, remaining))
        if actual_steps > 0:
            step_comparison_world(self.world, actual_steps)
        payload = serialize_increment(self.world, self.total_steps)
        payload["session_id"] = self.session_id
        return payload


@dataclass(slots=True)
class SessionStore:
    sessions: dict[str, SimulationSession] = field(default_factory=dict)
    _lock: Lock = field(default_factory=Lock)

    def create(self, config: SimulationConfig) -> SimulationSession:
        runtime_seed = make_seed(config.seed, time_ns(), uuid4().hex)
        config.seed = runtime_seed
        session = SimulationSession(
            session_id=uuid4().hex,
            world=create_comparison_world(config),
            total_steps=config.run_steps,
        )
        with self._lock:
            self.sessions[session.session_id] = session
        return session

    def get(self, session_id: str) -> SimulationSession | None:
        with self._lock:
            return self.sessions.get(session_id)

    def delete(self, session_id: str) -> None:
        with self._lock:
            self.sessions.pop(session_id, None)
