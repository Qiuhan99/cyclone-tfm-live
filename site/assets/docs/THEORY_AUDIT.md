# THEORY AUDIT — draft(1).md claim ledger (Phase 0)

Format (master prompt §4): Claim | Current text | Check/counterexample |
Corrected statement | Proof/test | Status | Citation.
Numerical evidence: `artifacts/tables/theory_audit_checks.json`; hand
derivations inline below. Status vocabulary: PROVEN / REFUTED /
REPLICATED / NEEDS-ASSUMPTIONS / OPEN / WORDING-FIX.

---

## T0.2 — Lemma 1 staleness variance (OFF-BY-ONE: REPLICATED)

**Draft text.** `Var(Δ_t | d_t=g) = σ_ξ² ρ²(1−ρ^{2g})/(1−ρ²)` with
representation `Δ_t = σ_ξ Σ_{i=1}^{g} ρ^{i} η_{t−i}`, `d_t = t − r_m`.

**Hand derivation (AR(1), oracle base).** `Y_t = ρY_{t−1} + σ_ξη_t`;
`E[Y_t|F_{t−1}] = ρY_{t−1}`; forecast issued at refresh `r_m = t−g` with
data through `r_m`: `E[Y_t|F_{r_m}] = ρ^{g}Y_{r_m}`. Hence
`Δ_t = ρY_{t−1} − ρ^{g}Y_{r_m}`. Expanding
`Y_{t−1} = ρ^{g−1}Y_{r_m} + Σ_{i=1}^{g−1}ρ^{i−1}ξ_{t−i}`:
`Δ_t = Σ_{i=1}^{g−1} ρ^{i} ξ_{t−i}`.

- Correct law: `Var(Δ_t|g) = σ_ξ² Σ_{i=1}^{g−1}ρ^{2i} = σ_ξ² ρ²(1−ρ^{2(g−1)})/(1−ρ²)`, **zero for g ≤ 1**.
- Draft law equals `Σ_{i=1}^{g}ρ^{2i}` = correct + one extra term
  `ρ^{2g}σ_ξ²` at every g: it includes `ξ_{r_m} = ξ_{t−g}`, which the
  F_{r_m}-measurable oracle base has already seen. The roadmap's suspicion
  ("紧随刷新后的第一步没有中间新观测") is confirmed: at `g=1`,
  `E[Y_t|F_{t−1}] = E[Y_t|F_{r_m}]` so Δ_t ≡ 0, while the draft predicts
  `ρ²σ_ξ² > 0`.
- Monte Carlo (script T0.2, 200k paths, ρ=0.6): matches corrected form
  within MC error at every g ∈ {1,2,3,8}; draft exceeds it by exactly
  `ρ^{2g}σ_ξ²` (see JSON `T0.2_staleness_indexing.rows`).
- **Fitted vs oracle base**: if the base is not the conditional mean
  (estimated ρ̂, featurization gaps), `R_t = Δ_t + (ρ−ρ̂)Y_{t−1}-type +
  ε_t`; the extra terms are estimation error, NOT staleness. Any proof
  must either assume an oracle base or add an estimation-error term.
- Monotonicity in g survives the correction (sum still grows in g), so the
  draft's qualitative story stands; the SCCA feedforward curve
  `q*(g)=q₀√(1+A(1−e^{−βg}))` should be refit with `g−1` (and note
  `q*(1)=q₀` now exactly).

**Status: REFUTED as stated / corrected form PROVEN (oracle base) + REPLICATED (MC).**

## T0.3 — variance ⇒ quantile monotonicity (REFUTED in general; holds under scale family)

**Draft text.** Lemma 1 "Consequently … conditional score quantiles are
nondecreasing in g", justified by "quantiles of `c‖Z‖` are monotone in c".

**Check.** The `c‖Z‖` argument only covers pure rescaling of a FIXED Z.
Across g, `Δ_g` changes shape (more summands), not just scale. Counterexample
(script T0.3): Δ₁ = M w.p. 0.11 else 0 (Var 0.11M², q90 = M) vs
Δ₂ = M/2 w.p. 0.50 else 0 (Var 0.125M² > 0.11M², q90 = M/2 < M). Variance up,
90th percentile down. Gaussian positive result verified: for AR(1) Gaussian
innovations `Δ_g + ε` is Gaussian with variance `v_g + σ²` nondecreasing in
g ⇒ |·| quantiles nondecreasing (script confirms numerically).

**Corrected statement.** Under Gaussian (or fixed-shape scale-family)
innovations and position-independent Σ̂, per-position score quantiles are
monotone in g; without such an assumption the implication is false.

**Status: REFUTED as stated; NEEDS-ASSUMPTIONS (Gaussian/elliptical) version true.**

## T0.4 — `‖Σ‖ ≥ λ` (REFUTED; replace by λ_min)

**Draft text.** Assumption 3: `‖Σ‖ ≥ λ̲ > 0` "satisfied by Ledoit–Wolf".

**Check.** Operator norm bounds the LARGEST eigenvalue; invertibility needs
the smallest. Σ = diag(1e6, 1e−8) has ‖Σ‖ = 1e6 yet cond = 1e14: the
Mahalanobis score concentrates 1e8× on the near-null direction; conversely
Σ = 1e−8·I has tiny norm and perfect conditioning. Ledoit–Wolf shrinkage
does give `λ_min(Σ̂) ≥ shrink·(tr/p) > 0` — the assumption is *true for the
estimator used* but stated on the wrong quantity; the Theorem-1/2 constants
that use `‖Σ̂^{-1}‖` implicitly require the λ_min bound.

**Corrected statement.** Assume `λ_min(Σ), λ_min(Σ̂) ≥ c > 0`; then
`|u^⊤Σ^{-1}u − u^⊤Σ̂^{-1}u| ≤ ‖u‖²‖Σ^{-1}‖‖Σ̂−Σ‖‖Σ̂^{-1}‖ ≤ ‖u‖²‖Σ̂−Σ‖/c²`
(resolvent identity; paper-skeleton Prop 2). Numerical toy in JSON T0.4.

**Status: REFUTED as stated; corrected resolvent bound PROVEN.**

## T0.5 — "R(x) deterministic function of x" (WORDING-FIX)

With random response Y, `R = Y − μ̂(X)` is a random variable for each x;
deterministic objects are `m(x) = E[R|x]` and the realized residual
conditional on (X, Y). Refactor draft §3.1 wording accordingly (observed
residual / conditional mean / innovation triple). No computation needed.

**Status: WORDING-FIX (required before any theorem reuse).**

## T0.6 — "Channel coverage law" (definition OK; attribution conflation; lower bound OPEN)

**Draft text.** Prop 1 defines `G(φ)` as the residual-variance fraction
explained by `(φ, R-lags)` **beyond φ alone** — the correct nested quantity
(script T0.6 verifies `E‖E[R|H]−E[R|G]‖²` decomposition and Pythagoras to
1e−2 on a 400k-sample control).

**Problems.** (i) The draft's empirical gains (Table 3, §5.7) are measured
against the ZERO corrector — total-vs-zero, not nested increment; when the
base φ already explains part of R (e.g., calendar in the 43-feature table),
the two attributions differ, and the "law" reading needs both numbers.
(ii) The lower bound `G(φ) ≥ ρ²(1−ρ^{2(k−1)})/(1−ρ²)·Var(ξ)/Var(R)` is
declared "immediate from the law of total variance and Lemma 1" — it is
not: it needs (a) exact AR(1) residual dynamics with persistence ρ,
(b) that the lag channel is the ONLY excluded information, (c) the same
off-by-one correction as T0.2 (`k−1` vs `k` indices), and (d) independence
of ξ from the conditioning set. Without (a)–(d) stated, OPEN.

**Status: definition PARTIALLY CORRECT; empirical attribution conflated; lower bound OPEN (do not cite as theorem).**

## T0.7 — Prop 2 "volume-optimal shrinkage is conservative" (NOT ENTAILED)

The draft derives `u(c) ≤ |ρ−c|q_R + q_ξ` (quantile subadditivity) and
concludes `c* < ρ`. Minimizing an upper bound on the objective does not
bound the minimizer of the objective: the bound's slack may be
asymmetric in c in exactly the wrong way. A valid route needs either
exact quantiles under a parametric family, or stochastic-order arguments
(assumptions stronger than "heavy-tailed R, light-tailed ξ").

**Status: REFUTED as an inference; keep as TESTABLE HYPOTHESIS; do not label as Proposition.**

## T0.8 — Split vs online guarantees (attribution ledger)

- Split CP on whole-trajectory scores: exact finite-sample marginal
  coverage ≥ 1−α IF calibration/test trajectory units are exchangeable
  (independent storms as units). Rolling windows within one storm:
  overlapping multi-step labels ⇒ dependence ⇒ guarantee becomes a gap
  bound, not exact.
- ACI (Gibbs–Candès): long-run average miscoverage ≤ α a.s. (α_t may exit
  [0,1] without clipping; with clipping the regret statement changes
  form). NOT finite-sample, NOT conditional.
- PID: adds P/I/D + scorecaster; same long-run flavour.
- Draft Corollary 1 (per-position ACI) inherits exactly ACI's long-run
  statement per position; "ε=0 specialization of state-aware ACI" is a
  fair structural remark, but no finite-sample claim may be attached.
- Draft's empirical "conservative layer lifts all cells to ≥0.90"
  (final_conformal.csv: coverage 0.899–0.921) is a post-hoc calibration
  choice, documented as such — fine, but comparisons are coverage-matched
  only to ≈±0.02, and any "smaller volume" claim must state the achieved
  coverage in the same table (draft does; keep enforcing).

**Status: LEDGERED; wording constraints for paper reuse.**

## T0.9 — Electricity 321-dim joint ellipsoid (numbers backed; two caveats)

- Log-volumes in draft Table 1/2 match
  `../tabpfn_residual_realdata/results/electricity/final_conformal.csv`
  within 0.1 nat for all 9 spot-checked cells (JSON T0.9), e.g.
  R pooled+ 2646.80 / e(C1)+PI+ 2514.06 (draft 2514).
- Annulus log-volume formula `log V = log v_p + p log q_hi +
  log(1−(q_lo/q_hi)^p) + ½log|Σ̂|` is algebraically correct (shell in
  whitened coordinates).
- Caveat 1: achieved coverage varies 0.899–0.921 across rows ⇒
  coverage-matching is approximate; per roadmap §2.8 the paper must
  report coverage alongside size in the same table and ideally interpolate
  to a fixed achieved coverage.
- Caveat 2 (**resolved P0.5**): "side/dim" IS `geo_side` in
  `staleness_conformal.py:189` — `exp(mean log-volume / p)`, the geometric
  mean per-coordinate linear size; the draft's ratio column is each row's
  geo_side relative to the R pooled+ row. Definition verified from source.
- Positive-definiteness: **new finding** — the raw 321-dim sample covariance on
  the 328 finite eval-window rows of `base_residuals.parquet` has
  `λ_min ≈ −2.7e−15` (numerically singular at n≈p): Ledoit–Wolf shrinkage is
  load-bearing for invertibility on this benchmark, which concretely
  reinforces the T0.4 lesson that λ_min control (not ‖Σ‖) is the operative
  assumption (JSON `T0.9_electricity.covariance_pd_check`).

**Status: ARTIFACT-BACKED (log-volumes), caveats LEDGERED.**

## T0.1 — "frozen native 90% coverage = 64%" (ARTIFACT-BACKED)

`../TabPFN&PID/results/m6_formal_synthetic_benchmark_20260820T122929Z_843f7b69cb/analysis/main_table.csv`:
`base_family=tabpfn_v3, context_policy=frozen, method=raw, coverage=0.9`
rows average **0.640** across the 7 scenarios (per-scenario rates in JSON).
Denominator = evaluation windows; 5 seeds/mechanism; native predictive
distribution, NOT any CP method. Re-running the suite: Phase 2 (needs
TabPFN compute + the frozen protocol harness).

**Status: ARTIFACT-BACKED; REPLICATED pending Phase-2 rerun.**

## T0.10 — method-variant statuses (artifact map)

| Draft item | Backing artifact | Match |
|---|---|---|
| ETTh1 dose–response, gain 80.4% @ k=32, lag-1 0.042→0.722 | `../tabpfn_residual_realdata/logs/freshness.log` (k=32 row: 0.804408, 0.722140) | exact |
| corrected 1.307 vs fresh 1.504 @ k=16 | freshness.log k=16 RMSE 2.668 (base) — corrected-1.307 number not found in this log | PARTIAL (located in freshness run outputs; verify before reuse) |
| bare table 644→525 RMSE, P8 refuted 21% | `results/bare_vs_ts_e5.md`, `results/electricity_bare/` | consistent (spot-checked) |
| PCA null control ≈ base | final_conformal.csv e(PCA) pooled+ 2640.8 vs R pooled+ 2646.8 | consistent |
| Traffic p=862 | manifest exists (`manifest_traffic.json`), experiments incomplete | OPEN |

---

## Theorem-ledger consequences (Phase 5 prep)

### NEW Lemma A (exchangeable dependence is harmless for split CP) — PROVEN

**Statement.** Let (S_1, …, S_{n+1}) have any exchangeable joint law with
continuous margins. Then the split-CP event {S_{n+1} ≤ S_(k)} with
k = ⌈(n+1)(1−α)⌉ has probability exactly k/(n+1) ≥ 1−α.

**Proof.** Exchangeability makes the rank of S_{n+1} among the n+1 values
uniform on {1, …, n+1} (permutation-invariance of the joint law); the
event is {rank ≤ k}. ∎

**Consequence.** Positively dependent but exchangeable storm scores
(equicorrelated annual factors) do NOT explain coverage loss — contrary to
our own initial attribution. This lemma is elementary but guards the paper
against a common misdiagnosis (and corrects our P3x interpretation: the
within-period under-coverage cannot be pure dependence).

### NEW Proposition B (mixture-scale coverage gap) — PROVEN + MC check

**Setting.** Scores S = σ_Y · Z, Z ~ F₀ i.i.d. continuous (e.g. standard
Gaussian), year-type Y ∈ {1,2} with scales σ_1 < σ_2; calibration mixture
weight p = P(Y=2|cal), test weight q = P(Y=2|test); Q_p = the cal-mixture
(1−α)-quantile used by split CP.

**Claim.** Coverage c(p,q) = (1−q)F₀(Q_p/σ₁) + q F₀(Q_p/σ₂) satisfies:
(i) c(p,p) = 1−α exactly; (ii) ∂c/∂q = F₀(Q_p/σ₂) − F₀(Q_p/σ₁) < 0 and
∂c/∂p > 0 (Q_p increasing in p by stochastic order); hence the gap
c(p,q) − (1−α) has the sign of p − q and grows monotonically in |p−q| and
in σ₂/σ₁. Coverage loss therefore REQUIRES marginal heterogeneity across
units (mixture-weight or scale mismatch), not dependence per se.

**Proof.** (i) plug-in: with q = p the test score follows the calibration
mixture. (ii) partials as computed; Q_p′ > 0 because the mixture CDF at x
is decreasing in p (first-order stochastic order of σ₂ over σ₁). ∎

**Fit to our data.** Cross-period storm-unit under-coverage (0.847/0.839)
with 2020–25 more active than 2016–19 (q > p in scale): predicted sign ✓.
Within-period even/odd halves share year mixes → smaller/noisy gap
(0.831/0.780 with Wilson half-width ≈ ±0.08) ✓. Rolling CP re-mixes the
calibration window toward the test mix → 0.893 ✓. Falsifiable prediction:
conditioning the split on year-activity balance should close the gap.

**Empirical closure (2026-10-19, `artifacts/tables/stratified_cp.json`).**
Intensity-stratified split (storm peak-wind terciles, boundaries from cal
only) closes most of the gap: all-origins coverage 0.886→0.897 (base),
0.878→0.891 (corr); the weakest-storm bin still under-covers (0.850/0.863).
Year-activity oracle weighting with mild weights (0.94–1.13) does NOT move
coverage — the operative mixture dimension is STORM INTENSITY, not
year-level activity. This refines the mechanism's empirical locus (and the
oracle variant is a probe, not a method).

**MC check.** `scripts/p5_mixture_check.py` →
`artifacts/tables/p5_mixture_check.json`: Gaussian mixture, grid over
(q−p) ∈ {−0.2, −0.1, 0, 0.1, 0.2} × σ₂/σ₁ ∈ {1, 1.5, 2}; MC coverage
matches the formula within MC error; monotonicity asserted (test).

**Status.** Lemma A PROVEN (elementary). Proposition B PROVEN (elementary)
+ REPLICATED (MC). Neither is deep; their value is corrective — they
pinpoint WHERE the theory target lives (between-unit marginal
heterogeneity), redirecting Theorem-2 effort away from mixing-coefficient
bounds for dependence alone.

### NEW Prop-3 counterexample (MSE improves, conformal quantile worsens) — CONSTRUCTED

Skeleton Prop 3 requires showing that MSE improvement does not imply
volume/quantile improvement. Construction (zero-mean innovation,
probabilities strictly inside atoms so quantile conventions cannot flip
the comparison): predictable conditional mean m(x) ≡ 1; innovation
ζ = −0.6 w.p. 0.91, +6.0667 w.p. 0.09 (E[ζ] = 0).

- Uncorrected residual R = 1 + ζ ∈ {0.4, 7.0667}: E[R²] = 4.64; |R| has
  P(≤ 0.4) = 0.91 ⇒ q90(|R|) = 0.4.
- Corrected residual ζ: E[ζ²] = 3.64 < 4.64 (MSE improves by 21.5%);
  |ζ| has P(≤ 0.6) = 0.91 ⇒ q90(|ζ|) = 0.6 > 0.4.

So removing the oracle-known conditional mean REDUCES MSE by 21.5% while
WIDENING the 90% conformal radius by 50%. Volume claims for stream
correction therefore need stochastic-order/scale-family conditions
beyond MSE (the same lesson as T0.3, now in correction form). Verified
numerically in `tests/test_p5_theory.py::test_prop3_counterexample`.

## Original draft-fix consequences (carried from Phase 0)

1. Lemma 1 must be restated with corrected indexing + oracle-base assumption
   (or explicit estimation-error term). Monotonicity survives.
2. Theorem 1/2 constants: replace operator-norm with λ_min; resolvent bound
   as in T0.4 (this is paper-skeleton Prop 2, now with a complete proof).
3. Prop 1 (draft) usable only with both total-vs-zero AND nested-increment
   numbers reported; lower bound → conjecture until (a)–(d) proven.
4. Prop 2 (draft) → hypothesis; design the volume-vs-MSE experiment to test
   it rather than cite it.
5. New attempted results stay as in paper skeleton §5 (Theorem 2 dependent
   coverage gap; Prop 3 volume-under-correction with counterexample duty).

## 2026-10-21 — Local CYCLONE website delivery

Supplementary audit in `../web/RESEARCH_REVIEW_2026-10-21.md` §4 narrows the mixture-scale statement: the population identity is exact, but the coverage-gap sign requires a nonnegative calibration quantile (or suitable nonnegative score support); strictness requires strict CDF growth on the interval. A finite random rank threshold is not the population quantile. No new theorem claimed this run. UI distinguishes random R from conditional mean m and forbids using current unobserved residuals as features. MSE improvement is not treated as a quantile/volume improvement guarantee.

## 2026-10-21 — Full-X causal repair and real two-layer TabPFN

Supersedes earlier website causal assurances for legacy TabPFN paths: the 3-position feature builder allowed i=1, using pts[-1]; 124 old test origins are affected. A guard now rejects insufficient history. Historical numeric artifacts are preserved, labeled for audit and not reused as strict evidence. The new base is refit from 10,000 horizon-stratified causal rows with labels before 2016. New two-layer C1-TabPFN uses all 10 original X columns plus verified residual ENU, label age and mask (14); latest verified sparse-cache lag retrieval works at 6h. Controls: same-full-X ridge and X-only second TabPFN. Context fit 2016 (210 origins/2,520 rows), gate 2017 (231), geometry 2018 (363), rank calibration 2019 (346), test 1,245 origins/114 storms (eligible 2020–2024). Prior test/validation seasons have been exposed; EXPLORATORY, not confirmatory. All horizon gates select Base fallback; raw second-layer predictions are available but do not improve MAE in this run. Coverage-matched tangent-volume diagnostics explicitly use posthoc test thresholds, never deployed. Report: docs/FULLX_REPAIR_V1_REPORT.md; artifacts: artifacts/fullx_repair_v1/; new default website protocol, old ones retained for audit.

## 2026-10-21 — Main conformal research scope and protocol reconciliation

User clarified the primary objective: time-series TabPFN conformal coverage and matched-coverage efficiency; tropical-cyclone website is an application. MAE deployment gate is secondary, not a scientific test of no residual information. The fullx v1 layer was real TabPFN but not a faithful migration of the earlier rolling four-lag, issued-base-input, adaptive-covariance/calibration chain. ECL C1_OBS_LR is TabPFN with lagged residuals (LR does not mean ridge); Stage14 used v3, not v3.5. ECL PI+ original 328-point cells exactly replayed. Final128 aligned cells: Base92.1875%, C193.75%, log-sizes2587.2041/2530.0541; exploratory Pareto direction, not exact matched-coverage proof. Typhoon delayed rolling thresholds improve coverage by themselves; no residual efficiency claim. Mean/median and numerical query audits recorded separately, with one strict single/batch tolerance failure (~0.017km) retained. Current original experiments and v1 gates unchanged. New report docs/RESEARCH_RECONCILIATION_2026-10-21.md; diagnostic artifacts artifacts/reconciliation_20261021/; website now has Research Overview and Typhoon Application tabs. 65 Python and24 JavaScript invariant/data tests passed; existing21 NumPy warnings remain. Faithful rolling v2 and v3.5 synthetic confirmation not run in this diagnostic turn.
