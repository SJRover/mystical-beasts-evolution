# The beat in one stretch of a track: its period (to a millisecond) and where the beats fall,
# from the onset envelope, so a trailer's cuts can sit on them.
import subprocess, sys
import numpy as np

MUSIC = 'C:/Users/Samjo/OneDrive/Desktop/Mystical Beasts Evolution'
SR = 22050
HOP = 128

def onsets(name, a, b):
    raw = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-ss', str(a), '-t', str(b - a), '-i', f'{MUSIC}\\{name}.mp3', '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    win = 1024
    n = 1 + (len(x) - win) // HOP
    fr = np.lib.stride_tricks.as_strided(x, shape=(n, win), strides=(x.strides[0] * HOP, x.strides[0]))
    spec = np.abs(np.fft.rfft(fr * np.hanning(win), axis=1))
    # Low end weighted: kicks and bass carry the beat.
    w = np.ones(spec.shape[1]); w[:40] = 3
    flux = np.maximum(0, np.diff(np.log1p(spec), axis=0)) @ w
    return flux - np.convolve(flux, np.ones(64) / 64, mode='same')

def tempo(env, lo=60, hi=180):
    fps = SR / HOP
    best = None
    # Comb: the period whose pulse train lines up best with the envelope, searched finely.
    for bpm in np.arange(lo, hi, 0.05):
        per = 60 / bpm * fps
        idx = np.arange(0, len(env) - 1, per)
        score = max(env[(idx + ph).astype(int).clip(0, len(env) - 1)].sum() for ph in np.linspace(0, per, 24, endpoint=False)) / len(idx)
        if best is None or score > best[0]: best = (score, bpm)
    return best[1]

def phase(env, bpm):
    fps = SR / HOP
    per = 60 / bpm * fps
    idx = np.arange(0, len(env) - per, per)
    scores = [(env[(idx + ph).astype(int)].sum(), ph) for ph in np.linspace(0, per, 96, endpoint=False)]
    return max(scores)[1] / fps

name, a, b = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
env = onsets(name, a, b)
bpm = tempo(env)
first = a + phase(env, bpm)
print(name, 'bpm', round(bpm, 2), 'beat', round(60 / bpm, 4), 's, first beat at', round(first, 3))
# The strongest beat of each group of four, for the bar's downbeat.
fps = SR / HOP
per = 60 / bpm
strength = [0.0] * 4
k = 0
t = first
while t < b - 0.1:
    i = int((t - a) * fps)
    strength[k % 4] += env[max(0, i - 2):i + 3].max()
    t += per; k += 1
down = int(np.argmax(strength))
print('downbeat offset (beats)', down, 'strengths', [round(s, 1) for s in strength], 'first downbeat at', round(first + down * per, 3))
