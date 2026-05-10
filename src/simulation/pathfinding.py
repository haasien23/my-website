from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from typing import Iterable


@dataclass(slots=True)
class Obstacle:
    id: int
    col: int
    row: int
    width: int
    height: int
    elevation: float


@dataclass(slots=True)
class EnvironmentMap:
    cols: int
    rows: int
    map_size: int
    cell_size: float
    obstacles: list[Obstacle]
    blocked: list[list[bool]]


def in_bounds(env: EnvironmentMap, col: int, row: int) -> bool:
    return 0 <= col < env.cols and 0 <= row < env.rows


def grid_to_world(env: EnvironmentMap, col: int, row: int) -> tuple[float, float]:
    return (col + 0.5) * env.cell_size, (row + 0.5) * env.cell_size


def world_to_grid(env: EnvironmentMap, x: float, y: float) -> tuple[int, int]:
    col = min(env.cols - 1, max(0, int(x / env.cell_size)))
    row = min(env.rows - 1, max(0, int(y / env.cell_size)))
    return col, row


def is_blocked_cell(env: EnvironmentMap, col: int, row: int) -> bool:
    return not in_bounds(env, col, row) or env.blocked[row][col]


def is_blocked_point(env: EnvironmentMap, x: float, y: float) -> bool:
    col, row = world_to_grid(env, x, y)
    return is_blocked_cell(env, col, row)


def neighbors4(env: EnvironmentMap, col: int, row: int) -> Iterable[tuple[int, int]]:
    for next_col, next_row in ((col + 1, row), (col - 1, row), (col, row + 1), (col, row - 1)):
        if in_bounds(env, next_col, next_row) and not env.blocked[next_row][next_col]:
            yield next_col, next_row


def build_distance_map(env: EnvironmentMap, goal_col: int, goal_row: int) -> list[list[int | None]]:
    distances: list[list[int | None]] = [[None for _ in range(env.cols)] for _ in range(env.rows)]
    if is_blocked_cell(env, goal_col, goal_row):
        return distances

    queue: deque[tuple[int, int]] = deque()
    queue.append((goal_col, goal_row))
    distances[goal_row][goal_col] = 0

    while queue:
        col, row = queue.popleft()
        current = distances[row][col]
        assert current is not None
        for next_col, next_row in neighbors4(env, col, row):
            if distances[next_row][next_col] is None:
                distances[next_row][next_col] = current + 1
                queue.append((next_col, next_row))

    return distances


def path_distance_from_map(
    env: EnvironmentMap,
    start_x: float,
    start_y: float,
    distance_map: list[list[int | None]],
) -> float:
    col, row = world_to_grid(env, start_x, start_y)
    steps = distance_map[row][col]
    if steps is None:
        return float("inf")
    return steps * env.cell_size


def next_waypoint_from_map(
    env: EnvironmentMap,
    start_x: float,
    start_y: float,
    distance_map: list[list[int | None]],
) -> tuple[float, float] | None:
    start_col, start_row = world_to_grid(env, start_x, start_y)
    current_distance = distance_map[start_row][start_col]
    if current_distance is None:
        return None
    if current_distance == 0:
        return None

    best_cell: tuple[int, int] | None = None
    best_distance = current_distance
    for next_col, next_row in neighbors4(env, start_col, start_row):
        candidate = distance_map[next_row][next_col]
        if candidate is not None and candidate < best_distance:
            best_distance = candidate
            best_cell = (next_col, next_row)

    if best_cell is None:
        return None
    return grid_to_world(env, best_cell[0], best_cell[1])


def line_of_sight_clear(env: EnvironmentMap, x1: float, y1: float, x2: float, y2: float, samples: int = 40) -> bool:
    for step in range(samples + 1):
        ratio = step / max(samples, 1)
        x = x1 + (x2 - x1) * ratio
        y = y1 + (y2 - y1) * ratio
        if is_blocked_point(env, x, y):
            return False
    return True
