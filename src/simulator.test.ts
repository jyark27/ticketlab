import { describe, expect, it } from 'vitest';
import { DIFFICULTY, SEATS, initialSold, initialState, nextSaleBatch, queueRank, reducer, seatLabel, seatsForVenue, totalPrice, type Action, type State } from './simulator';
import { holdSeconds, PLATFORMS } from './platforms';
import { VENUES, getVenue, sectionCapacity } from './venues';

// 실제 사용자가 겪을 수 있는 실패 상황과 시간 경계 조건을 검사합니다.
function ready(options: Partial<Extract<Action, { type: 'START' }>> = {}): State {
  let state = reducer(initialState, { type: 'START', difficulty: 'easy', now: 1000, openDelayMs: 0, ...options });
  state = reducer(state, { type: 'ENTER' });
  if (state.phase === 'security') state = reducer(state, { type: 'VERIFIED' });
  return {...state,sold:[]};
}
function choose(state: State, id: string, now = 2000) { return reducer(state, { type: 'SELECT', id, now }); }
function checkout(state: State, now = 2500): State {
  state = reducer(state, { type: 'CHECKOUT', now });
  while (state.phase === 'price' || state.phase === 'delivery') state = reducer(state, { type: 'NEXT', now });
  return state;
}

describe('예매 가능한 좌석과 매수 제한', () => {
  it('고척 재고가 구장 수량과 일치하며 티켓링크 모드에서 모의 결제된다', () => {
    expect(seatsForVenue('gocheok')).toHaveLength(16601);
    let state=ready({venue:'gocheok',platform:'ticketlink',security:false,separateForms:true,maxTickets:4,holdSeconds:300});
    state=choose(state,'gocheok:RD:2:6');
    state=choose(state,'gocheok:RD:2:7');
    state=checkout(state);
    expect(state.phase).toBe('checkout');
    expect(reducer(state,{type:'PAY',now:3000}).success).toBe(true);
  });
  it('고척도 한 자리만 남기는 야구 연석 제한을 적용한다', () => {
    let state=ready({venue:'gocheok',maxTickets:4});
    state=choose(state,'gocheok:RD:1:23');
    expect(reducer(state,{type:'CHECKOUT',now:2500}).message).toContain('한 자리');
  });
  it('공연장 4종과 잠실야구장의 좌석 ID가 겹치지 않는다', () => {
    expect(VENUES.filter(venue => venue.type === 'concert')).toHaveLength(4);
    expect(seatsForVenue('jamsil')).toHaveLength(VENUES.find(venue => venue.id === 'jamsil')!.capacity);
    expect(new Set(SEATS.map(seat => seat.id)).size).toBe(SEATS.length);
  });
  it('고양 공연은 관람석 4만과 연습 플로어 1만을 합쳐 5만 명 규모다', () => {
    const venue = getVenue('goyang');
    expect(venue.capacity).toBe(50000);
    expect(venue.standingCapacity).toBe(10000);
    expect(venue.sections.reduce((sum, section) => sum + sectionCapacity('goyang', section.id), 0)).toBe(50000);
  });
  it('스탠딩 입장번호와 야구석 가격을 구분한다', () => {
    expect(seatLabel('kspo:F-A:2:1')).toContain('025');
    expect(totalPrice(['jamsil:C:1:1', 'jamsil:OF1:1:1'])).toBe(80000);
  });
  it('피켓팅의 초기 선점도 여러 열에 흩어진다', () => {
    const sold = initialSold('kspo', 'hard');
    expect(new Set(sold.map(id=>id.split(':')[2])).size).toBeGreaterThan(3);
    expect(nextSaleBatch('kspo', sold, [], 0, 'hard').length).toBeGreaterThan(0);
    expect(DIFFICULTY.hard.saleInterval).toBeLessThan(DIFFICULTY.normal.saleInterval);
  });
  it('실전 및 피켓팅은 이전보다 빠르고 시도마다 남는 블록이 달라진다', () => {
    expect(DIFFICULTY.normal.saleRate).toBeGreaterThan(DIFFICULTY.easy.saleRate);
    expect(DIFFICULTY.normal.saleInterval).toBeLessThan(800);
    expect(DIFFICULTY.hard.saleRate).toBeGreaterThan(DIFFICULTY.normal.saleRate);
    const first = initialSold('kspo', 'hard', 1711);
    const second = initialSold('kspo', 'hard', 1892);
    expect(first).not.toEqual(second);
    const section = first.filter(id => id.startsWith('kspo:F-A:'));
    const numbers = section.map(id => { const [, , row, number] = id.split(':'); return (Number(row) - 1) * 24 + Number(number); });
    expect(Math.max(...numbers)-Math.min(...numbers)).toBeGreaterThan(numbers.length);
  });
  it('고양 500번대 입장은 피켓팅이어도 좌석이 남는다', () => {
    const state = reducer(initialState, { type: 'START', venue: 'goyang', difficulty: 'hard', now: 1000, openDelayMs: 30 });
    expect(state.queueRank).toBeLessThan(510);
    expect(state.sold.length).toBeLessThan(SEATS.filter(seat => seat.venue === 'goyang').length * .2);
    expect(state.sold.length).toBeGreaterThan(0);
  });
  it('NOL 오픈은 새로고침 확인 단계 없이 자동으로 버튼을 연다', () => {
    expect(PLATFORMS.find(platform => platform.id === 'nol')?.openMode).toBe('auto');
  });
  it('오픈 직후 빠른 클릭이 더 앞선 연습 대기번호를 받는다', () => {
    expect(queueRank(90, 'hard')).toBeLessThan(queueRank(1200, 'hard'));
    expect(queueRank(1200, 'hard')).toBeLessThan(queueRank(3000, 'hard'));
  });
  it('다른 공연장의 좌석을 선택할 수 없다', () => {
    expect(choose(ready({ venue: 'jamsil' }), 'kspo:F-A:1:6').selected).toEqual([]);
  });
  it('두산 홈경기는 1회 4매까지 선택한다', () => {
    let state = ready({ venue: 'jamsil', maxTickets: 4 });
    for (const id of ['jamsil:C:1:6', 'jamsil:C:1:7', 'jamsil:C:1:8', 'jamsil:C:2:6']) state = choose(state, id);
    expect(state.selected).toHaveLength(4);
    expect(choose(state, 'jamsil:C:2:7').message).toContain('최대 4매');
  });
  it('두산 안내의 한 자리 띄우기 제한을 적용한다', () => {
    const state = ready({ venue: 'jamsil', maxTickets: 4 });
    const next = choose(state, 'jamsil:C:1:23');
    expect(reducer(next, { type: 'CHECKOUT', now: 2500 }).message).toContain('한 자리');
  });
  it('매진된 좌석은 확보할 수 없다', () => {
    const state = ready();
    const next = choose({...state,sold:['kspo:F-A:1:6']}, 'kspo:F-A:1:6');
    expect(next.selected).toEqual([]);
    expect(next.misses).toBe(1);
  });
  it('한 번 선택한 좌석은 가상 경쟁자가 가져갈 수 없다', () => {
    const state = choose(ready(), 'kspo:F-A:1:6');
    const next = reducer(state, { type: 'SELL', ids: ['kspo:F-A:1:6', 'kspo:F-A:1:7'] });
    expect(next.sold).not.toContain('kspo:F-A:1:6');
    expect(next.sold).toContain('kspo:F-A:1:7');
  });
  it('NOL형에서는 3번째 좌석 선택을 거절한다', () => {
    let state = choose(choose(ready(), 'kspo:F-A:1:6'), 'kspo:F-A:1:7');
    state = choose(state, 'kspo:F-A:1:8');
    expect(state.selected).toHaveLength(2);
    expect(state.message).toContain('최대 2매');
  });
  it('티켓링크형 일반예매에서는 4매까지 허용한다', () => {
    let state = ready({ platform: 'ticketlink', maxTickets: 4 });
    for (const id of ['kspo:F-A:1:6', 'kspo:F-A:1:7', 'kspo:F-A:1:8', 'kspo:F-A:2:1', 'kspo:F-A:2:2']) state = choose(state, id);
    expect(state.selected).toHaveLength(4);
    expect(state.message).toContain('최대 4매');
  });
  it('다른 구역으로 이동해도 선택 좌석을 함께 보유한다', () => {
    const state = choose(choose(ready(), 'kspo:F-A:1:6'), 'kspo:1:1:6');
    expect(state.selected).toEqual(['kspo:F-A:1:6', 'kspo:1:1:6']);
    expect(totalPrice(state.selected)).toBe(286000);
  });
  it('존재하지 않는 좌석은 선택할 수 없다', () => {
    expect(choose(ready(), 'X-99-99').selected).toEqual([]);
  });
  it('좌석 데이터의 고유 ID와 가격이 모두 유효하다', () => {
    expect(new Set(SEATS.map(s => s.id)).size).toBe(SEATS.length);
    expect(SEATS.every(seat=>totalPrice([seat.id])>0)).toBe(true);
  });
});

describe('제한 시간과 결제 경계', () => {
  it('최초 좌석을 선택해야 타이머가 시작된다', () => {
    const state = ready();
    expect(state.deadline).toBeNull();
    expect(choose(state, 'kspo:F-A:1:6').deadline).toBe(302000);
  });
  it('좌석 선택을 취소하고 다시 선택해도 시간이 연장되지 않는다', () => {
    let state = choose(ready(), 'kspo:F-A:1:6');
    const deadline = state.deadline;
    state = choose(state, 'kspo:F-A:1:6', 10000);
    state = choose(state, 'kspo:F-A:1:7', 20000);
    expect(state.deadline).toBe(deadline);
  });
  it('멜론형은 모든 난이도에서 5분을 유지한다', () => {
    for (const difficulty of ['easy', 'normal', 'hard'] as const) expect(holdSeconds('melon', difficulty)).toBe(300);
  });
  it('마감 직전 결제는 성공한다', () => {
    const state = checkout(choose(ready(), 'kspo:F-A:1:6'));
    expect(reducer(state, { type: 'PAY', now: state.deadline! - 1 }).success).toBe(true);
  });
  it('마감 시각과 동시에 결제하면 실패하고 좌석을 해제한다', () => {
    const state = checkout(choose(ready(), 'kspo:F-A:1:6'));
    const next = reducer(state, { type: 'PAY', now: state.deadline! });
    expect(next.phase).toBe('result');
    expect(next.success).toBe(false);
    expect(next.selected).toEqual([]);
  });
  it('화면 타이머가 늦게 갱신돼도 만료된 좌석으로 다음 단계에 갈 수 없다', () => {
    const state = choose(ready(), 'kspo:F-A:1:6');
    expect(reducer(state, { type: 'CHECKOUT', now: state.deadline! + 500 }).phase).toBe('result');
  });
  it('수령 정보 입력 단계에서도 시간이 만료된다', () => {
    let state = choose(ready({ separateForms: true }), 'kspo:F-A:1:6');
    state = reducer(state, { type: 'CHECKOUT', now: 3000 });
    state = reducer(state, { type: 'NEXT', now: 4000 });
    expect(state.phase).toBe('delivery');
    expect(reducer(state, { type: 'EXPIRE', now: state.deadline! }).phase).toBe('result');
  });
});

describe('예매처별 전체 흐름', () => {
  for (const platform of PLATFORMS) it(`${platform.name}형은 시작부터 예매 완료까지 진행된다`, () => {
    const state = checkout(choose(ready({ platform: platform.id, security: platform.security, separateForms: platform.separateForms, holdSeconds: holdSeconds(platform.id, 'easy') }), 'kspo:F-A:1:6'));
    expect(reducer(state, { type: 'PAY', now: 6000 }).success).toBe(true);
  });
  it('좌석을 고르지 않고 결제 화면으로 건너뛸 수 없다', () => {
    const state = ready();
    expect(reducer(state, { type: 'CHECKOUT', now: 3000 }).phase).toBe('seats');
    expect(reducer(state, { type: 'PAY', now: 3000 }).success).toBe(false);
  });
  it('YES24형은 보안문자를 생략하고 할인·수령 단계를 거친다', () => {
    let state = ready({ security: false, separateForms: true });
    expect(state.phase).toBe('seats');
    state = choose(state, 'kspo:F-A:1:6');
    state = reducer(state, { type: 'CHECKOUT', now: 2500 });
    expect(state.phase).toBe('price');
    state = reducer(state, { type: 'NEXT', now: 3000 });
    expect(state.phase).toBe('delivery');
    state = reducer(state, { type: 'BACK' });
    expect(state.phase).toBe('price');
    expect(state.selected).toEqual(['kspo:F-A:1:6']);
  });
  it('연습 종료 시 타이머와 좌석을 함께 초기화한다', () => {
    expect(reducer(choose(ready(), 'kspo:F-A:1:6'), { type: 'RESET' })).toEqual(initialState);
  });
});


describe('판매 규모와 실제 사례의 연습 모델',()=>{
 it('모든 공연장의 재고와 표시 수량이 일치한다',()=>{
  for(const v of VENUES)expect(seatsForVenue(v.id).length).toBe(v.capacity);
 });
 it('전체 오픈과 잔여석 오픈을 구분한다',()=>{
  const full=initialSold('goyang','hard',100,500);
  const remnants=initialSold('goyang','hard',100,500,'remnants');
  expect(full.length).toBeLessThan(5000);
  expect(remnants.length).toBeGreaterThan(45000);
  expect(remnants.length).toBeLessThan(50000);
 });
 it('어려움 판매는 여러 좌석을 한번에 가져가며 선점은 보존한다',()=>{
  const selected=['goyang:S1:1:1'];
  const batch=nextSaleBatch('goyang',[],selected,1,'hard');
  expect(batch.length).toBeGreaterThan(200);
  expect(new Set(batch).size).toBe(batch.length);
  expect(batch).not.toContain(selected[0]);
 });
 it('가을야구의 소진량은 동일한 전체 오픈보다 높다',()=>{
  expect(nextSaleBatch('jamsil',[],[],1,'hard','postseason').length).toBeGreaterThan(nextSaleBatch('jamsil',[],[],1,'hard').length);
 });
 it('좌석 집중 모드는 대기와 보안문자를 생략하고 반응속도를 날조하지 않는다',()=>{
  const s=reducer(initialState,{type:'START',difficulty:'hard',now:1000,mode:'seats',openDelayMs:null});
  expect(s.phase).toBe('seats');expect(s.openDelayMs).toBeNull();expect(s.seatsEnteredAt).toBe(1000);
 });
 it('NOL은 가격 단계부터 7분을 시작하고 뒤로 가도 연장하지 않는다',()=>{
  const s=choose(ready({holdOnCheckout:true,holdSeconds:420,selectionSeconds:600,separateForms:true}),'kspo:F-A:1:6');
  expect(s.deadline).toBeNull();
  const price=reducer(s,{type:'CHECKOUT',now:5000});expect(price.deadline).toBe(425000);
  const back=reducer(price,{type:'BACK'});expect(reducer(back,{type:'CHECKOUT',now:10000}).deadline).toBe(425000);
  expect(holdSeconds('nol','hard')).toBe(420);
 });
 it('NOL 좌석 선택 제한은 클릭하지 않아도 만료된다',()=>{
  const s=ready({selectionSeconds:600,holdOnCheckout:true});
  expect(reducer(s,{type:'EXPIRE',now:601000}).phase).toBe('result');
 });
 it('보안문자 오류와 통과 시간, 첫 좌석 시간을 측정한다',()=>{
  let s=reducer(initialState,{type:'START',difficulty:'easy',now:1000});
  s=reducer(s,{type:'ENTER',now:4000});s=reducer(s,{type:'CODE_ERROR'});
  s=reducer(s,{type:'VERIFIED',now:8000});s={...s,sold:[]};
  s=choose(s,'kspo:F-A:1:6',9000);
  expect(s.securityEnteredAt).toBe(4000);expect(s.verifiedAt).toBe(8000);expect(s.firstSeatAt).toBe(9000);expect(s.codeErrors).toBe(1);
 });
 it('취소된 좌석은 다시 선택할 수 있다',()=>{
  let s={...ready(),sold:['kspo:F-A:1:6']};
  s=reducer(s,{type:'RETURN',ids:['kspo:F-A:1:6']});
  expect(choose(s,'kspo:F-A:1:6').selected).toContain('kspo:F-A:1:6');
 });
});

describe('극한 피켓팅 반응속도',()=>{
 it('0.3초 지연부터 3만 명대, 0.5초 지연에 8만 명대로 밀린다',()=>{
  expect(queueRank(300,'hard')).toBe(30200);
  expect(queueRank(500,'hard')).toBe(83533);
  expect(queueRank(30,'hard')).toBe(500);
  expect(queueRank(100,'hard')).toBeLessThan(queueRank(300,'hard'));
 });
 it('다른 난이도의 대기순번은 극한 곡선을 적용하지 않는다',()=>{
  expect(queueRank(300,'normal')).toBe(235);
  expect(queueRank(300,'easy')).toBe(165);
 });
});

 describe('아이돌 사례를 참고한 경쟁 규모',()=>{
 it('지연 시 10만 번대로 늘되 무한히 늘지 않는다',()=>{expect(queueRank(1000,'hard')).toBeGreaterThan(100000);expect(queueRank(3000,'hard')).toBeLessThanOrEqual(150000);expect(queueRank(60000,'hard')).toBeLessThanOrEqual(150000);});
 it('4만 번에서도 대형 공연장 외곽 재고를 전부 없애지 않는다',()=>{const all=seatsForVenue('goyang');const sold=initialSold('goyang','hard',100,40000);expect(all.length-sold.length).toBeGreaterThan(all.length*.1);expect(initialSold('goyang','hard',100,40000,'remnants').length).toBeGreaterThan(sold.length);});
 });

describe("예매 버튼 중복 접수",()=>{it("첫 접수 이후 연타가 순번과 시작 시간을 덮어쓰지 않는다",()=>{const first=reducer(initialState,{type:"START",now:10000,openDelayMs:300,difficulty:"hard"});const again=reducer(first,{type:"START",now:10500,openDelayMs:800,difficulty:"hard"});expect(again).toBe(first);expect(again.queueRank).toBe(30200);});});

describe("인기도 기반 무작위 선점",()=>{it("앞열에만 몰리지 않고 뒤쪽 좌석도 선점한다",()=>{let seed=42;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return (seed+.5)/4294967296;};const batch=nextSaleBatch("inspire",[],[],0,"hard","opening",random);const all=seatsForVenue("inspire");const chosen=all.filter(s=>batch.includes(s.id));expect(chosen.some(s=>s.row>10)).toBe(true);expect(chosen.some(s=>s.row<5)).toBe(true);expect(new Set(batch).size).toBe(batch.length);});});
