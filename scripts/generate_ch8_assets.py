# -*- coding: utf-8 -*-
from __future__ import annotations

import csv
from pathlib import Path
from statistics import mean

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager
from PIL import Image, ImageDraw, ImageFont


OUTDIR = Path(r"D:\biushe\output\figures\ch8")
OUTDIR.mkdir(parents=True, exist_ok=True)

CSV_FILES = [
    Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_152539.csv"),  # baseline
    Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_160102.csv"),  # task scale
    Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_160249.csv"),  # haze
    Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_160404.csv"),  # rain
    Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_160456.csv"),  # storm
    Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_160607.csv"),  # obstacle
    Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_162351.csv"),  # comm range 400
    Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_162451.csv"),  # comm range 500
    Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_162548.csv"),  # loss 0
    Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_162639.csv"),  # loss 10
    Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_162742.csv"),  # delay 1
    Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_162849.csv"),  # delay 2
]

STRATEGIES = ["RADS 动态子群", "随机派遣", "全量派遣"]

FONT_PATHS = [
    Path(r"C:\Windows\Fonts\msyh.ttc"),
    Path(r"C:\Windows\Fonts\simhei.ttf"),
    Path(r"C:\Windows\Fonts\simsun.ttc"),
]


def get_pil_font(size: int, bold: bool = False):
    bold_candidates = [
        Path(r"C:\Windows\Fonts\msyhbd.ttc"),
        Path(r"C:\Windows\Fonts\simhei.ttf"),
    ] if bold else FONT_PATHS
    for p in bold_candidates:
        if p.exists():
            return ImageFont.truetype(str(p), size=size)
    return ImageFont.load_default()


def get_matplotlib_font():
    for p in FONT_PATHS:
        if p.exists():
            return font_manager.FontProperties(fname=str(p))
    return None


FONT = get_pil_font(26)
FONT_SM = get_pil_font(22)
FONT_B = get_pil_font(30, bold=True)
MPL_FONT = get_matplotlib_font()


def parse_csv(path: Path):
    rows = []
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        for row in reader:
            rows.append([c.strip() for c in row])

    config = {}
    metrics = {}
    section = None
    headers = None
    for row in rows:
        if not row or not any(row):
            continue
        first = row[0]
        if first == "实验配置摘要":
            section = "config"
            headers = None
            continue
        if first == "策略核心指标":
            section = "metrics"
            headers = None
            continue
        if first in {"任务级关键结果", "任务精细对比"}:
            section = None
            headers = None
            continue
        if section == "config":
            if row[0] == "参数":
                continue
            if len(row) >= 2:
                config[row[0]] = row[1]
        elif section == "metrics":
            if row[0] == "策略":
                headers = row
                continue
            if headers and len(row) >= len(headers):
                name = row[0]
                metrics[name] = {
                    headers[i]: row[i] for i in range(1, len(headers))
                }
    return config, metrics


def load_all():
    experiments = []
    for path in CSV_FILES:
        config, metrics = parse_csv(path)
        experiments.append({"file": path.name, "config": config, "metrics": metrics})
    return experiments


def to_float(s: str) -> float:
    return float(s)


def aggregate(experiments):
    result = {}
    for strategy in STRATEGIES:
        values = {
            "严格成功率(%)": [],
            "定位达标率(%)": [],
            "确认率(%)": [],
            "平均定位误差(m)": [],
            "累计能耗": [],
            "平均派机数量": [],
            "平均信息时效(步)": [],
        }
        for exp in experiments:
            metric = exp["metrics"][strategy]
            for k in values:
                values[k].append(to_float(metric[k]))
        result[strategy] = {k: mean(v) for k, v in values.items()}
    return result


def draw_table(title: str, headers, rows, out_path: Path, col_widths=None):
    width = 1600
    margin = 40
    title_h = 70
    header_h = 64
    row_h = 60
    ncols = len(headers)
    if col_widths is None:
        usable = width - margin * 2
        col_widths = [usable // ncols] * ncols
    height = margin * 2 + title_h + header_h + row_h * len(rows)
    img = Image.new("RGB", (width, height), "#FFFFFF")
    d = ImageDraw.Draw(img)

    # outer frame
    d.rounded_rectangle((20, 16, width - 20, height - 20), radius=28, outline="#8FB0E2", width=3, fill="#FFFFFF")

    # title pill
    d.rounded_rectangle((margin, 18, width - margin, 72), radius=22, outline="#9DBAE8", width=2, fill="#EEF5FF")
    bbox = d.multiline_textbbox((0, 0), title, font=FONT_B)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    d.multiline_text(((width - tw) / 2, 24 + (48 - th) / 2), title, font=FONT_B, fill="#244E91", align="center")

    x = margin
    y = margin + title_h
    for i, h in enumerate(headers):
        w = col_widths[i]
        d.rectangle((x, y, x + w, y + header_h), fill="#DDEAFF", outline="#7FA3DB", width=2)
        bbox = d.multiline_textbbox((0, 0), h, font=FONT_SM, spacing=4, align="center")
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        d.multiline_text((x + (w - tw) / 2, y + (header_h - th) / 2), h, font=FONT_SM, fill="#244E91", spacing=4, align="center")
        x += w

    y += header_h
    for r_idx, row in enumerate(rows):
        x = margin
        fill = "#FFFFFF" if r_idx % 2 == 0 else "#F7FAFF"
        for c_idx, cell in enumerate(row):
            w = col_widths[c_idx]
            d.rectangle((x, y, x + w, y + row_h), fill=fill, outline="#B8CAE8", width=1)
            text = str(cell)
            bbox = d.multiline_textbbox((0, 0), text, font=FONT_SM, spacing=4)
            tw = bbox[2] - bbox[0]
            th = bbox[3] - bbox[1]
            if c_idx == 0:
                tx = x + 14
            else:
                tx = x + (w - tw) / 2
            ty = y + (row_h - th) / 2
            d.multiline_text((tx, ty), text, font=FONT_SM, fill="#24364D", spacing=4)
            x += w
        y += row_h

    img.save(out_path)


def make_bar_pair(title: str, left_label: str, left_values, right_label: str, right_values, out_path: Path):
    fig, axes = plt.subplots(1, 2, figsize=(12.8, 5.6), dpi=180)
    colors = ["#8FD17A", "#78A8F3", "#FF9C9C"]
    edge_colors = ["#4D9A3A", "#3C78D8", "#D96B6B"]
    labels = ["RADS", "随机派遣", "全量派遣"]
    font = MPL_FONT
    fig.patch.set_facecolor("#FFFFFF")

    for ax, vals, ylabel in zip(axes, [left_values, right_values], [left_label, right_label]):
        x = list(range(len(labels)))
        ax.set_facecolor("#FBFDFF")
        bars = ax.bar(x, vals, color=colors, edgecolor=edge_colors, linewidth=1.8, width=0.56, zorder=3)
        ax.set_ylabel(ylabel, fontproperties=font, color="#244E91")
        ax.grid(axis="y", linestyle="--", alpha=0.28, color="#9BB8E5", zorder=0)
        ax.set_axisbelow(True)
        ax.set_xticks(x)
        if font:
            ax.set_xticklabels(labels, fontproperties=font)
            ax.yaxis.label.set_fontproperties(font)
        else:
            ax.set_xticklabels(labels)
        ax.tick_params(axis="both", colors="#4A648A")
        for side in ["left", "bottom", "top", "right"]:
            ax.spines[side].set_color("#B8CAE8")
            ax.spines[side].set_linewidth(1.1)
        for b, v in zip(bars, vals):
            ax.text(
                b.get_x() + b.get_width() / 2,
                b.get_height(),
                f"{v:.1f}",
                ha="center",
                va="bottom",
                fontsize=10,
                color="#24364D",
                fontproperties=font,
            )
        ax.set_title("指标对比", fontsize=12, color="#5679AF", fontproperties=font, pad=10)

    fig.suptitle(title, fontsize=16, color="#244E91", fontproperties=font)
    fig.tight_layout(rect=[0.02, 0.02, 0.98, 0.92])
    fig.savefig(out_path, bbox_inches="tight")
    plt.close(fig)


def main():
    experiments = load_all()
    agg = aggregate(experiments)

    # Table 8-5
    headers = ["策略", "平均严格成功率(%)", "平均定位达标率(%)", "平均确认率(%)", "平均定位误差(m)", "平均累计能耗", "平均派机数量", "平均信息时效(步)"]
    rows = []
    for s in STRATEGIES:
        a = agg[s]
        rows.append([
            s,
            f"{a['严格成功率(%)']:.1f}",
            f"{a['定位达标率(%)']:.1f}",
            f"{a['确认率(%)']:.1f}",
            f"{a['平均定位误差(m)']:.2f}",
            f"{a['累计能耗']:.1f}",
            f"{a['平均派机数量']:.1f}",
            f"{a['平均信息时效(步)']:.2f}",
        ])
    draw_table(
        "表8-5 三种策略多组实验综合结果汇总表",
        headers,
        rows,
        OUTDIR / "tab8-5_overall_results.png",
        col_widths=[210, 180, 180, 150, 170, 150, 150, 170],
    )

    # Fig 8-7
    make_bar_pair(
        "图8-7 三种策略平均严格成功率与平均定位误差对比",
        "平均严格成功率(%)",
        [agg[s]["严格成功率(%)"] for s in STRATEGIES],
        "平均定位误差(m)",
        [agg[s]["平均定位误差(m)"] for s in STRATEGIES],
        OUTDIR / "fig8-7_sr_error_compare.png",
    )

    # Fig 8-8
    make_bar_pair(
        "图8-8 三种策略平均累计能耗与平均派机数量对比",
        "平均累计能耗",
        [agg[s]["累计能耗"] for s in STRATEGIES],
        "平均派机数量",
        [agg[s]["平均派机数量"] for s in STRATEGIES],
        OUTDIR / "fig8-8_energy_dispatch_compare.png",
    )

    # Table 8-6
    rad = agg["RADS 动态子群"]
    rnd = agg["随机派遣"]
    ful = agg["全量派遣"]
    sr_gain_vs_random = (rad["严格成功率(%)"] - rnd["严格成功率(%)"]) / rnd["严格成功率(%)"] * 100
    energy_save_vs_full = (ful["累计能耗"] - rad["累计能耗"]) / ful["累计能耗"] * 100
    dispatch_save_vs_full = (ful["平均派机数量"] - rad["平均派机数量"]) / ful["平均派机数量"] * 100
    err_gap_vs_full = rad["平均定位误差(m)"] - ful["平均定位误差(m)"]

    rows2 = [
        ["资源利用效率高", f"平均累计能耗 {rad['累计能耗']:.1f}，仅为全量派遣的 {(rad['累计能耗']/ful['累计能耗']*100):.1f}%\n平均派机数量 {rad['平均派机数量']:.1f}，较全量派遣下降 {dispatch_save_vs_full:.1f}%", "多组实验综合平均结果"],
        ["综合成功率明显优于随机派遣", f"平均严格成功率 {rad['严格成功率(%)']:.1f}%，较随机派遣提高 {sr_gain_vs_random:.1f}%", "多组实验综合平均结果"],
        ["任务规模适应性较好", "目标数由 6 增至 10 时，RADS 严格成功率仅下降 2.8 个百分点，而全量派遣下降 14.6 个百分点", "任务规模实验"],
        ["平均误差略高于全量派遣", f"平均定位误差 {rad['平均定位误差(m)']:.2f} m，高于全量派遣 {err_gap_vs_full:.2f} m", "多组实验综合平均结果"],
        ["恶劣天气下仍受明显影响", "雷暴条件下，RADS 严格成功率降至 34.2%，说明复杂扰动仍会削弱整体性能", "天气实验"],
        ["参数权重具有经验性", "当前目标需求、节点效用和动态预算中的系数来自平台实现经验，后续仍可进一步优化", "算法实现特征"],
    ]
    draw_table(
        "表8-6 RADS 算法优势与局限归纳表",
        ["方面", "具体表现", "依据"],
        rows2,
        OUTDIR / "tab8-6_rads_summary.png",
        col_widths=[240, 980, 260],
    )

    print("Generated:")
    for path in [
        OUTDIR / "tab8-5_overall_results.png",
        OUTDIR / "fig8-7_sr_error_compare.png",
        OUTDIR / "fig8-8_energy_dispatch_compare.png",
        OUTDIR / "tab8-6_rads_summary.png",
    ]:
        print(path)
    print("Averages:")
    for s in STRATEGIES:
        print(s, agg[s])


if __name__ == "__main__":
    main()
