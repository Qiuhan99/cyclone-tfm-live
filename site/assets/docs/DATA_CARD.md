# DATA CARD — IBTrACS v04r01 (Western Pacific)

**Status:** downloaded and checksum-verified prior copy, reused by path. 2026-10-18.

## Source

- Provider: NOAA NCEI — International Best Track Archive for Climate
  Stewardship (IBTrACS), version v04r01.
- Landing page: https://www.ncei.noaa.gov/products/international-best-track-archive
- CSV directory:
  https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/csv/
- Local files (the user's own downloads, **canonical source since
  2026-10-20**: `Test/Data/Typhone Data/`, previously referenced from the
  byte-identical copies first registered in
  `../cyclonepath-tabpfn/data/raw/ibtracs/`):
  - `ibtracs.WP.list.v04r01.csv` (114,604,701 B,
    sha256 `123034b1c3d2e180a6bb5ba3de696d196a81cb9c85113893382f336f351e62cd`)
  - `ibtracs.last3years.list.v04r01.csv` (11,506,752 B,
    sha256 `f455e9a7b4e16d4971c7b1a1b67a135d9ee2c33f192a7437f973e34b308f5b42`)
  - `bst_all.txt` (JMA best track, 6,017,160 B — present, unused so far)
  - provenance manifest: `../cyclonepath-tabpfn/data/manifests/raw_checksums.csv`
    (access recorded 2026-10-15T12:34:12Z); re-verified against the
    user's copies on 2026-10-20 (hashes identical; pipeline re-run OK).
- License / terms: IBTrACS is a public, open archive of official best-track
  data from WMO RSMCs and TC warning centres; used here for research
  reproduction. No redistribution is performed by this repo; the raw CSVs
  are NOT copied (referenced by absolute path in `configs/mvp.yaml`).

## Processing (this project)

`scripts/prepare_ibtracs.py` → `data/processed/ibtracs_wp.parquet`
(run manifest `artifacts/manifests/prepare-ibtracs-*.json`):

- skip units row (`skiprows=[1]`); require columns SID/SEASON/BASIN/NAME/
  ISO_TIME/LAT/LON/TRACK_TYPE;
- basin WP, `TRACK_TYPE == main` only (spurs/provisional excluded);
- drop rows with missing time/lat/lon; longitude normalised to [-180, 180);
- keep fixes on the 00/06/12/18 UTC grid; **no interpolation**; duplicate
  storm-time rows keep first;
- within-storm contiguous `t_idx` (exact 6 h spacing); windows never bridge gaps;
- chronological storm-level splits by SEASON: train ≤ 2015 (2,510 storms),
  calibration 2016–2019 (135), test 2020–2025 (138); storms never cross
  splits (verified by tests + script).

Result: 90,961 fixes, 2,783 storms (1945–2025).

## Caveats

- Best-track positions are RETROSPECTIVE analysis truth, not real-time
  observations; issuing "forecasts" from past fixes is a hindcast protocol.
- Agency blends (WMO_* columns) may mix reporting standards across decades;
  early-decade fixes are sparser — the 6 h grid filter does not fill gaps.
- Wind/pressure fields unused so far (position-only Phase 1).
- SHIPS/environmental predictors: NOT acquired; deferred pending
  issue-time availability verification (roadmap §6).
- JMA `bst_all.txt` present in sibling project; not used here yet.
