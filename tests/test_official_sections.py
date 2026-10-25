import unittest
from cyclone_tfm_live.official import nmc_warning


class OfficialSectionTests(unittest.TestCase):
    bulletin=('2026年10月25日10时 中央气象台10月25日10时继续发布台风蓝色预警。'
              '蔷琵。预计，继续向东北方向移动，强度迅速减弱，并逐渐变性为温带气旋。'
              '大风预报：25日14时至26日14时，东海北部、浙江北部沿海有6-8级大风、阵风9-10级。')

    def test_wind_does_not_require_a_rain_section(self):
        facts=nmc_warning(self.bulletin+'防御指南：关注官方信息。','2026-10-25T07:00:00+00:00')
        self.assertIn('公报时段',facts['wind_forecast'])
        self.assertIn('东海北部',facts['wind_forecast'])
        self.assertIn('浙江北部沿海',facts['wind_forecast'])
        self.assertIsNone(facts['rain_forecast'])
        self.assertIn('东北',facts['trajectory'])
        self.assertIn('温带气旋',facts['trajectory'])

    def test_rain_is_parsed_when_the_official_section_exists(self):
        facts=nmc_warning(self.bulletin+'降水预报：25日14时至26日14时，浙江东北部局地20-50毫米。防御指南：关注官方信息。','2026-10-25T07:00:00+00:00')
        self.assertIn('20–50毫米',facts['rain_forecast'])
        self.assertNotIn('降水预报',facts['wind_forecast'])


if __name__=='__main__':unittest.main()
