# Full-X two-layer TabPFN repair v1 — 2026-10-21

**Status: EXPLORATORY / ADOPTION_GATE_FAILED. Actual local TabPFN-3.5 computation completed; not an improvement claim.**

## What changed

The original 10-dimensional base X is retained: current and two lagged latitude/longitude pairs, hour sin/cos, cos(latitude), and horizon/12. The new corrector adds latest verified same-h residual east/north, label-arrival age/12 and an availability mask (14 dimensions total). Residual output is the TabPFN predictive mean, targeting the conditional mean. Missing history uses zero plus mask=0 while X remains usable. A same-full-X per-horizon ridge and X-only second-stage TabPFN are actual controls. Both ridge and TabPFN also have validation-selected variants. C1-Ridge, C1-TabPFN raw and C1-TabPFN gated are kept distinct.

The old feature builder permitted i=1 despite using i−2, reading the final fix via negative indexing. This affects 124 old cached test origins. The old numerical artifacts are preserved and marked for audit, not reused as strict evidence. The new base is refit on 10,000 horizon-stratified, history-safe rows with all training labels before 2016. A three-contiguous-fix guard rejects invalid calls. New test keys are restricted to the old paired stride2 keys with i≥2; old forecast values are not reused. Some storms had only the now-excluded first origin, leaving 114 storms rather than 124. Eligible test years currently present are 2020–2024; the nominal 2020–2025 archive window has no surviving 2025 origin.

Nearest residual search scans cached j newest-first with j+h≤issue, UTC release and contiguity checks, and age≤48h. Missing exact j no longer ends the search. 6h history is available for 1,131/1,245 test origins. Early-stage missing residuals remain explicitly masked.

## Chronology and selection

| Role | Period | Origins |
|---|---|---:|
| Base context | labels before 2016 | 10,000 in-context (origin,h) rows |
| Corrector fit | 2016 | 210 / 2,520 (origin,h) pairs |
| Shrink/gate validation | 2017 | 231 |
| Covariance geometry | 2018 | 363 |
| Rank calibration | 2019 | 346 |
| Test | eligible 2020–2024 data | 1,245 / 114 storms |

Whole storms are assigned chronologically. Full-H outcomes for each pre-test phase must arrive before the next year. 2018 has three fewer origins after this cutoff. Timestamp audit checked all 10,000 base-context rows and all 28,740 query feature rows; fit target and history release boundaries passed.

Before test errors were computed, the per-horizon grid {0,.25,.5,.75,1} and rule were fixed: choose the lowest validation MAE (ties smaller lambda), require ≥1% gain and a negative upper 95% exploratory whole-storm bootstrap mean-error-difference bound; otherwise lambda=0. This guard is not a theorem of future no harm. All 12 horizons for both ridge and TabPFN selected zero, so the gated output equals Base. The raw two-layer predictions remain available. No threshold was relaxed after viewing tests.

2017 is disjoint from the current model fit, geometry and calibration, but has been examined in prior experiments. The 2020–2025 test seasons were also previously exposed. This is chronological exploratory reanalysis, not a pristine confirmatory holdout.

## Paired test endpoint MAE (km)

| h | Persistence | Velocity | Clean Base | Full-X ridge | X-only TabPFN | Full-X+residual TabPFN | Gated TabPFN |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 6 | 110.05 | 37.76 | 37.27 | 38.15 | 37.81 | 37.69 | 37.27 |
| 12 | 220.20 | 85.04 | 78.63 | 80.84 | 80.00 | 80.27 | 78.63 |
| 24 | 439.59 | 210.25 | 184.60 | 189.46 | 189.78 | 189.87 | 184.60 |
| 48 | 876.44 | 543.09 | 440.62 | 459.98 | 457.53 | 471.86 | 440.62 |
| 72 | 1310.17 | 938.58 | 711.89 | 767.42 | 762.43 | 791.64 | 711.89 |

The new raw residual model does not improve endpoint MAE in this run. The gate correctly chooses the validation-supported base fallback, but this is not evidence that residuals have no predictable structure in every regime. New base context, history filtering, feature set, corrector fit period and mean-vs-median choice differ from legacy runs; one cannot attribute the change to a single intervention without an ablation. No one-to-one paired comparison to the old 1,369-origin aggregates is claimed.

## Coverage and coverage-matched efficiency

Map thresholds use rank calibration from 2019 only. Geometry is fit on 2018 reanchored final residuals. Both MaxScore and full joint Mahalanobis are provided for every method and selected horizon. For coverage matching, the test score order statistic is used only in a labeled posthoc diagnostic, never as a deployed threshold. At target 90%, all methods attain empirical 90.04016% (ceil(.9×1245)/1245) in that diagnostic.

V is a 2H-dimensional tangent-coordinate joint volume. MaxScore uses the product of per-step ellipse areas; Mahalanobis uses the full ellipsoid determinant. These are not intrinsic spherical areas/volumes. Report the full volume ratio and log ratio; exp(delta log V / 2H) is a per-coordinate scale ratio, not the volume ratio.

| h | Geometry | Base fixed-90% coverage | Raw two-layer coverage | Posthoc matched V ratio (raw/Base) |
|---:|---|---:|---:|---:|
| 12 | maxscore | 86.99% | 85.94% | 1.149× |
| 12 | mahalanobis | 85.78% | 86.43% | 1.106× |
| 24 | maxscore | 87.47% | 86.83% | 1.332× |
| 24 | mahalanobis | 86.59% | 86.99% | 1.354× |
| 72 | maxscore | 86.75% | 85.62% | 4.569× |
| 72 | mahalanobis | 85.70% | 85.54% | 122.363× |

A smaller nominal-threshold set with lower coverage is not an efficiency victory. The new run does not demonstrate a universal conformal repair. Gated Base-equivalent centers also have equivalent geometry, coverage and volume; there is no residual efficiency increment to claim.

## Reproduction and local delivery

Use the existing pinned interpreter; no new environment, paid API or checkpoint download was used. TABPFN_DISABLE_TELEMETRY=1, HF_HUB_OFFLINE=1 and TRANSFORMERS_OFFLINE=1 are set before importing the model. Checkpoint: TabPFN-3.5 SHA-256 `ece4d67eadfea42eb0e610df5189bea60cb7f31073d81e9c7a019b76eacf0be3`. Six component regressors (two ENU components per base/full-residual/X-only arm), each with two ensemble estimators, run on CPU using reusable key-value inference caches.

```bash
cd ${RESEARCH_WORKSPACE}/tabpfn_joint_trajectory_research
../tabpfn_residual_realdata/.venv/bin/python -u scripts/full_layer_repair.py --stage all
../.venv/bin/python -m pytest tests -q
node --test web/tests/engine.test.mjs web/tests/fullx.test.mjs
```

Chunk caches bind configuration, training arrays, target arrays and query hashes; final component caches also have prediction hashes. `artifacts/fullx_repair_v1/manifest.json` records source, checkpoint and website output hashes. No original numerical artifact was overwritten. UI data: `web/dist/assets/fullx-repair.json`.

Start the website by double-clicking `web/start.command`; it opens the local browser and recognizes an already-running CYCLONE service. Alternatively run `python3 web/serve_local.py --port 8765` and visit http://127.0.0.1:8765. Keep its terminal running; Ctrl+C stops a server you started. No cloud deployment.

Validation: 62 Python tests, 21 JavaScript scientific/data tests passed. Existing Accelerate floating-point warnings persist (21); exported covariance matrices and paths independently checked finite/SPD and against geodesic errors. New UI and coverage-matched table loaded in native Chrome; actual data and all eight method metrics observed.

Next scientific step: obtain more historical OOS residual context or high-dimensional issue-safe environmental variables, preregister a new independent evaluation, and test whether lag information adds value over X-only. Do not alter this run’s gate or present failure as adoption success.
