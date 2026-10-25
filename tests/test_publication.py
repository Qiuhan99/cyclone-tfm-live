from pathlib import Path
import copy,json,os,subprocess,tempfile,unittest
from unittest.mock import patch
from cyclone_tfm_live.publication import merge_live
from cyclone_tfm_live.inference_bridge import publish

ROOT=Path(__file__).resolve().parents[1]


class PublicationTests(unittest.TestCase):
    def setUp(self):
        self.value=json.loads((ROOT/'site/assets/champi-operations.json').read_text())

    def test_cloud_refresh_cannot_erase_newer_mac_model(self):
        remote=copy.deepcopy(self.value);cloud=copy.deepcopy(self.value)
        remote['generated_at_utc']='2026-10-25T06:00:00+00:00'
        remote['publication']={'mode':'mac_auto'}
        cloud['generated_at_utc']='2026-10-25T05:00:00+00:00'
        cloud['last_checked_at_utc']='2026-10-25T07:00:00+00:00'
        cloud['official']['center']['test_marker']='newer official information'
        result=merge_live(remote,cloud)
        self.assertEqual(result['generated_at_utc'],remote['generated_at_utc'])
        self.assertEqual(result['official'],cloud['official'])
        self.assertEqual(result['publication'],remote['publication'])
        self.assertEqual(remote['publication'],{'mode':'mac_auto'})

    def test_late_upload_cannot_regress_origin_or_observed_prefix(self):
        remote=copy.deepcopy(self.value);late=copy.deepcopy(self.value)
        late['model']['input_last_valid_utc']='2026-10-24T18:00:00+00:00'
        late['generated_at_utc']='2026-10-25T09:00:00+00:00'
        late['last_checked_at_utc']='2026-10-25T09:00:00+00:00'
        late['observations']=late['observations'][:-1]
        result=merge_live(remote,late)
        self.assertEqual(result['model']['input_last_valid_utc'],remote['model']['input_last_valid_utc'])
        self.assertEqual(result['observations'],remote['observations'])

    def test_different_storm_is_rejected(self):
        v=copy.deepcopy(self.value);v['storm_id']='another storm'
        with self.assertRaises(ValueError):merge_live(self.value,v)

    def test_real_git_transfer_only_contains_public_caches_workflow_and_retries_nonforce(self):
        actual_run=subprocess.run
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);remote=root/'remote.git'
            def run(*args,input=None):
                return actual_run(['git','--git-dir',str(remote),*args],input=input,capture_output=True,check=True).stdout.decode().strip()
            actual_run(['git','init','--bare',str(remote)],capture_output=True,check=True)
            run('config','user.name','Owner');run('config','user.email','owner@example.org')
            blob=run('hash-object','-w','--stdin',input=json.dumps(self.value).encode())
            tree=run('mktree',input=f'100644 blob {blob}\tchampi-operations.json\n'.encode())
            parent=run('commit-tree',tree,input=b'initial\n');run('update-ref','refs/heads/live-data',parent)
            workflow=run('hash-object','-w','--stdin',input=(ROOT/'.github/workflows/pages.yml').read_bytes())
            workflows=run('mktree',input=f'100644 blob {workflow}\tpages.yml\n'.encode())
            gh=run('mktree',input=f'040000 tree {workflows}\tworkflows\n'.encode())
            main_tree=run('mktree',input=f'040000 tree {gh}\t.github\n'.encode())
            main=run('commit-tree',main_tree,input=b'public workflow\n');run('update-ref','refs/heads/main',main)
            attempts=[]
            def local_git(command,**kwargs):
                command=[str(remote) if a=='https://github.com/Qiuhan99/cyclone-tfm-live.git' else a for a in command]
                if 'push' in command:
                    attempts.append(command)
                    if len(attempts)==1:
                        return subprocess.CompletedProcess(command,1,stdout=b'',stderr=b'rejected concurrent update')
                return actual_run(command,**kwargs)
            newer=copy.deepcopy(self.value);newer['generated_at_utc']='2026-10-25T09:00:00+00:00'
            with patch.dict(os.environ,{'CYCLONE_GIT_REMOTE':'https://github.com/Qiuhan99/cyclone-tfm-live.git'}),patch('cyclone_tfm_live.inference_bridge.subprocess.run',side_effect=local_git):
                self.assertTrue(publish(newer,root/'cache'))
            self.assertEqual(len(attempts),2)
            self.assertTrue(all(not any(a.startswith('--force') for a in command) for command in attempts))
            names=run('ls-tree','-r','--name-only','live-data').splitlines()
            self.assertEqual(names,['.github/workflows/pages.yml','champi-operations-health.json','champi-operations.json'])
            self.assertEqual(run('show','live-data:.github/workflows/pages.yml'),(ROOT/'.github/workflows/pages.yml').read_text().strip())
            result=json.loads(run('show','live-data:champi-operations.json'))
            self.assertEqual(result['generated_at_utc'],newer['generated_at_utc'])
            self.assertTrue((root/'cache/last-transfer.json').exists())


if __name__=='__main__':unittest.main()
