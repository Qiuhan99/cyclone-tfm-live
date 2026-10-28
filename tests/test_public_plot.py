from pathlib import Path
import importlib.util
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
SPEC=importlib.util.spec_from_file_location('public_bundle_check',ROOT/'tools/check_public.py')
MODULE=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class PublicPlotTests(unittest.TestCase):
    def setUp(self):
        temporary=tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root=Path(temporary.name)
        self.assets=self.root/'site/assets'
        self.assets.mkdir(parents=True)
        self.plot=self.assets/'champi-turn-paths-v2.png'
        self.plot.write_bytes((ROOT/'site/assets/champi-turn-paths-v2.png').read_bytes())
        (self.root/'site/index.html').write_text('<a href="assets/champi-turn-paths-v2.png">Verified figure</a>')

    def test_reviewed_scientific_plot_and_local_link_pass(self):
        MODULE.check(self.root)

    def test_modified_and_unreviewed_images_are_rejected(self):
        self.plot.write_bytes(self.plot.read_bytes()+b'changed')
        with self.assertRaisesRegex(ValueError,'unreviewed public image'):
            MODULE.check(self.root)
        self.plot.write_bytes((ROOT/'site/assets/champi-turn-paths-v2.png').read_bytes())
        (self.assets/'unreviewed.png').write_bytes(self.plot.read_bytes())
        with self.assertRaisesRegex(ValueError,'unreviewed public image'):
            MODULE.check(self.root)

    def test_private_path_scan_remains_active_for_binary_images(self):
        self.plot.write_bytes(self.plot.read_bytes()+b'/Users/private-location')
        with self.assertRaisesRegex(ValueError,'private material'):
            MODULE.check(self.root)


if __name__=='__main__':unittest.main()
