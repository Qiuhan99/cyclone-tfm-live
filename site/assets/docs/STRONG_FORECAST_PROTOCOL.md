# 强气象预测器上的残差校正与区域效率

日期：2026-10-22。状态：已接入真实 ECMWF 样本；SPCI/MultiDimSPCI 校准适配器已实现并测试。完整对照实验尚未执行。

## 研究问题

在已有气象预测器上，以同一套起报可得信息学习条件残差，是否仍能获得覆盖—效率增量？路径误差是否全球最低不作为唯一成功条件。

主比较为“强气象预测→TabPFN条件残差校正→相同Conformal区域”。当前网页精选案例来自此前滚动v2，不是本项新实验结果。

## 数据与时点

首个来源是NCAR GDEX d330003保存的ECMWF IFS历史台风路径，DOI:10.5065/D6GH9GSZ。直接读取CXML中的确定性预报；ENS control另列，不混成一个模型。以后可接入具备版本、训练截止和可用时间记录的AIFS/WeatherNext预报。全局模型不在本机重训。

已经入库2023-05-25 00UTC的一份公开档案。解析后西北太平洋162条确定性/控制成员目标，76条匹配到本机IBTrACS。相同重复记录去重，冲突重复拒收；按名称及起报时位置匹配，不按未来误差匹配。

该文件名义起报00UTC，CXML生成时间19:58:49UTC。生成时间可能是交换档案的生成时间，不能直接认定为业务产品首次可用时间。当前保留两个字段，`availability_verified=False`。正式实时信息集实验必须核实可用时间；单独的名义时刻hindcast对照可以另立协议，不能暗中替代实时发报结论。

历史真值以最佳路径版本固定，起报观测版本与最终最佳路径的差异另作限制记录。取原始采样点，不插值补齐预测或标签。

## 共同评价任务

先分别评价24/48/72h的二维经纬位置，所有臂使用相同模型、风暴、起报点、目标时刻。误差采用预测端点的球面Log映射（东/北km）；面积为明确的切平面区域面积，附球面距离误差。整条2H维轨迹的联合区域属于后续独立任务，不用逐时覆盖冒充整轨迹覆盖。

预测与校正均在同一发报时间锁定。原始预报后的真实观测，只能更新后一次预报，不能用于修改已经发出的24h路径。

拟定时间角色：2016–2020拟合、2021验证、2022几何、2023校准、2024–2025评价；完整风暴划分，跨年标签必须在角色边界之前完成。此前年份已有研究暴露，新强预测器结果仍标探索性；后续以新的时间段确认。完整数据清单和所有参数应在计算新测试指标前锁定。

每个预测器、每个时效分别资格检查：至少128个拟合训练对、100个校准分数、20个评价风暴；必须有完整预报可用时间记录。未达标就记录不足，不再通过缩短窗口触发实验。

## 预测臂与消融

- Base：气象模型原路径。
- C0：完整X与当前基础预报，不含历史残差的第二层TabPFN。
- C1：C0输入加同风暴同h的4个已验证残差、年龄和可用标记。
- Ridge：与C1同信息集的线性校正。

X保留档案中当前预报的路径、风速、气压、时效，以及起报时已观测的位置/运动量；高维大气场未下载，不能声称已使用。缺失状态明确编码。训练行使用当时可得的X，残差的目标标签必须在当前起报前到达。上下文320、32条新完成标签刷新作为首个候选，估计规则、收缩候选及验证判据在数据资格通过后锁定；只允许验证集选择，不在测试上改参数。

## 校准方法与可比性

每个预测臂均使用同一校准方法，分别比较：

1. 固定/滚动经验分位数参考。
2. Conformal-PID/PI参考。
3. SPCI：以有符号残差滞后预测条件分位数，在beta网格选择最短区间。
4. MultiDimSPCI：联合残差的Mahalanobis分数，以分数历史预测径向分位数。

SPCI原方法是单变量区间。二维主对照使用每坐标alpha/2的Bonferroni矩形，按二维同时命中评价；不把两个90%边际区间误称90%联合覆盖。矩形与椭球按实际同覆盖面积比较，不能只比半径。MultiDimSPCI保留作者分数上下界构成的环形区域，面积按两个椭球体积之差计算，内洞不填实。

本机已有作者源代码。本轮实现的是固定外部基础预报的校准适配器：不重新运行作者bootstrap/LOO基础层；QRF后端使用已有quantile-forest替代sklearn_quantile。树数10、深度2、beta网格5、滞后4；权重/分位数插值与作者后端不保证逐值一致。正式表明确命名“SPCI适配”“MultiDimSPCI适配”，不冒充原仓库端到端精确复现。多维几何只使用已完成历史；有条件时补充固定几何版本以隔离几何更新的贡献。

## 评价与展示

同时报告实际联合覆盖、滚动欠覆盖、平均log面积、同覆盖面积比、球面终点误差和耗时。所有方法用共同起报点，整风暴配对重采样。验证集匹配的阈值用于外推检验；测试期后验等经验覆盖只作诊断，不用于发报地图。

展示案例可以按已观察到的改善精选，保留筛选规则及全部候选列表。精选结果不替代完整队列结果，展示筛选不参与模型/窗口/阈值选择。

## 当前文件与复现

- `src/strong_forecast/archive.py`：CXML导入、匹配、标签释放及资格检查。
- `src/strong_forecast/calibration.py`：SPCI与MultiDimSPCI校准适配器。
- `scripts/prepare_strong_forecast.py`：真实档案入库与状态输出。
- `artifacts/strong_forecast_v1/data_status.json`：来源哈希、匹配数与未通过资格项。
- `data/external/ecmwf_tc/ifs_2023052500.xml`：原始公开数据。

```bash
../.venv/bin/python scripts/prepare_strong_forecast.py \
  --input data/external/ecmwf_tc/ifs_2023052500.xml \
  --source-url https://osdf-director.osg-htc.org/ncar/gdex/d330003/ecmf/2023/20230525/z_tigge_c_ecmf_20230525000000_ifs_glob_prod_all_glo.xml
../tabpfn_residual_realdata/.venv/bin/python -m pytest tests/test_strong_forecast.py -q
```

当前样本不足以通过资格检查，没有执行强预测器校正拟合，没有SPCI/MultiDimSPCI气象结果，也没有新的成功结论。下一批输入应补齐完整历史队列及可用时点元数据。

## 参考

- SPCI: https://proceedings.mlr.press/v202/xu23r.html
- MultiDimSPCI: https://arxiv.org/abs/2403.03850
- 作者实现: https://github.com/hamrel-cxu/SPCI-code 与 https://github.com/hamrel-cxu/MultiDimSPCI
- ECMWF路径档案: https://gdex.ucar.edu/datasets/d330003/
- WeatherNext模型版本/训练截止: https://github.com/google-deepmind/weathernext
