import {describe,it,expect} from 'vitest';
import {bookingRoute} from './bookingRoute';
describe('콘서트·야구 경로 분리',()=>{
 it.each(['nol','melon','yes24','ticketlink'])('%s 콘서트 경로에 야구장이 들어와도 공연장으로 연다',name=>{
  expect(bookingRoute(name,new URLSearchParams('venue=gocheok'))?.venue).toBe('goyang');
  expect(bookingRoute(name,new URLSearchParams('venue=jamsil'))?.venue).toBe('goyang');
 });
 it('고척 티켓링크는 명시적인 야구 경로에서만 연다',()=>{
  const route=bookingRoute('baseball',new URLSearchParams('provider=ticketlink&venue=gocheok&scenario=regular'));
  expect(route?.venue).toBe('gocheok');expect(route?.platform.id).toBe('ticketlink');expect(route?.scenario).toBe('regular');
 });
 it('기존 야구 링크는 NOL 잠실로 유지한다',()=>{const route=bookingRoute('baseball',new URLSearchParams());expect(route?.venue).toBe('jamsil');expect(route?.platform.id).toBe('nol');});
 it('제거한 잔여석 링크는 일반 콘서트 연습으로 연다',()=>{expect(bookingRoute('nol',new URLSearchParams('venue=kspo&scenario=remnants'))?.scenario).toBe('opening');});
});
