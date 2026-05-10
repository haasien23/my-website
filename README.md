# 基于集群的多任务协同态势感知平台

这是一个基于 Python 的前后端结合仿真平台，服务于毕设题目“基于集群的多任务协同态势感知平台”。

这一版重点强化了四件事：

1. 项目结构模块化，核心代码已经拆入 `src/`。
2. 网页端不是一次性出最终结果，而是通过后端会话逐步推进，进度条和画面会连续更新。
3. 仿真环境加入了障碍物、绕障最短路径、视线遮挡和动态重规划。
4. 派机算法强调动态选择无人机子集，并与随机派出无人机方法做对照实验。

补充说明：

- 页面中的“随机种子”用于控制基础场景分布。
- 每次点击“运行仿真”时，后端都会额外注入新的运行时随机扰动，因此即使参数相同，目标轨迹、障碍环境下的交互过程和最终感知结果也会不同。

## 目录结构

- [app.py](/d:/biushe/app.py)
  Web 服务启动入口。
- [simulator.py](/d:/biushe/simulator.py)
  顶层兼容入口，实际逻辑已迁移到 `src/simulation/`。
- [src/simulation/core.py](/d:/biushe/src/simulation/core.py)
  仿真主逻辑，包含动态派机、协同融合、逐帧序列化。
- [src/simulation/pathfinding.py](/d:/biushe/src/simulation/pathfinding.py)
  障碍物地图、网格距离图、绕障最短路径和视线判定。
- [src/web/server.py](/d:/biushe/src/web/server.py)
  HTTP 服务与 API 路由。
- [src/web/sessions.py](/d:/biushe/src/web/sessions.py)
  会话式逐步仿真管理。
- [templates/index.html](/d:/biushe/templates/index.html)
  毕设主题页面模板。
- [static/app.js](/d:/biushe/static/app.js)
  前端交互、进度展示、回放控制与可视化逻辑。
- [static/styles.css](/d:/biushe/static/styles.css)
  页面样式。

## 当前仿真模型

平台当前考虑了这些现实约束：

- 多无人机、多目标、多任务并行感知。
- 每个无人机具有有限感知范围。
- 障碍物会影响路径规划和感知视线。
- 无人机需要绕障机动，使用网格最短路径近似。
- 目标会动态移动并在障碍环境中发生转向。
- 节点存在能量衰减与随机故障。
- `RADS` 会动态选择参与感知的无人机子集，而不是所有节点全量参与。

## Web 端运行方式

```powershell
python app.py
```

默认访问：

```text
http://127.0.0.1:8000
```

## 页面能力

- 左侧参数区可调：无人机数量、目标数量、障碍物数量、传感半径、通信半径、故障率等。
- 顶部指标卡显示 `RADS` 与 `随机派机` 的成功率、覆盖率和误差。
- 进度条会随着仿真步数逐步推进。
- 主回放窗口显示集群协同过程、障碍物、目标和动态派机关系。
- 右侧回放窗口显示随机派机基线。
- 下方表格可直接用于论文实验分析。
