from pathlib import Path
import tempfile,subprocess,unittest,importlib.util
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('author_repair',ROOT/'tools/repair_author_history.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)


class RepairTests(unittest.TestCase):
    def test_metadata_repair_preserves_all_file_trees_and_user_readme(self):
        import os
        def git(*args):return subprocess.check_output(['git',*args])
        before=Path.cwd()
        with tempfile.TemporaryDirectory() as temp:
            os.chdir(temp)
            try:
                git('init');git('config','user.name','Qiuhan99');git('config','user.email','owner@example.test')
                Path('README.md').write_text('original');git('add','.');git('commit','-m','owner start')
                git('config','user.name','github-actions[bot]');git('config','user.email','41898282+github-actions[bot]@users.noreply.github.com')
                Path('site.txt').write_text('real original data');git('add','.');git('commit','-m','automatic import')
                git('config','user.name','Qiuhan99');git('config','user.email','owner@example.test')
                Path('README.md').write_text('user latest edits');git('add','.');git('commit','-m','owner edits')
                head=git('rev-parse','HEAD').decode().strip();plan=module.repair(head,False)
                self.assertEqual(plan['bot_commits'],1);self.assertFalse(plan['applied']);self.assertEqual(git('rev-parse','HEAD').decode().strip(),head)
                self.assertEqual(git('rev-parse',head+'^{tree}'),git('rev-parse',plan['candidate']+'^{tree}'))
                self.assertEqual(git('show',plan['candidate']+':README.md').decode(),'user latest edits')
                self.assertNotIn('github-actions[bot]',git('log',plan['candidate'],'--format=%an').decode())
                self.assertTrue(Path('.runtime/before-author-repair.bundle').is_file())
                with self.assertRaises(ValueError):module.repair('0'*40,False)
            finally:os.chdir(before)
