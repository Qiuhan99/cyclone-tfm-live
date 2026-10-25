# F3 实际数据获取状态

NOMADS官方0.25°GFS子区域接口： https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl 。本轮保留失败的DNS请求及随后成功请求，均有独立manifest。

仅取得一个原始GRIB ROI，尚无经过可得性审计的完整训练/验证/校准/测试队列；当前环境未安装ecCodes/cfgrib/pygrib解码器，未解码、未计算真实场特征、未进入模型，也未在地图绘制环境箭头。请求层次不等于已核实全部场实际存在。

成功档案：`data/raw/gfs/20261024T052558Z`。
```json
{
  "url": "https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl?file=gfs.t12z.pgrb2.0p25.f000&dir=%2Fgfs.20261023%2F12%2Fatmos&var_UGRD=on&var_VGRD=on&subregion=&leftlon=110&rightlon=165&bottomlat=5&toplat=45&lev_850_mb=on&lev_700_mb=on&lev_500_mb=on&lev_300_mb=on&lev_200_mb=on",
  "http_status": "200",
  "returncode": 0,
  "error": "",
  "downloaded_at_utc": "2026-10-24T05:26:01.130399+00:00",
  "init_time_utc": "2026-10-23T12:00:00Z",
  "valid_time_utc": "2026-10-23T12:00:00Z",
  "lead_h": 0,
  "available_at_utc": null,
  "requested_levels_hpa": [
    850,
    700,
    500,
    300,
    200
  ],
  "requested_variables": [
    "UGRD",
    "VGRD"
  ],
  "requested_bbox": {
    "west": 110,
    "east": 165,
    "south": 5,
    "north": 45
  },
  "bytes": 451007,
  "sha256": "92ae0556e4e0ad7083477dd5b877d79c62e800561ed042f9c78c796afa851cb8",
  "downloaded_grib": true,
  "decoded": false,
  "model_input_approved": false,
  "exclusion_reason": "Original publication time unverified; historical train/validation/test field queue absent. GRIB decoding not yet performed."
}
```

后续验收：1) 用标准GRIB解码器验证实际U/V单位、5层是否齐全、扫描方向及ROI经纬度网格；2) 逐文件取得init/valid/available的可靠记录，不以cycle标签推断公开时间；3) 用不依赖CHAMPI效果选参的规则取得匹配整风暴历史队列；4) 在新命名空间运行F3与同队列F0/F1/F2，保留覆盖缺失与失败样本；5) 满足以上条件后才显示环境气流或模型曲线。

重新获取生成新版本目录：`../tabpfn_residual_realdata/.venv/bin/python scripts/download_champi_steering.py`；成功原文不覆盖。