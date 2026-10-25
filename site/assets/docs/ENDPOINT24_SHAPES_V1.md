# 固定24小时终点：Base/C0/C1 × 圆/椭圆 v1

本轮只改变Conformal几何及相同的因果校准链，不重新训练或挑选预测中心。复用2017验证选定的TabPFN CV-F2、C0、C1真实缓存；完整保留此前所有实验、72h和圆形结果。已有年份与CHAMPI均已暴露，本轮是探索性迁移，不是独立盲测。

## 结果解读

历史27场169个成熟终点，椭圆内C1/Base同覆盖面积比0.874，95%区间[0.7769669643165713, 1.3441864393257952]；C1/C0为1.016，区间[0.7640585974828186, 1.2464338764943896]。Base→C1点估计缩小约12.6%，但隔离历史残差通道后没有增益，且区间均跨1。不能把全部二层收益归因于残差历史。

CHAMPI27个成熟终点，C1/C0椭圆同覆盖面积比0.786（缩小约21.4%），但C1椭圆/C1圆为1.060（扩大约6.0%）。同一C1中心的椭圆并未更紧；六格原始90%规则均覆盖27/27，这种过覆盖本身也不是效率成功。单场不报告伪独立区间。

形状单独比较：历史C0椭圆/圆为0.901，C1为0.970，Base为1.038；其区间均跨1。该结果没有否定旧椭圆正信号，说明它尚未稳定迁移到新预测和队列。可能机制包括跨风暴方向混合、转向漂移、旧几何下预序列分数与当前几何尺度的差异，以及剩余系统偏差；当前对照尚不能判定哪一项是主因。后续需在冻结的新验证协议中分别测试运动方向坐标、局部几何与原PI+动态校准，禁止在本CHAMPI队列上反复挑选窗口后仍称独立验证。

## 预先锁定的协议

终点固定为起报+24h，不要求72h真值。2017验证已成熟残差提供初始几何；2019按全体风暴时间顺序预热。每场2024测试风暴及CHAMPI独立复制完整成熟2019状态，之后仅加入本场起报+24h已成熟的标签。几何最近128条，秩分数最近256条，shrink=0.1；没有根据新结果选择窗口、收缩量或方法。C0/C1的2016拟合标签不作为本轮几何种子，避免拟合内残差。

圆与椭圆使用相同预测中心、评价起报、历史标签ID、窗口和标签成熟边界。与旧圆形last100协议的差异包含校准窗口，旧表只能作为背景；本轮六格内部才是形状对照。新规则为原filled rolling-ellipse秩校准思想的球面坐标适配，不是原PI+或MultiDimSPCI分位数森林算法的逐数值复刻。

## 公式与面积

令当前预测中心为μ，真值为Y，u=Log_μ(Y)，单位km。历史残差先从其预测中心沿最短大圆平行移动到当前μ的ENU坐标；在这些向量上估计中心化样本协方差S。Σ=0.9S+0.1 tr(S)I/2，特征值下限10⁻⁶ km²。协方差中心化只用于方向尺度估计，区域仍以模型预测中心为中心，不额外减均值或移动中心。

圆的分数为‖u‖，Σ_circle=I；椭圆分数为√(uᵀΣ⁻¹u)。每条历史分数都在它自己起报时冻结的几何中计算，标签成熟后才进入秩池。q取ceil((n+1)(1−α))阶次；不足则为无界，不伪造有限区域。80/90/95%全保留。时序依赖、漂移和几何自适应下，不宣称交换性有限样本覆盖保证。

区域是Exp_μ{u:uᵀΣ⁻¹u≤q²}。设L Lᵀ=Σ，vθ=(cosθ,sinθ)，rθ=q‖Lvθ‖。球面Exp面积元为sinc(‖u‖/R)du。令u=qtLvθ，则du=q²√detΣ·t dt dθ，径向积分∫₀¹t sinc(trθ/R)dt=(1−cos(rθ/R))/(rθ/R)²。因此球面面积A=q²√detΣ∫₀²π(1−cos(rθ/R))/(rθ/R)²dθ；用256角节点周期求积，零点采用稳定sinc表达。圆退化为4πR²sin²(q/(2R))。超出πR割迹的区域拒绝，不以平面πq²√detΣ冒充球面面积。

## 原始已发布规则的实际覆盖与面积

|phase|model_id|shape|n|storms|covered|coverage|geomean_area_km2|mean_error_km|future_unscored|
|---|---|---|---|---|---|---|---|---|---|
|champi|TabPFN CV-F2|circle|27|1|27|1.0000|463051.5801|119.9822|4|
|champi|TabPFN CV-F2|ellipse|27|1|27|1.0000|566902.3216|119.9822|4|
|champi|TabPFN CV-F2 + C0|circle|27|1|27|1.0000|465377.3594|114.2444|4|
|champi|TabPFN CV-F2 + C0|ellipse|27|1|27|1.0000|610789.7158|114.2444|4|
|champi|TabPFN CV-F2 + C1|circle|27|1|27|1.0000|489341.0033|118.9167|4|
|champi|TabPFN CV-F2 + C1|ellipse|27|1|27|1.0000|580436.1030|118.9167|4|
|test|TabPFN CV-F2|circle|169|27|150|0.8876|470088.7052|219.8628|27|
|test|TabPFN CV-F2|ellipse|169|27|154|0.9112|596289.5329|219.8628|27|
|test|TabPFN CV-F2 + C0|circle|169|27|150|0.8876|477190.6866|222.9248|27|
|test|TabPFN CV-F2 + C0|ellipse|169|27|158|0.9349|647656.5548|222.9248|27|
|test|TabPFN CV-F2 + C1|circle|169|27|151|0.8935|503849.2915|224.1751|27|
|test|TabPFN CV-F2 + C1|ellipse|169|27|160|0.9467|615621.3728|224.1751|27|

“已发布规则”指回放中起报时冻结的阈值，不表示这些修订资料上的历史路径曾在当时业务发布。实际公开资料时延未知；标签成熟以valid time假定，不能当作前瞻业务验证。未成熟24h终点照样输出区域，但不参与覆盖/效率评价。

## 相同实际覆盖下的面积比较

|phase|kind|base|candidate|n|storms|matched_area_ratio|ratio_ci95|base_attained|candidate_attained|
|---|---|---|---|---|---|---|---|---|---|
|test|shape|TabPFN CV-F2 / circle|TabPFN CV-F2 / ellipse|169|27|1.0381|[0.8108625708488069, 1.2338794707682477]|0.9053|0.9053|
|test|shape|TabPFN CV-F2 + C0 / circle|TabPFN CV-F2 + C0 / ellipse|169|27|0.9015|[0.8180602052691693, 1.1384671266202697]|0.9053|0.9053|
|test|shape|TabPFN CV-F2 + C1 / circle|TabPFN CV-F2 + C1 / ellipse|169|27|0.9703|[0.7926552512114611, 1.1682885111705403]|0.9053|0.9053|
|test|residual|TabPFN CV-F2 / circle|TabPFN CV-F2 + C0 / circle|169|27|0.9915|[0.8519808605912179, 1.2512496895578475]|0.9053|0.9053|
|test|residual|TabPFN CV-F2 / circle|TabPFN CV-F2 + C1 / circle|169|27|0.9355|[0.8265502033377107, 1.2763234931173328]|0.9053|0.9053|
|test|residual|TabPFN CV-F2 + C0 / circle|TabPFN CV-F2 + C1 / circle|169|27|0.9435|[0.846464523117304, 1.2435757763964153]|0.9053|0.9053|
|test|residual|TabPFN CV-F2 / ellipse|TabPFN CV-F2 + C0 / ellipse|169|27|0.8610|[0.7421927081053863, 1.244729797516515]|0.9053|0.9053|
|test|residual|TabPFN CV-F2 / ellipse|TabPFN CV-F2 + C1 / ellipse|169|27|0.8744|[0.7769669643165713, 1.3441864393257952]|0.9053|0.9053|
|test|residual|TabPFN CV-F2 + C0 / ellipse|TabPFN CV-F2 + C1 / ellipse|169|27|1.0156|[0.7640585974828186, 1.2464338764943896]|0.9053|0.9053|
|champi|shape|TabPFN CV-F2 / circle|TabPFN CV-F2 / ellipse|27|1|1.1108|None|0.9259|0.9259|
|champi|shape|TabPFN CV-F2 + C0 / circle|TabPFN CV-F2 + C0 / ellipse|27|1|1.2644|None|0.9259|0.9259|
|champi|shape|TabPFN CV-F2 + C1 / circle|TabPFN CV-F2 + C1 / ellipse|27|1|1.0599|None|0.9259|0.9259|
|champi|residual|TabPFN CV-F2 / circle|TabPFN CV-F2 + C0 / circle|27|1|1.0658|None|0.9259|0.9259|
|champi|residual|TabPFN CV-F2 / circle|TabPFN CV-F2 + C1 / circle|27|1|0.9995|None|0.9259|0.9259|
|champi|residual|TabPFN CV-F2 + C0 / circle|TabPFN CV-F2 + C1 / circle|27|1|0.9378|None|0.9259|0.9259|
|champi|residual|TabPFN CV-F2 / ellipse|TabPFN CV-F2 + C0 / ellipse|27|1|1.2131|None|0.9259|0.9259|
|champi|residual|TabPFN CV-F2 / ellipse|TabPFN CV-F2 + C1 / ellipse|27|1|0.9537|None|0.9259|0.9259|
|champi|residual|TabPFN CV-F2 + C0 / ellipse|TabPFN CV-F2 + C1 / ellipse|27|1|0.7862|None|0.9259|0.9259|

每格分别乘一个后验全局尺度，使相同评价起报达到ceil(0.9n)/n实测覆盖；比较每起报球面面积的几何平均。此匹配只用于效率诊断，不改写已发阈值，也不在地图展示oracle区域。区间为500次整风暴配对bootstrap、seed42，每次重算匹配尺度；条件于已冻结模型和校准历史，不包含重新训练或重新抽取2019校准集的不确定性。CHAMPI单场不报伪独立区间。多个对照为探索性，未作多重性校正。

形状比较保持Base/C0/C1中心不变。残差比较在同一种形状内进行；C1/C0才隔离历史残差反馈通道，而C1/Base包含两层变化。区域紧致不自动意味着点预测更准，单场正结果也不能证明总体稳定增益。

## 与原研究及网站的边界

原24h已选4场案例C1/Base椭圆面积比0.868，原TS/PI+下一6h小队列0.794仍保留。这些使用不同预测、队列、时距或校准器，不能与新矩阵拼接成一个效果量。当前实时路径、官方风级风圈、预警与登陆分析继续使用独立更新器；本轮新椭圆展示为锁定39中心快照上的真实缓存研究回放，不冒充最新起报或官方风圈。新实验未改变TabPFN点预测，因此不能据区域改善宣称追平权威模式的点误差。

## 复现

```bash
../tabpfn_residual_realdata/.venv/bin/python scripts/run_endpoint24_shapes.py
../tabpfn_residual_realdata/.venv/bin/python scripts/report_endpoint24_shapes.py
../tabpfn_residual_realdata/.venv/bin/python -m pytest tests -q
node --test web/tests/*.test.mjs
python3 web/tools/sync_assets.py
```

locked_config.json在读取结果前写入，记录数据、预测及核心源码哈希。regions.json保存所有起报、水平、协方差、阈值、覆盖及面积；causality_trace.json保存每条几何和分数的历史ID/最大成熟时刻。protected_artifacts.json保护所有既有静态科研产物；实时更新缓存不纳入静态保护。完整实验结果均未删改。