from __future__ import annotations

import argparse
import json
import mimetypes
from dataclasses import asdict
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlparse

from jinja2 import Environment, FileSystemLoader, select_autoescape

from src.simulation import SimulationConfig
from src.simulation.core import normalize_execution_mode, normalize_weather_preset
from .sessions import SessionStore


ROOT_DIR = Path(__file__).resolve().parents[2]
TEMPLATE_DIR = ROOT_DIR / "templates"
STATIC_DIR = ROOT_DIR / "static"
JINJA_ENV = Environment(
    loader=FileSystemLoader(str(TEMPLATE_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)
SESSIONS = SessionStore()

mimetypes.add_type("application/javascript", ".mjs")
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")

STATIC_CONTENT_TYPES = {
    ".mjs": "application/javascript; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
}


def clamp_int(value: Any, default: int, minimum: int, maximum: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = default
    return max(minimum, min(maximum, parsed))


def clamp_float(value: Any, default: float, minimum: float, maximum: float) -> float:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        parsed = default
    return max(minimum, min(maximum, parsed))


def build_config(payload: dict[str, Any] | None) -> SimulationConfig:
    data = payload or {}
    return SimulationConfig(
        drone_count=clamp_int(data.get("drone_count"), 24, 8, 60),
        target_count=clamp_int(data.get("target_count"), 6, 1, 18),
        obstacle_count=clamp_int(data.get("obstacle_count"), 26, 0, 80),
        sensor_range=clamp_float(data.get("sensor_range"), 180.0, 80.0, 260.0),
        sensor_fov_deg=clamp_float(data.get("sensor_fov_deg"), 120.0, 45.0, 160.0),
        comm_range=clamp_float(data.get("comm_range"), 300.0, 120.0, 420.0),
        packet_loss_rate=clamp_float(data.get("packet_loss_rate"), 0.04, 0.0, 0.45),
        comm_delay_steps=clamp_int(data.get("comm_delay_steps"), 0, 0, 6),
        drone_speed=clamp_float(data.get("drone_speed"), 28.0, 12.0, 42.0),
        target_speed=clamp_float(data.get("target_speed"), 14.0, 4.0, 28.0),
        sensor_noise=clamp_float(data.get("sensor_noise"), 8.0, 2.0, 20.0),
        merge_radius=clamp_float(data.get("merge_radius"), 55.0, 15.0, 120.0),
        min_observations=clamp_int(data.get("min_observations"), 1, 1, 5),
        fault_rate=clamp_float(data.get("fault_rate"), 0.06, 0.0, 0.20),
        dispatch_ratio=clamp_float(data.get("dispatch_ratio"), 0.45, 0.20, 0.80),
        run_steps=clamp_int(data.get("run_steps"), 40, 5, 160),
        seed=clamp_int(data.get("seed"), 20260412, 1, 99999999),
        execution_mode=normalize_execution_mode(str(data.get("execution_mode", "compare_all"))),
        weather_preset=normalize_weather_preset(str(data.get("weather_preset", "clear"))),
    )


class AppHandler(BaseHTTPRequestHandler):
    server_version = "UAVSimHTTP/2.0"

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = unquote(parsed.path)

        if path == "/":
            return self.handle_index()
        if path == "/api/default-config":
            return self.send_json(HTTPStatus.OK, {"config": asdict(SimulationConfig())})
        if path.startswith("/static/"):
            return self.handle_static(path.removeprefix("/static/"))
        self.send_error(HTTPStatus.NOT_FOUND, "Not Found")

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/sessions":
            return self.handle_create_session()
        if parsed.path.startswith("/api/sessions/") and parsed.path.endswith("/advance"):
            session_id = parsed.path.removeprefix("/api/sessions/").removesuffix("/advance").strip("/")
            return self.handle_advance_session(session_id)
        self.send_error(HTTPStatus.NOT_FOUND, "Not Found")

    def do_DELETE(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/sessions/"):
            session_id = parsed.path.removeprefix("/api/sessions/").strip("/")
            SESSIONS.delete(session_id)
            return self.send_json(HTTPStatus.OK, {"deleted": True, "session_id": session_id})
        self.send_error(HTTPStatus.NOT_FOUND, "Not Found")

    def handle_index(self) -> None:
        template = JINJA_ENV.get_template("index.html")
        html = template.render(default_config_json=json.dumps(asdict(SimulationConfig()), ensure_ascii=False))
        self.send_bytes(HTTPStatus.OK, html.encode("utf-8"), "text/html; charset=utf-8")

    def handle_static(self, relative_path: str) -> None:
        file_path = (STATIC_DIR / relative_path).resolve()
        if not str(file_path).startswith(str(STATIC_DIR.resolve())) or not file_path.exists() or not file_path.is_file():
            self.send_error(HTTPStatus.NOT_FOUND, "Static file not found")
            return
        content_type = STATIC_CONTENT_TYPES.get(file_path.suffix.lower())
        if content_type is None:
            guessed_type, _ = mimetypes.guess_type(str(file_path))
            content_type = guessed_type or "application/octet-stream"
        self.send_bytes(
            HTTPStatus.OK,
            file_path.read_bytes(),
            content_type,
            extra_headers={"Cache-Control": "no-store, max-age=0", "Pragma": "no-cache"},
        )

    def handle_create_session(self) -> None:
        payload = self.read_json()
        if payload is None:
            return
        session = SESSIONS.create(build_config(payload))
        response = session.advance(0)
        self.send_json(HTTPStatus.OK, response)

    def handle_advance_session(self, session_id: str) -> None:
        session = SESSIONS.get(session_id)
        if session is None:
            self.send_json(HTTPStatus.NOT_FOUND, {"error": "Session not found"})
            return
        payload = self.read_json() or {}
        steps = clamp_int(payload.get("steps"), 1, 1, 5)
        response = session.advance(steps)
        self.send_json(HTTPStatus.OK, response)

    def read_json(self) -> dict[str, Any] | None:
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        raw = self.rfile.read(length) if length > 0 else b"{}"
        try:
            return json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON payload"})
            return None

    def send_json(self, status: HTTPStatus, payload: dict[str, Any]) -> None:
        self.send_bytes(status, json.dumps(payload, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8")

    def send_bytes(
        self,
        status: HTTPStatus,
        payload: bytes,
        content_type: str,
        extra_headers: dict[str, str] | None = None,
    ) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(payload)))
        for header, value in (extra_headers or {}).items():
            self.send_header(header, value)
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, format: str, *args: Any) -> None:
        print(f"[{self.log_date_time_string()}] {self.address_string()} {format % args}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="UAV situational awareness web app")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    server = ThreadingHTTPServer((args.host, args.port), AppHandler)
    print(f"Server running at http://{args.host}:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
