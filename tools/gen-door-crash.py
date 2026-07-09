#!/usr/bin/env python3
"""Generate the crane door-drop crash sound (public/audio/door-crash.wav).

Layered synthesis of a heavy car door slamming onto concrete, timed to the
CraneDropZone impact choreography (main hit at t=0, the door's 7px bounce
re-contact ~t=0.18s):
  1. body thump      — 150→55 Hz pitch-dropping sine, fast decay
  2. metallic clang  — inharmonic decaying partials with detuned beating
  3. crash transient — band-passed noise burst
  4. bounce clang    — smaller replay of (1)+(2) at +0.18 s
  5. debris tail     — low-passed noise, slow decay

Deterministic (fixed seed) like the other tools/gen-*.py generators.
Usage: python3 tools/gen-door-crash.py
"""
import struct
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 1.35
rng = np.random.default_rng(7)

t = np.arange(int(SR * DUR)) / SR
out = np.zeros_like(t)


def env(decay, delay=0.0):
    """Exponential decay envelope starting at `delay` seconds."""
    e = np.exp(-(t - delay) / decay)
    e[t < delay] = 0.0
    return e


def thump(delay, gain):
    # pitch-dropping body hit: 150 Hz falling to 55 Hz over ~60 ms
    f = 55 + 95 * np.exp(-(np.maximum(t - delay, 0)) / 0.06)
    phase = 2 * np.pi * np.cumsum(f) / SR
    return gain * np.sin(phase) * env(0.16, delay)


def clang(delay, gain):
    # inharmonic door-metal modes; detuned pairs beat like a real panel
    modes = [(173, 0.30), (419, 0.26), (587, 0.22), (887, 0.16),
             (1354, 0.12), (2145, 0.09), (3339, 0.06)]
    s = np.zeros_like(t)
    for f0, a in modes:
        for det in (0, rng.uniform(1.5, 4.0)):
            ph = rng.uniform(0, 2 * np.pi)
            dec = rng.uniform(0.10, 0.32)
            s += a * 0.5 * np.sin(2 * np.pi * (f0 + det) * (t - delay) + ph) * env(dec, delay)
    return gain * s


def noise_burst(delay, gain, decay, lo=800, hi=6000):
    n = rng.standard_normal(len(t))
    spec = np.fft.rfft(n)
    freqs = np.fft.rfftfreq(len(t), 1 / SR)
    spec[(freqs < lo) | (freqs > hi)] = 0
    n = np.fft.irfft(spec, len(t))
    n /= np.abs(n).max()
    return gain * n * env(decay, delay)


out += thump(0.0, 0.95)
out += clang(0.0, 0.8)
out += noise_burst(0.0, 0.55, 0.08)
# the choreographed bounce re-contact
out += thump(0.18, 0.4)
out += clang(0.18, 0.3)
out += noise_burst(0.18, 0.2, 0.05)
# settling debris
out += noise_burst(0.05, 0.12, 0.35, lo=120, hi=1400)

# gentle master fade + normalize to -1 dBFS
out *= np.minimum(1.0, (DUR - t) / 0.25)
out = out / np.abs(out).max() * 10 ** (-1 / 20)

dst = Path(__file__).resolve().parent.parent / 'public' / 'audio' / 'door-crash.wav'
dst.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(dst), 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(struct.pack('<%dh' % len(out), *(out * 32767).astype(np.int16)))
print(f'wrote {dst} ({dst.stat().st_size // 1024} KB)')
