# the live things' quads in film pixels, per frame, from the render's own camera (x 0, no turn, 49 deg vertical, 16:9)
import json, math, sys
D = './'
cams = json.load(open(D + 'src/cams.json')); W = json.load(open(D + 'world.json'))
def proj(c, P):
    t = math.tan(math.radians(c['fov']) / 2); X, Y, Z = P[0] - c['x'], P[1] - c['y'], P[2] - c['z']
    if Z >= -1e-4: return None
    return ((X / -Z) / (t * c['aspect']) + 1) / 2 * 1920, (1 - (Y / -Z) / t) / 2 * 1080
def quads(i):
    c = cams[i]; q = {'TV': [proj(c, p) for p in W['tv']]}
    for k, m in W['monitors'].items(): q[k] = [proj(c, p) for p in m['c']]
    for k, m in W['posters'].items(): q[k] = [proj(c, p) for p in m['c']]
    return q
if __name__ == '__main__':
    out = [quads(i) for i in range(len(cams))]
    json.dump(out, open(D + 'quads.json', 'w'))
    tv = [(round((q['TV'][0][0] + q['TV'][1][0]) / 2, 1), round((q['TV'][0][1] + q['TV'][3][1]) / 2, 1), round(q['TV'][1][0] - q['TV'][0][0], 1)) for q in out]
    print('tv first', tv[0], 'mid', tv[120], 'last', tv[-1])
