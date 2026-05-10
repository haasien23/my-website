# -*- coding: utf-8 -*-
from __future__ import annotations

import math
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


OUTDIR = Path(r"D:\biushe\output\figures\ch7")
OUTDIR.mkdir(parents=True, exist_ok=True)

W, H = 1600, 900
BG = "#FFFFFF"
BLUE = "#4F7FD1"
BLUE_DARK = "#2F5FAF"
BLUE_LIGHT = "#EAF2FF"
GREEN = "#68B05A"
GREEN_LIGHT = "#EAF7E6"
RED = "#D96B6B"
RED_LIGHT = "#FCE9E9"
GRAY = "#6F7C91"
GRAY_LIGHT = "#F4F7FB"
LINE = "#AFC2E6"


def get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        r"C:\Windows\Fonts\msyhbd.ttc" if bold else r"C:\Windows\Fonts\msyh.ttc",
        r"C:\Windows\Fonts\simhei.ttf" if bold else r"C:\Windows\Fonts\simsun.ttc",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


FONT = get_font(30)
FONT_SM = get_font(24)
FONT_XS = get_font(20)
FONT_B = get_font(34, bold=True)


def rounded(draw: ImageDraw.ImageDraw, box, fill=GRAY_LIGHT, outline=LINE, width=3, radius=24):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def text_center(draw: ImageDraw.ImageDraw, box, text: str, font=FONT, fill=BLUE_DARK, spacing=8):
    x1, y1, x2, y2 = box
    bbox = draw.multiline_textbbox((0, 0), text, font=font, spacing=spacing, align="center")
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.multiline_text(
        ((x1 + x2 - tw) / 2, (y1 + y2 - th) / 2),
        text,
        font=font,
        fill=fill,
        spacing=spacing,
        align="center",
    )


def arrow(draw: ImageDraw.ImageDraw, p1, p2, fill=BLUE, width=5, head=14, dashed=False):
    x1, y1 = p1
    x2, y2 = p2
    if dashed:
        steps = 18
        for i in range(0, steps, 2):
            a = i / steps
            b = (i + 1) / steps
            xa = x1 + (x2 - x1) * a
            ya = y1 + (y2 - y1) * a
            xb = x1 + (x2 - x1) * b
            yb = y1 + (y2 - y1) * b
            draw.line((xa, ya, xb, yb), fill=fill, width=width)
    else:
        draw.line((p1, p2), fill=fill, width=width)

    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return
    ang = math.atan2(dy, dx)
    a1 = ang + math.pi * 0.85
    a2 = ang - math.pi * 0.85
    p3 = (x2 + head * math.cos(a1), y2 + head * math.sin(a1))
    p4 = (x2 + head * math.cos(a2), y2 + head * math.sin(a2))
    draw.polygon([p2, p3, p4], fill=fill)


def chip(draw: ImageDraw.ImageDraw, box, text: str, fill=BLUE_LIGHT, outline=LINE, text_fill=BLUE_DARK):
    rounded(draw, box, fill=fill, outline=outline, radius=18, width=2)
    text_center(draw, box, text, font=FONT_XS, fill=text_fill, spacing=4)


def title(draw: ImageDraw.ImageDraw, text: str):
    text_center(draw, (40, 20, W - 40, 70), text, FONT_B, BLUE_DARK)


def save(img: Image.Image, name: str) -> Path:
    path = OUTDIR / name
    img.save(path)
    return path


def fig75() -> Path:
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    title(d, "图7-5 感知与融合模块实现示意图")

    flow = [
        ("已派机子群", (60, 320, 270, 470)),
        ("感知条件判定", (320, 320, 560, 470)),
        ("带噪观测生成", (610, 320, 850, 470)),
        ("链路传输处理", (900, 320, 1140, 470)),
        ("多机融合处理", (1190, 320, 1450, 470)),
    ]
    for label, box in flow:
        rounded(d, box, fill=BLUE_LIGHT)
        text_center(d, box, label, FONT_B)

    for i in range(len(flow) - 1):
        arrow(d, (flow[i][1][2], 395), (flow[i + 1][1][0], 395))

    chip(d, (920, 180, 1020, 240), "丢包", RED_LIGHT, "#E5B7B7", RED)
    chip(d, (1035, 180, 1135, 240), "延迟", RED_LIGHT, "#E5B7B7", RED)
    arrow(d, (970, 240), (970, 320), RED, dashed=True)
    arrow(d, (1085, 240), (1085, 320), RED, dashed=True)

    chip(d, (1185, 180, 1455, 240), "加权中心 / 稳健权重 / 聚类筛选", GRAY_LIGHT, LINE, BLUE_DARK)
    arrow(d, (1320, 240), (1320, 320), BLUE_DARK, dashed=True)

    decision = (1160, 620, 1480, 790)
    rounded(d, decision, fill=GREEN_LIGHT, outline="#A6D39B")
    text_center(d, decision, "更新目标状态\n更新误差、信息时效\n严格成功判定", FONT_B, GREEN)
    arrow(d, (1320, 470), (1320, 620))

    chip(d, (330, 560, 830, 620), "满足感知半径、无遮挡视线、视场角约束后，才进入概率探测", GRAY_LIGHT, LINE, BLUE_DARK)
    arrow(d, (440, 470), (440, 560), BLUE_DARK, dashed=True)

    return save(img, "fig7-5_sensing_fusion_module.png")


def fig76() -> Path:
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    title(d, "图7-6 实验会话管理流程图")

    steps = [
        "前端提交实验参数",
        "创建 SimulationSession",
        "初始化共享环境与策略状态",
        "保存当前会话对象",
        "接收步进推进请求",
        "返回快照结果与进度",
        "支持回放、分析与导出",
        "结束并释放会话",
    ]

    x1, x2 = 420, 1180
    y = 95
    boxes = []
    for step in steps:
        box = (x1, y, x2, y + 76)
        rounded(d, box, fill=BLUE_LIGHT)
        text_center(d, box, step, FONT_B)
        boxes.append(box)
        y += 96

    for i in range(len(boxes) - 1):
        arrow(d, (800, boxes[i][3]), (800, boxes[i + 1][1]))

    chip(d, (1200, 190, 1510, 246), "会话编号 id", GRAY_LIGHT)
    chip(d, (1200, 286, 1510, 342), "比较世界 W", GRAY_LIGHT)
    chip(d, (1200, 382, 1510, 438), "总步数 H", GRAY_LIGHT)
    chip(d, (1200, 574, 1510, 630), "快照 / 当前帧 / 指标", GRAY_LIGHT)

    return save(img, "fig7-6_session_management_flow.png")


def fig77() -> Path:
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    title(d, "图7-7 前端参数配置界面结构示意图")

    panel = (80, 100, 660, 820)
    rounded(d, panel, fill=GRAY_LIGHT)
    text_center(d, (120, 125, 620, 165), "参数配置区", FONT_B)

    groups = [
        ("运行模式", 185),
        ("集群与任务", 300),
        ("感知与通信", 430),
        ("运动与扰动", 570),
    ]
    for name, y in groups:
        gbox = (130, y, 610, y + 80)
        rounded(d, gbox, fill=BLUE_LIGHT)
        text_center(d, gbox, name, FONT)
        d.line((170, y + 55, 570, y + 55), fill=LINE, width=3)

    btn = (240, 720, 500, 790)
    rounded(d, btn, fill=GREEN_LIGHT, outline="#A6D39B")
    text_center(d, btn, "运行仿真", FONT_B, GREEN)

    right_boxes = [
        ((880, 180, 1460, 290), "fillForm()\n默认配置写入表单"),
        ((880, 390, 1460, 500), "readForm()\n读取当前参数"),
        ((880, 600, 1460, 710), "构造 JSON 载荷\n提交会话创建接口"),
    ]
    for box, txt in right_boxes:
        rounded(d, box, fill=BLUE_LIGHT)
        text_center(d, box, txt, FONT_B)
    arrow(d, (660, 450), (880, 450))
    arrow(d, (1170, 290), (1170, 390))
    arrow(d, (1170, 500), (1170, 600))

    return save(img, "fig7-7_frontend_config_structure.png")


def fig78() -> Path:
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    title(d, "图7-8 三维态势沙盘组成与交互示意图")

    main = (70, 100, 1020, 790)
    rounded(d, main, fill=GRAY_LIGHT)
    text_center(d, (110, 120, 980, 160), "主三维态势沙盘", FONT_B)

    scene = (170, 240, 900, 620)
    d.rectangle(scene, outline=LINE, width=4, fill="#F8FBFF")
    d.line((170, 480, 900, 480), fill="#CAD8EF", width=5)
    d.line((470, 240, 470, 620), fill="#CAD8EF", width=5)
    for bx in [(250, 320, 340, 430), (440, 270, 580, 390), (700, 380, 820, 520)]:
        rounded(d, bx, fill="#DDE7F8", outline=LINE, radius=12)
    for x, y in [(250, 260), (610, 320), (760, 560)]:
        d.ellipse((x - 14, y - 14, x + 14, y + 14), fill=BLUE)
    for x, y in [(360, 560), (620, 500)]:
        d.ellipse((x - 12, y - 12, x + 12, y + 12), fill=GREEN)
    arrow(d, (250, 260), (360, 560), BLUE, dashed=True)
    arrow(d, (610, 320), (620, 500), BLUE, dashed=True)
    arrow(d, (760, 560), (620, 500), BLUE, dashed=True)
    d.pieslice((170, 180, 370, 380), 320, 20, outline="#9DD4F2", fill="#EAFBFF")
    d.pieslice((520, 220, 710, 390), 110, 200, outline="#9DD4F2", fill="#EAFBFF")

    items = [
        "地面 / 道路 / 障碍建筑",
        "无人机 / 目标 / 感知范围",
        "轨迹尾迹 / 派机链路",
        "旋转 / 缩放 / 俯视复位 / 局部放大",
        "主视图 / 基线视图 / 三视图对比",
    ]
    y = 160
    for item in items:
        box = (1090, y, 1510, y + 90)
        rounded(d, box, fill=BLUE_LIGHT)
        text_center(d, box, item, FONT)
        y += 108

    return save(img, "fig7-8_scene3d_structure.png")


def fig79() -> Path:
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    title(d, "图7-9 三算法对比展示结构示意图")

    panes = [
        ("RADS", GREEN_LIGHT, GREEN),
        ("随机派遣", BLUE_LIGHT, BLUE_DARK),
        ("全量派遣", RED_LIGHT, RED),
    ]
    x = 60
    centers = []
    for label, fill, color in panes:
        box = (x, 120, x + 460, 360)
        rounded(d, box, fill=fill)
        text_center(d, (x, 145, x + 460, 195), label, FONT_B, color)
        chip(d, (x + 40, 225, x + 170, 275), "指标卡片")
        chip(d, (x + 185, 225, x + 315, 275), "当前态势")
        chip(d, (x + 115, 300, x + 345, 340), "任务级结果")
        centers.append((x + 230, 360))
        x += 510

    compare = (200, 500, 740, 700)
    detail = (860, 500, 1400, 700)
    rounded(d, compare, fill=BLUE_LIGHT)
    rounded(d, detail, fill=GRAY_LIGHT)
    text_center(d, compare, "统一场景下的\n三策略并排比较", FONT_B)
    text_center(d, detail, "目标追踪联动\n指标、表格、视图同步更新", FONT_B)

    for c in centers:
        arrow(d, c, (470, 500))
        arrow(d, c, (1130, 500), dashed=True)

    return save(img, "fig7-9_comparison_display_structure.png")


def fig710() -> Path:
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    title(d, "图7-10 实验结果导出与数据组织示意图")

    left = (70, 250, 430, 560)
    mid = (620, 250, 980, 560)
    right = (1170, 170, 1510, 640)
    rounded(d, left, fill=BLUE_LIGHT)
    rounded(d, mid, fill=GRAY_LIGHT)
    rounded(d, right, fill=GREEN_LIGHT, outline="#A6D39B")

    text_center(d, left, "后端结构化快照\n环境信息\n策略快照\n任务级结果\n实验总结", FONT_B)
    text_center(d, mid, "前端结果整理\n指标汇总\n任务级筛选\n中文字段组织", FONT_B)
    text_center(d, right, "CSV 导出结果\n\n实验配置摘要\n策略核心指标\n任务级关键结果\n任务精细对比", FONT_B, GREEN)

    arrow(d, (430, 405), (620, 405))
    arrow(d, (980, 405), (1170, 405))

    chip(d, (630, 640, 970, 705), "页面展示与导出内容保持一致", GRAY_LIGHT, LINE, BLUE_DARK)

    return save(img, "fig7-10_export_data_flow.png")


def main():
    paths = [fig75(), fig76(), fig77(), fig78(), fig79(), fig710()]
    for path in paths:
        print(path)


if __name__ == "__main__":
    main()
