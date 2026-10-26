import { VENUES, getVenue, sectionCapacity, type TicketGrade, type VenueId } from './venues';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type Scenario = 'opening' | 'remnants' | 'postseason' | 'regular';
export const SCENARIOS = { regular: {label:'야구 정규시즌',detail:'홈경기 좌석과 연석 선택을 연습합니다. 최대 4매까지 선택할 수 있습니다.'}, opening: {label:'인기 공연 선예매', detail:'전체 판매분에서 앞쪽 구역을 두고 경쟁합니다.'}, remnants: {label:'아이돌 일반예매 · 잔여석', detail:'선예매 후 92~98%가 소진된 가상 상황. 취소표와 흩어진 잔여석을 찾습니다.'}, postseason: {label:'가을야구 · 포스트시즌', detail:'전량 온라인 예매 · 최대 4매. 응원석과 연석이 빠르게 줄어듭니다.'} };
export type PracticeMode = 'full' | 'seats';
export type Phase = 'detail' | 'queue' | 'security' | 'seats' | 'price' | 'delivery' | 'checkout' | 'result';
export type Grade = TicketGrade;
export type Seat = { id: string; venue: VenueId; section: string; row: number; number: number; ordinal: number; grade: Grade; price: number; kind: 'reserved' | 'standing' };
export type RecordEntry = { id: string; date: string; success: boolean; elapsed: number; seats: string[]; total: number; difficulty: Difficulty; misses: number; platform?: string; venue?: VenueId; queueRank?: number; openDelayMs?: number | null; seatMs?: number | null; securityMs?: number | null; codeErrors?: number; mode?: PracticeMode; reason?: string };
export const COLUMNS = 24;
export const PRICE: Record<Grade, number> = { VIP: 154000, R: 132000, S: 110000, A: 154000, BLUE: 23000, ORANGE: 28000, RED: 18000, NAVY: 15000, OUTFIELD: 10000 };
export const DIFFICULTY = {
  easy: { label: '익숙해지기', description: '낮은 경쟁 · 화면과 순서 익히기', seconds: 300, queue: 3, baseSold: .002, saleRate: .0006, saleInterval: 1600 },
  normal: { label: '실전 연습', description: '인기 구역 경쟁 · 연석 확보', seconds: 180, queue: 6, baseSold: .005, saleRate: .004, saleInterval: 600 },
  hard: { label: '피켓팅', description: '0.3초 지연에 약 3만 명 · 극한 경쟁', seconds: 90, queue: 9, baseSold: .01, saleRate: .032, saleInterval: 200 },
};
export const SEATS: Seat[] = VENUES.flatMap(venue => venue.sections.flatMap(section =>
  Array.from({length: sectionCapacity(venue.id, section.id)}, (_, i) => ({
    id: venue.id + ':' + section.id + ':' + (Math.floor(i / COLUMNS) + 1) + ':' + (i % COLUMNS + 1),
    venue: venue.id, section: section.id, row: Math.floor(i / COLUMNS) + 1, number: i % COLUMNS + 1, ordinal: i + 1,
    grade: section.grade, price: section.price, kind: section.kind,
  }))
));
const byId = new Map(SEATS.map(s => [s.id, s]));
const byVenue = new Map(VENUES.map(v => [v.id, SEATS.filter(s => s.venue === v.id)]));
const bySection = new Map(VENUES.flatMap(v => v.sections.map(s => [v.id + ':' + s.id, byVenue.get(v.id)!.filter(seat => seat.section === s.id)] as const)));
export const seatsForVenue = (venue: VenueId) => byVenue.get(venue)!;
export const seatsForSection = (venue: VenueId, section: string) => bySection.get(venue + ':' + section) ?? [];
export const getSeat = (id: string) => byId.get(id);
export const money = (amount: number) => amount.toLocaleString('ko-KR') + '원';
export const seatLabel = (id: string) => { const s = byId.get(id); return !s ? id : s.kind === 'standing' ? s.section + ' 스탠딩 입장번호 ' + String(s.ordinal).padStart(3, '0') : s.section + '구역 ' + s.row + '열 ' + s.number + '번'; };
export const totalPrice = (ids: string[]) => ids.reduce((sum, id) => sum + (byId.get(id)?.price ?? 0), 0);
export const timeLabel = (seconds: number) => Math.floor(Math.max(0, seconds) / 60).toString().padStart(2, '0') + ':' + (Math.floor(Math.max(0, seconds)) % 60).toString().padStart(2, '0');
function loneVacancies(rowSeats: Seat[], blocked: Set<string>) { return rowSeats.filter((s,i) => !blocked.has(s.id) && (i === 0 || blocked.has(rowSeats[i-1].id)) && (i === rowSeats.length-1 || blocked.has(rowSeats[i+1].id))).length; }
function createsLoneVacancy(state: State) {
  const sold = new Set(state.sold), blocked = new Set([...state.sold, ...state.selected]);
  return state.selected.some(id => { const seat = byId.get(id)!; const row = seatsForSection(seat.venue, seat.section).filter(s => s.row === seat.row); return loneVacancies(row, blocked) > loneVacancies(row, sold); });
}
// Training model; real queue allocation and concurrent buyers are not publicly specified.
export function queueRank(delayMs: number, difficulty: Difficulty) {
  const delay = Math.max(0, Number.isFinite(delayMs) ? delayMs : 0);
  // Extreme practice curve: 0.1s -> 3,533; 0.3s -> 30,200; 0.5s -> 83,533.
  // This is intentionally synthetic, not an estimate of any provider's queue.
  if (difficulty === 'hard') {
    if (delay <= 500) return 200 + Math.floor(delay * delay / 3);
    // Reported idol queues exceed 100k; cap the practice cohort rather than
    // extrapolating a quadratic to a million after only two seconds.
    return Math.min(150000, 83533 + Math.floor(66467 * (1 - Math.exp(-(delay - 500) / 900))));
  }
  return Math.min(99999, (difficulty === 'normal' ? 130 : 60) + Math.floor(delay * .35));
}
export const queueDuration = (rank: number, difficulty: Difficulty) => Math.min(28, Math.max(3, Math.ceil(rank / 300) + DIFFICULTY[difficulty].queue));
export function initialSold(venue: VenueId, difficulty: Difficulty, seed = 0, rank = 0, scenario: Scenario = 'opening'): string[] {
  const v = getVenue(venue);
  const conversion = difficulty === 'hard' && v.type !== 'baseball' ? .85 : 1.6;
  const ratio = Math.min(.98, DIFFICULTY[difficulty].baseSold + rank * conversion / v.capacity);
  return v.sections.flatMap((section, index) => {
    const seats = seatsForSection(venue, section.id);
    const popularity = section.level === '플로어' ? 1.8 : section.grade === 'R' ? 1.15 : .75;
    const count = Math.min(seats.length, Math.floor(seats.length * (1 - Math.pow(1-ratio,popularity))));
    if (scenario === 'remnants') return seats.filter((s, i) => ((Math.imul(i + (seed|0), 31) >>> 0) % 100) < Math.min(99.5, (difficulty === 'hard' ? 98 : 92) + ratio * 15)).map(s=>s.id);
    // Seeded weighted shuffle keeps initial vacancies scattered too.
    let value = (seed ^ Math.imul(index + 1, 2654435761)) >>> 0;
    const random = () => { value = (Math.imul(value,1664525)+1013904223)>>>0; return (value+.5)/4294967296; };
    return seats.map(seat=>({id:seat.id,score:-Math.log(random())/seatDemand(seat)}))
      .sort((a,b)=>a.score-b.score).slice(0,count).map(seat=>seat.id);
  });
}
// Relative training preferences, not measured sales statistics.
export function seatDemand(seat: Seat): number {
  const section = getVenue(seat.venue).sections.find(s => s.id === seat.section)!;
  const count = seatsForSection(seat.venue, seat.section).length;
  const front = 1 - (seat.ordinal - 1) / Math.max(1, count - 1);
  const center = 1 - Math.abs(seat.number - (COLUMNS + 1) / 2) / (COLUMNS / 2);
  const zone = getVenue(seat.venue).type === 'baseball'
    ? (['ORANGE','BLUE'].includes(section.grade) ? 2.8 : section.grade === 'OUTFIELD' ? .8 : 1.3)
    : section.level === '플로어' ? 3 : section.grade === 'R' ? 1.8 : 1;
  return zone * (1 + 2 * front) * (seat.kind === 'standing' ? 1 : 1 + .8 * center);
}
export function nextSaleBatch(venue: VenueId, sold: string[], selected: string[], _tick: number, difficulty: Difficulty, scenario: Scenario = 'opening', random: () => number = Math.random): string[] {
  const v = getVenue(venue), rules = DIFFICULTY[difficulty];
  const budget = Math.max(1, Math.round(v.capacity * rules.saleRate * (scenario === 'remnants' ? .075 : scenario === 'postseason' ? 1.4 : 1) * rules.saleInterval / 1000));
  const blocked = new Set([...sold, ...selected]);
  // Exponential race samples without replacement. Every available seat has
  // a chance; popular seats have shorter expected selection times.
  return seatsForVenue(venue).filter(s => !blocked.has(s.id))
    .map(seat => ({id:seat.id, score:-Math.log(Math.max(Number.EPSILON,Math.min(1-Number.EPSILON,random()))) / seatDemand(seat)}))
    .sort((a,b) => a.score-b.score).slice(0,budget).map(s=>s.id);
}
export function returnedSeats(venue: VenueId, sold: string[], tick: number): string[] {
  if (tick === 0 || tick % 12 !== 0) return [];
  const count = Math.min(4, sold.length);
  const start = sold.length ? (tick * 97) % sold.length : 0;
  return sold.slice(start, start + count).filter(id => byId.get(id)?.venue === venue);
}
export type State = {
  phase: Phase; difficulty: Difficulty; scenario: Scenario; selected: string[]; sold: string[];
  deadline: number | null; selectionDeadline: number | null; startedAt: number; endedAt: number; attempts: number; misses: number;
  message: string; success: boolean; reason: string;
  platform: string; venue: VenueId; queueRank: number; queueSeconds: number; openDelayMs: number | null;
  maxTickets: number; holdSeconds: number; security: boolean; separateForms: boolean;
  mode: PracticeMode; selectionSeconds: number; holdOnCheckout: boolean; checkoutStarted: boolean;
  seatsEnteredAt: number | null; securityEnteredAt: number | null; verifiedAt: number | null; firstSeatAt: number | null; codeErrors: number;
};
export const initialState: State = {
  phase:'detail',difficulty:'normal',scenario:'opening',selected:[],sold:[],deadline:null,selectionDeadline:null,startedAt:0,endedAt:0,attempts:0,misses:0,message:'',success:false,reason:'',
  platform:'nol',venue:'kspo',queueRank:0,queueSeconds:12,openDelayMs:null,maxTickets:2,holdSeconds:120,security:true,separateForms:false,mode:'full',selectionSeconds:0,holdOnCheckout:false,checkoutStarted:false,
  seatsEnteredAt:null,securityEnteredAt:null,verifiedAt:null,firstSeatAt:null,codeErrors:0,
};
export type Action =
 | {type:'START'; difficulty:Difficulty; scenario?:Scenario; now:number; venue?:VenueId; openDelayMs?:number | null; platform?:string; maxTickets?:number; holdSeconds?:number; security?:boolean; separateForms?:boolean; mode?:PracticeMode; selectionSeconds?:number; holdOnCheckout?:boolean}
 | {type:'ENTER'; now?:number} | {type:'VERIFIED'; now?:number} | {type:'CODE_ERROR'}
 | {type:'SELECT';id:string;now:number} | {type:'SELL';ids:string[]} | {type:'RETURN';ids:string[]}
 | {type:'CHECKOUT';now:number} | {type:'BACK'} | {type:'NEXT';now:number} | {type:'PAY';now:number} | {type:'EXPIRE';now:number} | {type:'ABORT';now:number}
 | {type:'MESSAGE';message:string} | {type:'RESET'};
function timedOut(s: State, now:number) { return (s.deadline !== null && now >= s.deadline) || (!s.checkoutStarted && s.selectionDeadline !== null && now >= s.selectionDeadline); }
function enterSeats(s:State, now:number):State { return {...s,phase:'seats',seatsEnteredAt:s.seatsEnteredAt ?? now,selectionDeadline:s.selectionSeconds ? now+s.selectionSeconds*1000 : null}; }
export function reducer(state:State, action:Action):State {
  switch(action.type) {
    case 'START': {
      if(state.phase!=='detail')return state;
      const venue=action.venue ?? 'kspo', delay=action.openDelayMs === undefined ? null : action.openDelayMs, rank=queueRank(delay ?? 0,action.difficulty);
      const next:State={...initialState,phase:'queue',difficulty:action.difficulty,startedAt:action.now,venue,scenario:action.scenario??'opening',queueRank:rank,queueSeconds:queueDuration(rank,action.difficulty),openDelayMs:delay,
        platform:action.platform??'nol',maxTickets:action.maxTickets??2,holdSeconds:action.holdSeconds??DIFFICULTY[action.difficulty].seconds,security:action.security??true,separateForms:action.separateForms??false,
        mode:action.mode??'full',selectionSeconds:action.selectionSeconds??0,holdOnCheckout:action.holdOnCheckout??false,sold:initialSold(venue,action.difficulty,action.now,rank,action.scenario)};
      return next.mode==='seats' ? enterSeats(next,action.now) : next;
    }
    case 'ENTER': return state.phase!=='queue' ? state : state.security ? {...state,phase:'security',securityEnteredAt:action.now??state.startedAt} : enterSeats(state,action.now??state.startedAt);
    case 'VERIFIED': return state.phase==='security' ? enterSeats({...state,verifiedAt:action.now??state.startedAt,message:''},action.now??state.startedAt) : state;
    case 'CODE_ERROR': return state.phase==='security' ? {...state,codeErrors:state.codeErrors+1} : state;
    case 'SELECT': {
      if(state.phase!=='seats'||byId.get(action.id)?.venue!==state.venue) return state;
      if(timedOut(state,action.now)) return expired(state,action.now);
      if(state.selected.includes(action.id)) return {...state,selected:state.selected.filter(id=>id!==action.id),message:''};
      if(state.selected.length>=state.maxTickets) return {...state,message:'한 회차에 최대 '+state.maxTickets+'매까지 선택할 수 있습니다.'};
      const attempts=state.attempts+1;
      if(state.sold.includes(action.id)) return {...state,attempts,misses:state.misses+1,message:'다른 관람객이 먼저 선택했습니다. 다른 좌석을 골라주세요.'};
      return {...state,attempts,selected:[...state.selected,action.id],firstSeatAt:state.firstSeatAt??action.now,deadline:state.deadline??(state.holdOnCheckout?null:action.now+state.holdSeconds*1000),message:''};
    }
    case 'SELL': return ['seats','security'].includes(state.phase) ? {...state,sold:[...new Set([...state.sold,...action.ids.filter(id=>byId.get(id)?.venue===state.venue&&!state.selected.includes(id))])]} : state;
    case 'RETURN': return ['seats','security'].includes(state.phase) ? {...state,sold:state.sold.filter(id=>!action.ids.includes(id))} : state;
    case 'CHECKOUT':
      if(state.phase!=='seats'||!state.selected.length) return state;
      if(timedOut(state,action.now)) return expired(state,action.now);
      if(getVenue(state.venue).type==='baseball'&&createsLoneVacancy(state)) return {...state,message:'한 자리만 비워 두는 선택은 불가합니다. 붙어 있는 좌석을 선택해 주세요.'};
      return {...state,phase:state.separateForms?'price':'checkout',checkoutStarted:true,deadline:state.deadline??action.now+state.holdSeconds*1000,message:''};
    case 'NEXT':
      if(!['price','delivery'].includes(state.phase)||!state.selected.length||!state.deadline) return state;
      if(timedOut(state,action.now)) return expired(state,action.now);
      return {...state,phase:state.phase==='price'?'delivery':'checkout',message:''};
    case 'BACK': return {...state,phase:state.phase==='checkout'?(state.separateForms?'delivery':'seats'):state.phase==='delivery'?'price':state.phase==='price'?'seats':state.phase,message:''};
    case 'PAY':
      if(state.phase!=='checkout'||!state.selected.length||!state.deadline) return state;
      if(timedOut(state,action.now)) return expired(state,action.now);
      return {...state,phase:'result',endedAt:action.now,success:true,reason:'선택한 좌석으로 모의 예매를 완료했습니다.'};
    case 'EXPIRE': return ['seats','price','delivery','checkout'].includes(state.phase)&&timedOut(state,action.now)?expired(state,action.now):state;
    case 'ABORT': return {...state,phase:'result',endedAt:action.now,success:false,reason:'연습을 중단했습니다.',selected:[],deadline:null};
    case 'MESSAGE': return {...state,message:action.message};
    case 'RESET': return {...initialState};
  }
}
function expired(state:State,now:number):State { return {...state,phase:'result',endedAt:now,selected:[],deadline:null,selectionDeadline:null,success:false,reason:'제한 시간이 종료되어 좌석을 해제했습니다.'}; }
