# CHAMPI forecast desk: live model paths and geographic interpretation

26 October 2026 · genuine local forecasts; original research experiments preserved.

## Why a checked feed can show an unchanged position

At the direct source audit, UCAR's CHAMPI B-deck still ended at **26 October 2026 00:00 UTC**. Its SHA256 was `8cf3a9e0ff01f2e85b4a12bb5ac7d03cfbb7a9ce278017fd7b1f8549779ba4f4`, identical to the latest downloaded file. The existing Mac publisher and public source checks were running. Source retrieval time had advanced; the source's observation time had not.

The forecast desk now displays four independent clocks: latest observed fix, source file check, TabPFN computation and Chronos/Moirai computation. It distinguishes an unchanged source, observations awaiting inference and an overdue public feed. A next 6-hour slot is a nominal observation-grid time, not a promised publication time. A newer timestamp is never invented for an unchanged model.

The primary observation card now shows the latest UCAR position, source wind in kt and pressure. The older CMA analysis retains its separate timestamp and averaging convention. NMC's general bulletin for another storm cannot update CHAMPI. A cancelled national warning stays explicitly cancelled.

## Actual time-series foundation-model paths

The Mac now runs **Chronos-Bolt-small, Chronos-2 and Moirai-1.1-R-small** alongside TabPFN with vector residual feedback. The adapters use nine contiguous 6-hour position fixes (48 hours), ending at the data cutoff. Positions are mapped into the current east–north tangent plane. The last 6-hour velocity is subtracted from the historical offsets; the model forecasts the residual sequence, and the same velocity offset is added back. Spherical exponential maps recover forecast coordinates.

Each live adapter predicts 12 steps, every 6 hours through +72h. All three use frozen local weights, CPU inference and seed 42. Chronos-Bolt handles coordinates independently, Chronos-2 jointly, and Moirai uses two targets, patch size 8 and 100 samples, reduced to the median. The live 12-step adapter is a distinct configuration from the archived four-step benchmark; the older benchmark scores are not relabelled as performance of these newly published paths.

The position cutoff is shared. TabPFN F2 additionally uses intensity/climatological features and labelled historical contexts; architectural comparisons require matching those covariates and label budgets. The exact repositories, revisions, checkpoint hashes, source hash, data cutoff, actual generation time and forecast digest travel with every TSFM path. The first public reference is `tsfm-live-reference.json`. Native quantiles/samples remain archived locally; they are **not** called conformal regions. No live TSFM conformal threshold or intensity forecast is manufactured. TimeGPT remains pending API access, as previously chosen.

Weights and native arrays remain on this Mac. Model code runs offline after public observations are downloaded. The existing private refresh runner invokes the pinned TSFM environment; raw forecasts, configurations and execution metadata are stored in the new `artifacts/champi_tsfm_operations_v1/<digest>/` namespace. No original experimental namespace is overwritten. Identical source input reuses the original forecast and generation time. A failed TSFM attempt retains an explicitly older actual version and reports the failure.

TSFM components have their own merge clock: adding fresh TSFM paths cannot retime TabPFN, and a later cloud source check cannot erase them. The existing authenticated, non-force Git transfer publishes public JSON to `live-data`, then the existing Pages workflow restores and deploys it. New TSFM forecasts enter the prospective ledger only for still-future valid times. Public confirmation must precede the target. Elapsed targets cannot be backfilled into prospective scores.

## Map and correction evidence

The briefing defaults to +24h and the TabPFN baseline, complete residual-feedback method and three TSFM paths. Numerical guidance remains selectable, with its source cycles labelled. Orange dashed and teal solid position contours remain the actual original 90% marginal thresholds of baseline and feedback. The live monitor also includes the real TSFM paths in its comparison map.

The map sidebar leads with **Measured gains** from the previously declared historical illustrations: all 44 origins in four selected storms, at +24h. Mean position error is 181.8226 → 147.2487 km (19.0152% lower); coverage-matched endpoint ellipse area is 13.2233% smaller and SPCI-adapted matched area is 28.5388% smaller. Both area comparisons match 40/44 endpoints (90.91%). These results stay explicitly labelled historical +24h when the map lead changes.

The **Current CHAMPI cycle** disclosure contains the current centre displacement, absolute baseline and feedback issued areas, and available paired verification. The same presentation applies at every lead; it does not filter live cycles by outcome. The map retains both actual original 90% regions. Matched historical areas are retrospective equal-coverage diagnostics, not those issued regions. Selection followed inspection of historical improvements; all origins in the selected storms are included. Full-cohort comparisons and original results remain linked and unchanged.

## Time-resolved geographic report

Every forecast path is interpreted from its original coordinates. The regional table reports the valid UTC time, lead, forecast position, nearest named coastal sector and distance, original 90% position-region/coast intersections where available, and displacement from baseline on the same cutoff/lead. The analysis selector can show baseline, feedback, TSFM or numerical guidance. The frontend rejects an analysis row whose issue, valid time or coordinates do not match the displayed forecast. The analysis version clock is derived from the latest source/model timestamp; an identical snapshot does not produce a new version on a no-op save.

Coastal distances use minimum spherical distance to minor great-circle segments of the existing Natural Earth 1:50m coastline. Major islands are identified from their polygons; remaining coastal sectors use approximate regional boxes. This resolves overlaps such as western Shikoku versus Kyushu. Original model coordinates and original archived crossing labels remain preserved; new derived crossing labels use the nearest identified coastline. These sector names are not administrative impact boundaries.

For a unit forecast position p and a coastline segment with unit endpoints a,b, normalize n = (a×b)/||a×b||. Project p onto the great-circle plane, w = (p − (p·n)n)/||p − (p·n)n||. If w lies on the segment's minor arc, distance is R asin(|p·n|); otherwise use the smaller endpoint angular distance. Degenerate segments use endpoints. A spherical radial region intersects a named coastal sector if its minimum coastline distance is no greater than the published radius.

In the 26 October 00 UTC residual-feedback forecast, the +12h centre is about 89 km from Shikoku's coastline, and the 90% position region reaches Shikoku and Kyushu. At +24h, the centre is about 154 km from Honshu and its region reaches Honshu and Shikoku. These statements describe that forecast version, not observed landfall. A centre on mapped land is labelled as a forecast geometric result, not an observation. Elapsed target times are identified separately.

Position-region overlap represents possible centre locations at a valid time. It is neither a calibrated landfall probability nor a wind/rain footprint. Translation speed, where retained in the downloadable analysis, is not wind speed. The research models have no intensity or warning head; official wind, rainfall and advisory information remain separate.

## Reproduction and checks

- Public regression tests cover source/model clocks, coordinate/version alignment, real TSFM provenance, spherical coastal distances, independent model merges and no retrospective prospective registration.
- Private tests verify the prefix excludes future observations, rejects missing 6-hour fixes and exactly reconstructs all three 72-hour paths from archived residual outputs plus velocity offsets. Native quantiles remain separate from conformal thresholds.
- Cached reruns preserve native forecasts, digests and their original generation timestamps. All original scientific JSON assets are hash-checked unchanged, apart from the regenerated static manifest and independently updated live payloads.
- Run `node --test tests/*.test.mjs`; with the project environment, run `PYTHONPATH=src python -m unittest discover -s tests -p 'test_*.py'`. The private research checkout adds `python -m unittest discover -s tests -p 'test_tsfm_operations.py'`.

Sources: [UCAR CHAMPI B-deck](https://hurricanes.ral.ucar.edu/realtime/plots/northwestpacific/2026/wp292026/bwp292026.dat), [live forecasts and analysis](../champi-operations.json), [first TSFM forecast reference](../tsfm-live-reference.json), [coastline source](../coastline.json), [selected evidence](../feedback-showcase.json), [complete benchmark](../../conformal-benchmark.html).
