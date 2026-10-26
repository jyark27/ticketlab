import {it,expect} from 'vitest';
import {parseRecords} from './records';
it('깨진 저장값은 화면을 중단시키지 않는다',()=>{for(const value of ['{','null','{}','[1,null,{}]'])expect(parseRecords(value)).toEqual([]);});
it('유효하지 않은 공연장이나 좌석 자료를 거절한다',()=>{
 const r={id:'1',date:'2026-10-21',success:true,elapsed:2,total:1,seats:['F1'],difficulty:'hard'};
 expect(parseRecords(JSON.stringify([r]))).toHaveLength(1);
 expect(parseRecords(JSON.stringify([{...r,venue:'unknown'}]))).toHaveLength(0);
 expect(parseRecords(JSON.stringify([{...r,seats:[{}]}]))).toHaveLength(0);
});
it('고척 티켓링크 기록을 읽을 때 새 구장 때문에 기록이 사라지지 않는다',()=>{
 const record={id:'gocheok-1',date:'2026-10-24',success:true,elapsed:23,total:200000,seats:['RD구역 2열 6번','RD구역 2열 7번'],difficulty:'easy',venue:'gocheok',platform:'ticketlink'};
 expect(parseRecords(JSON.stringify([record]))).toEqual([record]);
});
