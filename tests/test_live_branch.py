from pathlib import Path
import json,subprocess,tempfile,unittest

ROOT=Path(__file__).resolve().parents[1]


class BranchTests(unittest.TestCase):
    def test_roundtrip_preserves_live_state_without_committing_website(self):
        def git(cwd,*args):return subprocess.run(['git',*args],cwd=cwd,check=True,capture_output=True)
        with tempfile.TemporaryDirectory() as t:
            temp=Path(t);remote=temp/'remote.git';repo=temp/'checkout'
            git(temp,'init','--bare',str(remote));repo.mkdir();git(repo,'init');git(repo,'remote','add','origin',str(remote))
            assets=repo/'site/assets';assets.mkdir(parents=True)
            original={'champi-operations.json':json.loads((ROOT/'site/assets/champi-operations.json').read_text()),'champi-operations-health.json':{'ok':True}}
            for n,v in original.items():(assets/n).write_text(json.dumps(v))
            workflow=repo/'.github/workflows/model-update.yml';workflow.parent.mkdir(parents=True);workflow.write_bytes((ROOT/'.github/workflows/model-update.yml').read_bytes())
            (repo/'site/private-should-not-be-in-live-branch.txt').write_text('not a live payload')
            command=['python3',str(ROOT/'tools/live_branch.py')]
            subprocess.run(command+['save'],cwd=repo,check=True,capture_output=True)
            git(repo,'fetch','origin','live-data')
            names=git(repo,'ls-tree','-r','--name-only','FETCH_HEAD').stdout.decode().splitlines()
            self.assertEqual(sorted(names),sorted([*original,'.github/workflows/model-update.yml']))
            # The next transfer confirms pending records from the public branch.
            subprocess.run(command+['save'],cwd=repo,check=True,capture_output=True)
            git(repo,'fetch','origin','live-data');before=git(repo,'rev-parse','FETCH_HEAD').stdout
            expected=json.loads((assets/'champi-operations.json').read_text())
            self.assertIn('verification',expected)
            subprocess.run(command+['save'],cwd=repo,check=True,capture_output=True)
            git(repo,'fetch','origin','live-data');self.assertEqual(before,git(repo,'rev-parse','FETCH_HEAD').stdout)
            for n in original:(assets/n).write_text('{}')
            subprocess.run(command+['restore'],cwd=repo,check=True,capture_output=True)
            self.assertEqual(json.loads((assets/'champi-operations.json').read_text()),expected)
            for key,value in original['champi-operations.json'].items():
                if key!='verification':self.assertEqual(expected[key],value)
            self.assertEqual(json.loads((assets/'champi-operations-health.json').read_text()),original['champi-operations-health.json'])


if __name__=='__main__':unittest.main()
