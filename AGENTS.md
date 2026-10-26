# Research method and publication contract

The active method is **direct TabPFN + Vector Residual Feedback**, protocol `direct_vector_feedback_v1`. The user explicitly rejected using a constant-velocity target offset as the main method.

- Main formula: `v=f(X); r=u-v; v_RF=v+g(X,H)`. H contains only mature historical residual vectors, ages and masks. Base displacement is not an extra correction input. Current dimensions are 52 base features and 68 correction features.
- Scientific implementation, weights and labelled contexts stay in the private sibling research project. This repository publishes validated public forecasts and aggregated results.
- Do not replace the method with CV offsets, gates, scalar residuals or scaled corrections without an explicit user decision. Routine fixes inside the confirmed method do not require repeated approval.
- New method IDs must remain separate from archived CV IDs in maps, scores and prospective ledgers. Keep original experiments and unsuccessful results intact.
- The immersive story uses explicitly labelled archived rolling-v2 illustrations. Its general method formula and current benchmark links must follow the active contract; do not imply that those old numerical paths were newly computed by the direct protocol.
- Method definitions: `site/assets/docs/DIRECT_VECTOR_FEEDBACK.md`. Actual public transfer is checked by `src/cyclone_tfm_live/method_contract.py`.
