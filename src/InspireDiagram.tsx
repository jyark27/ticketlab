import type {Venue} from './venues';
type Shape={d:string;x:number;y:number};
const box=(x:number,y:number,w:number,h:number):Shape=>({d:`M${x} ${y}h${w}v${h}h${-w}Z`,x:x+w/2,y:y+h/2});
const polygon=(d:string,x:number,y:number):Shape=>({d,x,y});
// Coordinates traced from the user-provided seating plan (2026-10-22).
const blocks:Record<string,Shape>={
 F1:box(152,113,32,40),F2:polygon('M188 113H210L225 126L210 133V153H188Z',201,132),
 F3:polygon('M264 113H287V153H265V133L250 126Z',275,133),F4:box(292,113,31,40),
 F5:box(178,186,26,40),F6:box(209,186,26,40),F7:box(240,186,26,40),F8:box(271,186,26,40),
 '203':box(332,116,31,39),'204':box(332,159,30,44),
 '205':polygon('M332 207H373V243L332 230Z',351,220),
 '206':polygon('M331 234L371 248L344 280L321 292L306 263Z',338,260),
 '207':polygon('M265 263H302L316 292H265Z',285,277),
 '208':box(213,263,49,29),'209':polygon('M176 263H209V292H161Z',189,278),
 '210':polygon('M147 234L172 261L157 291L116 256Z',145,259),
 '211':polygon('M112 207H143V230L112 242Z',127,221),
 '212':box(112,159,31,44),'213':box(112,116,31,39),
 '308':polygon('M205 296H262V312H277V324H205Z',237,310),
 '309':polygon('M150 296H202V324H141L129 315Z',171,310),
 '310':polygon('M110 260L151 295L127 318L99 286Z',122,286),
 '311':polygon('M77 207H108V247L96 260L91 271L77 258Z',92,238),
 '312':polygon('M77 159H87V171H108V203H77Z',92,185),'313':box(77,116,31,39)
};
export default function InspireDiagram({venue,selected,available,onSection}:{venue:Venue;selected:string;available:(id:string)=>number;onSection:(id:string)=>void}){
 return <div className="venue-diagram venue-diagram-inspire"><svg viewBox="55 40 335 310" role="group" aria-label="인스파이어 아레나 좌석 배치도. 구역을 눌러 선택하세요.">
 <g className="inspire-stage" aria-hidden="true">
 <path d="M157 66H317V96H267L243 108V140H258V162H310V232L291 252H183L164 232V162H209V140H231V108L208 96H157Z M176 174V227L188 240H286L298 227V174Z" fill="#8b7c76" fillRule="evenodd"/>
 <text x="237" y="85" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">STAGE</text>
 <text x="234" y="157" textAnchor="middle" fill="white" fontSize="9" fontWeight="700">STAGE</text>
 <rect x="185" y="234" width="101" height="6" fill="#aaa5a1"/><text x="235" y="239" textAnchor="middle" fill="#3e3b38" fontSize="4">CONSOLE</text>
 <text x="149" y="191" textAnchor="middle" transform="rotate(-90 149 191)" fill="#6b625e" fontSize="5">CONSOLE</text>
 <text x="325" y="191" textAnchor="middle" transform="rotate(-90 325 191)" fill="#6b625e" fontSize="5">CONSOLE</text>
 </g>
 {venue.sections.map(section=>{const shape=blocks[section.id],empty=available(section.id)===0,active=selected===section.id;return <g key={section.id} className={`diagram-zone ${active?'is-active':''} ${empty?'is-empty':''}`} role="button" tabIndex={empty?-1:0} aria-disabled={empty} aria-pressed={active} aria-label={`${section.label}, 잔여 ${available(section.id)}석`} onClick={()=>{if(!empty)onSection(section.id);}} onKeyDown={e=>{if(!empty&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onSection(section.id);}}}>
 <path d={shape.d} fill={empty?'#e8e8e6':active?'#c9dcd1':section.level==='플로어'?'#c8c6c3':'#e0dfdc'} stroke="#fff" strokeWidth="1.6"/>
 <text x={shape.x} y={shape.y} dominantBaseline="middle" textAnchor="middle" className="diagram-label">{section.id}</text>
 </g>;})}
 </svg><div className="diagram-legend"><span><i style={{background:'#c8c6c3'}}/>플로어 지정석</span><span><i style={{background:'#e0dfdc'}}/>계단식 객석</span></div></div>;
}
