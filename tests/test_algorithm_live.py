import copy,json,unittest
from cyclone_tfm_live.agency_forecast import parse_forecasts
from cyclone_tfm_live.verification import advance
from cyclone_tfm_live.publication import merge_live


def payload():
    return dict(storm_id='CHAMPI_2026',model=dict(paths=[dict(model_id='TabPFN CV-F2 + C1',
        issue_time_utc='2026-10-25T12:00:00Z',points=[dict(lead_h=6,valid_time_utc='2026-10-25T18:00:00Z',lat_deg=31,lon_deg=128,radius_90_km=100)])]),observations=[])


class AlgorithmLiveTests(unittest.TestCase):
    def test_cma_validates_identity_utc_and_does_not_extend_missing_24h(self):
        from datetime import datetime,timezone
        row=[1,'202610251200',int(datetime(2026,10,25,12,tzinfo=timezone.utc).timestamp()*1000),'TS',126.5,30.8,995,20,'ENE',21,[],{'BABJ':[[6,'202610251200',127.6,31.1,998,18,'BABJ','TS'],[12,'202610251200',128.9,31.5,998,18,'BABJ','TS']]}]
        def raw(r,name='CHAMPI'):return 'callback('+json.dumps({'typhoon':[1,name,'蔷琵',2630,2630,None,None,'start',[r]]})+')'
        result=parse_forecasts(raw(row),'2026-10-25T14:00:00Z','2026-10-25T12:00:00Z','https://example.test')
        p=result['paths'][0];self.assertEqual([q['lead_h'] for q in p['points']],[6,12]);self.assertEqual(p['points'][0]['valid_time_utc'],'2026-10-25T18:00:00+00:00');self.assertFalse(p['publication_time_known'])
        with self.assertRaises(ValueError):parse_forecasts(raw(row,'OTHER'),'x','x','x')
        row[2]+=8*3600*1000
        with self.assertRaises(ValueError):parse_forecasts(raw(row),'x','x','x')

    def test_new_forecast_is_pending_then_publicly_confirmed_before_target(self):
        p=payload();first=advance({},p,'2026-10-25T14:00:00Z');r=first['records'][0]
        self.assertNotIn('eligible',r)
        second=advance({'verification':first},p,'2026-10-25T14:15:00Z')
        self.assertEqual(len(second['records']),1);self.assertTrue(second['records'][0]['eligible']);self.assertNotIn('eligible',r)
        self.assertEqual(second['records'][0]['id'],r['id'])

    def test_late_confirmation_and_historical_backfill_cannot_score(self):
        p=payload();first=advance({},p,'2026-10-25T14:00:00Z')
        late=advance({'verification':first},p,'2026-10-25T18:00:00Z');self.assertFalse(late['records'][0]['eligible'])
        self.assertEqual(advance({},p,'2026-10-25T18:00:01Z')['records'],[])

    def test_immutable_versions_and_first_truth_survive_revisions(self):
        p=payload();first=advance({},p,'2026-10-25T14:00:00Z');confirmed=advance({'verification':first},p,'2026-10-25T14:15:00Z')
        p['model']['paths'][0]['points'][0]['lon_deg']=129
        revised=advance({'verification':confirmed},p,'2026-10-25T15:00:00Z');self.assertEqual(len(revised['records']),2);self.assertEqual(revised['records'][0]['lon_deg'],128)
        p['observations']=[dict(valid_time_utc='2026-10-25T18:00:00Z',lat_deg=31.2,lon_deg=127.9)]
        # No future observation can leak into the truth ledger.
        self.assertEqual(advance({'verification':revised},p,'2026-10-25T17:59:00Z')['truths'],{})
        mature=advance({'verification':revised},p,'2026-10-25T18:15:00Z');key='2026-10-25T18:00:00+00:00'
        p['observations'][0]['lat_deg']=30
        later=advance({'verification':mature},p,'2026-10-25T19:00:00Z');self.assertEqual(later['truths'][key],mature['truths'][key]);self.assertEqual(later['truths'][key]['lat_deg'],31.2)

    def test_invalid_issue_lead_target_is_rejected(self):
        p=payload();p['model']['paths'][0]['points'][0]['lead_h']=12
        with self.assertRaises(ValueError):advance({},p,'2026-10-25T14:00:00Z')

    def test_agency_failed_attempt_keeps_original_version_and_reports_failure(self):
        p=payload();p['model']['input_last_valid_utc']='2026-10-25T12:00:00Z';p['last_checked_at_utc']=p['generated_at_utc']='2026-10-25T14:00:00Z'
        p['agency_forecasts']={'checked_at_utc':'2026-10-25T14:00:00Z','ok':True,'paths':[]}
        q=copy.deepcopy(p);q['agency_forecasts'].update(last_attempt_at_utc='2026-10-25T15:00:00Z',ok=False)
        out=merge_live(p,q);self.assertFalse(out['agency_forecasts']['ok']);self.assertEqual(out['agency_forecasts']['checked_at_utc'],'2026-10-25T14:00:00Z')
