# Historical implementation note

This file describes an earlier correction-input configuration. The active user-approved method is defined in [DIRECT_VECTOR_FEEDBACK.md](DIRECT_VECTOR_FEEDBACK.md): direct first-stage displacement, followed by g(X,H), with no CV target offset or Base input augmentation. Original historical material follows unchanged.

# TabPFN with vector residual feedback

Public presentation and implementation note · 26 October 2026

## One method

The site entry presents the complete TabPFN residual-feedback pipeline and selected research results. Operational CHAMPI forecasting remains at `algorithm-live.html`. Public figures compare **TabPFN baseline** with **Vector residual feedback**. The correction-only variant is a research ablation, retained in the complete archive rather than presented as a second proposed algorithm. Original identifiers and every numerical output remain unchanged for reproducibility.

## Residuals are vectors

In a Euclidean multivariate forecasting problem, with d-dimensional target y_i and Base prediction f(X_i), the residual is

    r_i = y_i − f(X_i) ∈ R^d.

An augmented input can be written (X_i, Residual(X_i)) if the residual block denotes information available to the predictor. A distinction is necessary: r_i for a new target cannot be observed before y_i arrives. During inference, the usable block contains mature historical residual vectors or separately estimated quantities, not the new target's true error.

In the current cyclone implementation, each horizon-specific position correction has d = 2: east and north displacement in kilometres. Forecasts at different horizons are handled explicitly; a joint path event can have dimension 2H.

For issue t and horizon h:

    J(t,h) = {j : j < t and j + h ≤ t}
    r(j,h) = true displacement(j,h) − Base displacement(j,h)
    R(t,h) = [latest four mature residual vectors, ages, availability masks]
    X*(t,h) = [issue-time features, Base displacement]
    z(t,h) = [X*(t,h), R(t,h)]
    delta_hat(t,h) = g(z(t,h)) ∈ R²
    corrected_position = Exp_at_issue(Base_displacement + delta_hat).

The live CV-F2 branch transports residual vectors to the current issue frame before use. Its Base has 52 features; X* has 54; R has 16 fields (four vectors × two components, four ages and four masks); the complete correction input has 70 fields. Missing residuals are padded and masked. Two TabPFN regression heads share the inputs and estimate the correction components; this is not a claim of a native joint multi-output likelihood. Position uncertainty is calibrated separately using mature errors.

The historical rolling-v2 illustrations use an earlier feature/frame/context configuration. Their archived values are not relabelled as fresh results from the live CV-F2 run. The common idea is multivariate residual conditioning; exact implementation differences remain in the research record.

## What the selected results show

The public Results page presents the already declared GAEMI, AMPIL, DORA and TALIM illustrations. Selection used historical outcomes: the original rule required at least five origins and at least 5% storm-average improvement, selected the top three eligible storms by mean improvement, and included TALIM from the user's earlier requested case. The representative plotted origin was selected from improving, covered origins under the original rule. No new outcome-based selection was performed for this release.

All 44 eligible origins in those four storms contribute to the aggregate, including origins with worse corrections. These are descriptive retrospective examples. They cannot establish independent full-cohort, future-storm or universal drift robustness.

| Metric | Baseline | Residual feedback | Description |
|---|---:|---:|---|
| Mean +24h endpoint error | 181.8226 km | 147.2487 km | 19.0152% reduction across all 44 selected-cohort origins |
| Matched geometric mean endpoint area · rolling ellipse | 281,909.70 km² | 244,631.94 km² | 13.2233% smaller after matching empirical coverage |
| Matched geometric mean endpoint area · SPCI-adapted | 314,721.58 km² | 224,903.77 km² | 28.5388% smaller after matching empirical coverage |

Each area comparison retrospectively rescales both arms to 40/44 covered endpoints (90.91%). Matched areas are diagnostic quantities, not issued forecast regions. Original coverage counts remain visible on the Results page. Under the original issued thresholds, the mean areas can be larger for the corrected forecasts; the complete values remain in the source JSON. These comparisons do not establish that every issued region is smaller or that point improvement guarantees conformal improvement.

The Results map uses actual frozen paths, observed truth and, by default, both original 90% joint-path region projections. It does not draw posthoc matched areas as if they were issued. The plotted joint-path projections and the separately calibrated two-dimensional endpoint area table have distinct definitions.

## Publication design

- Primary naming: one complete vector residual-feedback method and a TabPFN baseline.
- Public retrospective emphasis: previously selected improvement illustrations, with selection and sample scope directly above the results.
- Research archive: complete cohorts, all ablations, negative results, original model IDs and raw derived evidence remain accessible.
- Live CHAMPI: actual timestamped predictions and prospective scores stay separate; available live scores are not filtered to wins.
- Model inference, residual maturity, calibration thresholds and original experiment files are unchanged by this presentation release.

## Source files and validation

The page reads a compact `feedback-showcase.json` export of the previously selected four storms. The export retains source hashes for `selected-cases.json`, `endpoint24-selected.json` and `research-atlas.json`; the complete original files remain accessible. Reproduce the export with `python tools/build_feedback_showcase.py`. The renderer recomputes the 44-origin average and checks it against the frozen selection summary; it validates common coverage and area ratios before displaying any result. All original public scientific JSON hashes are checked unchanged. The complete research logs and private model inputs remain local.

Source links: [case selection and all candidates](../selected-cases.json), [endpoint area evidence](../endpoint24-selected.json), [archived forecast paths](../research-atlas.json), [full model evaluation](../../conformal-benchmark.html), [research archive](../../research.html).


The paired live-map presentation and completed Chronos/Moirai experiment comparison are documented in [Map and comparison definitions](CONFORMAL_MAP_AND_MODEL_COMPARISON.md).
