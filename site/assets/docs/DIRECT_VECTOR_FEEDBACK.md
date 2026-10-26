# TabPFN + Vector Residual Feedback

The active protocol is `direct_vector_feedback_v1`. This document defines the research method; archived configurations do not override it.

1. Form issue-time features X from nine observed fixes over the preceding 48 hours. The retained F2 features include motion, intensity, season and training-only climatology. Future observations are excluded.
2. Represent the future location as the two-component displacement u = Log_issue(Y), in east/north kilometres.
3. The first frozen TabPFN directly predicts v = f(X). Its labels are u. No constant-velocity forecast is subtracted from the labels or added to its output.
4. Once truth matures, compute the vector residual r = u − v. For the current prediction, H contains up to four mature residual vectors from the same storm and lead, transported into the current issue frame, with age and availability fields. The current unknown residual cannot be an input.
5. A second frozen TabPFN predicts the current residual from [X, H]. Its target is r. Its input has 68 fields: 52 original features plus four residual slots of four fields each. The baseline prediction is not an additional input field.
6. Add the vector correction: v_RF = v + g(X, H). There is no gate, shrinkage or tuned correction multiplier. Convert each displacement back to a location using Exp_issue.
7. Calibrate the baseline and corrected forecasts separately using only mature errors. Live marginal circles retain the existing last-100-score rule. The endpoint benchmark retains the existing geometry-128 / score-256 circle-and-ellipse rule. No conformal tuning was introduced with this method correction.

The base contexts remain 1,020 labelled historical rows through 2015. The residual model uses the same 320 mature 2016 rows. F2 follows the existing 2017 direct-target feature selection; 2019 supplies calibration warmup. Model weights remain frozen. This is not inference without historical labels.

## Naming and provenance

| Role | Public name | Immutable ID |
|---|---|---|
| Direct base predictor | TabPFN baseline | `TabPFN Direct-F2` |
| Proposed method | Vector residual feedback | `TabPFN Direct-F2 + RF` |
| Position-only reference | TabPFN · position-only | `TabPFN Direct-F0` |

Earlier `TabPFN CV-*` files retain their original numbers, inputs and identifiers. They use a constant-velocity target offset and are labelled **CV archive**. They are not the active core method. Earlier rolling-v2 story maps also retain their original protocol and are labelled historical illustrations.

The new benchmark uses genuine cached direct-ENU Chronos-Bolt-small, Chronos-2 and Moirai forecasts with the same endpoint calibration procedure. Historical labelled contexts and F2 covariates differ between model families. CMC, UKM and NGX comparisons retain the original common issue/valid-time intersection and source aid IDs. TimeGPT remains pending credentials.

New model IDs prevent old CV results from being pooled with the direct method in prospective verification. A newly computed forecast is not a forecast published before its historical target time. Previous ledgers remain intact.

Coverage and region efficiency are evaluated separately from point error. These dependent, previously inspected cohorts support exploratory empirical findings, not an automatic distribution-free guarantee under arbitrary drift. All result directions are retained.

Any future change to the first-stage target, residual definition, correction input or correction rule requires an explicit research-method decision and a new versioned protocol.
