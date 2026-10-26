import {useMemo,useState} from 'react';
import {ChevronLeft,ChevronRight,Search} from 'lucide-react';
import {getVenue,type VenueId} from './venues';
import {COLUMNS,money,seatsForSection,seatLabel,getSeat} from './simulator';
import VenueDiagram from './VenueDiagram';
import BaseballPhotos from './BaseballPhotos';
type Props={venueId:VenueId;section:string;onSection:(id:string)=>void;sold:string[];selected:string[];onSelect:(id:string)=>void;message:string;difficulty:string;platformId?:string};
const PAGE_ROWS=10;
export default function SeatPicker({venueId,section,onSection,sold,selected,onSelect,message,difficulty,platformId}:Props){
 const compact=platformId==='nol'||(platformId==='ticketlink'&&getVenue(venueId).type==='baseball');
 const [hovered,setHovered]=useState('');
 const venue=getVenue(venueId),current=venue.sections.find(s=>s.id===section)??venue.sections[0];
 const [query,setQuery]=useState(''),[level,setLevel]=useState('전체'),[onlyAvailable,setOnlyAvailable]=useState(false),[page,setPage]=useState(0),[zoom,setZoom]=useState(1),[view,setView]=useState<'area'|'seats'>('area');
 const soldSet=useMemo(()=>new Set(sold),[sold]),selectedSet=useMemo(()=>new Set(selected),[selected]);
 const counts=useMemo(()=>{const result=new Map(venue.sections.map(s=>[s.id,seatsForSection(venueId,s.id).length]));for(const id of [...sold,...selected]){const s=getSeat(id);if(s&&result.has(s.section))result.set(s.section,result.get(s.section)!-1);}return result;},[venue,venueId,sold,selected]);
 const available=(id:string)=>Math.max(0,counts.get(id)??0);
 const seats=seatsForSection(venueId,current.id),pageSize=COLUMNS*PAGE_ROWS,pages=Math.ceil(seats.length/pageSize),visible=compact?seats:seats.slice(page*pageSize,(page+1)*pageSize);
 const filtered=venue.sections.filter(s=>(level==='전체'||s.level===level)&&(s.label.toLowerCase().includes(query.toLowerCase())||s.id.toLowerCase().includes(query.toLowerCase()))&&(!onlyAvailable||available(s.id)>0));
 function selectSection(id:string){onSection(id);setPage(0);setHovered('');setView('seats');}
 return <div className={"seat-workspace "+(compact?"nol-seat-workspace":"")}>
 <div className="mobile-seat-tabs"><button className={view==='area'?'active':''} onClick={()=>setView('area')}>구역 선택</button><button className={view==='seats'?'active':''} onClick={()=>setView('seats')}>{current.id} 좌석</button></div>
 <aside className={'area-panel '+(view==='area'?'mobile-visible':'')}>
 <div className="panel-heading"><div><small>전체 배치도</small><h2>{venue.name}</h2></div><strong>{Array.from(counts.values()).reduce((a,b)=>a+b,0).toLocaleString()}<small>잔여 좌석</small></strong></div>
 <VenueDiagram venue={venue} selected={current.id} available={available} onSection={selectSection}/>
 <details className="map-source"><summary>좌석도 기준과 판매 규모</summary><p>{venue.note} 세부 열·번호와 구역별 배분은 연습용입니다.</p><a href={venue.source} target="_blank" rel="noreferrer">참고 자료 ↗</a></details>
 <div className="area-filters"><label className="search-field"><Search size={16}/><input aria-label="구역 검색" placeholder={venue.type==='baseball'?'구역 검색 · 1루, 외야…':'구역 검색 · F1, E3…'} value={query} onChange={e=>setQuery(e.target.value)}/></label><select aria-label="층 또는 섹터" value={level} onChange={e=>setLevel(e.target.value)}><option>전체</option>{[...new Set(venue.sections.map(s=>s.level))].map(l=><option key={l}>{l}</option>)}</select></div>
 <label className="checkbox small"><input type="checkbox" checked={onlyAvailable} onChange={e=>setOnlyAvailable(e.target.checked)}/>잔여 좌석 있는 구역만</label>
 <div className="area-list" aria-label="구역 목록">{filtered.map(s=><button key={s.id} aria-pressed={s.id===current.id} className={s.id===current.id?'active':''} disabled={available(s.id)===0&&!selected.some(id=>getSeat(id)?.section===s.id)} onClick={()=>selectSection(s.id)}><span><b>{venue.type==='baseball'?s.label:s.id}</b><small>{s.kind==='standing'?'스탠딩':s.level}</small></span><span>{available(s.id)?available(s.id).toLocaleString()+'석':'매진'}<small>{money(s.price)}</small></span></button>)}{!filtered.length&&<p className="empty">조건에 맞는 구역이 없습니다.</p>}</div>
 </aside>
 <section className={'detail-panel '+(view==='seats'?'mobile-visible':'')} aria-label="구역 상세 좌석">
 <div className="panel-heading"><div><small>{current.kind==='standing'?'스탠딩 입장번호':'지정석'}</small><h2>{current.label}</h2></div><div className="align-right"><strong>{money(current.price)}</strong><small>잔여 {available(current.id).toLocaleString()}석</small></div></div>
 {venue.type==='baseball'&&<BaseballPhotos key={venueId} venue={venue} section={current.id}/>}<div className="seat-explanation">{current.kind==='standing'?'번호가 작을수록 먼저 입장합니다. 지정 좌석이 아닙니다.':'무대·그라운드 방향을 확인한 뒤 좌석을 선택하세요.'}</div>
 <div className="stage-direction">{venue.type==='baseball'?'그라운드 방향 ↑':'무대 방향 ↑'}</div>
 <div className="seat-grid-scroll" key={section}><div className="seat-grid" style={{gridTemplateColumns:'38px repeat('+COLUMNS+', '+((compact?12:24)*zoom)+'px)'}}>
 {Array.from({length:Math.ceil(visible.length/COLUMNS)},(_,row)=><div className="seat-row" key={row}><span className="row-number">{current.kind==='standing'?'번호':(compact?0:page*PAGE_ROWS)+row+1+'열'}</span>{visible.slice(row*COLUMNS,(row+1)*COLUMNS).map(seat=><button key={seat.id} style={{width:(compact?12:24)*zoom,height:(compact?12:25)*zoom,minHeight:(compact?12:25)*zoom,fontSize:9*zoom}} className={'seat '+(soldSet.has(seat.id)?'sold':'')+' '+(selectedSet.has(seat.id)?'selected':'')} disabled={soldSet.has(seat.id)} title={seatLabel(seat.id)} aria-label={seatLabel(seat.id)+(soldSet.has(seat.id)?' 선택 불가':'')} aria-pressed={selectedSet.has(seat.id)} onMouseEnter={()=>setHovered(seatLabel(seat.id))} onFocus={()=>setHovered(seatLabel(seat.id))} onClick={()=>{setHovered(seatLabel(seat.id));onSelect(seat.id);}}>{compact?(selectedSet.has(seat.id)?'✓':''):selectedSet.has(seat.id)?'✓':current.kind==='standing'?seat.ordinal:seat.number}</button>)}</div>)}
 </div></div>
 {!compact&&<div className="pagination"><button aria-label="앞쪽 열" disabled={page===0} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={16}/></button><label><select aria-label="좌석 범위 선택" value={page} onChange={e=>setPage(Number(e.target.value))}>{Array.from({length:pages},(_,i)=><option value={i} key={i}>{current.kind==='standing'?(i*pageSize+1)+'–'+Math.min(seats.length,(i+1)*pageSize)+'번':(i*PAGE_ROWS+1)+'–'+Math.min(Math.ceil(seats.length/COLUMNS),(i+1)*PAGE_ROWS)+'열'}</option>)}</select></label><span>{page+1} / {pages}</span><button aria-label="뒤쪽 열" disabled={page===pages-1} onClick={()=>setPage(p=>p+1)}><ChevronRight size={16}/></button></div>}
 {!compact&&difficulty==='easy'&&<button className="text-button" onClick={()=>{const i=seats.findIndex(s=>!soldSet.has(s.id)&&!selectedSet.has(s.id));if(i>=0)setPage(Math.floor(i/pageSize));}}>빈 좌석이 있는 첫 페이지로 이동</button>}
 {compact&&<div className="seat-hover-detail" aria-live="polite">{hovered||"좌석에 마우스를 올리면 열·번호를 확인할 수 있습니다."}</div>}
 <label className="seat-zoom">좌석 크기 <select aria-label="좌석 크기" value={zoom} onChange={e=>setZoom(Number(e.target.value))}><option value={1}>100%</option><option value={1.25}>125%</option><option value={1.5}>150%</option>{compact&&<option value={2}>200%</option>}</select></label><div className="seat-legend"><span><i/>선택 가능</span><span><i className="picked"/>선택한 좌석</span><span><i className="unavailable"/>선택 불가</span></div>
 {compact&&<p className="small muted">구역 전체 표시 · 세부 열·번호 배열은 연습용입니다.</p>}
 <p className={message?'notice error':'notice'} role={message?'alert':undefined}>{message||'좌석은 실시간으로 갱신됩니다. 구역을 바꿔도 선택한 좌석은 유지됩니다.'}</p>
 {!available(current.id)&&<div className="empty"><strong>현재 구역에 남은 좌석이 없습니다.</strong><p>다른 구역을 확인하거나 취소표가 돌아오는지 기다려 보세요.</p><button onClick={()=>setView('area')}>구역 목록 보기</button></div>}
 </section></div>;
}