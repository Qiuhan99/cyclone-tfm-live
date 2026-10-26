# Operations terminal audit · 26 October 2026

This release repairs the live CHAMPI reporting path, exposes mature prospective scores, and introduces the English operational interface. Model weights, forecasts and frozen research results are not tuned to this release.

## 1. Why official cards were stale

The Mac inference watcher and GitHub Pages deployments were running. UCAR observations had advanced to 26 October 2026 00:00 UTC; the general NMC centre bulletin had moved to IN-FA. The CHAMPI-specific parser correctly rejected the unrelated storm but classified it as a failed source check. Separately, NMC cancelled CHAMPI's national blue warning at 25 October 10:00 UTC (18:00 China time). The old warning parser recognised only issue/continue messages, rejected the cancellation, and kept an older active-warning card.

The repaired parser supports active and cancelled states. A verified general bulletin for another storm is recorded as `other_storm`, rather than being attached to CHAMPI. Storm-specific CMA map analyses retain their valid time and source. An older active warning retrieved later cannot replace a newer cancellation. Unknown or failed checks remain distinct from no warning. The terminal foregrounds the latest UCAR tracking fix; it labels the last CMA analysis separately.

Sources: [NMC national warning bulletin](https://m.nmc.cn/publish/typhoon/warning_index.html), [NMC general centre bulletin](https://www.nmc.cn/publish/typhoon/typhoon_new.html), [CMA CHAMPI map data](https://typhoon.nmc.cn/weatherservice/typhoon/jsons/view_3359119), [UCAR CHAMPI B-deck](https://hurricanes.ral.ucar.edu/realtime/plots/northwestpacific/2026/wp292026/bwp292026.dat). These live URLs can change; original retrieved files remain in the local research archive.

## 2. Why the prospective table showed zero

The table followed the forecast-map lead, whose default was 24 hours. The prospective ledger began on 25 October at about 15:01 UTC. Its first eligible research issue was 25 October 12:00 UTC: its 24-hour target is 26 October 12:00 UTC. At the audit snapshot that target had not arrived. Six- and twelve-hour targets already had truth and were scoreable.

Verification now has an independent lead selector. Its default chooses the latest available scored lead (preferring 24h, then 12h, then 6h). An all-lead table remains visible. States distinguish targets not reached, mature targets awaiting a source fix, and absent eligible common cycles. Scoring refreshes from the public append-only ledger every minute, preserving the first eligible forecast and first subsequently retrieved UCAR truth. No old historical forecast is relabelled as prospective.

At the audit snapshot, there is one research origin at each completed 6h and 12h lead:

| Lead | Base MAE km | C0 MAE km | C1 MAE km |
|---|---:|---:|---:|
| 6h | 16.2835 | 28.9033 | 29.4948 |
| 12h | 64.5562 | 82.1952 | 81.9690 |

For the same eligible 12h issue, CMA/BABJ is 14.6160 km, CMC is 201.0318 km and UKM is 55.6029 km. NGX has no eligible common pair at that lead. These single-origin observations do not establish a model ranking or long-run coverage. A 100% empirical coverage entry at n=1 is a count, not a calibrated reliability claim.

## 3. C1 absolute coverage gap and the meaning of CV

Absolute coverage gap is `abs(100 × empirical coverage − target percent)`, measured in percentage points. In the retained 2024 / +24h / 90% / ellipse / causal-rolling cohort, Base covers 154/169 = 91.12%, and C1 covers 160/169 = 94.67%. Their absolute gaps are 1.12 and 4.67 pp. This is not track error in kilometres. Both sample undercoverage shortfalls are zero, while C1 is more conservative in this cohort.

Issued mean area is 596,682 km² for Base and 615,838 km² for C1 (ratio 1.032). Retrospectively matched-coverage area ratio C1/Base is 0.874, with whole-storm 95% interval [0.777, 1.344]. Thus the current issued region is slightly larger, while the equal-coverage diagnostic is smaller but uncertain. All these values remain visible; the absolute-gap column has an explicit coverage label and units.

CV means **constant velocity**, not cross-validation. The last six-hour displacement supplies a spherical motion reference. TabPFN learns the true displacement minus that reference, then adds the predicted departure back. F0/F1/F2 denote position, motion and light covariate feature groups. C0 estimates the remaining Base residual; C1 adds four mature same-storm, same-lead residuals, ages and masks. The current fit contexts are frozen. The original short-horizon TabPFN-TS + PI+ protocol is a distinct experiment. More information can help an ideal conditional predictor, but a learned correction and conformal area have no unconditional improvement guarantee.

The existing cold-prediction, sign, coordinate and maturity audit is retained at [C1 pipeline audit](C1_PIPELINE_AUDIT_CN.md). This release does not claim that a presentation change improves the scientific scores.

## 4. Interface and archive

The operational entry, storm briefing, model evaluation, research atlas, method/data page and archive directory use English. The live map is the entry view. Paired map extents, residual vectors, source issue times, future valid times, pan/zoom and calibrated circles are retained. The complete original Chinese CHAMPI workbench remains at `champi-research.html`; earlier Chinese study pages and reports are explicitly labelled as original archive material. Historical ellipse results are not silently substituted for live circles.

The terminal supports CHAMPI in the western North Pacific. It does not yet discover and infer every active cyclone worldwide. TabPFN forecasts position only; observed or official intensity is attributed separately. The 15-minute Mac loop and twice-hourly cloud schedule are checks, not guarantees of new source observations or deployment latency. A source retrieval time cannot make an old analysis new.

## 5. Reproduction and checks

From the public checkout:

```sh
python -m unittest discover -s tests -p 'test_*.py'
node --test tests/*.test.mjs
python tools/build_site_manifest.py
python tools/check_public.py
```

From the private research checkout, the existing `tests/test_motion_operations.py` tests check fixed-origin inference, residual maturity and joint calibration.

Validation: 27 public Python tests, 39 Node tests and 7 private operations tests passed. All 28 protected public scientific JSON files retain their pre-release SHA256 values. Browser QA rendered actual forecasts and completed verification rows in Chrome and Safari. Live source and public deployment verification are recorded separately after publication.
