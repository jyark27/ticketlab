import {useState} from 'react';
import {Camera,ChevronDown} from 'lucide-react';
import type {Venue} from './venues';
const photos:Record<string,[number,string]>={RD:[21,'R.d-club석'],T1:[23,'1층 테이블석'],T2:[24,'2층 테이블석'],DB1:[27,'다크버건디석'],DB3:[27,'다크버건디석'],BG1:[28,'버건디석'],BG3:[28,'버건디석'],L3:[29,'3층 지정석'],L4:[30,'4층 지정석'],OF1:[32,'외야 지정석'],OF3:[32,'외야 지정석']};
export default function BaseballPhotos({venue,section}:{venue:Venue;section:string}){
 const [open,setOpen]=useState(false);
 const photo=venue.id==='gocheok'?photos[section]:undefined;
 return <div className="seat-photo-disclosure"><button aria-expanded={open} onClick={()=>setOpen(v=>!v)}><Camera size={16}/>{photo?'선택 등급의 실제 좌석 사진':'야구장 실제 모습'}<ChevronDown size={15}/></button>{open&&<figure><img src={photo?'/baseball/gocheok-seat-'+photo[0]+'.jpg':'/baseball/jamsil-stadium.jpg'} alt={photo?'고척 '+photo[1]+' 공식 참고 사진':'서울시 제공 잠실야구장 전경'} loading="lazy"/><figcaption>{photo?photo[1]+' 등급 참고 사진 · 선택한 열의 정확한 시야는 아닙니다.':'잠실야구장 전경 · 개별 좌석 시야 사진은 아닙니다.'}<a href={photo?venue.source:'https://stadium.seoul.go.kr/about/jsbpark'} target="_blank" rel="noreferrer">사진 출처 ↗</a></figcaption></figure>}</div>;
}
