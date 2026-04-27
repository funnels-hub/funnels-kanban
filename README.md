# 상담 칸반 보드 (Kanban) v0.2.0

데모 `kanban-v1c-b` 의 단일 페이지 칸반 보드를 풀스택(FastAPI + React 19)으로 구현한 상담 일정 관리 도구입니다. **v0.2.0 부터는 멀티테넌트(병원 단위) 구조와 JWT 기반 로그인이 추가**되어, 여러 병원이 격리된 데이터로 동시에 사용할 수 있습니다. 데이터는 Supabase PostgreSQL 의 `kanban_v2` 스키마에 영속화됩니다.

> **v0.1.0 (`kanban` 스키마, port 8000) 와 완전히 분리**되어 운영됩니다. 두 버전을 동시에 띄워도 서로 영향을 주지 않습니다.

---

## 기술 스택

### Backend
- Python 3.12+, FastAPI, Uvicorn
- 패키지 관리: `uv`
- DB: Supabase PostgreSQL (`kanban_v2` 스키마)
- 인증: JWT (PyJWT), 비밀번호 해시 bcrypt (`passlib[bcrypt]`)
- 마이그레이션: Supabase SQL (`docs/migration_kanban_v2.sql`)

### Frontend
- React 19, Vite 7, TypeScript 5.9
- Tailwind CSS 4, shadcn/ui
- 차트: evil-charts (필요 시)
- HTTP 클라이언트: fetch 기반 자체 래퍼 (Authorization 헤더 자동 주입)
- 라우팅: React Router (보호 라우트 + `/login`)

### 공통
- API 명세: OpenAPI 3.0 (`api.yaml`) — 모든 endpoint `bearerAuth` 적용
- 컨테이너: Docker / Docker Compose

---

## 디렉토리 구조

```
v0.2.0/
├── api.yaml                          # OpenAPI 3.0 명세 (단일 진실 공급원, JWT 적용)
├── README.md                         # 이 문서
├── docs/
│   └── migration_kanban_v2.sql       # kanban_v2 스키마 마이그레이션 SQL
├── backend/                          # FastAPI 백엔드
│   ├── main.py                       # FastAPI 앱 진입점 (port 9000)
│   ├── auth/                         # ★ 신규: 로그인 / 토큰 / 현재 사용자
│   │   ├── router.py                 #   POST /api/auth/login, GET /api/auth/me
│   │   ├── service.py                #   bcrypt 검증, JWT 발급
│   │   ├── deps.py                   #   get_current_user, get_current_admin
│   │   └── model.py
│   ├── hospitals/                    # ★ 신규: 병원(테넌트) 관리 (admin 전용)
│   │   ├── router.py                 #   /api/admin/hospitals CRUD
│   │   ├── service.py
│   │   └── model.py
│   ├── boards/                       # 보드 스냅샷 라우터 (hospital_id 스코프)
│   ├── columns/                      # row1/row2 컬럼 CRUD/재정렬 (hospital_id 스코프)
│   ├── cards/                        # 카드 CRUD/이동/형제 조회 (hospital_id 스코프)
│   ├── templates/                    # 템플릿 CRUD/복제 (hospital_id 스코프)
│   ├── stats/                        # 통계 (임플란트, hospital_id 스코프)
│   ├── defaults/                     # 클라이언트 부트스트랩 상수
│   ├── scripts/
│   │   └── seed_admin.py             # ★ 신규: 초기 admin 계정 시드 스크립트
│   ├── core/                         # DB 클라이언트, 설정, 공통 의존성, JWT util
│   └── pyproject.toml
├── frontend/                         # React + Vite 프론트엔드
│   ├── src/
│   │   ├── pages/
│   │   │   ├── login/                # ★ 신규: 로그인 페이지
│   │   │   ├── admin/hospitals/      # ★ 신규: 병원 관리 (admin)
│   │   │   ├── board/
│   │   │   └── templates/
│   │   ├── components/               # 칸반 UI + AuthGuard / TopBar
│   │   ├── lib/                      # api-client (Bearer 자동), auth-store, hooks
│   │   ├── types/                    # api.yaml 매핑 타입 (auth, hospital 포함)
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
└── demo/                             # 원본 단일 페이지 데모 (참조용)
    ├── kanban-v1c-b.html
    └── kanban-v1c-b-templates.html
```

---

## 빠른 시작

### 0. DB 마이그레이션 (최초 1회)

`kanban_v2` 스키마와 테이블을 Supabase 에 생성합니다.

- **Supabase MCP** 사용 시: `docs/migration_kanban_v2.sql` 의 내용을 `apply_migration` 으로 실행.
- **psql** 사용 시:

```bash
psql "$DATABASE_URL" -f /home/yonga/project/funnels/kanban/v0.2.0/docs/migration_kanban_v2.sql
```

> 마이그레이션은 `hospitals` 테이블과 `column_row1 / column_row2 / cards / templates` 4개 테이블(모두 `hospital_id` 컬럼 포함)을 생성합니다. v0.1.0 의 `kanban` 스키마와 완전히 분리됩니다.

### 1. Backend

```bash
cd /home/yonga/project/funnels/kanban/v0.2.0
cp .env.example .env                                 # 아래 환경변수 섹션 참조하여 채우기
uv sync                                              # 의존성 설치
uv run python -m backend.scripts.seed_admin          # 초기 admin 계정 시드 (최초 1회)
PYTHONPATH=. uv run python -m backend.main           # FastAPI 기동 (port 9000)
```

기본 포트: `http://localhost:9000`
OpenAPI 문서: `http://localhost:9000/docs`

> `seed_admin` 은 멱등(idempotent) 합니다. 이미 admin 이 있으면 안전하게 스킵됩니다.

### 2. Frontend

```bash
cd /home/yonga/project/funnels/kanban/v0.2.0/frontend
npm install
npm run dev
```

접속: `http://localhost:5173/login`

> Frontend 는 `VITE_API_BASE_URL=http://localhost:9000` 으로 백엔드를 직접 호출하며, 로그인 성공 시 받은 JWT 를 `Authorization: Bearer <token>` 헤더로 모든 API 요청에 자동 첨부합니다.

### 3. 로그인

초기 시드 계정으로 로그인합니다.

| 필드 | 값 |
|------|----|
| 이메일 | `admin@funnels.co.kr` |
| 비밀번호 | `vjsjftm1!` |

> 운영 환경에서는 시드 후 비밀번호를 즉시 변경하세요.

---

## 환경변수

### Backend (`/home/yonga/project/funnels/kanban/v0.2.0/.env`)

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `ENV` | 실행 환경 | `local` / `production` |
| `DATABASE_URL` | Supabase Postgres 연결 문자열 | `postgresql://...supabase.co:5432/postgres` |
| `DB_SCHEMA` | 사용 스키마 (v0.2.0 전용) | `kanban_v2` |
| `BACKEND_HOST` | Uvicorn 호스트 | `0.0.0.0` |
| `BACKEND_PORT` | Uvicorn 포트 | `9000` |
| `CORS_ORIGINS` | 허용 origin 목록 (콤마 구분) | `http://localhost:5173` |
| `JWT_SECRET` | JWT 서명 비밀키 (충분히 긴 랜덤 문자열) | `change-me-please` |
| `JWT_ALGORITHM` | JWT 알고리즘 | `HS256` |
| `JWT_EXPIRES_MIN` | 액세스 토큰 만료(분) | `1440` (24h) |
| `ADMIN_EMAIL` | 시드 admin 이메일 | `admin@funnels.co.kr` |
| `ADMIN_PASSWORD` | 시드 admin 비밀번호 | `vjsjftm1!` |

### Frontend (`/home/yonga/project/funnels/kanban/v0.2.0/frontend/.env`)

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `VITE_API_BASE_URL` | 백엔드 API 베이스 URL | `http://localhost:9000` |

---

## 도메인 룰 요약

### 멀티테넌트 (Hospitals)
- 모든 데이터(`column_row1`, `column_row2`, `cards`, `templates`)는 `hospital_id` 로 격리됩니다.
- 일반 사용자는 자신의 `hospital_id` 데이터만 조회/수정 가능합니다 (백엔드에서 자동으로 토큰의 `hospital_id` 로 필터).
- **admin 역할** (`role='admin'`) 사용자만 `/api/admin/hospitals` 엔드포인트로 병원 CRUD 가 가능합니다.
- 사용자 ↔ 병원 매핑은 `users.hospital_id` (admin 은 NULL 가능) 로 표현됩니다.

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
동일 `chart` 번호를 가진 카드들은 다음 **6개 필드**가 자동 동기화됩니다 (단, 같은 `hospital_id` 내에서만 형제로 인식).

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
- 템플릿 역시 `hospital_id` 단위로 격리됩니다.

---

## API 엔드포인트

모든 endpoint 는 `Authorization: Bearer <jwt>` 헤더 필수입니다 (`/api/auth/login` 제외). admin 전용 endpoint 는 `role='admin'` 토큰만 통과합니다.

| Tag | Auth | Method | Path | 설명 |
|-----|------|--------|------|------|
| auth | public | POST | `/api/auth/login` | 이메일/비밀번호 로그인, JWT 발급 |
| auth | user | GET | `/api/auth/me` | 현재 로그인 사용자 정보(role/hospital_id 포함) |
| admin | admin | GET | `/api/admin/hospitals` | 병원 목록 조회 |
| admin | admin | POST | `/api/admin/hospitals` | 병원 생성 |
| admin | admin | PATCH | `/api/admin/hospitals/{id}` | 병원 수정 |
| admin | admin | DELETE | `/api/admin/hospitals/{id}` | 병원 삭제 |
| boards | user | GET | `/api/boards/{date}` | 일자별 보드 스냅샷 (컬럼 + 카드 통합) 조회 |
| boards | user | POST | `/api/boards/{date}/apply-template` | 템플릿을 보드에 적용 |
| columns | user | GET | `/api/columns/{date}` | 일자별 컬럼 구조(row1/row2) 조회 |
| columns | user | POST | `/api/columns/{date}/row1` | row1 컬럼 추가 |
| columns | user | PATCH | `/api/columns/{date}/row1/{r1_id}` | row1 컬럼 수정 |
| columns | user | DELETE | `/api/columns/{date}/row1/{r1_id}` | row1 컬럼 삭제 (built_in 불가) |
| columns | user | POST | `/api/columns/{date}/row2` | row2 컬럼 추가 |
| columns | user | PATCH | `/api/columns/{date}/row2/{r2_id}` | row2 컬럼 수정 |
| columns | user | DELETE | `/api/columns/{date}/row2/{r2_id}` | row2 컬럼 삭제 (built_in 불가) |
| columns | user | PUT | `/api/columns/{date}/reorder` | row1/row2 일괄 재정렬 |
| cards | user | GET | `/api/cards?date=YYYY-MM-DD` | 일자별 카드 목록 |
| cards | user | POST | `/api/cards` | 카드 생성 (single-card 슬롯 충돌 시 409) |
| cards | user | PATCH | `/api/cards/{id}` | 카드 수정 (sync_siblings 옵션) |
| cards | user | DELETE | `/api/cards/{id}` | 카드 삭제 |
| cards | user | PATCH | `/api/cards/{id}/move` | 카드 이동 (시간/컬럼 변경) |
| cards | user | GET | `/api/cards/by-chart?chart=...` | 차트번호로 형제 카드 조회 |
| stats | user | GET | `/api/stats/implant?date=...` | 임플란트 row2 별 카운트 통계 |
| templates | user | GET | `/api/templates` | 템플릿 목록 |
| templates | user | POST | `/api/templates` | 템플릿 생성 (source_date 옵션) |
| templates | user | GET | `/api/templates/{id}` | 템플릿 단건 조회 |
| templates | user | PATCH | `/api/templates/{id}` | 템플릿 수정 (이름 / 구조) |
| templates | user | DELETE | `/api/templates/{id}` | 템플릿 삭제 (is_default 불가) |
| templates | user | POST | `/api/templates/{id}/duplicate` | 템플릿 복제 |
| defaults | user | GET | `/api/defaults` | 클라이언트 부트스트랩 정적 상수 묶음 |

> 전체 명세 및 스키마: `api.yaml` 참조

---

## DB 스키마 (Supabase `kanban_v2`)

| 테이블 | 주요 컬럼 | 설명 |
|--------|-----------|------|
| `hospitals` | `id`, `name`, `created_at` | ★ 신규: 병원(테넌트) 마스터 |
| `users` | `id`, `email` (unique), `password_hash`, `role` (`admin`/`user`), `hospital_id` | ★ 신규: 로그인 사용자, 병원에 종속 (admin 은 NULL 가능) |
| `column_row1` | `id`, `hospital_id`, `date`, ... | 일자별 row1 컬럼 (구환/신환/임플 등) — `hospital_id` 격리 |
| `column_row2` | `id`, `hospital_id`, `date`, `row1_id`, ... | 일자별 row2 컬럼 (row1 의 하위 leaf) — `hospital_id` 격리 |
| `cards` | `id`, `hospital_id`, `date`, `time`, `chart`, ... | 카드(시간/이름/차트번호/상담사/메모) — `hospital_id` 격리 |
| `templates` | `id`, `hospital_id`, `name`, `structure` (JSON), `is_default` | 컬럼 구조 템플릿 — `hospital_id` 격리 |

> 모든 도메인 테이블은 `(hospital_id, ...)` 복합 인덱스로 테넌트 단위 조회를 최적화합니다.

---

## 초기 Admin 계정

`uv run python -m backend.scripts.seed_admin` 실행 시 다음 계정이 생성됩니다.

| 항목 | 값 |
|------|----|
| Email | `admin@funnels.co.kr` |
| Password | `vjsjftm1!` |
| Role | `admin` |
| Hospital | `NULL` (모든 병원 관리 가능) |

이 계정으로 로그인 후 `/admin/hospitals` 페이지에서 병원과 병원별 사용자를 생성하세요.

---

## v0.1.0 ↔ v0.2.0 차이

| 항목 | v0.1.0 | v0.2.0 |
|------|--------|--------|
| 인증 | 없음 (단일 사용자 가정) | **JWT (Bearer) + bcrypt 비밀번호 해시** |
| 테넌시 | 단일 사용자 | **멀티테넌트 (병원 단위, `hospital_id` 격리)** |
| 사용자 관리 | 없음 | `users` 테이블 + `role` (`admin` / `user`) |
| 병원 관리 | 없음 | `/api/admin/hospitals` (admin 전용 4개 endpoint) |
| 로그인 페이지 | 없음 | `/login` (Frontend) |
| 관리자 페이지 | 없음 | `/admin/hospitals` (Frontend, admin 전용) |
| DB 스키마 | `kanban` | **`kanban_v2`** (별도 스키마, 완전 분리) |
| 신규 테이블 | — | `hospitals`, `users` |
| 기존 테이블 변화 | — | `column_row1 / column_row2 / cards / templates` 에 `hospital_id` 추가 |
| Backend 포트 | 8000 | **9000** |
| Frontend API 호출 | Vite 프록시 (`/api`) | `VITE_API_BASE_URL=http://localhost:9000` 직접 호출 |
| 신규 endpoint | — | `/api/auth/login`, `/api/auth/me`, `/api/admin/hospitals` (CRUD 4개) |
| 기존 endpoint | 인증 없음 | **모두 `bearerAuth` 보호 + `hospital_id` 자동 스코프** |
| 시드 스크립트 | 없음 | `backend/scripts/seed_admin.py` |

> v0.1.0 은 그대로 두고 v0.2.0 을 별도 포트(9000) + 별도 스키마(`kanban_v2`) 로 운영하면 두 버전이 공존 가능합니다.

---

## Docker

### 빌드

```bash
cd /home/yonga/project/funnels/kanban/v0.2.0
docker compose build
```

### 실행

```bash
docker compose up -d
```

- Backend: `http://localhost:9000`
- Frontend: `http://localhost:5173` (`/login` 으로 접속)

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

| 항목 | 데모 (`kanban-v1c-b.html`) | v0.2.0 (풀스택, 멀티테넌트) |
|------|---------------------------|------------------------------|
| 인증 | 없음 | JWT 로그인 + role 기반 권한 |
| 테넌시 | 없음 | 병원 단위 데이터 격리 |
| 데이터 영속성 | LocalStorage 한정 | Supabase PostgreSQL (`kanban_v2`) |
| 다중 날짜 지원 | 단일 날짜 | 임의 날짜별 보드 (`/api/boards/{date}`) |
| 템플릿 | 페이지 내 정적 구조 | DB 영속, 병원별 CRUD/복제 |
| 형제 동기화 | 클라이언트 로컬 처리 | 서버 처리 + 같은 병원 내 propagation |
| 동시 접근 | 불가 | 가능 (병원별 다중 사용자) |
| 통계 | 페이지 내 계산 | `/api/stats/implant` 서버 집계 (병원 스코프) |
| 배포 | 정적 HTML | Docker / Docker Compose |

원본 데모(`demo/kanban-v1c-b.html`, `demo/kanban-v1c-b-templates.html`)는 UI/UX 레퍼런스로 보존되며, 풀스택 버전의 컴포넌트 디자인 기준이 됩니다.
