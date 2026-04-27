-- =============================================
-- kanban_v2 schema migration
-- 멀티테넌트 + 로그인 지원
-- =============================================

CREATE SCHEMA IF NOT EXISTS kanban_v2;

-- 1. hospitals
CREATE TABLE kanban_v2.hospitals (
    id              text PRIMARY KEY,
    name            text NOT NULL,
    email           text NOT NULL UNIQUE,
    password_hash   text NOT NULL,
    is_admin        boolean NOT NULL DEFAULT false,
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX hospitals_email_idx ON kanban_v2.hospitals (email);

-- 2. column_row1
CREATE TABLE kanban_v2.column_row1 (
    hospital_id     text NOT NULL REFERENCES kanban_v2.hospitals(id) ON DELETE CASCADE,
    id              text NOT NULL,
    date            date NOT NULL,
    label           text NOT NULL,
    position        integer NOT NULL DEFAULT 0,
    built_in        boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (hospital_id, date, id)
);
CREATE INDEX column_row1_hospital_date_idx ON kanban_v2.column_row1 (hospital_id, date);

-- 3. column_row2
CREATE TABLE kanban_v2.column_row2 (
    hospital_id     text NOT NULL,
    id              text NOT NULL,
    date            date NOT NULL,
    row1_id         text NOT NULL,
    label           text NOT NULL,
    position        integer NOT NULL DEFAULT 0,
    built_in        boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (hospital_id, date, id),
    FOREIGN KEY (hospital_id, date, row1_id)
        REFERENCES kanban_v2.column_row1(hospital_id, date, id) ON DELETE CASCADE
);
CREATE INDEX column_row2_hospital_date_idx ON kanban_v2.column_row2 (hospital_id, date, row1_id);

-- 4. cards
CREATE TABLE kanban_v2.cards (
    hospital_id     text NOT NULL REFERENCES kanban_v2.hospitals(id) ON DELETE CASCADE,
    id              text NOT NULL,
    date            date NOT NULL,
    row1_id         text NOT NULL,
    row2_id         text NOT NULL,
    time            text NOT NULL,
    name            text NOT NULL DEFAULT '',
    chart           text NOT NULL DEFAULT '',
    counselor       text NOT NULL DEFAULT '',
    book_time       text NOT NULL DEFAULT '',
    consult_time    text NOT NULL DEFAULT '',
    memo            text NOT NULL DEFAULT '',
    color           text NOT NULL DEFAULT '',
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (hospital_id, id)
);
CREATE INDEX cards_hospital_date_idx ON kanban_v2.cards (hospital_id, date);
CREATE INDEX cards_hospital_chart_idx ON kanban_v2.cards (hospital_id, date, chart);

-- 5. templates
CREATE TABLE kanban_v2.templates (
    hospital_id     text NOT NULL REFERENCES kanban_v2.hospitals(id) ON DELETE CASCADE,
    id              text NOT NULL,
    name            text NOT NULL,
    row1            jsonb NOT NULL DEFAULT '[]'::jsonb,
    row2            jsonb NOT NULL DEFAULT '[]'::jsonb,
    is_default      boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (hospital_id, id)
);
CREATE INDEX templates_hospital_idx ON kanban_v2.templates (hospital_id);

-- 6. seed admin (password 'vjsjftm1!' bcrypt hash는 backend seed_admin.py에서 처리)
-- INSERT는 별도 application script로 (bcrypt 해싱 필요)

-- =============================================
-- 적용 방법
-- =============================================
--
-- 1. 이 DDL을 Supabase SQL Editor 또는 psql로 실행
--    - Supabase MCP: mcp__supabase__apply_migration 호출 권장
--    - psql: psql "$DATABASE_URL" -f migration_kanban_v2.sql
--
-- 2. 실행 후 검증:
--    - SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'kanban_v2';
--    - \dt kanban_v2.*  (psql) 또는 Supabase Dashboard > Database > Tables
--    - 5개 테이블(hospitals, column_row1, column_row2, cards, templates) 확인
--
-- 3. seed admin 계정 생성 (별도 단계):
--    - 비밀번호 'vjsjftm1!'는 평문 저장 금지
--    - bcrypt 해싱 필요 (cost factor 12 권장)
--    - backend의 seed_admin.py 스크립트에서 처리:
--        * passlib[bcrypt] 또는 bcrypt 라이브러리로 password_hash 생성
--        * INSERT INTO kanban_v2.hospitals (id, name, email, password_hash, is_admin, is_active)
--          VALUES ('admin', 'Admin', '<admin_email>', '<bcrypt_hash>', true, true);
--    - 이 SQL 파일에는 평문 비밀번호/해시를 포함하지 않음 (보안)
--
-- 4. v0.1.0 (kanban schema)와 분리:
--    - 기존 kanban schema는 그대로 유지 (production 무영향)
--    - v0.2.0 backend는 kanban_v2 schema만 참조
--
-- 5. 롤백 (필요 시):
--    - DROP SCHEMA kanban_v2 CASCADE;
--    - 주의: 데이터 영구 삭제, 운영 환경에서는 백업 후 실행
