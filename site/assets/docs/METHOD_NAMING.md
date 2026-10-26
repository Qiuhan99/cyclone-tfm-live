# Method naming and research roles

The proposed method is **TabPFN + Vector Residual Feedback**. Compact map legends and tables use **Vector residual feedback** after the backbone has been introduced.

| Role | Public wording | Meaning |
|---|---|---|
| Proposed correction method | Vector residual feedback | Conditions a correction on issue-time features, Base displacement and mature historical residual vectors |
| Pretrained backbone | TabPFN | Supplies the Base prediction and the existing residual-regression heads |
| Uncertainty outer layer | Conformal calibration | Calibrates remaining errors to construct position regions |
| Target representation | Constant-velocity reference | Removes and restores a causal motion reference; a preprocessing configuration, not the method's name |

The main contrast is **TabPFN baseline** versus **Vector residual feedback**. The position-only reference and correction-only ablation remain identifiable by their research roles.

Original IDs are immutable: `TabPFN CV-F0`, `TabPFN CV-F2`, `TabPFN CV-F2 + C0` and `TabPFN CV-F2 + C1` remain in JSON, model selection values, archived reports and inference caches. CV means constant velocity, not cross-validation. F0/F2 distinguish feature sets; C0/C1 distinguish correction inputs. They are configuration identifiers, not separate proposed algorithm brands.

The shared constant-velocity representation remains visible as an experimental control so that the TSFM comparison's information is not concealed. This naming change does not alter forecasts, preprocessing, model contexts, calibration, evaluation cohorts or original experimental results. Earlier rolling-v2 illustrations and current live configurations retain their distinct provenance.
