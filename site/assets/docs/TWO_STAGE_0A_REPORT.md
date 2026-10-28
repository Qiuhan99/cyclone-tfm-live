# 0A 执行结果 · 2026-10-28

现有网站：**https://qiuhan99.github.io/cyclone-tfm-live/**。本轮扩展它的既有工程，研究页路径 `two-stage.html`；127.0.0.1 仅为本机 QA。线上部署状态单列，不能由本机截图推断已上线。

## 1. 已读文件和工程入口

已完整阅读 `Typhoon_Research_Agent_Files/AGENT.md`，以 0A 为本轮算法规范。既有科研/网站入口及旧规范冲突见 `project_audit.md`。原类和调用路径见 `stage1_stage2_reproduction.md`。新增代码在既有 `src/two_stage/` 与 `scripts/`；未创建新站、未更换模型、未使用 gate。

## 2. 真实原始源与快照

| storm       | kind   |    bytes | sha256                                                           | url                                                                                                           | source_latest_utc         |   rows |   rejected_lines | downloaded_at_utc                |
|:------------|:-------|---------:|:-----------------------------------------------------------------|:--------------------------------------------------------------------------------------------------------------|:--------------------------|-------:|-----------------:|:---------------------------------|
| INFA_2026   | bdeck  |     4769 | ab0bbed0789670ac5d3aea78a03bf82f8bb4a22b6e19962d3bd77b3633bd855a | https://verif.rap.ucar.edu/jntweb/hurricanes-beta/realtime/plots/northwestpacific/2026/wp302026/bwp302026.dat | 2026-10-28 06:00:00+00:00 |     19 |                0 | 2026-10-28T11:28:22.897106+00:00 |
| INFA_2026   | adeck  |  8209314 | 565e6cc4f8d08003615183d8e8af3776d230b4ee225c4449848c7ee38e7e65ed | https://verif.rap.ucar.edu/jntweb/hurricanes-beta/realtime/plots/northwestpacific/2026/wp302026/awp302026.dat | 2026-10-28 06:00:00+00:00 |  38317 |              118 | 2026-10-28T11:28:32.845683+00:00 |
| CHAMPI_2026 | bdeck  |    11044 | 09b8129b166a2786cf59842bf31b3cccf936d92869496e9235d1ea0d009c8b02 | https://verif.rap.ucar.edu/jntweb/hurricanes-beta/realtime/plots/northwestpacific/2026/wp292026/bwp292026.dat | 2026-10-26 00:00:00+00:00 |     44 |                0 | 2026-10-28T11:30:16.418533+00:00 |
| CHAMPI_2026 | adeck  | 13407246 | 63e3974a8b50fac8d253e97b334204cd91279c371cebe0a35f2e4cb4f878570a | https://verif.rap.ucar.edu/jntweb/hurricanes-beta/realtime/plots/northwestpacific/2026/wp292026/awp292026.dat | 2026-10-26 06:00:00+00:00 |  72856 |              241 | 2026-10-28T11:30:39.639267+00:00 |

下载均 HTTP 200，原文、headers、SHA256、QC 和下载时间保留于 `data/two_stage_0A_v1/raw/`。A-deck 的重复风圈仅合并同中心，冲突中心隔离。rejected_lines 明确存档，不静默修补。UCAR 使用说明见 https://verif.rap.ucar.edu/jntweb/hurricanes-beta/about/guidelines/ 。原始 TECHNUM 保留，未知 aid 不改名。

CMA 页面抓取未返回可核实的当期结构化中心，JMA 当期独立观测未接入；文档参考位置没有硬编码到模型中。UCAR 网页与所下载 INFA 06Z 中心一致。旧本地 IBTrACS last3years 中 IN-FA 2026 不存在，SID 保持 unknown，未猜测。跨机构局地折返一致性尚未完成。

## 3. 真实推理、测试和网页

环境：原 Python 3.13 venv，tabpfn 9.1.0、TS 1.3.0、torch 2.14.1。checkpoint SHA256 `ece4d67eadfea42eb0e610df5189bea60cb7f31073d81e9c7a019b76eacf0be3`。CPU，固定 estimators=2、median、seed=42。权重未导出。TabPFN 遥测在新增推理入口已禁用，离线推理；科研上下文/权重不进入公开网站。

新台风主实验用 2014–2015 的1024条基础上下文，2016–2019 的320条历史 OOS 残差上下文。基础上下文最大标签时间早于每个 OOS 起点；同一显式 horizon F0 X 进入两个独立 TabPFN 任务。历史 OOS 采用固定过去上下文，不是每起点更新上下文的自适应 rolling benchmark。历史真实公开时间未核实，全部标 retrospective_prefix。

实际模型日志：`artifacts/two_stage_0A_v1/typhoon/20261028T113811027854Z/contexts/tabpfn_calls.jsonl`，2次历史 OOS base predict（lat/lon）+2次最终 base predict+2次 residual predict。独立 base/residual/query 表均保存，数值检查通过。原实验子集另有16次真实 predict。

测试：初次原实验10通过；科研工程174通过（含新增29）；网站 Python37通过、原 JS82通过，新增两阶段 JS2通过。最终复核日志见本目录 `*_tests.txt` / `test_report.md`。依赖组合 pandas2.3.3 / numpy2.5.3 会产生已有 timedelta DeprecationWarning，未当作模型失败。

网页本地验证 http://127.0.0.1:8772/two-stage.html ，实际线上发布结果见 deployment_status.json（若存在）。独立可交互报告 `champi_turn_zoom_map.html` 和 `champi_rolling_issuance.html` 可离线打开；静态科研图 `champi_turn_lead_error.png`、`residual_diagnostics.png`。

## 4. IN-FA 真正预测与不可覆盖封存

**已由两次真实 TabPFN 生成。** 起报是实际源周期2026-10-28 06:00 UTC，实际生成 2026-10-28 11:38:22.599828+00:00。计算晚于源周期，延迟明确显示；不是声称06Z当时已经发报。所有6个目标在生成时尚未到达，prospective_at_creation=true；本地封存不是第三方公开时间认证。

|   lead_h | valid_at_utc              |   mu_base_lat |   mu_base_lon |   r_hat_lat |   r_hat_lon |   corrected_lat |   corrected_lon | verification_status   |
|---------:|:--------------------------|--------------:|--------------:|------------:|------------:|----------------:|----------------:|:----------------------|
|        6 | 2026-10-28 12:00:00+00:00 |       15.3994 |      157.9524 |      0.0331 |     -0.0263 |         15.4326 |        157.9262 | pending               |
|       12 | 2026-10-28 18:00:00+00:00 |       15.5325 |      157.0301 |      0.0416 |     -0.2321 |         15.5741 |        156.7981 | pending               |
|       24 | 2026-10-29 06:00:00+00:00 |       15.8492 |      154.8526 |      0.2208 |     -0.3264 |         16.0700 |        154.5262 | pending               |
|       36 | 2026-10-29 18:00:00+00:00 |       16.8012 |      152.7824 |      0.2020 |     -0.5576 |         17.0032 |        152.2247 | pending               |
|       48 | 2026-10-30 06:00:00+00:00 |       17.5126 |      150.7984 |      0.3998 |     -0.8705 |         17.9124 |        149.9279 | pending               |
|       72 | 2026-10-31 06:00:00+00:00 |       19.2289 |      147.3064 |      0.5917 |     -1.0908 |         19.8206 |        146.2156 | pending               |

Manifest：`artifacts/two_stage_0A_v1/typhoon/20261028T113811027854Z/snapshots/INFA_2026/20261028T060000Z/forecast_manifest.json`。原始预测 pending，未来验证只写新版本表，不改旧预测。预测误差、coverage未编造。后续 CLI `verify_two_stage_0a.py` 会按新真值 hash 保存结果。

## 5. CHAMPI 历史回放及正负结果

已重跑 UTC：19日00、20日00/12、21日00/12、22日00/12、23日00/06，共9次。每次只从当时位置 prefix 构造特征。最晚23日06的72h真值超出B-deck末端，故72h配对n=8，其余n=9，不近邻补点。

|   lead_h |      n |   T0_MAE_km |   T1_MAE_km |   mean_improvement_km |   win_rate |   worst_improvement_km |
|---------:|-------:|------------:|------------:|----------------------:|-----------:|-----------------------:|
|   6.0000 | 9.0000 |     27.8575 |     27.3147 |                0.5428 |     0.5556 |                -4.8877 |
|  12.0000 | 9.0000 |     64.2275 |     65.9285 |               -1.7010 |     0.3333 |               -19.5568 |
|  24.0000 | 9.0000 |    131.5786 |    141.5190 |               -9.9404 |     0.2222 |               -42.5190 |
|  36.0000 | 9.0000 |    153.7579 |    153.2470 |                0.5108 |     0.3333 |               -27.6582 |
|  48.0000 | 9.0000 |    193.0477 |    190.9361 |                2.1116 |     0.6667 |               -82.7736 |
|  72.0000 | 8.0000 |    385.9759 |    349.0469 |               36.9289 |     0.6250 |              -106.7103 |

最差校正案例：

| storm_id    | issue_time_utc            |   lead_h | valid_at_utc              |       T0 |       T1 |   improvement_km |
|:------------|:--------------------------|---------:|:--------------------------|---------:|---------:|-----------------:|
| CHAMPI_2026 | 2026-10-22 12:00:00+00:00 |       72 | 2026-10-25 12:00:00+00:00 | 509.0142 | 615.7244 |        -106.7103 |
| CHAMPI_2026 | 2026-10-22 00:00:00+00:00 |       72 | 2026-10-25 00:00:00+00:00 | 458.5925 | 562.9078 |        -104.3153 |
| CHAMPI_2026 | 2026-10-22 12:00:00+00:00 |       48 | 2026-10-24 12:00:00+00:00 | 247.1653 | 329.9389 |         -82.7736 |
| CHAMPI_2026 | 2026-10-23 06:00:00+00:00 |       48 | 2026-10-25 06:00:00+00:00 | 197.5324 | 242.9916 |         -45.4592 |
| CHAMPI_2026 | 2026-10-22 00:00:00+00:00 |       48 | 2026-10-24 00:00:00+00:00 | 211.2274 | 254.0107 |         -42.7832 |

转向检测采用实际每6h新增 TabPFN query，不插值。共享 horizon-feature 策略来自原 `tabpfn_smoke.py`；模型、上下文、原六个时距预测不变，最大原时距数值差记录在 `artifacts/two_stage_0A_v1/turn_dense/20261028T120124555388Z/turn_bundle.json`。原初稀疏查询和后续密集查询均保留。

| event   |   window_h | model   | status                        |   n |
|:--------|-----------:|:--------|:------------------------------|----:|
| A       |          6 | T0      | no_event_detected             |   9 |
| A       |          6 | T1      | no_event_detected             |   9 |
| A       |         12 | T0      | no_event_detected             |   9 |
| A       |         12 | T1      | no_event_detected             |   9 |
| B       |          6 | T0      | censored_sparse_forecast_grid |   1 |
| B       |          6 | T0      | missed                        |   6 |
| B       |          6 | T0      | no_event_detected             |   2 |
| B       |          6 | T1      | censored_sparse_forecast_grid |   1 |
| B       |          6 | T1      | hit                           |   3 |
| B       |          6 | T1      | missed                        |   3 |
| B       |          6 | T1      | no_event_detected             |   2 |
| B       |         12 | T0      | censored_sparse_forecast_grid |   1 |
| B       |         12 | T0      | missed                        |   6 |
| B       |         12 | T0      | no_event_detected             |   2 |
| B       |         12 | T1      | censored_sparse_forecast_grid |   1 |
| B       |         12 | T1      | hit                           |   1 |
| B       |         12 | T1      | missed                        |   5 |
| B       |         12 | T1      | no_event_detected             |   2 |

两类转向的逐次 onset/location error、miss/false_alarm/censoring 全部见 `champi_turning_scorecard.csv`。阈值为预设探索性规则，未在独立风暴事件标签上训练；6/12h窗口敏感性均报告。不能据此声称已可靠提前预测台湾附近的动力学折返。

## 6. 外部参考配对

|   lead_h | model                |   n |   external_MAE_km |   T1_MAE_same_pairs_km |
|---------:|:---------------------|----:|------------------:|-----------------------:|
|        6 | ATCF:AEMN/TECHNUM:03 |   9 |           22.2880 |                27.3147 |
|        6 | ATCF:CMC/TECHNUM:03  |   8 |           20.6027 |                25.6688 |
|        6 | ATCF:NGX/TECHNUM:03  |   3 |           32.2611 |                24.4487 |
|        6 | ATCF:UKM/TECHNUM:03  |   8 |           12.7742 |                25.6688 |
|       12 | ATCF:AEMN/TECHNUM:03 |   9 |           27.2412 |                65.9285 |
|       12 | ATCF:CMC/TECHNUM:03  |   8 |           27.9664 |                60.9639 |
|       12 | ATCF:NGX/TECHNUM:03  |   3 |           25.9669 |                70.2397 |
|       12 | ATCF:UKM/TECHNUM:03  |   8 |           27.8635 |                60.9639 |
|       24 | ATCF:AEMN/TECHNUM:03 |   9 |           48.1440 |               141.5190 |
|       24 | ATCF:CMC/TECHNUM:03  |   8 |           47.9905 |               144.4103 |
|       24 | ATCF:NGX/TECHNUM:03  |   3 |           46.2716 |               191.1917 |
|       24 | ATCF:UKM/TECHNUM:03  |   8 |           73.6531 |               144.4103 |
|       36 | ATCF:AEMN/TECHNUM:03 |   9 |           69.6639 |               153.2470 |
|       36 | ATCF:CMC/TECHNUM:03  |   8 |           50.6030 |               150.4043 |
|       36 | ATCF:NGX/TECHNUM:03  |   3 |           60.0758 |               194.1580 |
|       36 | ATCF:UKM/TECHNUM:03  |   8 |           79.0219 |               150.4043 |
|       48 | ATCF:AEMN/TECHNUM:03 |   9 |           92.7834 |               190.9361 |
|       48 | ATCF:CMC/TECHNUM:03  |   8 |           47.5000 |               184.4292 |
|       48 | ATCF:NGX/TECHNUM:03  |   3 |          115.7410 |               282.9274 |
|       48 | ATCF:UKM/TECHNUM:03  |   8 |           97.1514 |               184.4292 |
|       72 | ATCF:AEMN/TECHNUM:03 |   8 |          197.3174 |               349.0469 |
|       72 | ATCF:CMC/TECHNUM:03  |   8 |          146.6423 |               349.0469 |
|       72 | ATCF:NGX/TECHNUM:03  |   3 |          218.1417 |               464.1295 |
|       72 | ATCF:UKM/TECHNUM:03  |   8 |          197.3782 |               349.0469 |

这里只比较相同 issue/lead/valid 和同 B-deck 真值；各 aid 有更丰富输入，实际发布时间未知，属于 historical_aid_hindsight_comparison，不是同信息公平对照。完整原始 aid 表 `external_paired_errors.csv`，不只保留有利模型。

## 7. M3 F0/F1 四组真实消融

| cohort           |   lead_h | method   |   n |   storms |   mae_km |
|:-----------------|---------:|:---------|----:|---------:|---------:|
| 2024_multi_storm |        6 | T0       |  52 |       26 |  55.5719 |
| 2024_multi_storm |        6 | T1       |  52 |       26 |  54.5987 |
| 2024_multi_storm |        6 | T2       |  52 |       26 |  51.8033 |
| 2024_multi_storm |        6 | T3       |  52 |       26 |  54.1001 |
| 2024_multi_storm |       12 | T0       |  52 |       26 | 112.3420 |
| 2024_multi_storm |       12 | T1       |  52 |       26 | 107.1123 |
| 2024_multi_storm |       12 | T2       |  52 |       26 | 104.9281 |
| 2024_multi_storm |       12 | T3       |  52 |       26 | 103.8443 |
| 2024_multi_storm |       24 | T0       |  52 |       26 | 242.7944 |
| 2024_multi_storm |       24 | T1       |  52 |       26 | 231.9813 |
| 2024_multi_storm |       24 | T2       |  52 |       26 | 227.8461 |
| 2024_multi_storm |       24 | T3       |  52 |       26 | 220.7355 |
| 2024_multi_storm |       36 | T0       |  52 |       26 | 383.8569 |
| 2024_multi_storm |       36 | T1       |  52 |       26 | 366.1248 |
| 2024_multi_storm |       36 | T2       |  52 |       26 | 376.4782 |
| 2024_multi_storm |       36 | T3       |  52 |       26 | 362.4649 |
| 2024_multi_storm |       48 | T0       |  52 |       26 | 494.5658 |
| 2024_multi_storm |       48 | T1       |  52 |       26 | 470.3063 |
| 2024_multi_storm |       48 | T2       |  52 |       26 | 500.5884 |
| 2024_multi_storm |       48 | T3       |  52 |       26 | 495.7058 |
| 2024_multi_storm |       72 | T0       |  52 |       26 | 911.1618 |
| 2024_multi_storm |       72 | T1       |  52 |       26 | 882.5336 |
| 2024_multi_storm |       72 | T2       |  52 |       26 | 916.4515 |
| 2024_multi_storm |       72 | T3       |  52 |       26 | 908.2328 |
| CHAMPI_2026      |        6 | T0       |   9 |        1 |  32.0159 |
| CHAMPI_2026      |        6 | T1       |   9 |        1 |  31.5454 |
| CHAMPI_2026      |        6 | T2       |   9 |        1 |  25.4660 |
| CHAMPI_2026      |        6 | T3       |   9 |        1 |  25.6503 |
| CHAMPI_2026      |       12 | T0       |   9 |        1 |  67.3189 |
| CHAMPI_2026      |       12 | T1       |   9 |        1 |  63.1112 |
| CHAMPI_2026      |       12 | T2       |   9 |        1 |  65.4320 |
| CHAMPI_2026      |       12 | T3       |   9 |        1 |  64.3507 |
| CHAMPI_2026      |       24 | T0       |   9 |        1 | 125.0017 |
| CHAMPI_2026      |       24 | T1       |   9 |        1 | 140.7198 |
| CHAMPI_2026      |       24 | T2       |   9 |        1 | 134.5447 |
| CHAMPI_2026      |       24 | T3       |   9 |        1 | 149.4576 |
| CHAMPI_2026      |       36 | T0       |   9 |        1 | 193.3644 |
| CHAMPI_2026      |       36 | T1       |   9 |        1 | 199.8192 |
| CHAMPI_2026      |       36 | T2       |   9 |        1 | 165.2492 |
| CHAMPI_2026      |       36 | T3       |   9 |        1 | 168.3125 |
| CHAMPI_2026      |       48 | T0       |   9 |        1 | 220.7146 |
| CHAMPI_2026      |       48 | T1       |   9 |        1 | 251.0967 |
| CHAMPI_2026      |       48 | T2       |   9 |        1 | 188.3739 |
| CHAMPI_2026      |       48 | T3       |   9 |        1 | 211.6735 |
| CHAMPI_2026      |       72 | T0       |   8 |        1 | 262.7462 |
| CHAMPI_2026      |       72 | T1       |   8 |        1 | 288.4913 |
| CHAMPI_2026      |       72 | T2       |   8 |        1 | 308.6739 |
| CHAMPI_2026      |       72 | T3       |   8 |        1 | 349.7919 |

2024队列包含26场风暴、每时距52个起点；选择规则只看时间网格/历史可用性，没有按模型误差挑选。F0/F1 四组使用相同1024/320上下文、24h历史资格、seed、median及预算。这导致其抽样上下文与上面的F0主实验不同，不能把两张表混为同一实验或选择性替换。

F1仅从过去轨迹计算6/12/24h速度、加速度、航向sin/cos。F2/F3缺乏经核实的当时环境场与发布时间，未拿事后再分析替代。没有 gate、没有外部模型充当第二阶段。Conformal独立后置且本轮未校准，不画虚构区域。

## 8. 未完成事项和可运行命令

严格 as-issued 的历史公开时间证明、跨机构中心定位敏感性、独立训练的转向事件阈值/precision-recall、独立Conformal校准及依赖条件研究仍未完成。一般时间序列完整缓存已复核，但本次新推理仅覆盖ETTh1首8个eval点的HUFL，未重算全部321维Electricity。不能把它写成全量独立重推理。

所有命令从 workspace根目录运行：

```bash
tabpfn_residual_realdata/.venv/bin/python tabpfn_joint_trajectory_research/scripts/two_stage_data.py --storm INFA_2026
tabpfn_residual_realdata/.venv/bin/python tabpfn_joint_trajectory_research/scripts/two_stage_data.py --storm CHAMPI_2026
tabpfn_residual_realdata/.venv/bin/python tabpfn_joint_trajectory_research/scripts/reproduce_two_stage_realdata.py --fresh-origins 8
tabpfn_residual_realdata/.venv/bin/python tabpfn_joint_trajectory_research/scripts/run_two_stage_0a.py
tabpfn_residual_realdata/.venv/bin/python tabpfn_joint_trajectory_research/scripts/run_two_stage_turn_dense.py
tabpfn_residual_realdata/.venv/bin/python tabpfn_joint_trajectory_research/scripts/run_two_stage_factorial.py
tabpfn_residual_realdata/.venv/bin/python tabpfn_joint_trajectory_research/scripts/verify_two_stage_0a.py --storm INFA_2026
tabpfn_residual_realdata/.venv/bin/python tabpfn_joint_trajectory_research/scripts/export_two_stage_0a_site.py
tabpfn_residual_realdata/.venv/bin/python tabpfn_joint_trajectory_research/scripts/report_two_stage_0a.py
python3 -m http.server 8772 --bind 127.0.0.1 --directory cyclone-tfm-live-runtime/site
```

本流程未部署定期推理/抓取调度，网站不得标“自动更新中”。只有公开预测/汇总导出；本报告不保证更改对话服务的训练或保留设置。
