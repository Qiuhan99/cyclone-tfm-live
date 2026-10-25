> 公开展示版：本文件是历史研究说明，文中本机路径已脱敏；完整科研复现材料不包含在此仓库。

# 同上下文运动表示、固定起报残差与联合Conformal · v1

本轮全部本地真实推理，无梯度微调、外部模式特征或GRIB。所有候选与负结果保留。研究年份和CHAMPI均已有暴露，结果为探索性，不能视作盲测或业务预报验证。

## 锁定设计与机制

复用旧F0/F1/F2完全相同的1020条截至2015年上下文、4010条起报×时距查询、原特征数组、同一TabPFN-3.5 checkpoint及1 estimator/seed42。只改变目标表示：令d=Log_p(Y)，v为最近两次中心大圆恒速外推的Log_p位移，模型预测d−v，输出Exp_p(v+f(X))。这不是权威气象预报作Base；CV偏差目标与后续二层C0/C1分别消融。

2017点误差均值选定 TabPFN CV-F2，没有按CHAMPI选择。C0输入原X及基础预测；C1另加4个同场同lead已成熟残差、age/mask。冻结2016校正上下文，最大320条，所有标签在首个验证起报前成熟；lambda=1，不按点MAE门控。

二层目标为同一issue锚点中的Log_p(Y)−b。历史残差从旧锚点p沿最短大圆平行移动至新锚点q：V′=V−(V·q)/(1+p·q)(p+q)。由V·p=0可得V′·q=0，且展开平方得||V′||²=||V||²；反向移动还原V。近对跖点拒绝计算。最终仍在当前issue切平面加校正再Exp，避免旧实现直接混用不同锚点ENU的近似。

2019独立校准。每lead尺度由2016基础样本外误差均值确定。一个校准单位为一次起报的五lead最大标准化误差；只有起报+72h全部标签成熟才能更新联合分数。比较冻结2019秩阈值与预热后最近100个分数的因果滚动秩。边际区域另按各lead成熟更新。80/90/95%全部保留。时序依赖与分布漂移下不宣称交换性有限样本覆盖保证。

## CHAMPI点预测：同队列，全部配置

|model_id|n|mean_error_km|delta_vs_F0_ci95_km|
|---|---|---|---|
|Constant velocity|19|510.7968|None|
|Persistence|19|1465.1875|None|
|TabPFN CV-F0|19|350.1306|None|
|TabPFN CV-F1|19|331.7280|None|
|TabPFN CV-F2|19|295.3160|None|
|TabPFN CV-F2 + C0|19|270.1267|None|
|TabPFN CV-F2 + C1|19|261.6837|None|
|TabPFN F0|19|316.7876|None|
|TabPFN F1|19|316.8827|None|
|TabPFN F2|19|262.0788|None|

运动偏差表示本身没有优于旧F2；C1的72h误差约261.7km，与旧F2约262.1km接近。原纯时间TS约1138.8km使用不同上下文，不把其巨大差值都归于特征工程。不要把“修好流程”写成“超过气象模型”。

## 相同起报/有效时刻的外部共同交集

|model_id|n|mean_error_km|
|---|---|---|
|ATCF:CMC|8|83.6110|
|ATCF:UKM|8|62.8477|
|ATCF:NGX|8|108.9802|
|TabPFN CV-F0|8|337.3564|
|TabPFN CV-F1|8|299.0697|
|TabPFN CV-F2|8|282.1507|
|TabPFN CV-F2 + C0|8|258.3232|
|TabPFN CV-F2 + C1|8|245.5942|
|TabPFN F0|8|308.2386|
|TabPFN F1|8|296.6498|
|TabPFN F2|8|251.7041|
|TabPFN F2 + C1|8|228.7374|
|TabPFN-TS official|8|1340.7587|

研究比较严格使用此前锁定的39中心资料与共同交集；实时区另使用新下载40中心资料，不能混算。外部aid使用更多信息，保留原名。

## 固定起报五时距联合覆盖 · 名义90%

|model_id|phase|calibrator|n|storms|coverage|
|---|---|---|---|---|---|
|TabPFN CV-F0|champi|Causal rolling rank|19|1|1.0000|
|TabPFN CV-F0|champi|Frozen 2019|19|1|1.0000|
|TabPFN CV-F0|test|Causal rolling rank|116|28|0.7931|
|TabPFN CV-F0|test|Frozen 2019|116|28|0.7845|
|TabPFN CV-F1|champi|Causal rolling rank|19|1|1.0000|
|TabPFN CV-F1|champi|Frozen 2019|19|1|1.0000|
|TabPFN CV-F1|test|Causal rolling rank|116|28|0.8362|
|TabPFN CV-F1|test|Frozen 2019|116|28|0.8362|
|TabPFN CV-F2|champi|Causal rolling rank|19|1|1.0000|
|TabPFN CV-F2|champi|Frozen 2019|19|1|1.0000|
|TabPFN CV-F2|test|Causal rolling rank|116|28|0.8190|
|TabPFN CV-F2|test|Frozen 2019|116|28|0.8017|
|TabPFN CV-F2 + C0|champi|Causal rolling rank|19|1|1.0000|
|TabPFN CV-F2 + C0|champi|Frozen 2019|19|1|1.0000|
|TabPFN CV-F2 + C0|test|Causal rolling rank|116|28|0.8276|
|TabPFN CV-F2 + C0|test|Frozen 2019|116|28|0.8362|
|TabPFN CV-F2 + C1|champi|Causal rolling rank|19|1|1.0000|
|TabPFN CV-F2 + C1|champi|Frozen 2019|19|1|1.0000|
|TabPFN CV-F2 + C1|test|Causal rolling rank|116|28|0.8966|
|TabPFN CV-F2 + C1|test|Frozen 2019|116|28|0.8534|

CHAMPI19条完整路径全部覆盖，不表示效率最优。历史测试C1滚动联合覆盖104/116=89.66%，较同配置无二层校正改善；校准方法和预测中心的贡献均须分别看表。评价窗口重叠，不能将116条当作116场独立台风。

## 覆盖—面积与残差通道增量

|phase|base|candidate|n|storms|base_issued_coverage|candidate_issued_coverage|issued_area_ratio|matched_area_ratio|ratio_ci95|base_72h_radius_mean|candidate_72h_radius_mean|
|---|---|---|---|---|---|---|---|---|---|---|---|
|test|TabPFN CV-F2|TabPFN CV-F2 + C1|116|24|0.8190|0.8966|1.4091|1.3261|[0.749810566613982, 1.8099996046717874]|1660.2061|1831.7099|
|test|TabPFN CV-F2 + C0|TabPFN CV-F2 + C1|116|24|0.8276|0.8966|1.3101|1.4316|[0.8336903085587831, 1.7008225033706381]|1759.6929|1831.7099|
|champi|TabPFN CV-F2|TabPFN CV-F2 + C1|19|1|1.0000|1.0000|1.4228|1.1799|None|1651.8829|1831.6120|
|champi|TabPFN CV-F2 + C0|TabPFN CV-F2 + C1|19|1|1.0000|1.0000|1.3171|0.9594|None|1754.8671|1831.6120|

面积指标是每次联合区域中5个球面位置圆面积的几何平均，并非二维联合集合面积或10维体积。球面圆面积=4πR²sin²(r/(2R))。后验将两配置各自半径统一乘尺度，使五lead事件达到相同ceil(.9n)/n实际覆盖；只供诊断，不改写已发阈值或地图。500次整风暴配对bootstrap，每次重做匹配；CHAMPI单场不报伪区间。相同覆盖下的面积与原始已发布覆盖同时报告。

主要历史测试C1/Base在同覆盖下的面积比为1.326，95%区间[0.749810566613982, 1.8099996046717874]；点估计反而扩大约32.6%。已发布72h平均半径约1832km。覆盖接近90%以更大区域为代价，尚未实现残差反馈的效率目标，不能宣布CHAMPI科研成功。

## 实时网站执行范围

新增原网页顶部实时区；UCAR最新6h中心支持最新本地TabPFN、C0、C1真实推理。资料截止、下载、实际生成、有效时刻分别记录；+h以资料网格为起点，绝不回填成过去已经发布的预报。过去起报的重建只用于当前成熟残差，不称业务历史发布。当前模型未训练强度头，未来风速仅展示外部aid实际字段及其未核实的平均时段。

NMC公开快讯提供中心、强度、风级和当前官方四象限风圈；预警页提供国家级预警、风雨分区事实和官方路径展望。转载为简短事实摘要并链接原报。中心风级、地方预警、香港风球不互相推导。来源失败显示原时间，阈值过期及更新器心跳过期明确提示。

登陆分析逐模型沿预测点间的大圆插值，以3km分辨率寻找Natural Earth1:50m海→陆交点；地区名为大致经纬范围标签。不是概率、确定登陆或风雨足迹；官方展望与研究路径不一致时分别显示。没有交点也不排除沿海大风雨。实时叠图允许各aid原始最新周期不同，严格同起报统计只在研究表出现。

更新器每15分钟检查公开资料，页面每分钟读取本地缓存。更新器和电脑需保持运行；没有设置云部署或系统自启动。首次下载/解析/推理失败保留错误和旧缓存，绝不造路径补空。

## 复现

```bash
../tabpfn_residual_realdata/.venv/bin/python scripts/run_motion_residual.py
../tabpfn_residual_realdata/.venv/bin/python scripts/report_motion_residual.py
../tabpfn_residual_realdata/.venv/bin/python scripts/refresh_champi_operations.py --watch
../tabpfn_residual_realdata/.venv/bin/python scripts/export_champi.py
../tabpfn_residual_realdata/.venv/bin/python -m pytest tests -q
node --test web/tests/*.test.mjs
python3 web/serve_local.py --port 8765
```

配置、输入、checkpoint和关键源码哈希见artifacts/motion_residual_v1/locked_config.json；原产物保护见protected_artifacts.json；逐起报成熟校准证据见calibration_trace.json。测试、视觉与网络核验记录及交付清单在本报告目录。F3及Regime-Gated方法本轮没有推进；当前实验尚未证实与权威路径模式相当或更好。

原始v1预测表的raw_file_sha256字段统一保存CHAMPI processed Parquet摘要。该原表原样保留，verified/predictions.parquet保存original_recorded_source_digest，按phase分别补入CHAMPI或历史IBTrACS的真实raw/processed摘要；IBTrACS源文件摘要已重新核对。所有数值列不变，provenance.json给出映射与哈希。网站使用规范化版本。