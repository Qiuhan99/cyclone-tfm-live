# 向量残差反馈：验证优先实验记录

## 保持不变的算法

v=f(X); r=u-v; v_RF=v+g(X,H). X52 + mature-vector/age/mask H16; no Base-output augmentation, CV offset, gates or correction scaling.

Base仍为同一个冻结TabPFN。当前输入/标签/残差向量及完整加回公式不变；新增实验只检查更密起报、成熟标签上下文滚动、同时效任务及模型容量。所有配置有独立命名空间。
新密集Base批推理相对旧同ID值存在最多约1.4米浮点差；原共同ID精确复用原Base以消除此混淆。该数值差不能解释十几公里误差差异。

## 验证与选择

Exploratory2017 validation; primary24h; original common148 endpoints/29storms. Dense-cohort gates use535 endpoints/29storms.
Capacity grid locked before outcomes. A candidate must beat unchanged Base on original-common and subsequently full-dense validation. No test-season selection.
历史年份此前已被检查，因此这是探索性验证，不能宣称全新盲测。容量网格只用2017共同起报评价；测试年份不参与候选选择。

|候选|共同端点|Base MAE km|反馈 MAE km|采用|
|---|---:|---:|---:|---|
|Dense6h · rolling320 · pooled leads|148|209.91585223|234.19351651|未采用|
|Dense6h · rolling320 · +24h only|148|209.91585223|227.09840311|未采用|
|context1024 · ensemble1|148|209.91585223|216.10533491|未采用|
|context320 · ensemble4|148|209.91585223|227.27109786|未采用|
|context1024 · ensemble4|148|209.91585223|215.10364391|未采用|

已逐一核验1400组上下文的成熟时刻、样本索引和X/Y/Q哈希，容量网格逐点重算球面MAE并与缓存结果一致。
未通过验证的候选不推进为2024/CHAMPI成绩，也不替换实时核心模型。原Conformal阈值和公开前瞻账本保持原记录；不能为了缩小区域而删异常点或后验缩放已发布区域。

## 复现命令

使用 `tabpfn_residual_realdata/.venv/bin/python`，在私有研究项目运行：

```sh
python scripts/run_direct_rolling.py --phase validation
python scripts/run_same_lead_feedback.py --phase validation
python scripts/validate_feedback_capacity.py --candidate context1024_ensemble1
python scripts/validate_feedback_capacity.py --candidate context320_ensemble4
python scripts/validate_feedback_capacity.py --candidate context1024_ensemble4
python scripts/export_feedback_validation.py
```

现有锁定输入、Base缓存和每起报预测支持断点复现，若源哈希不匹配会拒绝复用。所有原始数组、拟合缓存和失败尝试保留在本地。公开JSON仅含配置摘要、聚合评价和源哈希。
