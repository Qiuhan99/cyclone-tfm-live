import copy,json,unittest
from pathlib import Path
from cyclone_tfm_live.official import nmc_warning,nmc_center,OtherStormBulletin
from cyclone_tfm_live.publication import merge_live
from cyclone_tfm_live.agency_forecast import parse_forecasts

class StatusTests(unittest.TestCase):
    def test_cancelled_alert_is_explicit_not_an_active_blue_alert(self):
        s='2026年10月25日18时 中央气象台10月25日18时解除台风蓝色预警：今年第30号台风蔷琵。预计继续向东北方向移动，并逐渐变性为温带气旋。'
        r=nmc_warning(s,'2026-10-26T03:00:00+00:00')
        self.assertEqual(r['status'],'cancelled');self.assertEqual(r['issued_at_utc'],'2026-10-25T10:00:00+00:00')
        self.assertEqual(r['color'],'蓝色')
    def test_other_storm_bulletin_cannot_relabel_champi(self):
        with self.assertRaises(OtherStormBulletin):
            nmc_center('命 名：“烟花”，IN-FA 编号2631 中心位置北纬14.0度、东经163.4度','2026-10-26T03:00:00+00:00')
    def test_later_retrieval_of_older_active_warning_cannot_undo_cancellation(self):
        p=json.loads((Path(__file__).resolve().parents[1]/'site/assets/champi-operations.json').read_text())
        p['official']['warning'].update(status='cancelled',issued_at_utc='2026-10-25T10:00:00Z')
        q=copy.deepcopy(p);q['last_checked_at_utc']='2026-10-27T03:00:00Z';q['official']['warning'].update(status='active',issued_at_utc='2026-10-25T02:00:00Z')
        self.assertEqual(merge_live(p,q)['official']['warning']['status'],'cancelled')
    def test_cma_analysis_identity_and_last_valid_time_are_retained(self):
        row=[1,'202610251200',1792929600000,'TS',126.5,30.8,995,20,'ENE',21,[],{'BABJ':[[6,'202610251200',127.6,31.1,998,18,'BABJ','TS']]}]
        raw='callback('+json.dumps({'typhoon':[1,'CHAMPI','蔷琵',2630,2630,None,None,'start',[row]]})+')'
        r=parse_forecasts(raw,'2026-10-26T03:00:00Z','2026-10-26T00:00:00Z','https://example.test')
        self.assertEqual(r['latest_analysis']['valid_time_utc'],'2026-10-25T12:00:00+00:00');self.assertEqual(r['latest_analysis']['vmax_ms'],20)
