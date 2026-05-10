# -*- coding: utf-8 -*-
"""Append slide builders 3-12 to main script"""
append = r'''
# ============ SLIDE 3: RESEARCH BACKGROUND ============
def build_slide_03():
    slide = add_blank_slide()
    build_slide_bg(slide)
    section_header(slide, "研究背景", "Research Background -- 为何关注无人机集群协同感知?")
    add_card(slide, Inches(0.5), Inches(1.3), Inches(5.8), Inches(2.6), C_WHITE)
    add_textbox(slide, Inches(0.8), Inches(1.45), Inches(5), Inches(0.35),
                "应用场景不断扩展", font_size=18, color=C_DARK, bold=True)
    for i, s in enumerate([
        "安防巡检: 城市、边境、重点设施的大范围巡逻监测",
        "灾害救援: 灾后快速侦察、被困人员搜索、灾情评估",
        "目标侦察: 多目标动态追踪与协同定位",
        "环境监测: 污染扩散、森林防火、水域巡查",
    ]):
        add_textbox(slide, Inches(0.9), Inches(1.95) + Inches(i * 0.45), Inches(5.2), Inches(0.35),
                    "> " + s, font_size=13, color=C_TEXT)
    add_card(slide, Inches(6.8), Inches(1.3), Inches(5.8), Inches(2.6), C_WHITE)
    add_textbox(slide, Inches(7.1), Inches(1.45), Inches(5), Inches(0.35),
                "复杂环境的现实挑战", font_size=18, color=C_DARK, bold=True)
    challenges = [
        ("目标动态变化", "目标持续移动、优先级和不确定性实时变化"),
        ("障碍物遮挡", "建筑、地形遮挡影响感知视线与通信链路"),
        ("通信条件受限", "链路丢包、传输延迟、通信半径限制"),
        ("天气与节点故障", "降雨/雷暴扰动、传感器噪声、节点能量衰减与故障"),
    ]
    for i, (c_title, c_desc) in enumerate(challenges):
        y = Inches(1.95) + Inches(i * 0.45)
        add_textbox(slide, Inches(7.2), y, Inches(2.0), Inches(0.3),
                    "! " + c_title, font_size=13, color=C_RED, bold=True)
        add_textbox(slide, Inches(9.2), y, Inches(3.2), Inches(0.3),
                    c_desc, font_size=12, color=C_GRAY)
    add_card(slide, Inches(0.5), Inches(4.15), Inches(12.1), Inches(2.9), C_DARK)
    add_textbox(slide, Inches(0.9), Inches(4.35), Inches(11), Inches(0.4),
                "核心矛盾: 资源有限 vs 需求多变", font_size=20, color=C_ACCENT, bold=True)
    summary = (
        "单架无人机能力有限, 集群化可提升覆盖、并行处理和系统冗余能力。"
        "然而在实际任务中, 目标持续移动、障碍物形成遮挡、通信链路受距离和天气影响、节点存在能量衰减和随机故障, "
        "这些约束使得简单派出所有无人机的策略不再适用。\n"
        "态势感知的关键在于: 对环境状态、目标分布和任务执行情况形成持续、准确、可更新的理解, "
        "在感知质量与资源消耗之间取得合理平衡。"
    )
    add_textbox(slide, Inches(0.9), Inches(4.9), Inches(11.3), Inches(1.8),
                summary, font_size=13, color=C_WHITE)
    slide_number(slide, 3)
    return slide

# ============ SLIDE 4: RESEARCH PROBLEM ============
def build_slide_04():
    slide = add_blank_slide()
    build_slide_bg(slide)
    section_header(slide, "研究问题与切入点", "Research Questions -- 本课题要解决什么问题?")
    problems = [
        ("问题一", "多目标并行争夺有限资源",
         "多个目标同时需要感知, 无人机数量有限。\n如何判断每个目标该分配多少资源?\n目标优先级不同、不确定性不同、运动状态不同,\n资源分配不能一刀切。",
         C_RED),
        ("问题二", "复杂环境导致感知条件恶劣",
         "建筑物遮挡视线、通信链路丢包延迟、\n天气降低能见度、节点可能故障。\n理想环境下有效的策略,\n在复杂约束下可能完全失效。",
         RGBColor(0xE6, 0x7E, 0x22)),
        ("问题三", "评价维度单一, 过程不透明",
         "只看最终成功率不够,\n需要同时关注误差、能耗、派机规模、信息时效。\n需要任务级分析能力,\n解释成功或失败的具体原因。",
         RGBColor(0x8E, 0x44, 0xAD)),
    ]
    for i, (label, title, desc, accent) in enumerate(problems):
        x = Inches(0.5) + Inches(i * 4.1)
        add_card(slide, x, Inches(1.4), Inches(3.8), Inches(4.8), C_WHITE)
        add_bg_rect(slide, x, Inches(1.4), Inches(3.8), Inches(0.06), accent)
        add_textbox(slide, x + Inches(0.3), Inches(1.65), Inches(3.2), Inches(0.35),
                    label, font_size=12, color=accent, bold=True)
        add_textbox(slide, x + Inches(0.3), Inches(2.0), Inches(3.2), Inches(0.5),
                    title, font_size=18, color=C_DARK, bold=True)
        add_textbox(slide, x + Inches(0.3), Inches(2.6), Inches(3.2), Inches(3.0),
                    desc, font_size=12, color=C_TEXT)
    add_bg_rect(slide, Inches(0.5), Inches(6.5), Inches(12.1), Inches(0.65), C_DARK)
    add_textbox(slide, Inches(0.9), Inches(6.58), Inches(11.3), Inches(0.5),
                "本课题切入点: 构建统一仿真平台 -> 设计RADS动态子群算法 -> 多策略对比 -> 三维可视化 + 任务级分析",
                font_size=14, color=C_ACCENT, bold=True)
    slide_number(slide, 4)
    return slide

# ============ SLIDE 5: EXISTING METHODS LIMITATIONS ============
def build_slide_05():
    slide = add_blank_slide()
    build_slide_bg(slide)
    section_header(slide, "现有方法不足与本课题定位", "Limitations of Existing Approaches & Our Position")
    cols = [
        ("现有方法的问题", [
            "环境建模偏理想化: 忽略障碍、天气、\n链路丢包和节点故障等真实约束",
            "资源分配不够灵活: 固定派机或简单均\n衡, 难以适应目标优先级动态变化",
            "实验验证不完整: 只给数值结果或局部\n示意图, 过程不够透明",
            "评价维度偏窄: 只看单一指标, 不做\n多维度综合权衡",
        ], C_RED),
        ("本课题的改进", [
            "统一复杂场景建模: 障碍物、动态目标、\n天气扰动、通信约束、节点故障一体化",
            "RADS动态子群选择: 每步重新评估目标\n需求和节点效用, 按需调配资源",
            "可视化实验平台: 三维态势沙盘 + 回放\n控制 + 三策略同步对比 + 任务级分析",
            "多维度综合评价: 成功率、误差、能耗、\n派机规模、信息时效统一比较",
        ], C_GREEN),
    ]
    for col_idx, (title, items, accent) in enumerate(cols):
        x = Inches(0.5) + Inches(col_idx * 6.2)
        add_card(slide, x, Inches(1.35), Inches(5.8), Inches(5.8), C_WHITE)
        add_bg_rect(slide, x, Inches(1.35), Inches(5.8), Inches(0.9), accent)
        add_textbox(slide, x + Inches(0.3), Inches(1.5), Inches(5.2), Inches(0.5),
                    title, font_size=18, color=C_WHITE, bold=True)
        for i, item in enumerate(items):
            y = Inches(2.5) + Inches(i * 1.15)
            add_card(slide, x + Inches(0.25), y, Inches(5.3), Inches(1.0), RGBColor(0xF8, 0xF9, 0xFC))
            add_textbox(slide, x + Inches(0.45), y + Inches(0.1), Inches(4.9), Inches(0.8),
                        "> " + item, font_size=12, color=C_TEXT)
    slide_number(slide, 5)
    return slide

# ============ SLIDE 6: RESEARCH OBJECTIVES ============
def build_slide_06():
    slide = add_blank_slide()
    build_slide_bg(slide)
    section_header(slide, "研究目标与技术路线", "Research Objectives & Technical Roadmap")
    objectives = [
        ("[1]", "复杂场景建模", "统一描述无人机、目标、\n障碍、天气、通信、故障"),
        ("[2]", "RADS算法设计", "动态子群选择, 兼顾\n目标需求与节点能力"),
        ("[3]", "Web平台实现", "参数配置、三维沙盘、\n回放、对比、导出"),
        ("[4]", "多策略实验验证", "三策略对比、四组实验、\n多维度综合评价"),
    ]
    for i, (icon, title, desc) in enumerate(objectives):
        x = Inches(0.5) + Inches(i * 3.1)
        add_card(slide, x, Inches(1.4), Inches(2.8), Inches(2.0), C_WHITE)
        add_textbox(slide, x + Inches(0.3), Inches(1.55), Inches(2.2), Inches(0.4),
                    icon, font_size=24, color=C_DARK)
        add_textbox(slide, x + Inches(0.3), Inches(1.95), Inches(2.2), Inches(0.35),
                    title, font_size=15, color=C_DARK, bold=True)
        add_textbox(slide, x + Inches(0.3), Inches(2.35), Inches(2.2), Inches(0.8),
                    desc, font_size=11, color=C_GRAY)
    add_bg_rect(slide, Inches(0.5), Inches(3.7), Inches(12.1), Inches(3.5), C_DARK)
    add_textbox(slide, Inches(0.9), Inches(3.85), Inches(11), Inches(0.4),
                "技术路线", font_size=16, color=C_ACCENT, bold=True)
    steps = [
        "需求分析与\n问题定义", "复杂环境\n仿真建模", "RADS算法\n设计与实现",
        "Web前后端\n平台搭建", "三策略\n对比实验", "结果分析\n论文撰写",
    ]
    for i, step in enumerate(steps):
        x = Inches(1.0) + Inches(i * 2.0)
        add_card(slide, x, Inches(4.5), Inches(1.65), Inches(1.1), C_MID)
        add_textbox(slide, x + Inches(0.1), Inches(4.6), Inches(1.45), Inches(0.9),
                    step, font_size=10, color=C_WHITE, bold=True, alignment=PP_ALIGN.CENTER)
        if i < len(steps) - 1:
            add_textbox(slide, x + Inches(1.65), Inches(4.65), Inches(0.35), Inches(0.8),
                        ">", font_size=18, color=C_ACCENT, bold=True)
    features = [
        "目标优先级驱动", "动态预算分配", "路径代价感知", "视线遮挡判断",
        "链路质量评分", "多源融合验证", "三维态势回放", "CSV结果导出",
    ]
    for i, feat in enumerate(features):
        col = i % 4; row = i // 4
        x = Inches(1.0) + Inches(col * 3.0)
        y = Inches(5.85) + Inches(row * 0.45)
        add_textbox(slide, x, y, Inches(2.8), Inches(0.35),
                    "/ " + feat, font_size=11, color=C_WHITE)
    slide_number(slide, 6)
    return slide

# ============ SLIDE 7: SYSTEM ARCHITECTURE ============
def build_slide_07():
    slide = add_blank_slide()
    build_slide_bg(slide)
    section_header(slide, "系统总体架构", "System Architecture -- 轻量级前后端分离设计")
    layers = [
        ("表示层 Presentation", C_BLUE_L, [
            "参数配置界面", "策略指标卡片", "三维态势沙盘",
            "任务结果表格", "实验总结与导出",
        ]),
        ("业务控制层 Business Logic", C_MID, [
            "请求解析与路由", "实验会话管理", "步进控制与回放",
            "数据组织与JSON序列化",
        ]),
        ("仿真计算层 Simulation Engine", C_DARK, [
            "复杂环境建模", "路径规划 (栅格距离图)", "RADS/随机/全量策略调度",
            "多源感知融合与指标统计",
        ]),
    ]
    for i, (name, color, modules) in enumerate(layers):
        y = Inches(1.3) + Inches(i * 1.85)
        add_card(slide, Inches(0.5), y, Inches(3.5), Inches(1.5), color)
        add_textbox(slide, Inches(0.8), y + Inches(0.15), Inches(3.2), Inches(0.35),
                    name, font_size=15, color=C_WHITE, bold=True)
        for j, mod in enumerate(modules):
            mx = Inches(4.3) + Inches(j * 2.2)
            add_card(slide, mx, y + Inches(0.2), Inches(2.0), Inches(1.1), C_WHITE)
            add_textbox(slide, mx + Inches(0.15), y + Inches(0.35), Inches(1.7), Inches(0.7),
                        mod, font_size=10, color=C_TEXT, alignment=PP_ALIGN.CENTER)
        if i < len(layers) - 1:
            add_textbox(slide, Inches(1.8), y + Inches(1.5), Inches(1.0), Inches(0.35),
                        "V", font_size=16, color=C_ACCENT, bold=True)
    add_bg_rect(slide, Inches(0.5), Inches(6.55), Inches(12.1), Inches(0.6), C_DARK)
    add_textbox(slide, Inches(0.9), Inches(6.62), Inches(11.3), Inches(0.45),
                "技术栈: Python 3.13 + Flask + Three.js WebGL + HTML5/CSS3/JavaScript  |  HTTP + JSON  |  自研逐帧步进式会话管理",
                font_size=11, color=C_ACCENT, bold=True)
    add_figure(slide, "ch3/fig3-2_system_architecture.png", Inches(7.5), Inches(1.3), width=Inches(5.5))
    slide_number(slide, 7)
    return slide

# ============ SLIDE 8: COMPLEX SCENE MODELING ============
def build_slide_08():
    slide = add_blank_slide()
    build_slide_bg(slide)
    section_header(slide, "复杂场景建模", "Complex Scene Modeling -- 六要素统一仿真")
    elements = [
        ("无人机节点", "24架, 感知半径180m\n视场角120度, 速度28m/s\n初始能量100单位, 故障率6%", C_BLUE_L),
        ("动态目标", "6个, 速度14m/s\n不同优先级与不确定性\n持续运动中随机转向", RGBColor(0xE6, 0x7E, 0x22)),
        ("障碍环境", "34个建筑物, 高度36-120m\n栅格地图33x33\n影响视线和绕障路径", C_RED),
        ("通信链路", "半径300m, 丢包率4%\n延迟0-2步\n链路质量影响融合权重", RGBColor(0x8E, 0x44, 0xAD)),
        ("天气扰动", "晴空/薄雾/降雨/雷暴\n影响能见度和传感器噪声\n画面实时联动", RGBColor(0x16, 0xA0, 0x85)),
        ("地图参数", "1320x1320尺度\n栅格精度40m/格\n道路+建筑+空闲区域", C_DARK),
    ]
    for i, (name, desc, color) in enumerate(elements):
        col = i % 3; row = i // 3
        x = Inches(0.5) + Inches(col * 4.15)
        y = Inches(1.35) + Inches(row * 2.7)
        add_card(slide, x, y, Inches(3.85), Inches(2.35), C_WHITE)
        add_bg_rect(slide, x, y, Inches(3.85), Inches(0.06), color)
        add_textbox(slide, x + Inches(0.3), y + Inches(0.2), Inches(3.2), Inches(0.35),
                    name, font_size=16, color=color, bold=True)
        add_textbox(slide, x + Inches(0.3), y + Inches(0.7), Inches(3.2), Inches(1.4),
                    desc, font_size=11, color=C_TEXT)
    slide_number(slide, 8)
    return slide

# ============ SLIDE 9: RADS ALGORITHM CORE ============
def build_slide_09():
    slide = add_blank_slide()
    build_slide_bg(slide)
    section_header(slide, "RADS 动态子群选择算法", "Risk-Aware Dynamic Subgroup Selection -- 核心思想")
    add_card(slide, Inches(4.5), Inches(1.6), Inches(4.3), Inches(1.5), C_DARK)
    add_textbox(slide, Inches(4.8), Inches(1.7), Inches(3.8), Inches(0.5),
                "RADS 动态子群选择", font_size=22, color=C_ACCENT, bold=True)
    add_textbox(slide, Inches(4.8), Inches(2.25), Inches(3.8), Inches(0.6),
                "每一步重新判断:\n目标需要多少资源?\n哪些无人机更适合参与?",
                font_size=13, color=C_WHITE)
    inputs = [
        ("目标需求评估", Inches(0.5), Inches(1.5), [
            "优先级 Priority", "不确定性 Uncertainty",
            "运动强度 Motion", "目标-无人机距离",
        ]),
        ("节点能力评估", Inches(0.5), Inches(4.0), [
            "剩余能量 Energy", "链路质量 Link Quality",
            "路径代价 Path Cost", "视线条件 LOS",
            "感知覆盖能力",
        ]),
        ("环境约束感知", Inches(8.5), Inches(1.5), [
            "障碍遮挡关系", "天气扰动强度",
            "通信丢包/延迟", "故障节点排除",
        ]),
    ]
    for title, x, y, items in inputs:
        add_card(slide, x, y, Inches(3.5), Inches(2.3), C_WHITE)
        add_bg_rect(slide, x, y, Inches(3.5), Inches(0.45), C_MID)
        add_textbox(slide, x + Inches(0.2), y + Inches(0.05), Inches(3.1), Inches(0.35),
                    title, font_size=14, color=C_WHITE, bold=True)
        for j, item in enumerate(items):
            iy = y + Inches(0.55) + Inches(j * 0.35)
            add_textbox(slide, x + Inches(0.25), iy, Inches(2.9), Inches(0.3),
                        "* " + item, font_size=11, color=C_TEXT)
    add_bg_rect(slide, Inches(4.5), Inches(3.5), Inches(4.3), Inches(1.2), RGBColor(0x14, 0x3D, 0x1A))
    add_textbox(slide, Inches(4.8), Inches(3.55), Inches(3.8), Inches(0.35),
                "输出: 无人机子群分配方案", font_size=15, color=C_GREEN, bold=True)
    add_textbox(slide, Inches(4.8), Inches(3.95), Inches(3.8), Inches(0.6),
                "确定每目标派机规模 + 成员ID\n动态预算 = f(任务压力, 系统状态)",
                font_size=11, color=C_WHITE)
    add_bg_rect(slide, Inches(0.5), Inches(6.2), Inches(12.1), Inches(0.95), C_DARK)
    add_textbox(slide, Inches(0.9), Inches(6.3), Inches(11.3), Inches(0.75),
                "对比基线: 随机派遣(随机选子群, 规模相同但成员随机) | 全量派遣(所有可用无人机全部参与)\n"
                "RADS 的核心优势: 不是派出越多越好, 而是为每个目标找到最合适的感知子群",
                font_size=12, color=C_WHITE)
    slide_number(slide, 9)
    return slide

# ============ SLIDE 10: RADS SCHEDULING FLOW ============
def build_slide_10():
    slide = add_blank_slide()
    build_slide_bg(slide)
    section_header(slide, "RADS 调度流程与感知融合", "Scheduling Flow & Perception Fusion Pipeline")
    steps = [
        ("Step 1\n状态更新", "更新目标和无人机\n位置、能量、故障"),
        ("Step 2\n目标需求计算", "对每个目标计算优\n先级、不确定性"),
        ("Step 3\n候选效用评估", "对每对(无人机,目标)\n计算综合效用分数"),
        ("Step 4\n动态预算分配", "按任务压力确定\n每目标派机规模"),
        ("Step 5\n子群成员选择", "按效用排序\n选择最优成员组合"),
        ("Step 6\n感知融合判定", "采集观测->链路传输\n->多机融合->成功判定"),
    ]
    for i, (title, desc) in enumerate(steps):
        x = Inches(0.3) + Inches(i * 2.15)
        add_card(slide, x, Inches(1.4), Inches(1.95), Inches(1.6), C_WHITE)
        add_textbox(slide, x + Inches(0.1), Inches(1.5), Inches(1.75), Inches(0.55),
                    title, font_size=10, color=C_DARK, bold=True, alignment=PP_ALIGN.CENTER)
        add_textbox(slide, x + Inches(0.1), Inches(2.1), Inches(1.75), Inches(0.7),
                    desc, font_size=9, color=C_GRAY, alignment=PP_ALIGN.CENTER)
        if i < len(steps) - 1:
            add_textbox(slide, x + Inches(1.95), Inches(1.8), Inches(0.25), Inches(0.5),
                        ">", font_size=16, color=C_ACCENT, bold=True)
    add_bg_rect(slide, Inches(0.5), Inches(3.3), Inches(12.1), Inches(3.8), C_DARK)
    add_textbox(slide, Inches(0.9), Inches(3.4), Inches(11), Inches(0.35),
                "感知融合与成功判定机制", font_size=16, color=C_ACCENT, bold=True)
    fusion_steps = [
        ("观测生成", "满足距离+视线+\n视场角条件后\n概率探测目标"),
        ("链路传输", "根据丢包率和延迟\n决定观测是否送达\n影响融合权重"),
        ("稳健融合", "多机观测加权融合\n抑制异常值和\n低质量链路观测"),
        ("严格成功", "确认观测数>=阈值\n融合误差<=容忍度\n位置一致性满足"),
    ]
    for i, (title, desc) in enumerate(fusion_steps):
        x = Inches(0.9) + Inches(i * 3.0)
        add_textbox(slide, x, Inches(3.85), Inches(2.6), Inches(0.3),
                    "> " + title, font_size=13, color=C_GREEN, bold=True)
        add_textbox(slide, x, Inches(4.2), Inches(2.6), Inches(0.9),
                    desc, font_size=11, color=C_WHITE)
    add_figure(slide, "ch7/fig7-2_engine_step_flow.png",
               Inches(0.9), Inches(5.15), width=Inches(11.0), height=Inches(1.7))
    slide_number(slide, 10)
    return slide

# ============ SLIDE 11: PLATFORM IMPLEMENTATION ============
def build_slide_11():
    slide = add_blank_slide()
    build_slide_bg(slide)
    section_header(slide, "平台实现成果", "Platform Implementation -- 核心功能展示")
    features = [
        ("参数配置面板", "无人机/目标/障碍物数量\n感知/通信半径、丢包率\n天气类型、运行模式选择"),
        ("三维态势沙盘", "WebGL实时渲染\n无人机/目标/障碍物/路径\n旋转/缩放/俯视交互"),
        ("三策略同步对比", "主视图+两个基线窗口\n三视图大对比弹窗\n同场景公平比较"),
        ("任务级分析与导出", "目标级结果表格\n视图联动高亮\nCSV结构化导出"),
    ]
    for i, (title, desc) in enumerate(features):
        col = i % 2; row = i // 2
        x = Inches(0.5) + Inches(col * 6.3)
        y = Inches(1.35) + Inches(row * 2.8)
        add_card(slide, x, y, Inches(5.95), Inches(2.45), C_WHITE)
        add_bg_rect(slide, x, y, Inches(0.06), Inches(2.45), C_ACCENT)
        add_textbox(slide, x + Inches(0.3), y + Inches(0.2), Inches(5.3), Inches(0.35),
                    title, font_size=16, color=C_DARK, bold=True)
        add_textbox(slide, x + Inches(0.3), y + Inches(0.65), Inches(5.3), Inches(1.5),
                    desc, font_size=12, color=C_TEXT)
    add_bg_rect(slide, Inches(0.5), Inches(6.55), Inches(12.1), Inches(0.6), C_DARK)
    add_textbox(slide, Inches(0.9), Inches(6.62), Inches(11.3), Inches(0.45),
                "前端: HTML5 + CSS3 + JavaScript + Three.js WebGL  |  后端: Python + Flask  |  仿真引擎: 自研逐步推进会话管理",
                font_size=11, color=C_ACCENT, bold=True)
    add_figure(slide, "ch7/fig7-8_scene3d_structure.png", Inches(0.5), Inches(1.35), width=Inches(3.7))
    add_figure(slide, "ch7/fig7-1_tech_stack.png", Inches(8.5), Inches(1.35), width=Inches(4.0))
    slide_number(slide, 11)
    return slide

# ============ SLIDE 12: EXPERIMENT DESIGN ============
def build_slide_12():
    slide = add_blank_slide()
    build_slide_bg(slide)
    section_header(slide, "实验设计", "Experiment Design -- 三策略 x 四组实验 x 六维评价")
    add_textbox(slide, Inches(0.8), Inches(1.3), Inches(11), Inches(0.35),
                "对比策略", font_size=18, color=C_DARK, bold=True)
    strategies = [
        ("RADS", "动态子群选择", "按目标需求与节点效用\n每步动态调整子群", C_GREEN),
        ("随机派遣", "Random Dispatch", "子群规模与RADS相同\n但成员随机选取", C_RED),
        ("全量派遣", "Full Dispatch", "所有可用无人机\n全部参与每个目标", C_BLUE_L),
    ]
    for i, (name, en, desc, color) in enumerate(strategies):
        x = Inches(0.5) + Inches(i * 4.1)
        add_card(slide, x, Inches(1.8), Inches(3.8), Inches(1.5), C_WHITE)
        add_bg_rect(slide, x, Inches(1.8), Inches(3.8), Inches(0.06), color)
        add_textbox(slide, x + Inches(0.25), Inches(1.95), Inches(3.3), Inches(0.35),
                    name + " (" + en + ")", font_size=15, color=color, bold=True)
        add_textbox(slide, x + Inches(0.25), Inches(2.35), Inches(3.3), Inches(0.8),
                    desc, font_size=11, color=C_GRAY)
    add_textbox(slide, Inches(0.8), Inches(3.6), Inches(11), Inches(0.35),
                "实验变量 (四组)", font_size=18, color=C_DARK, bold=True)
    groups = [
        ("默认场景", "24机6目标34障碍\n晴空天气, 标准通信", "基线参照"),
        ("任务规模", "目标数6->10\n无人机数24->32", "验证负载适应性"),
        ("天气扰动", "晴空->薄雾->降雨->雷暴\n能见度与噪声变化", "验证环境鲁棒性"),
        ("通信条件", "通信半径300->400m\n丢包率0%->10%\n延迟0->2步", "验证通信敏感性"),
    ]
    for i, (name, desc, purpose) in enumerate(groups):
        x = Inches(0.5) + Inches(i * 3.1)
        add_card(slide, x, Inches(4.05), Inches(2.85), Inches(1.6), C_WHITE)
        add_textbox(slide, x + Inches(0.2), Inches(4.15), Inches(2.45), Inches(0.3),
                    name, font_size=14, color=C_DARK, bold=True)
        add_textbox(slide, x + Inches(0.2), Inches(4.5), Inches(2.45), Inches(0.7),
                    desc, font_size=10, color=C_GRAY)
        add_textbox(slide, x + Inches(0.2), Inches(5.2), Inches(2.45), Inches(0.3),
                    "目的: " + purpose, font_size=10, color=C_ACCENT, bold=True)
    add_bg_rect(slide, Inches(0.5), Inches(5.95), Inches(12.1), Inches(0.35), C_MID)
    metrics = ["严格成功率", "定位达标率", "平均定位误差(m)", "累计能耗", "平均派机数量", "平均信息时效(步)"]
    for i, m in enumerate(metrics):
        add_textbox(slide, Inches(0.7) + Inches(i * 2.1), Inches(5.95), Inches(2.0), Inches(0.35),
                    m, font_size=10, color=C_WHITE, bold=True)
    add_textbox(slide, Inches(0.8), Inches(6.45), Inches(11), Inches(0.7),
                "所有策略在同一场景参数下同步运行, 保证对比公平性 | 每组实验重复多次取平均值 | 还包含障碍物数量(34->50)实验验证绕障适应性",
                font_size=10, color=C_GRAY)
    slide_number(slide, 12)
    return slide
'''

with open(r'D:\biushe\scripts\generate_final_defense_ppt.py', 'a', encoding='utf-8') as f:
    f.write(append)
print("Slides 3-12 appended OK")
