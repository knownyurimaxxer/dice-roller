"""
Generates the app's sound effects as small WAV files in assets/sounds/.
Everything is synthesized (no samples, no downloads), so the files are free to
use however you like. Needs only the Python standard library.

    python3 tools/generate_sounds.py

Files:
  clack_a/b/c.wav  one die hitting something (three pitches, played in turn)
  roll.wav         dice rattling in a hand, then on the table
  win.wav          the short celebration when a result shows
  win_big.wav      a longer one for a perfect roll
"""
import math
import os
import random
import struct
import wave

RATE = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "sounds")
random.seed(7)  # the same files every time


def write(name, samples, peak=0.85):
    top = max(1e-9, max(abs(s) for s in samples))
    data = b"".join(
        struct.pack("<h", int(max(-1, min(1, s / top * peak)) * 32767))
        for s in samples
    )
    path = os.path.join(OUT, name)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(data)
    print(f"{name}: {len(samples) / RATE:.2f}s, {os.path.getsize(path) // 1024} KB")


def clack(freq, length=0.11, bright=1.0):
    """A hard plastic knock: a burst of noise plus two quickly dying tones."""
    n = int(length * RATE)
    out = []
    low = 0.0
    for i in range(n):
        t = i / RATE
        noise = random.uniform(-1, 1)
        low += (noise - low) * 0.35  # soften the noise a little
        tone = math.sin(2 * math.pi * freq * t) * math.exp(-t * 55)
        tone += 0.5 * math.sin(2 * math.pi * freq * 1.73 * t) * math.exp(-t * 80)
        tone += 0.25 * math.sin(2 * math.pi * freq * 0.5 * t) * math.exp(-t * 40)
        burst = (noise * 0.6 * bright + low * 0.6) * math.exp(-t * 190)
        out.append(tone * 0.8 + burst)
    return out


def mix_into(dest, src, at, gain=1.0):
    start = int(at * RATE)
    for i, s in enumerate(src):
        j = start + i
        if j < len(dest):
            dest[j] += s * gain


def roll():
    """A handful of dice: lots of small clacks, fast at first, then spreading out."""
    length = 1.25
    out = [0.0] * int(length * RATE)
    # a low rumble of dice sliding around
    lp = 0.0
    for i in range(len(out)):
        t = i / RATE
        lp += (random.uniform(-1, 1) - lp) * 0.06
        out[i] += lp * 0.55 * math.exp(-t * 2.2) * min(1, t * 30)
    t = 0.0
    k = 0
    while t < length - 0.15:
        f = random.choice([900, 1250, 1700, 2300, 3000])
        click = clack(f, 0.07, 0.8)
        mix_into(out, click, t, 0.55 * math.exp(-t * 1.6) + 0.12)
        t += random.uniform(0.012, 0.03) * (1 + t * 2.4)
        k += 1
    return out


def bell(freq, length, gain=1.0):
    n = int(length * RATE)
    out = []
    for i in range(n):
        t = i / RATE
        env = min(1, t * 400) * math.exp(-t * 4.5)
        v = math.sin(2 * math.pi * freq * t)
        v += 0.35 * math.sin(2 * math.pi * freq * 2 * t) * math.exp(-t * 3)
        v += 0.12 * math.sin(2 * math.pi * freq * 3.01 * t) * math.exp(-t * 6)
        out.append(v * env * gain)
    return out


NOTE = {"C5": 523.25, "E5": 659.25, "G5": 783.99, "C6": 1046.5, "E6": 1318.5, "G6": 1568.0}


def win(big=False):
    steps = ["C5", "E5", "G5", "C6"] + (["E6", "G6"] if big else [])
    gap = 0.085 if not big else 0.075
    length = 0.55 + gap * len(steps) + (0.5 if big else 0.2)
    out = [0.0] * int(length * RATE)
    for k, name in enumerate(steps):
        mix_into(out, bell(NOTE[name], 0.9 if big else 0.7), k * gap, 0.8)
    last = len(steps) * gap
    for name in (["C5", "G5", "C6"] if not big else ["C5", "E5", "G5", "C6", "E6"]):
        mix_into(out, bell(NOTE[name], 1.0 if big else 0.7), last, 0.5)
    if big:  # a little sparkle on top
        for k in range(10):
            mix_into(out, bell(random.choice([2093, 2637, 3136]), 0.25), last + 0.05 + k * 0.045, 0.18)
    return out


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    write("clack_a.wav", clack(1900))
    write("clack_b.wav", clack(2500, 0.1, 1.1))
    write("clack_c.wav", clack(1500, 0.12, 0.9))
    write("roll.wav", roll())
    write("win.wav", win(False))
    write("win_big.wav", win(True))
