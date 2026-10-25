# M1 真实数据审计

UCAR 原文下载成功，两个 HTTP 200。B-deck 清洗后 39 个中心时刻；A-deck 65762 个无歧义中心预测，39 cycles。最新中心 2026-10-24 00:00:00+00:00。

23日18UTC两行中心相同、最大风速95/35kt矛盾：保留唯一中心，风速设缺失、风圈不绘制；原两行完整留存 QC。A-deck位置冲突隔离；146条无效坐标/时距行未进入曲线；CARQ是分析，不作为预测模型。

上传 NOAA 文件含61行 CHAMPI，最新22日00UTC；下载时间未知，未伪称本轮联网下载。IBTrACS LAT/LON 和 WMO 强度保持各自定义；未与 UCAR 真值拼接。

|source|HTTP|bytes|sha256|downloaded_at_utc|
|---|---|---|---|---|
|bdeck|200|10040|ab22961949de1dc94d7baf076e0ef61bf21aea9e4e706460994060221bfc285f|2026-10-24T04:37:14.579921+00:00|
|adeck|200|12645766|d5354ff08160cc4bbffc137a1ccc3e1fe28476e92b0faa49624829cd0261c8a6|2026-10-24T04:37:23.050819+00:00|
|ibtracs_uploaded|uploaded|11637676|a05c71f5c3d431fb68f529796301640bc5e60ab8bef808d9877bbcb14fc79b0c|None|

原始 aid 列表：AC00, AEMN, AP01, AP02, AP03, AP04, AP05, AP06, AP07, AP08, AP09, AP10, AP11, AP12, AP13, AP14, AP15, AP16, AP17, AP18, AP19, AP20, AP21, AP22, AP23, AP24, AP25, AP26, AP27, AP28, AP29, AP30, CARQ, CC00, CEMN, CHIP, CHP2, CHP3, CHP4, CHP5, CHP6, CHP7, CMC, CP01, CP02, CP03, CP04, CP05, CP06, CP07, CP08, CP09, CP10, CP11, CP12, CP13, CP14, CP15, CP16, CP17, CP18, CP19, CP20, NC00, NEMN, NGX, NP01, NP02, NP03, NP04, NP05, NP06, NP07, NP08, NP09, NP10, NP11, NP12, NP13, NP14, NP15, NP16, NP17, NP18, NP19, NP20, UKM

本地时间均 UTC-aware；issue + lead = valid，成员未知不猜测。每个 cycle/aid/TECHNUM 单独连线。前端 raw_row/source/hash 可追溯；默认不显示未来真值。available_at 均未知，所有回放明确为 revised-truth hindcast。

复现：`../tabpfn_residual_realdata/.venv/bin/python scripts/download_champi.py --snapshot data/raw/ucar/20261024T043713Z`。新增下载不传 --snapshot，将生成新目录，旧原文不覆盖。

真实规范化 CSV 前5行（与 Parquet 同源）：
```csv
storm_id,valid_time_utc,lat_deg,lon_deg,vmax_kt,mslp_hpa
CHAMPI_2026,2026-10-14 12:00:00+00:00,9.6,161.2,30.0,1003.0
CHAMPI_2026,2026-10-14 18:00:00+00:00,10.4,160.5,30.0,1004.0
CHAMPI_2026,2026-10-15 00:00:00+00:00,10.7,159.39999999999998,30.0,1004.0
CHAMPI_2026,2026-10-15 06:00:00+00:00,10.9,158.39999999999998,30.0,1002.0
CHAMPI_2026,2026-10-15 12:00:00+00:00,11.0,157.39999999999998,35.0,1001.0
```

来源条款：UCAR 风暴主页注明 Terms of Service 与 TCGP disclaimer；本轮本地科研归档，保留来源，不将原始档案公开托管。官方地址见 manifest 与网站来源面板。