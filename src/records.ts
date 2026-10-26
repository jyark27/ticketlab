import type {RecordEntry} from './simulator';
const KEY='ticketlab-records-v1';
export function parseRecords(raw:string|null):RecordEntry[]{
 try{const value:unknown=JSON.parse(raw??'[]');if(!Array.isArray(value))return [];
 return value.filter((r):r is RecordEntry=>!!r&&typeof r==='object'&&typeof r.id==='string'&&typeof r.date==='string'&&!Number.isNaN(Date.parse(r.date))&&typeof r.success==='boolean'&&Number.isFinite(r.elapsed)&&r.elapsed>=0&&Number.isFinite(r.total)&&Array.isArray(r.seats)&&r.seats.every((s:unknown)=>typeof s==='string')&&['easy','normal','hard'].includes(r.difficulty)&&(!r.venue||['kspo','inspire','goyang','worldcup','jamsil','gocheok'].includes(r.venue))).slice(0,100);
 }catch{return [];}
}
export function readRecords(){try{return parseRecords(localStorage.getItem(KEY));}catch{return [];}}
export function saveRecord(record:RecordEntry){try{localStorage.setItem(KEY,JSON.stringify([record,...readRecords().filter(r=>r.id!==record.id)].slice(0,100)));return true;}catch{return false;}}
export function clearRecords(){try{localStorage.removeItem(KEY);return true;}catch{return false;}}
export const seconds=(ms:number|null|undefined)=>ms==null?'미측정':(ms/1000).toFixed(2)+'초';
