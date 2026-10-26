from pathlib import Path
import copy,json,math,unittest
import numpy as np
from cyclone_tfm_live.geometry import unit_vector
from cyclone_tfm_live.official import Coast
from cyclone_tfm_live.forecast_analysis import segment_distance,CoastalSectors,build_analysis,cap_area
from cyclone_tfm_live.refresh import validate_tfm
from cyclone_tfm_live.publication import merge_live
from cyclone_tfm_live.inference_bridge import checked_payload
from cyclone_tfm_live.verification import advance
ROOT=Path(__file__).resolve().parents[1]

class ForecastAnalysisTests(unittest.TestCase):
    def setUp(self):
        self.payload=json.loads((ROOT/'site/assets/champi-operations.json').read_text())
        self.reference=json.loads((ROOT/'site/assets/tsfm-live-reference.json').read_text())
    def test_shortest_spherical_distance_uses_segment_interior_and_guards_endpoints(self):
        a=np.array([unit_vector(0,0)]);b=np.array([unit_vector(0,10)])
        for lat,lon,expected in [(5,5,5),(0,15,5),(0,5,0)]:
            distance,_=segment_distance(unit_vector(lat,lon),a,b)
            self.assertAlmostEqual(distance,6371.0088*math.radians(expected),places=6)
    def test_region_coast_overlap_is_a_geometric_event_not_an_intensity_forecast(self):
        coast=Coast([[[130,32],[131,32],[131,33],[130,33],[130,32]]]);sectors=CoastalSectors(coast)
        outside=sectors.describe(31,130.5,100);inside=sectors.describe(31,130.5,112)
        middle=unit_vector(32,130)+unit_vector(32,131);middle/=np.linalg.norm(middle)
        expected=6371.0088*math.acos(float(middle@unit_vector(31,130.5)))
        self.assertFalse(outside['centre_on_land']);self.assertAlmostEqual(outside['nearest_coast']['distance_km'],expected,places=6)
        self.assertEqual(outside['position_region_coastal_sectors'],[]);self.assertEqual(inside['position_region_coastal_sectors'][0]['sector'],'Kyushu')
        self.assertEqual(sectors.describe(31,130.5)['position_region_coastal_sectors'],[])
    def test_major_island_polygons_resolve_overlapping_rectangular_coastal_labels(self):
        coast=Coast(json.loads((ROOT/'site/assets/coastline.json').read_text())['rings']);sectors=CoastalSectors(coast)
        self.assertEqual(sectors.describe(33.45,132.25)['nearest_coast']['sector'],'Shikoku')
        self.assertEqual(sectors.describe(34.3,131.5)['nearest_coast']['sector'],'Honshu')
    def test_analysis_reconstructs_positions_and_original_areas_without_claiming_wind_or_landfall_probability(self):
        self.payload['model']['paths']+=copy.deepcopy(self.reference['paths'])
        result=build_analysis(self.payload,Coast([]));self.assertEqual(len(result['paths']),len(self.payload['model']['paths']))
        for path,report in zip(self.payload['model']['paths'],result['paths']):
            for q,r in zip(path['points'],report['points']):
                self.assertEqual(r['lat_deg'],q['lat_deg']);self.assertEqual(r['valid_time_utc'],q['valid_time_utc'])
                self.assertEqual(r['issued_area_90_km2'],cap_area(q.get('radius_90_km')))
                self.assertNotIn('landfall_probability',r);self.assertNotIn('wind_forecast',r)
    def test_actual_frozen_tsfm_paths_pass_provenance_validation_and_unknown_models_do_not(self):
        self.payload['model']['paths']+=copy.deepcopy(self.reference['paths']);checked_payload(self.payload)
        bad=copy.deepcopy(self.payload);path=next(p for p in bad['model']['paths'] if p.get('model_family')=='tsfm');path['checkpoint_sha256']='';
        with self.assertRaises(ValueError):validate_tfm(bad)
        path['checkpoint_sha256']='a'*64;path['model_id']='invented-model'
        with self.assertRaises(ValueError):validate_tfm(bad)
    def test_separate_tsfm_clock_survives_newer_cloud_refresh_without_retiming_tabpfn(self):
        mac=copy.deepcopy(self.payload);cloud=copy.deepcopy(self.payload)
        mac['model']['paths']+=copy.deepcopy(self.reference['paths']);mac['model']['tsfm']={'checked_at_utc':'2026-10-26T07:00:00Z','status':'completed'}
        cloud['last_checked_at_utc']='2026-10-26T07:10:00Z'
        result=merge_live(cloud,mac)
        self.assertEqual([p for p in result['model']['paths'] if p.get('model_family')=='tsfm'],self.reference['paths'])
        self.assertEqual(result['generated_at_utc'],self.payload['generated_at_utc']);self.assertEqual(result['model']['tsfm']['status'],'completed')
    def test_new_tsfm_cycles_are_not_backfilled_for_elapsed_targets_or_scored_before_public_confirmation(self):
        old=copy.deepcopy(self.payload);old['verification']={'schema':1,'started_at_utc':'2026-10-26T07:00:00Z','records':[],'truths':{},'updated_at_utc':'2026-10-26T07:00:00Z'}
        candidate=copy.deepcopy(old);candidate['model']['paths']=copy.deepcopy(self.reference['paths'])
        first=advance(old,candidate,'2026-10-26T07:00:00Z');rows=[r for r in first['records'] if r['kind']=='tsfm']
        self.assertEqual(len(rows),33);self.assertTrue(all(r['lead_h']>=12 and 'eligible' not in r for r in rows))
        previous=copy.deepcopy(candidate);previous['verification']=first
        second=advance(previous,candidate,'2026-10-26T07:01:00Z');self.assertTrue(all(r['eligible'] for r in second['records']))

if __name__=='__main__':unittest.main()
