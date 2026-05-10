# -*- coding: utf-8 -*-
"""Append slide builders 13-20 + main execution to the main script"""
import os

append = '''
# ============ SLIDE 13: DEFAULT SCENE RESULTS ============
def build_slide_13():
    slide = add_blank_slide()
    build_slide_bg(slide)
    section_header(slide, "默认场景实验结果", "Default Scene Results -- 24机 x 6目标 x 34障碍 x 晴空")
    metrics = [
        ("严格成功率", "RADS: 70.8%", "随机: 16.7%", "全量: 72.9%",
         "RADS接近全量,\\n远超随机"),
        ("平均定位误差", "RADS: 9.52m", "随机: 47.61m", "全量: 8.07m",
         "RADS误差与全量\\n在同一水平"),
        ("累计能耗", "RADS: 1120.4", "随机: 1109.8", "全量: 2138.5",
         "RADS比全量\\n降低 47.6%"),
        ("平均派机数量", "RADS: 9.4架", "随机: 9.4架", "全量: 20.5架",
         "RADS比全量\\n降低 54.1%"),
    ]
    for i, (metric, rads, rand, full, note) in enumerate(metrics):
        x = Inches(0.3) + Inches(i * 3.25)
        add_card(slide, x, Inches(1.3), Inches(3.05), Inches(3.3), C_WHITE)
        add_textbox(slide, x + Inches(0.2), Inches(1.4), Inches(2.65), Inches(0.3),
                    metric, font_size=14, color=C_DARK, bold=True, alignment=PP_ALIGN.CENTER)
        colors = [C_GREEN, C_RED, C_BLUE_L]
        labels = ["RADS", "随机", "全量"]
        values = [rads, rand, full]
        for j in range(3):
            mx = x + Inches(0.1) + Inches(j * 1.0)
            add_textbox(slide, mx, Inches(1.8), Inches(0.9), Inches(0.25),
                        labels[j], font_size=9, color=C_GRAY, alignment=PP_ALIGN.CENTER)
            add_textbox(slide, mx, Inches(2.05), Inches(0.9), Inches(0.5),
                        values[j], font_size=12, color=colors[j], bold=True, alignment=PP_ALIGN.CENTER)
        add_textbox(slide, x + Inches(0.2), Inches(2.9), Inches(2.65), Inches(0.4),
                    note, font_size=9, color=C_GRAY, alignment=PP_ALIGN.CENTER)
        add_bg_rect(slide, x + Inches(0.2), Inches(2.8), Inches(2.65), Inches(0.02), C_ACCENT)
    # Key findings
    add_card(slide, Inches(0.5), Inches(4.85), Inches(12.1), Inches(2.3), C_DARK)
    add_textbox(slide, Inches(0.9), Inches(5.0), Inches(11), Inches(0.35),
                "关键发现", font_size=16, color=C_ACCENT, bold=True)
    findings = [
        "RADS 严格成功率 70.8%, 接近全量派遣的 72.9%, 同时远超随机派遣的 16.7% -- 说明动态子群选择是有效的",
        "RADS 累计能耗仅约为全量派遣的一半 (47.6%降幅), 平均派机数量仅约 46% -- 以更低资源代价达到接近最优的效果",
        "随机派遣虽然资源投入与RADS相当, 但成功率极低且误差很大 -- 说明派谁去和派多少同样重要",
        "RADS 的成功不仅因为控制了派机规模, 更因为每一步都选择了最适合当前目标需求的无人机成员",
    ]
    for i, f in enumerate(findings):
        add_textbox(slide, Inches(0.9), Inches(5.45) + Inches(i * 0.38), Inches(11.3), Inches(0.35),
                    "> " + f, font_size=11, color=C_WHITE)
    add_figure(slide, "ch8/fig8-7_sr_error_compare.png", Inches(7.5), Inches(1.3), width=Inches(5.0))
    add_figure(slide, "ch8/fig8-8_energy_dispatch_compare.png", Inches(7.5), Inches(3.0), width=Inches(5.0))
    slide_number(slide, 13)
    return slide

# ============ SLIDE 14: TASK SCALE EXPERIMENT ============
def build_slide_14():
    slide = add_blank_slide()
    build_slide_bg(slide)
    section_header(slide, "实验一: 任务规模影响", "Task Scale Experiment -- 目标数 6->10")
    add_figure(slide, "ch8/line_task_scale.png", Inches(0.3), Inches(1.2), width=Inches(7.0))
    add_card(slide, Inches(7.8), Inches(1.3), Inches(5.0), Inches(2.2), C_WHITE)
    add_textbox(slide, Inches(8.1), Inches(1.45), Inches(4.5), Inches(0.35),
                "严格成功率变化", font_size=16, color=C_DARK, bold=True)
    scale_data = [
        "目标数 6->10, 任务负载明显上升",
        "RADS: 70.8% -> 68.0% (仅下降 2.8pp)",
        "随机: 16.7% -> 10.8% (下降 5.9pp)",
        "全量: 72.9% -> 58.3% (下降 14.6pp!)",
    ]
    scale_colors = [C_TEXT, C_GREEN, C_RED, C_BLUE_L]
    for i, (text, color) in enumerate(zip(scale_data, scale_colors)):
        add_textbox(slide, Inches(8.1), Inches(1.9) + Inches(i * 0.38), Inches(4.5), Inches(0.3),
                    "> " + text if i > 0 else text, font_size=12, color=color)
    add_card(slide, Inches(7.8), Inches(3.7), Inches(5.0), Inches(3.5), C_DARK)
    add_textbox(slide, Inches(8.1), Inches(3.85), Inches(4.5), Inches(0.35),
                "实验结论", font_size=16, color=C_ACCENT, bold=True)
    conclusions = [
        "RADS 对任务负载增加表现出良好的适应性, 成功率仅小幅下降",
        "全量派遣在目标增多后资源竞争加剧, 全派策略效率大幅下滑",
        "RADS 通过动态预算机制, 在任务压力增大时自动扩大子群规模",
        "说明 RADS 的资源弹性分配策略面对任务规模变化时更加稳定",
    ]
    for i, c in enumerate(conclusions):
        add_textbox(slide, Inches(8.1), Inches(4.3) + Inches(i * 0.45), Inches(4.5), Inches(0.4),
                    "> " + c, font_size=11, color=C_WHITE)
    slide_number(slide, 14)
    return slide

# ============ SLIDE 15: WEATHER EXPERIMENT ============
def build_slide_15():
    slide = add_blank_slide()
    build_slide_bg(slide)
    section_header(slide, "实验二: 天气扰动影响", "Weather Disturbance -- 晴空->薄雾->降雨->雷暴")
    add_figure(slide, "ch8/line_weather.png", Inches(0.3), Inches(1.2), width=Inches(7.8))
    add_card(slide, Inches(8.5), Inches(1.3), Inches(4.3), Inches(2.3), C_WHITE)
    add_textbox(slide, Inches(8.8), Inches(1.45), Inches(3.8), Inches(0.35),
                "严格成功率对比", font_size=16, color=C_DARK, bold=True)
    weather_data = [
        ("晴空", "RADS 70.8%", "全量 72.9%", "随机 16.7%"),
        ("薄雾", "RADS 65.2%", "全量 68.4%", "随机 14.1%"),
        ("降雨", "RADS 48.3%", "全量 55.8%", "随机 10.0%"),
        ("雷暴", "RADS 34.2%", "全量 50.0%", "随机  6.7%"),
    ]
    for i, (weather, rads, full, rand) in enumerate(weather_data):
        y = Inches(1.9) + Inches(i * 0.38)
        add_textbox(slide, Inches(8.8), y, Inches(1.0), Inches(0.3),
                    weather, font_size=11, color=C_DARK, bold=True)
        add_textbox(slide, Inches(9.8), y, Inches(1.4), Inches(0.3),
                    rads, font_size=10, color=C_GREEN)
        add_textbox(slide, Inches(11.0), y, Inches(1.3), Inches(0.3),
                    full, font_size=10, color=C_BLUE_L)
    add_card(slide, Inches(8.5), Inches(3.85), Inches(4.3), Inches(3.4), C_DARK)
    add_textbox(slide, Inches(8.8), Inches(4.0), Inches(3.8), Inches(0.35),
                "实验结论", font_size=16, color=C_ACCENT, bold=True)
    wc = [
        "天气恶化对所有策略都有负面影响, 但 RADS 下降幅度更可控",
        "雷暴条件下, RADS成功率(34.2%)仍显著优于随机(6.7%)",
        "全量派遣在极端天气下保持最高成功率, 但能耗代价巨大",
        "RADS的优势在于性价比: 用更低资源换取可接受的感知效果",
    ]
    for i, c in enumerate(wc):
        add_textbox(slide, Inches(8.8), Inches(4.45) + Inches(i * 0.45), Inches(3.8), Inches(0.4),
                    "> " + c, font_size=11, color=C_WHITE)
    slide_number(slide, 15)
    return slide

# ============ SLIDE 16: OBSTACLE + COMM EXPERIMENTS ============
def build_slide_16():
    slide = add_blank_slide()
    build_slide_bg(slide)
    section_header(slide, "实验三&四: 障碍环境与通信条件", "Obstacle & Communication Experiments")
    # Obstacle (left)
    add_card(slide, Inches(0.3), Inches(1.3), Inches(6.3), Inches(5.8), C_WHITE)
    add_textbox(slide, Inches(0.6), Inches(1.45), Inches(5.8), Inches(0.35),
                "实验三: 障碍复杂度 (34->50个)", font_size=16, color=C_DARK, bold=True)
    add_figure(slide, "ch8/line_obstacle.png", Inches(0.5), Inches(1.9), width=Inches(5.8))
    obs = [
        "障碍增加使绕障路径变长, 可见性降低",
        "RADS 成功率: 70.8% -> 68.8% (仅降2.0pp)",
        "路径代价和视线判断提升调度合理性",
        "RADS自动排除被遮挡的无人机, 减少无效派机",
    ]
    for i, o in enumerate(obs):
        add_textbox(slide, Inches(0.6), Inches(4.7) + Inches(i * 0.35), Inches(5.8), Inches(0.3),
                    "> " + o, font_size=11, color=C_TEXT)
    # Communication (right)
    add_card(slide, Inches(6.9), Inches(1.3), Inches(6.1), Inches(5.8), C_WHITE)
    add_textbox(slide, Inches(7.2), Inches(1.45), Inches(5.5), Inches(0.35),
                "实验四: 通信条件变化", font_size=16, color=C_DARK, bold=True)
    comm_items = [
        ("通信半径 300->400m", "RADS: 70.8% -> 81.7% (+10.9pp)", C_GREEN),
        ("丢包率 0% -> 10%",    "RADS: 77.9% -> 65.0% (-12.9pp)", C_RED),
        ("延迟 0 -> 2步",       "RADS: 70.8% -> 60.0% (-10.8pp)", RGBColor(0xE6, 0x7E, 0x22)),
    ]
    for i, (label, result, color) in enumerate(comm_items):
        y = Inches(1.95) + Inches(i * 1.3)
        bg_color = RGBColor(0xF5, 0xF7, 0xFC) if i % 2 == 0 else C_WHITE
        add_card(slide, Inches(7.2), y, Inches(5.5), Inches(1.1), bg_color)
        add_textbox(slide, Inches(7.4), y + Inches(0.1), Inches(5.1), Inches(0.3),
                    label, font_size=13, color=C_DARK, bold=True)
        add_textbox(slide, Inches(7.4), y + Inches(0.45), Inches(5.1), Inches(0.3),
                    result, font_size=12, color=color)
        add_textbox(slide, Inches(7.4), y + Inches(0.75), Inches(5.1), Inches(0.25),
                    "链路质量直接影响融合权重, 有效观测能否及时送达是协同感知关键",
                    font_size=9, color=C_GRAY)
    comm_notes = [
        "通信半径扩大提升观测到达率, RADS成功率显著上升",
        "丢包率和延迟对融合质量有直接负面影响",
        "RADS通过链路质量评分机制优选通信条件好的节点",
    ]
    for i, n in enumerate(comm_notes):
        add_textbox(slide, Inches(7.2), Inches(5.0) + Inches(i * 0.35), Inches(5.5), Inches(0.3),
                    "> " + n, font_size=11, color=C_TEXT)
    slide_number(slide, 16)
    return slide

# ============ SLIDE 17: COMPREHENSIVE DATA ============
def build_slide_17():
    slide = add_blank_slide()
    build_slide_bg(slide)
    section_header(slide, "关键实验数据汇总", "Key Experimental Data Summary")
    add_figure(slide, "ch8/tab8-5_overall_results.png", Inches(0.5), Inches(1.3), width=Inches(7.8))
    # Summary table card
    add_card(slide, Inches(8.8), Inches(1.3), Inches(4.0), Inches(3.5), C_WHITE)
    add_textbox(slide, Inches(9.1), Inches(1.45), Inches(3.5), Inches(0.35),
                "多组实验平均值", font_size=16, color=C_DARK, bold=True)
    avg_data = [
        ("指标", "RADS", "随机", "全量"),
        ("严格成功率", "64.9%", "17.1%", "70.3%"),
        ("平均误差(m)", "10.91", "14.83", "8.66"),
        ("累计能耗", "1060.4", "1056.1", "2143.7"),
        ("平均派机", "8.8", "8.8", "20.4"),
        ("定位达标率", "73.6%", "23.1%", "78.1%"),
        ("信息时效(步)", "0.82", "1.23", "0.68"),
    ]
    for i, row in enumerate(avg_data):
        y = Inches(1.9) + Inches(i * 0.35)
        for j, cell in enumerate(row):
            x = Inches(9.0) + Inches(j * 1.1)
            if i == 0:
                color = C_GRAY
            elif j == 1:
                color = C_GREEN
            elif j == 3:
                color = C_BLUE_L
            elif j == 2:
                color = C_RED
            else:
                color = C_TEXT
            add_textbox(slide, x, y, Inches(1.0), Inches(0.3),
                        cell, font_size=10, color=color, bold=(i == 0 or j == 0))
    # Key takeaway
    add_card(slide, Inches(8.8), Inches(5.1), Inches(4.0), Inches(2.1), C_DARK)
    add_textbox(slide, Inches(9.1), Inches(5.25), Inches(3.5), Inches(0.35),
                "核心结论", font_size=16, color=C_ACCENT, bold=True)
    key_conclusions = [
        "RADS ~ 全量的感知质量",
        "RADS << 全量的资源消耗",
        "RADS >> 随机的稳定性",
        "效果-资源综合最优!",
    ]
    for i, kc in enumerate(key_conclusions):
        bold = (i == 3)
        add_textbox(slide, Inches(9.1), Inches(5.7) + Inches(i * 0.38), Inches(3.5), Inches(0.3),
                    "* " + kc, font_size=14, color=C_WHITE, bold=bold)
    # Bottom charts
    add_figure(slide, "ch8/line_comm_range.png", Inches(0.5), Inches(5.3), width=Inches(2.5))
    add_figure(slide, "ch8/line_packet_loss.png", Inches(3.2), Inches(5.3), width=Inches(2.5))
    add_figure(slide, "ch8/line_comm_delay.png", Inches(5.9), Inches(5.3), width=Inches(2.5))
    slide_number(slide, 17)
    return slide

# ============ SLIDE 18: COMPREHENSIVE ANALYSIS ============
def build_slide_18():
    slide = add_blank_slide()
    build_slide_bg(slide)
    section_header(slide, "综合结果分析", "Comprehensive Analysis -- 为什么RADS更好?")
    dims = [
        ("效果维度", Inches(0.5), [
            "严格成功率接近全量派遣 (64.9% vs 70.3%)",
            "定位误差显著优于随机派遣 (10.91m vs 14.83m)",
            "定位达标率与全量差距不大",
            "在4组实验中保持相对稳定的感知质量",
        ]),
        ("效率维度", Inches(4.5), [
            "累计能耗仅为全量派遣的约 49.5%",
            "平均派机数量仅为全量派遣的约 43%",
            "每架无人机承担更具针对性的任务",
            "避免了全员出动带来的大量无效飞行",
        ]),
        ("鲁棒性维度", Inches(8.5), [
            "天气恶化时下降幅度可控 (优于随机4-5倍)",
            "障碍增多时成功率仅降2pp (路径代价自适应)",
            "通信条件变化时有链路质量评分缓冲",
            "任务规模增大时自动扩大子群适应负载",
        ]),
    ]
    for title, x, items in dims:
        add_card(slide, x, Inches(1.3), Inches(3.8), Inches(2.8), C_WHITE)
        add_bg_rect(slide, x, Inches(1.3), Inches(3.8), Inches(0.06), C_ACCENT)
        add_textbox(slide, x + Inches(0.3), Inches(1.5), Inches(3.2), Inches(0.35),
                    title, font_size=17, color=C_DARK, bold=True)
        for i, item in enumerate(items):
            add_textbox(slide, x + Inches(0.3), Inches(1.95) + Inches(i * 0.42), Inches(3.2), Inches(0.35),
                        "/ " + item, font_size=11, color=C_TEXT)
    # Why RADS works
    add_bg_rect(slide, Inches(0.5), Inches(4.4), Inches(12.1), Inches(2.8), C_DARK)
    add_textbox(slide, Inches(0.9), Inches(4.55), Inches(11), Inches(0.35),
                "RADS 有效性的深层原因分析", font_size=17, color=C_ACCENT, bold=True)
    why = [
        "需求感知: 不是每个目标分一样多的无人机, 而是根据优先级、不确定性和运动状态动态评估需求",
        "代价敏感: 不只算直线距离, 而是通过栅格距离图计算绕障路径代价, 避免看起来近但实际绕远的误判",
        "质量筛选: 通过链路质量评分和视线判断, 优先选择通信可靠、视野无遮挡的节点, 减少无效观测",
        "弹性适应: 动态预算机制让派机规模随任务压力自动调整 -- 压力大时多派, 压力小时少派, 避免资源浪费",
        "稳健融合: 多源观测加权融合中抑制异常值和低质量链路观测, 确保即使个别节点失效, 整体结果仍可信",
    ]
    for i, w in enumerate(why):
        add_textbox(slide, Inches(0.9), Inches(5.0) + Inches(i * 0.4), Inches(11.3), Inches(0.35),
                    "> " + w, font_size=11.5, color=C_WHITE)
    slide_number(slide, 18)
    return slide

# ============ SLIDE 19: INNOVATION POINTS ============
def build_slide_19():
    slide = add_blank_slide()
    build_slide_bg(slide)
    section_header(slide, "创新点与贡献", "Innovations & Contributions")
    innovations = [
        ("创新点一", "面向复杂约束的统一仿真平台",
         "将无人机、动态目标、障碍物、通信链路、天气扰动和节点故障六类要素纳入统一仿真模型, "
         "使实验环境不再停留在理想化平面场景。平台集参数配置、实验运行、过程回放、任务级分析"
         "和结果导出于一体, 为协同感知研究提供了系统化验证工具。"),
        ("创新点二", "RADS 动态子群选择算法",
         "综合考虑目标优先级、不确定性、运动状态、路径代价、视线关系、链路质量和节点剩余能量"
         "等多维信息, 在每一步自适应地确定无人机子群的规模与成员。与固定派机或简单随机策略相比, "
         "RADS 在复杂环境下实现了更精准的感知资源分配。"),
        ("创新点三", "三维可视化 + 多策略对比 + 任务级分析",
         "平台提供三策略同步对比、三维态势沙盘、回放控制、目标追踪联动和结构化CSV导出功能。"
         "用户不仅能看到结果好不好, 还能从任务级理解为什么好或为什么差, "
         "实现了指标统计 + 场景展示 + 目标级分析的完整验证闭环。"),
        ("创新点四", "多维度综合评价体系",
         "从严格成功率、定位达标率、平均误差、累计能耗、平均派机规模和信息时效六个维度, "
         "对三种策略进行统一评价, 并将实验结果整理为可直接用于论文图表的数据格式, "
         "使实验结论既有数值支撑, 也有可视化佐证。"),
    ]
    for i, (label, title, desc) in enumerate(innovations):
        y = Inches(1.3) + Inches(i * 1.48)
        add_card(slide, Inches(0.5), y, Inches(12.1), Inches(1.3), C_WHITE)
        add_bg_rect(slide, Inches(0.5), y, Inches(0.07), Inches(1.3), C_ACCENT)
        nums = ["[1]", "[2]", "[3]", "[4]"]
        add_textbox(slide, Inches(1.0), y + Inches(0.15), Inches(1.0), Inches(0.4),
                    nums[i], font_size=22, color=C_DARK, bold=True)
        add_textbox(slide, Inches(2.0), y + Inches(0.08), Inches(1.0), Inches(0.25),
                    label, font_size=10, color=C_ACCENT, bold=True)
        add_textbox(slide, Inches(2.0), y + Inches(0.28), Inches(9.8), Inches(0.3),
                    title, font_size=16, color=C_DARK, bold=True)
        add_textbox(slide, Inches(2.0), y + Inches(0.55), Inches(9.8), Inches(0.6),
                    desc, font_size=11, color=C_TEXT)
    slide_number(slide, 19)
    return slide

# ============ SLIDE 20: CONCLUSION & THANKS ============
def build_slide_20():
    slide = add_blank_slide()
    add_bg_rect(slide, Inches(0), Inches(0), SLIDE_W, SLIDE_H, C_DARK)
    deco = slide.shapes.add_shape(MSO_SHAPE.RIGHT_TRIANGLE, Inches(9.5), Inches(0), Inches(4.2), Inches(4.2))
    deco.fill.solid(); deco.fill.fore_color.rgb = C_MID; deco.line.fill.background()
    deco.rotation = 180.0
    add_logo(slide, width=Inches(1.3))
    add_textbox(slide, Inches(1.3), Inches(1.5), Inches(10), Inches(0.7),
                "总结与展望", font_size=36, color=C_WHITE, bold=True)
    add_bg_rect(slide, Inches(1.3), Inches(2.2), Inches(1.5), Inches(0.04), C_ACCENT)
    add_textbox(slide, Inches(1.3), Inches(2.6), Inches(5), Inches(0.35),
                "已完成的工作", font_size=18, color=C_ACCENT, bold=True)
    conclusions = [
        "实现了面向复杂环境的无人机集群多任务协同态势感知平台",
        "提出了 RADS 动态子群选择算法, 在感知质量与资源消耗之间取得平衡",
        "完成了三策略四组对比实验, 验证了 RADS 的有效性与适应性",
    ]
    for i, c in enumerate(conclusions):
        add_textbox(slide, Inches(1.3), Inches(3.1) + Inches(i * 0.42), Inches(7.5), Inches(0.38),
                    "/ " + c, font_size=13, color=C_WHITE)
    add_textbox(slide, Inches(1.3), Inches(4.6), Inches(5), Inches(0.35),
                "不足与展望", font_size=18, color=C_ACCENT, bold=True)
    futures = [
        "目前仍是任务级仿真, 后续可向更高保真度 (如对接ROS/PX4) 发展",
        "RADS 参数权重目前依赖经验设定, 可引入自适应调参或学习方法",
        "实验梯度可以进一步细化, 覆盖更多中间场景配置",
        "平台可扩展: 接入新的调度策略、天气模型或评价指标",
    ]
    for i, f in enumerate(futures):
        add_textbox(slide, Inches(1.3), Inches(5.1) + Inches(i * 0.38), Inches(7.5), Inches(0.35),
                    "-> " + f, font_size=12, color=RGBColor(0xBB, 0xC2, 0xD8))
    add_textbox(slide, Inches(1.3), Inches(6.5), Inches(10), Inches(0.6),
                "感谢各位老师评阅与指导, 请批评指正!",
                font_size=24, color=C_ACCENT, bold=True)
    add_bg_rect(slide, Inches(0), Inches(6.8), SLIDE_W, Inches(0.7), RGBColor(0x08, 0x12, 0x2E))
    add_textbox(slide, Inches(1.3), Inches(7.0), Inches(6), Inches(0.35),
                "江西理工大学 · 信息工程学院 · 计算机224班 · 贺小双",
                font_size=10, color=C_GRAY)
    slide_number(slide, 20)
    return slide

# ============ BUILD ALL SLIDES ============
print("Running slide builders...")
builders = [
    build_slide_01, build_slide_02, build_slide_03, build_slide_04,
    build_slide_05, build_slide_06, build_slide_07, build_slide_08,
    build_slide_09, build_slide_10, build_slide_11, build_slide_12,
    build_slide_13, build_slide_14, build_slide_15, build_slide_16,
    build_slide_17, build_slide_18, build_slide_19, build_slide_20,
]

for i, builder in enumerate(builders):
    print("  Slide {}/20: {}...".format(i+1, builder.__name__))
    builder()

print("\\nSaving to: " + OUTPUT_PATH)
prs.save(OUTPUT_PATH)
print("Done! File size: {:.0f} KB".format(os.path.getsize(OUTPUT_PATH) / 1024))
print("Slides: {}".format(len(prs.slides)))
'''

# Append to main script
main_script = r'D:\biushe\scripts\generate_final_defense_ppt.py'
with open(main_script, 'a', encoding='utf-8') as f:
    f.write(append)
print("Slides 13-20 + main execution appended OK")
