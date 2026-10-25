# 工作区研究综述与新版网站交付说明

日期：2026-10-21（Asia/Hong_Kong）。交付方式：用户明确选择公开研究展示。

## PROJECT_STATUS

- Found：多条研究分支、真实 IBTrACS 数据、TabPFN-3.5 OOS 缓存、ECL / ETTh1 与合成实验产物、已有 Streamlit 网站和完整执行协议。
- Missing：真实台风高维环境残差面板；二层 TabPFN 普遍改进漂移下联合覆盖的证据；由点误差收益推出区域效率收益的一般定理。
- Can run offline：新版网站、缓存数据再导出、几何/因果/联合分数与前端数值检查。
- Requires permission：本轮不开展新模型推理、付费 API、大数据下载、云部署。公开的小型 Natural Earth 底图下载与本地服务按环境权限执行。
- Next 3 tasks：C2 加入独立验证集选择的正则/无害性门槛；按相同实际覆盖比较集合效率；确认环境数据发布时间后再开高维潜因子研究。

## 1. 审计方法与范围

对 Test 中非环境、非缓存的研究文件做逐文件清点，形成 `audit/workspace_inventory.json`。现有源码、文档、配置做全文解析；JSON 做结构解析；重复 CSV 产物检查字段；二进制数组、模型权重、PDF 等仅登记元数据。不是宣称逐字读完所有二进制产物，也不是对既有模型实验重新训练复现。

核心结论另对照报告、原始指标表、预测缓存和运行脚本核验。原草稿、总协议、路线图、论文骨架、理论台账、结果台账、各数据集最终报告和 toy Stage14 是主要证据。代码层重点检查 `feedback.py`、`tabpfn_rq1.py`、`tabpfn_c2.py`、`evaluate_p3_tabpfn.py`、几何与联合分数实现。

各目录作用：

| 目录 | 已有工作与证据 |
|---|---|
| `tabpfn_joint_trajectory_research` | 核心台风执行项目。P0 理论审计、IBTrACS 解析、基线与 C1、TabPFN 容量实验、多种联合 CP、协方差/合成验证、C2、陈旧度实验、Streamlit 演示。 |
| `cyclonepath-tabpfn` | 较早台风基线、表示消融与验证集实验；E7 真正二层 TabPFN 残差校正，未达预登记采用门槛。 |
| `tabpfn_residual_realdata` | ETTh1/Electricity：残差预测、状态特征、联合 conformal、保守校准、刷新/查询策略与 API 审计。 |
| `TabPFN&PID` | 原生区间、PID / ACI 与合成漂移套件；M6 native-64% 的原始证据在此。包括私有模型资产，未打包到网站。 |
| `toy_research` | 14 阶段受控合成机制研究。到 Stage14：LR 与 DP 三流联合椭球，三种子；有增量也有明确限制。 |
| `toy_residual_dp` | 另一套缩小单因子可行性实验：状态恢复成功，但点预测和 SPCI 效率链条未通过。 |
| `Data` | IBTrACS 西太平洋、last3years、JMA 等用户已有原始数据。 |
| `TabPFN-main` / `tabpfn-time-series-main` | 基础模型与时间序列表格化实现参考。 |
| `SPCI-code-main` / `MultiDimSPCI-main` | 作者参考实现与数据；不把适配运行称为逐位复现。 |
| `paper` / starter pack / 根目录路线文档 | 研究论证、早期设想、执行与数据下载说明。 |

## 2. 研究思想应如何准确表述

原始表述“residual 是关于 x 的函数”应改为：

\[
R_{t,h}=m_h(X_t,A_t)+\varepsilon_{t,h},\quad
m_h(X_t,A_t)=E[R_{t,h}\mid X_t,A_t],
\]

其中 `A_t` 是在起报时已经可观测的历史残差信息。随机变量是 R，待学习的函数是条件均值 m；不是断言随机残差完全确定于 X。

第二层的训练对为历史 `(X_j, A_j) → R_{j,h}`。查询输入为当前 `(X_t,A_t)`。不能把尚未发生的当前残差 `R_{t,h}` 直接当作当前特征。历史残差只在目标与其发布延迟到达后可用；无额外延迟时要求 `j+h≤t`。

在球面上，初始残差为 `Log_{P_base}(P_true)`，校正为 `Exp_{P_base}(R_hat)`。最终创新必须在校正后的中心重新锚定。原生预测区间、split conformal 和在线校准的概率声明分别处理。

## 3. 已有结果：哪些支持，哪些限制

### 台风容量见证

原始六张表：`artifacts/tables/tabpfn_rq1_cap10k.csv`、`_seed43.csv`、`_seed44.csv`、`_cap20k.csv`、`_seed43_cap20k.csv`、`_seed44_cap20k.csv`。

10k 上下文下，C1 在 12h 有约 5.9–6.8% MAE 改善、24h 约 3.2–3.7%；20k 下短时效收益接近零。三种子两臂，支持特定输入/容量协议下“基础模型留下多少结构决定校正空间”的解释。它不是一般性的容量因果定理，也不是 latent factor 识别证据。

### 真正的第二层 TabPFN

`artifacts/tables/tabpfn_c2.csv`：12h −4.5115%，24h −1.7868%，48h +2.5751%，72h +2.7633%（负为 MAE 改善）。C2 与便宜的 C1 共享六维因果输入，在该实验被 C1 支配。长时追噪声与模型偏差是合理解释，但“正则化就是唯一原因”未被识别。

`cyclonepath-tabpfn/reports/branch_A.md`：独立 E7 验证实验中的 TabPFN 残差校正仅有小幅收益，未通过相对最佳便宜校正器 ≥5% 且至少 3/5 时效的采用门槛。新版地图加入其真实缓存案例，显式隔离协议且不附会另一套 CP 区域。

### 台风陈旧偏移

`tabpfn_kcadence.csv` 中 k=0、1、4、8 是脚本的缓存陈旧偏移，不能未经核对解释成通用模型刷新周期。12h 校正相对陈旧 Base 的收益约从 5.9% 升至 34.4%。但 k=8 校正后约 333.81 km，仍差于 k=0 新鲜 Base 的约 84.61 km。各档有效起报数不同，曲线不能直接解释为完全配对因果效应。

### 联合 conformal

`p3_tabpfn.json` 的 72h 旧协议中，MaxScore 固定 split 的 all-origin 实际覆盖：Base 0.8831，C1 0.8729；滚动时序结果：0.8918 / 0.8941。后者包含校准后段与测试顺序；不能称为纯最终测试集的独立估计。固定区域略缩小但覆盖也更低，不能宣传“等覆盖效率胜利”。

`joint_cp_results.json` / `p4_comparison.json` 是等速度基础流协议，与 TabPFN 不可混写。原有部分文档将旧阶段判断保留在后续段落中；网站不把 README 的“完成”“confirmed”当成独立科学证据。

### ECL / ETTh1

`tabpfn_residual_realdata/results/electricity/final_conformal.csv`：Base+PI 覆盖约 0.90244、mean log-size 2563.4622；C1+PI 覆盖约 0.91159、mean log-size 2514.0613。每维等效尺度比 `exp((2514.0613−2563.4622)/321)≈0.857`，约小 14.3%。比较含后验保守校准与近似覆盖匹配，不能提升为预先固定协议下的普遍结论。

早期未修复校准的 ECL 结果确实欠覆盖；不能只取较小 log-volume。ETTh1 新鲜 Base 后校正不稳定获益；陈旧度变化和 block/per-origin 查询差异需要单列。

M6 “64%”来自七种合成机制中冻结上下文原生 90% 预测区间的平均覆盖；它不是 conformal 90% 集合的统一覆盖结果。

### 潜因子：两套 toy 的差异不能合并

`toy_research/results/stage14_report.md`：R/LR/DP 联合椭球覆盖为 90.67%/90.40%/90.20%，mean log-volume 15.7097/15.3579/15.2948；DP vs LR 几何平均体积下降 6.12%，三种子同向。没有证明椭球显著放大 DP 增量；部分历史测试段已经暴露，因此是探索性证据。

`toy_residual_dp/results/toy_feasibility_report.md`：状态恢复成功，DP 比 Local 的残差预测更好，但不稳定优于不校正的 Base；SPCI 约 81% 覆盖，未达到基本 90% 校准目标。第一处未通过环节为点预测。这不是 Stage14 的同一 DGP，不能用后者覆盖前者。

真实台风目前仅位置双坐标。潜因子作为待证伪研究方向展示；不捏造高维气象场，也不把统计状态等同于可识别物理过程。

## 4. 理论审计补充：不把旧台账照搬为已证明结论

原草稿的 staleness 索引、协方差最小特征值条件、方差到分位数的跳跃、上界最小化到真最优解的跳跃，已有审计指出问题。网站沿用较弱的正确表述，不声称本轮补全复杂漂移定理。

旧台账 Proposition B 的可直接验证部分应写清：设总体校准混合 CDF

\[
F_p(x)=(1-p)F_0(x/\sigma_1)+pF_0(x/\sigma_2),\quad F_p(Q_p)=1-\alpha.
\]

测试混合权重 q 时，直接相减得到

\[
c(p,q)-(1-\alpha)
=(q-p)\left[F_0(Q_p/\sigma_2)-F_0(Q_p/\sigma_1)\right].
\]

若 `0<σ1<σ2` 且 `Qp≥0`，括号非正；严格负还要求相关区间上 CDF 严格递增。该符号结论是总体分位数下的代数事实。连续分布本身不保证总体分位数唯一或严格不等式；任意有正负支持的 F0 也不能不加条件宣称尺度随机序。有限样本秩阈值还有随机性，需要单独处理。网站不借此宣称任意漂移下的精确覆盖或潜因子新颖性。

条件均值风险投影恒等式是在一致的信息 σ-代数下成立的：拟合模型和训练历史的随机性也要纳入条件信息，不能从 `E[ε|X]=0` 自动推出对任意随机拟合函数的正交性，更不能推出独立性。

## 5. 新版网站协议与原有产物保护

新增目录 `web/`，旧 Streamlit 页面和历史实验产物不覆盖。

主地图：固定使用 `tabpfn_paths_stride2_cap10k.parquet`（seed42）。494 个 2016–17 OOS 起报点拟合 C1 和几何，777 个 2018–19 起报点校准秩分位数，1,369 个 2020–25 测试起报点。124 个测试风暴可回放。每种显示方法使用对应残差流与对应协方差；四种方法分别导出。6/12/24/48/72h 都重新构造所选前缀的联合分数。80/90/95% 控件实际重新选择有限样本秩阈值。

MaxScore 投影与 full-2H Mahalanobis 投影均为球面 Exp 映射下的切平面投影。Mahalanobis 使用边缘协方差块，不用条件块替代；联合判定使用完整高维分数，不用“每个投影都覆盖”替代。预测视角不显示未来真值/误差/覆盖评分，回顾开关打开后才显示。

模型调用：0。GPU：未使用。新导出是低成本缓存计算，不是模型训练或新一轮 C2 实验。输出 hash、源缓存 hash、样本数见 `audit/export-manifest.json`。

## 6. 部署与隐私

用户选择仅本地。仅绑定 `127.0.0.1`，不云部署、不公开推送、不上传模型或原始研究数据。资源本地打包，没有 CDN、地图瓦片或遥测。下载的 Natural Earth 底图为公开领域数据。

网站工程可以控制运行位置与外部请求，不能替代平台的会话保留、训练或组织策略设置作保证。

## 7. 验证及后续

实际命令和结果记录到 `audit/VALIDATION.md`。本轮已有 53 项 Python 科学测试通过，浏览器数值层另有 14 项检查；包括全部路径与源误差对照、球面半径一致性、日期变更线、真实秩阈值切换、严格协议分离、配对终点指标与 bootstrap 文件一致性。既有 NumPy/Accelerate 矩阵乘法发出浮点告警，测试通过且已导出数组检查有限/SPD；此限制保留记录。

研究上下一步优先：C2 的独立验证选择与无害性设计、严格同覆盖的效率比较、正确发布时点的高维环境变量，然后才是现实台风潜因子或复杂动态协方差。未运行昂贵新实验。

## 8. 用户反馈：为何某条路径不如简单基线？

在本网站主协议、同一批 1,369 个测试起报点上，重新汇总逐时效终点球面误差。它是起报点加权 MAE，不是把每条轨迹全部时效先平均，也不是风暴等权。

| 时效 | Persistence | 等速度 | TabPFN Base | TabPFN+C1 | C1 相对 Base 降幅 |
|---|---:|---:|---:|---:|---:|
| 6h | 109.11 | 37.60 | 36.95 | 36.95 | 0.00% |
| 12h | 217.89 | 85.66 | 84.61 | 80.66 | 4.67% |
| 24h | 434.91 | 211.73 | 188.45 | 184.68 | 2.00% |
| 48h | 866.65 | 545.28 | 426.95 | 432.57 | −1.32% |
| 72h | 1,296.55 | 939.21 | 688.54 | 709.80 | −3.09% |

单位 km。正降幅表示改善。默认 HAIKUI / 2023-09-01 18:00 UTC 是真实失败案例：24h 等速度 139.32、Base 152.40、C1 152.85；72h 则为 247.94、336.01、551.22。单例可能与总体风险排序不同，不能靠改变配色或隐藏基线修复。24h C1 只有 44.63% 起报点优于 Base，但仍可因少数较大误差改善而降低总体 MAE。

可确认的实现限制：`src/residuals/feedback.py::_lag_residual` 精确检索 `j=t−h`，当前 stride=2 缓存下奇数步校正全部回退零。6h 没有非零校正；12/24/48/72h 非零校正数为 1,245/1,131/917/728。缺失历史限制适用范围，但不能未经消融就将长时退化全部归因于缓存。C1 是六维派生特征岭回归；它没有完整检验完整 X 与残差输入第二层 TabPFN 的构想。新网站校正拟合期也较旧 2016–19 全校准期拟合实验更短，不能混用两组收益。

新增 `tools/analyze_benchmark.mjs`：124 个整风暴块有放回、同一重采样下配对各方法、2,000 次、seed=20261021，报告 MAE 比值降幅的探索性 percentile 区间。C1 vs Base：12h [2.35%, 6.97%]；24h [−0.40%, 4.42%]；48h [−3.12%, 0.45%]；72h [−5.32%, −0.90%]。保留风暴内重叠，但未建模风暴间依赖或非平稳抽样；不能将其当作漂移下严格有效的推断。分析产物绑定原 JSON 的 SHA-256，测试防止旧区间配新数据。

页面改动：全部方法同步叠加；总体终点 MAE 与当前案例并列；将完整管线 vs 等速度与 C1 vs Base 分开；保留失败案例；支持数据导出。E7 汇总只针对已导出的三个案例，明确不代表全部 E7 验证集。

后续实验应先修复为“最近的已验证可用残差 j≤t−h”（或补齐 stride=1 缓存），加入残差年龄，验证因果可用性；使用完整基础特征和同样信息集比较 C1 与 C2；在独立验证集选择时效门控/收缩，再固定规则到未触碰测试集。当前测试集已用于诊断，不能在其上挑规则后宣称独立成功。Conformal 则需另做同实际覆盖水平下的区域效率比较；当前 72h 覆盖 88.31%→88.02% 不支持“校正修复了 conformal”。

## 9. 后续完整二层实验：因果审计更新，覆盖前文旧缓存表述

前文基于旧缓存的 1,369 起报点结果只能保留作历史探索。后续发现基础三位置特征允许 i=1，读取 pts[-1]；124 个旧测试起报点受影响。上一轮因果检查未覆盖该边界。现已加入拒绝负索引的测试，并从安全三点历史、2016 年前可得标签重新拟合基础模型。新完整二层 C1-TabPFN、岭回归和 X-only 消融已真实运行；14 维特征、最近已验证残差检索、2017 独立时段门控及覆盖匹配诊断见 FULLX_REPAIR_V1_REPORT.md。新测试为 114 风暴 / 1,245 起报点；所有门控回退 Base，原始二层未改善 MAE。不能继续将旧短时增益当作本轮新方法已成功的证据。

新模型数据来自本地 CPU TabPFN-3.5 推理；无模型 API 或上传，遥测禁用。已完成 62 项 Python、21 项 JavaScript 检查，另核验 10,000 基础上下文行和 28,740 查询行的时间可用性。网站默认新协议。


## 2026-10-21 · Rolling v2 completed / exploratory negative efficiency

Actual local TabPFN-3.5 rolling C0/C1 inference completed:12/28features,4verifiedlags,ctx320/refresh32,median,1estimator,seed42. Same114storms/1245safeorigins;6–24h only. Identical delayed rolling geometry128/score256 per arm; fixed2018/2019 references retained. At24h MaxScore90%: Basefixed coverage87.4699%, Baseadaptive89.7189%, C1adaptive89.0763%. Exactly matched empirical coverage90.0402%: C1/Base geometricmeanV1.4011×;ΔlogV0.3373,pairedstormbootstrap95%[-0.0446,0.6669]. Mahalanobis24hVratio2.102×,CIΔlogV[0.3622,1.1444]. NoC1efficiencyadvantage; calibrationbenefit separated. v1 gate unchanged; v2 rawλ=1 preregistered, no new validation-tuned deployment gate. Validation2017 separately reported, no test tuning. Numerics48samples:otherqueryperturb0,maxsingle/batch0.0021439km (<0.1kmauditthreshold);v1stricterfailurepreserved. Website defaultsv2,coverage/efficiency beforesecondaryMAE; allprotocolsretained. Details:docs/ROLLING_REPAIR_V2_REPORT.md andartifacts/rolling_repair_v2/manifest.json.


## 2026-10-21 · Original-code typhoon replay / authorized window shortening

Completed48storm-kpairs across8independentlongstorms;test5storms/60commontargets. NativeoldTSBase/C0/C1/M0/PI+directcalls;no3positionfeatures, poolingorMAEgate. Onlyauthorizedwindows shortened24learn/12warmup/12eval,12geometry/scorehistory,4scorestartup;originalmodelcaps/seeds/estimators/refreshrulesunchanged. k32C1originalcoordinateRMSE−22.30%vsBase,−46.65%vsC0;PI+coverage98.33%→95.00%. Ellipse-preservingposthoc90%area ratio0.98884,CIΔlogsize[−.4426,.6286],nofirmextraefficiencyclaim. SecondarywidthmatchingintroducesinnerholesinovercoveragePI+andisretainedonlyasdiagnostic;notusedasprimaryorformap. k16point−21.88%butcoverage31.67%;smallkmixed. k16/k32Baseevaluationforecastsidenticaldueshortwindowalignment. Causalaudit48caches/2304C1features/144PIreplays/nativeBasefuturevaluetestpassed;sourcehashesunchanged. Originalreplaypageadded, historicalvariantsretained. Fullreport:docs/ORIGINAL_SHORT_REPLAY_REPORT.md.
