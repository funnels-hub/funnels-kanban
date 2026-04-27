# 상담 칸반 보드 (Kanban) v0.1.0

데모 `kanban-v1c-b` 의 단일 페이지 칸반 보드를 풀스택(FastAPI + React 19)으로 구현한 단일 사용자용 상담 일정 관리 도구입니다. 인증 없이 동작하며, Supabase PostgreSQL 의 `kanban` 스키마에 데이터를 영속화합니다.

---

## 기술 스택

### Backend
- Python 3.12+, FastAPI, Uvicorn
- 패키지 관리: `uv`
- DB: Supabase PostgreSQL (`kanban` 스키마)
- 마이그레이션: Supabase SQL

### Frontend
- React 19, Vite 7, TypeScript 5.9
- Tailwind CSS 4, shadcn/ui
- 차트: evil-charts (필요 시)
- HTTP 클라이언트: fetch 기반 자체 래퍼

### 공통
- API 명세: OpenAPI 3.0 (`api.yaml`)
- 컨테이너: Docker / Docker Compose

---

## 디렉토리 구조

```
v0.1.0/
├── api.yaml                # OpenAPI 3.0 명세 (단일 진실 공급원)
├── README.md               # 이 문서
├── backend/                # FastAPI 백엔드
│   ├── main.py             # FastAPI 앱 진입점
│   ├── boards/             # 보드 스냅샷 라우터
│   ├── columns/            # row1/row2 컬럼 CRUD/재정렬
│   ├── cards/              # 카드 CRUD/이동/형제 조회
│   ├── templates/          # 템플릿 CRUD/복제
│   ├── stats/              # 통계 (임플란트)
│   ├── defaults/           # 클라이언트 부트스트랩 상수
│   ├── core/               # DB 클라이언트, 설정, 공통 의존성
│   └── pyproject.toml
├── frontend/               # React + Vite 프론트엔드
│   ├── src/
│   │   ├── pages/          # 라우트 페이지 (보드 / 템플릿)
│   │   ├── components/     # 칸반 UI 컴포넌트
│   │   ├── lib/            # api-client, hooks, utils
│   │   ├── types/          # api.yaml 매핑 타입
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
└── demo/                   # 원본 단일 페이지 데모 (참조용)
    ├── kanban-v1c-b.html             # 메인 보드 데모
    └── kanban-v1c-b-templates.html   # 템플릿 페이지 데모
```

---

## 빠른 시작

### 1. Backend

```bash
cd /home/yonga/project/funnels/kanban/v0.1.0
cp .env.example .env          # 환경변수 채우기 (아래 환경변수 섹션 참조)
uv sync                       # 의존성 설치
PYTHONPATH=. uv run python -m backend.main
```

기본 포트: `http://localhost:8000`
OpenAPI 문서: `http://localhost:8000/docs`

### 2. Frontend

```bash
cd /home/yonga/project/funnels/kanban/v0.1.0/frontend
npm install
npm run dev
```

접속: `http://localhost:5173`

> Frontend 는 Vite 프록시를 통해 `/api` 요청을 백엔드(`http://localhost:8000`)로 전달합니다.

---

## 환경변수 (`.env`)

`/home/yonga/project/funnels/kanban/v0.1.0/.env` 파일에 다음을 정의합니다.

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxxx.supabase.co` |
| `SUPABASE_KEY` | Supabase Service Role Key (또는 anon key) | `eyJhbGci...` |
| `SUPABASE_SCHEMA` | 사용 스키마 | `kanban` |
| `BACKEND_HOST` | Uvicorn 호스트 | `0.0.0.0` |
| `BACKEND_PORT` | Uvicorn 포트 | `8000` |
| `CORS_ORIGINS` | 허용 origin 목록 (콤마 구분) | `http://localhost:5173` |

Frontend `.env` (`/home/yonga/project/funnels/kanban/v0.1.0/frontend/.env`):

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `VITE_API_BASE_URL` | 백엔드 API 베이스 URL | `http://localhost:8000` |

---

## 도메인 룰 요약

### 시간 슬롯 (Time Slots)
- 운영 시간: **09:00 ~ 20:30**, 30분 단위
- 총 24개 슬롯: `9:00, 9:30, 10:00, ... 20:00, 20:30`
- 카드의 `time` 필드는 위 슬롯 중 하나여야 합니다.

### Row1 그룹 분류
| 그룹 | row1 ID | 의미 | 시간 슬롯 제약 |
|------|---------|------|----------------|
| **single-card** | `r1_구환`, `r1_신환` | 구환/신환 상담 | 동일 시간 슬롯에 카드 1개만 허용 (충돌 시 409) |
| **duplicate-allowed** | `r1_임플`, `r1_일반` | 임플란트 / 일반 상담 | 동일 시간 슬롯에 다중 카드 허용 |
| 기타 | `r1_예진`, `r1_전화` 등 | 예진현황 / 전화상담 | 별도 제약 없음 |

### 차트번호 동기화 (Sibling Propagation)
동일 `chart` 번호를 가진 카드들은 다음 **6개 필드**가 자동 동기화됩니다.

1. `name` (이름)
2. `chart` (차트번호)
3. `counselor` (상담사)
4. `book_time` (예약 시간)
5. `consult_time` (상담 시간)
6. `memo` (메모)

- 카드 수정 시 `sync_siblings: true` 로 보내면 백엔드가 형제 카드를 함께 갱신합니다.
- 보드 스냅샷 조회 시 propagation 적용 후 반환됩니다.
- `time`, `row1_id`, `row2_id`, `color` 는 **동기화 대상이 아닙니다**.

### 컬럼 propagation (Templates)
- 템플릿 적용 시 해당 날짜의 row1/row2 구조가 템플릿 구조로 **교체**됩니다.
- `built_in=true` 컬럼(기본 컬럼)은 **삭제 불가** (위반 시 409).
- 기본 템플릿(`is_default=true`)은 **삭제 불가**.

---

## API 엔드포인트

| Tag | Method | Path | 설명 |
|-----|--------|------|------|
| boards | GET | `/api/boards/{date}` | 일자별 보드 스냅샷 (컬럼 + 카드 통합) 조회 |
| boards | POST | `/api/boards/{date}/apply-template` | 템플릿을 보드에 적용 |
| columns | GET | `/api/columns/{date}` | 일자별 컬럼 구조(row1/row2) 조회 |
| columns | POST | `/api/columns/{date}/row1` | row1 컬럼 추가 |
| columns | PATCH | `/api/columns/{date}/row1/{r1_id}` | row1 컬럼 수정 |
| columns | DELETE | `/api/columns/{date}/row1/{r1_id}` | row1 컬럼 삭제 (built_in 불가) |
| columns | POST | `/api/columns/{date}/row2` | row2 컬럼 추가 |
| columns | PATCH | `/api/columns/{date}/row2/{r2_id}` | row2 컬럼 수정 |
| columns | DELETE | `/api/columns/{date}/row2/{r2_id}` | row2 컬럼 삭제 (built_in 불가) |
| columns | PUT | `/api/columns/{date}/reorder` | row1/row2 일괄 재정렬 |
| cards | GET | `/api/cards?date=YYYY-MM-DD` | 일자별 카드 목록 |
| cards | POST | `/api/cards` | 카드 생성 (single-card 슬롯 충돌 시 409) |
| cards | PATCH | `/api/cards/{id}` | 카드 수정 (sync_siblings 옵션) |
| cards | DELETE | `/api/cards/{id}` | 카드 삭제 |
| cards | PATCH | `/api/cards/{id}/move` | 카드 이동 (시간/컬럼 변경) |
| cards | GET | `/api/cards/by-chart?chart=...` | 차트번호로 형제 카드 조회 |
| stats | GET | `/api/stats/implant?date=...` | 임플란트 row2 별 카운트 통계 |
| templates | GET | `/api/templates` | 템플릿 목록 |
| templates | POST | `/api/templates` | 템플릿 생성 (source_date 옵션) |
| templates | GET | `/api/templates/{id}` | 템플릿 단건 조회 |
| templates | PATCH | `/api/templates/{id}` | 템플릿 수정 (이름 / 구조) |
| templates | DELETE | `/api/templates/{id}` | 템플릿 삭제 (is_default 불가) |
| templates | POST | `/api/templates/{id}/duplicate` | 템플릿 복제 |
| defaults | GET | `/api/defaults` | 클라이언트 부트스트랩 정적 상수 묶음 |

> 전체 명세 및 스키마: `api.yaml` 참조

---

## DB 스키마 (Supabase `kanban`)

| 테이블 | 설명 |
|--------|------|
| `column_row1` | 일자별 row1 컬럼 (예: 구환상담, 신환상담, 임플상담 등) |
| `column_row2` | 일자별 row2 컬럼 (row1 의 하위 leaf, 예: 임플 상/중/하) |
| `cards` | 카드 (시간, 이름, 차트번호, 상담사, 메모 등) |
| `templates` | 컬럼 구조 템플릿 (row1/row2 묶음 JSON 보관) |

---

## Docker

### 빌드

```bash
cd /home/yonga/project/funnels/kanban/v0.1.0
docker compose build
```

### 실행

```bash
docker compose up -d
```

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`

### 로그 확인

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### 종료

```bash
docker compose down
```

---

## 데모와의 차이

| 항목 | 데모 (`kanban-v1c-b.html`) | v0.1.0 (풀스택) |
|------|---------------------------|------------------|
| 데이터 영속성 | LocalStorage 한정 (브라우저 종속) | Supabase PostgreSQL 영속화 |
| 다중 날짜 지원 | 단일 날짜 (페이지 내 상태) | 임의 날짜별 보드 관리 (`/api/boards/{date}`) |
| 템플릿 | 페이지 내 정적 구조 | DB 영속, CRUD/복제 가능 (`/api/templates`) |
| 형제 동기화 | 클라이언트 로컬 처리 | 서버 처리 + propagation 적용 후 반환 |
| 동시 접근 | 불가 (단일 탭) | 가능 (단일 사용자 가정, 인증은 없음) |
| 통계 | 페이지 내 계산 | `/api/stats/implant` 서버 집계 |
| 배포 | 정적 HTML | Docker / Docker Compose |

원본 데모(`demo/kanban-v1c-b.html`, `demo/kanban-v1c-b-templates.html`)는 UI/UX 레퍼런스로 보존되며, 풀스택 버전의 컴포넌트 디자인 기준이 됩니다.
