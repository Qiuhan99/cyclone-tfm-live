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
            original={'champi-operations.json':{'generated_at_utc':'2026-10-25T00:00:00Z'},'champi-operations-health.json':{'ok':True}}
            for n,v in original.items():(assets/n).write_text(json.dumps(v))
            (repo/'site/private-should-not-be-in-live-branch.txt').write_text('not a live payload')
            command=['python3',str(ROOT/'tools/live_branch.py')]
            subprocess.run(command+['save'],cwd=repo,check=True,capture_output=True)
            git(repo,'fetch','origin','live-data')
            names=git(repo,'ls-tree','--name-only','FETCH_HEAD').stdout.decode().splitlines()
            self.assertEqual(sorted(names),sorted(original))
            before=git(repo,'rev-parse','FETCH_HEAD').stdout
            subprocess.run(command+['save'],cwd=repo,check=True,capture_output=True)
            git(repo,'fetch','origin','live-data');self.assertEqual(before,git(repo,'rev-parse','FETCH_HEAD').stdout)
            for n in original:(assets/n).write_text('{}')
            subprocess.run(command+['restore'],cwd=repo,check=True,capture_output=True)
            for n,v in original.items():self.assertEqual(json.loads((assets/n).read_text()),v)


if __name__=='__main__':unittest.main()
