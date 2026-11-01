"""Trace colored seating blocks in the bundled official diagrams; no image changes."""
from pathlib import Path
from collections import defaultdict
import json
import re
import numpy as np
from PIL import Image

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


def gocheok_regions(arr,palette):
    """One convex polygon per printed block; never close aisles across blocks."""
    anchors=json.loads((root/'docs/gocheok-block-labels.json').read_text())
    height,width=arr.shape[:2]; masks={}; zones=defaultdict(list); blocks=[]
    for color,group in palette:
        mask=np.max(np.abs(arr-np.array(color)),axis=2)<26
        mask[:38]=False; mask[510:]=False
        if group=='L3': mask[:300]=False; mask[470:]=False
        if group=='T2': mask[430:]=False
        masks[group]=masks.get(group,np.zeros((height,width),dtype=bool))|mask
    for group,mask in masks.items():
        labels=anchors[group]; assigned=[[] for _ in labels]
        ys,xs=np.where(mask); remaining=set((ys*width+xs).tolist())
        while remaining:
            todo=[remaining.pop()]; points=[]
            while todo:
                p=todo.pop(); y,x=divmod(p,width); points.append((x,y))
                for xx,yy in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                    q=yy*width+xx
                    if 0<=xx<width and 0<=yy<height and q in remaining:
                        remaining.remove(q); todo.append(q)
            cx=sum(p[0] for p in points)/len(points); cy=sum(p[1] for p in points)/len(points)
            i=min(range(len(labels)),key=lambda i:(labels[i][1]-cx)**2+(labels[i][2]-cy)**2)
            if (labels[i][1]-cx)**2+(labels[i][2]-cy)**2>24**2: continue
            assigned[i].extend(points)
        for (label,x,y),points in zip(labels,assigned):
            if len(points)<8: raise ValueError(f'Missing block {group} {label}')
            section=group+('1' if x>width/2 else '3') if group in ('OF','BG','DB') else group
            d='M'+' L'.join(f'{x},{y}' for x,y in hull(points))+' Z'
            zones[section].append(d)
            blocks.append({'id':group+'-'+str(label),'label':str(label),'section':section,'d':d})
    return zones,blocks

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
        zones,blocks=gocheok_regions(arr,palette)
        result[name]={"width":width,"height":height,"blocks":blocks,"paths":{key:" ".join(paths) for key,paths in zones.items()}}
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
            # The source image joins 217/218 with a few blue pixels across the aisle.
            # Keep the two numbered blocks separate along their shared diagonal.
            if name=='jamsil' and group=='B' and min(x for x,y in points)<450 and max(y for x,y in points)>1120:
                for part in ([p for p in points if sum(p)<1580],[p for p in points if sum(p)>=1580]):
                    zones[section].append('M'+' L'.join(f'{x},{y}' for x,y in hull(part))+' Z')
                continue
            points=hull(points)
            zones[section].append('M'+' L'.join(f'{x},{y}' for x,y in points)+' Z')
    if block408:
        zones['OF1'].append('M'+' L'.join(f'{x},{y}' for x,y in hull(block408))+' Z')
    anchors=json.loads((root/'docs/jamsil-block-labels.json').read_text(encoding='utf-8'))
    blocks=[]
    for section,paths in zones.items():
        for d in paths:
            coords=list(map(int,re.findall(r'\d+',d))); xs=coords[::2]; ys=coords[1::2]
            cx=(min(xs)+max(xs))/2; cy=(min(ys)+max(ys))/2
            label=min(anchors[section],key=lambda a:(a[1]-cx)**2+(a[2]-cy)**2)[0]
            blocks.append({'id':section+'-'+str(label),'label':str(label),'section':section,'d':d})
    assert len({b['id'] for b in blocks})==len(blocks), 'Duplicate Jamsil block label'
    result[name]={'width':width,'height':height,'blocks':blocks,'paths':{key:' '.join(paths) for key,paths in zones.items()}}
    print(name, {key:len(paths) for key,paths in zones.items()})
(root/'src/baseballRegions.json').write_text(json.dumps(result,separators=(',',':')),encoding='utf-8')
