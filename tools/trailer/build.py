# Puts the 1.4 trailer together: the frames record.mjs filmed (frames/<shot>/0000.jpg ...), in the
# order of its PLAN, over Sam's PrimeSolarSystemCasualBattleMusicVariant3 from 47.04 s, the bar where
# the full band comes in (110 bpm, a bar every 2.182 s; the cuts sit on its bars). It was 35.1 s,
# which Sam found an awkward place to start.
# Output: an App Store app preview, 886x1920 portrait, H.264 High@4.0 at 30 fps and about 11 Mbps,
# AAC 256 kbps stereo 48 kHz, just under 30 seconds, in "App Store 1.4/".
#   py tools/trailer/build.py
import os, re, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
FPS = 30
MUSIC = os.path.join(ROOT, 'PrimeSolarSystemCasualBattleMusicVariant3.mp3')
START = 47.04
OUT_DIR = os.path.join(ROOT, 'App Store 1.4')

# The shot order from record.mjs's PLAN.
plan = re.findall(r"\{ name: '(\w+)', frames: (\d+)", open(os.path.join(HERE, 'record.mjs'), encoding='utf-8').read())
seq = os.path.join(HERE, 'frames', '_all')
shutil.rmtree(seq, ignore_errors=True)
os.makedirs(seq)
n = 0
for name, count in plan:
    d = os.path.join(HERE, 'frames', name)
    files = sorted(f for f in os.listdir(d) if f.endswith('.jpg')) if os.path.isdir(d) else []
    if len(files) < int(count):
        sys.exit(f'{name}: {len(files)} frames, want {count}')
    for f in files[: int(count)]:
        shutil.copyfile(os.path.join(d, f), os.path.join(seq, f'{n:05d}.jpg'))
        n += 1
dur = n / FPS
print('frames', n, 'seconds', round(dur, 2))
if dur > 30:
    sys.exit('over 30 seconds')
os.makedirs(OUT_DIR, exist_ok=True)
out = os.path.join(OUT_DIR, 'App Preview iPhone 886x1920.mp4')
fade_out = 1.4
cmd = [
    'ffmpeg', '-y', '-nostdin', '-v', 'error',
    '-framerate', str(FPS), '-i', os.path.join(seq, '%05d.jpg'),
    '-ss', str(START), '-t', f'{dur:.3f}', '-i', MUSIC,
    '-filter_complex', f'[0:v]scale=886:1920:flags=lanczos,format=yuv420p[v];[1:a]afade=t=in:st=0:d=0.12,afade=t=out:st={dur - fade_out:.3f}:d={fade_out},volume=-1dB,aresample=48000[a]',
    '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-profile:v', 'high', '-level:v', '4.0', '-preset', 'slow',
    '-b:v', '11M', '-maxrate', '12M', '-bufsize', '22M', '-r', str(FPS), '-g', str(FPS),
    '-c:a', 'aac', '-b:a', '256k', '-ac', '2', '-ar', '48000',
    '-movflags', '+faststart', '-t', f'{dur:.3f}', out,
]
subprocess.run(cmd, check=True)
shutil.rmtree(seq, ignore_errors=True)
print('wrote', out)
