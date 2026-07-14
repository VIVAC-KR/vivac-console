# vivac-console

VIVAC 내부 운영팀이 사용하는 **운영 콘솔(Operations Console)** 입니다.

## 무엇을 하나요

캠핑 스팟 데이터와 사업자 정보를 웹에서 쉽게 조회·생성·수정·삭제할 수 있는 GUI입니다. 1차 범위는 `spots` / `spot_business_info` 두 테이블이고, 운영 화면이 늘어나면 자연스럽게 확장됩니다.

## 어떻게 동작하나요

- 백엔드(`vivacapi-core`)와 **완전히 분리된 별도 리포**입니다.
- 같은 PostgreSQL을 바라보지만 **DB에 직접 붙지 않고**, 항상 `vivacapi-core`의 어드민 전용 HTTP API(`/v1/internal/*`, 로그인은 `/admin/auth/google`)를 호출합니다.
- 즉 모든 검증·정합성 로직은 백엔드 한 곳에서만 일어납니다. 콘솔은 "화면" 역할만 합니다.

```
┌──────────────────┐   HTTPS / Bearer JWT   ┌────────────────────┐
│  vivac-console   │  ───────────────────>  │   vivacapi-core    │ ──> PostgreSQL
│  (Next.js, 이 리포)│                        │   /v1/internal/*    │
└──────────────────┘                        └────────────────────┘
```

## 누가 쓰나요

내부 운영팀 전용입니다. 회사 Google 계정(예: `@vivac.co.kr`)으로만 로그인할 수 있고, 백엔드에서 `is_staff=True`로 등록된 사용자만 실제 기능을 사용할 수 있습니다.

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js (App Router) + TypeScript |
| 어드민 패턴 | Refine |
| UI | shadcn/ui + Tailwind CSS |
| 인증 | NextAuth (Google Provider) |
| 패키지 매니저 | pnpm |

## 설계 문서

상세 설계는 `vivacapi-core` 리포에 있습니다:

- 백엔드 어드민 API 설계 — `vivacapi-core/docs/projects/vivac-console-backend.md`
- 프론트엔드 콘솔 설계 — `vivacapi-core/docs/projects/vivac-console-frontend.md`

## 시작하기

> 아직 초기 세팅 전입니다. 위 설계 문서의 "작업 단계" 섹션을 따라 진행하세요.

```bash
# 1. 백엔드(vivacapi-core)를 8000 포트에 띄워둡니다
# 2. 환경 변수 준비
cp .env.example .env.local
# 3. 의존성 설치 & 실행
pnpm install
pnpm dev
```

## 관련 리포

- [`vivacapi-core`](../vivacapi-core) — 백엔드 (FastAPI + PostgreSQL). 이 콘솔이 호출하는 API의 소유자.
