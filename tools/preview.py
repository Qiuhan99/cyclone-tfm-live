from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'src'))
from cyclone_tfm_live.cli import main
if __name__=='__main__':
    sys.argv.insert(1,'serve');main()
