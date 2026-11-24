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
SHOW = '--showcase' in sys.argv
# 1.5 (Sam, 24 Nov): the giants and the comet, World 7 music into the comet's (see record.mjs GIANTS).
GIANT = '--giants' in sys.argv
# The battle showcase (Sam, 23 Nov): its own shots and Sam's Variant 2 from its drop at 103.59 s.
MUSIC = os.path.join(ROOT, 'PrimeSolarSystemCasualBattleMusicVariant2.mp3' if SHOW else 'PrimeSolarSystemCasualBattleMusicVariant3.mp3')
START = 103.59 if SHOW else 47.04
OUT_DIR = os.path.join(ROOT, 'App Store 1.5' if GIANT else 'App Store 1.4')
if GIANT:
    MUSIC = os.path.join(ROOT, 'BattleWorld7Music2.mp3')
    START = 104.925
    MUSIC2 = os.path.join(ROOT, 'CometWorldMusic.mp3')
    DROP2 = 74.0

# The shot order from record.mjs's PLAN (or SHOWCASE).
src = open(os.path.join(HERE, 'record.mjs'), encoding='utf-8').read()
part = src[src.index('export const GIANTS'):] if GIANT else src[src.index('export const SHOWCASE'):] if SHOW else src[src.index('export const PLAN'):src.index('export const SHOWCASE')]
plan = re.findall(r"\{ name: '(\w+)', frames: (\d+)", part[: part.index('];')])
seq = os.path.join(HERE, 'frames', '_all')
shutil.rmtree(seq, ignore_errors=True)
os.makedirs(seq)
n = 0
for name, count in plan:
    d = os.path.join(HERE, 'frames', f'giants-{name}' if GIANT else f'showcase-{name}' if SHOW else name)
    files = sorted(f for f in os.listdir(d) if f.endswith('.jpg')) if os.path.isdir(d) else []
    if len(files) < int(count):
        sys.exit(f'{name}: {len(files)} frames, want {count}')
    for f in files[: int(count)]:
        shutil.copyfile(os.path.join(d, f), os.path.join(seq, f'{n:05d}.jpg'))
        n += 1
dur = n / FPS
print('frames', n, 'seconds', round(dur, 2))
if dur > 30 and not SHOW:
    sys.exit('over 30 seconds')
os.makedirs(OUT_DIR, exist_ok=True)
out = os.path.join(OUT_DIR, 'Giants and the Comet 886x1920.mp4' if GIANT else 'Battle Showcase 886x1920.mp4' if SHOW else 'App Preview iPhone 886x1920.mp4')
fade_out = 1.4
audio_in = ['-ss', str(START), '-t', f'{dur:.3f}', '-i', MUSIC]
audio_fx = f'[1:a]afade=t=in:st=0:d=0.12,afade=t=out:st={dur - fade_out:.3f}:d={fade_out},volume=-1dB,aresample=48000[a]'
if GIANT:
    # The World 7 track up to the cut to the comet, fading out over 0.6 s; the comet's track fading in
    # over the same 0.6 s so its drop (DROP2) lands on the cut.
    names = [m[0] for m in plan]
    cut = sum(int(c) for nm, c in plan[: names.index('g_comet')]) / FPS
    x = 0.6
    audio_in = ['-ss', str(START), '-t', f'{cut + 0.2:.3f}', '-i', MUSIC, '-ss', f'{DROP2 - x:.3f}', '-t', f'{dur - cut + x:.3f}', '-i', MUSIC2]
    d2 = int((cut - x) * 1000)
    audio_fx = (f'[1:a]afade=t=in:st=0:d=0.12,afade=t=out:st={cut - x:.3f}:d={x}[a1];'
                f'[2:a]afade=t=in:st=0:d={x},afade=t=out:st={dur - cut + x - fade_out:.3f}:d={fade_out},adelay={d2}|{d2}[a2];'
                f'[a1][a2]amix=inputs=2:normalize=0,volume=-1dB,aresample=48000[a]')
    print('cut to the comet at', round(cut, 2), 's')
cmd = [
    'ffmpeg', '-y', '-nostdin', '-v', 'error',
    '-framerate', str(FPS), '-i', os.path.join(seq, '%05d.jpg'),
    *audio_in,
    '-filter_complex', f'[0:v]scale=886:1920:flags=lanczos,format=yuv420p[v];{audio_fx}',
    '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-profile:v', 'high', '-level:v', '4.0', '-preset', 'slow',
    '-b:v', '11M', '-maxrate', '12M', '-bufsize', '22M', '-r', str(FPS), '-g', str(FPS),
    '-c:a', 'aac', '-b:a', '256k', '-ac', '2', '-ar', '48000',
    '-movflags', '+faststart', '-t', f'{dur:.3f}', out,
]
subprocess.run(cmd, check=True)
shutil.rmtree(seq, ignore_errors=True)
print('wrote', out)
