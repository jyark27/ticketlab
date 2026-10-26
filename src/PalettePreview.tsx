import {useEffect,useState} from 'react';
export const PALETTES=[
 {id:'navy',name:'네이비 · 블루',description:'또렷하고 차분한 예매 서비스',colors:['#F9F7F7','#DBE2EF','#3F72AF','#112D4E'],source:'https://colorhunt.co/palette/f9f7f7dbe2ef3f72af112d4e'},
 {id:'lavender',name:'라벤더 · 인디고',description:'공연 연습에 어울리는 부드러운 분위기',colors:['#F4EEFF','#DCD6F7','#A6B1E1','#424874'],source:'https://colorhunt.co/palette/f4eeffdcd6f7a6b1e1424874'},
 {id:'terracotta',name:'크림 · 테라코타',description:'따뜻하고 개성 있는 연습 공간',colors:['#F8EDE3','#DFD3C3','#D0B8A8','#8D493A'],source:'https://colorhunt.co/palette/f8ede3dfd3c3d0b8a88d493a'}
] as const;
export function usePalettePreview(){
 const review=new URLSearchParams(location.search).get('review')==='colors';
 const [palette,setPalette]=useState(()=>{const value=new URLSearchParams(location.search).get('palette');return review&&PALETTES.some(p=>p.id===value)?value!:'navy';});
 useEffect(()=>{if(palette)document.documentElement.dataset.palette=palette;else delete document.documentElement.dataset.palette;return()=>{delete document.documentElement.dataset.palette;};},[palette]);
 function select(id:string){setPalette(id);const url=new URL(location.href);url.searchParams.set('palette',id);history.replaceState(null,'',url);}
 return {palette,select,review};
}
export default function PalettePreview({palette,onSelect}:{palette:string;onSelect:(id:string)=>void}){
 const current=PALETTES.find(p=>p.id===palette)!;
 return <section className="palette-review" aria-label="색상 후보 비교"><div className="palette-review-title"><b>색상 후보 미리보기</b><span>선택 전 검토용</span></div><div className="palette-review-options">{PALETTES.map((p,i)=><button key={p.id} aria-pressed={p.id===palette} onClick={()=>onSelect(p.id)}><span>{i+1}. {p.name}</span><span className="palette-swatches">{p.colors.map(color=><i key={color} style={{background:color}} title={color}/>)}</span></button>)}</div><a href={current.source} target="_blank" rel="noreferrer">Color Hunt 원본 ↗</a></section>;
}
