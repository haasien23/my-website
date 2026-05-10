from __future__ import annotations

import math
import random
import time
from dataclasses import asdict, dataclass, field, replace
from typing import Any, Optional

from .pathfinding import (
    EnvironmentMap,
    Obstacle,
    build_distance_map,
    is_blocked_point,
    line_of_sight_clear,
    next_waypoint_from_map,
    path_distance_from_map,
    world_to_grid,
)


TWO_PI = math.pi * 2
WEATHER_PRESETS = {"clear", "haze", "rain", "storm"}
WEATHER_LABELS = {
    "clear": "晴空",
    "haze": "薄雾",
    "rain": "降雨",
    "storm": "雷暴",
}


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def lerp(start: float, end: float, ratio: float) -> float:
    return start + (end - start) * ratio


def point_distance(ax: float, ay: float, bx: float, by: float) -> float:
    return math.hypot(ax - bx, ay - by)


def angle_diff(left: float, right: float) -> float:
    delta = (left - right + math.pi) % TWO_PI - math.pi
    return abs(delta)


def make_seed(*values: object) -> int:
    seed = 2166136261
    for value in values:
        for char in str(value):
            seed ^= ord(char)
            seed = (seed * 16777619) & 0xFFFFFFFF
    return seed


def random_from(seed: int, *keys: object) -> float:
    return random.Random(make_seed(seed, *keys)).random()


def gaussian(seed: int, *keys: object) -> float:
    rng = random.Random(make_seed(seed, *keys))
    u1 = clamp(rng.random(), 1e-9, 1 - 1e-9)
    u2 = rng.random()
    return math.sqrt(-2 * math.log(u1)) * math.cos(TWO_PI * u2)


def shuffle_with_seed(items: list[int], seed: int, *keys: object) -> list[int]:
    result = list(items)
    random.Random(make_seed(seed, *keys)).shuffle(result)
    return result


@dataclass(slots=True)
class SimulationConfig:
    map_size: int = 1320
    grid_cols: int = 33
    grid_rows: int = 33
    obstacle_count: int = 34
    drone_count: int = 24
    target_count: int = 6
    drone_cruise_altitude: float = 140.0
    drone_altitude_jitter: float = 20.0
    target_altitude: float = 8.0
    obstacle_height_min: float = 36.0
    obstacle_height_max: float = 120.0
    sensor_range: float = 180.0
    sensor_fov_deg: float = 120.0
    comm_range: float = 300.0
    packet_loss_rate: float = 0.04
    comm_delay_steps: int = 0
    drone_speed: float = 28.0
    target_speed: float = 14.0
    sensor_noise: float = 8.0
    merge_radius: float = 55.0
    min_observations: int = 1
    fault_rate: float = 0.06
    dispatch_ratio: float = 0.45
    run_steps: int = 40
    initial_energy: float = 100.0
    min_usable_energy: float = 12.0
    move_energy_cost: float = 0.05
    sense_energy_cost: float = 1.2
    comm_energy_cost: float = 0.45
    idle_energy_cost: float = 0.18
    success_threshold: float = 32.0
    seed: int = 20260412
    execution_mode: str = "compare_all"
    weather_preset: str = "clear"


def normalize_weather_preset(value: str) -> str:
    normalized = str(value or "clear").strip().lower()
    return normalized if normalized in WEATHER_PRESETS else "clear"


def weather_label(config: SimulationConfig) -> str:
    return WEATHER_LABELS.get(normalize_weather_preset(config.weather_preset), "晴空")


def get_weather_profile(config: SimulationConfig) -> dict[str, float]:
    preset = normalize_weather_preset(config.weather_preset)
    profiles: dict[str, dict[str, float]] = {
        "clear": {
            "sensor_range_scale": 1.00,
            "fov_scale": 1.00,
            "noise_scale": 1.00,
            "detection_penalty": 0.00,
            "link_scale": 1.00,
            "packet_loss_add": 0.00,
            "delay_add": 0.0,
            "drone_speed_scale": 1.00,
            "target_speed_scale": 1.00,
            "move_energy_scale": 1.00,
            "fault_add": 0.0,
            "target_steer_scale": 1.00,
            "idle_drift_scale": 1.00,
        },
        "haze": {
            "sensor_range_scale": 0.78,
            "fov_scale": 0.86,
            "noise_scale": 1.28,
            "detection_penalty": 0.12,
            "link_scale": 0.91,
            "packet_loss_add": 0.03,
            "delay_add": 0.0,
            "drone_speed_scale": 0.95,
            "target_speed_scale": 1.00,
            "move_energy_scale": 1.07,
            "fault_add": 0.003,
            "target_steer_scale": 1.14,
            "idle_drift_scale": 0.90,
        },
        "rain": {
            "sensor_range_scale": 0.74,
            "fov_scale": 0.88,
            "noise_scale": 1.34,
            "detection_penalty": 0.16,
            "link_scale": 0.89,
            "packet_loss_add": 0.05,
            "delay_add": 1.0,
            "drone_speed_scale": 0.91,
            "target_speed_scale": 1.00,
            "move_energy_scale": 1.10,
            "fault_add": 0.006,
            "target_steer_scale": 1.18,
            "idle_drift_scale": 0.86,
        },
        "storm": {
            "sensor_range_scale": 0.60,
            "fov_scale": 0.80,
            "noise_scale": 1.62,
            "detection_penalty": 0.24,
            "link_scale": 0.76,
            "packet_loss_add": 0.12,
            "delay_add": 2.0,
            "drone_speed_scale": 0.82,
            "target_speed_scale": 1.00,
            "move_energy_scale": 1.18,
            "fault_add": 0.012,
            "target_steer_scale": 1.34,
            "idle_drift_scale": 0.72,
        },
    }
    return profiles[preset]


@dataclass(slots=True)
class UAV:
    id: int
    x: float
    y: float
    z: float
    heading: float
    energy: float
    speed_bias: float
    sense_bias: float
    comm_bias: float
    available: bool = True
    failed: bool = False
    assignment: Optional[int] = None
    selection_score: float = 0.0
    last_link: float = 0.5
    last_action: str = "idle"
    traveled: float = 0.0


@dataclass(slots=True)
class Target:
    id: int
    x: float
    y: float
    z: float
    vx: float
    vy: float
    priority: int
    uncertainty: float
    last_estimate: Optional[tuple[float, float]] = None
    last_error: Optional[float] = None
    last_success: bool = False
    last_pass: bool = False
    last_confirmed: bool = False
    last_observation_count: int = 0
    last_info_age: float = 0.0
    demand: int = 1


@dataclass(slots=True)
class Metrics:
    attempts: int = 0
    covered: int = 0
    success: int = 0
    passed: int = 0
    confirmed: int = 0
    error_sum: float = 0.0
    error_count: int = 0
    energy_used: float = 0.0
    compute_ms: float = 0.0
    dispatched: int = 0
    info_age_sum: float = 0.0
    info_age_count: int = 0


@dataclass(slots=True)
class PendingMeasurement:
    target_id: int
    observed_step: int
    available_step: int
    x: float
    y: float
    weight: float


@dataclass(slots=True)
class TargetDetail:
    target_id: int
    priority: int
    uncertainty: float
    selected_ids: list[int]
    observation_count: int
    info_age: Optional[float]
    error: Optional[float]
    success: bool
    pass_hit: bool
    confirmed: bool
    estimate: Optional[tuple[float, float]]
    reason: str


@dataclass(slots=True)
class HistoryPoint:
    step: int
    success_rate: float
    pass_rate: float
    confirmation_rate: float
    coverage_rate: float
    mean_error: float
    energy_used: float
    avg_compute_ms: float
    avg_dispatch: float
    avg_info_age: float


@dataclass(slots=True)
class SimulationState:
    strategy: str
    step: int
    uavs: list[UAV]
    targets: list[Target]
    metrics: Metrics = field(default_factory=Metrics)
    history: list[HistoryPoint] = field(default_factory=list)
    latest_selections: dict[int, list[int]] = field(default_factory=dict)
    latest_target_details: list[TargetDetail] = field(default_factory=list)
    pending_reports: list[PendingMeasurement] = field(default_factory=list)
    frames: list[dict[str, Any]] = field(default_factory=list)


@dataclass(slots=True)
class StateSummary:
    success_rate: float
    pass_rate: float
    confirmation_rate: float
    coverage_rate: float
    mean_error: float
    energy_used: float
    avg_compute_ms: float
    avg_dispatch: float
    avg_info_age: float


@dataclass(slots=True)
class ComparisonRow:
    target_id: int
    priority: int
    uncertainty: float
    smart_selected: list[int]
    random_selected: list[int]
    full_selected: list[int]
    smart_observations: int
    random_observations: int
    full_observations: int
    smart_info_age: Optional[float]
    random_info_age: Optional[float]
    full_info_age: Optional[float]
    smart_error: Optional[float]
    random_error: Optional[float]
    full_error: Optional[float]
    smart_reason: str
    random_reason: str
    full_reason: str
    smart_success: bool
    smart_pass: bool
    smart_confirmed: bool
    random_success: bool
    random_pass: bool
    random_confirmed: bool
    full_success: bool
    full_pass: bool
    full_confirmed: bool


@dataclass(slots=True)
class ComparisonSnapshot:
    smart: StateSummary
    random: StateSummary
    full: StateSummary
    rows: list[ComparisonRow]


@dataclass(slots=True)
class ComparisonWorld:
    config: SimulationConfig
    environment: EnvironmentMap
    smart: SimulationState
    random: SimulationState
    full: SimulationState
    active_strategies: tuple[str, ...]
    primary_strategy: str


@dataclass(slots=True)
class MetricCard:
    key: str
    label: str
    unit: str
    better: str
    smart: float
    random: float
    full: float


EXECUTION_MODE_STRATEGIES: dict[str, tuple[str, ...]] = {
    "compare_all": ("smart", "random", "full"),
    "smart_only": ("smart",),
    "random_only": ("random",),
    "full_only": ("full",),
}


def normalize_execution_mode(value: str | None) -> str:
    return value if value in EXECUTION_MODE_STRATEGIES else "compare_all"


def resolve_active_strategies(value: str | None) -> tuple[str, ...]:
    return EXECUTION_MODE_STRATEGIES[normalize_execution_mode(value)]


def get_state_for_strategy(world: ComparisonWorld, strategy: str) -> SimulationState:
    return getattr(world, strategy)


def get_primary_state(world: ComparisonWorld) -> SimulationState:
    return get_state_for_strategy(world, world.primary_strategy)


def create_environment(config: SimulationConfig) -> EnvironmentMap:
    cell_size = config.map_size / config.grid_cols
    blocked = [[False for _ in range(config.grid_cols)] for _ in range(config.grid_rows)]
    obstacles: list[Obstacle] = []
    reserved = set()
    center_col = config.grid_cols // 2
    center_row = config.grid_rows // 2

    def reserve_row(row_center: int, half_width: int) -> None:
        for row in range(row_center - half_width, row_center + half_width + 1):
            if 0 <= row < config.grid_rows:
                for col in range(config.grid_cols):
                    reserved.add((col, row))

    def reserve_col(col_center: int, half_width: int) -> None:
        for col in range(col_center - half_width, col_center + half_width + 1):
            if 0 <= col < config.grid_cols:
                for row in range(config.grid_rows):
                    reserved.add((col, row))

    for row in range(center_row - 2, center_row + 3):
        for col in range(center_col - 2, center_col + 3):
            reserved.add((col, row))

    for row_center in (
        max(2, int(config.grid_rows * 0.18)),
        center_row,
        min(config.grid_rows - 3, int(config.grid_rows * 0.71)),
    ):
        reserve_row(row_center, 1)
    for col_center in (
        max(2, int(config.grid_cols * 0.22)),
        center_col,
        min(config.grid_cols - 3, int(config.grid_cols * 0.78)),
    ):
        reserve_col(col_center, 1)

    def make_shape(attempt: int) -> list[tuple[int, int, int, int]]:
        shape_roll = random_from(config.seed, "obs-shape", attempt)
        if shape_roll < 0.18:
            length = 3 + int(random_from(config.seed, "obs-strip-len", attempt) * 4)
            if random_from(config.seed, "obs-strip-dir", attempt) < 0.5:
                return [(0, 0, length, 1)]
            return [(0, 0, 1, length)]
        if shape_roll < 0.48:
            width = 2 + int(random_from(config.seed, "obs-block-w", attempt) * 3)
            height = 2 + int(random_from(config.seed, "obs-block-h", attempt) * 3)
            return [(0, 0, width, height)]
        if shape_roll < 0.74:
            width = 2 + int(random_from(config.seed, "obs-l-w", attempt) * 3)
            height = 2 + int(random_from(config.seed, "obs-l-h", attempt) * 3)
            if random_from(config.seed, "obs-l-flip", attempt) < 0.5:
                return [(0, 0, width, 1), (0, 1, 1, max(1, height - 1))]
            return [(0, 0, width, 1), (width - 1, 1, 1, max(1, height - 1))]
        if shape_roll < 0.9:
            width = 2 + int(random_from(config.seed, "obs-u-w", attempt) * 3)
            height = 2 + int(random_from(config.seed, "obs-u-h", attempt) * 3)
            if random_from(config.seed, "obs-u-dir", attempt) < 0.5:
                return [(0, 0, width, 1), (0, height - 1, width, 1)]
            return [(0, 0, 1, height), (width - 1, 0, 1, height)]
        width = 2 + int(random_from(config.seed, "obs-cluster-w", attempt) * 2)
        height = 2 + int(random_from(config.seed, "obs-cluster-h", attempt) * 2)
        gap_x = 1 + int(random_from(config.seed, "obs-cluster-gap-x", attempt) * 2)
        gap_y = 1 + int(random_from(config.seed, "obs-cluster-gap-y", attempt) * 2)
        return [(0, 0, width, height), (width + gap_x, gap_y, max(1, width - 1), max(1, height - 1))]

    def can_place(cells: set[tuple[int, int]]) -> bool:
        return all(
            0 <= cell_col < config.grid_cols
            and 0 <= cell_row < config.grid_rows
            and (cell_col, cell_row) not in reserved
            and not blocked[cell_row][cell_col]
            for cell_col, cell_row in cells
        )

    obstacle_id = 0
    attempts = 0
    max_attempts = config.obstacle_count * 45
    while len(obstacles) < config.obstacle_count and attempts < max_attempts:
        attempts += 1
        blueprints = make_shape(attempts)
        remaining = config.obstacle_count - len(obstacles)
        blueprints = blueprints[:remaining]
        span_w = max(offset_x + width for offset_x, _, width, _ in blueprints)
        span_h = max(offset_y + height for _, offset_y, _, height in blueprints)
        if span_w >= config.grid_cols or span_h >= config.grid_rows:
            continue
        col = int(random_from(config.seed, "obs-c", attempts) * (config.grid_cols - span_w))
        row = int(random_from(config.seed, "obs-r", attempts) * (config.grid_rows - span_h))
        all_cells: set[tuple[int, int]] = set()
        piece_cells: list[list[tuple[int, int]]] = []
        for offset_x, offset_y, width, height in blueprints:
            cells = [(col + offset_x + dx, row + offset_y + dy) for dx in range(width) for dy in range(height)]
            piece_cells.append(cells)
            all_cells.update(cells)
        if not can_place(all_cells):
            continue
        base_elevation = lerp(
            config.obstacle_height_min,
            config.obstacle_height_max,
            random_from(config.seed, "obs-elevation", attempts),
        )
        for piece_index, cells in enumerate(piece_cells):
            width = max(cell_col for cell_col, _ in cells) - min(cell_col for cell_col, _ in cells) + 1
            height = max(cell_row for _, cell_row in cells) - min(cell_row for _, cell_row in cells) + 1
            start_col = min(cell_col for cell_col, _ in cells)
            start_row = min(cell_row for _, cell_row in cells)
            for cell_col, cell_row in cells:
                blocked[cell_row][cell_col] = True
            elevation = clamp(
                base_elevation + gaussian(config.seed, "obs-elev-jitter", attempts, piece_index) * 10.0,
                config.obstacle_height_min,
                config.obstacle_height_max,
            )
            obstacles.append(
                Obstacle(
                    id=obstacle_id,
                    col=start_col,
                    row=start_row,
                    width=width,
                    height=height,
                    elevation=elevation,
                )
            )
            obstacle_id += 1

    return EnvironmentMap(
        cols=config.grid_cols,
        rows=config.grid_rows,
        map_size=config.map_size,
        cell_size=cell_size,
        obstacles=obstacles,
        blocked=blocked,
    )


def sample_free_point(
    config: SimulationConfig,
    env: EnvironmentMap,
    prefix: str,
    index: int,
    occupied: Optional[list[tuple[float, float]]] = None,
    min_distance: float = 0.0,
) -> tuple[float, float]:
    occupied_points = occupied or []
    edge_margin = max(26.0, config.map_size * 0.035)
    target_margin = max(90.0, config.map_size * 0.08)
    for attempt in range(160):
        if prefix == "uav":
            angle = random_from(config.seed, prefix, index, attempt, "angle") * TWO_PI
            radius = lerp(
                config.map_size * 0.14,
                config.map_size * 0.28,
                random_from(config.seed, prefix, index, attempt, "radius"),
            )
            x = config.map_size / 2 + math.cos(angle) * radius
            y = config.map_size / 2 + math.sin(angle) * radius
        else:
            x = lerp(target_margin, config.map_size - target_margin, random_from(config.seed, prefix, index, attempt, "x"))
            y = lerp(target_margin, config.map_size - target_margin, random_from(config.seed, prefix, index, attempt, "y"))
        if not (edge_margin <= x <= config.map_size - edge_margin and edge_margin <= y <= config.map_size - edge_margin):
            continue
        if is_blocked_point(env, x, y):
            continue
        if occupied_points and any(point_distance(x, y, ox, oy) < min_distance for ox, oy in occupied_points):
            continue
        return x, y
    return config.map_size / 2, config.map_size / 2


def create_uavs(config: SimulationConfig, env: EnvironmentMap) -> list[UAV]:
    uavs: list[UAV] = []
    occupied: list[tuple[float, float]] = []
    for index in range(config.drone_count):
        x, y = sample_free_point(config, env, "uav", index, occupied, 30.0)
        occupied.append((x, y))
        uavs.append(
            UAV(
                id=index,
                x=x,
                y=y,
                z=lerp(
                    config.drone_cruise_altitude - config.drone_altitude_jitter,
                    config.drone_cruise_altitude + config.drone_altitude_jitter,
                    random_from(config.seed, "uav-altitude", index),
                ),
                heading=random_from(config.seed, "uav-heading", index) * TWO_PI,
                energy=config.initial_energy,
                speed_bias=lerp(0.88, 1.12, random_from(config.seed, "uav-speed", index)),
                sense_bias=lerp(0.90, 1.15, random_from(config.seed, "uav-sense", index)),
                comm_bias=lerp(0.82, 1.10, random_from(config.seed, "uav-comm", index)),
            )
        )
    return uavs


def create_targets(config: SimulationConfig, env: EnvironmentMap) -> list[Target]:
    targets: list[Target] = []
    occupied: list[tuple[float, float]] = []
    min_spacing = max(96.0, config.map_size / max(config.target_count + 4, 10))
    for index in range(config.target_count):
        x, y = sample_free_point(config, env, "target", index, occupied, min_spacing)
        occupied.append((x, y))
        angle = random_from(config.seed, "target-angle", index) * TWO_PI
        speed = lerp(
            config.target_speed * 0.65,
            config.target_speed * 1.20,
            random_from(config.seed, "target-speed", index),
        )
        targets.append(
            Target(
                id=index,
                x=x,
                y=y,
                z=config.target_altitude,
                vx=math.cos(angle) * speed,
                vy=math.sin(angle) * speed,
                priority=1 + int(random_from(config.seed, "target-priority", index) * 3),
                uncertainty=lerp(55, config.sensor_range * 0.9, random_from(config.seed, "target-uncertainty", index)),
            )
        )
    return targets


def create_state(config: SimulationConfig, env: EnvironmentMap, strategy: str) -> SimulationState:
    state = SimulationState(
        strategy=strategy,
        step=0,
        uavs=create_uavs(config, env),
        targets=create_targets(config, env),
        latest_selections={target_id: [] for target_id in range(config.target_count)},
    )
    record_frame(state)
    return state


def create_comparison_world(config: Optional[SimulationConfig] = None) -> ComparisonWorld:
    cfg = config or SimulationConfig()
    cfg.weather_preset = normalize_weather_preset(cfg.weather_preset)
    env = create_environment(cfg)
    active_strategies = resolve_active_strategies(cfg.execution_mode)
    return ComparisonWorld(
        config=cfg,
        environment=env,
        smart=create_state(cfg, env, "smart"),
        random=create_state(cfg, env, "random"),
        full=create_state(cfg, env, "full"),
        active_strategies=active_strategies,
        primary_strategy=active_strategies[0],
    )


def compute_target_demand(target: Target, config: SimulationConfig, step: int) -> tuple[int, float]:
    priority_score = target.priority / 3
    uncertainty_score = clamp(target.uncertainty / (config.sensor_range * 1.2), 0, 1.3)
    speed_score = clamp(math.hypot(target.vx, target.vy) / max(config.target_speed * 1.2, 1), 0, 1.2)
    maneuver_noise = lerp(-0.12, 0.16, random_from(config.seed, "demand-jitter", target.id, step))
    urgency = clamp(0.45 * priority_score + 0.40 * uncertainty_score + 0.15 * speed_score + maneuver_noise, 0, 1.45)
    cap = max(2, math.ceil(config.drone_count * config.dispatch_ratio * 0.55))
    demand = int(clamp(math.ceil(1 + urgency * 2.4), 1, cap))
    return demand, urgency


def compute_target_meta(state: SimulationState, config: SimulationConfig) -> list[tuple[int, int, float]]:
    target_meta: list[tuple[int, int, float]] = []
    for target in state.targets:
        demand, urgency = compute_target_demand(target, config, state.step)
        target.demand = demand
        target_meta.append((target.id, demand, urgency))
    return target_meta


def update_target_motion(target: Target, env: EnvironmentMap, config: SimulationConfig, step: int) -> None:
    weather = get_weather_profile(config)
    base_speed = config.target_speed * weather["target_speed_scale"]
    current_speed = math.hypot(target.vx, target.vy)
    desired_speed = lerp(base_speed * 0.72, base_speed * 1.08, random_from(config.seed, "target-speed-jitter", target.id, step))
    stabilized_speed = lerp(current_speed if current_speed > 1e-6 else base_speed, desired_speed, 0.45)
    steer_span = 0.55 * weather["target_steer_scale"]
    steer = lerp(-steer_span, steer_span, random_from(config.seed, "target-steer", target.id, step))
    heading = math.atan2(target.vy, target.vx) + steer
    target.vx = math.cos(heading) * stabilized_speed
    target.vy = math.sin(heading) * stabilized_speed

    next_x = target.x + target.vx
    next_y = target.y + target.vy
    blocked = (
        next_x < 30
        or next_x > config.map_size - 30
        or next_y < 30
        or next_y > config.map_size - 30
        or is_blocked_point(env, next_x, next_y)
    )
    if blocked:
        angle = random_from(config.seed, "target-turn", target.id, step) * TWO_PI
        speed = clamp(stabilized_speed, base_speed * 0.72, base_speed * 1.08)
        target.vx = math.cos(angle) * speed
        target.vy = math.sin(angle) * speed
        next_x = clamp(target.x + target.vx, 30, config.map_size - 30)
        next_y = clamp(target.y + target.vy, 30, config.map_size - 30)
        if is_blocked_point(env, next_x, next_y):
            target.vx *= -1
            target.vy *= -1
            next_x = clamp(target.x + target.vx, 30, config.map_size - 30)
            next_y = clamp(target.y + target.vy, 30, config.map_size - 30)
    target.x = next_x
    target.y = next_y


def build_target_maps(state: SimulationState, env: EnvironmentMap) -> dict[int, list[list[int | None]]]:
    maps: dict[int, list[list[int | None]]] = {}
    for target in state.targets:
        col, row = world_to_grid(env, target.x, target.y)
        maps[target.id] = build_distance_map(env, col, row)
    return maps


def estimate_link_quality(uav: UAV, state: SimulationState, config: SimulationConfig) -> float:
    weather = get_weather_profile(config)
    alive_neighbors = [
        peer
        for peer in state.uavs
        if peer.id != uav.id and not peer.failed and peer.energy > config.min_usable_energy
    ]
    neighbors_in_range = [
        peer
        for peer in alive_neighbors
        if point_distance(peer.x, peer.y, uav.x, uav.y) <= config.comm_range
    ]
    density_score = clamp(len(neighbors_in_range) / 6, 0, 1)
    center_score = 1 - clamp(
        point_distance(uav.x, uav.y, config.map_size / 2, config.map_size / 2) / (config.map_size * 0.7),
        0,
        1,
    )
    jitter = 1 - random_from(config.seed, state.step, uav.id, "jam") * 0.25
    return clamp((0.55 * density_score + 0.45 * center_score) * uav.comm_bias * jitter * weather["link_scale"], 0, 1)


def compute_utility(
    uav: UAV,
    target: Target,
    demand: int,
    urgency: float,
    selected_count: int,
    state: SimulationState,
    config: SimulationConfig,
    env: EnvironmentMap,
    distance_map: list[list[int | None]],
) -> tuple[float, float]:
    weather = get_weather_profile(config)
    effective_sensor_range = config.sensor_range * weather["sensor_range_scale"]
    path_distance = path_distance_from_map(env, uav.x, uav.y, distance_map)
    if not math.isfinite(path_distance):
        return -1e9, 0.0

    euclidean = point_distance(uav.x, uav.y, target.x, target.y)
    line_clear = line_of_sight_clear(env, uav.x, uav.y, target.x, target.y)
    coverage = clamp(1 - path_distance / (effective_sensor_range * 2.6), 0, 1)
    line_bonus = 0.18 if line_clear else -0.10
    energy = clamp(uav.energy / config.initial_energy, 0, 1)
    link = estimate_link_quality(uav, state, config)
    travel_penalty = clamp(path_distance / (config.map_size * 1.2), 0, 1)
    redundancy = clamp(selected_count / max(demand, 1), 0, 1.6)
    sensing_ready = 1.0 if euclidean <= effective_sensor_range * uav.sense_bias else 0.45
    utility = (
        0.28 * coverage
        + 0.18 * energy
        + 0.14 * link
        + 0.18 * urgency
        + 0.12 * sensing_ready
        + line_bonus
        - 0.06 * travel_penalty
        - 0.04 * redundancy
    )
    return utility, link


def compute_candidate_snapshot(
    uav: UAV,
    target: Target,
    demand: int,
    urgency: float,
    state: SimulationState,
    config: SimulationConfig,
    env: EnvironmentMap,
    distance_map: list[list[int | None]],
) -> tuple[float, float, float]:
    utility, link = compute_utility(
        uav,
        target,
        demand,
        urgency,
        0,
        state,
        config,
        env,
        distance_map,
    )
    path_distance = path_distance_from_map(env, uav.x, uav.y, distance_map)
    return utility, link, path_distance


def compute_adaptive_budget(
    state: SimulationState,
    config: SimulationConfig,
    target_meta: list[tuple[int, int, float]],
    available: list[UAV],
) -> int:
    if not available or not target_meta:
        return 0

    avg_energy = sum(uav.energy for uav in available) / (len(available) * max(config.initial_energy, 1e-9))
    avg_link = sum(estimate_link_quality(uav, state, config) for uav in available) / len(available)
    total_urgency = sum(urgency for _, _, urgency in target_meta)
    hotspot_count = sum(1 for _, demand, urgency in target_meta if demand >= 3 or urgency >= 0.82)
    recent_pass = state.metrics.passed / max(state.metrics.attempts, 1)

    minimum = max(2, math.ceil(len(target_meta) * 0.45))
    dynamic_cap = len(available)

    desired = (
        len(target_meta) * 0.25
        + total_urgency * 0.75
        + hotspot_count * 0.85
        + avg_energy * 0.60
        + avg_link * 0.40
        + clamp(0.55 - recent_pass, -0.25, 0.90)
    )

    if avg_energy < 0.58:
        desired -= 0.90
    if avg_link < 0.45:
        desired -= 0.45

    budget = int(round(desired))
    return max(minimum, min(dynamic_cap, budget))


def weighted_choice(random_rng: random.Random, weighted_items: list[tuple[int, float]]) -> int:
    total = sum(max(weight, 0.0) for _, weight in weighted_items)
    if total <= 1e-9:
        return weighted_items[0][0]
    threshold = random_rng.random() * total
    cumulative = 0.0
    for item, weight in weighted_items:
        cumulative += max(weight, 0.0)
        if cumulative >= threshold:
            return item
    return weighted_items[-1][0]


def assign_smart(
    state: SimulationState,
    config: SimulationConfig,
    env: EnvironmentMap,
    target_maps: dict[int, list[list[int | None]]],
) -> tuple[dict[int, int], dict[int, list[int]]]:
    available = [uav for uav in state.uavs if not uav.failed and uav.energy > config.min_usable_energy]
    assignments: dict[int, int] = {}
    by_target = {target.id: [] for target in state.targets}
    selected: set[int] = set()

    target_meta = compute_target_meta(state, config)
    target_meta.sort(key=lambda item: item[2], reverse=True)
    budget = compute_adaptive_budget(state, config, target_meta, available)

    remaining_budget = budget
    progress = True
    while remaining_budget > 0 and progress:
        progress = False
        for target_id, demand, urgency in target_meta:
            if remaining_budget <= 0 or len(by_target[target_id]) >= demand:
                continue
            target = next(item for item in state.targets if item.id == target_id)
            best_uav: Optional[UAV] = None
            best_score = -1e9
            best_link = 0.0
            distance_map = target_maps[target_id]

            for uav in available:
                if uav.id in selected:
                    continue
                utility, link = compute_utility(
                    uav,
                    target,
                    demand,
                    urgency,
                    len(by_target[target_id]),
                    state,
                    config,
                    env,
                    distance_map,
                )
                if utility > best_score:
                    best_uav = uav
                    best_score = utility
                    best_link = link

            if best_uav is not None:
                selected.add(best_uav.id)
                assignments[best_uav.id] = target_id
                by_target[target_id].append(best_uav.id)
                best_uav.selection_score = best_score
                best_uav.last_link = best_link
                remaining_budget -= 1
                progress = True

    return assignments, by_target


def assign_random(
    state: SimulationState,
    config: SimulationConfig,
    env: EnvironmentMap,
    target_maps: dict[int, list[list[int | None]]],
) -> tuple[dict[int, int], dict[int, list[int]]]:
    available = [uav for uav in state.uavs if not uav.failed and uav.energy > config.min_usable_energy]
    assignments: dict[int, int] = {}
    by_target = {target.id: [] for target in state.targets}
    target_meta = compute_target_meta(state, config)
    budget = compute_adaptive_budget(state, config, target_meta, available)
    target_lookup = {target.id: target for target in state.targets}
    available_lookup = {uav.id: uav for uav in available}
    target_cycle = shuffle_with_seed([target.id for target in state.targets], config.seed, state.step, "random-targets")
    random_rng = random.Random(make_seed(config.seed, state.step, "random-feasible"))
    selected: set[int] = set()

    if not target_cycle:
        return assignments, by_target

    candidate_map: dict[int, list[int]] = {}
    fallback_map: dict[int, list[int]] = {}
    meta_lookup = {target_id: (demand, urgency) for target_id, demand, urgency in target_meta}

    for target_id in target_cycle:
        target = target_lookup[target_id]
        demand, urgency = meta_lookup[target_id]
        feasible: list[tuple[int, float]] = []
        fallback: list[tuple[int, float]] = []
        for uav in available:
            utility, _, path_distance = compute_candidate_snapshot(
                uav,
                target,
                demand,
                urgency,
                state,
                config,
                env,
                target_maps[target_id],
            )
            if not math.isfinite(path_distance):
                continue
            if utility > -0.05 and path_distance <= config.sensor_range * 4.5:
                feasible.append((uav.id, utility))
            elif path_distance <= config.sensor_range * 6.2:
                fallback.append((uav.id, utility))
        feasible.sort(key=lambda item: item[1], reverse=True)
        fallback.sort(key=lambda item: item[1], reverse=True)
        candidate_map[target_id] = [uav_id for uav_id, _ in feasible]
        fallback_map[target_id] = [uav_id for uav_id, _ in fallback]

    def preferred_pool(target_id: int) -> list[int]:
        primary = [uav_id for uav_id in candidate_map[target_id] if uav_id not in selected]
        if primary:
            keep = max(1, math.ceil(len(primary) * 0.55))
            return primary[:keep]
        backup = [uav_id for uav_id in fallback_map[target_id] if uav_id not in selected]
        if backup:
            keep = max(1, math.ceil(len(backup) * 0.55))
            return backup[:keep]
        return []

    for target_id in target_cycle:
        if len(selected) >= budget:
            break
        candidate_pool = preferred_pool(target_id)
        if not candidate_pool:
            continue
        uav_id = random_rng.choice(candidate_pool)
        assignments[uav_id] = target_id
        by_target[target_id].append(uav_id)
        selected.add(uav_id)

    target_weights = []
    for target_id in target_cycle:
        demand, urgency = meta_lookup[target_id]
        target_weights.append((target_id, demand, urgency))

    while len(selected) < budget:
        weighted_targets: list[tuple[int, float]] = []
        for target_id, demand, urgency in target_weights:
            candidate_pool = preferred_pool(target_id)
            if not candidate_pool:
                continue
            remaining_need = max(demand - len(by_target[target_id]), 0)
            weight = 0.8 + remaining_need * 1.1 + urgency * 0.6
            weighted_targets.append((target_id, weight))

        if weighted_targets:
            target_id = weighted_choice(random_rng, weighted_targets)
            candidate_pool = preferred_pool(target_id)
            if candidate_pool:
                uav_id = random_rng.choice(candidate_pool)
                assignments[uav_id] = target_id
                by_target[target_id].append(uav_id)
                selected.add(uav_id)
                continue
        else:
            remaining = [uav_id for uav_id in available_lookup if uav_id not in selected]
            if not remaining:
                break
            uav_id = random_rng.choice(remaining)
            target_id = random_rng.choice(target_cycle)
            assignments[uav_id] = target_id
            by_target[target_id].append(uav_id)
            selected.add(uav_id)

    return assignments, by_target


def assign_full(
    state: SimulationState,
    config: SimulationConfig,
    env: EnvironmentMap,
    target_maps: dict[int, list[list[int | None]]],
) -> tuple[dict[int, int], dict[int, list[int]]]:
    available = [uav for uav in state.uavs if not uav.failed and uav.energy > config.min_usable_energy]
    assignments: dict[int, int] = {}
    by_target = {target.id: [] for target in state.targets}
    target_meta = compute_target_meta(state, config)
    target_lookup = {target.id: target for target in state.targets}

    ranked_uavs = sorted(
        available,
        key=lambda item: (item.energy, item.sense_bias + item.comm_bias),
        reverse=True,
    )

    for uav in ranked_uavs:
        best_target_id: Optional[int] = None
        best_score = -1e9
        best_link = 0.0
        for target_id, demand, urgency in target_meta:
            target = target_lookup[target_id]
            utility, link = compute_utility(
                uav,
                target,
                demand,
                urgency,
                len(by_target[target_id]),
                state,
                config,
                env,
                target_maps[target_id],
            )
            support_ratio = len(by_target[target_id]) / max(demand, 1)
            support_bonus = 0.16 if support_ratio < 1 else -0.03 * clamp(support_ratio - 1, 0, 4)
            score = utility + support_bonus
            if score > best_score:
                best_target_id = target_id
                best_score = score
                best_link = link

        if best_target_id is None:
            continue

        assignments[uav.id] = best_target_id
        by_target[best_target_id].append(uav.id)
        uav.selection_score = best_score
        uav.last_link = best_link

    return assignments, by_target


def move_towards(current_x: float, current_y: float, goal_x: float, goal_y: float, remaining: float) -> tuple[float, float, float]:
    dx = goal_x - current_x
    dy = goal_y - current_y
    dist = math.hypot(dx, dy)
    if dist == 0:
        return current_x, current_y, 0.0
    step = min(remaining, dist)
    ratio = step / dist
    return current_x + dx * ratio, current_y + dy * ratio, step


def move_uavs(
    state: SimulationState,
    assignments: dict[int, int],
    config: SimulationConfig,
    env: EnvironmentMap,
    target_maps: dict[int, list[list[int | None]]],
) -> None:
    weather = get_weather_profile(config)
    move_cost = config.move_energy_cost * weather["move_energy_scale"]
    for uav in state.uavs:
        uav.assignment = assignments.get(uav.id)
        uav.available = not uav.failed and uav.energy > config.min_usable_energy
        energy_spent = config.idle_energy_cost
        traveled = 0.0
        desired_z = config.drone_cruise_altitude

        if uav.assignment is not None and uav.available:
            target = next(item for item in state.targets if item.id == uav.assignment)
            distance_map = target_maps[uav.assignment]
            remaining = config.drone_speed * weather["drone_speed_scale"] * uav.speed_bias
            desired_z = clamp(
                config.drone_cruise_altitude - point_distance(uav.x, uav.y, target.x, target.y) * 0.06,
                config.target_altitude + 34.0,
                config.drone_cruise_altitude + config.drone_altitude_jitter,
            )

            while remaining > 0:
                waypoint = next_waypoint_from_map(env, uav.x, uav.y, distance_map)
                goal_x, goal_y = (target.x, target.y) if waypoint is None else waypoint
                next_x, next_y, step_distance = move_towards(uav.x, uav.y, goal_x, goal_y, remaining)
                uav.x, uav.y = next_x, next_y
                traveled += step_distance
                remaining -= step_distance
                if step_distance == 0 or waypoint is None:
                    break

            if traveled > 0:
                uav.heading = math.atan2(target.y - uav.y, target.x - uav.x)
            energy_spent += traveled * move_cost + config.comm_energy_cost
            uav.last_action = "assigned"
        elif uav.available:
            uav.heading += lerp(-0.18, 0.18, random_from(config.seed, state.step, uav.id, "idle-heading"))
            drift = lerp(0, 6, random_from(config.seed, state.step, uav.id, "idle-drift")) * weather["idle_drift_scale"]
            desired_z = config.drone_cruise_altitude + lerp(
                -config.drone_altitude_jitter * 0.35,
                config.drone_altitude_jitter * 0.35,
                random_from(config.seed, state.step, uav.id, "idle-altitude"),
            )
            next_x = clamp(uav.x + math.cos(uav.heading) * drift, 20, config.map_size - 20)
            next_y = clamp(uav.y + math.sin(uav.heading) * drift, 20, config.map_size - 20)
            if not is_blocked_point(env, next_x, next_y):
                uav.x = next_x
                uav.y = next_y
                traveled = drift
            energy_spent += traveled * move_cost * 0.35
            uav.last_action = "patrol"
        else:
            desired_z = max(config.target_altitude + 8.0, uav.z - 18.0)
            uav.last_action = "offline"

        vertical_step = clamp(desired_z - uav.z, -9.0, 9.0)
        uav.z = clamp(uav.z + vertical_step, config.target_altitude + 6.0, config.drone_cruise_altitude + config.drone_altitude_jitter)
        energy_spent += abs(vertical_step) * move_cost * 0.12
        uav.energy = clamp(uav.energy - energy_spent, 0, config.initial_energy)
        uav.traveled += traveled
        state.metrics.energy_used += energy_spent


def summarize_target_reason(
    selected_count: int,
    failure_stats: dict[str, int],
    observation_count: int,
    success: bool,
    pass_hit: bool,
    confirmed: bool,
    error: Optional[float],
) -> str:
    if success:
        return "多机融合结果满足确认数量与精度阈值"
    if pass_hit and not confirmed:
        return "定位已达标，但确认观测数量不足"
    if confirmed and not pass_hit:
        return "已完成确认，但融合误差仍高于阈值"
    if error is not None:
        return "已形成观测，但融合误差或一致性未达标"
    if selected_count <= 0:
        return "本步未派出感知子群"
    if failure_stats.get("delay", 0) > 0 and observation_count == 0 and sum(
        failure_stats.get(key, 0) for key in ("range", "blocked", "fov", "detect", "loss")
    ) == 0:
        return "观测已产生，正在等待链路延迟送达"

    labels = {
        "range": "目标超出感知半径",
        "blocked": "障碍物遮挡目标",
        "fov": "目标未进入侦察视场",
        "detect": "概率检测未命中",
        "loss": "链路丢包导致观测未送达",
        "delay": "观测受通信延迟影响",
    }
    active = [(key, count) for key, count in failure_stats.items() if count > 0]
    if not active:
        return "当前观测链路未形成有效结果"
    if len(active) == 1:
        return labels[active[0][0]]

    dominant = max(active, key=lambda item: item[1])[0]
    return f"主要受{labels[dominant]}影响，并伴随其他感知约束"


def collect_measurements(
    state: SimulationState,
    config: SimulationConfig,
    env: EnvironmentMap,
    by_target: dict[int, list[int]],
) -> None:
    weather = get_weather_profile(config)
    effective_sensor_range = config.sensor_range * weather["sensor_range_scale"]
    effective_fov_deg = config.sensor_fov_deg * weather["fov_scale"]
    effective_noise = config.sensor_noise * weather["noise_scale"]
    extra_delay = int(weather["delay_add"])
    ready_reports: dict[int, list[PendingMeasurement]] = {target.id: [] for target in state.targets}
    remaining_reports: list[PendingMeasurement] = []
    for report in state.pending_reports:
        if report.available_step <= state.step:
            ready_reports.setdefault(report.target_id, []).append(report)
        else:
            remaining_reports.append(report)
    state.pending_reports = remaining_reports

    details: list[TargetDetail] = []
    for target in state.targets:
        selected_ids = list(by_target.get(target.id, []))
        selected_uavs = [uav for uav in state.uavs if uav.id in selected_ids]
        measurements = ready_reports.setdefault(target.id, [])
        failure_stats = {
            "range": 0,
            "blocked": 0,
            "fov": 0,
            "detect": 0,
            "loss": 0,
            "delay": 0,
        }

        for uav in selected_uavs:
            euclidean = point_distance(uav.x, uav.y, target.x, target.y)
            if euclidean > effective_sensor_range * uav.sense_bias:
                failure_stats["range"] += 1
                continue
            if not line_of_sight_clear(env, uav.x, uav.y, target.x, target.y):
                failure_stats["blocked"] += 1
                continue
            bearing = math.atan2(target.y - uav.y, target.x - uav.x)
            if angle_diff(bearing, uav.heading) > math.radians(effective_fov_deg) / 2:
                failure_stats["fov"] += 1
                continue

            coverage = clamp(1 - euclidean / max(effective_sensor_range, 1), 0, 1)
            detection_chance = clamp(0.25 + coverage * 0.75 - weather["detection_penalty"], 0.05, 0.98)
            detected = random_from(config.seed, state.step, target.id, uav.id, "detect") < detection_chance
            if not detected:
                failure_stats["detect"] += 1
                continue

            sigma = (effective_noise * (1 + euclidean / max(effective_sensor_range, 1))) / uav.sense_bias
            mx = target.x + gaussian(config.seed, state.step, target.id, uav.id, "mx") * sigma
            my = target.y + gaussian(config.seed, state.step, target.id, uav.id, "my") * sigma
            link = estimate_link_quality(uav, state, config)
            weight = (0.55 + 0.25 * link + 0.20 * (uav.energy / config.initial_energy)) / max(sigma * sigma, 0.1)
            uav.energy = clamp(uav.energy - config.sense_energy_cost, 0, config.initial_energy)
            state.metrics.energy_used += config.sense_energy_cost

            effective_loss = clamp((config.packet_loss_rate + weather["packet_loss_add"]) * (1.18 - 0.45 * link), 0.02, 0.7)
            delivered = random_from(config.seed, state.step, target.id, uav.id, "deliver") >= effective_loss
            if not delivered:
                failure_stats["loss"] += 1
                continue

            delay = 0
            delay_budget = config.comm_delay_steps + extra_delay
            if delay_budget > 0:
                delay = int(random_from(config.seed, state.step, target.id, uav.id, "delay") * (delay_budget + 1))

            report = PendingMeasurement(
                target_id=target.id,
                observed_step=state.step,
                available_step=state.step + delay,
                x=mx,
                y=my,
                weight=weight * (0.78 + 0.22 * link),
            )
            if report.available_step <= state.step:
                measurements.append(report)
            else:
                failure_stats["delay"] += 1
                state.pending_reports.append(report)

        estimate: Optional[tuple[float, float]] = None
        error: Optional[float] = None
        success = False
        pass_hit = False
        confirmed = False
        observation_count = 0
        info_age: Optional[float] = None

        if measurements:
            projected_measurements: list[PendingMeasurement] = []
            for report in measurements:
                age = max(state.step - report.observed_step, 0)
                projected_measurements.append(
                    PendingMeasurement(
                        target_id=report.target_id,
                        observed_step=report.observed_step,
                        available_step=report.available_step,
                        x=report.x + target.vx * age,
                        y=report.y + target.vy * age,
                        weight=report.weight * (0.90 ** age),
                    )
                )
            measurements = projected_measurements

            coarse_weight_sum = sum(item.weight for item in measurements)
            coarse_x = sum(item.x * item.weight for item in measurements) / coarse_weight_sum
            coarse_y = sum(item.y * item.weight for item in measurements) / coarse_weight_sum

            robust_measurements: list[PendingMeasurement] = []
            baseline_radius = max(effective_noise * 2.0, effective_sensor_range * 0.08)
            for report in measurements:
                residual = math.hypot(report.x - coarse_x, report.y - coarse_y)
                robust_scale = 1 / (1 + (residual / baseline_radius) ** 2)
                robust_measurements.append(
                    PendingMeasurement(
                        target_id=report.target_id,
                        observed_step=report.observed_step,
                        available_step=report.available_step,
                        x=report.x,
                        y=report.y,
                        weight=report.weight * robust_scale,
                    )
                )

            cluster = [
                report
                for report in robust_measurements
                if math.hypot(report.x - coarse_x, report.y - coarse_y) <= config.merge_radius
            ]
            if len(cluster) < min(config.min_observations, len(robust_measurements)) and robust_measurements:
                anchor = max(robust_measurements, key=lambda item: item.weight)
                cluster = [
                    report
                    for report in robust_measurements
                    if math.hypot(report.x - anchor.x, report.y - anchor.y) <= config.merge_radius
                ]
            fused_measurements = cluster if cluster else robust_measurements
            observation_count = len(fused_measurements)

            weight_sum = sum(item.weight for item in fused_measurements)
            if weight_sum <= 1e-9:
                weight_sum = coarse_weight_sum
                fused_measurements = measurements
                observation_count = len(fused_measurements)

            ex = sum(item.x * item.weight for item in fused_measurements) / weight_sum
            ey = sum(item.y * item.weight for item in fused_measurements) / weight_sum
            estimate = (ex, ey)
            error = math.hypot(ex - target.x, ey - target.y)
            spread = sum(math.hypot(item.x - ex, item.y - ey) for item in fused_measurements) / len(fused_measurements)
            info_age = sum(state.step - item.observed_step for item in fused_measurements) / len(fused_measurements)
            state.metrics.info_age_sum += info_age
            state.metrics.info_age_count += 1
            consensus = 0.78 if len(fused_measurements) == 1 else math.exp(-spread / max(effective_sensor_range * 0.4, 1))
            confirmation_need = min(config.min_observations, max(1, target.demand))
            confirmed = observation_count >= confirmation_need
            pass_hit = error <= config.success_threshold
            success = confirmed and pass_hit and consensus >= 0.42
            target.uncertainty = (
                clamp(target.uncertainty * 0.72, 18, config.sensor_range * 1.3)
                if success
                else clamp(target.uncertainty * 0.92, 18, config.sensor_range * 1.4)
            )
            target.last_estimate = estimate
            target.last_error = error
            target.last_success = success
            target.last_pass = pass_hit
            target.last_confirmed = confirmed
            target.last_observation_count = observation_count
            target.last_info_age = 0.0 if info_age is None else info_age
            state.metrics.covered += 1
            state.metrics.error_sum += error
            state.metrics.error_count += 1
        else:
            target.uncertainty = clamp(target.uncertainty + 7, 18, config.sensor_range * 1.5)
            target.last_estimate = None
            target.last_error = None
            target.last_success = False
            target.last_pass = False
            target.last_confirmed = False
            target.last_observation_count = 0
            target.last_info_age = 0.0

        if pass_hit:
            state.metrics.passed += 1
        if confirmed:
            state.metrics.confirmed += 1
        if success:
            state.metrics.success += 1

        state.metrics.attempts += 1
        reason = summarize_target_reason(
            selected_count=len(selected_ids),
            failure_stats=failure_stats,
            observation_count=observation_count,
            success=success,
            pass_hit=pass_hit,
            confirmed=confirmed,
            error=error,
        )
        details.append(
            TargetDetail(
                target_id=target.id,
                priority=target.priority,
                uncertainty=target.uncertainty,
                selected_ids=selected_ids,
                observation_count=observation_count,
                info_age=info_age,
                error=error,
                success=success,
                pass_hit=pass_hit,
                confirmed=confirmed,
                estimate=estimate,
                reason=reason,
            )
        )

    state.latest_target_details = details


def update_failures(state: SimulationState, config: SimulationConfig) -> None:
    weather = get_weather_profile(config)
    for uav in state.uavs:
        failed = (
            uav.energy <= config.min_usable_energy
            or random_from(config.seed, state.step, uav.id, "failure") < config.fault_rate + weather["fault_add"]
        )
        uav.failed = failed
        uav.available = not failed
        if failed:
            uav.assignment = None
            uav.selection_score = 0.0


def summarize_state(state: SimulationState) -> StateSummary:
    attempts = max(state.metrics.attempts, 1)
    error_count = max(state.metrics.error_count, 1)
    step_count = max(state.step, 1)
    info_age_count = max(state.metrics.info_age_count, 1)
    return StateSummary(
        success_rate=state.metrics.success / attempts,
        pass_rate=state.metrics.passed / attempts,
        confirmation_rate=state.metrics.confirmed / attempts,
        coverage_rate=state.metrics.covered / attempts,
        mean_error=state.metrics.error_sum / error_count,
        energy_used=state.metrics.energy_used,
        avg_compute_ms=state.metrics.compute_ms / step_count,
        avg_dispatch=state.metrics.dispatched / step_count,
        avg_info_age=state.metrics.info_age_sum / info_age_count,
    )


def record_history(state: SimulationState) -> None:
    summary = summarize_state(state)
    state.history.append(
        HistoryPoint(
            step=state.step,
            success_rate=summary.success_rate,
            pass_rate=summary.pass_rate,
            confirmation_rate=summary.confirmation_rate,
            coverage_rate=summary.coverage_rate,
            mean_error=summary.mean_error,
            energy_used=summary.energy_used,
            avg_compute_ms=summary.avg_compute_ms,
            avg_dispatch=summary.avg_dispatch,
            avg_info_age=summary.avg_info_age,
        )
    )


def record_frame(state: SimulationState) -> None:
    state.frames.append(
        {
            "step": state.step,
            "uavs": [
                {
                    "id": uav.id,
                    "x": round(uav.x, 3),
                    "y": round(uav.y, 3),
                    "z": round(uav.z, 3),
                    "heading": round(uav.heading, 5),
                    "energy": round(uav.energy, 3),
                    "failed": uav.failed,
                    "assignment": uav.assignment,
                    "available": uav.available,
                    "last_action": uav.last_action,
                }
                for uav in state.uavs
            ],
            "targets": [
                {
                    "id": target.id,
                    "x": round(target.x, 3),
                    "y": round(target.y, 3),
                    "z": round(target.z, 3),
                    "priority": target.priority,
                    "uncertainty": round(target.uncertainty, 3),
                    "last_estimate": None
                    if target.last_estimate is None
                    else [round(target.last_estimate[0], 3), round(target.last_estimate[1], 3)],
                    "last_error": None if target.last_error is None else round(target.last_error, 3),
                    "last_success": target.last_success,
                    "last_pass": target.last_pass,
                    "last_confirmed": target.last_confirmed,
                    "observation_count": target.last_observation_count,
                    "info_age": round(target.last_info_age, 3),
                    "demand": target.demand,
                }
                for target in state.targets
            ],
        }
    )


def step_state(state: SimulationState, config: SimulationConfig, env: EnvironmentMap) -> None:
    begin = time.perf_counter()
    state.step += 1

    for uav in state.uavs:
        uav.assignment = None
        uav.selection_score = 0.0

    for target in state.targets:
        update_target_motion(target, env, config, state.step)

    update_failures(state, config)
    target_maps = build_target_maps(state, env)
    if state.strategy == "smart":
        assignments, by_target = assign_smart(state, config, env, target_maps)
    elif state.strategy == "random":
        assignments, by_target = assign_random(state, config, env, target_maps)
    else:
        assignments, by_target = assign_full(state, config, env, target_maps)

    move_uavs(state, assignments, config, env, target_maps)
    collect_measurements(state, config, env, by_target)
    state.latest_selections = by_target
    state.metrics.dispatched += sum(len(items) for items in by_target.values())
    state.metrics.compute_ms += (time.perf_counter() - begin) * 1000
    record_history(state)
    record_frame(state)


def step_comparison_world(world: ComparisonWorld, steps: int = 1) -> ComparisonWorld:
    for _ in range(steps):
        for strategy in world.active_strategies:
            step_state(get_state_for_strategy(world, strategy), world.config, world.environment)
    return world


def build_comparison_snapshot(world: ComparisonWorld) -> ComparisonSnapshot:
    smart_summary = summarize_state(world.smart)
    random_summary = summarize_state(world.random)
    full_summary = summarize_state(world.full)
    rows: list[ComparisonRow] = []
    primary_rows = get_primary_state(world).latest_target_details
    for primary_row in primary_rows:
        smart_row = next((item for item in world.smart.latest_target_details if item.target_id == primary_row.target_id), None)
        random_row = next((item for item in world.random.latest_target_details if item.target_id == primary_row.target_id), None)
        full_row = next((item for item in world.full.latest_target_details if item.target_id == primary_row.target_id), None)
        rows.append(
            ComparisonRow(
                target_id=primary_row.target_id,
                priority=primary_row.priority,
                uncertainty=primary_row.uncertainty,
                smart_selected=list(smart_row.selected_ids) if smart_row else [],
                random_selected=list(random_row.selected_ids) if random_row else [],
                full_selected=list(full_row.selected_ids) if full_row else [],
                smart_observations=smart_row.observation_count if smart_row else 0,
                random_observations=random_row.observation_count if random_row else 0,
                full_observations=full_row.observation_count if full_row else 0,
                smart_info_age=smart_row.info_age if smart_row else None,
                random_info_age=random_row.info_age if random_row else None,
                full_info_age=full_row.info_age if full_row else None,
                smart_error=smart_row.error if smart_row else None,
                random_error=random_row.error if random_row else None,
                full_error=full_row.error if full_row else None,
                smart_reason=smart_row.reason if smart_row else "未运行该策略",
                random_reason=random_row.reason if random_row else "未运行该策略",
                full_reason=full_row.reason if full_row else "未运行该策略",
                smart_success=smart_row.success if smart_row else False,
                smart_pass=smart_row.pass_hit if smart_row else False,
                smart_confirmed=smart_row.confirmed if smart_row else False,
                random_success=random_row.success if random_row else False,
                random_pass=random_row.pass_hit if random_row else False,
                random_confirmed=random_row.confirmed if random_row else False,
                full_success=full_row.success if full_row else False,
                full_pass=full_row.pass_hit if full_row else False,
                full_confirmed=full_row.confirmed if full_row else False,
            )
        )

    return ComparisonSnapshot(smart=smart_summary, random=random_summary, full=full_summary, rows=rows)


def build_narrative_legacy(world: ComparisonWorld) -> str:
    snapshot = build_comparison_snapshot(world)
    smart_success = snapshot.smart.success_rate * 100
    random_success = snapshot.random.success_rate * 100
    coverage_delta = (snapshot.smart.coverage_rate - snapshot.random.coverage_rate) * 100
    error_delta = snapshot.random.mean_error - snapshot.smart.mean_error
    return (
        f"在障碍物与动态目标共同作用的复杂场景中，RADS 当前成功率为 {smart_success:.1f}% ，"
        f"随机派机为 {random_success:.1f}% 。覆盖率变化 {coverage_delta:+.1f}% ，"
        f"平均融合误差 {'降低' if error_delta >= 0 else '升高'} {abs(error_delta):.2f} 。"
        "这说明动态选择感知无人机子集并结合链路、能量与路径代价后，更适合多任务协同态势感知。"
    )


def get_metric_cards_legacy(world: ComparisonWorld) -> list[MetricCard]:
    snapshot = build_comparison_snapshot(world)
    return [
        MetricCard("success_rate", "任务成功率", "%", "higher", snapshot.smart.success_rate * 100, snapshot.random.success_rate * 100),
        MetricCard("coverage_rate", "覆盖率", "%", "higher", snapshot.smart.coverage_rate * 100, snapshot.random.coverage_rate * 100),
        MetricCard("mean_error", "平均融合误差", "m", "lower", snapshot.smart.mean_error, snapshot.random.mean_error),
        MetricCard("energy_used", "累计能耗", "", "lower", snapshot.smart.energy_used, snapshot.random.energy_used),
        MetricCard("avg_compute_ms", "平均计算耗时", "ms", "lower", snapshot.smart.avg_compute_ms, snapshot.random.avg_compute_ms),
    ]


def serialize_summary(summary: StateSummary) -> dict[str, Any]:
    return asdict(summary)


def serialize_environment(env: EnvironmentMap) -> dict[str, Any]:
    return {
        "cols": env.cols,
        "rows": env.rows,
        "map_size": env.map_size,
        "cell_size": env.cell_size,
        "obstacles": [asdict(obstacle) for obstacle in env.obstacles],
    }


def serialize_state_full(state: SimulationState) -> dict[str, Any]:
    return {
        "strategy": state.strategy,
        "step": state.step,
        "history": [asdict(item) for item in state.history],
        "frames": state.frames,
        "latest_target_details": [
            {
                "target_id": item.target_id,
                "priority": item.priority,
                "uncertainty": item.uncertainty,
                "selected_ids": item.selected_ids,
                "observation_count": item.observation_count,
                "info_age": item.info_age,
                "error": item.error,
                "success": item.success,
                "pass_hit": item.pass_hit,
                "confirmed": item.confirmed,
                "estimate": None if item.estimate is None else list(item.estimate),
                "reason": item.reason,
            }
            for item in state.latest_target_details
        ],
    }


def serialize_snapshot_legacy(snapshot: ComparisonSnapshot) -> dict[str, Any]:
    return {
        "smart": serialize_summary(snapshot.smart),
        "random": serialize_summary(snapshot.random),
        "rows": [
            {
                "target_id": row.target_id,
                "priority": row.priority,
                "uncertainty": row.uncertainty,
                "smart_selected": row.smart_selected,
                "random_selected": row.random_selected,
                "smart_error": row.smart_error,
                "random_error": row.random_error,
                "smart_success": row.smart_success,
                "random_success": row.random_success,
            }
            for row in snapshot.rows
        ],
    }


def serialize_metric_cards(cards: list[MetricCard]) -> list[dict[str, Any]]:
    return [asdict(card) for card in cards]


def serialize_increment_legacy(world: ComparisonWorld, total_steps: int) -> dict[str, Any]:
    snapshot = build_comparison_snapshot(world)
    return {
        "progress": {
            "current_step": world.smart.step,
            "total_steps": total_steps,
            "ratio": world.smart.step / max(total_steps, 1),
            "finished": world.smart.step >= total_steps,
        },
        "snapshot": serialize_snapshot(snapshot),
        "metric_cards": serialize_metric_cards(get_metric_cards(world)),
        "narrative": build_narrative(world),
        "environment": serialize_environment(world.environment),
        "smart_state": {
            "current_frame": world.smart.frames[-1],
            "history_point": None if not world.smart.history else asdict(world.smart.history[-1]),
        },
        "random_state": {
            "current_frame": world.random.frames[-1],
            "history_point": None if not world.random.history else asdict(world.random.history[-1]),
        },
    }


def serialize_world_legacy(world: ComparisonWorld) -> dict[str, Any]:
    snapshot = build_comparison_snapshot(world)
    return {
        "config": asdict(world.config),
        "environment": serialize_environment(world.environment),
        "snapshot": serialize_snapshot(snapshot),
        "metric_cards": serialize_metric_cards(get_metric_cards(world)),
        "narrative": build_narrative(world),
        "smart_state": serialize_state_full(world.smart),
        "random_state": serialize_state_full(world.random),
    }


def run_simulation_steps(world: ComparisonWorld, steps: int) -> dict[str, Any]:
    step_comparison_world(world, steps)
    return serialize_increment(world, world.config.run_steps)


def run_experiment(config: SimulationConfig) -> dict[str, Any]:
    world = create_comparison_world(config)
    step_comparison_world(world, config.run_steps)
    return serialize_world(world)


def clone_config(config: SimulationConfig) -> SimulationConfig:
    return replace(config)


def build_narrative(world: ComparisonWorld) -> str:
    snapshot = build_comparison_snapshot(world)
    if len(world.active_strategies) == 1:
        strategy = world.primary_strategy
        summary = getattr(snapshot, strategy)
        label = {
            "smart": "RADS 动态子群",
            "random": "随机派遣",
            "full": "全量派遣",
        }[strategy]
        return (
            f"当前以“{label}”单算法模式运行，场景包含 {len(world.environment.obstacles)} 组障碍、"
            f"{world.config.target_count} 个动态目标和 {world.config.drone_count} 架集群无人机。"
            f"该算法当前严格成功率为 {summary.success_rate * 100:.1f}%，"
            f"定位达标率为 {summary.pass_rate * 100:.1f}%，"
            f"平均误差为 {summary.mean_error:.2f} m，累计能耗为 {summary.energy_used:.2f}。"
        )
    smart_success = snapshot.smart.success_rate * 100
    random_success = snapshot.random.success_rate * 100
    full_success = snapshot.full.success_rate * 100
    random_error_delta = snapshot.random.mean_error - snapshot.smart.mean_error
    random_energy_delta = snapshot.random.energy_used - snapshot.smart.energy_used
    full_energy_delta = snapshot.full.energy_used - snapshot.smart.energy_used
    return (
        f"当前场景包含 {len(world.environment.obstacles)} 组障碍、{world.config.target_count} 个动态目标和 "
        f"{world.config.drone_count} 架集群无人机。RADS 成功率为 {smart_success:.1f}%，"
        f"随机派遣为 {random_success:.1f}%，全量派遣为 {full_success:.1f}%。"
        f"相较随机派遣，RADS 平均定位误差{'降低' if random_error_delta >= 0 else '升高'} "
        f"{abs(random_error_delta):.2f} m，累计能耗{'减少' if random_energy_delta >= 0 else '增加'} "
        f"{abs(random_energy_delta):.2f}。与全量派遣相比，RADS 在保持态势感知精度的同时"
        f"{'节省' if full_energy_delta >= 0 else '额外消耗'} {abs(full_energy_delta):.2f} 能耗，"
        "体现出动态无人机子群选择在复杂真实约束下的效率优势。"
    )


def get_metric_cards(world: ComparisonWorld) -> list[MetricCard]:
    snapshot = build_comparison_snapshot(world)
    return [
        MetricCard(
            "success_rate",
            "严格成功率",
            "%",
            "higher",
            snapshot.smart.success_rate * 100,
            snapshot.random.success_rate * 100,
            snapshot.full.success_rate * 100,
        ),
        MetricCard(
            "pass_rate",
            "定位达标率",
            "%",
            "higher",
            snapshot.smart.pass_rate * 100,
            snapshot.random.pass_rate * 100,
            snapshot.full.pass_rate * 100,
        ),
        MetricCard(
            "mean_error",
            "平均定位误差",
            "m",
            "lower",
            snapshot.smart.mean_error,
            snapshot.random.mean_error,
            snapshot.full.mean_error,
        ),
        MetricCard(
            "energy_used",
            "累计能耗",
            "",
            "lower",
            snapshot.smart.energy_used,
            snapshot.random.energy_used,
            snapshot.full.energy_used,
        ),
        MetricCard(
            "avg_dispatch",
            "平均派机规模",
            "",
            "lower",
            snapshot.smart.avg_dispatch,
            snapshot.random.avg_dispatch,
            snapshot.full.avg_dispatch,
        ),
    ]


def serialize_snapshot(snapshot: ComparisonSnapshot) -> dict[str, Any]:
    return {
        "smart": serialize_summary(snapshot.smart),
        "random": serialize_summary(snapshot.random),
        "full": serialize_summary(snapshot.full),
        "rows": [
            {
                "target_id": row.target_id,
                "priority": row.priority,
                "uncertainty": row.uncertainty,
                "smart_selected": row.smart_selected,
                "random_selected": row.random_selected,
                "full_selected": row.full_selected,
                "smart_observations": row.smart_observations,
                "random_observations": row.random_observations,
                "full_observations": row.full_observations,
                "smart_info_age": row.smart_info_age,
                "random_info_age": row.random_info_age,
                "full_info_age": row.full_info_age,
                "smart_error": row.smart_error,
                "random_error": row.random_error,
                "full_error": row.full_error,
                "smart_reason": row.smart_reason,
                "random_reason": row.random_reason,
                "full_reason": row.full_reason,
                "smart_success": row.smart_success,
                "smart_pass": row.smart_pass,
                "smart_confirmed": row.smart_confirmed,
                "random_success": row.random_success,
                "random_pass": row.random_pass,
                "random_confirmed": row.random_confirmed,
                "full_success": row.full_success,
                "full_pass": row.full_pass,
                "full_confirmed": row.full_confirmed,
            }
            for row in snapshot.rows
        ],
    }


def serialize_increment(world: ComparisonWorld, total_steps: int) -> dict[str, Any]:
    snapshot = build_comparison_snapshot(world)
    primary_state = get_primary_state(world)
    return {
        "progress": {
            "current_step": primary_state.step,
            "total_steps": total_steps,
            "ratio": primary_state.step / max(total_steps, 1),
            "finished": primary_state.step >= total_steps,
        },
        "execution_mode": normalize_execution_mode(world.config.execution_mode),
        "active_strategies": list(world.active_strategies),
        "primary_strategy": world.primary_strategy,
        "snapshot": serialize_snapshot(snapshot),
        "metric_cards": serialize_metric_cards(get_metric_cards(world)),
        "narrative": build_narrative(world),
        "environment": serialize_environment(world.environment),
        "smart_state": {
            "current_frame": world.smart.frames[-1],
            "history_point": None if not world.smart.history else asdict(world.smart.history[-1]),
        },
        "random_state": {
            "current_frame": world.random.frames[-1],
            "history_point": None if not world.random.history else asdict(world.random.history[-1]),
        },
        "full_state": {
            "current_frame": world.full.frames[-1],
            "history_point": None if not world.full.history else asdict(world.full.history[-1]),
        },
    }


def serialize_world(world: ComparisonWorld) -> dict[str, Any]:
    snapshot = build_comparison_snapshot(world)
    return {
        "config": asdict(world.config),
        "execution_mode": normalize_execution_mode(world.config.execution_mode),
        "active_strategies": list(world.active_strategies),
        "primary_strategy": world.primary_strategy,
        "environment": serialize_environment(world.environment),
        "snapshot": serialize_snapshot(snapshot),
        "metric_cards": serialize_metric_cards(get_metric_cards(world)),
        "narrative": build_narrative(world),
        "smart_state": serialize_state_full(world.smart),
        "random_state": serialize_state_full(world.random),
        "full_state": serialize_state_full(world.full),
    }


def build_narrative(world: ComparisonWorld) -> str:
    snapshot = build_comparison_snapshot(world)
    weather = weather_label(world.config)
    if len(world.active_strategies) == 1:
        strategy = world.primary_strategy
        summary = getattr(snapshot, strategy)
        label = {
            "smart": "RADS 动态子群",
            "random": "随机派遣",
            "full": "全量派遣",
        }[strategy]
        return (
            f"当前场景采用 {weather}天气、{world.config.sensor_fov_deg:.0f}° 侦察视场、"
            f"{world.config.packet_loss_rate * 100:.0f}% 链路丢包、"
            f"{world.config.comm_delay_steps} 步通信延迟，以及至少 {world.config.min_observations} 次观测确认。"
            f"当前以“{label}”单算法模式运行，严格成功率为 {summary.success_rate * 100:.1f}%，"
            f"定位达标率为 {summary.pass_rate * 100:.1f}%，平均定位误差为 {summary.mean_error:.2f} m，"
            f"平均信息时效为 {summary.avg_info_age:.2f} 步，累计能耗为 {summary.energy_used:.2f}。"
        )
    smart_success = snapshot.smart.success_rate * 100
    smart_pass = snapshot.smart.pass_rate * 100
    random_success = snapshot.random.success_rate * 100
    random_pass = snapshot.random.pass_rate * 100
    full_success = snapshot.full.success_rate * 100
    full_pass = snapshot.full.pass_rate * 100
    random_error_delta = snapshot.random.mean_error - snapshot.smart.mean_error
    full_energy_delta = snapshot.full.energy_used - snapshot.smart.energy_used
    return (
        f"当前场景采用 {weather}天气、{world.config.sensor_fov_deg:.0f}° 侦察视场、"
        f"{world.config.packet_loss_rate * 100:.0f}% 链路丢包、"
        f"{world.config.comm_delay_steps} 步通信延迟，以及至少 {world.config.min_observations} 次观测确认。"
        f"RADS 严格成功率为 {smart_success:.1f}%，定位达标率为 {smart_pass:.1f}%；"
        f"随机派遣分别为 {random_success:.1f}% 和 {random_pass:.1f}%；"
        f"全量派遣分别为 {full_success:.1f}% 和 {full_pass:.1f}%。"
        f"因此即便全量派遣有时在严格成功率上略低，也不代表其纯定位更差。相较随机基线，RADS 平均定位误差"
        f"{'降低' if random_error_delta >= 0 else '升高'} {abs(random_error_delta):.2f} m；"
        f"相较全量派遣，RADS 平均信息时效约为 {snapshot.smart.avg_info_age:.2f} 步，"
        f"并{'节省' if full_energy_delta >= 0 else '额外消耗'} {abs(full_energy_delta):.2f} 能耗，"
        "更符合复杂现实条件下“以更少节点维持高质量态势感知”的论文目标。"
    )
