from pathlib import Path
import copy,json,tempfile,unittest
from unittest.mock import patch
import numpy as np
import pandas as pd
from cyclone_tfm_live.refresh import assemble,validate_tfm,atomic
from cyclone_tfm_live.official import Coast

ROOT=Path(__file__).resolve().parents[1]


class RefreshTests(unittest.TestCase):
    def setUp(self):
        self.old=json.loads((ROOT/'site/assets/champi-operations.json').read_text())
        self.coast=Coast([])

    def test_public_fetch_never_retimes_existing_model(self):
        old=copy.deepcopy(self.old)
        new=assemble(old,None,None,{},dict(center=dict(ok=False)),self.coast,'2026-10-26T00:00:00+00:00')
        self.assertEqual(new['generated_at_utc'],old['generated_at_utc'])
        self.assertEqual(new['model']['input_last_valid_utc'],old['model']['input_last_valid_utc'])
        for a,b in zip(new['model']['paths'],old['model']['paths']):self.assertEqual(a,b)
        self.assertEqual(old,self.old)
        self.assertFalse(new['fetch_status']['center']['ok'])

    def test_external_new_origin_is_not_a_new_tfm_run(self):
        now='2026-10-25T12:00:00+00:00';issue=pd.Timestamp(now)
        b=pd.DataFrame([dict(valid_time_utc=issue,lat_deg=25.,lon_deg=125.,vmax_kt=50.,mslp_hpa=980.,raw_file_sha256='a'*64)])
        a=pd.DataFrame([dict(issue_time_utc=issue,valid_time_utc=issue+pd.Timedelta(hours=6),lead_h=6,model_raw_aid='CMC',tech_num='03',lat_deg=26.,lon_deg=126.,vmax_kt=45.,mslp_hpa=985.,source_url='https://example.org/adeck',raw_file_sha256='b'*64)])
        new=assemble(self.old,b,a,{},dict(adeck=dict(ok=True)),self.coast,now)
        tfm=[p for p in new['model']['paths'] if not p.get('model_raw_aid')]
        self.assertEqual(tfm,[p for p in self.old['model']['paths'] if not p.get('model_raw_aid')])
        external=[p for p in new['model']['paths'] if p.get('model_raw_aid')]
        self.assertEqual(len(external),1);self.assertEqual(external[0]['issue_time_utc'],now)
        self.assertEqual(external[0]['anchor']['valid_time_utc'],now)

    def test_missing_native_anchor_is_not_invented(self):
        issue=pd.Timestamp('2026-10-25T00:00:00+00:00')
        b=pd.DataFrame([dict(valid_time_utc=issue+pd.Timedelta(hours=6),lat_deg=25.,lon_deg=125.,vmax_kt=50.,mslp_hpa=980.,raw_file_sha256='a'*64)])
        a=pd.DataFrame([dict(issue_time_utc=issue,valid_time_utc=issue+pd.Timedelta(hours=6),lead_h=6,model_raw_aid='UKM',tech_num='03',lat_deg=26.,lon_deg=126.,vmax_kt=45.,mslp_hpa=985.,source_url='https://example.org/adeck',raw_file_sha256='b'*64)])
        new=assemble(self.old,b,a,{},dict(adeck=dict(ok=True)),self.coast,'2026-10-25T12:00:00+00:00')
        path=next(p for p in new['model']['paths'] if p.get('model_raw_aid'))
        self.assertIsNone(path['anchor']);self.assertEqual(path['landfall_candidates'],[])

    def test_import_preserves_real_tfm_times_and_rejects_malformed_leads(self):
        model=validate_tfm(self.old);self.assertEqual(model,self.old['model'])
        bad=copy.deepcopy(self.old);bad['model']['paths'][0]['points'][0]['lead_h']=999
        with self.assertRaises(ValueError):validate_tfm(bad)

    def test_nonfinite_publish_leaves_last_valid_file_intact(self):
        with tempfile.TemporaryDirectory() as t:
            p=Path(t)/'cache.json';atomic(p,dict(value=1))
            with self.assertRaises(ValueError):atomic(p,dict(value=float('nan')))
            self.assertEqual(json.loads(p.read_text()),dict(value=1))


if __name__=='__main__':unittest.main()
