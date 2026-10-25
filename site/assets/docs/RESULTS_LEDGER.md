# RESULTS LEDGER

Every number below is backed by an artifact path. Flags: `REPLICATED`
(verified in this project), `ARTIFACT-BACKED` (read from prior project's
saved results, not re-run), `PRELIMINARY` (single protocol pass, no
multi-seed), `FAILED` (negative result), `OPEN`.

## Phase 0 — draft(1).md audit (artifacts: `artifacts/tables/theory_audit_checks.json`)

| ID | Claim | Verdict | Flag |
|---|---|---|---|
| T0.1 | Frozen-context native 90% coverage = 64% (synthetic suite) | tabpfn_v3/frozen/`raw` rows at 0.90 target average **0.640** over 7 scenarios in `../TabPFN&PID/results/m6_formal_synthetic_benchmark_20260820T122929Z_843f7b69cb/analysis/main_table.csv` | ARTIFACT-BACKED (re-run deferred to Phase 2) |
| T0.2 | Lemma 1 staleness variance `σ²ρ²(1−ρ^{2g})/(1−ρ²)` | **Off-by-one confirmed numerically**: MC matches corrected form `σ²ρ²(1−ρ^{2(g−1)})/(1−ρ²)` (zero at g≤1); draft counts `ξ_{r_m}` which the oracle base has seen | REPLICATED (MC, see JSON rows) |
| T0.3 | Variance inflation ⇒ score-quantile monotone | **Refuted in general** by two-point counterexample (Var 0.11M²→0.125M² while q90 M→M/2); holds for Gaussian scale family (verified) | REPLICATED |
| T0.4 | `‖Σ‖≥λ` suffices for inverse | **Defect**: needs `λ_min≥c`; counterexample diag(1e6,1e−8) passes norm bound, condition number 1e14 | REPLICATED |
| T0.5 | "R(x) deterministic function of x" | Wording defect: random response ⇒ R is a random variable; only `m(x)=E[R|x]` is deterministic | THEORY_DERIVED (wording fix, no computation needed) |
| T0.6 | Channel coverage law | Formula = nested increment (correct); empirical gains measured vs zero-corrector conflate channels; lower bound (ii) unproven | PARTIAL: definition OK, bound OPEN |
| T0.7 | Prop 2: c* < ρ from quantile upper bound | **Not entailed** — minimizing an upper bound does not locate the true minimizer; downgrade to hypothesis | THEORY_DERIVED (logical audit) |
| T0.8 | Split vs online guarantees | ACI/PID: long-run average coverage only; overlapping multi-step labels break exchangeability; see THEORY_AUDIT | THEORY_DERIVED |
| T0.9 | ECL joint ellipsoid numbers | Log-volumes match `../tabpfn_residual_realdata/results/electricity/final_conformal.csv` to <0.1 (e.g. e(C1)+PI 2514.06 vs draft 2514); coverage spread 0.899–0.921 ⇒ "equal coverage" only ±0.02; annulus volume formula itself is algebraically correct | ARTIFACT-BACKED + PARTIAL |
| T0.10 | Method-variant statuses | Freshness dose–response 0.804 gain at k=32, lag-1 0.042→0.722 match `logs/freshness.log` exactly; bare-vs-TS (P8 refuted→21%) consistent with `results/bare_vs_ts_e5.md`; **P0.5 resolved**: draft §5.3 "corrected 1.307 @ k=16" reproduces exactly from the freshness.log k=16 row (√(2.668²·(1−0.7599)) = 1.3072); "side/dim" = `geo_side = exp(mean log-vol / p)` (staleness_conformal.py:189) | ARTIFACT-BACKED |

## Phase 1 — cyclone benchmark (this project's own runs)

### Point forecasts, WP test split 2020–2025 (PRELIMINARY)

Artifact: `artifacts/tables/point_forecasts.csv`;
manifest `artifacts/manifests/backtest-wp-1792332216.json`
(full run: corrector fit on ALL train ≤2015 storms; 2,685 test origins;
H=12 steps=72 h; base = great-circle constant velocity; C1 = causal
per-h ridge on same-h lagged residual, strict label delay h steps,
standardised solve).

| Method | MAE@6h | MAE@24h | MAE@48h | MAE@72h (km) |
|---|---|---|---|---|
| persistence | 109.9 | 436.8 | 870.9 | 1302.8 |
| const-velocity (base) | 39.1 | 212.9 | 546.9 | 940.5 |
| base + C1 corrector | **37.6** | **199.8** | **501.6** | **869.7** |

(all 12 horizons + storm-bootstrap 95% CIs in the CSV — e.g. 72h
corrected CI [814.9, 931.5].)

Reading (PRELIMINARY): the C1 lag-residual channel improves the
const-velocity base at every horizon (≈5–12%); consistent with predictable
residual structure in a history-only base. NOT evidence about TabPFN
(Phase 2), and gains vs operational forecasts are NOT claimed.

### Synthetic whole-H conformal gate (REPLICATED)

Artifact: `artifacts/tables/joint_cp_results.json` → `synthetic_sanity`
(60 reps × n_cal 800 × n_test 60, H=12, α=0.10):

- MaxScore split CP joint coverage **0.8933 ± 0.005 MC-SE** — within 3 SE
  of the 0.90 nominal ✓ (gate P3 sanity PASSES at preview scale).
- Per-h 90% quantiles under cross-h-correlated scores: 0.8928 (tracks the
  joint event — adequacy of per-h intervals is DGP-dependent, NOT a
  universal failure); under independent-h errors: **0.2694 ≈ 0.9¹²**
  (collapses, as theory demands). Joint claims therefore need a
  joint-calibrated score; both regimes now documented.

### WP joint-CP preview (PRELIMINARY — dependence acknowledged)

Same artifact → `wp_preview.streams` (cal 2016–19, n_cal=2,482 origins;
test 2020–25):

| stream | q̂ (rank (n+1)(1−α)) | joint coverage on test |
|---|---|---|
| base residuals | 2.915 | 0.886 |
| corrected (C1, re-anchored) | 2.848 | 0.875 |

Overlapping 6-hourly origins within storms violate exchangeability, so
0.90 is NOT guaranteed here; the −0.014 gap for the corrected stream is
within what overlap-induced drift can produce. Storm-level units and
rolling CP land in Phase 3; no efficiency claim is made (tubes differ:
q̂ 2.915 vs 2.848 with different Σ̂).

### Demo map (REPLICATED as software; no scientific claim)

`artifacts/demo/storms.json` — 3 skill-blind test storms (straightest /
median / turniest by total heading change among test storms with ≥8
origins): NOUL 2020 (2020258N11127), SON-TINH 2024 (2024224N27154),
HAIKUI 2023 (2023239N18144); 2,482 calibration origins; tube radii from
cal split. App checks (AppTest): no exceptions across storm/horizon/
method/uncertainty/issue-time/retrospective-toggle interactions; issue
time reacts to slider; forecast-only mode hides future truth.
Figures: `artifacts/figures/point_mae_vs_horizon.html`,
`artifacts/figures/joint_cp_gate.html`.

## Phase 3 — joint CP protocol on WP (PRELIMINARY, real data)

Artifact: `artifacts/tables/joint_cp_results.json` → `wp_p3` (full run:
covariance fitted on train-subsample 2010–15 stride-3 cap-3000 — score
function FIXED before calibration, no cal reuse; cal 2016–19, test 2020–25;
H=12; α=0.10; streams = const-velocity base residuals vs C1-corrected
re-anchored residuals). Per-h Mahalanobis max-score S_max.

| Procedure | base cov | corrected cov | guarantee status |
|---|---|---|---|
| CP0 per-h marginal (diagnostic) | 0.762 | 0.732 | not a joint procedure — under-covers as theory predicts |
| CP1 Bonferroni (per-h at 1−α/H) | 1.000 | 1.000 | valid but grossly conservative at H=12 |
| CP2 storm-unit split (124 test storms) | 0.847 [0.773–0.900] | 0.839 [0.764–0.893] | exact ONLY under cross-period storm exchangeability — violated here (drift) |
| CP2 all-origins split (5,167 origins… n_cal 2,482) | 0.886 | 0.878 | approximate (overlap) |
| CP3 rolling online, label delay H·6h, window 300, min-pool 30 (5,137 scored) | 0.893 | 0.893 | approximate; closest to nominal |

Efficiency (tube = conservative disc q·√λ_max(Σ̂_h); achieved coverage in
same row — protocol rule: compare only within ±0.02):

| stream | achieved cov (CP2-all) | radius@6h | @24h | @72h |
|---|---|---|---|---|
| base | 0.886 (within 0.02 of 0.90 ✓) | 99.4 | 563.9 | 2598.9 km |
| corrected | 0.878 (−0.022 vs nominal ✗ marginal) | 94.2 | 533.3 | 2368.6 km |

Pairwise base-vs-corrected coverage gap is 0.008 (within tolerance), and the
corrected tube is ~6–9% smaller at every horizon — **consistent with a
corrected-stream efficiency gain**, but the corrected stream sits 0.022 below
nominal, so per the pre-registered rule we mark it *marginal, not
coverage-matched* until interpolation or a larger n tightens the CI.
CP2-storm radii (2,244 vs 2,128 km @72h) are **incomparable** (both
under-cover: smaller radius at lower coverage).

Readings (PRELIMINARY, real data):
1. **Frozen split under-covers** (storm-unit 0.847/0.839 vs 0.90; Wilson CI
   barely touches nominal).
2. **Drift isolation (P3x, NEW)**: within-period storm-unit splits do NOT
   restore nominal either — within 2016–19: 0.831 (base) / 0.780 (corr);
   within 2020–25: 0.855 / 0.871 (n≈59–62 storms per half, Wilson
   half-width ≈±0.08). Cross-period (0.847/0.839) sits BETWEEN the two
   within-period values ⇒ **the gap is NOT primarily cross-period drift**.
   Candidate explanations (unresolved, logged for P5 theory work):
   within-period storm dependence (annual regime clustering makes storms
   correlated units, inflating effective n), and the score function's
   covariance being frozen at 2010–15 (miscalibration shared by both
   halves). This sharpens Theorem-2's target: dependence handling, not
   just drift handling.
3. **Rolling with strict label delay restores ≈nominal** (0.893/0.893) and
   is **robust to window size** {150, 300, 600} → 0.892–0.894 (both
   streams) — adaptation repairs the gap regardless of window choice.
4. Bonferroni is valid but useless at H=12 (coverage 1.000, huge radii) —
   motivates joint max-score calibration over per-h corrections.
5. CP0 diagnostic confirms per-h marginals ≠ joint (0.76/0.73).

Figures: `artifacts/figures/case_tube_projection.html` (exit-gate case),
`artifacts/figures/coverage_path.html` (cumulative rolling coverage by
issue date), `artifacts/figures/joint_cp_gate.html` (synthetic gate).

## Phase 4 entry — CP4 full-2H Mahalanobis vs CP2 MaxScore (PRELIMINARY)

Artifact: `artifacts/tables/p4_comparison.json` (+ manifests p4-comparison-*).
Setup: Ω (24×24) = shrunk sample covariance of stacked tangent residuals on
the train-subsample stream (n=3,000 ≫ d=24, eig-floor; cond ≈ 140); per-h Σ̂
identical to P3; α-grid {0.06–0.14} interpolation for coverage-matched radii;
evaluation on test 2020–25.

| Procedure (α=0.10) | base | corr |
|---|---|---|
| CP4 split all-origins | 0.896 | **0.908** |
| CP4 split storm-unit | 0.806 | **0.911** |
| CP4 rolling (label delay) | 0.888 | 0.894 |
| CP2 reference (all/storm, from P3) | 0.886 / 0.847 | 0.878 / 0.839 |

Coverage-matched per-h **projected** radius at achieved cov 0.90 (72 h):

| stream | CP2 MaxScore | CP4 Mahalanobis |
|---|---|---|
| base | 2,721 km | 3,070 km (+12.8%) |
| corr | 2,530 km | 3,147 km (+24.4%) |

**Corrected during this session**: the first CP4 projection used the
conditional covariance block ((Ω⁻¹)_hh)⁻¹ and produced a spuriously 3.5×
smaller tube; re-derivation shows the shadow of the joint ellipsoid is
governed by the MARGINAL block Ω_hh. Both variants are logged; all numbers
above are post-fix.

Reading (PRELIMINARY): **CP4 buys frozen-split validity — the corrected
stream hits nominal coverage (0.908/0.911) where MaxScore under-covers
(0.878/0.839) — at the price of 13–24% larger per-h projected tubes at
matched coverage.** Roles, pending P4-proper toy ablations (rank r, n_cal,
drift): MaxScore = efficiency-oriented baseline; CP4 = validity-oriented
option that exploits cross-horizon correlation. Whether CP4's TRUE joint
2H-volume (not its projection) is smaller remains open — projection
comparisons penalize correlated geometries by construction.

## Phase 2 proper — TabPFN-3.5 lag-table backtest (PRELIMINARY, bounded)

Artifact: `artifacts/tables/tabpfn_full.csv`; manifest
`artifacts/manifests/tabpfn-full-1792341203.json` (pinned venv, CPU,
1,291 s; 613,560 train rows → 9,897 in-context (stride cap), 2,685 test
origins 2020–25; one regressor per (east, north); checkpoint sha256
ece4d67e…; horizon h/12 as a feature; batched chunked predict).

| Method | MAE@6h | @12h | @24h | @48h | @72h (km) |
|---|---|---|---|---|---|
| persistence | 109.9 | 218.8 | 436.8 | 870.9 | 1302.8 |
| const-velocity | 39.1 | 87.4 | 212.9 | 546.9 | 940.5 |
| constvel + C1corr | 37.8 | **83.4** | 199.1 | 499.1 | 865.9 |
| **TabPFN-3.5 lag-table** | **37.7** | 86.0 | **190.5** | **432.2** | **699.8** |

Reading (PRELIMINARY): with a real (10k-row) in-context training budget,
the TabPFN lag-table base beats every baseline at 24/48/72 h — at 72 h it
improves on the C1-corrected const-velocity base by a further **19.2%**
(699.8 vs 865.9 km, CIs [654, 748] vs [815, 932] — disjoint). At 6/12 h it
ties C1corr/constvel. This validates the route's central premise that a
TabPFN base is competitive on history-only cyclone tracks. NOT yet done:
C1/C2 residual feedback ON TOP of the TabPFN base (the actual RQ1 test),
TabPFN-TS variant, refresh cadence — the informative next run.

## RQ1 multi-seed replication — COMPLETE 3+3 capacity witness (§15 bar met)

Artifacts: `artifacts/tables/tabpfn_rq1_cap10k/_seed43/_seed44/_cap20k/
_seed43_cap20k/_seed44_cap20k.csv` (six runs; manifests for each). Corrector
gain (ΔMAE %, negative = improvement; significance = paired storm-block CI
excluding 0):

| horizon | 10k arm (3 seeds) | 20k arm (3 seeds) |
|---|---|---|
| 12h | **−5.89 / −6.06 / −6.75** (all significant) | +0.22 / +0.44 / +0.50 (all n.s.) |
| 24h | **−3.24 / −3.65 / −3.66** (all significant) | −0.01 / +0.03 / +0.03 (all n.s.) |
| 48h / 72h | no-op (all seeds, both arms) | no-op |

**Verdict**: the capacity witness is fully replicated in BOTH arms with
three seeds each — significant 12/24 h gains at the 10k in-context cap
(range −5.9 to −6.8% and −3.2 to −3.7%), exactly removed at the 20k cap
(all intervals contain zero, point estimates within ±0.5%). The §15
"at least 3 seeds" bar is met for the paper's capacity-witness claim.

## RQ1 sharp test — in-context capacity vs corrector gain (law CONFIRMED)

Artifacts: `artifacts/tables/tabpfn_rq1_cap10k.csv` vs `_cap20k.csv`
(manifests tabpfn-rq1-1792344957 / -1792374966; identical protocol, only
the TabPFN in-context cap changes 10k → 20k; stride-2 paired eval on the
same 1,369 test origins; odd horizons inactive-corrector artifacts as
above).

| horizon | gain@10k ctx | gain@20k ctx | reading |
|---|---|---|---|
| 12h | **−5.89%** (sig) | +0.44% (n.s., CI [−0.48, +1.02]) | gain eliminated |
| 24h | **−3.24%** (sig) | +0.03% (n.s., CI [−1.75, +1.75]) | gain eliminated |
| 48h | −0.19% (n.s.) | −0.28% (n.s.) | unchanged |
| 72h | +0.80% (n.s.) | +0.60% (n.s.) | unchanged |

Base MAE itself at 12h improved 84.6 → 78.4 with the larger context; ≥24h
essentially unchanged (188.5→181.7, 688.5→688.5).

**Reading (PRELIMINARY, single seed/basin)**: doubling the base's
in-context budget removed the corrector's short-horizon gains EXACTLY —
the "residual channel" was a base-capacity channel. This is the
channel-coverage-law attribution logic reproduced dynamically inside one
architecture (capacity sweep instead of cross-featurization witnesses),
complementing the draft's static TS-vs-AR witnesses. Caveats: stride
artifacts at odd horizons persist (documented); 1 seed; WP only.

## RQ1 — C1 residual feedback ON TOP of the TabPFN base (PRELIMINARY)

Artifact: `artifacts/tables/tabpfn_rq1.csv`; manifest
`artifacts/manifests/tabpfn-rq1-1792344957.json`. Design: TabPFN lag-table
base (same fit as the P2 proper run; paths for cal 2016–19 and test 2020–25
origins predicted OOS, stride 2, cached in
`artifacts/prediction_cache/tabpfn_paths_stride2.parquet`); C1 corrector
trained on CAL OOS TabPFN residuals (§2.1 satisfied — no in-sample
residuals); paired evaluation on 1,369 test origins.

| horizon | TabPFN MAE | +C1 MAE | Δ% | paired CI (km² MSE-diff) |
|---|---|---|---|---|
| 6h | 36.95 | 36.95 | 0.00* | [−0, +0] |
| 12h | 84.61 | 79.62 | **−5.89%** | [−6.79, −3.32] significant |
| 24h | 188.45 | 182.35 | **−3.24%** | [−10.75, −2.55] significant |
| 48h | 426.95 | 426.15 | −0.19% | [−5.33, +3.38] n.s. |
| 72h | 688.54 | 694.06 | +0.80% | [−3.92, +14.26] n.s. |

*Stride artifact (must not be read as channel-law evidence): with stride-2
path caching, odd horizons have NO usable lag origin (t_idx−h falls on the
other stride parity) so the corrector is inactive there (lag-coef norms
exactly 0 at h=1,3,5,…). Only even horizons carry an active corrector
(coef norms 0.13–0.24).

Reading (PRELIMINARY): on a base whose table already contains position
lags, the cheap causal corrector still yields **small significant gains at
12–24 h (−3 to −6%)** that vanish at ≥48 h. This refines the channel-law
picture: the TabPFN lag-table base does NOT fully exploit short-lag
residual structure under a 10k-row in-context cap, while longer horizons
are saturated. It sits between the draft's two witnesses (43-feature
TS base: −18% gain; AR(4) base: −0.02% no-op). Follow-up: raise the
in-context cap and see whether the 12–24 h gain shrinks toward no-op —
the law's sharp prediction.

## P3/P4 on the TabPFN base (PRELIMINARY; no-reuse design)

Artifact: `artifacts/tables/p3_tabpfn.json`; manifest p3-tabpfn-*. Design:
covariance + C1-on-TabPFN corrector fitted on cal-2016-17 OOS residuals;
split quantiles from cal-2018-19 (disjoint); test 2020-25 (stride-2 cache).

| stream / score | all-origins | storm-unit | rolling | 72h tube radius |
|---|---|---|---|---|
| TabPFN base / CP2 MaxScore | 0.883 | 0.798 | 0.892 | **1,950 km** |
| TabPFN base / CP4 Mahalanobis | 0.866 | 0.774 | 0.886 | 2,329 km |
| TabPFN+C1 / CP2 MaxScore | 0.873 | 0.815 | 0.894 | 1,919 km |
| TabPFN+C1 / CP4 Mahalanobis | 0.858 | 0.855 | 0.889 | 2,846 km |

Readings (PRELIMINARY):
1. **A better point base flows straight into joint-region efficiency**:
   the TabPFN base's MaxScore 72h tube is ~25% smaller than the
   const-velocity base's (1,950 vs 2,599 km) at comparable achieved
   coverage (0.883 vs 0.886) — same calibration machinery.
2. Rolling remains ≈nominal on the stronger base (0.886–0.894).
3. Storm-unit still under-covers (0.77–0.86) — the dependence finding is
   base-independent, reinforcing the P5 theory target.
4. CP4's nominal-coverage advantage from the constvel-corrected stream does
   NOT transfer to the TabPFN base (CP4 < CP2 in coverage and radius here):
   the keep/drop decision stays conditional on the base/stream, exactly as
   §8 requires (negative results retained).
5. C1-on-TabPFN shrinks tubes only ~1.6% (0.883→0.873 coverage) —
   consistent with the small point gains of RQ1.

## P4 toy — covariance estimators with KNOWN ground truth (REPLICATED, synthetic)

Artifact: `artifacts/tables/p4_toy.csv` (+ manifest p4-toy-*). DGP:
U = B f + ε, exchangeable units, factor variance known; rank r ∈ {1,2,4},
n_cal ∈ {250,1000,4000}, cross-h noise drift on/off; 60 reps each. Bug
fixed en route: Ω* initially omitted the factor variance (1600× scale
error) — post-fix numbers below.

- **Validity**: all estimators (diag / Ledoit–Wolf / low-rank+diag) hold
  joint coverage ≈ 0.90 within MC error at every n_cal — as split CP must
  under exchangeability, regardless of covariance error.
- **Efficiency (log10 joint volume at matched coverage)**: low-rank
  (oracle rank) 51.9–61.6 ≪ LW 76.7–86.1 ≪ diag 98.9–107.4 — structured
  covariance buys a ~35–46% smaller log-volume than LW, robustly across
  n_cal down to 250 and unaffected by the noise-drift toggle (drift adds
  ~+7 log10 uniformly).
- **Estimation error**: low-rank rel-Frobenius 0.024–0.035 vs LW
  0.094–0.100; diag misses ~0.95 (no off-diagonals).
- Keep/drop: in the toy, low-rank structure learning is decisively worth
  it; on real WP the CP4 advantage was conditional on stream — the gap
  between toy and real motivates testing ADAPTIVE rank selection and is
  logged for P4-proper.

## nmtCP-style weighted calibration — NEGATIVE result on WP (PRELIMINARY)

Artifact: `artifacts/tables/weighted_cp.json`. Temporal-decay weights
exp(−|t_cal − t_test|/λ) with the beyond-exchangeability weighted
quantile (w_new = 1):

| λ (years) | base cov | corr cov | mean q (base) |
|---|---|---|---|
| unweighted | 0.886 | 0.878 | 3.048 |
| 0.5 | 0.611 | 0.600 | 1.985 |
| 1.0 | 0.866 | 0.856 | 2.896 |
| 2.0 | 0.880 | 0.874 | 2.999 |
| 4.0 / ∞ | ≈ unweighted | ≈ unweighted | ≈ 3.04 |

Aggressive down-weighting of older calibration points DESTROYS coverage —
consistent with the P3x drift-isolation finding: the real gap is
within-period dependence, not temporal drift, so time-decay weighting
attacks the wrong cause and only throws away effective sample size.
**Rolling with label delay (0.893) remains the practical remedy**; the
weighted route is retained as a documented negative control.

## Prop B empirical closure — intensity stratification (PRELIMINARY)

Artifact: `artifacts/tables/stratified_cp.json` (+ manifest stratified-cp-*).
Design: storms binned by peak-wind terciles (boundaries from CAL storms
only); each test origin calibrated within its bin; year-activity oracle
weighting as a mechanism probe (marked oracle).

| method | base cov | corr cov |
|---|---|---|
| unweighted frozen split (reference) | 0.886 | 0.878 |
| **intensity-stratified (terciles)** | **0.897** | **0.891** |
| year-activity oracle weights (0.94–1.13) | 0.886 | 0.880 |

Per-bin (base): weak 0.850 / mid 0.915 / strong 0.925 (corr: 0.863 / 0.904
/ 0.907) — the weakest bin still under-covers; documented.

Reading: conditioning on an observable scale driver closes most of the
frozen-split gap exactly as the mixture mechanism predicts, and the
year-level oracle null identifies STORM INTENSITY (not year activity) as
the operative heterogeneity dimension. Deployable corollary for the
paper: a stratified or intensity-conditioned calibration is a
stateless alternative to rolling.

## C2 — TabPFN as the second-stage residual learner (PRELIMINARY)

Artifact: `artifacts/tables/tabpfn_c2.csv`; manifest
tabpfn-c2-1792483462 (5.1 h CPU; the FULL core-idea form: TabPFN base →
residual → TabPFN in-context second stage, same 6-dim causal features,
trained on CAL OOS residuals, harvestable 10k regime, 1,369 test origins,
paired storm-block CIs; C1 ridge reference from the same protocol).

| horizon | TabPFN base MAE | +C2 MAE | C2 gain | C1 (ridge) gain | C2 CI |
|---|---|---|---|---|---|
| 6h | 36.95 | 36.95 | 0.00%* | 0.00%* | inert |
| 12h | 84.61 | 80.79 | **−4.51%** | −5.89% | [−5.33, −2.34] sig |
| 24h | 188.45 | 185.08 | **−1.79%** | −3.24% | [−7.16, −0.42] sig |
| 48h | 426.95 | 437.95 | **+2.58% HARM** | −0.19% | [+4.30, +17.60] sig harm |
| 72h | 688.54 | 707.56 | **+2.76% HARM** | +0.80% | [+1.83, +34.59] sig harm |

*odd-horizon inertness: stride-2 cache leaves no usable lag residual (as in RQ1).

Reading (PRELIMINARY, single seed): the full core-idea chain WORKS at
12–24 h but is (i) dominated everywhere by the cheap ridge corrector
(−5.9% vs −4.5% at 12 h) and (ii) SIGNIFICANTLY HARMFUL at 48–72 h where
ridge stays inert. This refines the cyclonepath E7 negative (full-capacity
base, no gain): even in the harvestable regime the second-stage learner's
identity is not the point — the residual structure is — and an
unconstrained in-context learner chases noise at horizons where structure
is absent, while ridge's regularization keeps it inert. Website keeps
C1-on-TabPFN as the "core idea chain" method; C2 is documented, not
featured.



## k-cadence staleness on cyclone tracks (PRELIMINARY; core-idea link ④)

Artifact: `artifacts/tables/tabpfn_kcadence.csv`; manifest
tabpfn-kcadence-* (40 min CPU, batched). Design: stale TabPFN base at
issue t carries the forecast issued at t−k (features anchored at t−k,
horizon h′=k+h); C1 ridge corrector sees FRESH t information; k ∈
{0,1,4,8}; corrector retrained per k on CAL stale residuals; paired
storm-block CIs; n_origins 1,369→917 with k (anchor availability).

**Dose-response — corrector gain (ΔMAE %), significance in parentheses:**

| horizon | k=0 | k=1 | k=4 | k=8 |
|---|---|---|---|---|
| 12h | −5.89 (sig) | −7.69 (sig) | −24.39 (sig) | **−34.36 (sig)** |
| 24h | −3.24 (sig) | −4.95 (sig) | −18.55 (sig) | **−27.24 (sig)** |
| 48h | −0.19 (n.s.) | −1.80 (sig) | −10.50 (sig) | **−21.35 (sig)** |
| 72h | +0.80 (n.s.) | +0.01 (n.s.) | −6.03 (sig) | **−12.51 (sig)** |

The fresh-regime no-op at ≥48 h OPENS with staleness: at k=8 even 72 h
gains 12.5%. The ETTh1 dose-response mechanism (staleness manufactures
predictable residual structure) TRANSFERS to cyclone tracks.

**Deployment frontier (honest):** the stale base itself degrades fast
(12 h MAE 84.6→508.6 km at k=8); the corrector recovers 29–41% of the
degradation (12 h: 508.6→333.8) but NEVER reaches fresh-base accuracy —
unlike ETTh1 (corrected k=16 beat fresh at 1/16 cost), the cyclone
crossover does not occur at k ≤ 8. Practical reading: on tracks, keep
the base fresh; the corrector's value here is capacity-gap filling
(RQ1), not staleness recovery. Known gaps: resid lag-1 ACF diagnostic
returned NaN (TODO: recompute directly from the stale residual stream);
k ≤ 8 keeps the h/12 feature within 1.7× of the trained range.



## Phase 2 smoke — TabPFN-3.5 explicit lag table (SMOKE, NOT a benchmark)

Artifact: `artifacts/tables/tabpfn_smoke.csv`; manifest
`artifacts/manifests/tabpfn-smoke-1792333517.json` (run under the PINNED
prior venv: tabpfn 9.1.0, torch 2.14.1 CPU, checkpoint
tabpfn-v3.5-20260909 sha256 ece4d67e…, n_estimators=2, 5.1 s total).

Setup: 40 TRAIN storms (2014–15) → 3,664 rows; explicit lag-table features
(lat/lon lags 0–2, hour sin/cos, cos lat, h/12); one regressor per
(east, north) tangent displacement; batched predict (360 rows); eval on
3 mechanically-chosen cal storms (2016–19), up to 10 origins each.

| horizon | persistence | const-velocity | TabPFN lag-table (MAE km) |
|---|---|---|---|
| 6h | 111.6 | **33.4** | 43.2 |
| 24h | 481.0 | **180.9** | 206.4 |
| 48h | 1038.2 | **504.7** | 533.8 |
| 72h | 1636.5 | 913.2 | **894.0** |

Reading (SMOKE only): pipeline works end-to-end under the pinned
environment (checkpoint resolution, fit, batched predict, sphere Exp
mapping, metrics, manifest). With a 40-storm training budget the lag-table
TabPFN trails const-velocity except at 72 h — NO competitiveness conclusion;
the proper Phase-2 protocol (full train split, per-h or cadence-aware
design, refresh ablation) is not yet run and needs approved compute.

## 2026-10-21 — Local CYCLONE website delivery

New website-export protocol (PRELIMINARY cache reanalysis, not new model runs): geometry and C1 trained on 2016–17; rank calibration 2018–19; 1,369 test origins 2020–25. At H=72h / MaxScore / nominal 90%, Base empirical whole-trajectory coverage 88.31%; C1 88.02%. Not an efficiency victory and not a nominal-coverage guarantee. This is separately labeled from the older `p3_tabpfn.json` results. Inputs/outputs and SHA-256 hashes: `web/audit/export-manifest.json`; exporter `web/tools/export_research_site.py`. All original numerical artifacts preserved.

Paired endpoint-MAE diagnostic after user feedback: C1 vs Base gains at 12/24/48/72h = +4.67/+2.00/−1.32/−3.09% (positive = better); vs velocity = +5.83/+12.78/+20.67/+24.43%. Exploratory paired storm bootstrap (124 storms, 2,000 draws, seed 20261021) gives 12h C1-vs-Base gain interval [2.35,6.97]%, 24h [−0.40,4.42]%, 72h [−5.32,−0.90]%. Does not guarantee inferential validity under inter-storm dependence/drift. Default HAIKUI case underperforms velocity and remains visible. Exact same-h lag lookup combined with stride2 yields zero 6h correction and fewer nonzero long-horizon corrections; this is an implementation limitation, not a demonstrated complete cause of long-horizon failure. Full-X second-stage TabPFN and independent no-harm gate remain open. Reproducible JSON: `web/audit/performance-summary.json`.

## 2026-10-21 — Full-X causal repair and real two-layer TabPFN

Supersedes earlier website causal assurances for legacy TabPFN paths: the 3-position feature builder allowed i=1, using pts[-1]; 124 old test origins are affected. A guard now rejects insufficient history. Historical numeric artifacts are preserved, labeled for audit and not reused as strict evidence. The new base is refit from 10,000 horizon-stratified causal rows with labels before 2016. New two-layer C1-TabPFN uses all 10 original X columns plus verified residual ENU, label age and mask (14); latest verified sparse-cache lag retrieval works at 6h. Controls: same-full-X ridge and X-only second TabPFN. Context fit 2016 (210 origins/2,520 rows), gate 2017 (231), geometry 2018 (363), rank calibration 2019 (346), test 1,245 origins/114 storms (eligible 2020–2024). Prior test/validation seasons have been exposed; EXPLORATORY, not confirmatory. All horizon gates select Base fallback; raw second-layer predictions are available but do not improve MAE in this run. Coverage-matched tangent-volume diagnostics explicitly use posthoc test thresholds, never deployed. Report: docs/FULLX_REPAIR_V1_REPORT.md; artifacts: artifacts/fullx_repair_v1/; new default website protocol, old ones retained for audit.

## 2026-10-21 — Main conformal research scope and protocol reconciliation

User clarified the primary objective: time-series TabPFN conformal coverage and matched-coverage efficiency; tropical-cyclone website is an application. MAE deployment gate is secondary, not a scientific test of no residual information. The fullx v1 layer was real TabPFN but not a faithful migration of the earlier rolling four-lag, issued-base-input, adaptive-covariance/calibration chain. ECL C1_OBS_LR is TabPFN with lagged residuals (LR does not mean ridge); Stage14 used v3, not v3.5. ECL PI+ original 328-point cells exactly replayed. Final128 aligned cells: Base92.1875%, C193.75%, log-sizes2587.2041/2530.0541; exploratory Pareto direction, not exact matched-coverage proof. Typhoon delayed rolling thresholds improve coverage by themselves; no residual efficiency claim. Mean/median and numerical query audits recorded separately, with one strict single/batch tolerance failure (~0.017km) retained. Current original experiments and v1 gates unchanged. New report docs/RESEARCH_RECONCILIATION_2026-10-21.md; diagnostic artifacts artifacts/reconciliation_20261021/; website now has Research Overview and Typhoon Application tabs. 65 Python and24 JavaScript invariant/data tests passed; existing21 NumPy warnings remain. Faithful rolling v2 and v3.5 synthetic confirmation not run in this diagnostic turn.


## 2026-10-21 · Rolling v2 completed / exploratory negative efficiency

Actual local TabPFN-3.5 rolling C0/C1 inference completed:12/28features,4verifiedlags,ctx320/refresh32,median,1estimator,seed42. Same114storms/1245safeorigins;6–24h only. Identical delayed rolling geometry128/score256 per arm; fixed2018/2019 references retained. At24h MaxScore90%: Basefixed coverage87.4699%, Baseadaptive89.7189%, C1adaptive89.0763%. Exactly matched empirical coverage90.0402%: C1/Base geometricmeanV1.4011×;ΔlogV0.3373,pairedstormbootstrap95%[-0.0446,0.6669]. Mahalanobis24hVratio2.102×,CIΔlogV[0.3622,1.1444]. NoC1efficiencyadvantage; calibrationbenefit separated. v1 gate unchanged; v2 rawλ=1 preregistered, no new validation-tuned deployment gate. Validation2017 separately reported, no test tuning. Numerics48samples:otherqueryperturb0,maxsingle/batch0.0021439km (<0.1kmauditthreshold);v1stricterfailurepreserved. Website defaultsv2,coverage/efficiency beforesecondaryMAE; allprotocolsretained. Details:docs/ROLLING_REPAIR_V2_REPORT.md andartifacts/rolling_repair_v2/manifest.json.


## 2026-10-21 · Original-code typhoon replay / authorized window shortening

Completed48storm-kpairs across8independentlongstorms;test5storms/60commontargets. NativeoldTSBase/C0/C1/M0/PI+directcalls;no3positionfeatures, poolingorMAEgate. Onlyauthorizedwindows shortened24learn/12warmup/12eval,12geometry/scorehistory,4scorestartup;originalmodelcaps/seeds/estimators/refreshrulesunchanged. k32C1originalcoordinateRMSE−22.30%vsBase,−46.65%vsC0;PI+coverage98.33%→95.00%. Ellipse-preservingposthoc90%area ratio0.98884,CIΔlogsize[−.4426,.6286],nofirmextraefficiencyclaim. SecondarywidthmatchingintroducesinnerholesinovercoveragePI+andisretainedonlyasdiagnostic;notusedasprimaryorformap. k16point−21.88%butcoverage31.67%;smallkmixed. k16/k32Baseevaluationforecastsidenticaldueshortwindowalignment. Causalaudit48caches/2304C1features/144PIreplays/nativeBasefuturevaluetestpassed;sourcehashesunchanged. Originalreplaypageadded, historicalvariantsretained. Fullreport:docs/ORIGINAL_SHORT_REPLAY_REPORT.md.
