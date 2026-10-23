"""GAS 2 radio player: one station's two renders -> the page's audio pair (Yoni's renders, 2026-10-23).
  in : <dry.wav> <gas.wav>  (the mix with nothing on the master / the same render with only GAS 2 on it)
  out: player/audio/<id>_before.m4a + <id>_after.m4a
Checks + steps: same rate / length; sample alignment (cross-correlation, must be 0 or it is reported and fixed);
LEVEL MATCH (Yoni 2026-10-22: honest A/B): the GAS 2 side is gained to the dry side's integrated LUFS (BS.1770), then
both share one gain so the louder peak sits at -1 dBFS true-ish (4x oversampled) — never a limiter; AAC 256k.
Usage: python player/tools/prep_audio.py <id> <dry.wav> <gas.wav>"""
import os, subprocess, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import resample_poly, correlate

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), 'audio')


def peak_db(x):
    return 20 * np.log10(np.max(np.abs(resample_poly(x, 4, 1, axis=0))) + 1e-12)


def main(sid, dry_p, gas_p):
    a, sa = sf.read(dry_p, always_2d=True)
    b, sb = sf.read(gas_p, always_2d=True)
    print(f'dry: {sa} Hz {a.shape[1]} ch {len(a) / sa:.2f} s | gas: {sb} Hz {b.shape[1]} ch {len(b) / sb:.2f} s')
    assert sa == sb, 'sample rates differ'
    # alignment: correlate a mono slice from the middle (+-50 ms search)
    n = min(len(a), len(b)); m = n // 2; w = min(sa * 4, n // 3); L = int(sa * .05)
    ca, cb = a[m - w:m + w].mean(1), b[m - w - L:m + w + L].mean(1)
    lag = int(np.argmax(correlate(cb, ca, mode='valid'))) - L
    print('alignment lag (samples, gas vs dry):', lag)
    if lag > 0: b = b[lag:]
    elif lag < 0: a = a[-lag:]
    n = min(len(a), len(b)); a, b = a[:n], b[:n]
    meter = pyln.Meter(sa)
    la, lb = meter.integrated_loudness(a), meter.integrated_loudness(b)
    print(f'LUFS dry {la:.2f} | gas {lb:.2f} (diff {lb - la:+.2f} dB) | peaks dry {peak_db(a):.2f} gas {peak_db(b):.2f} dBFS')
    b = b * 10 ** ((la - lb) / 20)                                   # GAS 2 side to the dry side's loudness
    g = 10 ** ((-1.0 - max(peak_db(a), peak_db(b))) / 20)            # one shared gain: the louder peak at -1 dBFS
    a, b = a * g, b * g
    print(f'after: LUFS dry {meter.integrated_loudness(a):.2f} gas {meter.integrated_loudness(b):.2f} | peaks {peak_db(a):.2f} / {peak_db(b):.2f} dBFS | shared gain {20 * np.log10(g):+.2f} dB')
    os.makedirs(OUT, exist_ok=True)
    for side, x in (('before', a), ('after', b)):
        tmp = os.path.join(OUT, f'_{sid}_{side}.wav'); dst = os.path.join(OUT, f'{sid}_{side}.m4a')
        sf.write(tmp, x, sa, subtype='FLOAT')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', dst], check=True)
        os.remove(tmp)
        print(dst, os.path.getsize(dst), 'bytes')


if __name__ == '__main__':
    main(*sys.argv[1:4])
