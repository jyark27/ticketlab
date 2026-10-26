export type VenueId = 'kspo' | 'inspire' | 'goyang' | 'worldcup' | 'jamsil' | 'gocheok';
export type TicketGrade = 'VIP' | 'R' | 'S' | 'A' | 'BLUE' | 'ORANGE' | 'RED' | 'NAVY' | 'OUTFIELD';
export type VenueSection = {
  id: string;
  label: string;
  grade: TicketGrade;
  price: number;
  kind: 'reserved' | 'standing';
  level: string;
  x: number;
  y: number;
};
export type Venue = {
  id: VenueId;
  name: string;
  type: 'concert' | 'baseball';
  city: string;
  capacity: number;
  standingCapacity: number;
  source: string;
  note: string;
  sections: VenueSection[];
};

const standing = (id: string, x: number, y: number, price = 154000): VenueSection => ({ id, label: `${id} 스탠딩`, grade: 'VIP', price, kind: 'standing', level: '플로어', x, y });
const block = (id: string, label: string, grade: TicketGrade, price: number, level: string, x: number, y: number): VenueSection => ({ id, label, grade, price, kind: 'reserved', level, x, y });
const ring = (start: number, end: number, level: string, grade: TicketGrade, price: number, radius: number): VenueSection[] => Array.from({ length: end - start + 1 }, (_, index) => {
  const angle = (-120 + index * 300 / (end - start)) * Math.PI / 180;
  const id = String(start + index);
  return block(id, `${level} ${id}구역`, grade, price, level, 50 + Math.cos(angle) * radius, 49 + Math.sin(angle) * radius);
});
const goyangFloor = [
  standing('S1', 46, 31, 275000), standing('S2', 54, 31, 275000),
  ...Array.from({ length: 15 }, (_, i) => { const id = `F${i + 1}`; return block(id, `${id} 플로어`, i < 11 ? 'R' : 'S', i < 11 ? 253000 : 231000, '플로어', 35 + i % 5 * 7, 40 + Math.floor(i / 5) * 8); }),
];
const goyangBowl = [
  ...Array.from({ length: 11 }, (_, i) => { const id = `E${i + 1}`; return block(id, `E 섹터 ${id}`, i < 5 ? 'R' : 'S', i < 5 ? 242000 : 198000, 'E 섹터', i < 5 ? 28 : 18, 31 + i * 4); }),
  ...Array.from({ length: 9 }, (_, i) => { const id = `W${i}`; return block(id, `W 섹터 ${id}`, i < 4 ? 'R' : 'S', i < 4 ? 242000 : 198000, 'W 섹터', i < 4 ? 72 : 82, 31 + i * 5); }),
  ...Array.from({ length: 11 }, (_, i) => { const id = `N${i + 1}`; return block(id, `N 섹터 ${id}`, i < 5 ? 'S' : 'A', i < 5 ? 198000 : 154000, 'N 섹터', 20 + i * 6, 83); }),
];

// Fixed bowl/stand relationships follow venue guides. The floor and stage are a fictional concert configuration.
export const VENUES: Venue[] = [
  {
    id: 'kspo', name: 'KSPO DOME', type: 'concert', city: '서울 올림픽공원', capacity: 15000, standingCapacity: 3000,
    source: 'https://www.ksponco.or.kr/menu.es?mid=a10405050100',
    note: '제공된 공연 좌석도의 A~D 스탠딩, 1층 1~15구역, 2층 24~43구역과 십자·원형 돌출 무대를 반영했습니다. 구역별 수량·입장번호·열·가격은 연습 설정입니다.',
    sections: [...['A','B','C','D'].map(letter=>({...standing('F-'+letter,0,0),label:letter+' 스탠딩'})), ...ring(1,15,'1층','R',132000,31), ...ring(24,43,'2층','S',99000,43)],
  },
  {
    id: 'inspire', name: '인스파이어 아레나', type: 'concert', city: '인천 영종도', capacity: 15000, standingCapacity: 3000,
    source: 'https://ticket.interpark.com/TPPlace/Main/TPPlace_Detail.asp?PlaceCode=26000483',
    note: '제공된 좌석도의 F1~F8 지정석, 203~213·308~313 구역과 중앙 돌출·순환 무대를 반영했습니다. 구역별 좌석 수·열·가격은 연습 설정입니다.',
    sections: [
      ...Array.from({length:8},(_,i)=>block('F'+(i+1),'F'+(i+1)+' 플로어','VIP',154000,'플로어',0,0)),
      ...Array.from({length:11},(_,i)=>block(String(203+i),(203+i)+'구역','R',132000,'200번대',0,0)),
      ...Array.from({length:6},(_,i)=>block(String(308+i),(308+i)+'구역','S',99000,'300번대',0,0)),
    ],
  },
  {
    id: 'goyang', name: '고양종합운동장', type: 'concert', city: '경기 고양', capacity: 50000, standingCapacity: 10000,
    source: 'https://www.goyang.go.kr/resve/manage/BD_selectResveManage.do?q_resveTopClCode=CL_04&resveSn=4579',
    note: '제공된 공연 좌석도의 S1·S2, F1~F15, E·W·N 섹터를 참고했습니다. 공식 안내의 4만 관람석에 연습용 플로어 1만 명을 더한 설정이며, 실제 공연별 판매 규모는 다릅니다.',
    sections: [...goyangFloor, ...goyangBowl],
  },
  {
    id: 'worldcup', name: '서울월드컵경기장', type: 'concert', city: '서울 상암', capacity: 65000, standingCapacity: 10000,
    source: 'https://sisul.or.kr/open_content/worldcup/guidance/mainst_seat.jsp',
    note: '공식 좌석안내의 N·E·S·W 방향과 하단·상단 객석 구조를 참고했습니다. 플로어는 가상 구성입니다.',
    sections: [standing('F-A', 38, 44), standing('F-B', 50, 44), standing('F-C', 62, 44),
      ...(['N','E','S','W'] as const).flatMap(side => Array.from({ length: 6 }, (_, i) => block(`${side}${i + 1}`, `${side} ${i + 1}구역`, 'R', 132000, `${side} 하단`, 0, 0))),
      ...(['N','E','S','W'] as const).flatMap(side => Array.from({ length: 6 }, (_, i) => block(`${side}${i + 7}`, `${side} ${i + 7}구역`, 'S', 110000, `${side} 상단`, 0, 0)))],
  },
  {
    id: 'jamsil', name: '잠실야구장', type: 'baseball', city: '서울 잠실', capacity: 23750, standingCapacity: 0,
    source: 'https://www.lgtwins.com/ticket/general',
    note: 'LG트윈스 공식 좌석 배치도를 사용합니다. 연습은 좌석 등급·1루·3루 묶음으로 선택하며, C·O1 등의 코드는 연습용입니다. 세부 열·좌석 수·가격은 가상 설정입니다.',
    sections: [
      block('C', '중앙석', 'VIP', 70000, '내야', 50, 81),
      block('O1', '1루 오렌지', 'ORANGE', 28000, '내야', 68, 72), block('O3', '3루 오렌지', 'ORANGE', 28000, '내야', 32, 72),
      block('B1', '1루 블루', 'BLUE', 23000, '내야', 80, 61), block('B3', '3루 블루', 'BLUE', 23000, '내야', 20, 61),
      block('R1', '1루 레드', 'RED', 18000, '내야', 88, 46), block('R3', '3루 레드', 'RED', 18000, '내야', 12, 46),
      block('N1', '1루 네이비', 'NAVY', 15000, '상단', 91, 31), block('N3', '3루 네이비', 'NAVY', 15000, '상단', 9, 31),
      block('OF1', '외야 1루', 'OUTFIELD', 10000, '외야', 70, 14), block('OF3', '외야 3루', 'OUTFIELD', 10000, '외야', 30, 14),
    ],
  },
  {
    id: 'gocheok', name: '고척스카이돔', type: 'baseball', city: '서울 구로', capacity: 16601, standingCapacity: 0,
    source: 'https://heroesbaseball.co.kr/ticket/normal/viewCharge.do',
    note: '키움히어로즈 공식 배치도와 좌석 사진을 사용합니다. 좌석 등급을 묶은 연습 구역이며 세부 열·번호·수량·가격은 가상 설정입니다. 고척의 실제 키움 홈경기 예매처는 NOL이며 티켓링크 모드는 화면 연습용입니다.',
    sections: [
      block('RD','R.d-club석','VIP',99000,'테이블석',50,68),
      block('T1','1층 테이블석','VIP',88000,'테이블석',50,71),
      block('T2','2층 테이블석','R',72000,'테이블석',73,68),
      block('DB1','1루 다크버건디석','BLUE',28000,'내야',75,58),
      block('DB3','3루 다크버건디석','BLUE',28000,'내야',25,58),
      block('BG1','1루 버건디석','RED',25000,'내야',81,49),
      block('BG3','3루 버건디석','RED',25000,'내야',19,49),
      block('L3','3층 지정석','ORANGE',21000,'3층',50,80),
      block('L4','4층 지정석','NAVY',13000,'4층',50,87),
      block('OF1','1루 외야 지정석','OUTFIELD',13000,'외야',72,21),
      block('OF3','3루 외야 지정석','OUTFIELD',13000,'외야',28,21),
    ],
  },
];

export const getVenue = (id: VenueId) => VENUES.find(venue => venue.id === id)!;
export const concertVenues = VENUES.filter(venue => venue.type === 'concert');
export const baseballVenues = VENUES.filter(venue => venue.type === 'baseball');
export function sectionCapacity(venueId: VenueId, sectionId: string): number {
  const venue = getVenue(venueId);
  const section = venue.sections.find(item => item.id === sectionId)!;
  const floor = (item: VenueSection) => item.kind === 'standing' || ((venueId === 'goyang' || venueId === 'inspire') && item.level === '플로어');
  const group = venue.sections.filter(item => floor(item) === floor(section));
  const total = floor(section) ? venue.standingCapacity : venue.capacity - venue.standingCapacity;
  const index = group.findIndex(item => item.id === sectionId);
  return Math.floor(total / group.length) + (index < total % group.length ? 1 : 0);
}
