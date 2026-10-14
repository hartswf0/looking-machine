cd "$(dirname "$0")/.."
todo=$(python3 -c "
import sys,os;sys.path.insert(0,'idents');import render as r
print(' '.join(s['n'] for s in r.sign_specs() if not os.path.exists('idents/'+s['key']+'.mp4')))")
set -- $todo
python3 idents/render.py films 2 3 4 6 > /dev/null &
python3 idents/render.py films 7 8 9 10 > /dev/null &
python3 idents/render.py films 11 14 15 > /dev/null &
python3 idents/render.py signs ${@:1:9} > /dev/null &
python3 idents/render.py signs ${@:10:9} > /dev/null &
python3 idents/render.py signs ${@:19:9} > /dev/null &
python3 idents/render.py signs ${@:28:9} > /dev/null &
wait
ls idents/film-*.mp4 idents/sign-*.mp4 | wc -l
