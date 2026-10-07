"""RevLimiter 3.2.1 (release, default program 1. Master Glue) on the summed stems.
Input = the 4 processed stems at unity, tiled 3x; keep the middle pass (limiter settled, tails wrap)."""
import pedalboard, numpy as np, soundfile as sf, pyloudnorm as pyln, os, json, subprocess
from scipy.signal import correlate, resample_poly
A=r"C:\RevAudio\Website\revaudio-website\bench\assets\station-mixer\audio"
L=1024000; m=pyln.Meter(48000); out={}
for v in ["dry","s1","s2","s3","s4","s5"]:
    p=pedalboard.load_plugin(r"C:\Program Files\Common Files\VST3\RevLimiter.vst3\Contents\x86_64-win\RevLimiter.vst3")
    mix=sum(sf.read(os.path.join(A,f"{s}_{v}.flac"),dtype='float64')[0] for s in ["drums","bass","keys","guitar"])
    y=p(np.tile(mix,(3,1)).T.astype(np.float32),48000).T.astype(np.float64)
    c=correlate(y[L:L+96000,0],mix[:96000,0],mode="full",method="fft"); lag=int(np.argmax(c))-95999
    seg=y[L+lag:2*L+lag].copy()
    step=seg[0]-seg[-1]; w=0.5-0.5*np.cos(np.pi*np.arange(1,241)/240); seg[-240:]+=w[:,None]*step[None,:]
    tp=20*np.log10(np.abs(resample_poly(seg,4,1,axis=0)).max())
    subprocess.run(["ffmpeg","-v","error","-y","-f","f64le","-ar","48000","-ac","2","-i","-","-c:a","flac","-sample_fmt","s32","-bits_per_raw_sample","24",os.path.join(A,f"rl_{v}.flac")],input=seg.tobytes(),check=True)
    out[v]={"lag":lag,"in_lufs":round(m.integrated_loudness(mix),2),"out_lufs":round(m.integrated_loudness(seg),2),"tp":round(tp,2)}
    print(v,out[v])
man=json.load(open(os.path.join(A,"manifest.json"))); man["revlimiter"]={"plugin":"RevLimiter 3.2.1 release, program 1. Master Glue, defaults","renders":out}
json.dump(man,open(os.path.join(A,"manifest.json"),"w"),indent=1)
