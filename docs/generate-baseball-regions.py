"""Trace colored seating blocks in the bundled official diagrams; no image changes."""
from pathlib import Path
from collections import defaultdict
import json
import numpy as np
from PIL import Image, ImageFilter

root = Path(__file__).resolve().parents[1]

def hull(points):
    points = sorted(set(points))
    def cross(o,a,b): return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
    lower, upper = [], []
    for p in points:
        while len(lower)>1 and cross(lower[-2],lower[-1],p)<=0: lower.pop()
        lower.append(p)
    for p in reversed(points):
        while len(upper)>1 and cross(upper[-2],upper[-1],p)<=0: upper.pop()
        upper.append(p)
    return lower[:-1]+upper[:-1]


def simplify(points, tolerance=0.85):
    if len(points)<3: return points
    a,b=np.array(points[0],dtype=float),np.array(points[-1],dtype=float)
    delta=b-a
    distances=[abs(delta[0]*(p[1]-a[1])-delta[1]*(p[0]-a[0]))/max(np.linalg.norm(delta),1) for p in points]
    index=int(np.argmax(distances))
    if distances[index]<=tolerance: return [points[0],points[-1]]
    return simplify(points[:index+1],tolerance)[:-1]+simplify(points[index:],tolerance)

def outline(mask):
    """Trace outer pixel boundaries, keeping the concave seating bowl intact."""
    edges = {}
    for y,x in zip(*np.where(mask)):
        for adjacent,a,b in (
            ((y-1,x),(x,y),(x+1,y)),
            ((y,x+1),(x+1,y),(x+1,y+1)),
            ((y+1,x),(x+1,y+1),(x,y+1)),
            ((y,x-1),(x,y+1),(x,y))):
            yy,xx=adjacent
            if yy<0 or xx<0 or yy>=mask.shape[0] or xx>=mask.shape[1] or not mask[yy,xx]:
                edges.setdefault(a,[]).append(b)
    paths=[]
    while edges:
        start=next(iter(edges)); point=start; ring=[]
        while True:
            ring.append(point)
            candidates=edges[point]; nxt=candidates.pop()
            if not candidates: del edges[point]
            point=nxt
            if point==start: break
        area=sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(ring,ring[1:]+ring[:1]))/2
        # Clockwise exteriors only: discard text holes and isolated color noise.
        if area<30: continue
        ring=[p for i,p in enumerate(ring) if
              (p[0]-ring[i-1][0],p[1]-ring[i-1][1]) !=
              (ring[(i+1)%len(ring)][0]-p[0],ring[(i+1)%len(ring)][1]-p[1])]
        pivot=max(range(len(ring)),key=lambda i:(ring[i][0]-ring[0][0])**2+(ring[i][1]-ring[0][1])**2)
        ring=simplify(ring[:pivot+1])[:-1]+simplify(ring[pivot:]+ring[:1])[:-1]
        paths.append('M'+' L'.join(f'{x},{y}' for x,y in ring)+' Z')
    return paths

def gocheok_regions(arr,palette):
    height,width=arr.shape[:2]; masks={}
    for color,group in palette:
        mask=np.max(np.abs(arr-np.array(color)),axis=2)<26
        mask[:38]=False; mask[510:]=False
        if group=='L3': mask[:300]=False; mask[470:]=False
        if group=='T2': mask[430:]=False
        masks[group]=masks.get(group,np.zeros((height,width),dtype=bool))|mask
    zones={}
    for group,mask in masks.items():
        # Close letter-sized gaps before tracing. Never use a convex hull on
        # connected tiers: it would cover the field and neighbouring grades.
        closed=np.array(Image.fromarray(mask.astype('uint8')*255)
                        .filter(ImageFilter.MaxFilter(7))
                        .filter(ImageFilter.MinFilter(7)))>0
        if group in ('OF','BG','DB'):
            left=closed.copy();left[:,width//2:]=False
            right=closed.copy();right[:,:width//2]=False
            zones[group+'3']=outline(left); zones[group+'1']=outline(right)
        else: zones[group]=outline(closed)
    return zones

result = {}
palettes = {
 'jamsil': [((36,41,83),'N'),((52,150,0),'OF'),((221,0,42),'R'),((225,105,0),'O'),((70,153,242),'B'),((5,94,221),'C'),((124,0,101),'C')],
 'gocheok': [((253,208,0),'L4'),((170,205,6),'OF'),((138,7,35),'BG'),((76,14,27),'DB'),((43,167,203),'T2'),((240,130,0),'L3'),((8,32,81),'T1'),((42,72,157),'T1'),((231,89,130),'RD')]
}
for name,palette in palettes.items():
    arr=np.array(Image.open(root/'public/baseball'/f'{name}-map.png').convert('RGB')).astype(np.int16)
    height,width=arr.shape[:2]
    zones=defaultdict(list)
    if name=="gocheok":
        zones=gocheok_regions(arr,palette)
        result[name]={"width":width,"height":height,"paths":{key:" ".join(paths) for key,paths in zones.items()}}
        print(name, {key:len(paths) for key,paths in zones.items()})
        continue
    block408=[]
    for color,group in palette:
        mask=np.max(np.abs(arr-np.array(color)),axis=2)<(5 if name=='jamsil' else 26)
        # Exclude legends and entrance icons outside the seating bowl.
        if name=='gocheok': mask[:38]=False; mask[510:]=False
        ys,xs=np.where(mask)
        remaining=set((ys*width+xs).tolist())
        while remaining:
            start=remaining.pop(); todo=[start]; points=[]
            while todo:
                p=todo.pop(); y,x=divmod(p,width); points.append((x,y))
                for q in (p-1,p+1,p-width,p+width):
                    if q in remaining: remaining.remove(q); todo.append(q)
            if len(points)<(350 if name=='jamsil' else 18): continue
            cx=sum(p[0] for p in points)/len(points)
            cy=sum(p[1] for p in points)/len(points)
            # The white 408 label cuts its green fill into two components.
            # Trace their shared exterior, rather than outlining the lettering gap.
            if name=='jamsil' and group=='OF' and 1010<cx<1085 and 210<cy<295:
                block408.extend(points)
                continue
            if name=='jamsil' and group=='O' and cy<height*.5: continue
            if name=='gocheok' and group=='L3' and cy<300: continue
            section=group+('1' if cx>width/2 else '3') if group in ('N','OF','R','O','B','BG','DB') else group
            points=hull(points)
            zones[section].append('M'+' L'.join(f'{x},{y}' for x,y in points)+' Z')
    if block408:
        zones['OF1'].append('M'+' L'.join(f'{x},{y}' for x,y in hull(block408))+' Z')
    result[name]={'width':width,'height':height,'paths':{key:' '.join(paths) for key,paths in zones.items()}}
    print(name, {key:len(paths) for key,paths in zones.items()})
(root/'src/baseballRegions.json').write_text(json.dumps(result,separators=(',',':')),encoding='utf-8')
