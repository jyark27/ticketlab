import type { Difficulty } from './simulator';
export type PlatformId = 'nol'|'melon'|'yes24'|'ticketlink';
export type Platform = { id:PlatformId; name:string; logo:string; accent:string; dark:string; tint:string; security:boolean; separateForms:boolean; openMode:'auto'; openHint:string; openSource:string; timerHint:string };
export const PLATFORMS:Platform[]=[
 {id:'nol',name:'NOL 티켓',logo:'NOL',accent:'#2467e8',dark:'#1551c2',tint:'#eef4ff',security:true,separateForms:true,openMode:'auto',openHint:'오픈 시각에 예매 버튼이 활성화됩니다. 새로고침 없이 누르세요.',openSource:'https://help.interpark.com/ticket/faq?category=TICKET_TICKET&categoryDetail=TICKET_TICKET_02',timerHint:'좌석 선택 10분 · 가격 단계부터 결제까지 7분'},
 {id:'melon',name:'멜론티켓',logo:'melon',accent:'#008b48',dark:'#006d38',tint:'#edf8f1',security:true,separateForms:true,openMode:'auto',openHint:'오픈 전 클릭하면 안내창이 뜹니다. 닫은 뒤 오픈 시각에 다시 누르세요. 멜론의 2016년 XIA 공지 사례를 적용한 연습입니다.',openSource:'https://ticket.melon.com/customerservice/noticeInform.htm?noticeNo=5',timerHint:'첫 좌석 선택부터 결제까지 5분'},
 {id:'yes24',name:'YES24 티켓',logo:'YES24',accent:'#cf501a',dark:'#a83e13',tint:'#fff2eb',security:false,separateForms:true,openMode:'auto',openHint:'이 연습에서는 버튼이 자동으로 열립니다. 실제 오픈 방식은 상품 공지를 확인하세요.',openSource:'https://m.ticket.yes24.com/UserGuide/Booking?type=booking',timerHint:'좌석 선택부터 5분 · 연습 설정'},
 {id:'ticketlink',name:'티켓링크',logo:'ticketlink',accent:'#d33249',dark:'#ac2034',tint:'#fff0f2',security:true,separateForms:true,openMode:'auto',openHint:'이 연습에서는 버튼이 자동으로 열립니다. 실제 오픈 방식은 상품 공지를 확인하세요.',openSource:'https://www.ticketlink.co.kr/help/guide',timerHint:'좌석 선택부터 5분 · 연습 설정'}
];
export const getPlatform=(id:string)=>PLATFORMS.find(p=>p.id===id);
export const holdSeconds=(id:PlatformId,_difficulty:Difficulty)=>id==='nol'?420:300;
