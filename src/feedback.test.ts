import { expect, it } from 'vitest';
import { practiceFeedback } from './feedback';
import { initialState } from './simulator';

it('쉬움 성공 결과에 어려움 난이도의 조언을 붙이지 않는다', () => {
  const advice = practiceFeedback({ ...initialState, difficulty: 'easy', success: true });
  expect(advice.join(' ')).toContain('낮은 경쟁');
  expect(advice.join(' ')).not.toContain('피켓팅');
});

it('좌석 집중에서 오픈 반응을 성공이나 실패로 평가하지 않는다', () => {
  const advice = practiceFeedback({ ...initialState, mode: 'seats', openDelayMs: null });
  expect(advice[0]).toContain('측정하지 않습니다');
  expect(advice[0]).not.toContain('늦었습니다');
});

it('실패한 연습에 좌석 확보 성공 문구를 표시하지 않는다', () => {
  const advice = practiceFeedback({
    ...initialState,
    difficulty: 'hard',
    success: false,
    misses: 2,
  });
  expect(advice[2]).toContain('2회 실패');
  expect(advice[2]).not.toContain('확보했습니다');
});
