import KspoDiagram from './KspoDiagram';
import InspireDiagram from './InspireDiagram';
import BaseballDiagram from './BaseballDiagram';
import type { Venue, VenueSection } from './venues';

type Props = { venue: Venue; selected: string; available: (id: string) => number; onSection: (id: string) => void };
type Shape = { d: string; x: number; y: number; fill: string };

const point = (cx: number, cy: number, r: number, angle: number) => ({ x: cx + r * Math.cos(angle * Math.PI / 180), y: cy + r * Math.sin(angle * Math.PI / 180) });
function arc(cx: number, cy: number, inner: number, outer: number, from: number, to: number): Shape {
  const a = point(cx, cy, outer, from), b = point(cx, cy, outer, to);
  const c = point(cx, cy, inner, to), d = point(cx, cy, inner, from);
  const large = to - from > 180 ? 1 : 0;
  return { d: `M${a.x},${a.y} A${outer},${outer} 0 ${large} 1 ${b.x},${b.y} L${c.x},${c.y} A${inner},${inner} 0 ${large} 0 ${d.x},${d.y} Z`, x: point(cx, cy, (inner + outer) / 2, (from + to) / 2).x, y: point(cx, cy, (inner + outer) / 2, (from + to) / 2).y, fill: '#ccd4d0' };
}
const rect = (x: number, y: number, w: number, h: number, fill: string): Shape => ({ d: `M${x},${y}h${w}v${h}h${-w}Z`, x: x + w / 2, y: y + h / 2, fill });

function shapeFor(venue: Venue, item: VenueSection): Shape {
  const id = item.id;
  if (venue.id === 'goyang') {
    if(id==='S1'||id==='S2')return rect(id==='S1'?179:205,121,19,27,'#159b52');
    if(id.startsWith('F')){
      const n=Number(id.slice(1));
      const positions:Record<number,number[]>={1:[146,128,27,35],2:[227,128,27,35],3:[146,168,27,31],4:[227,168,27,31],5:[177,179,22,20],6:[203,179,22,20],7:[146,203,20,27],8:[169,203,20,27],9:[192,203,20,27],10:[215,203,20,27],11:[238,203,20,27],12:[146,234,20,34],13:[169,234,20,34],14:[215,234,20,34],15:[238,234,20,34]};
      const p=positions[n];return rect(p[0],p[1],p[2],p[3],n<=11?'#9922d3':'#f58b18');
    }
    if(id.startsWith('E')){const n=Number(id.slice(1)),inner=n<=5,i=inner?n-1:n-6;return {...arc(200,192,inner?113:144,inner?139:169,136+i*(inner?14:12),148+i*(inner?14:12)),fill:inner?'#03bed6':'#1789dd'};}
    if(id.startsWith('W')){const n=Number(id.slice(1)),inner=n<=3;
      const pos:Record<number,number[]>={0:[-4,13],1:[-25,-7],2:[16,45],3:[-45,-28]};
      const range=inner?pos[n]:[-24+(n-4)*14,-12+(n-4)*14];
      return {...arc(200,192,inner?113:144,inner?139:169,range[0],range[1]),fill:inner?'#03bed6':'#1789dd'};
    }
    if(id.startsWith('N')){const n=Number(id.slice(1)),inner=n<=5,i=inner?n-1:n-6;return {...arc(200,192,inner?113:144,inner?139:169,46+i*(inner?18:16),62+i*(inner?18:16)),fill:n===3?'#505258':inner?'#1789dd':'#de5c9d'};}
  }
  if (venue.id === 'kspo') {
    if (item.kind === 'standing') return rect(id === 'F-A' ? 169 : 202, 158, 31, 100, '#32b88b');
    const number = Number(id), kspo = venue.id === 'kspo';
    const start = kspo ? number <= 22 ? 1 : 23 : number < 300 ? 201 : number < 400 ? 301 : 401;
    const count = kspo ? number <= 22 ? 22 : 30 : 20;
    const tier = kspo ? number <= 22 ? 0 : 1 : number < 300 ? 0 : number < 400 ? 1 : 2;
    const inner = kspo ? 105 + tier * 31 : 88 + tier * 27;
    const from = -48 + (number - start) * 276 / count;
    return { ...arc(200, 188, inner, inner + (kspo ? 28 : 24), from, from + 276 / count - 1.2), fill: tier === 0 ? '#50b6a4' : tier === 1 ? '#85aaa5' : '#a7aaa9' };
  }
  if (venue.id === 'worldcup') {
    if (item.kind === 'standing') return rect(id === 'F-A' ? 149 : id === 'F-B' ? 184 : 219, 156, 33, 87, '#61b775');
    const side = id[0], n = Number(id.slice(1)), outer = n > 6, col = (n - 1) % 6;
    const fill = outer ? '#91aebe' : '#4e92af';
    if (side === 'E') return rect(88 + col * 37, outer ? 41 : 70, 34, 25, fill);
    if (side === 'W') return rect(88 + col * 37, outer ? 322 : 293, 34, 25, fill);
    if (side === 'N') return rect(outer ? 27 : 58, 85 + col * 37, 26, 34, fill);
    return rect(outer ? 347 : 316, 85 + col * 37, 26, 34, fill);
  }
  const baseballColors: Record<string, string> = { VIP: '#6e5a92', ORANGE: '#ee993f', BLUE: '#4285ba', RED: '#d46b68', NAVY: '#476181', OUTFIELD: '#69aa78' };
  const spans:Record<string,number[]>={C:[70,110,128,160],O1:[30,65,128,157],O3:[115,150,128,157],B1:[-5,27,129,158],B3:[153,185,129,158],R1:[-40,-8,130,157],R3:[188,220,130,157],N1:[-40,65,163,183],N3:[115,220,163,183],OF1:[-87,-44,133,174],OF3:[224,267,133,174]};
  const span=spans[id];return {...arc(200,178,span[2],span[3],span[0],span[1]),fill:baseballColors[item.grade]??'#78a67d'};
}

export default function VenueDiagram({ venue, selected, available, onSection }: Props) {
  if (venue.type === 'baseball') return <BaseballDiagram key={venue.id} venue={venue} selected={selected} available={available} onSection={onSection}/>;
  if (venue.id === 'kspo') return <KspoDiagram venue={venue} selected={selected} available={available} onSection={onSection}/>;
  if (venue.id === 'inspire') return <InspireDiagram venue={venue} selected={selected} available={available} onSection={onSection}/>;
  const goyang = venue.id === 'goyang';
  return <div className={`venue-diagram venue-diagram-${venue.id}`}>
    <svg viewBox="0 0 400 390" role="group" aria-label={`${venue.name} 좌석 배치도. 색상 구역을 눌러 선택하세요.`}>
      {goyang && <>
        {Array.from({ length: 14 }, (_, i) => <path key={i} d={arc(200, 190, 113, 169, 215 + i * 7.5, 221 + i * 7.5).d} fill="#b9bdbf" stroke="white" strokeWidth="2"/>)}
        <text x="200" y="12" textAnchor="middle" className="diagram-title">GOYANG STADIUM</text>
        <text x="23" y="93" className="diagram-sector">E SECTOR</text><text x="329" y="93" className="diagram-sector">W SECTOR</text>
        <text x="200" y="374" textAnchor="middle" className="diagram-sector">N SECTOR</text>
        <circle cx="86" cy="105" r="12" fill="#333"/><text x="86" y="109" textAnchor="middle" className="diagram-tier">2F</text>
        <circle cx="314" cy="105" r="12" fill="#333"/><text x="314" y="109" textAnchor="middle" className="diagram-tier">2F</text>
      </>}
      {venue.id === 'worldcup' && <>
        <path d="M90 35 L310 35 L380 105 L380 290 L310 355 L90 355 L20 290 L20 105 Z" fill="#e7edf0" stroke="#a6b8bf" strokeWidth="2"/>
        <rect x="91" y="99" width="218" height="190" rx="3" fill="#e4eee2"/>
        <text x="200" y="26" textAnchor="middle" className="diagram-sector">EAST</text><text x="200" y="376" textAnchor="middle" className="diagram-sector">WEST</text>
        <text x="19" y="199" textAnchor="middle" className="diagram-sector">N</text><text x="382" y="199" textAnchor="middle" className="diagram-sector">S</text>
      </>}

      {venue.id === 'jamsil' && <><ellipse cx="200" cy="178" rx="184" ry="170" fill="#e7eee8"/><path d="M128 145 L200 85 L272 145 L200 244Z" fill="#a3c48d"/><text x="200" y="188" textAnchor="middle" className="diagram-sector">FIELD</text></>}
      {venue.sections.map(item => {
        const shape = shapeFor(venue, item), active = selected === item.id, empty = available(item.id) === 0;
        return <g key={item.id} className={`diagram-zone ${active ? 'is-active' : ''} ${empty ? 'is-empty' : ''}`} role="button" tabIndex={empty ? -1 : 0} aria-disabled={empty} aria-label={`${item.label}, 잔여 ${available(item.id)}석`} aria-pressed={active} onClick={() => { if (!empty) onSection(item.id); }} onKeyDown={event => { if (!empty && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onSection(item.id); } }}>
          <path d={shape.d} fill={empty ? '#d4d7d6' : shape.fill} stroke="white" strokeWidth={active ? 3 : 1.6}/>
          <text x={shape.x} y={shape.y + 2} textAnchor="middle" dominantBaseline="middle" className={goyang ? 'diagram-label diagram-label-goyang' : 'diagram-label'}>{item.id}</text>
        </g>;
      })}
      {goyang && <path d="M170 126 L201 174 L232 126 M201 174 V192" stroke="#202522" strokeWidth="6" fill="none" pointerEvents="none"/>}
      {venue.type === 'concert' && <><rect x="150" y={goyang ? 97 : 105} width="100" height="26" rx="2" fill="#1b2221"/><text x="200" y={goyang ? 114 : 122} textAnchor="middle" className="diagram-stage">STAGE</text></>}
    </svg>
    {goyang && <div className="diagram-legend"><span><i style={{background:'#02b873'}}/>스탠딩 VIP</span><span><i style={{background:'#932ce9'}}/>플로어 R</span><span><i style={{background:'#ff851c'}}/>플로어 S</span><span><i style={{background:'#05cce6'}}/>R</span><span><i style={{background:'#138cff'}}/>S</span><span><i style={{background:'#ed55a8'}}/>A</span></div>}
  </div>;
}
