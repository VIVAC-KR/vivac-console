# 데이터 검증(pipeline_status) 화면 — 백엔드(vivacapi-core) 요청 명세

콘솔에 staff용 "raw 데이터 검증" 화면을 만들었다. `pipeline_status=ENRICHED`인 spot을
staff가 직접 구글 검색 등으로 대조하며 필드를 수정하고, 제출하면 `CURATED`로,
반려하면 `REJECTED`로 전이시킨다. 이 화면이 돌아가려면 core 쪽 API 3곳에 변경이 필요하다.

콘솔 쪽 구현은 완료됨 (`src/components/admin/spot-edit-form.tsx`,
`src/app/(admin)/spots/page.tsx`). 아래는 core가 맞춰줘야 하는 계약.

## 전제

- `pipeline_status` enum은 이미 존재: `RAW`, `ENRICHED`, `CURATED`, `REVIEWED`, `PUBLISHED`, `REJECTED`
- 인증/권한: 기존과 동일. `Authorization: Bearer <JWT>`, `is_staff` 체크만. **신규 롤 불필요** (세부 권한 도입 안 하기로 결정)
- 이 화면은 **pull 방식** — 특정 staff에게 항목을 배정하는 기능 없음. `assigned_to` 같은 필드 불필요

## 1. `GET /v1/admin/internal/spots` — 필드 노출 + 필터 추가

- 응답 각 아이템에 `pipeline_status` 포함 (지금은 빠져 있음)
- 쿼리 파라미터 `pipeline_status`를 `_FILTERABLE` 화이트리스트에 추가 (기존 `region_province`, `source`와 동일한 방식)

```
GET /v1/admin/internal/spots?pipeline_status=ENRICHED&_start=0&_end=25
```

## 2. `GET /v1/admin/internal/spots/distinct/pipeline_status` — 기존 distinct 엔드포인트 재사용

`region_province`, `source`와 동일한 기존 패턴. `pipeline_status`만 화이트리스트에 추가하면 됨. 신규 엔드포인트 아님.

```json
["RAW", "ENRICHED", "CURATED", "REVIEWED", "PUBLISHED", "REJECTED"]
```

## 3. `PATCH /v1/admin/internal/spots/{uid}` — `pipeline_status` 필드 수신 + 전이 검증

콘솔은 제출/반려 버튼을 누르면 수정된 필드들과 함께 `pipeline_status`를 payload에 실어 보낸다.

```json
PATCH /v1/admin/internal/spots/{uid}
{
  "title": "...",
  "address": "...",
  ...,
  "pipeline_status": "CURATED"
}
```

**서버에서 반드시 검증할 것**: 이 엔드포인트로 들어오는 `pipeline_status` 전이는
`ENRICHED → CURATED` 또는 `ENRICHED → REJECTED` **이 두 가지만 허용**. 그 외 값(예: 현재
상태가 `RAW`인데 `PUBLISHED`로 점프, 혹은 `CURATED`에서 다시 `ENRICHED`로 되돌리기 등)은
거부. 이 화면은 검증 큐 하나만 처리하는 용도라 다른 단계 전이는 별도 워크플로우 몫.

전이 거부 시 4xx + 에러 메시지 텍스트만 반환하면 됨. 콘솔은 응답 바디를 그대로
alert 박스에 띄운다 (`spot-edit-form.tsx`의 `error` 상태 — 별도 에러 코드 파싱 안 함,
사람이 읽을 메시지면 충분).

## 4. `/v1/admin/internal/spots/{uid}/history` — 확인만 하면 됨

기존 audit 트리거가 컬럼 단위로 diff를 잡는 방식이면 `pipeline_status` 변경도 자동으로
`changes.pipeline_status: { before, after }`로 잡힐 것으로 예상. 별도 로직 추가 없이
그런지만 확인 부탁. (`docs/audit-history-api.md` 참고 — `updated_at`처럼 의도적으로
diff에서 제외해야 하는 컬럼은 아님, 오히려 이 화면의 핵심 감사 로그라 반드시 잡혀야 함)

## 스코프 아닌 것

- staff 세부 권한/롤 — 안 함, 기존 isStaff 그대로
- 특정 staff에게 항목 배정(assign) — 안 함, pull 방식
- `ENRICHED` 이후 단계(`REVIEWED`, `PUBLISHED`) 전이 — 이 화면 스코프 아님, 필요시 별도 요청
