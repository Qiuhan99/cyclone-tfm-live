# CHAMPI 阶段交付 · 2026-10-24

打开 http://127.0.0.1:8765/champi.html 。现有首页、案例页和历史页均可进入。启动：`python3 web/serve_local.py`，或双击 web/start.command；保留服务终端。仅本机运行。

|阶段|实际状态|
|---|---|
|M0|完成：原网站、旧实验、会话与代码审计|
|M1|真实A/B、IBTrACS交叉资料、来源、cycle/lead与模型控件已实现|
|M2/M3|本地真实TabPFN-3.5、F0/F1/F2与3项删特征消融已运行|
|M4|沿轨/横轨、固定收缩、成熟标签purged-v2 gate已计算；v1含时间前视并保留，未通过采用验证|
|M5/F3|环带/时间审计原型及单个真实GFS ROI归档；完整队列/可得性未核实，无F3预测或指标|
|M6|逐lead/联合split位置区域已计算；新分支SPCI/PID适配尚未运行|
|M7|阶段报告与复现材料已生成，完整主计划仍有待办|

关键结果（2024探索性测试，24h）：F0 228.21、F1 221.73、F2 217.66km；F2+C1 227.33km，校正未带来额外点误差改善。CHAMPI 72h：F0 316.79、F2 262.08km，单场描述性结果，n=19。不把它写成普遍预测优势。

外部公平交集（CHAMPI 72h，n=8）：CMC 83.61、UKM 62.85、NGX 108.98、F2 251.70、F2+C1 228.74km。F2较F0的历史2024 72h配对整风暴bootstrap差值95%区间[-92.8,-8.6]km；历史年份已有研究暴露，只作探索性。Gate验证未优于不校正，未通过采用检查。名义90%五lead联合区域中，F2实际覆盖81.90%。

原始实验保护：10739个既有产物哈希全部一致。源A/B-deck、原始推理数组、完整CSV/Parquet与所有消融负结果保留。研究数据与会话提取未上传。平台训练策略无法由本地代码更改或保证。

复现（项目根目录）：
```bash
../tabpfn_residual_realdata/.venv/bin/python scripts/download_champi.py --snapshot data/raw/ucar/20261024T043713Z
../tabpfn_residual_realdata/.venv/bin/python scripts/run_champi_features.py
../tabpfn_residual_realdata/.venv/bin/python scripts/run_champi_gate_v2.py
../tabpfn_residual_realdata/.venv/bin/python scripts/audit_champi_inference.py
../tabpfn_residual_realdata/.venv/bin/python scripts/report_champi.py
../tabpfn_residual_realdata/.venv/bin/python scripts/export_champi.py
../tabpfn_residual_realdata/.venv/bin/python -m pytest tests -q
node --test web/tests/*.test.mjs
python3 web/serve_local.py
```

下一步及验收：1) F3先取得匹配训练/验证/测试起报的真实GRIB ROI，记录init/valid/available/层次/单位；无可得时间不得当实时输入。2) 补齐IFS/AIFS BUFR与Google合法原文并核实风暴身份，不用UCAR aid替代。3) 在新缓存上运行SPCI/MultiDimSPCI与相同校正器比较，保存实际覆盖和同覆盖面积及整风暴区间。4) 使用新年份/未查看风暴验证门控与特征选择，完整保留负收益比例。

代码变更：src/data/champi.py；src/features/{champi,steering}.py；src/residuals/regime_gate.py；scripts/{download_champi,download_champi_steering,run_champi_features,run_champi_gate,run_champi_gate_v2,audit_champi_inference,audit_champi_site,report_champi,export_champi,package_champi_delivery}.py；config/feature_sets.yaml；web/dist/champi{.html,.css,.mjs,-engine.mjs}；导航入口；tests/test_champi*.py 与 web/tests/champi.test.mjs。

逐条交付索引、实际F2预测5行样例与具体后续验收条件：reports/07_DELIVERY_EVIDENCE.md。完成报告/导出后运行scripts/package_champi_delivery.py生成带软件版本及文件摘要的reports/DELIVERY_MANIFEST.json；再运行python3 web/tools/sync_assets.py更新本地网站资料清单。

验证证据：artifacts/champi_feature_v1/verified/{audit,inference_audit}.json；reports/TEST_RESULTS.txt、python_tests.txt、website_tests.txt、inference_audit.log。已通过原生Chrome在会话中截图检查真实底图与多模型路径；本地未生成截图PNG文件，不声称有该文件。界面交互与限制详见 reports/WEBSITE_VALIDATION.md。