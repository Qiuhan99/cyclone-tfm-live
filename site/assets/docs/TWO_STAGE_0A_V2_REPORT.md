# 0A 原计划续行 · v2

本轮先补M1完整新推理与逐起点OOS，不用新特征/门控替代核心算法。旧v1快照与数值保持不变。

## 全量原实验：实际运行中，尚未完成

`artifacts/two_stage_0A_v2/full_realdata/20261028T144139005117Z`

```json
{
  "state": "running",
  "updated_at_utc": "2026-10-28T15:10:41.697154+00:00",
  "elapsed_this_process_s": 1737.7410345829994,
  "actual_calls_this_process": 2135,
  "dataset": "etth1",
  "phase": "stage1",
  "completed_blocks": 305,
  "total_blocks": 1580,
  "completed_target_rows": 305,
  "total_target_rows": 1580,
  "all_series": 7,
  "legacy_prediction_arrays_used": false
}
```

使用原TabPFN-TS和SecondStageRunner类，MPS、原权重、原上下文、原随机种子和median。每个新base/residual context与predict日志均保存；完成前不填入全量新指标。任务有独占锁和本轮缓存恢复，不读取旧实验预测缓存作为新结果。

配置核对发现：Electricity refresh=8在32个新输出上与旧缓存逐值相同；refresh=32不符。旧文档“refresh-32”不能再用作该缓存的运行配置。第二阶段n_estimators=1更接近旧结果但最大差约0.0188，不能宣称配置谱系已完全精确识别；全量任务采用当前明确配置1并记录该不确定性。

| role     |   candidate_refresh |   series_index |   max_abs_diff |   mean_abs_diff |   elapsed_s |   candidate_n_estimators |
|:---------|--------------------:|---------------:|---------------:|----------------:|------------:|-------------------------:|
| base     |                   8 |              0 |       0        |      0          |    4.6406   |                      nan |
| base     |                  32 |              0 |       0.994334 |      0.250304   |    0.736321 |                      nan |
| residual |                 nan |              0 |       0.018788 |      0.00439541 |    1.07662  |                        1 |
| residual |                 nan |              0 |       0.295031 |      0.0570275  |    1.82173  |                        2 |

## 台风逐起点 rolling OOS：本轮已完成

320个历史起点均重新选择当时已成熟的基础context，执行真实TabPFN并先冻结预测，然后构造OOS残差。最终两阶段同F0 X、同median/seed/estimators；经纬度分开、严格相加，无gate。历史公布时间仍未知，属于retrospective_prefix。

| storm_id    |   lead_h |   n |   T0_MAE_km |   T1_MAE_km |   mean_improvement_km |   win_rate |   worst_improvement_km |
|:------------|---------:|----:|------------:|------------:|----------------------:|-----------:|-----------------------:|
| CHAMPI_2026 |        6 |   9 |     24.6844 |     27.5518 |               -2.8674 |     0.2222 |               -10.0726 |
| CHAMPI_2026 |       12 |   9 |     54.7033 |     57.9786 |               -3.2753 |     0.3333 |               -18.6125 |
| CHAMPI_2026 |       24 |   9 |    120.4621 |    122.4759 |               -2.0138 |     0.3333 |               -17.6032 |
| CHAMPI_2026 |       36 |   9 |    142.9819 |    145.3396 |               -2.3576 |     0.3333 |               -21.9022 |
| CHAMPI_2026 |       48 |   9 |    184.7322 |    187.6755 |               -2.9433 |     0.4444 |               -45.6238 |
| CHAMPI_2026 |       72 |   8 |    302.6784 |    350.3045 |              -47.6261 |     0.2500 |              -146.9352 |

这些是v2的独立结果；因基础context随时间更新，不能把v2−v1差值全部归因于第二阶段。T0/T1在各自实验内做配对。

## 独立观测、身份和转向规则

NOAA当前下载核实INFA SID为2026297N11166，同时匹配NAME、SEASON、BASIN、USA_ATCF_ID。最新IBTrACS临时档案只有USA坐标，不声称其已提供JMA/CMA坐标。CMA直接源另存；未用CMA覆盖UCAR的primary truth。

原始源、大小、hash和下载时间见本次独立源manifest。位置插值IFLAG=P不进入主要跨机构对照；各机构只匹配相同有效时刻，不插值补成观测。IFLAG定义参考官方NOAA元数据：https://erddap.aoml.noaa.gov/hdb/erddap/info/IBTrACS_since1980_1/index.html 。

转向阈值仅使用2014–2019其他风暴拟合并冻结。修复原宏观规则遗漏337.5–360度北向扇区；匹配加入A±12h、B±6h容差，30h迟报不能再计hit。阈值/风速门槛是后置事件度量，不是预测gate，不改变模型输出。

| provider    | event   |   window_h | model   |   true_positive |   false_positive |   false_negative |   precision |   recall |
|:------------|:--------|-----------:|:--------|----------------:|-----------------:|-----------------:|------------:|---------:|
| CMA_direct  | A       |          6 | T0      |               0 |                0 |                0 |    nan      | nan      |
| CMA_direct  | A       |          6 | T1      |               0 |                0 |                0 |    nan      | nan      |
| CMA_direct  | A       |         12 | T0      |               0 |                0 |                0 |    nan      | nan      |
| CMA_direct  | A       |         12 | T1      |               0 |                0 |                0 |    nan      | nan      |
| CMA_direct  | B       |          6 | T0      |               5 |                2 |               10 |      0.7143 |   0.3333 |
| CMA_direct  | B       |          6 | T1      |               5 |                2 |               10 |      0.7143 |   0.3333 |
| CMA_direct  | B       |         12 | T0      |               0 |                0 |               12 |    nan      |   0.0000 |
| CMA_direct  | B       |         12 | T1      |               3 |                2 |                9 |      0.6000 |   0.2500 |
| IBTrACS:USA | A       |          6 | T0      |               0 |                0 |                0 |    nan      | nan      |
| IBTrACS:USA | A       |          6 | T1      |               0 |                0 |                0 |    nan      | nan      |
| IBTrACS:USA | A       |         12 | T0      |               0 |                0 |                0 |    nan      | nan      |
| IBTrACS:USA | A       |         12 | T1      |               0 |                0 |                0 |    nan      | nan      |
| IBTrACS:USA | B       |          6 | T0      |               5 |                2 |               10 |      0.7143 |   0.3333 |
| IBTrACS:USA | B       |          6 | T1      |               6 |                1 |                9 |      0.8571 |   0.4000 |
| IBTrACS:USA | B       |         12 | T0      |               0 |                0 |                9 |    nan      |   0.0000 |
| IBTrACS:USA | B       |         12 | T1      |               4 |                1 |                5 |      0.8000 |   0.4444 |
| UCAR_BEST   | A       |          6 | T0      |               0 |                0 |                0 |    nan      | nan      |
| UCAR_BEST   | A       |          6 | T1      |               0 |                0 |                0 |    nan      | nan      |
| UCAR_BEST   | A       |         12 | T0      |               0 |                0 |                0 |    nan      | nan      |
| UCAR_BEST   | A       |         12 | T1      |               0 |                0 |                0 |    nan      | nan      |
| UCAR_BEST   | B       |          6 | T0      |               5 |                2 |               10 |      0.7143 |   0.3333 |
| UCAR_BEST   | B       |          6 | T1      |               6 |                1 |                9 |      0.8571 |   0.4000 |
| UCAR_BEST   | B       |         12 | T0      |               0 |                0 |                9 |    nan      |   0.0000 |
| UCAR_BEST   | B       |         12 | T1      |               4 |                1 |                5 |      0.8000 |   0.4444 |

这些precision/recall是重复CHAMPI起报窗口内的kinematic proxy统计，不是多风暴独立样本率。CHAMPI已被查看过，因此本规则是探索性修订；没有人工专家事件标签，不能将独立训练阈值等同于确证真实动力学折返。

跨机构所有点误差见point_summary_by_truth_source.csv；事件时刻见agency_observed_event_times.csv；每次预测的hit/miss/false alarm及时间/位置误差见turn_scorecard.csv与event_match_details.json。

## 仍未结束

全量ETTh1/Electricity新推理仍在本机运行；不能称本轮所有工作完成。历史实际公开时间证明、独立多风暴转向预测验证、JMA原始历史记录和新协议Conformal仍需后续阶段。源数据/模型上下文/权重未公开。


## 2024多风暴转向预测检验

| model   | event   |   window_h |   storms |   issuances |   true_positive |   false_positive |   false_negative |   precision | precision_ci95                            |   recall | recall_ci95                                | precision_raw_degenerate_bootstrap   | precision_bootstrap_status        | recall_raw_degenerate_bootstrap   | recall_bootstrap_status           |
|:--------|:--------|-----------:|---------:|------------:|----------------:|-----------------:|-----------------:|------------:|:------------------------------------------|---------:|:-------------------------------------------|:-------------------------------------|:----------------------------------|:----------------------------------|:----------------------------------|
| T0      | A       |          6 |       26 |          78 |               0 |                0 |                0 |    nan      |                                           | nan      |                                            | nan                                  | nan                               | nan                               | nan                               |
| T0      | A       |         12 |       26 |          78 |               1 |                1 |                2 |      0.5000 | [0.0, 1.0]                                |   0.3333 | [0.0, 1.0]                                 | nan                                  | nan                               | nan                               | nan                               |
| T0      | B       |          6 |       26 |          78 |               8 |               42 |               41 |      0.1600 | [0.05354793233082707, 0.2857142857142857] |   0.1633 | [0.05796404682274248, 0.27033169533169527] | nan                                  | nan                               | nan                               | nan                               |
| T0      | B       |         12 |       26 |          78 |               1 |               11 |               27 |      0.0833 | [0.0, 0.3]                                |   0.0357 | [0.0, 0.1111111111111111]                  | nan                                  | nan                               | nan                               | nan                               |
| T1      | A       |          6 |       26 |          78 |               0 |                0 |                0 |    nan      |                                           | nan      |                                            | nan                                  | nan                               | nan                               | nan                               |
| T1      | A       |         12 |       26 |          78 |               0 |                1 |                3 |      0.0000 |                                           |   0.0000 |                                            | [0.0, 0.0]                           | degenerate_not_a_confidence_bound | [0.0, 0.0]                        | degenerate_not_a_confidence_bound |
| T1      | B       |          6 |       26 |          78 |               9 |               56 |               40 |      0.1385 | [0.05, 0.2329141695205479]                |   0.1837 | [0.07138704318936877, 0.2962962962962963]  | nan                                  | nan                               | nan                               | nan                               |
| T1      | B       |         12 |       26 |          78 |               1 |               24 |               27 |      0.0400 | [0.0, 0.1251008064516128]                 |   0.0357 | [0.0, 0.10716698841698839]                 | nan                                  | nan                               | nan                               | nan                               |

选择全部满足完整72h网格的风暴，每风暴至多3个均匀起点。模型与阈值训练不使用2024标签。区间按风暴cluster bootstrap，不将同风暴重复起报当独立样本；这是已被查看历史队列的探索性kinematic-proxy检验。


## 阶段验收说明与文字勘误

2024年26场风暴、78次起报的真实转向检验已经完成；上文“独立多风暴转向预测验证仍需后续阶段”的旧句指向不清，以本段和下方实际结果为准。仍欠缺的是专家事件标签及未查看队列的确证验证。现有结果是探索性kinematic-proxy评估，不能声称已证实提前预测到CHAMPI的真实动力学折返。

页面保留v1冻结结果并明确标注v1档案。v2支持CHAMPI的事后UCAR实况开关，默认隐藏，只有开启后才叠加截至所选时距的后验轨迹。实况只用于显示和评估，不改变任何基础预测、预测残差或冻结文件。INFA不开放该后验图层。

本轮327项测试通过（科研191、原时间序列13、网站JS86、网站Python37）；测试数不等同于全规范验收。全量原时间序列仍在本机重跑，历史实际可用时间、JMA原始历史记录与新协议Conformal尚未完成。
