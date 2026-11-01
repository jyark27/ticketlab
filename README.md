# 티켓연습실
콘서트 4개 공연장과 잠실·고척 야구 예매를 연습하는 React/TypeScript 웹앱.

## 실행
- Node.js 22 이상
- `npm ci`
- `npm run dev`
- `npm test` — 현재 소스의 62개 테스트
- `npm run build` — TypeScript 확인 후 dist 생성
- Windows에서는 start-local.cmd로 실행할 수 있다. 설치된 Codex Node 런타임이 있으면 우선 사용한다.

## 기능
NOL/멜론/YES24/티켓링크형 연습, 전체/좌석 집중/보안문자 연습, 인기 공연/잠실·고척 정규시즌 및 가을야구, 반응속도 기반 대기 순번, 전체 재고 기반 좌석 판매, 스탠딩, 기록과 피드백.

## 연구 및 제한
[조사·구현·검증 기록](docs/RESEARCH.md)에 공식 근거와 연습 가정을 구분했다. 실시간 서버, 실제 예매처 계정/결제 연동은 없다. 기록은 브라우저 localStorage, 직전 설정은 sessionStorage에만 보관한다.

## 배포
2026-11-01 사용자 요청으로 Cloudflare Pages로 이전한다. GitHub 연결은 Cloudflare 계정 로그인 후 완료해야 한다.

- 저장소: https://github.com/jyark27/ticketlab.git
- 운영 브랜치: main
- 프레임워크: Vite (React)
- 프로젝트 루트: 저장소 루트
- 빌드 명령: npm run build
- 결과 디렉터리: dist
- Node.js: 22 (.node-version)

매 작업 완료 시 검증 후 GitHub main에 커밋·푸시하고 Cloudflare Pages 배포 성공과 운영 화면을 확인한다. Sites 호스팅으로 대체하지 않는다. 기존 Netlify는 크레딧 소진으로 업데이트가 중단되어 있으며 이전 주소는 새 호스팅으로 이동할 수 없다.

브라우저에 저장된 연습 기록은 주소별로 분리되므로 새 주소에서는 기존 Netlify 기록이 자동으로 나타나지 않는다.
