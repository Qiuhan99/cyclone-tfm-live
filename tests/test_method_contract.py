import copy,json,unittest
from pathlib import Path
from cyclone_tfm_live.method_contract import validate_core,BASE,FEEDBACK,PROTOCOL
from cyclone_tfm_live.inference_bridge import checked_payload

ROOT=Path(__file__).resolve().parents[1]


class MethodContractTests(unittest.TestCase):
    def setUp(self):self.data=json.loads((ROOT/'site/assets/champi-operations.json').read_text())
    def test_actual_published_model_has_direct_core_provenance(self):
        checked_payload(self.data)
        own=validate_core(self.data['model'])
        self.assertEqual({p['model_id'] for p in own},{BASE,FEEDBACK})
        self.assertEqual(self.data['model']['protocol_id'],PROTOCOL)
        self.assertEqual(self.data['data_profile']['residual_feature_count'],68)
    def test_cv_offsets_extra_base_inputs_and_mixed_protocols_are_rejected(self):
        for key,value in [('constant_velocity_offset',True),('base_prediction_as_correction_input',True),('correction_features',70),('correction_weight',.5)]:
            bad=copy.deepcopy(self.data);bad['model']['algorithm_contract'][key]=value
            with self.assertRaises(ValueError):checked_payload(bad)
        bad=copy.deepcopy(self.data);bad['model']['paths'][0]['protocol_id']='motion_residual_v1'
        with self.assertRaises(ValueError):checked_payload(bad)

    def test_later_legacy_worker_cannot_restore_cv_as_the_active_method(self):
        from cyclone_tfm_live.publication import merge_live
        legacy=copy.deepcopy(self.data)
        legacy['model']['protocol_id']='motion_residual_v1'
        legacy['generated_at_utc']='2026-11-01T00:00:00Z'
        legacy['model']['paths']=[dict(legacy['model']['paths'][0],model_id='TabPFN CV-F2')]
        for current,candidate in [(self.data,legacy),(legacy,self.data)]:
            result=merge_live(current,candidate)
            self.assertEqual(result['model']['protocol_id'],PROTOCOL)
            self.assertEqual(result['generated_at_utc'],self.data['generated_at_utc'])
