# 티켓연습실
콘서트 4개 공연장과 잠실·고척 야구 예매를 연습하는 React/TypeScript 웹앱.

## 실행
- Node.js 22 이상
- `npm ci`
- `npm run dev`
- `npm test` — 현재 소스의 59개 테스트
- `npm run build` — TypeScript 확인 후 dist 생성
- Windows에서는 start-local.cmd로 실행할 수 있다. 설치된 Codex Node 런타임이 있으면 우선 사용한다.

## 기능
NOL/멜론/YES24/티켓링크형 연습, 전체/좌석 집중/보안문자 연습, 인기 공연/잠실·고척 정규시즌 및 가을야구, 반응속도 기반 대기 순번, 전체 재고 기반 좌석 판매, 스탠딩, 기록과 피드백.

## 연구 및 제한
[조사·구현·검증 기록](docs/RESEARCH.md)에 공식 근거와 연습 가정을 구분했다. 실시간 서버, 실제 예매처 계정/결제 연동은 없다. 기록은 브라우저 localStorage, 직전 설정은 sessionStorage에만 보관한다.

## 배포
운영 배포 대상은 Netlify의 기존 ticketlab-v 프로젝트다. 앞으로도 https://ticketlab-v.netlify.app/ 에 재배포한다. Sites 배포를 운영 배포로 대체하지 않는다. 검증한 dist 폴더 내용만 ZIP으로 묶어 https://app.netlify.com/projects/ticketlab-v/overview 의 수동 배포로 업로드한다. .research, 소스, 로컬 실행 기록은 배포 ZIP에 포함하지 않는다.

