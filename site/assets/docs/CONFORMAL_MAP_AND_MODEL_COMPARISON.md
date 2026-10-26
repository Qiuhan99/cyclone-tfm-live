# Reading the paired conformal maps and model comparison

26 October 2026 · presentation repair; original model outputs are preserved.

## What was missing

The CHAMPI briefing map drew source track lines and official wind radii, but no research-model conformal region. The research map drew only the selected model's region, so a baseline-versus-feedback uncertainty comparison was impossible. Its common extent also included numerical guidance, reducing the apparent separation of the research forecasts. The prospective table placed the selected feedback forecast in an unnamed “Selected” column; the row names were comparators, not the only forecasts being evaluated. Chronos and Moirai results remained in a separate archived explorer.

The briefing model checkbox used a human-readable alias as a raw selection key. That prevented a checkbox change from consistently controlling its original model. Selection now retains the original raw ID.

## Map definitions and new controls

- Orange dashed outline/track: TabPFN baseline. Teal solid outline/track: vector residual feedback.
- Both research regions are enabled by default. The live monitor offers both, either, or neither; the briefing has an independent conformal overlay and an original-cycle lead selector.
- Each live outline uses that method's own **published marginal radius at the selected horizon and level**. There is no interpolation of unavailable leads and no synthesized uncertainty for official or numerical point tracks.
- The briefing defaults to +24h. Original source cycles and elapsed targets remain labelled. Displayed coastal crossings are restricted to the selected source-cycle horizon.
- Official wind radii are a separate optional amber layer, disabled by default. A wind footprint does not represent forecast-position uncertainty.
- Research and guidance maps fit their own forecast extents. The endpoint detail is explicitly at a separate scale and retains the original coordinate difference. Its scale bar is a local approximation. Paths are never displaced to imply an improvement.
- The selected historical map now enables both original ellipse projections by default. Those are projections of an archived joint-path region; they are distinct from the separately calibrated endpoint-area diagnostics.

The current live export contains circular radial thresholds, not covariance ellipses. The renderer preserves that geometry. Historical ellipse experiments remain available; their geometry or posthoc coverage-matched scales are not substituted into a live issued forecast.

For a spherical radial region of geodesic radius r, area is

    A(r) = 4πR² sin²(min(π, r/R) / 2).

The original archived CHAMPI issue at 26 October 00:00 UTC has a +24h baseline-to-feedback displacement of 52.8251 km. The original 90% radii are 389.5077 and 381.6551 km, with areas approximately 476,482 and 457,469 km², respectively (feedback/baseline 0.9601). This is about 4% less issued area at equal nominal target, **not evidence of equal realized coverage or better location accuracy for that unverified issue**. The displayed values update when genuine new model outputs are published.

## Verification tables

The primary live table now lists TabPFN baseline, vector residual feedback, CMA and each numerical guidance product explicitly. It reports each method's own verified count, position MAE, available conformal coverage and mean issued area. Because available origin sets can differ, these rows alone are not a common-cohort ranking.

The second table fixes vector residual feedback as its named reference. Each comparator row uses the identical storm, issue time, lead and valid time, and forecasts confirmed in public Git before the target. It reports feedback/comparator MAE and feedback wins. Changing the displayed map method does not silently change this table's reference. The all-lead table continues to show both baseline and feedback.

A sample coverage of 100% at n=1 is one hit, not evidence that a nominal 90% procedure is well calibrated. Empty samples remain missing, not zero error or perfect coverage.

## Time-series foundation models

A visible completed-experiments section appears on both the Results page and live monitor. It reads the existing full-cohort experiment exports, separately from live scores and the four outcome-selected storm illustrations. It includes baseline, the complete residual-feedback method, Chronos-Bolt-small, Chronos-2 and Moirai-1.1-R-small. Correction-only and feature ablations remain in the complete explorer. TimeGPT remains pending; no API calls or scores have been invented.

Controls expose the 2024 historical cohort or locked CHAMPI snapshot; +6/+12/+24h endpoints; and shared constant-velocity residual or direct ENU inputs for the time-series models. All rows require the same recorded endpoint/storm counts. The displayed conformal recipe is the existing 90% endpoint ellipse with causal rolling calibration.

For the 2024 +24h shared-CV experiment, all 169 endpoints from 27 storms:

| Method | Endpoint MAE km | Empirical coverage | Mean issued area km² | Posthoc matched-area ratio / baseline |
|---|---:|---:|---:|---:|
| TabPFN baseline | 219.8628 | 91.12% | 596,682 | 1.0000 |
| Vector residual feedback | 224.1751 | 94.67% | 615,838 | 0.8744 |
| Chronos-Bolt-small | 244.8520 | 89.94% | 649,029 | 1.1947 |
| Chronos-2 | 246.6489 | 88.17% | 586,814 | 1.2253 |
| Moirai-1.1-R-small | 243.9880 | 89.35% | 609,020 | 1.1316 |

The feedback method has lower point error than these three tested time-series models, while baseline TabPFN has lower point error than feedback in this cohort. Feedback has a smaller point estimate of coverage-matched area; its original issued area is larger than baseline. Issued area and posthoc matched area are different quantities. Bar charts display both endpoint error and matched-area ratios. These exploratory point estimates are not statistical significance claims; paired whole-storm intervals and model revisions remain in the full explorer.

## Reproduction and preservation

No inference, correction, calibration, raw forecast, verification eligibility or experiment selection rule was changed. Existing scientific JSON files are preserved; the static site manifest is regenerated. Model inference still runs through the existing private Mac workflow. Publication uses the previously authorized GitHub Pages repository and keeps the live-data branch restore/refresh process intact.

Validate with:

    node --test tests/*.test.mjs
    python -m unittest discover -s tests -p 'test_*.py'
    python tools/build_site_manifest.py
    python tools/check_public.py

Original sources: [live forecast and ledger](../champi-operations.json), [shared-CV experiments](../tsfm-cv-sensitivity.json), [direct ENU experiments](../tsfm-conformal.json), [selected historical export](../feedback-showcase.json), [full benchmark](../../conformal-benchmark.html).
