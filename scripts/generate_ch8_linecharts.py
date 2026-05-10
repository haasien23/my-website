# -*- coding: utf-8 -*-
from __future__ import annotations

import csv
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager


OUTDIR = Path(r"D:\biushe\output\figures\ch8")
OUTDIR.mkdir(parents=True, exist_ok=True)

CSV = {
    "baseline": Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_152539.csv"),
    "task_10": Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_160102.csv"),
    "weather_haze": Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_160249.csv"),
    "weather_rain": Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_160404.csv"),
    "weather_storm": Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_160456.csv"),
    "obstacle_50": Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_160607.csv"),
    "range_400": Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_162351.csv"),
    "range_500": Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_162451.csv"),
    "loss_0": Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_162548.csv"),
    "loss_10": Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_162639.csv"),
    "delay_1": Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_162742.csv"),
    "delay_2": Path(r"C:\Users\贺小双\Downloads\态势感知实验结果_20260421_162849.csv"),
}

STRATEGIES = ["RADS 动态子群", "随机派遣", "全量派遣"]
DISPLAY_NAMES = {
    "RADS 动态子群": "RADS",
    "随机派遣": "随机派遣",
    "全量派遣": "全量派遣",
}
COLORS = {
    "RADS 动态子群": "#68B05A",
    "随机派遣": "#4F7FD1",
    "全量派遣": "#D96B6B",
}
MARKERS = {
    "RADS 动态子群": "o",
    "随机派遣": "s",
    "全量派遣": "D",
}

FONT_PATHS = [
    Path(r"C:\Windows\Fonts\msyh.ttc"),
    Path(r"C:\Windows\Fonts\simhei.ttf"),
    Path(r"C:\Windows\Fonts\simsun.ttc"),
]


def get_font():
    for p in FONT_PATHS:
        if p.exists():
            return font_manager.FontProperties(fname=str(p))
    return None


FONT = get_font()


def parse_metrics(path: Path):
    rows = []
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        for row in reader:
            rows.append([c.strip() for c in row])

    metrics = {}
    in_metrics = False
    headers = None
    for row in rows:
        if not row or not any(row):
            continue
        first = row[0]
        if first == "策略核心指标":
            in_metrics = True
            headers = None
            continue
        if first in {"实验配置摘要", "任务级关键结果", "任务精细对比"} and first != "策略核心指标":
            if in_metrics and first != "策略核心指标":
                break
        if in_metrics:
            if row[0] == "策略":
                headers = row
                continue
            if headers and len(row) >= len(headers):
                metrics[row[0]] = {headers[i]: row[i] for i in range(1, len(headers))}
    return metrics


def metric(metrics_dict, strategy, name):
    return float(metrics_dict[strategy][name])


def style_axis(ax, ylabel, xticks, xticklabels):
    ax.set_facecolor("#FBFDFF")
    ax.grid(axis="y", linestyle="--", linewidth=0.8, color="#9BB8E5", alpha=0.28)
    ax.set_axisbelow(True)
    ax.set_ylabel(ylabel, color="#244E91", fontproperties=FONT)
    ax.set_xticks(xticks)
    if FONT:
        ax.set_xticklabels(xticklabels, fontproperties=FONT)
        ax.yaxis.label.set_fontproperties(FONT)
    else:
        ax.set_xticklabels(xticklabels)
    ax.tick_params(axis="both", colors="#4A648A")
    for side in ["left", "bottom", "top", "right"]:
        ax.spines[side].set_color("#B8CAE8")
        ax.spines[side].set_linewidth(1.1)


def plot_dual_line(title, xlabels, left_name, right_name, datasets, out_name):
    fig, axes = plt.subplots(1, 2, figsize=(13.5, 5.8), dpi=180)
    fig.patch.set_facecolor("#FFFFFF")
    xs = list(range(len(xlabels)))

    for strategy in STRATEGIES:
        color = COLORS[strategy]
        marker = MARKERS[strategy]
        display = DISPLAY_NAMES[strategy]
        left_vals = [metric(ds, strategy, left_name) for ds in datasets]
        right_vals = [metric(ds, strategy, right_name) for ds in datasets]
        axes[0].plot(xs, left_vals, color=color, marker=marker, linewidth=2.4, markersize=7, label=display)
        axes[1].plot(xs, right_vals, color=color, marker=marker, linewidth=2.4, markersize=7, label=display)
        for ax, vals in zip(axes, [left_vals, right_vals]):
            for x, y in zip(xs, vals):
                ax.text(x, y, f"{y:.1f}", fontsize=9, color=color, ha="center", va="bottom", fontproperties=FONT)

    style_axis(axes[0], left_name, xs, xlabels)
    style_axis(axes[1], right_name, xs, xlabels)
    axes[0].set_title("关键效果指标", color="#5679AF", fontproperties=FONT, pad=10)
    axes[1].set_title("辅助分析指标", color="#5679AF", fontproperties=FONT, pad=10)
    handles, labels = axes[0].get_legend_handles_labels()
    fig.legend(handles, labels, loc="upper center", ncol=3, frameon=False, prop=FONT, bbox_to_anchor=(0.5, 0.98))
    fig.suptitle(title, fontsize=16, color="#244E91", fontproperties=FONT, y=1.03)
    fig.tight_layout(rect=[0.02, 0.02, 0.98, 0.90])
    fig.savefig(OUTDIR / out_name, bbox_inches="tight")
    plt.close(fig)


def main():
    parsed = {name: parse_metrics(path) for name, path in CSV.items()}

    # 任务规模
    plot_dual_line(
        "不同任务规模下三种策略性能变化折线图",
        ["6个目标", "10个目标"],
        "严格成功率(%)",
        "平均定位误差(m)",
        [parsed["baseline"], parsed["task_10"]],
        "line_task_scale.png",
    )

    # 天气
    plot_dual_line(
        "不同天气条件下三种策略性能变化折线图",
        ["晴空", "薄雾", "降雨", "雷暴"],
        "严格成功率(%)",
        "平均定位误差(m)",
        [parsed["baseline"], parsed["weather_haze"], parsed["weather_rain"], parsed["weather_storm"]],
        "line_weather.png",
    )

    # 障碍复杂度
    plot_dual_line(
        "不同障碍复杂度下三种策略性能变化折线图",
        ["34个障碍物", "50个障碍物"],
        "严格成功率(%)",
        "平均定位误差(m)",
        [parsed["baseline"], parsed["obstacle_50"]],
        "line_obstacle.png",
    )

    # 通信半径
    plot_dual_line(
        "不同通信半径下三种策略性能变化折线图",
        ["300m", "400m", "500m"],
        "严格成功率(%)",
        "平均定位误差(m)",
        [parsed["baseline"], parsed["range_400"], parsed["range_500"]],
        "line_comm_range.png",
    )

    # 丢包率
    plot_dual_line(
        "不同链路丢包率下三种策略性能变化折线图",
        ["0%", "4%", "10%"],
        "严格成功率(%)",
        "平均定位误差(m)",
        [parsed["loss_0"], parsed["baseline"], parsed["loss_10"]],
        "line_packet_loss.png",
    )

    # 延迟
    plot_dual_line(
        "不同通信延迟下三种策略性能变化折线图",
        ["0步", "1步", "2步"],
        "严格成功率(%)",
        "平均信息时效(步)",
        [parsed["baseline"], parsed["delay_1"], parsed["delay_2"]],
        "line_comm_delay.png",
    )

    for name in [
        "line_task_scale.png",
        "line_weather.png",
        "line_obstacle.png",
        "line_comm_range.png",
        "line_packet_loss.png",
        "line_comm_delay.png",
    ]:
        print(OUTDIR / name)


if __name__ == "__main__":
    main()
