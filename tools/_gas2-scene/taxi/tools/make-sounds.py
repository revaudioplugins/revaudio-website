"""The taxi's sounds (taxi/README.md "The sound"). Sources: CC0 recordings from freesound.org, decoded to 48 kHz mono WAV
first (ffmpeg -i <id>.mp3 -ac 1 -ar 48000 <name>48.wav): horn48 = 438612, car48 = 675247, scr48 = 271337.
Then: python3 make-sounds.py (in that folder) and encode each out/*.wav with ffmpeg -c:a aac -b:a 96k -> audio/*.m4a."""
# Cuts the taxi's four sounds from the CC0 recordings (48 kHz mono float), sets each to a loudness target, writes WAVs.
import wave, numpy as np, subprocess, json, re, sys
SR=48000
def load(p):
    w=wave.open(p); x=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float64)/32768; return x
def cut(x,t0,t1): return x[int(t0*SR):int(t1*SR)].copy()
def fade(x,fi,fo,shape='cos'):
    n=len(x); a=int(fi*SR); b=int(fo*SR)
    if a: x[:a]*=0.5-0.5*np.cos(np.linspace(0,np.pi,a))
    if b: x[n-b:]*=0.5+0.5*np.cos(np.linspace(0,np.pi,b))
    return x
def save(p,x):
    y=np.clip(x,-1,1); w=wave.open(p,'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y*32767).astype(np.int16).tobytes()); w.close()
def lufs(p):
    r=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',p,'-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True).stderr
    I=float(re.findall(r'I:\s+(-?[\d.]+) LUFS',r)[-1]); P=float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS',r)[-1]); return I,P
def to_target(name,x,target):
    save(f'out/{name}.wav',x); I,P=lufs(f'out/{name}.wav')
    g=10**((target-I)/20); y=x*g
    pk=np.abs(y).max()
    if pk>0.89: y*=0.89/pk  # true-peak-ish headroom: never above -1 dBFS
    save(f'out/{name}.wav',y); I2,P2=lufs(f'out/{name}.wav'); print(f'{name}: {len(y)/SR:.2f}s  {I:.1f} -> {I2:.1f} LUFS, peak {P2:.1f} dBFS')

horn=load('horn48.wav'); car=load('car48.wav'); scr=load('scr48.wav')
# 1. arrive: the car rolls in on dirt and stops (S03-26, 46.4-49.9 s; the stop lands at 2.5 s into the clip)
arrive=fade(cut(car,46.4,49.9),1.0,0.25)
# 2. honk: two blasts of the Ford V-8 horn (G37-07): a short one, a beat, a longer one
h1=fade(cut(horn,2.585-0.005,2.585+0.26),0.004,0.04)
h2=fade(cut(horn,4.525-0.005,4.525+0.45),0.004,0.07)
honk=np.concatenate([h1,np.zeros(int(0.14*SR)),h2])
# 3. peel: the tyre squeal (Car peels off, 0-2.85 s) over the engine pulling away on dirt (S03-26 4.4-6.9 s) 8 dB under
sq=cut(scr,0.0,2.85); eng=fade(cut(car,4.4,4.4+2.85),0.02,0.6)
e_rms=np.sqrt((eng**2).mean()); s_rms=np.sqrt((sq**2).mean())
peel=fade(sq+eng*(s_rms/e_rms)*10**(-8/20),0.003,0.5)
to_target('arrive',arrive,-21); to_target('honk',honk,-15); to_target('peel',peel,-14)

# 4. leave ("not now"): the same old car pulling away on dirt and fading (S03-26, 9.0-13.0 s)
leave=fade(cut(car,9.0,13.0),0.12,1.6)
to_target('leave',leave,-22)

# 5. idle: an old car idling (573177 "Old car start idle revs pulls away rumble" by TRP, 8.6-15.0 s; first decoded with
#    ffmpeg -i 573177.mp3 -ac 1 -ar 48000 idle48.wav), as a seamless 6 s loop: the last 0.4 s cross-faded (equal power)
#    into the 0.4 s that come before the loop's first sample, so the wrap is continuous.
x=load('idle48.wav'); F, L = int(.4*SR), int(6*SR)
seg=cut(x,8.6,8.6+6.4); y=seg[F:F+L].copy(); t=np.linspace(0,np.pi/2,F)
y[L-F:]=seg[L:L+F]*np.cos(t)+seg[0:F]*np.sin(t)
to_target('idle',y,-27)

