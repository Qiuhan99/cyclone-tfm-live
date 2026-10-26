from pathlib import Path
import copy,json,tempfile,unittest
from unittest.mock import patch
from cyclone_tfm_live.inference_bridge import checked_payload,once
ROOT=Path(__file__).resolve().parents[1]


class BridgeTests(unittest.TestCase):
    def setUp(self):self.value=json.loads((ROOT/'site/assets/champi-operations.json').read_text())
    def test_real_payload_keeps_origins_times_and_does_not_publish_by_default(self):
        with tempfile.TemporaryDirectory() as t:
            p=Path(t);source=p/'research/web/dist/assets';source.mkdir(parents=True);(source/'champi-operations.json').write_text(json.dumps(self.value))
            with patch('cyclone_tfm_live.inference_bridge.publish') as publish,patch('cyclone_tfm_live.inference_bridge.run_inference') as infer:
                status=once(p/'research',Path('unused'),p/'cache')
            publish.assert_not_called();infer.assert_not_called();self.assertFalse(status['publish_enabled']);self.assertFalse(status['published'])
            actual=json.loads((p/'cache/ready/champi-operations.json').read_text());self.assertEqual(actual,self.value)
    def test_mismatched_base_c1_origin_is_rejected(self):
        v=copy.deepcopy(self.value);v['model']['paths'][0]['issue_time_utc']='2026-10-01T00:00:00+00:00'
        with self.assertRaises(ValueError):checked_payload(v)
    def test_missing_real_c1_or_private_machine_path_is_rejected(self):
        v=copy.deepcopy(self.value);v['model']['paths']=[p for p in v['model']['paths'] if not p['model_id'].endswith(' + RF')]
        with self.assertRaises(ValueError):checked_payload(v)
        v=copy.deepcopy(self.value);v['private_root']='/Users/example/private'
        with self.assertRaises(ValueError):checked_payload(v)
    def test_declared_inference_reuses_the_existing_private_runner(self):
        from cyclone_tfm_live.inference_bridge import run_inference
        with tempfile.TemporaryDirectory() as t:
            root=Path(t);(root/'scripts').mkdir();(root/'scripts/refresh_champi_operations.py').write_text('')
            with patch('cyclone_tfm_live.inference_bridge.subprocess.run') as call:run_inference(root,Path('/known/python'))
            args,kwargs=call.call_args;self.assertEqual(args[0],['/known/python',str(root/'scripts/refresh_champi_operations.py')]);self.assertTrue(kwargs['check'])
