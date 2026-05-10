from __future__ import annotations

from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
CHAPTER_NO = 3
OUT_DIR = ROOT / "output" / "figures" / f"ch{CHAPTER_NO}"

FONT_REG = r"C:\Windows\Fonts\msyh.ttc"
FONT_BOLD = r"C:\Windows\Fonts\msyhbd.ttc"

BG = (250, 252, 255)
NAVY = (31, 65, 114)
TEAL = (54, 154, 160)
TEAL_LIGHT = (221, 242, 243)
GRAY = (84, 95, 112)
GRAY_LIGHT = (232, 238, 246)
LINE = (190, 202, 220)
WHITE = (255, 255, 255)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size=size)


TITLE_FONT = font(40, True)
SUBTITLE_FONT = font(24)
BOX_TITLE_FONT = font(26, True)
BOX_TEXT_FONT = font(22)
TABLE_HEAD_FONT = font(24, True)
TABLE_TEXT_FONT = font(21)


def make_canvas(width: int = 2200, height: int = 1400) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(image)
    return image, draw


def save(image: Image.Image, name: str) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    image.save(OUT_DIR / name, dpi=(300, 300))


def text_size(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont) -> tuple[int, int]:
    bbox = draw.textbbox((0, 0), text, font=fnt)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def wrap_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    fnt: ImageFont.FreeTypeFont,
    max_width: int,
) -> list[str]:
    if not text:
        return [""]
    lines: list[str] = []
    current = ""
    for ch in text:
        candidate = current + ch
        width, _ = text_size(draw, candidate, fnt)
        if current and width > max_width:
            lines.append(current)
            current = ch
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


def draw_centered_text(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    text: str,
    fnt: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int] = GRAY,
    line_gap: int = 8,
) -> None:
    lines = wrap_text(draw, text, fnt, box[2] - box[0] - 24)
    heights = [text_size(draw, line, fnt)[1] for line in lines]
    total_h = sum(heights) + line_gap * (len(lines) - 1)
    y = box[1] + (box[3] - box[1] - total_h) // 2
    for line, h in zip(lines, heights):
        w, _ = text_size(draw, line, fnt)
        x = box[0] + (box[2] - box[0] - w) // 2
        draw.text((x, y), line, font=fnt, fill=fill)
        y += h + line_gap


def draw_title(draw: ImageDraw.ImageDraw, title: str, subtitle: str | None = None) -> None:
    tw, th = text_size(draw, title, TITLE_FONT)
    draw.text(((2200 - tw) // 2, 48), title, font=TITLE_FONT, fill=NAVY)
    if subtitle:
        sw, _ = text_size(draw, subtitle, SUBTITLE_FONT)
        draw.text(((2200 - sw) // 2, 110), subtitle, font=SUBTITLE_FONT, fill=GRAY)
    draw.rounded_rectangle((80, 160, 2120, 1320), radius=30, outline=LINE, width=2, fill=(252, 253, 255))


def rounded_box(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int, int, int],
    title: str,
    body: str | None = None,
    fill: tuple[int, int, int] = WHITE,
    outline: tuple[int, int, int] = LINE,
    title_fill: tuple[int, int, int] = NAVY,
) -> None:
    draw.rounded_rectangle(xy, radius=24, fill=fill, outline=outline, width=3)
    title_box = (xy[0] + 20, xy[1] + 18, xy[2] - 20, xy[1] + 78)
    draw_centered_text(draw, title_box, title, BOX_TITLE_FONT, fill=title_fill)
    if body:
        body_box = (xy[0] + 24, xy[1] + 88, xy[2] - 24, xy[3] - 24)
        draw_centered_text(draw, body_box, body, BOX_TEXT_FONT, fill=GRAY, line_gap=6)


def draw_arrow(
    draw: ImageDraw.ImageDraw,
    start: tuple[int, int],
    end: tuple[int, int],
    color: tuple[int, int, int] = TEAL,
    width: int = 7,
    head: int = 18,
) -> None:
    draw.line([start, end], fill=color, width=width)
    x1, y1 = end
    x0, y0 = start
    if abs(x1 - x0) >= abs(y1 - y0):
        if x1 >= x0:
            pts = [(x1, y1), (x1 - head, y1 - head // 2), (x1 - head, y1 + head // 2)]
        else:
            pts = [(x1, y1), (x1 + head, y1 - head // 2), (x1 + head, y1 + head // 2)]
    else:
        if y1 >= y0:
            pts = [(x1, y1), (x1 - head // 2, y1 - head), (x1 + head // 2, y1 - head)]
        else:
            pts = [(x1, y1), (x1 - head // 2, y1 + head), (x1 + head // 2, y1 + head)]
    draw.polygon(pts, fill=color)


def draw_chip(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], text: str) -> None:
    draw.rounded_rectangle(xy, radius=18, fill=TEAL_LIGHT, outline=(183, 224, 225), width=2)
    draw_centered_text(draw, xy, text, BOX_TEXT_FONT, fill=(42, 116, 120))


def create_figure_5_1() -> None:
    image, draw = make_canvas()
    draw_title(draw, f"图{CHAPTER_NO}-1 平台总体目标与组成示意图", "面向复杂环境的无人机集群多任务协同态势感知平台")
    center = (730, 500, 1470, 880)
    rounded_box(
        draw,
        center,
        "无人机集群多任务协同态势感知平台",
        "统一集成复杂环境建模、\n三策略运行、三维展示、\n任务级分析与结果导出",
        fill=(240, 247, 255),
        outline=(163, 193, 227),
        title_fill=NAVY,
    )
    boxes = [
        ((180, 290, 580, 500), "复杂环境建模", "障碍物、天气、\n链路、故障"),
        ((1620, 290, 2020, 500), "多策略运行", "RADS、随机派遣、\n全量派遣"),
        ((160, 930, 590, 1145), "任务级分析", "目标状态、误差、\n原因与追踪"),
        ((1600, 930, 2040, 1145), "实验结果导出", "配置摘要、指标结果、\n任务精细对比"),
        ((860, 980, 1340, 1190), "三维态势展示", "主沙盘、基线观察窗、\n三视图大对比"),
    ]
    for xy, t, b in boxes:
        rounded_box(draw, xy, t, b)
    draw_arrow(draw, (580, 395), (730, 560))
    draw_arrow(draw, (1620, 395), (1470, 560))
    draw_arrow(draw, (590, 980), (815, 820))
    draw_arrow(draw, (1600, 980), (1385, 820))
    draw_arrow(draw, (1100, 980), (1100, 880))
    draw_chip(draw, (760, 240, 1450, 330), "建设目标：可运行、可比较、可展示、可分析")
    save(image, f"fig{CHAPTER_NO}-1_platform_goals.png")


def create_figure_5_2() -> None:
    image, draw = make_canvas()
    draw_title(draw, f"图{CHAPTER_NO}-2 系统总体架构图", "平台采用轻量级前后端分离架构")
    layers = [
        ((220, 260, 1980, 470), "表示层", ["参数配置", "指标展示", "三维态势沙盘", "任务分析", "实验总结与导出"]),
        ((220, 560, 1980, 770), "业务控制层", ["Web 服务", "接口分发", "实验会话管理", "数据组织与返回"]),
        ((220, 860, 1980, 1180), "仿真计算层", ["复杂环境建模", "路径规划", "策略调度", "目标运动更新", "感知融合", "指标统计"]),
    ]
    for xy, title, items in layers:
        draw.rounded_rectangle(xy, radius=26, outline=(177, 194, 219), width=3, fill=WHITE)
        draw.rounded_rectangle((xy[0] + 24, xy[1] + 18, xy[0] + 220, xy[1] + 76), radius=18, fill=(231, 239, 251))
        draw_centered_text(draw, (xy[0] + 30, xy[1] + 22, xy[0] + 214, xy[1] + 72), title, BOX_TITLE_FONT, fill=NAVY)
        x = xy[0] + 260
        y = xy[1] + 78
        bw = 245
        bh = 88
        gap = 25
        for idx, item in enumerate(items):
            bx = x + idx * (bw + gap)
            rounded_box(draw, (bx, y, bx + bw, y + bh), item, None, fill=(248, 251, 255), outline=(210, 220, 235))
    draw_arrow(draw, (1100, 470), (1100, 560))
    draw_arrow(draw, (1100, 770), (1100, 860))
    save(image, f"fig{CHAPTER_NO}-2_system_architecture.png")


def create_figure_5_3() -> None:
    image, draw = make_canvas()
    draw_title(draw, f"图{CHAPTER_NO}-3 前端模块结构图")
    root_box = (730, 270, 1470, 480)
    rounded_box(draw, root_box, "前端展示与交互层", "页面模板、交互脚本、样式文件、三维渲染脚本", fill=(240, 247, 255), outline=(163, 193, 227))
    children = [
        ((130, 740, 500, 960), "参数配置模块", "对应页面结构与表单控件\n主要文件：index.html、app.js"),
        ((560, 740, 930, 960), "策略指标展示模块", "指标卡片渲染与动态刷新\n主要文件：index.html、app.js、styles.css"),
        ((990, 740, 1360, 960), "三维态势沙盘模块", "主视图、基线观察窗、\n视角与回放交互\n主要文件：scene3d-webgl.mjs、app.js"),
        ((1420, 740, 1790, 960), "任务分析与联动模块", "任务级表格、目标追踪、\n视图联动高亮\n主要文件：index.html、app.js"),
        ((850, 1040, 1350, 1250), "实验总结与导出模块", "叙述文本生成、CSV导出、\n实验结果整理\n主要文件：app.js、styles.css"),
    ]
    for xy, t, b in children:
        rounded_box(draw, xy, t, b)
    starts = [(320, 740), (745, 740), (1175, 740), (1605, 740), (1100, 1040)]
    ends = [(900, 480), (1030, 480), (1100, 480), (1170, 480), (1100, 480)]
    for s, e in zip(starts, ends):
        draw_arrow(draw, e, s)
    save(image, f"fig{CHAPTER_NO}-3_frontend_modules.png")


def create_figure_5_4() -> None:
    image, draw = make_canvas()
    draw_title(draw, f"图{CHAPTER_NO}-4 后端模块结构图")
    root_box = (730, 250, 1470, 460)
    rounded_box(draw, root_box, "后端仿真与服务层", "Web 服务、会话管理、仿真引擎与路径规划", fill=(240, 247, 255), outline=(163, 193, 227))
    modules = [
        ((140, 700, 470, 900), "Web服务模块", "页面渲染、默认参数、\n会话接口\nserver.py"),
        ((520, 700, 850, 900), "会话管理模块", "创建、推进、删除会话\nsessions.py"),
        ((900, 700, 1230, 900), "场景建模模块", "地图、障碍物、无人机、\n目标初始化\ncore.py"),
        ((1280, 700, 1610, 900), "策略调度模块", "RADS、随机派遣、全量派遣\ncore.py"),
        ((1660, 700, 1990, 900), "路径规划与运动模块", "距离图、下一跳、运动更新\npathfinding.py、core.py"),
        ((760, 1030, 1440, 1240), "感知融合与指标统计模块", "感知判定、观测生成、链路传输、多机融合、\n严格成功率与误差统计\ncore.py"),
    ]
    for xy, t, b in modules:
        rounded_box(draw, xy, t, b)
    for end_x in (305, 685, 1065, 1445, 1825):
        draw_arrow(draw, (1100, 460), (end_x, 700))
    draw_arrow(draw, (1100, 460), (1100, 1030))
    save(image, f"fig{CHAPTER_NO}-4_backend_modules.png")


def create_figure_5_5() -> None:
    image, draw = make_canvas()
    draw_title(draw, f"图{CHAPTER_NO}-5 系统数据流图")
    nodes = [
        ((120, 540, 420, 700), "用户输入参数"),
        ((520, 540, 860, 700), "前端参数配置与请求组织"),
        ((980, 540, 1290, 700), "后端会话创建"),
        ((1410, 540, 1760, 700), "仿真推进与快照生成"),
        ((1840, 540, 2100, 700), "前端展示更新"),
    ]
    for xy, t in nodes:
        rounded_box(draw, xy, t)
    for i in range(len(nodes) - 1):
        draw_arrow(draw, (nodes[i][0][2], 620), (nodes[i + 1][0][0], 620))
    draw_chip(draw, (1480, 290, 2040, 380), "返回内容：指标卡片、三维场景、任务表格、实验总结")
    draw_arrow(draw, (1700, 540), (1760, 380))
    export_box = (850, 920, 1370, 1110)
    rounded_box(draw, export_box, "实验结果导出", "导出配置摘要、核心指标、\n任务级关键结果与精细对比")
    draw_arrow(draw, (1970, 700), (1370, 1015))
    draw_arrow(draw, (850, 1015), (420, 700))
    save(image, f"fig{CHAPTER_NO}-5_data_flow.png")


def create_figure_5_6() -> None:
    image, draw = make_canvas(width=1800, height=2200)
    global TITLE_FONT, SUBTITLE_FONT
    draw = ImageDraw.Draw(image)
    title = f"图{CHAPTER_NO}-6 系统运行流程图"
    tw, _ = text_size(draw, title, TITLE_FONT)
    draw.text(((1800 - tw) // 2, 50), title, font=TITLE_FONT, fill=NAVY)
    steps = [
        "进入平台首页并加载默认参数",
        "用户调整参数并选择运行模式",
        "前端提交配置并创建实验会话",
        "后端生成场景并初始化策略状态",
        "系统按步推进仿真过程",
        "前端同步更新三维场景与分析区域",
        "用户进行回放、追踪与对比分析",
        "导出实验结果并结束当前实验",
    ]
    top = 180
    box_w = 1150
    box_h = 150
    left = (1800 - box_w) // 2
    for idx, step in enumerate(steps):
        y0 = top + idx * 235
        xy = (left, y0, left + box_w, y0 + box_h)
        fill = (240, 247, 255) if idx % 2 == 0 else WHITE
        rounded_box(draw, xy, f"步骤 {idx + 1}", step, fill=fill, outline=(182, 200, 226))
        if idx < len(steps) - 1:
            draw_arrow(draw, (900, y0 + box_h), (900, y0 + 235))
    save(image, f"fig{CHAPTER_NO}-6_runtime_flow.png")


def draw_table(
    name: str,
    title: str,
    headers: list[str],
    rows: list[list[str]],
    col_widths: list[int],
) -> None:
    width = sum(col_widths) + 220
    image = Image.new("RGB", (width, 1300), BG)
    draw = ImageDraw.Draw(image)
    tw, _ = text_size(draw, title, TITLE_FONT)
    draw.text(((width - tw) // 2, 40), title, font=TITLE_FONT, fill=NAVY)
    left = 90
    top = 150
    row_h = 96
    header_h = 96

    x = left
    for header, col_w in zip(headers, col_widths):
        draw.rounded_rectangle((x, top, x + col_w, top + header_h), radius=10, fill=(231, 239, 251), outline=LINE, width=2)
        draw_centered_text(draw, (x + 10, top + 8, x + col_w - 10, top + header_h - 8), header, TABLE_HEAD_FONT, fill=NAVY)
        x += col_w

    y = top + header_h
    for row_idx, row in enumerate(rows):
        x = left
        fill = WHITE if row_idx % 2 == 0 else (247, 250, 255)
        # compute dynamic row height
        cell_heights = []
        for text, col_w in zip(row, col_widths):
            lines = wrap_text(draw, text, TABLE_TEXT_FONT, col_w - 28)
            cell_heights.append(max(1, len(lines)) * 32 + 26)
        h = max(max(cell_heights), row_h)
        for text, col_w in zip(row, col_widths):
            draw.rectangle((x, y, x + col_w, y + h), fill=fill, outline=LINE, width=2)
            draw_centered_text(draw, (x + 10, y + 8, x + col_w - 10, y + h - 8), text, TABLE_TEXT_FONT, fill=GRAY, line_gap=4)
            x += col_w
        y += h

    save(image, name)


def create_tables() -> None:
    draw_table(
        f"tab{CHAPTER_NO}-1_function_requirements.png",
        f"表{CHAPTER_NO}-1 系统功能需求汇总表",
        ["需求类别", "具体功能", "作用说明", "对应模块"],
        [
            ["参数配置功能", "设置无人机、目标、障碍物、天气、感知与通信参数", "控制实验场景复杂度与运行条件", "参数配置模块"],
            ["多策略运行功能", "支持RADS、随机派遣、全量派遣单独运行或同步对比", "保证策略分析具有统一场景基础", "策略运行模块"],
            ["动态回放功能", "支持步进推进、播放、暂停、进度控制", "观察感知过程的时间演化", "回放控制模块"],
            ["三维态势展示功能", "显示无人机、目标、障碍物、感知范围与派机关系", "直观表达复杂环境中的协同态势", "三维态势沙盘模块"],
            ["任务级分析功能", "展示目标优先级、不确定性、误差和失败原因", "支持目标级差异分析与联动解释", "任务分析模块"],
            ["结果导出功能", "导出实验配置、核心指标、任务关键结果与精细对比", "服务论文写作、绘图与结果复现", "导出模块"],
        ],
        [240, 560, 520, 280],
    )

    draw_table(
        f"tab{CHAPTER_NO}-2_nonfunctional_requirements.png",
        f"表{CHAPTER_NO}-2 系统非功能需求分析表",
        ["非功能需求", "具体要求", "在本平台中的体现"],
        [
            ["真实性", "能够合理模拟障碍遮挡、天气扰动、链路丢包与节点故障", "后端统一建模场景、链路、天气与故障状态"],
            ["实时性", "中等规模场景下保持较流畅交互与回放体验", "会话步进与前端增量更新配合实现动态展示"],
            ["可扩展性", "便于新增策略、参数和展示模块", "前后端分离、模块化仿真引擎与统一接口结构"],
            ["易用性", "界面清晰、功能分区明确、交互方式直观", "参数区、主沙盘、任务表格和导出区布局清晰"],
            ["可维护性", "降低页面逻辑、服务逻辑与仿真逻辑耦合度", "server.py、sessions.py、core.py、app.js 分层组织"],
        ],
        [260, 620, 820],
    )

    draw_table(
        f"tab{CHAPTER_NO}-3_frontend_file_mapping.png",
        f"表{CHAPTER_NO}-3 前端模块与页面文件对应关系",
        ["模块名称", "对应文件", "主要职责"],
        [
            ["参数配置模块", "templates/index.html、static/app.js", "提供实验参数输入、默认值填充与运行控制入口"],
            ["策略指标展示模块", "templates/index.html、static/app.js、static/styles.css", "显示三种策略的核心指标卡片与摘要信息"],
            ["三维态势沙盘模块", "static/scene3d-webgl.mjs、static/app.js", "渲染主视图、基线观察窗和三视图大对比"],
            ["任务分析与联动模块", "templates/index.html、static/app.js", "展示任务级结果并实现目标追踪与联动高亮"],
            ["实验总结与导出模块", "static/app.js、static/styles.css", "生成实验叙述并导出CSV结果文件"],
        ],
        [320, 700, 680],
    )

    draw_table(
        f"tab{CHAPTER_NO}-4_api_summary.png",
        f"表{CHAPTER_NO}-4 主要接口说明表",
        ["接口名称", "请求方式", "作用说明"],
        [
            ["页面渲染接口 /", "GET", "返回平台首页与基础页面结构"],
            ["默认配置接口 /api/default-config", "GET", "返回系统初始化所需默认实验参数"],
            ["会话创建接口 /api/sessions", "POST", "根据当前参数创建新的实验会话并返回初始快照"],
            ["会话推进接口 /api/sessions/{id}/advance", "POST", "推进当前实验若干步并返回最新策略结果与帧数据"],
            ["会话删除接口 /api/sessions/{id}", "DELETE", "结束实验并释放后端保存的会话资源"],
        ],
        [620, 220, 860],
    )


def main() -> None:
    create_figure_5_1()
    create_figure_5_2()
    create_figure_5_3()
    create_figure_5_4()
    create_figure_5_5()
    create_figure_5_6()
    create_tables()
    print(OUT_DIR)


if __name__ == "__main__":
    main()
