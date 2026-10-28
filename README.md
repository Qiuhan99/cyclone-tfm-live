# Current Two-Stage TabPFN research window · 28 October 2026

The existing website remains **https://qiuhan99.github.io/cyclone-tfm-live/**.
The new [Two-Stage window](https://qiuhan99.github.io/cyclone-tfm-live/two-stage.html)
implements the user's updated §0A protocol: real TabPFN #1, historical OOS
residual labels, real TabPFN #2, exact addition, separate lat/lon tasks.
It includes frozen IN-FA predictions, nine CHAMPI replay issues, all positive
and negative paired results, dense real turn queries, and the separate
F0/F1 four-arm experiment. See [the actual run report](site/assets/docs/TWO_STAGE_0A_REPORT.md).
Local QA uses `http://127.0.0.1:8772/two-stage.html`; this is not the public site.
Historical inputs are `retrospective_prefix`. Conformal is not calibrated for
this new protocol. Existing direct-vector experiments retain their original IDs.

The [v2 continuation panel](https://qiuhan99.github.io/cyclone-tfm-live/two-stage.html#ts-v2)
adds 320 newly inferred rolling OOS origins, nine CHAMPI replay cycles,
independent CMA observations, the verified IN-FA IBTrACS SID, and a 26-storm /
78-issue turning benchmark. It retains unsuccessful corrections and false
alarms. [The v2 report](site/assets/docs/TWO_STAGE_0A_V2_REPORT.md) distinguishes
these completed runs from the still-running full ETTh1/Electricity rerun.
Its computation counters are an export-time snapshot, not automatic monitoring.
The new event rules are independently fitted kinematic proxies and remain an
exploratory revision; they are not an expert confirmation of physical loops.

# Earlier research method (archived protocol)

The live model and default benchmark now use **direct TabPFN + Vector Residual Feedback** (`direct_vector_feedback_v1`): `v=f(X)`, `r=u-v`, `v_RF=v+g(X,H)`. The 68-field correction input contains current F2 features and mature vector residual history; no constant-velocity target offset or Base input augmentation is used. See [the algorithm contract](site/assets/docs/DIRECT_VECTOR_FEEDBACK.md). Earlier CV experiments keep their original IDs and numbers as archives.

# CYCLONE TFM Live 

The public entry is now an [authored, immersive research notebook](https://qiuhan99.github.io/cyclone-tfm-live/) with a staged map and keyboard presentation mode. Complete tables and controls remain at [Research results](https://qiuhan99.github.io/cyclone-tfm-live/results.html) and the existing benchmark / live URLs. See [presentation definitions](site/assets/docs/IMMERSIVE_RESEARCH_NOTEBOOK.md).

[Research briefing](https://qiuhan99.github.io/cyclone-tfm-live/research-briefing.html) · [Matched guidance maps](https://qiuhan99.github.io/cyclone-tfm-live/conformal-benchmark.html#guidance-benchmark) · [Live forecast desk](https://qiuhan99.github.io/cyclone-tfm-live/champi.html)

CHAMPI台风公开路径查看器，复用既有CYCLONE网站。展示官方中心/风级/预警、UCAR外部模式路径、真实TabPFN研究预测，以及24h圆/椭圆Conformal对照。

本仓库仅包含网站、公开数据更新器与部署代码。

## 三个独立部分

|部分|运行方式|电脑关机后的行为|
|---|---|---|
|公开网页|GitHub Pages或其他静态托管|已部署页面仍能访问|
|官方资料与外部路径更新|GitHub Actions计划每30分钟检查|云任务启用后继续检查，可能延迟|
|本项目TabPFN预测|独立私有推理环境|推理停止则预测不再更新；保留原时间并显示过期|

外部模式不会被重命名为TabPFN；更新官方中心不会刷新旧模型的起报时间。未来强度来自外部模式实际字段，TabPFN当前只预测位置。海岸交点是几何估计，不是官方登陆判断或登陆概率。Conformal结果是依赖时间序列上的经验校准，不宣称无条件覆盖保证。仅科研展示，不替代官方预警。

## 本机运行

在仓库根目录：

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e .
cyclone-live serve --site site --port 8766
# 浏览器打开 http://127.0.0.1:8766/
```

不要直接双击HTML；浏览器需要HTTP加载JSON和模块。关闭服务终端会停止本机链接，但不会停止已经部署的GitHub Pages。

## 公开部署到自己的GitHub

目标仓库：`Qiuhan99/cyclone-tfm-live`。这是配置目标，是否已经创建/上线以实际GitHub状态为准。

1. 将本目录内容提交至该公开仓库的`main`分支。
2. 仓库Settings → Pages → Build and deployment选择 **GitHub Actions**。
3. Actions中运行 **Refresh public data and deploy Pages**。首次运行需要允许`github-pages`环境部署；如果环境有保护规则，按仓库实际规则处理。
4. 成功后使用Actions部署返回的真实网址。通常项目站网址形如`https://Qiuhan99.github.io/cyclone-tfm-live/`；在成功前不要把它称为已上线地址。

工作流在push、手动启动和UTC每小时第7/37分钟运行。每次先恢复上次成功的数据状态，再检查公开源、验证发布包，最后部署。源失败会保留旧值及原时间，页面显示来源失败与过期；全部来源失败则不部署新版本。数据状态存放在独立`live-data`分支，只包含公开的operations JSON。

[GitHub Pages是静态托管](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)，不会运行Python或TabPFN。[计划任务可能延迟，公开仓库60天无活动也可能自动停用](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)。每30分钟是计划检查频率，不是官方资料生产频率，也不是严格实时SLA。

## 接入真实TabPFN更新

首版已带有真实历史缓存。公开仓库不包含私有模型和样本，不会仅靠`pip install`重新推理。

已有私有科研环境继续执行原`refresh_champi_operations.py --watch`，输出实际本地模型预测。用以下命令将完整operations JSON导入当前发布目录，保留每条模型原始起报和实际生成时间：

```bash
cyclone-live refresh --site site --tfm-payload /absolute/path/to/champi-operations.json
```

导入文件须来自可信的真实推理环境；入口校验来源摘要和issue/lead关系，不认证模型质量。部署生成的网站或将JSON提交到`live-data`分支的同名文件后，后续计划任务会保留这批TFM预测，直到收到更新。私有推理服务可以部署到常开服务器；该服务器和模型授权不属于此轻量仓库，不能把电脑停机时的旧预测写成新推理。

## 检查

```bash
python -m unittest discover -s tests -p 'test_*.py'
node --test tests/*.test.mjs
python tools/check_public.py
```

`PUBLIC_EXPORT.json`记录从既有网站复制的明确文件清单及原始摘要，发布副本仅脱敏机器路径和调整公网文案。历史研究数字未改写。公开版研究说明在`site/assets/docs/`；完整科研复现材料保留本地。

当前数据适配器明确限定`WP292026 / CHAMPI`，没有自动识别全球所有活跃台风。多风暴配置是后续扩展，不伪造当前支持范围。

## CHAMPI Mac实时推理与数据说明

当前发布链：Mac本地TabPFN-3.5/C0/C1 → 校验后的公开JSON → live-data → GitHub Actions → Pages。Mac登录后台任务每轮完成后等待15分钟；相同B-deck内容保留原模型生成时间。live-data除两个公开JSON外，仅包含与main一致的公开部署工作流，使SSH数据提交可以自动触发部署。权重、原始历史数组和私钥继续留在本机。

来源、52维F2输入、54/70维校正器、历史上下文和经验Conformal边界见[网站数据与推理页](https://qiuhan99.github.io/cyclone-tfm-live/champi-pipeline.html)及[详细说明](site/assets/docs/CHAMPI_REALTIME_DATA_PIPELINE_CN.md)。当前只适配CHAMPI；TabPFN只预测中心位置，官方强度和预警另有来源。

## 本研究算法实时窗口

[独立算法窗口](https://qiuhan99.github.io/cyclone-tfm-live/algorithm-live.html)展示Base/C0/C1、6/12/24h等时效的真实Conformal区域，并对照CMA/BABJ机构路径与外部数值模式。风级及预警报道保留于原CHAMPI页面。

新预测先封存至公开Git分支；后续在目标到达前确认后，才有资格用首见UCAR实况进行同storm/issue/lead/valid配对评分。旧回顾实验单列，n=0不伪造误差或覆盖率。完整规则见[前瞻检验协议](site/assets/docs/ALGORITHM_LIVE_VERIFICATION_CN.md)。

## Conformal与时序基础模型对照

[Conformal基准窗口](https://qiuhan99.github.io/cyclone-tfm-live/conformal-benchmark.html)将覆盖偏差、已发区域面积、同覆盖效率及过去运动变化分层作为主要评价，MAE作为辅助。新增Chronos-Bolt-small、Chronos-2、Moirai-small真实802起报推理；TimeGPT待API接入。模型版本、原始结果边界与[完整报告](site/assets/docs/TSFM_CONFORMAL_BENCHMARK_CN.md)一同保留。短上下文、协变量和训练预算差异不作隐藏。

公平性复核另提供共享6h匀速残差表示，网站默认CV对齐，可切换原直接ENU外推。两种目标表示的真实原始结果均保留；不把运动预处理收益全部归于网络架构。

C1流程与覆盖估计补充见[独立审计](site/assets/docs/C1_PIPELINE_AUDIT_CN.md)：当前固定上下文/滚动秩分支与原TS C1＋PI+分别评价，不以小队列样本覆盖比例代替长期校准结论。

## English operations terminal · 26 October 2026

Open [Live monitor](https://qiuhan99.github.io/cyclone-tfm-live/algorithm-live.html) for actual CHAMPI forecasts, official advisory state and prospective verification. The default verification lead is independent of the map lead and selects an already scoreable horizon. A 24-hour forecast remains pending until its target and source truth arrive.

- [Storm briefing](https://qiuhan99.github.io/cyclone-tfm-live/champi.html): last CMA analysis, warning cancellation, source clocks and coastal crossing diagnostics.
- [Model evaluation](https://qiuhan99.github.io/cyclone-tfm-live/conformal-benchmark.html): coverage, shortfall, excess, area and foundation-model comparisons.
- [Method & data](https://qiuhan99.github.io/cyclone-tfm-live/champi-pipeline.html): sources, features, actual CV/C0/C1 pipeline and deployment.
- [Research atlas](https://qiuhan99.github.io/cyclone-tfm-live/research-atlas.html) and [Archive](https://qiuhan99.github.io/cyclone-tfm-live/research.html): the complete prior studies; original Chinese materials are labelled.

CV means **constant velocity**, not cross-validation. Absolute **coverage** gap is measured in percentage points, not kilometres. The current C1 fit contexts and rolling-rank calibration differ from the original short-horizon TS + PI+ protocol. The site retains all original numerical results.

The supported live case is CHAMPI. Global active-storm discovery and position-to-intensity prediction are not implemented. Checks do not imply new source observations; source retrieval, model generation and target time remain separate clocks.

See [operations audit and reproduction](site/assets/docs/OPERATIONS_TERMINAL_V1.md).

## Vector residual-feedback presentation

The public method is **TabPFN + Vector Residual Feedback**. The correction-only variant remains an archived ablation. [Selected research results](https://qiuhan99.github.io/cyclone-tfm-live/results.html) present the previously declared four-storm illustrations; selection and the distinction between issued and coverage-matched regions are stated on the page. Live verification is separate and is not filtered to wins.

CV denotes a constant-velocity target representation and is kept in technical configuration records, not the proposed method's public name. Original model IDs remain unchanged. See [method naming and research roles](site/assets/docs/METHOD_NAMING.md).

Regenerate the compact, source-hashed display bundle with `python tools/build_feedback_showcase.py`. See [method and evidence scope](site/assets/docs/VECTOR_RESIDUAL_FEEDBACK.md). All original numerical archives and internal model IDs are preserved.

The site entry now opens the method showcase. Operational CHAMPI forecasting remains at [Live monitor](https://qiuhan99.github.io/cyclone-tfm-live/algorithm-live.html).

The live monitor now shows both original conformal regions, an endpoint detail, explicit per-method verification and matched-cycle feedback comparisons. Results and Live monitor expose the completed Chronos/Moirai common-cohort experiments. See [map and comparison definitions](site/assets/docs/CONFORMAL_MAP_AND_MODEL_COMPARISON.md).

The CHAMPI forecast desk adds real local Chronos/Moirai 72-hour paths, independent observation/computation clocks, paired correction evidence and time-resolved coastal analysis. See [live forecast desk protocol](site/assets/docs/LIVE_FORECAST_DESK_V1.md). Inference remains on the existing private Mac runner; public hosting receives validated forecasts only.

## Academic demonstration and matched track replay

The research briefing explains vector residual conditioning, conformal calibration, evidence scope and a guided demonstration route. The guidance benchmark now includes original matched-cycle paths for baseline, feedback, CMC, UKM and NGX; subsequent observed truth; an independent endpoint inset; and cycle-specific errors alongside the original aggregate table. Model layers, issue cycles, horizons and original marginal regions are selectable. This is a retrospective replay, separate from live verification.

Run `python3 tools/build_guidance_paths.py` to reproduce the compact map export from existing public archives. It reconstructs the original candidate intersection and all 65 aggregate errors before writing, and records source hashes. No private context, model weights or new inference is needed to build this display artifact.
