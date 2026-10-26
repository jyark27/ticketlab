import {useState} from 'react';
import {Maximize2,Minus,Plus} from 'lucide-react';
import type {Venue} from './venues';
import regions from './baseballRegions.json';

export default function BaseballDiagram({venue,selected,available,onSection}:{venue:Venue;selected:string;available:(id:string)=>number;onSection:(id:string)=>void}){
 const [zoom,setZoom]=useState(1);
 const map=regions[venue.id==='gocheok'?'gocheok':'jamsil'];
 const current=venue.sections.find(s=>s.id===selected)??venue.sections[0];
 return <div className="baseball-diagram">
  <div className="map-tools"><span>이미지의 좌석 구역을 선택하세요</span><button aria-label="배치도 축소" disabled={zoom===1} onClick={()=>setZoom(z=>Math.max(1,z-.5))}><Minus size={14}/></button><button aria-label="배치도 확대" disabled={zoom===3} onClick={()=>setZoom(z=>Math.min(3,z+.5))}><Plus size={14}/></button><button aria-label="배치도 크기 초기화" onClick={()=>setZoom(1)}><Maximize2 size={14}/></button></div>
  <div className="baseball-map-scroll" tabIndex={0} aria-label="좌석 배치도. 확대 시 좌우로 스크롤할 수 있습니다."><div className={'baseball-map-image '+venue.id} style={{width:venue.id==='gocheok'?`calc(min(100%, var(--map-base, 320px)) * ${zoom})`:zoom*100+'%'}}>
   <img src={'/baseball/'+venue.id+'-map.png'} alt={venue.name+' 공식 전체 좌석 배치도'} draggable={false}/>
   <svg className="baseball-click-regions" viewBox={`0 0 ${map.width} ${map.height}`} aria-label={venue.name+' 구역 선택'}>{venue.sections.map(s=><path key={s.id} d={(map.paths as Record<string,string>)[s.id]} className={'baseball-region '+(s.id===selected?'active':'')} role="button" tabIndex={0} aria-label={s.label+', 잔여 '+available(s.id)+'석'} aria-pressed={s.id===selected} onClick={()=>onSection(s.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSection(s.id);}}}><title>{s.label}</title></path>)}</svg>
  </div></div>
  <div className="baseball-map-key"><b>{current.label}</b><span>잔여 {available(current.id).toLocaleString()}석</span></div>
  <div className="map-attribution"><a href={venue.source} target="_blank" rel="noreferrer">이미지: {venue.id==='gocheok'?'키움히어로즈':'LG트윈스'} ↗</a><span>같은 등급·방향의 좌석은 연습 구역으로 묶입니다</span></div>
 </div>;
}
