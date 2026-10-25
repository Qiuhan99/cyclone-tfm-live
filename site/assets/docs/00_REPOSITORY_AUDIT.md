# M0 项目审计 · 2026-10-24

已完整读取 CHAMPI 819 行计划和当前研究者指南 661 行，检索上一轮本地会话（116 条 user/assistant 消息，提取副本仅保存在 reports，未放入网站）。结合 RUN_LOG、README、web/README、数据与模型实现复核。会话中明确选择“仅本地运行”，本轮继续遵循。

| 项目 | 状态 | 真实路径与结论 |
|---|---|---|
| 当前主站 | implemented | `web/dist/index.html`，原协议首页；`cases.html` 精选案例；`historical.html` 档案。`python3 web/serve_local.py`，127.0.0.1:8765。8635/Streamlit 是旧入口 |
| 原协议复现 | implemented | `scripts/original_short_replay.py` / `artifacts/original_short_v1`；原 Base 分块、C1 接收新观测逐步发布，不等同于固定起报整条多步预测 |
| 滚动台风预测 | implemented | `src/residuals/full_tabpfn.py`、`rolling_v2.py`；X10 / C0 12 / C1 28 维，4 个已成熟残差；v2 6–24h，固定 320 上下文 / 32 刷新。旧 48/72h 不能冒充 v2 |
| 固定二层 v1 | implemented | `artifacts/fullx_repair_v1`；2016 拟合，2017 权重门控全部选零。负结果保留 |
| Conformal | implemented | `src/conformal/{scores,rolling_regions,panel_spci}.py`；区分二维终点 / 八维联合、实心 / 环形、实际发布 / 测试后覆盖匹配 |
| 强气象预测器 | partial | 已有 ECMWF 样本与设计，尚无完整历史比较；不声称已完成 |
| CHAMPI 导入 | missing → 本轮实现 | 上传脚本是简化引导，未解决冲突位置与成员歧义；新增严格 parser，保留 raw aid、TECHNUM、行号、哈希、冲突记录 |
| F0/F1/F2 | missing → 独立实验 | 原实验均不覆盖完整分组。新分支写入 `artifacts/champi_feature_v1`，48h 同一资格窗口，与原 X10 不混称 |
| F3 / Regime Gate | deferred | 按用户要求，基础实验完成后推进；无 GRIB 不产生环境箭头；未经独立训练不显示 Gate 曲线 |

环境实测：`../tabpfn_residual_realdata/.venv/bin/python`，tabpfn 9.1.0 / torch 2.14.1 / pandas 2.3.3 / pyarrow 25.0.1 / pytest 9.1.1。本地 checkpoint `~/Library/Caches/tabpfn/tabpfn-v3.5-20260909.safetensors`（约835MiB）；CPU 可用，当前沙箱报告 MPS 不可用。复用已有回归接口，两个 ENU 输出头；不重新训练网络权重，不回退 v3。模型执行离线、遥测禁用。checkpoint 的许可依现有获取条款，不新增模型下载或权限声明。

网络：沙箱 DNS 失败；授权后系统 curl 保持 TLS 验证得到 UCAR B-deck HTTP 200。Python 3.10 的证书链失败，故下载适配器采用系统 curl，不关闭证书验证。

原文件保护：`artifacts/champi_feature_v1/prior_artifact_hashes.json` 记录所有既有 artifacts 文件；新增结果单独版本化，配置/输入/预测哈希不符拒绝复用。原始 CHAMPI 上传文件、所有兄弟项目均只读。网站无模型 API、CDN、遥测、云发布；平台是否将对话用于训练无法由项目代码控制，未作此保证。

风险：B-deck / IBTrACS 均可能后修订，available_at 未知，统一标记 hindcast_with_revised_truth；不可声称业务实时回放。ATCF aid 未核实名称时仅按原码显示。外部预报与仅轨迹学习模型的信息预算不同，单独比较共同起报/时效，不能凭单场结果称 SOTA。

复现入口：`scripts/download_champi.py`（版本化下载），`scripts/run_champi_features.py`（独立配置、真实推理与结果），`scripts/export_champi.py`（网页缓存）。测试与逐阶段状态在后续报告中记录，未运行的阶段不标 completed。
