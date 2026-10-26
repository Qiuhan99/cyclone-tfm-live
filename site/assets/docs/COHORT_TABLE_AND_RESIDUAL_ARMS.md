# Cohort table and residual-correction configurations

Audit date: 26 October 2026. Original forecast outputs and region thresholds are retained.

## What the screenshot actually measures

This is the archived `rolling_repair_v2` experiment: 114 eligible western North Pacific storms from 2020–2024 and 1,245 paired forecast origins. Its Base uses the original ten position/time features (X10), built from three successive six-hour fixes. It is distinct from the current live CV-F2 branch and from the original short-horizon TS + PI+ protocol.

At the default 24-hour selection, endpoint MAE is the arithmetic mean of the 1,245 great-circle position errors at +24h. The coverage column is the empirical **joint event** that all four +6/+12/+18/+24h positions lie inside their issue-frozen MaxScore region projections. It is not single-24h endpoint coverage and does not count 1,245 independent storms.

| Configuration | Research role | 24h endpoint MAE km | Change vs Base km | Joint coverage | Covered / origins |
|---|---|---:|---:|---:|---:|
| TabPFN Base | Baseline | 184.6007 | 0 | 89.7189% | 1117 / 1245 |
| C0 | Correction-only ablation control | 197.0225 | +12.4218 | 89.7992% | 1118 / 1245 |
| C1 | Residual-feedback variant | 198.4448 | +13.8440 | 89.0763% | 1109 / 1245 |

The displayed values reproduce the saved per-origin errors and score/threshold comparisons. At this lead, C1 has approximately 7.50% higher point error than Base and 1.4223 km higher mean error than C0. This configuration does not show an overall point-forecast improvement. The original exploratory whole-storm bootstrap interval for C1 point-error improvement versus Base is [-9.9626%, -5.0002%]; negative values denote deterioration under this protocol. No new model fit or hypothesis-selected result is substituted.

Coverage alone does not measure region efficiency. This experiment's full four-lead uncertainty set is eight-dimensional. Its volume diagnostics must not be called two-dimensional area or confused with the separate endpoint-ellipse study. All seasons have previously been inspected; inference remains exploratory.

## C0 and C1 are variants of one pipeline

Let X be the issue-time features, b the Base prediction and R the latest mature Base forecast residuals from the same storm and lead. Schematically, in the appropriate tangent coordinate system:

- Base: b.
- C0: Base plus g0(X, b).
- C1: Base plus g1(X, b, R).

Both g0 and g1 predict a **truth-minus-Base residual** with TabPFN. Both use residual-labelled historical contexts. C0's lack of explicit residual-history input does not mean that C0 was trained without residual targets, does not adapt, or lacks all historical information.

In the screenshot's archived experiment, C0 has 12 features and C1 has 28. The extra 16 fields encode four residuals: east/north components, maturity age and availability for each. Both use the latest 320 completed context rows, refreshing after 32 newly completed labels; foundation weights remain frozen. The archived feature-coordinate convention is retained as originally run.

The live CV-F2 branch instead has 52 Base, 54 C0 and 70 C1 features. Its residual-fit contexts are frozen from 2016, and residual-history coordinates are parallel-transported. These dimensions and context rules must not be attached to the older table.

C0/C1 change the point-prediction centre. They are not two different conformal calibration methods. The same calibration recipe is applied separately to each variant's error sequence, so the numerical thresholds need not be identical.

## Why keep C0 in research?

Base versus C1 measures the complete two-stage system change. C0 versus C1 tests the incremental residual-history feature block under the same fitting and calibration recipe. Without C0, an apparent gain could come from the extra model layer or conditioning on the Base prediction rather than the feedback block.

This is an ablation comparison, not a claim of two novel algorithms. Different input dimensions can also change estimation and model priors, so the comparison alone is not a pure causal proof of temporal information. Dimension-matched masked or shuffled-history controls would be useful additional experiments under a separately locked protocol; they are not reported as completed here.

Public-facing terminology is therefore Base, correction-only control (C0), and residual-feedback variant (C1). Research results retain all three rows. The operational forecast remains one pipeline with selectable configurations.

## Display corrections and reproduction

The table now names the archived protocol, years, storm count, paired-origin count, endpoint lead, joint event, nominal target, research role, signed MAE change and covered counts. Its target remains 90% regardless of the map confidence selector. Live mode explicitly shows the archived 24h summary; new live observations do not rewrite it.

The old selector also offered +18h even though no corresponding archived region/summary was exported. That unsupported option has been removed. The +24h joint event still includes its +18h position.

Tests recompute all three methods' MAE and joint coverage for every exported lead (6, 12, 24h), verify the source SHA256 against `rolling-v2.json`, test live/history scope, and reject an unsupported lead. No scientific JSON is modified.

Public sources: [archived atlas](../research-atlas.json), [full archived experiment and configuration](../rolling-v2.json). See the [research atlas](../../research-atlas.html) for the corrected display.
