import type { State } from './simulator';
import { seconds } from './records';

export function practiceFeedback(state: State): string[] {
  const timing =
    state.mode === 'seats'
      ? '좌석 집중에서는 오픈과 대기를 생략해 반응속도를 측정하지 않습니다.'
      : state.openDelayMs == null
        ? '이번 연습에서는 오픈 반응속도를 측정하지 못했습니다.'
        : state.openDelayMs > 1000
          ? '오픈 클릭이 1초 이상 늦었습니다. 카운트다운을 보고 클릭하는 연습을 해 보세요.'
          : '오픈 후 1초 안에 접수했습니다. 다음에는 목표 구역과 예비 구역을 함께 정해 보세요.';

  const security = state.codeErrors
    ? `보안문자를 ${state.codeErrors}번 틀렸습니다. 별도 보안문자 연습에서 정확도를 확인해 보세요.`
    : state.verifiedAt != null
      ? `보안문자 ${seconds(state.verifiedAt - (state.securityEnteredAt ?? state.verifiedAt))} · 오입력 없음`
      : '이번 연습은 보안문자 단계를 생략했습니다.';

  const seats = state.misses
    ? `좌석 선택에 ${state.misses}회 실패했습니다. 남은 좌석이 적으면 다른 구역도 확인해 보세요.`
    : !state.success
      ? '종료 원인을 확인하고, 필요한 단계부터 다시 연습해 보세요.'
      : state.difficulty === 'easy'
        ? '낮은 경쟁에서 좌석을 확보했습니다. 순서가 익숙해졌다면 실전 연습에 도전해 보세요.'
        : state.difficulty === 'normal'
          ? '실전 연습에서 좌석을 확보했습니다. 기록을 비교하며 구역 판단 시간을 줄여 보세요.'
          : '피켓팅에서 좌석을 확보했습니다. 같은 조건으로 반복하며 결과가 달라지는지 확인해 보세요.';

  return [timing, security, seats];
}
