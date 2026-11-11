# the FILM entry for room.html: the film's camera per frame (z, y) and the live things' corners in the world
import json
D = './'
cams = json.load(open(D + 'src/cams.json')); W = json.load(open(D + 'world.json'))
f4 = lambda v: ('%.4f' % v).rstrip('0').rstrip('.')
cam = ', '.join(f4(c['z']) + ', ' + f4(c['y']) for c in cams)
def corners(c): return '[' + ', '.join(f4(v) for p in c for v in p) + ']'
live = ', '.join([f"TV: {corners(W['tv'])}"] + [f"{k}: {corners(m['c'])}" for k, m in W['monitors'].items()])
print(f"cam: [{cam}],")
print(f"live: {{ {live} }},")
print('frames', len(cams), 'fov', cams[0]['fov'], 'aspect', cams[0]['aspect'])
