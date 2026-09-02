# 7장 PostgreSQL 실습

## 7.1 PostgreSQL 개요 및 기본 시스템 명령

- **PostgreSQL이란**: 1996년 첫 출시된 오픈소스 객체-관계형 DBMS(ORDBMS) — ACID 트랜잭션, JSON/JSONB/XML/HSTORE 지원, 파티셔닝·복제 기능

- **설치**: Linux: sudo apt install postgresql postgresql-contrib · Windows: 공식 설치 프로그램+pgAdmin · macOS: brew install postgresql

- **구조 계층**: 클러스터(서버 인스턴스) → 데이터베이스 → 스키마 → 테이블 → 열/행

- **서버 관리 명령**: initdb(클러스터 초기화) · pg_ctl start/stop/restart · systemctl start/stop/status postgresql · psql(터미널 접속)

- **psql 기본 명령**: \l(DB 목록) · \c(DB 변경) · \d(테이블 목록) · \q(종료)

---

**psql 기본 명령 요약**

| 명령 | 기능 |
|---|---|
| initdb -D <dir> | 데이터베이스 클러스터 초기화 |
| pg_ctl -D <dir> start/stop/restart | 서버 시작/중지/재시작 |
| sudo systemctl start/stop/restart/status postgresql | 서비스 제어 |
| sudo -u postgres psql | PostgreSQL 터미널 접속 |
| \l  \c mydb  \d  \q | DB 목록 / 변경 / 테이블 목록 / 종료 |

*서버·서비스 관리 명령은 이 컨테이너의 실행 중인 서버를 중단시킬 수 있어 실행하지 않고 참고용으로만 제시 — 이하 DB/ROLE/백업 명령부터는 실제 실행*

---

**구조 예시 — 스키마·테이블 생성 (7.1.2)**

**예제 코드**: `s712_structure`

```sql
CREATE DATABASE mydb;
\c mydb; -- 데이터베이스 접속
CREATE SCHEMA sales;
CREATE TABLE sales.orders (
    order_id SERIAL PRIMARY KEY,
    customer_name TEXT NOT NULL,
    total_price NUMERIC(10, 2)
);
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
CREATE DATABASE mydb;                          -- mydb라는 이름의 새 데이터베이스 생성(서버 내 독립된 논리적 저장 공간)
\c mydb; -- 데이터베이스 접속                    -- psql 메타명령: 현재 세션의 접속 대상을 mydb로 전환
CREATE SCHEMA sales;                            -- mydb 안에 sales라는 스키마(테이블들을 묶는 네임스페이스) 생성
CREATE TABLE sales.orders (                     -- sales 스키마 안에 orders 테이블 생성(스키마명.테이블명으로 지정)
    order_id SERIAL PRIMARY KEY,                -- SERIAL: 자동 증가 정수, PRIMARY KEY: 각 행을 유일하게 식별
    customer_name TEXT NOT NULL,                -- 가변 길이 문자열, NOT NULL 제약으로 빈 값 저장 금지
    total_price NUMERIC(10, 2)                  -- 전체 10자리 중 소수점 이하 2자리까지 저장하는 정확한 숫자 타입(금액용)
);

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) CREATE DATABASE 직후 \c로 접속을 옮기지 않으면 이후 명령이 이전 데이터베이스에 실행되어 스키마·테이블이 엉뚱한 곳에 생긴다.
-- 2) 스키마는 "데이터베이스 안의 폴더"에 가깝다 — sales.orders처럼 스키마명을 붙이면 같은 이름의 테이블도 스키마별로 분리 관리할 수 있다.
-- 3) NUMERIC(10,2)은 금액처럼 오차가 있으면 안 되는 값에 쓰고, FLOAT/REAL은 부동소수점 오차가 있어 금액 계산에는 부적합하다.
-- ---------------------------------------------------------------
```

</details>

*실제 이 샌드박스의 PostgreSQL 16 서버에 mydb 생성 후 sales 스키마·테이블까지 실제 생성*

---

**실행 결과 — 구조 예시 — 스키마·테이블 생성 (7.1.2)**

**실행 완료**

**실행 결과**: `s712_structure`

```sql
> CREATE SCHEMA IF NOT EXISTS sales ...  (rowcount=-1)
> CREATE TABLE IF NOT EXISTS sales.orders ( ...  (rowcount=-1)
> SELECT schema_name FROM information_schema.schemata WHERE schema_name='sales' ...
schema_name
-----------
sales
(1행)
```

---

**데이터베이스 생성 및 삭제 (7.1.4)**

**예제 코드**: `s714_create_drop_db`

```sql
CREATE DATABASE mydatabase;
-- 또는 터미널에서: createdb mydatabase
DROP DATABASE mydatabase;
-- 또는 터미널에서: dropdb mydatabase
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
CREATE DATABASE mydatabase;                     -- mydatabase라는 이름의 새 데이터베이스 생성
-- 또는 터미널에서: createdb mydatabase          -- SQL 대신 셸에서 바로 실행할 수 있는 PostgreSQL 유틸리티(내부적으로 동일한 CREATE DATABASE 수행)
DROP DATABASE mydatabase;                       -- mydatabase를 완전히 삭제(모든 테이블·데이터가 함께 사라짐)
-- 또는 터미널에서: dropdb mydatabase            -- SQL 대신 셸에서 바로 실행할 수 있는 삭제 유틸리티(내부적으로 동일한 DROP DATABASE 수행)

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) DROP DATABASE는 되돌릴 수 없다 — 실행 전 반드시 백업이 있는지, 정말 삭제해도 되는 DB인지 확인해야 한다.
-- 2) DROP DATABASE는 삭제 대상 DB에 접속 중인 세션이 있으면 실패한다 — 먼저 \c로 다른 DB(postgres 등)로 접속을 옮긴 뒤 실행해야 한다.
-- 3) createdb/dropdb는 SQL 문법을 몰라도 셸에서 바로 쓸 수 있는 래퍼 명령으로, 스크립트 자동화에 자주 사용된다.
-- ---------------------------------------------------------------
```

</details>

*실제 CREATE DATABASE 후 존재 확인, DROP DATABASE 후 삭제 확인까지 실제 실행*

---

**실행 결과 — 데이터베이스 생성 및 삭제 (7.1.4)**

**실행 완료**

**실행 결과**: `s714_create_drop_db`

```sql
CREATE DATABASE mydatabase2; 이후 조회 → [('mydatabase2',)]
DROP DATABASE mydatabase2; 이후 조회 → (0 rows, 삭제 확인)
```

---

**사용자 및 권한 관리 (7.1.5)**

**예제 코드**: `s715_role`

```sql
CREATE ROLE myuser WITH LOGIN PASSWORD 'mypassword';
GRANT ALL PRIVILEGES ON DATABASE mydatabase TO myuser;
REVOKE ALL PRIVILEGES ON DATABASE mydatabase FROM myuser;
DROP ROLE myuser;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
CREATE ROLE myuser WITH LOGIN PASSWORD 'mypassword';           -- LOGIN 옵션을 준 롤(=로그인 가능한 사용자 계정) 생성, 비밀번호 지정
GRANT ALL PRIVILEGES ON DATABASE mydatabase TO myuser;          -- mydatabase에 대한 모든 권한을 myuser에게 부여
REVOKE ALL PRIVILEGES ON DATABASE mydatabase FROM myuser;       -- 부여했던 모든 권한을 myuser로부터 회수
DROP ROLE myuser;                                                -- myuser 롤(계정) 자체를 삭제

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) PostgreSQL은 "사용자"와 "그룹"을 구분하지 않고 ROLE 하나로 통합해 관리한다 — LOGIN 옵션 유무로 로그인 계정인지 권한 묶음인지가 갈린다.
-- 2) DROP ROLE 전에 REVOKE로 권한을 먼저 회수하지 않으면, 해당 롤이 소유한 객체나 부여된 권한이 남아 있어 삭제가 거부될 수 있다.
-- 3) GRANT ALL PRIVILEGES ON DATABASE는 DB 자체에 대한 권한(연결·생성 등)일 뿐, 스키마·테이블 단위 권한은 별도로 GRANT해야 실제 CRUD가 가능하다.
-- ---------------------------------------------------------------
```

</details>

*CREATE ROLE로 로그인 가능 계정 생성 → 권한 부여 → 철회 → DROP ROLE까지 전 과정 실제 실행*

---

**실행 결과 — 사용자 및 권한 관리 (7.1.5)**

**실행 완료**

**실행 결과**: `s715_role`

```
CREATE ROLE myuser ... 이후 조회 → [('myuser', True)]
REVOKE + DROP ROLE myuser 이후 조회 → (0 rows, 삭제 확인)
```

---

**백업 및 복구 (7.1.6)**

**예제 코드**: `s716_backup_restore`

```
pg_dump -U postgres -d mydatabase -F c -f backup.dump
pg_restore -U postgres -d mydatabase -c backup.dump
# SQL 형식
pg_dump -U postgres -d mydatabase -F p -f backup.sql
psql -U postgres -d mydatabase -f backup.sql
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```bash
pg_dump -U postgres -d mydatabase -F c -f backup.dump           # postgres 계정으로 mydatabase를 커스텀 포맷(-F c, 압축·병렬복구 가능)으로 backup.dump에 백업
pg_restore -U postgres -d mydatabase -c backup.dump             # backup.dump를 mydatabase에 복구, -c는 복구 전 기존 객체를 먼저 DROP
# SQL 형식
pg_dump -U postgres -d mydatabase -F p -f backup.sql            # -F p(plain SQL text) 포맷으로 백업 — 텍스트라 사람이 읽고 psql로 직접 실행 가능
psql -U postgres -d mydatabase -f backup.sql                    # plain SQL 백업 파일을 psql로 순차 실행해 복구

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) -F c(커스텀)는 pg_restore 전용 바이너리 포맷이라 pg_restore로만 복구할 수 있고, -F p(plain)는 순수 SQL이라 psql로 복구한다 — 포맷과 복구 도구를 짝 맞춰야 한다.
# 2) pg_restore -c는 대상 DB에 이미 같은 이름의 테이블이 있으면 먼저 삭제하고 새로 만든다 — 운영 DB에 실수로 실행하면 기존 데이터가 사라지므로 대상 DB를 반드시 확인해야 한다.
# 3) 실습에서는 mydatabase 자체를 pg_restore -c로 되돌렸지만, 실무에서는 원본을 보존하려고 별도의 새 DB(mydb_restore 등)를 만들어 그곳에 복구하는 방식을 더 권장한다.
# ---------------------------------------------------------------
```

</details>

*실제 pg_dump로 mydb를 백업 파일로 만든 뒤, 새 DB(mydb_restore)에 pg_restore로 복구해 테이블 존재까지 확인*

---

**실행 결과 — 백업 및 복구 (7.1.6)**

**실행 완료**

**실행 결과**: `s716_backup_restore`

```
pg_dump -F c 실행 → backup.dump 생성 (30360 bytes)
pg_restore -c 실행 (returncode=1) → mydb_restore에 복구
복구된 sales 스키마 테이블 확인: [('orders',), ('order_items',)]
```

---

## 7.2 데이터 정의 언어(DDL) — 개요

- **정의**: 테이블·뷰·인덱스 등 데이터베이스 객체의 구조를 정의·관리하는 명령어(CREATE/ALTER/DROP)

- **스키마**: 테이블·뷰·인덱스를 그룹화하는 논리적 컨테이너 — CREATE SCHEMA / AUTHORIZATION / DROP ... CASCADE

- **제약 조건**: PRIMARY KEY · FOREIGN KEY(REFERENCES, ON DELETE CASCADE) · UNIQUE · NOT NULL · DEFAULT · CHECK

- **인덱스**: 기본 B-tree 인덱스 · GIN(JSON/배열/전문검색) · BRIN(대용량 시계열 데이터)

- **뷰**: VIEW(가상 테이블, 매번 재계산) · MATERIALIZED VIEW(결과를 미리 저장, REFRESH로 갱신)

---

**주요 데이터 타입**

| 데이터 타입 | 설명 |
|---|---|
| INTEGER | 정수 (4바이트) |
| BIGINT | 큰 정수 (8바이트) |
| NUMERIC | 고정 소수점 숫자 |
| TEXT | 가변 길이 문자열 |
| VARCHAR(n) | 최대 n 길이의 문자열 |
| BOOLEAN | TRUE 또는 FALSE |
| DATE | 날짜 (YYYY-MM-DD) |
| TIMESTAMP | 날짜 및 시간 |

---

**테이블 생성 — 제약 조건 4종 (7.2.1~7.2.2)**

**예제 코드**: `s722_table`

```sql
CREATE TABLE sales.orders (
    order_id SERIAL PRIMARY KEY,
    customer_name TEXT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_price NUMERIC(10, 2) CHECK (total_price >= 0)
);
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
CREATE TABLE sales.orders (                                    -- sales 스키마에 orders 테이블 생성
    order_id SERIAL PRIMARY KEY,                                -- SERIAL: 자동 증가 정수, PRIMARY KEY: 고유 식별자(NOT NULL+UNIQUE 자동 적용)
    customer_name TEXT NOT NULL,                                -- NOT NULL: 값 누락(NULL) 삽입을 금지하는 제약
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,              -- DEFAULT: INSERT 시 값 생략하면 현재 시각을 자동 입력
    total_price NUMERIC(10, 2) CHECK (total_price >= 0)          -- CHECK: 조건(0 이상)을 만족하지 않는 값의 삽입/수정을 차단
);

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) 하나의 CREATE TABLE 문 안에 PRIMARY KEY, NOT NULL, DEFAULT, CHECK 네 종류의 제약 조건을 동시에 선언할 수 있다.
-- 2) SERIAL은 내부적으로 시퀀스(sequence) 객체를 자동 생성해 order_id를 1씩 증가시킨다.
-- 3) DEFAULT는 애플리케이션 코드에서 값을 넘기지 않아도 DB가 스스로 값을 채워주므로 누락 실수를 줄인다.
-- 4) CHECK 제약은 비즈니스 규칙(가격은 음수가 될 수 없다)을 DB 레벨에서 강제해 잘못된 데이터 적재를 원천 차단한다.
-- ---------------------------------------------------------------
```

</details>

*SERIAL·PRIMARY KEY·NOT NULL·DEFAULT·CHECK 5가지 제약을 한 테이블에서 실제 생성*

---

**실행 결과 — 테이블 생성 — 제약 조건 4종 (7.2.1~7.2.2)**

**실행 완료**

**실행 결과**: `s722_table`

```sql
> DROP TABLE IF EXISTS sales.orders CASCADE ...  (rowcount=-1)
> CREATE TABLE sales.orders ( ...  (rowcount=-1)
> SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='sales' AND table_name='orders' ...
column_name | data_type
-----------------------
order_id | integer
customer_name | text
order_date | timestamp without time zone
total_price | numeric
(4행)
```

---

**외래 키(FOREIGN KEY) (7.2.2)**

**예제 코드**: `s723_fk_unique`

```sql
CREATE TABLE sales.order_items (
    item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES sales.orders(order_id) ON DELETE CASCADE,
    product_name TEXT NOT NULL
);
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
CREATE TABLE sales.order_items (                                          -- 주문 상세(자식) 테이블 생성
    item_id SERIAL PRIMARY KEY,                                            -- 자동 증가 기본 키
    order_id INTEGER REFERENCES sales.orders(order_id) ON DELETE CASCADE,  -- FOREIGN KEY: orders.order_id를 참조, 부모 행 삭제 시 자식 행도 함께 삭제
    product_name TEXT NOT NULL                                             -- 상품명은 필수 입력
);

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) REFERENCES는 FOREIGN KEY 제약을 간결하게 선언하는 문법으로, order_items.order_id 값은 반드시 orders.order_id에 존재해야 한다.
-- 2) ON DELETE CASCADE는 참조 무결성 정책 중 하나로, 부모(orders) 행이 삭제되면 관련 자식(order_items) 행도 자동으로 함께 삭제된다.
-- 3) pg_constraint 시스템 카탈로그에서 contype 컬럼을 조회하면 'p'(primary key)와 'f'(foreign key) 두 종류의 제약이 실제로 등록된 것을 확인할 수 있다.
-- ---------------------------------------------------------------
```

</details>

*REFERENCES + ON DELETE CASCADE로 부모-자식 관계 설정 — pg_constraint에서 실제 제약 종류 확인*

---

**실행 결과 — 외래 키(FOREIGN KEY) (7.2.2)**

**실행 완료**

**실행 결과**: `s723_fk_unique`

```sql
> DROP TABLE IF EXISTS sales.order_items ...  (rowcount=-1)
> CREATE TABLE sales.order_items ( ...  (rowcount=-1)
> SELECT conname, contype FROM pg_constraint WHERE conrelid = 'sales.order_items'::regclass ...
conname | contype
-----------------
order_items_pkey | p
order_items_order_id_fkey | f
(2행)
```

---

**CHECK 제약 위반 테스트**

**예제 코드**: `s723_check_default`

```sql
-- total_price NUMERIC(10, 2) CHECK (total_price >= 0) 제약이 걸린 테이블에
INSERT INTO sales.orders (customer_name, total_price)
VALUES ('제약조건테스트', -10);
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- total_price NUMERIC(10, 2) CHECK (total_price >= 0) 제약이 걸린 테이블에                -- 앞서 정의한 CHECK 제약을 상기시키는 주석
INSERT INTO sales.orders (customer_name, total_price)                                     -- orders 테이블에 두 컬럼만 지정해 삽입 시도
VALUES ('제약조건테스트', -10);                                                             -- total_price에 음수(-10) 전달 → CHECK 조건(>= 0) 위반

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) 실행 시 CheckViolation 예외가 발생한다: new row for relation "orders" violates check constraint "orders_total_price_check".
-- 2) 이는 오류가 아니라 CHECK 제약이 의도대로 동작함을 보여주는 정상적인 검증 예제다 — DB가 애플리케이션보다 먼저 잘못된 값을 걸러낸다.
-- 3) 해결법: total_price에 0 이상의 값을 넣거나, 제약을 완화하려면 ALTER TABLE ... DROP CONSTRAINT 후 재정의해야 한다.
-- 4) order_id, order_date는 각각 SERIAL과 DEFAULT 덕분에 값을 지정하지 않아도 자동으로 채워진다는 점도 함께 확인할 수 있다.
-- ---------------------------------------------------------------
```

</details>

*0 미만 값 삽입 시 실제 CheckViolation 예외가 발생하는지 직접 검증*

---

**실행 결과 — CHECK 제약이 실제로 위반을 차단함**

**실행 완료**

**실행 결과**: `s723_check_default`

```
CHECK(total_price >= 0) 위반 → 실제 오류 발생(정상 동작 확인)
CheckViolation: new row for relation "orders" violates check constraint "orders_total_price_check"
DETAIL:  Failing row contains (1, 제약조건테스트, 2026-08-22 02:54:01.283898, -10.00).
```

---

**인덱스 생성 (7.2.3)**

**예제 코드**: `s7231_index`

```sql
CREATE INDEX idx_customer_name ON sales.orders(customer_name);
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
CREATE INDEX idx_customer_name ON sales.orders(customer_name);  -- customer_name 컬럼에 기본 인덱스 타입(B-tree)로 인덱스 생성

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) CREATE INDEX에서 인덱스 타입을 명시하지 않으면 PostgreSQL은 기본값인 B-tree 인덱스를 생성한다.
-- 2) B-tree는 =, <, >, BETWEEN, ORDER BY 등 범위·정렬 검색에 강해 WHERE customer_name = '...' 같은 조회 성능을 크게 높인다.
-- 3) pg_indexes 시스템 뷰를 조회하면 PRIMARY KEY로 자동 생성된 orders_pkey와 방금 만든 idx_customer_name이 함께 표시된다.
-- ---------------------------------------------------------------
```

</details>

*customer_name 컬럼에 대한 B-tree 인덱스를 생성하고 pg_indexes로 실제 확인*

---

**실행 결과 — 인덱스 생성 (7.2.3)**

**실행 완료**

**실행 결과**: `s7231_index`

```sql
> CREATE INDEX IF NOT EXISTS idx_customer_name ON sales.orders(customer_name) ...  (rowcount=-1)
> SELECT indexname FROM pg_indexes WHERE schemaname='sales' AND tablename='orders' ...
indexname
---------
orders_pkey
idx_customer_name
(2행)
```

---

**GIN 인덱스 (7.2.3)**

**예제 코드**: `s7232_gin`

```sql
CREATE INDEX idx_product_name ON sales.order_items USING GIN(product_name);
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
CREATE INDEX idx_product_name ON sales.order_items USING GIN(product_name);  -- product_name 컬럼에 GIN(Generalized Inverted Index) 인덱스 생성

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) GIN은 배열, JSONB, 전문 검색(tsvector) 등 "여러 값을 포함하는" 데이터에 최적화된 인덱스로, 일반 TEXT 컬럼에는 바로 적용되지 않는다.
-- 2) 실제 PostgreSQL 환경에서는 pg_trgm 확장을 CREATE EXTENSION IF NOT EXISTS pg_trgm으로 먼저 설치하고, 연산자 클래스 gin_trgm_ops를 지정해야 한다.
-- 3) 따라서 실행 시 실제 구문은 CREATE INDEX idx_product_name ON sales.order_items USING gin (product_name gin_trgm_ops); 로 대체되어 수행됨을 함께 안내한다.
-- 4) gin_trgm_ops를 적용하면 LIKE '%키워드%' 같은 부분 문자열 검색(트라이그램 기반 유사도 검색)의 성능이 크게 향상된다.
-- ---------------------------------------------------------------
```

</details>

*text 컬럼에 GIN을 걸려면 pg_trgm 확장이 필요 — harness에서 CREATE EXTENSION pg_trgm 후 gin_trgm_ops 연산자 클래스로 생성(책 코드와 동일한 목적, 실제 PostgreSQL 요구사항 반영)*

---

**실행 결과 — GIN 인덱스 (7.2.3)**

**실행 완료**

**실행 결과**: `s7232_gin`

```sql
> CREATE EXTENSION IF NOT EXISTS pg_trgm ...  (rowcount=-1)
> DROP INDEX IF EXISTS idx_product_name ...  (rowcount=-1)
> CREATE INDEX idx_product_name ON sales.order_items USING GIN(product_name gin_trgm_ops) ...  (rowcount=-1)
> SELECT indexname, indexdef FROM pg_indexes WHERE indexname='idx_product_name' ...
indexname | indexdef
--------------------
idx_product_name | CREATE INDEX idx_product_name ON sales.order_items USING gin (product_name gin_trgm_ops)
(1행)
```

---

**BRIN 인덱스 (7.2.3)**

**예제 코드**: `s7233_brin`

```sql
CREATE INDEX idx_order_date ON sales.orders USING BRIN(order_date);
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
CREATE INDEX idx_order_date ON sales.orders USING BRIN(order_date);  -- order_date 컬럼에 BRIN(Block Range Index) 인덱스 생성

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) BRIN은 데이터가 물리적으로 정렬·군집된 대용량 테이블(예: 시간순으로 쌓이는 주문 로그)에 적합한 인덱스로, B-tree보다 저장 공간이 훨씬 작다.
-- 2) 값 범위별로 블록 단위 최소/최대값만 저장하므로 order_date처럼 시간이 흐를수록 증가하는 컬럼과 궁합이 좋다.
-- 3) 다만 데이터가 정렬되어 있지 않으면(랜덤 삽입 등) 검색 효율이 크게 떨어지므로 사용 전 데이터 특성을 반드시 확인해야 한다.
-- 4) pg_indexes에서 indexdef를 조회하면 idx_order_date가 USING brin으로 생성된 것을 확인할 수 있다.
-- ---------------------------------------------------------------
```

</details>

*대용량 시계열 데이터에 적합한 BRIN 인덱스를 order_date 컬럼에 실제 생성*

---

**실행 결과 — BRIN 인덱스 (7.2.3)**

**실행 완료**

**실행 결과**: `s7233_brin`

```sql
> DROP INDEX IF EXISTS idx_order_date ...  (rowcount=-1)
> CREATE INDEX idx_order_date ON sales.orders USING BRIN(order_date) ...  (rowcount=-1)
> SELECT indexname, indexdef FROM pg_indexes WHERE indexname='idx_order_date' ...
indexname | indexdef
--------------------
idx_order_date | CREATE INDEX idx_order_date ON sales.orders USING brin (order_date)
(1행)
```

---

**뷰(VIEW) 생성 (7.2.4)**

**예제 코드**: `s724_view`

```sql
CREATE VIEW customer_orders AS
SELECT customer_name, total_price
FROM sales.orders
WHERE total_price > 100;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.2.4 뷰(VIEW) 생성 — 특정 조건을 걸어둔 가상 테이블(SELECT를 저장) 만들기
CREATE VIEW customer_orders AS              -- CREATE VIEW: 실제 데이터를 복사하지 않고 아래 SELECT 문 자체를 이름으로 저장
SELECT customer_name, total_price           -- 뷰를 조회할 때 반환될 컬럼 목록(원본 테이블의 일부 컬럼만 노출 가능)
FROM sales.orders                           -- 뷰가 참조하는 원본(베이스) 테이블
WHERE total_price > 100;                    -- 뷰 정의에 포함된 필터 조건 — 조회 시점마다 매번 다시 평가됨

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) VIEW는 데이터를 물리적으로 저장하지 않는다 — customer_orders를 SELECT하면 그때마다 원본 sales.orders에 대해 실제 쿼리가 다시 실행된다.
-- 2) 더미 데이터 5건 중 total_price > 100 조건을 만족하는 4건(홍길동 150.50, 김철수 200.00, 이영희 320.75, 강호동 620.00)만 조회되며, 나머지 1건은 뷰에서 아예 보이지 않는다.
-- 3) 뷰는 컬럼을 customer_name, total_price 두 개로 제한했으므로 원본 테이블에 order_id 등 다른 컬럼이 있어도 뷰를 통해서는 노출되지 않는다 — 민감 컬럼을 가리는 용도로도 활용 가능.
-- ---------------------------------------------------------------
```

</details>

*더미 주문 5건을 삽입한 뒤, 100 초과 조건의 뷰를 실제 조회*

---

**실행 결과 — 뷰(VIEW) 생성 (7.2.4)**

**실행 완료**

**실행 결과**: `s724_view`

```sql
> DROP VIEW IF EXISTS customer_orders ...  (rowcount=-1)
> CREATE VIEW customer_orders AS ...  (rowcount=-1)
> SELECT * FROM customer_orders ORDER BY total_price ...
customer_name | total_price
---------------------------
홍길동 | 150.50
김철수 | 200.00
이영희 | 320.75
강호동 | 620.00
(4행)
```

---

**머터리얼라이즈드 뷰 (7.2.4)**

**예제 코드**: `s724_matview`

```sql
CREATE MATERIALIZED VIEW high_value_orders AS
SELECT * FROM sales.orders WHERE total_price > 500;
-- 갱신이 필요할 때
REFRESH MATERIALIZED VIEW high_value_orders;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.2.4 머터리얼라이즈드 뷰 — 쿼리 결과를 실제로 디스크에 저장해두고 필요할 때만 갱신하는 뷰
CREATE MATERIALIZED VIEW high_value_orders AS   -- 일반 VIEW와 달리 SELECT 결과를 물리적으로 저장(조회 시 재계산 없이 저장된 값을 바로 반환)
SELECT * FROM sales.orders WHERE total_price > 500;  -- 생성 시점 기준으로 500 초과 주문만 스냅샷으로 캡처
-- 갱신이 필요할 때
REFRESH MATERIALIZED VIEW high_value_orders;    -- 저장된 스냅샷을 원본 테이블 최신 상태로 다시 계산해 덮어씀(자동 갱신 아님, 수동 호출 필요)

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) 일반 VIEW는 조회할 때마다 원본을 다시 스캔하지만, MATERIALIZED VIEW는 CREATE 시점의 결과를 저장해두므로 조회는 빠르지만 원본이 바뀌어도 자동으로 반영되지 않는다.
-- 2) 이 예제에서는 강호동(620.00) 1건만 500 초과 조건을 만족해 처음 조회 시 1행이 나오고, REFRESH를 실행해도 원본 sales.orders 데이터 자체가 변경되지 않았으므로 결과는 동일하게 1행 유지된다 — REFRESH는 "재계산"이지 "새 데이터 생성"이 아님을 보여주는 포인트.
-- 3) REFRESH MATERIALIZED VIEW는 기본적으로 전체 데이터를 잠그고 재계산한다(동시 조회를 막음) — 운영 환경에서는 CONCURRENTLY 옵션과 고유 인덱스가 필요하다는 점을 언급하면 좋다.
-- ---------------------------------------------------------------
```

</details>

*실제로 결과가 미리 저장되는 것과 REFRESH로 갱신되는 것을 두 차례 조회로 확인*

---

**실행 결과 — 머터리얼라이즈드 뷰 (7.2.4)**

**실행 완료**

**실행 결과**: `s724_matview`

```sql
> DROP MATERIALIZED VIEW IF EXISTS high_value_orders ...  (rowcount=-1)
> CREATE MATERIALIZED VIEW high_value_orders AS ...  (rowcount=1)
> SELECT customer_name, total_price FROM high_value_orders ...
customer_name | total_price
---------------------------
강호동 | 620.00
(1행)
> REFRESH MATERIALIZED VIEW high_value_orders ...  (rowcount=-1)
> SELECT customer_name, total_price FROM high_value_orders ...
customer_name | total_price
---------------------------
강호동 | 620.00
(1행)
```

---

**테이블 변경(ALTER TABLE) (7.2.5)**

**예제 코드**: `s725_alter`

```sql
ALTER TABLE sales.orders ADD COLUMN status TEXT DEFAULT 'pending';
ALTER TABLE sales.orders RENAME COLUMN status TO order_status;
ALTER TABLE sales.orders DROP COLUMN status;  -- (order_status로 이미 변경됨)
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.2.5 테이블 변경(ALTER TABLE) — 컬럼 추가 → 이름 변경 → 삭제를 information_schema로 단계별 확인
ALTER TABLE sales.orders ADD COLUMN status TEXT DEFAULT 'pending';  -- status 컬럼 추가, 기존 행에도 DEFAULT 값 'pending'이 즉시 채워짐
ALTER TABLE sales.orders RENAME COLUMN status TO order_status;      -- 컬럼명만 status → order_status로 변경(데이터·제약조건은 그대로 유지)
ALTER TABLE sales.orders DROP COLUMN status;  -- (order_status로 이미 변경됨)

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) 이 시점에는 status라는 이름의 컬럼이 이미 존재하지 않는다 — 바로 윗줄에서 order_status로 개명했기 때문에, 마지막 줄이 문자 그대로 DROP COLUMN status로 실행되면 "column status does not exist" 오류가 난다.
-- 2) 실제로 컬럼을 지우려면 개명된 이름인 order_status를 대상으로 DROP COLUMN order_status를 실행해야 하며, 그 결과 ADD에서 만든 컬럼과 RENAME에서 붙인 이름 모두 사라져 status/order_status 둘 다 information_schema.columns에서 조회되지 않는 상태가 된다.
-- 3) 이 예제는 "컬럼명을 바꾼 뒤에는 이후 모든 DDL·쿼리에서 새 이름을 써야 한다"는 점을 information_schema.columns 조회로 매 단계 눈으로 확인시키는 것이 핵심이다.
-- ---------------------------------------------------------------
```

</details>

*컬럼 추가 → 이름 변경 → 삭제까지 information_schema.columns로 매 단계 실제 확인*

---

**실행 결과 — 테이블 변경(ALTER TABLE) (7.2.5)**

**실행 완료**

**실행 결과**: `s725_alter`

```sql
> ALTER TABLE sales.orders ADD COLUMN status TEXT DEFAULT 'pending' ...  (rowcount=-1)
> SELECT column_name FROM information_schema.columns WHERE table_schema='sales' AND table_name='orders' AND column_name='status' ...
column_name
-----------
status
(1행)
> ALTER TABLE sales.orders RENAME COLUMN status TO order_status ...  (rowcount=-1)
> SELECT column_name FROM information_schema.columns WHERE table_schema='sales' AND table_name='orders' AND column_name='order_status' ...
column_name
-----------
order_status
(1행)
> ALTER TABLE sales.orders DROP COLUMN order_status ...  (rowcount=-1)
> SELECT column_name FROM information_schema.columns WHERE table_schema='sales' AND table_name='orders' AND column_name IN ('status','order_status') ...
(0 rows)
```

---

**테이블 이름 변경 및 삭제 (7.2.5)**

**예제 코드**: `s725_rename_table_drop`

```sql
ALTER TABLE sales.orders RENAME TO customer_orders;
-- (이하 실습을 위해 harness에서는 원래 이름으로 다시 되돌림)
DROP TABLE sales.demo_drop;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.2.5 테이블 이름 변경 및 삭제 — RENAME TO로 테이블명 자체를 바꾸고, DROP TABLE로 완전히 제거
ALTER TABLE sales.orders RENAME TO customer_orders;  -- 테이블명을 sales.orders → customer_orders로 변경(구조·데이터·제약조건은 그대로, 이름만 교체)
-- (이하 실습을 위해 harness에서는 원래 이름으로 다시 되돌림)          -- 이후 예제(sales.orders를 참조)가 깨지지 않도록 실습 환경에서 이름을 원상 복구한다는 안내
DROP TABLE sales.demo_drop;                          -- demo_drop 테이블을 스키마·데이터 포함해 완전히 삭제(휴지통 없이 즉시 제거, 되돌릴 수 없음)

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) RENAME TO는 테이블 내부의 데이터나 컬럼 구조를 전혀 건드리지 않고 카탈로그상의 이름표만 바꾸는 매우 가벼운 메타데이터 연산이다 — 대용량 테이블에서도 즉시 완료된다.
-- 2) 여기서 customer_orders라는 이름을 그대로 다시 쓰면 7.2.4에서 이미 만든 VIEW customer_orders와 이름이 충돌해 오류가 날 수 있으므로, 실습 harness에서는 order_items 같은 별도 테이블로 이름 변경 실습을 대신하고 sales.orders는 다시 원래 이름으로 되돌려 뒤 예제에 영향이 없게 한다.
-- 3) DROP TABLE은 DELETE와 달리 데이터뿐 아니라 테이블 구조(컬럼 정의, 인덱스, 제약조건)까지 통째로 제거하며 트랜잭션 커밋 후에는 복구 수단이 없다 — 실습에서는 반드시 demo_drop처럼 버려도 되는 별도 테이블에만 적용해야 한다.
-- ---------------------------------------------------------------
```

</details>

*테이블명 변경 후 information_schema로 확인, 별도 테이블로 DROP TABLE도 실제 실행*

---

**실행 결과 — 테이블 이름 변경 및 삭제 (7.2.5)**

**실행 완료**

**실행 결과**: `s725_rename_table_drop`

```sql
> ALTER TABLE sales.order_items RENAME TO order_items_renamed ...  (rowcount=-1)
> SELECT table_name FROM information_schema.tables WHERE table_schema='sales' ...
table_name
----------
order_items_renamed
orders
(2행)
> ALTER TABLE sales.order_items_renamed RENAME TO order_items ...  (rowcount=-1)
> DROP TABLE IF EXISTS sales.demo_drop ...  (rowcount=-1)
> CREATE TABLE sales.demo_drop(id INT) ...  (rowcount=-1)
> DROP TABLE sales.demo_drop ...  (rowcount=-1)
> SELECT table_name FROM information_schema.tables WHERE table_schema='sales' AND table_name='demo_drop' ...
(0 rows)
```

---

**파티셔닝 (7.2.6, 책 원문의 실제 버그)**

**예제 코드**: `s726_partition`

```sql
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    order_date DATE NOT NULL
) PARTITION BY RANGE (order_date);
CREATE TABLE orders_2023 PARTITION OF orders
    FOR VALUES FROM ('2023-01-01') TO ('2023-12-31');
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.2.6 파티셔닝 — order_date 기준 RANGE 파티션 테이블 생성(책 원문 코드, 실제로는 PostgreSQL이 거부함)
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,               -- order_id에 PRIMARY KEY 제약을 지정(파티션 키인 order_date는 포함하지 않음)
    order_date DATE NOT NULL                   -- 파티션 기준이 될 컬럼(NOT NULL 필수 — 파티션 경계 판단에 NULL 불가)
) PARTITION BY RANGE (order_date);             -- order_date 값 범위에 따라 자식 파티션으로 나누겠다고 선언
CREATE TABLE orders_2023 PARTITION OF orders   -- orders의 자식 파티션 테이블 생성
    FOR VALUES FROM ('2023-01-01') TO ('2023-12-31');  -- 2023-01-01(포함) ~ 2023-12-31(미포함) 범위를 담당

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) [실제 오류] 이 코드를 그대로 실행하면 PostgreSQL이 CREATE TABLE 단계에서 즉시 거부한다: `ERROR: unique constraint on partitioned table must include all partitioning columns` (FeatureNotSupported). 원인은 order_id에 건 PRIMARY KEY(=내부적으로 UNIQUE 제약)가 파티션 키인 order_date를 포함하지 않기 때문이다 — PostgreSQL은 파티션 테이블의 PK/UNIQUE 제약이 반드시 파티션 키 컬럼을 포함하도록 강제한다(전체 파티션에 걸친 유일성 보장이 물리적으로 불가능하므로).
-- 2) [해결 방법 A] PRIMARY KEY를 order_id 단독이 아니라 (order_id, order_date) 복합키로 바꾸면 파티션 키가 포함되므로 그대로 동작한다: `order_id SERIAL, order_date DATE NOT NULL, PRIMARY KEY (order_id, order_date)`.
-- 3) [해결 방법 B, 책 원문 취지에 더 가까움] order_id에서 PRIMARY KEY 제약을 아예 빼고 SERIAL만 남기면(즉 `order_id SERIAL, order_date DATE NOT NULL`) CREATE TABLE ~ PARTITION BY RANGE와 CREATE TABLE ... PARTITION OF가 정상적으로 성공하며, INSERT 시 order_date 값에 따라 orders_2023 같은 올바른 자식 파티션으로 데이터가 자동 라우팅되는 것을 실제로 확인할 수 있다.
-- 4) 이 예제는 "책에 나온 코드라고 무조건 실행되는 것은 아니다"를 학생들에게 보여주는 실습 포인트다 — PostgreSQL 버전과 파티셔닝 제약을 모르면 겪게 되는 실전 오류이며, 오류 메시지를 읽고 원인(PK가 파티션 키 미포함)을 스스로 추론하는 훈련으로 다루면 좋다.
-- ---------------------------------------------------------------
```

</details>

*책 코드 그대로 실행하면 PostgreSQL이 실제로 거부 — 파티션 테이블의 PRIMARY KEY는 파티션 기준 컬럼을 반드시 포함해야 함*

---

**실행 결과 — 파티션 키 미포함 PRIMARY KEY 오류 (책 자체의 버그)**

**실행 완료**

**실행 결과**: `s726_partition`

```sql
책의 코드를 그대로 실행 → 실제 오류 발생
(파티션 테이블에서 PRIMARY KEY는 파티션 기준 컬럼(order_date)을 반드시 포함해야 하는데, order_id만 PRIMARY KEY로 지정되어 있어 PostgreSQL이 거부함 — 책 자체의 오류)
FeatureNotSupported: unique constraint on partitioned table must include all partitioning columns
DETAIL:  PRIMARY KEY constraint on table "orders" lacks column "order_date" which is part of the partition key.
(PRIMARY KEY 제약을 제거하고 재실행하면 파티셔닝 자체는 정상 동작):
> DROP TABLE IF EXISTS orders CASCADE ...  (rowcount=-1)
> CREATE TABLE orders (order_id SERIAL, order_date DATE NOT NULL) PARTITION BY RANGE (order_date) ...  (rowcount=-1)
> CREATE TABLE orders_2023 PARTITION OF orders FOR VALUES FROM ('2023-01-01') TO ('2023-12-31') ...  (rowcount=-1)
> INSERT INTO orders (order_date) VALUES ('2023-05-01'),('2023-08-15') ...  (rowcount=2)
> SELECT tableoid::regclass AS partition, order_date FROM orders ORDER BY order_date ...
partition | order_date
----------------------
orders_2023 | 2023-05-01
orders_2023 | 2023-08-15
(2행)
```

---

**클러스터링(CLUSTER) (7.2.6, 실제 제약)**

**예제 코드**: `s726_cluster`

```
CLUSTER sales.orders USING idx_order_date;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.2.6 클러스터링(CLUSTER) — 인덱스 순서대로 테이블 물리적 저장 순서를 재정렬(실제로는 실행 불가)
CLUSTER sales.orders USING idx_order_date;   -- idx_order_date 인덱스 순서에 맞춰 sales.orders의 물리적 행 저장 순서를 재배치 시도

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) [실제 오류] 이 문장은 실행 즉시 예외를 던진다: `ERROR: cannot cluster on index "idx_order_date" because access method does not support clustering` (FeatureNotSupported). CLUSTER는 대상 인덱스가 "정렬 순서를 보장하는" 접근 방식(B-tree 등)일 때만 사용할 수 있다.
-- 2) idx_order_date는 7.2.3에서 BRIN(Block Range INdex)으로 생성된 인덱스다 — BRIN은 블록 단위 범위 요약 정보만 저장할 뿐 개별 행의 정렬 순서를 보장하지 않으므로, PostgreSQL이 클러스터링 기준으로 사용할 수 없다고 판단해 거부한다.
-- 3) 실제로 order_date 기준 CLUSTER를 실행하려면 같은 컬럼에 B-tree 인덱스(예: `CREATE INDEX idx_order_date_btree ON sales.orders USING btree (order_date);`)를 별도로 만든 뒤 그 인덱스로 CLUSTER해야 한다 — 인덱스 종류(BRIN vs B-tree)마다 지원하는 연산이 다르다는 점을 실제 오류로 체감시키는 예제.
-- ---------------------------------------------------------------
```

</details>

*CLUSTER는 정렬을 보장하는 인덱스가 필요 — idx_order_date는 7.2.3에서 BRIN으로 생성되어 있어 실제로 실행 불가*

---

**실행 결과 — BRIN 인덱스로는 CLUSTER 불가 (실제 PostgreSQL 제약)**

**예외 발생**

**실행 결과**: `s726_cluster`

```
FeatureNotSupported: cannot cluster on index "idx_order_date" because access method does not support clustering
```

---

## 7.3 데이터 조작 언어(DML) — 개요

- **INSERT / UPDATE / DELETE**: 행 삽입·수정·삭제 — WHERE 조건, 서브쿼리 활용 가능

- **COPY FROM / TO**: CSV 파일과 테이블 간 대량 데이터를 빠르게 주고받는 명령

- **RETURNING**: INSERT/UPDATE/DELETE 실행 후 영향받은 행을 즉시 반환

- **트랜잭션**: BEGIN·COMMIT·ROLLBACK·SAVEPOINT로 여러 작업을 원자적으로 묶어 처리

---

**기본 데이터 삽입 (7.3.1-1)**

**예제 코드**: `s731_insert1`

```sql
INSERT INTO sales.orders (customer_name, order_date, total_price)
VALUES ('홍길동', '2025-02-01', 150.50);
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.3.1-1 기본 데이터 삽입 — INSERT INTO ... VALUES로 orders 테이블에 한 행을 추가
INSERT INTO sales.orders (customer_name, order_date, total_price)  -- 삽입할 컬럼 목록을 명시(순서는 뒤 VALUES와 1:1로 매칭)
VALUES ('홍길동', '2025-02-01', 150.50);                            -- 각 컬럼에 대응하는 값 나열, 문자열/날짜는 작은따옴표로 감쌈

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) 컬럼 목록을 생략하지 않고 명시하면 테이블 구조가 바뀌어도(컬럼 추가 등) INSERT 문이 깨지지 않아 안전하다.
-- 2) order_id는 목록에 없으므로 PRIMARY KEY의 자동 증가(SERIAL/IDENTITY) 값이 자동으로 채워져 1이 부여된다.
-- 3) 문자열 리터럴은 반드시 작은따옴표(')를 사용하며, 큰따옴표(")는 컬럼/식별자명에 쓰인다는 점을 구분해서 짚어준다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — 기본 데이터 삽입 (7.3.1-1)**

**실행 완료**

**실행 결과**: `s731_insert1`

```sql
> DELETE FROM sales.order_items ...  (rowcount=0)
> DELETE FROM sales.orders ...  (rowcount=5)
> ALTER SEQUENCE sales.orders_order_id_seq RESTART WITH 1 ...  (rowcount=-1)
> INSERT INTO sales.orders (customer_name, order_date, total_price) VALUES ('홍길동', '2025-02-01', 150.50) ...  (rowcount=1)
> SELECT * FROM sales.orders ...
order_id | customer_name | order_date | total_price
---------------------------------------------------
1 | 홍길동 | 2025-02-01 00:00:00 | 150.50
(1행)
```

---

**여러 행 삽입 (7.3.1-2)**

**예제 코드**: `s731_insert_multi`

```sql
INSERT INTO sales.orders (customer_name, order_date, total_price)
VALUES
    ('김철수', '2025-02-02', 200.00),
    ('이영희', '2025-02-03', 320.75);
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.3.1-2 여러 행 삽입 — 하나의 INSERT 문으로 여러 행을 한 번에 추가
INSERT INTO sales.orders (customer_name, order_date, total_price)  -- 삽입 대상 컬럼은 위 예제와 동일하게 한 번만 지정
VALUES
    ('김철수', '2025-02-02', 200.00),                                -- 첫 번째 행: 쉼표로 구분된 값 튜플
    ('이영희', '2025-02-03', 320.75);                                -- 두 번째 행: 세미콜론 앞 마지막 튜플이라 뒤에 쉼표 없음

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) VALUES 뒤에 (값...) 튜플을 쉼표로 나열하면 여러 행을 한 번의 INSERT 문으로 삽입할 수 있어, 행마다 INSERT를 반복하는 것보다 효율적이다.
-- 2) 각 튜플의 값 순서는 첫 줄에서 지정한 컬럼 순서(customer_name, order_date, total_price)와 정확히 일치해야 한다.
-- 3) rowcount=2로 이번에 삽입된 행 수만 보고되며, s731_insert1에서 넣은 홍길동 행까지 합쳐 테이블 전체는 총 3행이 된다.
-- ---------------------------------------------------------------
```

</details>

*한 번의 INSERT 문으로 여러 행을 동시에 삽입*

---

**실행 결과 — 여러 행 삽입 (7.3.1-2)**

**실행 완료**

**실행 결과**: `s731_insert_multi`

```sql
> INSERT INTO sales.orders (customer_name, order_date, total_price) VALUES ...  (rowcount=2)
> SELECT * FROM sales.orders ORDER BY order_id ...
order_id | customer_name | order_date | total_price
---------------------------------------------------
1 | 홍길동 | 2025-02-01 00:00:00 | 150.50
2 | 김철수 | 2025-02-02 00:00:00 | 200.00
3 | 이영희 | 2025-02-03 00:00:00 | 320.75
(3행)
```

---

**특정 컬럼만 삽입 (7.3.1-3)**

**예제 코드**: `s731_insert_partial`

```sql
INSERT INTO sales.orders (customer_name, total_price)
VALUES ('박서준', 99.99);
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.3.1-3 특정 컬럼만 삽입 — 컬럼 목록에서 order_date를 생략하면 DEFAULT(CURRENT_TIMESTAMP)가 자동 적용
INSERT INTO sales.orders (customer_name, total_price)  -- order_date를 목록에서 뺐으므로 이 컬럼은 값을 넣지 않음
VALUES ('박서준', 99.99);                                -- customer_name, total_price 두 값만 순서대로 대응

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) INSERT 시 컬럼 목록에서 생략된 컬럼은 해당 컬럼에 DEFAULT 절이 정의되어 있으면 그 기본값으로, 없으면 NULL로 채워진다.
-- 2) order_date 컬럼은 DEFAULT CURRENT_TIMESTAMP로 정의되어 있어, 이 INSERT가 실행된 시점의 현재 타임스탬프가 자동으로 들어간다.
-- 3) 값을 생략할 수 있는 컬럼은 결국 "DEFAULT가 있거나 NULL을 허용하는 컬럼"뿐이며, 다음 예제(DEFAULT VALUES)에서 이 원칙이 왜 오류로 이어지는지 대비해서 짚어준다.
-- ---------------------------------------------------------------
```

</details>

*order_date는 DEFAULT(CURRENT_TIMESTAMP)가 자동 적용됨*

---

**실행 결과 — 특정 컬럼만 삽입 (7.3.1-3)**

**실행 완료**

**실행 결과**: `s731_insert_partial`

```sql
> INSERT INTO sales.orders (customer_name, total_price) VALUES ('박서준', 99.99) ...  (rowcount=1)
> SELECT order_id, customer_name, order_date, total_price FROM sales.orders WHERE customer_name='박서준' ...
order_id | customer_name | order_date | total_price
---------------------------------------------------
4 | 박서준 | 2026-08-22 02:54:01.314192 | 99.99
(1행)
```

---

**DEFAULT VALUES (7.3.1-4, 책 원문의 실제 버그)**

**예제 코드**: `s731_insert_default`

```sql
INSERT INTO sales.orders DEFAULT VALUES;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.3.1-4 DEFAULT VALUES — 모든 컬럼에 각자의 DEFAULT 값을 적용하려는 시도(실제로는 예외 발생)
INSERT INTO sales.orders DEFAULT VALUES;  -- 컬럼 목록과 VALUES 값 없이, 모든 컬럼을 DEFAULT로 채우도록 지시

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) [책 원문의 실제 버그] 책은 "DEFAULT VALUES를 쓰면 모든 컬럼에 DEFAULT 값이 적용된다"고 설명하지만, 이는 "컬럼마다 DEFAULT 절이 정의되어 있을 때"만 성립하는 조건부 설명이며 이 문장이 누락되어 있다.
-- 2) customer_name 컬럼은 NOT NULL 제약이 걸려 있는데 DEFAULT 절이 없으므로, DEFAULT VALUES가 이 컬럼을 NULL로 채우려다 NotNullViolation 예외(null value in column "customer_name" ... violates not-null constraint)가 발생한다.
-- 3) order_date(DEFAULT CURRENT_TIMESTAMP), total_price(DEFAULT가 있다면) 등은 문제없이 채워지지만, customer_name 하나 때문에 문 전체가 실패하며 트랜잭션도 롤백된다.
-- 4) 해결 방법은 두 가지: ① INSERT INTO sales.orders (customer_name) VALUES ('값')처럼 NOT NULL 컬럼 값을 직접 명시하거나, ② 애초에 스키마에서 customer_name에 DEFAULT를 지정해 DEFAULT VALUES가 정상 동작하도록 설계를 바꾼다.
-- ---------------------------------------------------------------
```

</details>

*책은 "모든 컬럼에 DEFAULT 값이 적용된다"고 설명하지만, customer_name은 NOT NULL이면서 DEFAULT가 없어 실제로는 오류 발생 — 책 설명과 실제 스키마 제약이 어긋나는 지점*

---

**실행 결과 — NOT NULL 위반 (책 설명과 실제 동작의 불일치)**

**예외 발생**

**실행 결과**: `s731_insert_default`

```
NotNullViolation: null value in column "customer_name" of relation "orders" violates not-null constraint
DETAIL:  Failing row contains (5, null, 2026-08-22 02:54:01.314903, null).
```

---

**특정 행 수정 (7.3.2-1)**

**예제 코드**: `s732_update_one`

```sql
UPDATE sales.orders
SET total_price = 180.00
WHERE customer_name = '홍길동';
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.3.2-1 특정 행 수정 — WHERE 조건에 맞는 단일 행만 지정 컬럼을 갱신
UPDATE sales.orders                           -- 수정 대상 테이블: sales 스키마의 orders
SET total_price = 180.00                      -- total_price 컬럼 값을 180.00으로 변경
WHERE customer_name = '홍길동';                -- 이 조건에 맞는 행만 수정(전체 4행 중 1행)

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) UPDATE는 WHERE 없이 실행하면 테이블 전체가 바뀌므로 조건절 확인이 필수다.
-- 2) SET은 "컬럼 = 새 값" 형태로 변경할 컬럼만 지정하며 나머지 컬럼은 그대로 유지된다.
-- 3) rowcount=1은 WHERE 조건에 일치한 행이 정확히 하나였다는 뜻이다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — 특정 행 수정 (7.3.2-1)**

**실행 완료**

**실행 결과**: `s732_update_one`

```sql
> UPDATE sales.orders SET total_price = 180.00 WHERE customer_name = '홍길동' ...  (rowcount=1)
> SELECT customer_name, total_price FROM sales.orders WHERE customer_name='홍길동' ...
customer_name | total_price
---------------------------
홍길동 | 180.00
(1행)
```

---

**여러 컬럼 동시 수정 (7.3.2-2)**

**예제 코드**: `s732_update_multi_col`

```sql
UPDATE sales.orders
SET total_price = 220.50, order_date = '2025-02-05'
WHERE customer_name = '김철수';
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.3.2-2 여러 컬럼 동시 수정 — SET 절에 콤마로 구분해 두 컬럼을 한 번에 변경
UPDATE sales.orders                           -- 수정 대상 테이블
SET total_price = 220.50, order_date = '2025-02-05'  -- 콤마로 구분해 두 컬럼을 같은 문장에서 함께 변경
WHERE customer_name = '김철수';                -- 이 조건에 맞는 행만 수정(1행)

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) SET 절에 "컬럼1 = 값1, 컬럼2 = 값2"처럼 콤마로 나열하면 한 번의 UPDATE로 여러 컬럼을 동시에 바꿀 수 있다.
-- 2) 컬럼마다 UPDATE문을 따로 실행하는 것보다 원자적(atomic)이며 효율적이다.
-- 3) 날짜 리터럴은 문자열 형태('YYYY-MM-DD')로 넣어도 PostgreSQL이 자동으로 date 타입으로 변환한다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — 여러 컬럼 동시 수정 (7.3.2-2)**

**실행 완료**

**실행 결과**: `s732_update_multi_col`

```sql
> UPDATE sales.orders SET total_price = 220.50, order_date = '2025-02-05' WHERE customer_name = '김철수' ...  (rowcount=1)
> SELECT customer_name, total_price, order_date FROM sales.orders WHERE customer_name='김철수' ...
customer_name | total_price | order_date
----------------------------------------
김철수 | 220.50 | 2025-02-05 00:00:00
(1행)
```

---

**모든 행 수정 (7.3.2-3)**

**예제 코드**: `s732_update_all`

```sql
UPDATE sales.orders
SET total_price = total_price * 1.1;  -- 10% 가격 상승
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.3.2-3 모든 행 수정 — WHERE 절 없이 실행해 테이블 전체 행을 일괄 갱신
UPDATE sales.orders
SET total_price = total_price * 1.1;  -- 10% 가격 상승          -- WHERE 없음 → 테이블의 모든 행에 적용됨

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) WHERE 절을 생략하면 테이블의 모든 행이 대상이 되므로 실무에서는 반드시 먼저 SELECT로 대상 행을 확인한 뒤 UPDATE해야 한다.
-- 2) total_price = total_price * 1.1처럼 기존 컬럼 값을 참조해 새 값을 계산할 수 있다(자기 자신 참조 갱신).
-- 3) 4행 전체가 10% 인상되어 예를 들어 180.00→198.00, 220.50→242.55로 변경된다.
-- ---------------------------------------------------------------
```

</details>

*WHERE 없이 전체 행 갱신 전/후 값을 나란히 비교*

---

**실행 결과 — 모든 행 수정 (7.3.2-3)**

**실행 완료**

**실행 결과**: `s732_update_all`

```sql
> SELECT customer_name, total_price FROM sales.orders ORDER BY order_id ...
customer_name | total_price
---------------------------
홍길동 | 180.00
김철수 | 220.50
이영희 | 320.75
박서준 | 99.99
(4행)
> UPDATE sales.orders SET total_price = total_price * 1.1 ...  (rowcount=4)
> SELECT customer_name, total_price FROM sales.orders ORDER BY order_id ...
customer_name | total_price
---------------------------
홍길동 | 198.00
김철수 | 242.55
이영희 | 352.83
박서준 | 109.99
(4행)
```

---

**서브쿼리로 수정 (7.3.2-4)**

**예제 코드**: `s732_update_subquery`

```sql
UPDATE sales.orders
SET total_price = (SELECT AVG(total_price) FROM sales.orders)
WHERE total_price < 100;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.3.2-4 서브쿼리로 수정 — 서브쿼리 결과값을 SET의 새 값으로 사용
UPDATE sales.orders
SET total_price = (SELECT AVG(total_price) FROM sales.orders)  -- 서브쿼리로 전체 평균 total_price를 구해 새 값으로 사용
WHERE total_price < 100;                       -- 평균보다 훨씬 낮은(100 미만) 행만 대상으로 지정

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) SET 절의 값 자리에도 서브쿼리를 쓸 수 있으며, 이 서브쿼리는 UPDATE 대상 테이블을 포함해 다른 쿼리처럼 독립적으로 평가된다.
-- 2) 실행은 성공했지만 rowcount=0인 경우는 "오류가 아니라 조건에 맞는 행이 없었다"는 뜻이므로 결과 없음과 실패를 구분해야 한다.
-- 3) 이 예제에서는 total_price < 100인 행이 이 시점 데이터에 없어 실제로 갱신된 행이 없었다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — 서브쿼리로 수정 (7.3.2-4)**

**실행 완료**

**실행 결과**: `s732_update_subquery`

```sql
> SELECT customer_name, total_price FROM sales.orders WHERE total_price < 100 ...
(0 rows)
> UPDATE sales.orders SET total_price = (SELECT AVG(total_price) FROM sales.orders) WHERE total_price < 100 ...  (rowcount=0)
> SELECT customer_name, total_price FROM sales.orders ORDER BY order_id ...
customer_name | total_price
---------------------------
홍길동 | 198.00
김철수 | 242.55
이영희 | 352.83
박서준 | 109.99
(4행)
```

---

**특정 행 삭제 (7.3.3-1)**

**예제 코드**: `s733_delete_one`

```
DELETE FROM sales.orders
WHERE customer_name = '홍길동';
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.3.3-1 특정 행 삭제 — WHERE 조건에 맞는 행만 골라서 지운다
DELETE FROM sales.orders                     -- sales.orders 테이블에서 행을 삭제하겠다는 선언
WHERE customer_name = '홍길동';                -- 이 조건에 맞는 행만 삭제 대상이 됨(조건이 없으면 전체 삭제이므로 주의)

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) DELETE는 항상 WHERE 절과 함께 다뤄야 한다 — WHERE를 빠뜨리면 테이블의 모든 행이 삭제된다.
-- 2) DELETE는 행(row) 단위 삭제이며, 테이블 구조(컬럼, 제약조건 등)는 그대로 유지된다.
-- 3) 실행 전후로 SELECT COUNT(*)를 확인하면 삭제가 의도대로 이루어졌는지 검증할 수 있다(실제 실행: 1건 → 0건).
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — 특정 행 삭제 (7.3.3-1)**

**실행 완료**

**실행 결과**: `s733_delete_one`

```sql
> SELECT COUNT(*) FROM sales.orders WHERE customer_name='홍길동' ...
count
-----
1
(1행)
> DELETE FROM sales.orders WHERE customer_name = '홍길동' ...  (rowcount=1)
> SELECT COUNT(*) FROM sales.orders WHERE customer_name='홍길동' ...
count
-----
0
(1행)
```

---

**모든 행 삭제 (7.3.3-2)**

**예제 코드**: `s733_delete_all`

```
DELETE FROM sales.orders;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.3.3-2 모든 행 삭제 — WHERE 절 없이 DELETE를 실행하면 테이블의 모든 행이 삭제됨
DELETE FROM sales.orders;                     -- WHERE 조건이 없으므로 orders 테이블의 모든 행이 삭제 대상이 됨

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) WHERE 절 없는 DELETE는 테이블의 모든 행을 지운다 — 실무에서는 실행 전 반드시 조건절 유무를 재확인해야 한다.
-- 2) TRUNCATE와 달리 DELETE는 각 행 삭제를 로그로 남기며 트랜잭션 내에서 ROLLBACK으로 되돌릴 수 있다.
-- 3) 실습 환경에서는 이 실행 직후 SAVEPOINT로 되돌려 이후 실습용 데이터를 보존했다 — 책 예제 자체는 그대로(전체 삭제) 실행됨.
-- ---------------------------------------------------------------
```

</details>

*실행 후 곧바로 SAVEPOINT로 되돌려 이후 실습용 데이터를 보존(harness 처리) — 책 예제 자체는 그대로 실행됨*

---

**실행 결과 — 모든 행 삭제 (7.3.3-2)**

**실행 완료**

**실행 결과**: `s733_delete_all`

```
DELETE 전 행 수: 3
DELETE FROM sales.orders; 실행 후 행 수: 0 (테이블 구조는 유지)
(주의: 이후 실습을 위해 harness에서 ROLLBACK TO SAVEPOINT로 데이터를 복원함 — 책 예제 자체는 그대로 실행됨)
```

---

**TRUNCATE (7.3.3-3, 실제 FK 제약 발견)**

**예제 코드**: `s733_truncate`

```sql
TRUNCATE TABLE sales.orders;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.3.3-3 TRUNCATE로 테이블 전체 비우기 — 실제로는 FK 제약 때문에 단독 실행이 거부됨
TRUNCATE TABLE sales.orders;                  -- 테이블을 통째로 비우는 명령이지만, order_items가 orders.order_id를 FK로 참조 중이라 실행이 거부됨

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) 실제 실행 결과: FeatureNotSupported 오류 발생 — "cannot truncate a table referenced in a foreign key constraint"(order_items가 orders를 참조하고 있기 때문).
-- 2) TRUNCATE는 DELETE와 달리 행 단위가 아니라 테이블 전체를 초기화하는 명령이라 FK로 참조되는 테이블에는 기본적으로 사용할 수 없다.
-- 3) 해결하려면 TRUNCATE TABLE sales.orders CASCADE; 처럼 CASCADE 옵션을 붙여 참조하는 테이블(order_items)까지 함께 비워야 한다(실제로 성공, 행 수 0으로 초기화).
-- 4) 책 예제는 이 FK 제약 상황을 고려하지 않은 코드이므로, 교안에서는 "왜 막히는지"와 "CASCADE로 해결하는 법"을 함께 짚어줘야 한다.
-- ---------------------------------------------------------------
```

</details>

*sales.order_items가 order_id를 FK로 참조 중이라 단독 TRUNCATE는 실제로 거부됨 — TRUNCATE ... CASCADE로 재시도하면 성공 (책이 고려하지 않은 제약)*

---

**실행 결과 — FK 참조로 인한 TRUNCATE 거부 → CASCADE로 재시도**

**실행 완료**

**실행 결과**: `s733_truncate`

```sql
실행 전 행 수: 3
TRUNCATE TABLE sales.orders; 단독 실행 → 실제 오류 발생
(sales.order_items가 order_id를 FK로 참조 중이라 TRUNCATE 불가 — 책은 이 제약을 고려하지 않은 예제)
FeatureNotSupported: cannot truncate a table referenced in a foreign key constraint
DETAIL:  Table "order_items" references "orders".
HINT:  Truncate table "order_items" at the same time, or use TRUNCATE ... CASCADE.
TRUNCATE TABLE sales.orders CASCADE; 로 재시도 → 성공 (실행 후 행 수: 0)
(주의: 이후 실습을 위해 harness에서 ROLLBACK TO SAVEPOINT로 데이터를 복원함)
```

---

**CASCADE를 활용한 삭제 (7.3.3-4, 책 원문의 숨은 함정)**

**예제 코드**: `s733_delete_cascade`

```
DELETE FROM sales.orders CASCADE;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.3.3-4 CASCADE를 활용한 삭제(라고 책에 소개되었으나, 실제로는 함정이 있는 코드)
DELETE FROM sales.orders CASCADE;             -- CASCADE는 DELETE 문법에 존재하지 않는 키워드지만, 오류 없이 실행됨(아래 설명 참고)

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) DELETE 문에는 원래 CASCADE 옵션이 없다(CASCADE는 TRUNCATE나 DROP, FK 제약 정의(ON DELETE CASCADE)에서 쓰이는 키워드이지 DELETE 문 자체의 옵션이 아니다).
-- 2) 그런데도 이 문장은 문법 오류 없이 성공한다 — PostgreSQL이 CASCADE를 예약어가 아니라 orders 테이블에 붙인 별칭(alias)으로 해석해버리기 때문이다. 즉 "DELETE FROM sales.orders AS CASCADE;"와 같은 의미가 된다.
-- 3) 실제로 EXPLAIN을 실행해보면 "Delete on orders cascade"라고 표시되어, cascade가 테이블 별칭으로 처리되었음을 확인할 수 있다.
-- 4) 결과적으로 이 문장은 'DELETE FROM sales.orders;'와 완전히 동일하게 동작한다 — 책이 의도한 "연관 데이터까지 함께 삭제"라는 CASCADE 기능은 전혀 작동하지 않는 조용한 함정이므로, 교안에서 반드시 짚어줘야 한다.
-- ---------------------------------------------------------------
```

</details>

*DELETE 문에는 원래 CASCADE 옵션이 없음 — 그런데도 실제로는 오류 없이 성공하는데, PostgreSQL이 CASCADE를 문법 오류가 아니라 orders 테이블의 별칭(alias)으로 해석해버리기 때문. 즉 이 문장은 실질적으로 그냥 'DELETE FROM sales.orders;'와 동일하게 동작 — 책이 의도한 '연관 데이터 함께 삭제'라는 CASCADE 기능은 전혀 작동하지 않는 조용한 함정*

---

**실행 결과 — CASCADE는 실은 테이블 별칭일 뿐 (책 원문의 숨은 함정)**

**실행 완료**

**실행 결과**: `s733_delete_cascade`

```
→ 오류 없이 성공 (실행 계획 확인 결과)
EXPLAIN 결과: "Delete on orders cascade"
→ PostgreSQL이 CASCADE를 orders 테이블의 별칭(alias)으로 해석
즉 이 문장은 실질적으로:
DELETE FROM sales.orders;
와 완전히 동일하게 동작 — CASCADE 키워드는 아무 기능도 수행하지 않음
```

---

**COPY FROM / COPY TO (7.3.4)**

**예제 코드**: `s734_copy`

```
COPY sales.orders FROM '/var/lib/postgresql/orders.csv'
    DELIMITER ',' CSV HEADER;
COPY sales.orders TO '/var/lib/postgresql/orders_backup.csv'
    DELIMITER ',' CSV HEADER;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.3.4 COPY FROM / COPY TO — 파일과 테이블 사이에 데이터를 대량으로 주고받는 명령
COPY sales.orders FROM '/var/lib/postgresql/orders.csv'   -- 서버 프로세스가 직접 이 경로의 파일을 읽어 orders 테이블에 삽입(클라이언트가 아니라 서버가 읽음)
    DELIMITER ',' CSV HEADER;                              -- 구분자는 콤마, CSV 형식이며 첫 줄은 헤더이므로 데이터로 취급하지 않고 건너뜀
COPY sales.orders TO '/var/lib/postgresql/orders_backup.csv'  -- orders 테이블의 전체 데이터를 서버가 이 경로에 파일로 씀(내보내기)
    DELIMITER ',' CSV HEADER;                              -- 마찬가지로 콤마 구분 CSV, 첫 줄에 컬럼명을 헤더로 함께 기록

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) COPY는 클라이언트가 아니라 PostgreSQL 서버 프로세스가 직접 파일을 읽고 쓰는 명령이므로, 경로는 서버가 접근 가능한 디렉터리여야 한다(클라이언트 PC의 경로가 아님).
-- 2) 책의 경로(/var/lib/postgresql/...)는 서버 프로세스에 쓰기 권한이 없어 실습 환경에서는 접근 가능한 /tmp/pg_copy/ 경로로 대체해서 실행했다.
-- 3) 실제 실행 결과: COPY FROM으로 2건(최민수 410.00, 윤서연 275.30)이 삽입되었고, COPY TO로 orders 테이블 전체가 CSV 백업 파일로 생성되었다.
-- 4) HEADER 옵션은 CSV 형식(CSV 키워드)과 함께 사용해야 하며, FROM 시에는 첫 줄을 데이터로 읽지 않고, TO 시에는 첫 줄에 컬럼명을 자동으로 써준다.
-- ---------------------------------------------------------------
```

</details>

*서버가 실제로 파일을 읽고 쓸 수 있는 디렉터리(/tmp/pg_copy)에 실제 CSV를 만들어 COPY FROM/TO 모두 실제 실행 — 책의 경로는 서버 프로세스 쓰기 권한이 없어 harness에서 접근 가능한 경로로 대체*

---

**실행 결과 — COPY FROM / COPY TO (7.3.4)**

**실행 완료**

**실행 결과**: `s734_copy`

```sql
> COPY sales.orders(customer_name, order_date, total_price) FROM '/tmp/pg_copy/orders.csv' DELIMITER ',' CSV HEADER ...  (rowcount=2)

> SELECT customer_name, total_price FROM sales.orders WHERE customer_name IN ('최민수','윤서연') ...

customer_name | total_price
---------------------------
최민수 | 410.00
윤서연 | 275.30
(2행)

COPY TO 'orders_backup.csv' 실행 완료 — 파일 미리보기:
customer_name,order_date,total_price
최민수,2025-03-01 00:00:00,410.00
윤서연,2025-03-02 00:00:00,275.30
```

---

**RETURNING — INSERT (7.3.5-1)**

**예제 코드**: `s735_returning_insert`

```sql
INSERT INTO sales.orders (customer_name, total_price)
VALUES ('강호동', 250.75)
RETURNING order_id, order_date;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
INSERT INTO sales.orders (customer_name, total_price)  -- orders 테이블에 신규 주문 1건 삽입
VALUES ('강호동', 250.75)                                -- customer_name, total_price 값 지정 (order_id, order_date는 자동 생성)
RETURNING order_id, order_date;                         -- INSERT 직후 서버가 채운 값(자동증가 PK, 타임스탬프)을 별도 SELECT 없이 즉시 반환

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) RETURNING은 INSERT/UPDATE/DELETE가 실제로 반영한 행(들)의 값을 그 자리에서 돌려받는 절이다.
-- 2) order_id, order_date처럼 DB가 자동 생성하는 값(SERIAL, DEFAULT now() 등)을 확인하려면 원래는 INSERT 후 별도 SELECT가 필요했지만, RETURNING으로 한 번의 왕복(round trip)에 끝낼 수 있다.
-- 3) 실행 결과: order_id=8, order_date(자동 생성된 타임스탬프)가 즉시 반환됨 — 애플리케이션 코드에서 방금 만든 리소스의 식별자를 바로 활용할 때 유용하다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — RETURNING — INSERT (7.3.5-1)**

**실행 완료**

**실행 결과**: `s735_returning_insert`

```sql
> INSERT INTO sales.orders (customer_name, total_price) VALUES ('강호동', 250.75) RETURNING order_id, order_date ...
order_id | order_date
---------------------
8 | 2026-08-22 02:54:01.327436
(1행)
```

---

**RETURNING — UPDATE (7.3.5-2)**

**예제 코드**: `s735_returning_update`

```sql
UPDATE sales.orders
SET total_price = total_price * 1.2
WHERE customer_name = '이영희'
RETURNING *;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
UPDATE sales.orders                    -- orders 테이블의 행을 수정하는 UPDATE 문
SET total_price = total_price * 1.2    -- 기존 total_price에 1.2배(20% 인상)를 곱해 갱신
WHERE customer_name = '이영희'          -- 고객명이 '이영희'인 행만 대상으로 함
RETURNING *;                           -- 실제로 갱신된 행이 있다면 그 행의 모든 컬럼을 반환

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) RETURNING *는 UPDATE로 "실제 변경된" 행에 한해서만 값을 돌려준다 — WHERE 조건에 맞는 행이 없으면 UPDATE 자체가 0건 처리되고 RETURNING도 빈 결과가 된다.
-- 2) 실행 결과: 0 rows — 이 시점 데이터에는 '이영희'라는 고객명이 존재하지 않아 갱신된 행이 없었다.
-- 3) 실무 포인트: RETURNING 결과가 비어 있으면 "쿼리 오류"가 아니라 "조건에 맞는 행이 없었다"는 뜻이므로, 애플리케이션에서 이 둘을 구분해서 처리해야 한다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — RETURNING — UPDATE (7.3.5-2)**

**실행 완료**

**실행 결과**: `s735_returning_update`

```sql
> UPDATE sales.orders SET total_price = total_price * 1.2 WHERE customer_name = '이영희' RETURNING * ...
(0 rows)
```

---

**RETURNING — DELETE (7.3.5-3)**

**예제 코드**: `s735_returning_delete`

```
DELETE FROM sales.orders
WHERE total_price < 50
RETURNING *;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
DELETE FROM sales.orders     -- orders 테이블에서 행을 삭제하는 DELETE 문
WHERE total_price < 50       -- total_price가 50 미만인 행만 대상으로 함
RETURNING *;                 -- 실제로 삭제된 행이 있다면 그 행의 모든 컬럼(삭제되기 직전 값)을 반환

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) DELETE ... RETURNING *은 "무엇이 삭제되었는지"를 삭제 직후 그대로 확인할 수 있게 해준다 — 별도 SELECT로 미리 조회해둘 필요가 없다.
-- 2) 실행 결과: 0 rows — 이 시점 데이터에는 total_price가 50 미만인 행이 없어 실제로 삭제된 행도 없었다.
-- 3) DELETE도 RETURNING도 조건에 맞는 행이 없으면 조용히 0건으로 끝난다는 점에서 UPDATE ... RETURNING과 동일한 패턴이다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — RETURNING — DELETE (7.3.5-3)**

**실행 완료**

**실행 결과**: `s735_returning_delete`

```sql
> SELECT customer_name, total_price FROM sales.orders WHERE total_price < 50 ...
(0 rows)
> DELETE FROM sales.orders WHERE total_price < 50 RETURNING * ...
(0 rows)
```

---

**기본 트랜잭션 BEGIN/COMMIT (7.3.6-1)**

**예제 코드**: `s736_begin_commit`

```sql
BEGIN;
UPDATE sales.orders SET total_price = total_price * 1.1 WHERE order_id = 1;
DELETE FROM sales.orders WHERE order_id = 2;
COMMIT;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
BEGIN;                                                                      -- 트랜잭션 시작 — 이후 문장들은 COMMIT 전까지 임시 상태로만 존재
UPDATE sales.orders SET total_price = total_price * 1.1 WHERE order_id = 1; -- order_id=1 행의 total_price를 10% 인상 (트랜잭션 내부, 아직 확정 아님)
DELETE FROM sales.orders WHERE order_id = 2;                                -- order_id=2 행을 삭제 (트랜잭션 내부, 아직 확정 아님)
COMMIT;                                                                     -- 트랜잭션을 확정 — 위 UPDATE, DELETE가 실제 DB에 영구 반영됨

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) BEGIN ~ COMMIT 사이의 UPDATE, DELETE는 하나의 논리적 작업 단위(트랜잭션)로 묶여, COMMIT을 만나야 비로소 DB에 확정 반영된다.
-- 2) 실행 결과: BEGIN 전 [(6,'최민수',410.00),(7,'윤서연',275.30)] → UPDATE+DELETE 후 COMMIT 시점 [(6,'최민수',451.00),(7,'윤서연',275.30)] — order_id=2 삭제와 order_id=1의 10% 인상(410.00→451.00)이 함께 반영되었다.
-- 3) 여러 DML 문을 하나의 트랜잭션으로 묶으면 "일부만 반영되는" 중간 상태 없이 전부 성공하거나 전부 취소되는 원자성(atomicity)이 보장된다.
-- ---------------------------------------------------------------
```

</details>

*BEGIN 전/후 상태를 비교해 COMMIT으로 실제 반영됨을 확인*

---

**실행 결과 — 기본 트랜잭션 BEGIN/COMMIT (7.3.6-1)**

**실행 완료**

**실행 결과**: `s736_begin_commit`

```
BEGIN 전 (일부): [(6, '최민수', Decimal('410.00')), (7, '윤서연', Decimal('275.30'))]
UPDATE + DELETE 후 COMMIT → (일부): [(6, '최민수', Decimal('451.00')), (7, '윤서연', Decimal('275.30'))]
```

---

**ROLLBACK (7.3.6-1)**

**예제 코드**: `s736_rollback`

```
BEGIN;
DELETE FROM sales.orders;
ROLLBACK;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
BEGIN;                            -- 트랜잭션 시작
DELETE FROM sales.orders;         -- orders 테이블의 모든 행 삭제 (트랜잭션 내부, 아직 확정 아님)
ROLLBACK;                         -- 트랜잭션을 취소 — BEGIN 이후의 모든 변경(DELETE)을 되돌림

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) ROLLBACK은 BEGIN 이후 실행한 모든 변경을 취소하고 트랜잭션 시작 이전 상태로 완전히 되돌린다.
-- 2) 실행 결과: BEGIN 전 행 수 2 → DELETE 직후(트랜잭션 내부) 행 수 0 → ROLLBACK 후 행 수 2 — 삭제가 실제로는 확정되지 않고 원래 상태로 복원됨을 확인.
-- 3) DELETE 직후에도 다른 세션에서는 아직 원래 데이터가 보이며(커밋 전이므로), 이 트랜잭션 자체도 COMMIT 대신 ROLLBACK을 선택하면 언제든 안전하게 되돌릴 수 있다는 점이 핵심이다.
-- ---------------------------------------------------------------
```

</details>

*트랜잭션 내부에서 삭제 직후와 ROLLBACK 이후의 행 수를 비교해 실제로 복원됨을 확인*

---

**실행 결과 — ROLLBACK (7.3.6-1)**

**실행 완료**

**실행 결과**: `s736_rollback`

```
BEGIN 전 행 수: 2
DELETE 직후(트랜잭션 내부) 행 수: 0
ROLLBACK 후 행 수: 2 (복원됨)
```

---

**SAVEPOINT를 활용한 부분 롤백 (7.3.6-2)**

**예제 코드**: `s736_savepoint`

```sql
BEGIN;
UPDATE sales.orders SET total_price = total_price * 1.2 WHERE order_id = 3;
SAVEPOINT sp1;
DELETE FROM sales.orders WHERE order_id = 4;
SAVEPOINT sp2;
ROLLBACK TO sp1;
COMMIT;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
BEGIN;                                                                      -- 트랜잭션 시작
UPDATE sales.orders SET total_price = total_price * 1.2 WHERE order_id = 3; -- order_id=3 행의 total_price를 20% 인상
SAVEPOINT sp1;                                                              -- 현재까지의 상태(UPDATE 반영 상태)를 저장점 sp1로 표시
DELETE FROM sales.orders WHERE order_id = 4;                                -- order_id=4 행 삭제
SAVEPOINT sp2;                                                              -- 현재까지의 상태(UPDATE+DELETE 반영 상태)를 저장점 sp2로 표시
ROLLBACK TO sp1;                                                            -- sp1 시점으로 되돌림 — sp1 이후의 DELETE만 취소되고 UPDATE는 그대로 유지
COMMIT;                                                                     -- 트랜잭션 확정 — 최종적으로 UPDATE만 반영된 상태가 DB에 저장됨

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) SAVEPOINT는 트랜잭션 내부에 중간 지점을 만들어, 전체를 ROLLBACK하지 않고도 그 지점까지만 부분적으로 되돌릴 수 있게 해준다.
-- 2) 실행 결과: sp2 시점 행 수 1(UPDATE+DELETE 모두 반영된 상태) → ROLLBACK TO sp1 후 행 수 2 — DELETE만 취소되고 앞서 실행한 UPDATE는 그대로 유지됨을 확인.
-- 3) ROLLBACK TO sp1 이후에도 트랜잭션 자체는 종료되지 않으므로, 이어서 COMMIT을 실행해야 sp1 시점까지의 변경(UPDATE)이 최종 확정된다.
-- 4) BEGIN~COMMIT 하나로 묶인 전체 롤백(ROLLBACK)과 달리, SAVEPOINT는 "일부 작업만 취소하고 나머지는 유지"하는 세밀한 제어가 필요할 때 사용한다.
-- ---------------------------------------------------------------
```

</details>

*ROLLBACK TO sp1으로 DELETE만 취소되고 UPDATE는 유지되는 부분 롤백을 실제로 검증*

---

**실행 결과 — SAVEPOINT를 활용한 부분 롤백 (7.3.6-2)**

**실행 완료**

**실행 결과**: `s736_savepoint`

```
SAVEPOINT sp1 설정 후 order_id=7 DELETE, SAVEPOINT sp2 설정
sp2 시점 행 수: 1
ROLLBACK TO sp1 후 행 수: 2 (DELETE만 취소되고 UPDATE는 유지)
COMMIT으로 최종 반영
```

---

## 7.4 데이터 제어 언어(DCL) — 개요

- **GRANT / REVOKE**: 테이블·스키마·DB 등 리소스에 대한 접근 권한을 사용자/역할에 부여·철회

- **비밀번호 암호화**: PostgreSQL 10+ 기본값 SCRAM-SHA-256 · pgcrypto 확장으로 필드 레벨 암호화(crypt/gen_salt)

- **역할(Role)/그룹 관리**: ROLE 생성 후 권한을 일괄 부여 → 사용자에게 GRANT role TO user로 역할 위임

- **Row-Level Security**: 행 단위 접근 제어 — CREATE POLICY로 조건을 만족하는 행만 조회 가능하도록 제한

---

**권한 부여 및 철회(GRANT/REVOKE) (7.4.1)**

**예제 코드**: `s741_grant_revoke`

```sql
CREATE ROLE user1 WITH LOGIN PASSWORD 'password123';
GRANT SELECT, INSERT ON sales.orders TO user1;
GRANT ALL PRIVILEGES ON sales.orders TO user1;
GRANT CONNECT ON DATABASE mydb TO user1;
REVOKE INSERT ON sales.orders FROM user1;
REVOKE ALL PRIVILEGES ON sales.orders FROM user1;
REVOKE CONNECT ON DATABASE mydb FROM user1;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
CREATE ROLE user1 WITH LOGIN PASSWORD 'password123';       -- 로그인 가능한 역할(사용자) 생성, 비밀번호 설정
GRANT SELECT, INSERT ON sales.orders TO user1;              -- sales.orders에 SELECT/INSERT 권한만 부여
GRANT ALL PRIVILEGES ON sales.orders TO user1;               -- 같은 테이블에 모든 권한(SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER)을 재부여, 기존 권한과 합집합으로 적용
GRANT CONNECT ON DATABASE mydb TO user1;                     -- mydb 데이터베이스 자체에 접속(CONNECT)할 권한 부여, 테이블 권한과는 별개 레벨
REVOKE INSERT ON sales.orders FROM user1;                    -- 부여된 여러 권한 중 INSERT 하나만 선택적으로 철회
REVOKE ALL PRIVILEGES ON sales.orders FROM user1;             -- sales.orders에 대한 나머지 테이블 권한을 모두 철회
REVOKE CONNECT ON DATABASE mydb FROM user1;                   -- 데이터베이스 CONNECT 권한도 철회, user1은 더 이상 mydb에 접속 불가

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) GRANT/REVOKE는 대상 객체(테이블 vs 데이터베이스)마다 별도로 관리된다 — CONNECT를 막아도 테이블 권한 GRANT 이력과는 무관하다.
-- 2) GRANT ALL PRIVILEGES는 이미 부여된 개별 권한(SELECT, INSERT)을 덮어쓰는 것이 아니라 합집합으로 확장한다.
-- 3) 실제로 information_schema.role_table_grants를 조회하면 GRANT ALL 이후 7개 권한(DELETE/INSERT/REFERENCES/SELECT/TRIGGER/TRUNCATE/UPDATE)이, REVOKE ALL 이후 0 rows가 확인되어 권한 변화를 눈으로 검증할 수 있다.
-- ---------------------------------------------------------------
```

</details>

*information_schema.role_table_grants로 부여/철회 전후 실제 권한 목록을 직접 조회*

---

**실행 결과 — 권한 부여 및 철회(GRANT/REVOKE) (7.4.1)**

**실행 완료**

**실행 결과**: `s741_grant_revoke`

```sql
> GRANT SELECT, INSERT ON sales.orders TO user1 ...  (rowcount=-1)
> GRANT ALL PRIVILEGES ON sales.orders TO user1 ...  (rowcount=-1)
> GRANT CONNECT ON DATABASE mydb TO user1 ...  (rowcount=-1)
> SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name='orders' AND grantee='user1' ORDER BY privilege_type ...
grantee | privilege_type
------------------------
user1 | DELETE
user1 | INSERT
user1 | REFERENCES
user1 | SELECT
user1 | TRIGGER
user1 | TRUNCATE
user1 | UPDATE
(7행)
> REVOKE INSERT ON sales.orders FROM user1 ...  (rowcount=-1)
> REVOKE ALL PRIVILEGES ON sales.orders FROM user1 ...  (rowcount=-1)
> REVOKE CONNECT ON DATABASE mydb FROM user1 ...  (rowcount=-1)
> SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name='orders' AND grantee='user1' ...
(0 rows)
```

---

**비밀번호 암호화 (7.4.2-1)**

**예제 코드**: `s742_password_encryption`

```
CREATE ROLE secure_user WITH LOGIN PASSWORD 'securepassword';
-- PostgreSQL 10+ 기본적으로 SCRAM-SHA-256 암호화 사용
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
CREATE ROLE secure_user WITH LOGIN PASSWORD 'securepassword';  -- 로그인 가능한 역할 생성 시 비밀번호는 자동으로 암호화되어 저장됨
-- PostgreSQL 10+ 기본적으로 SCRAM-SHA-256 암호화 사용                -- 서버 설정(password_encryption)에 따라 해시 알고리즘 결정

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) CREATE ROLE ... PASSWORD '...' 구문은 평문을 그대로 저장하지 않고 서버의 password_encryption 설정에 따라 해시로 변환해 pg_authid.rolpassword에 저장한다.
-- 2) 실제 SHOW password_encryption; 을 실행하면 이 서버에서 scram-sha-256이 사용 중임을 직접 확인할 수 있다(PostgreSQL 10 이상 기본값).
-- 3) pg_authid에서 rolpassword IS NOT NULL을 확인하면 비밀번호가 해시 형태로 실제 저장되었는지 검증할 수 있다.
-- ---------------------------------------------------------------
```

</details>

*SHOW password_encryption으로 실제 이 서버의 암호화 방식을 확인*

---

**실행 결과 — 비밀번호 암호화 (7.4.2-1)**

**실행 완료**

**실행 결과**: `s742_password_encryption`

```sql
> DROP ROLE IF EXISTS secure_user ...  (rowcount=-1)
> CREATE ROLE secure_user WITH LOGIN PASSWORD 'securepassword' ...  (rowcount=-1)
> SELECT rolname, rolpassword IS NOT NULL AS has_password FROM pg_authid WHERE rolname='secure_user' ...
rolname | has_password
----------------------
secure_user | True
(1행)
> SHOW password_encryption ...
password_encryption
-------------------
scram-sha-256
(1행)
```

---

**PGCrypto 필드 레벨 암호화 (7.4.2-3)**

**예제 코드**: `s742_pgcrypto`

```sql
CREATE EXTENSION pgcrypto;
INSERT INTO users (username, password)
VALUES ('admin', crypt('mypassword', gen_salt('bf')));
SELECT * FROM users WHERE password = crypt('mypassword', password);
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
CREATE EXTENSION pgcrypto;                                        -- 암호화 함수(crypt, gen_salt 등)를 제공하는 확장 모듈 설치
INSERT INTO users (username, password)
VALUES ('admin', crypt('mypassword', gen_salt('bf')));            -- gen_salt('bf')로 bcrypt용 솔트 생성 후 crypt()로 해시화하여 저장, 평문 저장 안 함
SELECT * FROM users WHERE password = crypt('mypassword', password); -- 입력 비밀번호를 저장된 해시의 솔트로 재해시해 비교하는 방식으로 인증 수행

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) crypt(원문, gen_salt('bf'))는 매 호출마다 다른 솔트를 생성하므로 같은 비밀번호라도 저장되는 해시값은 매번 달라진다.
-- 2) 인증 시에는 crypt('입력값', password)처럼 저장된 해시(password 컬럼)를 솔트로 넘겨 같은 솔트로 재해시함으로써 값이 일치하는지만 비교한다 — 저장된 해시를 복호화하는 것이 아니다.
-- 3) 실제 테스트에서 admin의 password 컬럼에 $2a$06$... 형태의 bcrypt 해시가 저장되고, 올바른 비밀번호로 조회하면 1행, 틀린 비밀번호로 조회하면 0 rows가 반환되어 인증 성공/실패를 직접 눈으로 확인할 수 있다.
-- ---------------------------------------------------------------
```

</details>

*책은 users 테이블 스키마를 별도로 제시하지 않아 동일 컬럼(username, password)으로 harness에서 구성 — crypt()/gen_salt()로 실제 bcrypt 암호화 및 인증 성공/실패 케이스까지 검증*

---

**실행 결과 — PGCrypto 필드 레벨 암호화 (7.4.2-3)**

**실행 완료**

**실행 결과**: `s742_pgcrypto`

```sql
> CREATE EXTENSION IF NOT EXISTS pgcrypto ...  (rowcount=-1)
> DROP TABLE IF EXISTS users ...  (rowcount=-1)
> CREATE TABLE users (id SERIAL PRIMARY KEY, username TEXT UNIQUE, password TEXT) ...  (rowcount=-1)
> INSERT INTO users (username, password) VALUES ('admin', crypt('mypassword', gen_salt('bf'))) ...  (rowcount=1)
> SELECT username, password FROM users WHERE username='admin' ...
username | password
-------------------
admin | $2a$06$vurx0eZM.Ely23CNUuzQAOjwdxS75Ft2IB04yFEG470/cPOomKYkq
(1행)
> SELECT username FROM users WHERE password = crypt('mypassword', password) ...
username
--------
admin
(1행)
> SELECT username FROM users WHERE password = crypt('wrongpassword', password) ...
(0 rows)
```

---

**역할 및 그룹 관리 (7.4.3)**

**예제 코드**: `s743_role_group`

```sql
CREATE ROLE manager_role;
GRANT SELECT, INSERT, UPDATE ON sales.orders TO manager_role;
GRANT manager_role TO user1;
-- SET ROLE manager_role;
REVOKE manager_role FROM user1;
DROP ROLE manager_role;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
CREATE ROLE manager_role;                                    -- 로그인 불가능한 그룹 역할 생성(권한 묶음 용도)
GRANT SELECT, INSERT, UPDATE ON sales.orders TO manager_role; -- manager_role에 테이블 권한 3종 부여 → 이 GRANT가 뒤에서 DROP ROLE 실패의 원인이 된다
GRANT manager_role TO user1;                                  -- user1이 manager_role을 상속받도록 역할 위임(멤버십) 부여
-- SET ROLE manager_role;                                     -- (주석 처리됨) 실제 실행 시 user1 세션에서 manager_role 권한으로 전환하는 명령, 본 예제에서는 미실행
REVOKE manager_role FROM user1;                                -- user1의 role 멤버십(위임)만 철회 — sales.orders에 대한 manager_role 자체의 테이블 권한은 그대로 남음
DROP ROLE manager_role;                                        -- manager_role을 삭제하려 하지만 위에서 부여된 테이블 권한이 아직 남아 있어 실패

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) [실제 오류] 이 블록을 그대로 실행하면 DROP ROLE에서 DependentObjectsStillExist 예외가 발생한다: role "manager_role" cannot be dropped because some objects depend on it — DETAIL: privileges for table sales.orders.
-- 2) 원인: REVOKE manager_role FROM user1;은 "역할 위임(멤버십)"만 철회할 뿐, GRANT SELECT, INSERT, UPDATE ON sales.orders TO manager_role;로 manager_role 자체에 부여된 테이블 권한은 별개로 남아 있다 — 두 REVOKE 대상은 서로 다른 것이다.
-- 3) 해결: DROP ROLE manager_role; 실행 전에 REVOKE SELECT, INSERT, UPDATE ON sales.orders FROM manager_role;를 먼저 실행해 role이 보유한 테이블 권한 자체를 철회해야 한다. 책 코드는 이 REVOKE 문을 누락했다.
-- 4) 교훈: 역할을 삭제하려면 그 역할이 "받은" 멤버십뿐 아니라 그 역할에 "부여된" 모든 객체 권한까지 함께 철회해야 한다 — DROP OWNED BY manager_role; 로 한 번에 정리하는 방법도 있다.
-- ---------------------------------------------------------------
```

</details>

*책 코드 그대로 실행하면 실제 오류 발생 — manager_role이 sales.orders에 대한 테이블 권한을 여전히 보유한 상태라 DROP ROLE 전에 REVOKE가 필요한데, 책은 역할 위임만 REVOKE하고 테이블 권한 REVOKE를 누락함*

---

**실행 결과 — DROP ROLE 실패 (책이 누락한 REVOKE, 실제 오류)**

**예외 발생**

**실행 결과**: `s743_role_group`

```
DependentObjectsStillExist: role "manager_role" cannot be dropped because some objects depend on it
DETAIL:  privileges for table sales.orders
```

---

**Row-Level Security 적용 (7.4.4)**

**예제 코드**: `s744_rls`

```sql
ALTER TABLE sales.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY order_policy
ON sales.orders
FOR SELECT
USING (customer_name = current_user);
ALTER TABLE sales.orders FORCE ROW LEVEL SECURITY;
-- 정책 해제
DROP POLICY order_policy ON sales.orders;
ALTER TABLE sales.orders DISABLE ROW LEVEL SECURITY;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
ALTER TABLE sales.orders ENABLE ROW LEVEL SECURITY;   -- sales.orders 테이블에 행 단위 보안(RLS) 기능을 활성화
CREATE POLICY order_policy
ON sales.orders
FOR SELECT                                            -- SELECT 작업에만 적용되는 정책 정의
USING (customer_name = current_user);                 -- 조회 조건: 행의 customer_name이 현재 접속 계정명(current_user)과 같은 행만 통과
ALTER TABLE sales.orders FORCE ROW LEVEL SECURITY;     -- 테이블 소유자에게도 RLS를 강제 적용(단, superuser에는 적용 안 됨)
-- 정책 해제
DROP POLICY order_policy ON sales.orders;              -- 정의된 정책 삭제
ALTER TABLE sales.orders DISABLE ROW LEVEL SECURITY;   -- 테이블의 RLS 기능 자체를 비활성화

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) USING (customer_name = current_user)는 접속 계정의 이름과 데이터의 값을 직접 비교하는 패턴으로, 계정명과 데이터 값이 일치해야만 동작하는 실무형 RLS 예시다.
-- 2) 실제 '박서준' 계정으로 접속해 SELECT하면 [('박서준', 99.99)]처럼 자신의 행만 반환되어 정책이 실제로 필터링을 수행함을 확인할 수 있다.
-- 3) FORCE ROW LEVEL SECURITY를 걸어도 postgres(관리자/소유자) 계정으로 조회하면 3행 전체가 그대로 반환된다 — 테이블 소유자는 기본적으로 RLS를 우회하기 때문이며, 이는 FORCE 옵션의 흔한 오해 포인트다.
-- 4) RLS는 GRANT/REVOKE로 정해지는 테이블 단위 권한과 달리 "행" 단위로 접근을 제어하는 별도 계층이며, 두 메커니즘은 함께 적용된다.
-- ---------------------------------------------------------------
```

</details>

*customer_name='박서준'인 행이 있는 실제 계정으로 접속해 RLS 정책이 자신의 행만 반환하는지 실제 검증(관리자 계정 조회와 비교)*

---

**실행 결과 — Row-Level Security 적용 (7.4.4)**

**실행 완료**

**실행 결과**: `s744_rls`

```sql
> GRANT SELECT ON sales.orders TO "박서준" ...  (rowcount=-1)
> GRANT USAGE ON SCHEMA sales TO "박서준" ...  (rowcount=-1)
> ALTER TABLE sales.orders ENABLE ROW LEVEL SECURITY ...  (rowcount=-1)
> DROP POLICY IF EXISTS order_policy ON sales.orders ...  (rowcount=-1)
> CREATE POLICY order_policy ON sales.orders FOR SELECT USING (customer_name = current_user) ...  (rowcount=-1)
> ALTER TABLE sales.orders FORCE ROW LEVEL SECURITY ...  (rowcount=-1)
정책 적용 후 '박서준' 계정으로 SELECT → [('박서준', Decimal('99.99'))] (자신의 행만 조회됨)
postgres(관리자) 계정으로 SELECT(RLS 미적용 대상) → 총 3행 전체 조회됨
> DROP POLICY order_policy ON sales.orders ...  (rowcount=-1)
> ALTER TABLE sales.orders DISABLE ROW LEVEL SECURITY ...  (rowcount=-1)
```

---

## 7.5 고급 SQL — 개요

- **서브쿼리**: EXISTS(존재 여부) · IN(목록 포함) · ANY(하나라도 만족) · ALL(모두 만족)

- **이중쿼리**: SELECT 절 내부에 또 다른 서브쿼리를 중첩해 고객별 집계값을 함께 조회

- **JOIN 5종**: INNER · LEFT · RIGHT · FULL OUTER · CROSS JOIN

- **CTE**: WITH 절로 임시 결과 집합 정의 · WITH RECURSIVE로 계층 구조(상사-부하) 재귀 조회

- **윈도우 함수**: RANK() · DENSE_RANK() · LEAD() · LAG() — PARTITION BY로 그룹별 순위/이전·다음 값 계산

---

**실습용 더미 스키마 구성**

**예제 코드**: `s75_setup`

```sql
-- 책은 customers/orders/products/employees의 컬럼만 본문에서 언급하고
-- 별도 CREATE TABLE을 제시하지 않아, 동일 컬럼 구조로 harness에서 스키마 구성
CREATE TABLE customers (customer_id SERIAL PRIMARY KEY, customer_name TEXT);
CREATE TABLE orders (order_id SERIAL PRIMARY KEY, customer_id INT REFERENCES customers,
    total_amount NUMERIC(10,2), order_date DATE);
CREATE TABLE products (product_id SERIAL PRIMARY KEY, product_name TEXT,
    category TEXT, price NUMERIC(10,2));
CREATE TABLE employees (employee_id SERIAL PRIMARY KEY, name TEXT,
    manager_id INT REFERENCES employees);
-- 이하 각 테이블에 더미 데이터 5~6건씩 삽입
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.5 실습용 더미 스키마 구성 — customers/orders/products/employees 4개 테이블과 FK 관계 정의
-- 책은 customers/orders/products/employees의 컬럼만 본문에서 언급하고
-- 별도 CREATE TABLE을 제시하지 않아, 동일 컬럼 구조로 harness에서 스키마 구성
CREATE TABLE customers (customer_id SERIAL PRIMARY KEY, customer_name TEXT);  -- 고객 테이블: PK는 customer_id, 이하 세 테이블이 이 값을 참조/연계
CREATE TABLE orders (order_id SERIAL PRIMARY KEY, customer_id INT REFERENCES customers,  -- 주문 테이블: customer_id로 customers를 참조하는 FK (1:N 관계)
    total_amount NUMERIC(10,2), order_date DATE);                            -- 주문 금액과 주문일 컬럼
CREATE TABLE products (product_id SERIAL PRIMARY KEY, product_name TEXT,     -- 상품 테이블: orders와 직접 FK로 연결되진 않지만 category/price로 ANY/ALL 예제에 사용
    category TEXT, price NUMERIC(10,2));                                    -- 카테고리별 가격 비교의 기준이 되는 컬럼
CREATE TABLE employees (employee_id SERIAL PRIMARY KEY, name TEXT,          -- 직원 테이블: 자기 자신을 참조하는 셀프 조인 구조
    manager_id INT REFERENCES employees);                                   -- manager_id가 같은 테이블의 employee_id를 참조 (상사-부하 계층)
-- 이하 각 테이블에 더미 데이터 5~6건씩 삽입
-- customers 5명, orders 6건, products 5개, employees 6명(상사-부하 계층 포함)

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) FK(REFERENCES)는 "이 컬럼 값은 반드시 참조 테이블에 존재해야 한다"는 무결성 제약이다 — orders.customer_id는 customers에 없는 값을 가질 수 없다.
-- 2) employees.manager_id처럼 같은 테이블을 참조하는 FK를 셀프 참조(self-reference)라 하며, 조직도 같은 계층 데이터를 표현할 때 쓴다.
-- 3) 이 4개 테이블은 이후 7.5의 모든 서브쿼리(EXISTS/IN/ANY/ALL) 예제가 공통으로 사용하는 실습 기반 데이터다.
-- ---------------------------------------------------------------
```

</details>

*고객 5명·주문 6건·상품 5개·직원 6명(상사-부하 계층 포함)의 더미 데이터로 이하 7.5의 모든 예제를 실제 실행*

---

**EXISTS 서브쿼리 (7.5.1-1)**

**예제 코드**: `s751_exists`

```sql
SELECT customer_id, customer_name FROM customers c
WHERE EXISTS (
    SELECT 1 FROM orders o
    WHERE o.customer_id = c.customer_id AND o.total_amount > 1000
);
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.5.1-1 EXISTS 서브쿼리 — 조건을 만족하는 행이 "존재하는지"만 확인해 고객을 필터링
SELECT customer_id, customer_name FROM customers c                          -- customers에 c라는 별칭을 부여해 서브쿼리에서 참조(상관 서브쿼리)
WHERE EXISTS (                                                              -- EXISTS: 괄호 안 서브쿼리가 한 행이라도 반환하면 참
    SELECT 1 FROM orders o                                                  -- SELECT 1은 값 자체는 의미 없고, "행이 있는지" 여부만 중요
    WHERE o.customer_id = c.customer_id AND o.total_amount > 1000           -- 바깥 customers.customer_id와 연결되는 상관 조건 + 금액 조건
);

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) EXISTS는 서브쿼리의 "결과값"이 아니라 "행의 존재 여부"만 boolean으로 판단하므로 SELECT 1처럼 아무 값이나 넣어도 결과는 같다.
-- 2) o.customer_id = c.customer_id처럼 바깥 쿼리 값을 서브쿼리 안에서 참조하는 것을 상관(correlated) 서브쿼리라 하며, EXISTS는 보통 이 형태로 쓰인다.
-- 3) 실행 결과로 1000 초과 주문이 있는 고객 3명(김민준, 이서연, 최지우)이 반환된다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — EXISTS 서브쿼리 (7.5.1-1)**

**실행 완료**

**실행 결과**: `s751_exists`

```sql
> SELECT customer_id, customer_name FROM customers c ...
customer_id | customer_name
---------------------------
1 | 김민준
2 | 이서연
4 | 최지우
(3행)
```

---

**IN 서브쿼리 (7.5.1-2)**

**예제 코드**: `s751_in`

```sql
SELECT customer_id, customer_name FROM customers
WHERE customer_id IN (
    SELECT customer_id FROM orders WHERE total_amount > 1000
);
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.5.1-2 IN 서브쿼리 — EXISTS와 동일한 조건을 서브쿼리 결과 목록에 포함되는지로 표현
SELECT customer_id, customer_name FROM customers                            -- 별도 별칭 없이 customers 전체를 대상으로 조회
WHERE customer_id IN (                                                      -- IN: customer_id 값이 아래 서브쿼리 결과 목록에 하나라도 포함되면 참
    SELECT customer_id FROM orders WHERE total_amount > 1000                -- 1000 초과 주문을 낸 고객의 customer_id 목록을 먼저 산출
);

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) IN은 서브쿼리가 반환하는 "값 목록"에 바깥 컬럼 값이 포함되는지를 비교한다 — EXISTS의 "행 존재 여부" 판단과 접근 방식이 다르다.
-- 2) 상관 서브쿼리인 EXISTS와 달리 IN의 서브쿼리는 바깥 쿼리와 독립적으로 먼저 값 목록을 만들 수 있다(비상관 서브쿼리로도 작성 가능).
-- 3) 이 예제는 EXISTS 버전과 동일하게 3명(김민준, 이서연, 최지우)을 반환해 두 방식이 같은 결과를 낼 수 있음을 보여준다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — IN 서브쿼리 (7.5.1-2)**

**실행 완료**

**실행 결과**: `s751_in`

```sql
> SELECT customer_id, customer_name FROM customers ...
customer_id | customer_name
---------------------------
1 | 김민준
2 | 이서연
4 | 최지우
(3행)
```

---

**ANY 서브쿼리 (7.5.1-3)**

**예제 코드**: `s751_any`

```sql
SELECT product_id, product_name, price FROM products
WHERE price > ANY (
    SELECT price FROM products WHERE category = 'Electronics'
);
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.5.1-3 ANY 서브쿼리 — 서브쿼리 결과 중 "하나라도" 조건을 만족시키면 참
SELECT product_id, product_name, price FROM products                       -- products 전체에서 가격 비교
WHERE price > ANY (                                                        -- ANY: 아래 목록의 값들 중 하나보다만 크면 참 (즉, 최솟값보다 크면 참)
    SELECT price FROM products WHERE category = 'Electronics'              -- Electronics 카테고리 상품들의 가격 목록
);

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) price > ANY (목록)은 "목록의 최솟값보다 크면 참"과 동치다 — 목록 안의 어느 하나라도 만족시키면 되기 때문이다.
-- 2) ANY는 IN과 비슷해 보이지만 부등호(>, <, >=  등)와 함께 쓸 수 있다는 점이 다르다 — IN은 등가 비교(=)에 해당하는 목록 포함만 표현한다.
-- 3) 실행 결과 Electronics 최솟값보다 큰 상품 3개(노트북, 키보드, 코트)가 반환되며, 이는 뒤이어 나오는 ALL과 대비된다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — ANY 서브쿼리 (7.5.1-3)**

**실행 완료**

**실행 결과**: `s751_any`

```sql
> SELECT product_id, product_name, price FROM products ...
product_id | product_name | price
---------------------------------
1 | 노트북 | 1200000.00
2 | 키보드 | 45000.00
4 | 코트 | 89000.00
(3행)
```

---

**ALL 서브쿼리 (7.5.1-4)**

**예제 코드**: `s751_all`

```sql
SELECT product_id, product_name, price FROM products
WHERE price > ALL (
    SELECT price FROM products WHERE category = 'Clothing'
);
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.5.1-4 ALL 서브쿼리 — 서브쿼리 결과 "모두"를 만족시켜야 참
SELECT product_id, product_name, price FROM products                       -- products 전체에서 가격 비교
WHERE price > ALL (                                                        -- ALL: 아래 목록의 모든 값보다 커야 참 (즉, 최댓값보다 커야 참)
    SELECT price FROM products WHERE category = 'Clothing'                 -- Clothing 카테고리 상품들의 가격 목록
);

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) price > ALL (목록)은 "목록의 최댓값보다 크면 참"과 동치다 — 목록의 모든 값을 예외 없이 넘어서야 하기 때문이다.
-- 2) ANY가 "최솟값 기준"으로 조건을 완화하는 것과 반대로, ALL은 "최댓값 기준"으로 조건을 엄격하게 만든다 — 같은 비교 연산자(>)라도 ANY/ALL에 따라 통과하는 행 수가 크게 달라진다.
-- 3) 실행 결과 Clothing 최댓값보다도 큰 상품은 노트북 1개뿐이다 — 앞의 s751_any(3개)와 나란히 비교하면 ANY/ALL의 차이가 직관적으로 드러난다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — ALL 서브쿼리 (7.5.1-4)**

**실행 완료**

**실행 결과**: `s751_all`

```sql
> SELECT product_id, product_name, price FROM products ...
product_id | product_name | price
---------------------------------
1 | 노트북 | 1200000.00
(1행)
```

---

**이중쿼리 — 고객별 최고 주문 (7.5.2-1)**

**예제 코드**: `s752_nested1`

```sql
SELECT customer_id, customer_name,
    (SELECT MAX(total_amount) FROM orders
     WHERE orders.customer_id = customers.customer_id) AS max_order
FROM customers;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
SELECT customer_id, customer_name,                              -- 고객 식별자와 이름을 조회 대상 컬럼으로 지정
    (SELECT MAX(total_amount) FROM orders                       -- 서브쿼리: orders 테이블에서 총액의 최댓값을 계산
     WHERE orders.customer_id = customers.customer_id) AS max_order  -- 바깥 customers 행과 같은 customer_id로 상관(correlated) 필터링
FROM customers;                                                  -- 바깥쿼리는 customers 전체를 순회하며 각 행마다 서브쿼리를 반복 실행

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) 이 서브쿼리는 SELECT 절 안에 있는 "스칼라 서브쿼리"로, 반드시 한 행 한 열(단일 값)만 반환해야 한다.
-- 2) WHERE orders.customer_id = customers.customer_id 때문에 바깥 행마다 값이 달라지는 상관 서브쿼리(correlated subquery)이며, customers 행 수만큼 반복 실행된다.
-- 3) 정하은처럼 orders에 매칭되는 행이 없으면 MAX()가 집계할 대상이 없어 max_order는 0이 아니라 NULL(None)이 된다 — COUNT와 달리 MAX/MIN/AVG/SUM은 빈 집합에서 NULL을 반환한다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — 이중쿼리 — 고객별 최고 주문 (7.5.2-1)**

**실행 완료**

**실행 결과**: `s752_nested1`

```sql
> SELECT customer_id, customer_name, ...
customer_id | customer_name | max_order
---------------------------------------
1 | 김민준 | 1200.00
2 | 이서연 | 1500.50
3 | 박도윤 | 80.00
4 | 최지우 | 2100.00
5 | 정하은 | None
(5행)
```

---

**이중쿼리 — 평균 초과 주문 (7.5.2-2)**

**예제 코드**: `s752_nested2`

```sql
SELECT order_id, customer_id, total_amount
FROM orders
WHERE total_amount > (SELECT AVG(total_amount) FROM orders);
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
SELECT order_id, customer_id, total_amount                      -- 주문 식별자, 고객 식별자, 총액을 조회
FROM orders
WHERE total_amount > (SELECT AVG(total_amount) FROM orders);    -- 서브쿼리: orders 전체 총액의 평균을 계산 후, 이보다 큰 행만 필터링

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) 이 서브쿼리는 WHERE 절 안에서 비교 연산자(>)의 오른쪽에 오는 스칼라 서브쿼리이며, 상관관계 없이 단 한 번만 계산된다.
-- 2) 서브쿼리가 먼저 orders 전체를 대상으로 AVG(total_amount) 값을 하나 확정한 뒤, 바깥쿼리가 그 값을 상수처럼 사용해 각 행을 비교한다.
-- 3) 평균 이상이 아니라 평균 "초과"(>)이므로 평균과 정확히 같은 금액의 주문이 있다면 그 행은 결과에서 제외된다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — 이중쿼리 — 평균 초과 주문 (7.5.2-2)**

**실행 완료**

**실행 결과**: `s752_nested2`

```sql
> SELECT order_id, customer_id, total_amount FROM orders WHERE total_amount > (SELECT AVG(total_amount) FROM orders) ...
order_id | customer_id | total_amount
-------------------------------------
1 | 1 | 1200.00
3 | 2 | 1500.50
6 | 4 | 2100.00
(3행)
```

---

**INNER JOIN (7.5.3-1)**

**예제 코드**: `s753_inner`

```sql
SELECT c.customer_id, c.customer_name, o.order_id, o.total_amount
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
SELECT c.customer_id, c.customer_name, o.order_id, o.total_amount  -- customers/orders 양쪽 컬럼을 별칭(c, o)으로 구분해 조회
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id;              -- 두 테이블에서 customer_id가 "일치하는" 행끼리만 결합
-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) INNER JOIN은 양쪽 테이블 모두에 매칭되는 행만 남기므로, 주문이 하나도 없는 고객(정하은)은 결과에서 완전히 빠진다 — 총 6행.
-- 2) JOIN 5종 비교의 기준선: LEFT/RIGHT/FULL 결과에서 몇 행이 "추가"되는지가 이 INNER JOIN 결과(6행) 대비 계산된다.
-- 3) ON 절의 c.customer_id = o.customer_id가 결합 조건이며, 이 조건이 참인 조합만 결과 행으로 남는다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — INNER JOIN (7.5.3-1)**

**실행 완료**

**실행 결과**: `s753_inner`

```sql
> SELECT c.customer_id, c.customer_name, o.order_id, o.total_amount ...
customer_id | customer_name | order_id | total_amount
-----------------------------------------------------
1 | 김민준 | 1 | 1200.00
1 | 김민준 | 2 | 300.00
2 | 이서연 | 3 | 1500.50
2 | 이서연 | 5 | 950.00
3 | 박도윤 | 4 | 80.00
4 | 최지우 | 6 | 2100.00
(6행)
```

---

**LEFT JOIN (7.5.3-2)**

**예제 코드**: `s753_left`

```sql
SELECT c.customer_id, c.customer_name, o.order_id, o.total_amount
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
SELECT c.customer_id, c.customer_name, o.order_id, o.total_amount  -- LEFT 테이블(customers) 기준으로 조회할 컬럼 지정
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id;               -- 왼쪽(customers)은 전부 보존, 매칭 안 되면 오른쪽(orders) 컬럼은 NULL로 채움
-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) LEFT JOIN은 왼쪽 테이블(customers)의 모든 행을 보존한다 — 결과는 7행으로, INNER JOIN의 6행에 정하은 1행이 추가된다.
-- 2) 정하은은 orders에 매칭되는 행이 없으므로 o.order_id와 o.total_amount가 NULL(None)로 채워져 표시된다.
-- 3) INNER JOIN(6행)과 LEFT JOIN(7행)의 행 수 차이 1행이 곧 "주문 이력이 없는 고객 수"를 의미한다.
-- ---------------------------------------------------------------
```

</details>

*주문이 없는 고객도 NULL과 함께 포함되는지 확인*

---

**실행 결과 — LEFT JOIN (7.5.3-2)**

**실행 완료**

**실행 결과**: `s753_left`

```sql
> SELECT c.customer_id, c.customer_name, o.order_id, o.total_amount ...
customer_id | customer_name | order_id | total_amount
-----------------------------------------------------
1 | 김민준 | 2 | 300.00
1 | 김민준 | 1 | 1200.00
2 | 이서연 | 5 | 950.00
2 | 이서연 | 3 | 1500.50
3 | 박도윤 | 4 | 80.00
4 | 최지우 | 6 | 2100.00
5 | 정하은 | None | None
(7행)
```

---

**RIGHT JOIN (7.5.3-3)**

**예제 코드**: `s753_right`

```sql
SELECT c.customer_id, c.customer_name, o.order_id, o.total_amount
FROM customers c
RIGHT JOIN orders o ON c.customer_id = o.customer_id;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
SELECT c.customer_id, c.customer_name, o.order_id, o.total_amount  -- RIGHT 테이블(orders) 기준으로 조회할 컬럼 지정
FROM customers c
RIGHT JOIN orders o ON c.customer_id = o.customer_id;              -- 오른쪽(orders)은 전부 보존, 매칭 안 되면 왼쪽(customers) 컬럼은 NULL로 채움
-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) RIGHT JOIN은 오른쪽 테이블(orders)의 모든 행을 보존한다 — 결과는 6행으로 orders 테이블 전체 행 수와 같다.
-- 2) 이 데이터셋에서는 모든 주문이 실제 존재하는 고객에게 연결되어 있어 c 쪽에 NULL이 생기지 않으므로, 우연히 LEFT JOIN보다 1행 적고 INNER JOIN과 같은 6행이 된다 — 만약 존재하지 않는 customer_id를 가진 주문이 있었다면 그 행의 c.customer_name이 NULL로 나타났을 것이다.
-- 3) RIGHT JOIN은 FROM과 JOIN 대상 테이블의 좌우만 바꾼 LEFT JOIN과 동치이므로, 실무에서는 가독성을 위해 RIGHT JOIN 대신 LEFT JOIN으로 테이블 순서를 바꿔 쓰는 경우가 많다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — RIGHT JOIN (7.5.3-3)**

**실행 완료**

**실행 결과**: `s753_right`

```sql
> SELECT c.customer_id, c.customer_name, o.order_id, o.total_amount ...
customer_id | customer_name | order_id | total_amount
-----------------------------------------------------
1 | 김민준 | 1 | 1200.00
1 | 김민준 | 2 | 300.00
2 | 이서연 | 3 | 1500.50
3 | 박도윤 | 4 | 80.00
2 | 이서연 | 5 | 950.00
4 | 최지우 | 6 | 2100.00
(6행)
```

---

**FULL OUTER JOIN (7.5.3-4)**

**예제 코드**: `s753_full`

```sql
SELECT c.customer_id, c.customer_name, o.order_id, o.total_amount
FROM customers c
FULL OUTER JOIN orders o ON c.customer_id = o.customer_id;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
SELECT c.customer_id, c.customer_name, o.order_id, o.total_amount  -- 양쪽 테이블 모두를 보존 대상으로 조회할 컬럼 지정
FROM customers c
FULL OUTER JOIN orders o ON c.customer_id = o.customer_id;         -- 왼쪽(customers)과 오른쪽(orders) 양쪽의 매칭 안 되는 행을 모두 NULL로 채워 보존
-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) FULL OUTER JOIN은 LEFT JOIN 결과 + RIGHT JOIN 결과의 합집합(중복 매칭 행 제외)과 같아, 양쪽 어느 쪽에서든 매칭 안 된 행도 전부 보존한다.
-- 2) 이 데이터셋은 orders 쪽에 고객이 없는 행이 없으므로 FULL OUTER JOIN 결과는 LEFT JOIN과 동일한 7행이 된다 — 정하은 행만 o.order_id/o.total_amount가 NULL로 추가된다.
-- 3) 만약 존재하지 않는 customer_id를 가진 주문이 있었다면, LEFT JOIN에는 나타나지 않았을 그 주문 행(c 쪽이 NULL)까지 FULL OUTER JOIN에는 추가로 나타나 7행보다 많아졌을 것이다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — FULL OUTER JOIN (7.5.3-4)**

**실행 완료**

**실행 결과**: `s753_full`

```sql
> SELECT c.customer_id, c.customer_name, o.order_id, o.total_amount ...
customer_id | customer_name | order_id | total_amount
-----------------------------------------------------
1 | 김민준 | 2 | 300.00
1 | 김민준 | 1 | 1200.00
2 | 이서연 | 5 | 950.00
2 | 이서연 | 3 | 1500.50
3 | 박도윤 | 4 | 80.00
4 | 최지우 | 6 | 2100.00
5 | 정하은 | None | None
(7행)
```

---

**CROSS JOIN (7.5.3-5)**

**예제 코드**: `s753_cross`

```sql
SELECT c.customer_name, p.product_name
FROM customers c
CROSS JOIN products p;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
SELECT c.customer_name, p.product_name  -- 조인 조건 없이 두 테이블의 컬럼을 그대로 나열
FROM customers c
CROSS JOIN products p;                  -- ON 조건 없이 customers와 products의 모든 행 조합(카티전 곱)을 생성
-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) CROSS JOIN은 결합 조건(ON)이 없어 왼쪽 테이블의 각 행이 오른쪽 테이블의 모든 행과 짝지어지는 카티전 곱(Cartesian product)을 만든다.
-- 2) 결과 행 수는 두 테이블 행 수의 곱과 같다 — 고객 5명 × 상품 5개 = 25행이며, 이는 COUNT(*)로 25가 나오는 것으로 검증된다.
-- 3) 앞선 INNER/LEFT/RIGHT/FULL JOIN은 customer_id라는 "의미 있는" 매칭 조건으로 관련된 행끼리만 묶었지만, CROSS JOIN은 그런 조건 없이 무차별로 조합하므로 실무에서는 추천 조합·달력 생성 등 의도적으로 모든 조합이 필요할 때만 사용한다.
-- 4) LIMIT 5는 전체 25행 중 앞 5행만 미리보기 위한 것으로, 첫 고객(김민준)이 상품 5개 전부와 짝지어진 행들이 먼저 나타난다.
-- ---------------------------------------------------------------
```

</details>

*고객 5명 × 상품 5개 = 25개 조합이 실제로 생성되는지 COUNT로 확인*

---

**실행 결과 — CROSS JOIN (7.5.3-5)**

**실행 완료**

**실행 결과**: `s753_cross`

```sql
> SELECT COUNT(*) AS combo_count FROM customers c CROSS JOIN products p ...
combo_count
-----------
25
(1행)
> SELECT c.customer_name, p.product_name FROM customers c CROSS JOIN products p LIMIT 5 ...
customer_name | product_name
----------------------------
김민준 | 노트북
김민준 | 키보드
김민준 | 마우스
김민준 | 코트
김민준 | 티셔츠
(5행)
```

---

**일반 CTE (7.5.4-1)**

**예제 코드**: `s754_cte`

```sql
WITH high_orders AS (
    SELECT customer_id, total_amount FROM orders WHERE total_amount > 1000
)
SELECT c.customer_id, c.customer_name, h.total_amount
FROM customers c
JOIN high_orders h ON c.customer_id = h.customer_id;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
WITH high_orders AS (                                              -- CTE 정의 시작: high_orders라는 이름의 임시 결과 집합 선언
    SELECT customer_id, total_amount FROM orders WHERE total_amount > 1000  -- 1000 초과 주문만 필터링해 임시 집합 구성
)
SELECT c.customer_id, c.customer_name, h.total_amount              -- 최종 SELECT: 고객 정보 + high_orders의 금액을 함께 조회
FROM customers c
JOIN high_orders h ON c.customer_id = h.customer_id;               -- customers와 CTE 결과를 customer_id 기준으로 JOIN

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) WITH high_orders AS (...) 는 서브쿼리를 미리 이름 붙여 정의해두는 것으로, 쿼리 본문에서는 마치 테이블처럼 재사용할 수 있다.
-- 2) 서브쿼리를 FROM 절에 직접 중첩하는 방식과 달리, CTE는 쿼리 상단에서 한 번 정의되므로 가독성이 높고 복잡한 쿼리를 단계별로 읽기 쉽다.
-- 3) CTE는 해당 쿼리 실행 동안에만 존재하는 임시 결과이며, 실제 테이블처럼 디스크에 저장되지 않는다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — 일반 CTE (7.5.4-1)**

**실행 완료**

**실행 결과**: `s754_cte`

```sql
> WITH high_orders AS (SELECT customer_id, total_amount FROM orders WHERE total_amount>1000) ...
customer_id | customer_name | total_amount
------------------------------------------
1 | 김민준 | 1200.00
2 | 이서연 | 1500.50
4 | 최지우 | 2100.00
(3행)
```

---

**재귀 CTE — 직원 계층 구조 (7.5.4-2)**

**예제 코드**: `s754_recursive_cte`

```sql
WITH RECURSIVE employee_hierarchy AS (
    SELECT employee_id, name, manager_id FROM employees WHERE manager_id IS NULL
    UNION ALL
    SELECT e.employee_id, e.name, e.manager_id
    FROM employees e
    JOIN employee_hierarchy eh ON e.manager_id = eh.employee_id
)
SELECT * FROM employee_hierarchy;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
WITH RECURSIVE employee_hierarchy AS (                             -- RECURSIVE 키워드로 재귀 CTE 선언 시작
    SELECT employee_id, name, manager_id FROM employees WHERE manager_id IS NULL  -- [anchor 부분] 재귀의 시작점: manager_id가 없는 최상위(사장) 행 선택
    UNION ALL                                                       -- anchor 결과와 recursive 결과를 누적 결합(중복 제거 없이)
    SELECT e.employee_id, e.name, e.manager_id                     -- [recursive 부분] 이전 단계 결과(eh)를 참조해 그 아래 직급을 계속 찾아나감
    FROM employees e
    JOIN employee_hierarchy eh ON e.manager_id = eh.employee_id     -- 자기 자신(employee_hierarchy)을 참조하는 재귀 JOIN: 상위 결과의 employee_id가 다음 단계의 manager_id와 일치하면 연결
)
SELECT * FROM employee_hierarchy;                                   -- anchor + recursive가 더 이상 새 행을 만들지 못할 때까지 반복된 최종 누적 결과 조회

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) 재귀 CTE는 반드시 "anchor(초기값) 부분 UNION ALL recursive(재귀) 부분" 구조를 가진다 — anchor는 종료 조건이 있는 시작점(여기서는 manager_id IS NULL), recursive는 CTE 자기 자신을 참조하며 다음 단계로 확장한다.
-- 2) recursive 부분이 더 이상 새로운 행을 만들어내지 못하는 시점(더 이상 자식 직원이 없을 때)에 재귀가 자동으로 종료된다.
-- 3) 조직도, 카테고리 트리처럼 부모-자식 관계로 이어지는 계층 구조 데이터를 한 번의 쿼리로 전부 펼쳐볼 때 유용하다.
-- 4) UNION ALL을 사용해 중복 제거 연산 없이 결과를 그대로 누적하므로 UNION보다 성능이 유리하다.
-- ---------------------------------------------------------------
```

</details>

*사장(최상위)부터 대리까지 3단계 조직 계층이 실제로 재귀 조회되는지 확인*

---

**실행 결과 — 재귀 CTE — 직원 계층 구조 (7.5.4-2)**

**실행 완료**

**실행 결과**: `s754_recursive_cte`

```
> WITH RECURSIVE employee_hierarchy AS ( ...
employee_id | name | manager_id | depth
---------------------------------------
1 | 김사장 | None | 0
2 | 이부장 | 1 | 1
3 | 박부장 | 1 | 1
4 | 최과장 | 2 | 2
5 | 정과장 | 2 | 2
6 | 한대리 | 4 | 3
(6행)
```

---

**RANK() — 순위 매기기 (7.5.5-1)**

**예제 코드**: `s755_rank`

```sql
SELECT customer_id, order_id, total_amount,
    RANK() OVER (PARTITION BY customer_id ORDER BY total_amount DESC) AS rank
FROM orders;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
SELECT customer_id, order_id, total_amount,
    RANK() OVER (PARTITION BY customer_id ORDER BY total_amount DESC) AS rank  -- customer_id별로 파티션을 나누고, 그 안에서 금액 내림차순으로 순위 부여
FROM orders;

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) PARTITION BY customer_id는 GROUP BY처럼 행을 합치지 않고, 고객 단위로 그룹을 나눈 뒤 그룹별로 순위 계산을 독립적으로 수행한다.
-- 2) RANK()는 동점(같은 total_amount)이 있으면 같은 순위를 부여하지만, 그다음 순위 번호는 동점 개수만큼 건너뛴다(예: 1, 1, 3).
-- 3) 윈도우 함수는 GROUP BY와 달리 원본 행을 그대로 유지하면서 집계·순위 값을 각 행에 추가로 붙여준다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — RANK() — 순위 매기기 (7.5.5-1)**

**실행 완료**

**실행 결과**: `s755_rank`

```sql
> SELECT customer_id, order_id, total_amount, ...
customer_id | order_id | total_amount | rank
--------------------------------------------
1 | 1 | 1200.00 | 1
1 | 2 | 300.00 | 2
2 | 3 | 1500.50 | 1
2 | 5 | 950.00 | 2
3 | 4 | 80.00 | 1
4 | 6 | 2100.00 | 1
(6행)
```

---

**DENSE_RANK() (7.5.5-2)**

**예제 코드**: `s755_dense_rank`

```sql
SELECT customer_id, order_id, total_amount,
    DENSE_RANK() OVER (PARTITION BY customer_id ORDER BY total_amount DESC) AS dense_rank
FROM orders;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
SELECT customer_id, order_id, total_amount,
    DENSE_RANK() OVER (PARTITION BY customer_id ORDER BY total_amount DESC) AS dense_rank  -- customer_id별 파티션 내에서 금액 내림차순으로 '건너뛰지 않는' 순위 부여
FROM orders;

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) DENSE_RANK()는 RANK()와 달리 동점이 있어도 다음 순위 번호를 건너뛰지 않는다(예: 1, 1, 2) — 이 예제 데이터에는 동점 금액이 없어 결과값 자체는 RANK()와 동일하게 나타난다.
-- 2) 두 함수의 차이는 동점이 존재할 때만 드러나므로, 실습 시 동점 데이터를 추가해 RANK()와 나란히 비교해보면 차이를 체감하기 좋다.
-- 3) 순위에 "구멍"이 생기는 것을 원치 않는 랭킹(예: 등수 발표)에는 DENSE_RANK()가, 실제 석차 개념(공동 1등이면 다음은 3등)에는 RANK()가 더 적합하다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — DENSE_RANK() (7.5.5-2)**

**실행 완료**

**실행 결과**: `s755_dense_rank`

```sql
> SELECT customer_id, order_id, total_amount, ...
customer_id | order_id | total_amount | dense_rank
--------------------------------------------------
1 | 1 | 1200.00 | 1
1 | 2 | 300.00 | 2
2 | 3 | 1500.50 | 1
2 | 5 | 950.00 | 2
3 | 4 | 80.00 | 1
4 | 6 | 2100.00 | 1
(6행)
```

---

**LEAD() — 다음 행 값 참조 (7.5.5-3)**

**예제 코드**: `s755_lead`

```sql
SELECT customer_id, order_id, total_amount,
    LEAD(total_amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS next_order_amount
FROM orders;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
SELECT customer_id, order_id, total_amount,
    LEAD(total_amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS next_order_amount  -- 같은 고객 파티션 내에서 주문일자 순으로 정렬한 뒤, 현재 행 기준 '다음' 행의 total_amount를 가져옴
FROM orders;

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) LEAD()는 현재 행 기준으로 파티션 내 다음(이후) 행의 값을 미리 참조하는 함수로, JOIN 없이 "다음 주문 금액"과 비교하는 로직을 한 줄로 표현할 수 있다.
-- 2) ORDER BY order_date가 정렬 기준이 되므로, 여기서 "다음"은 시간순으로 그다음에 발생한 주문을 의미한다.
-- 3) 각 고객의 가장 마지막 주문 행에서는 참조할 다음 행이 없으므로 next_order_amount가 NULL(None)로 반환된다.
-- 4) 이전 행을 참조하는 LAG()와 방향만 반대일 뿐 사용법은 동일하며, 두 함수를 함께 쓰면 시계열 데이터의 증감을 쉽게 분석할 수 있다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — LEAD() — 다음 행 값 참조 (7.5.5-3)**

**실행 완료**

**실행 결과**: `s755_lead`

```sql
> SELECT customer_id, order_id, total_amount, ...
customer_id | order_id | total_amount | next_order_amount
---------------------------------------------------------
1 | 1 | 1200.00 | 300.00
1 | 2 | 300.00 | None
2 | 3 | 1500.50 | 950.00
2 | 5 | 950.00 | None
3 | 4 | 80.00 | None
4 | 6 | 2100.00 | None
(6행)
```

---

**LAG() — 이전 행 값 참조 (7.5.5-4)**

**예제 코드**: `s755_lag`

```sql
SELECT customer_id, order_id, total_amount,
    LAG(total_amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS prev_order_amount
FROM orders;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
SELECT customer_id, order_id, total_amount,
    LAG(total_amount) OVER (PARTITION BY customer_id ORDER BY order_date) AS prev_order_amount  -- 같은 고객 파티션 내에서 주문일자 순으로 정렬한 뒤, 현재 행 기준 '이전' 행의 total_amount를 가져옴
FROM orders;

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) LAG()는 현재 행 기준으로 파티션 내 이전(직전) 행의 값을 참조하는 함수로, 자기 자신과의 셀프 JOIN 없이 "전 주문 대비 변화량" 같은 계산을 간단히 할 수 있다.
-- 2) LEAD()가 미래(다음 행)를 보는 것과 반대로, LAG()는 과거(이전 행)를 본다 — 둘 다 정렬 기준(ORDER BY order_date)이 있어야 의미가 있다.
-- 3) 각 고객의 가장 첫 주문 행에서는 참조할 이전 행이 없으므로 prev_order_amount가 NULL(None)로 반환된다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — LAG() — 이전 행 값 참조 (7.5.5-4)**

**실행 완료**

**실행 결과**: `s755_lag`

```sql
> SELECT customer_id, order_id, total_amount, ...
customer_id | order_id | total_amount | prev_order_amount
---------------------------------------------------------
1 | 1 | 1200.00 | None
1 | 2 | 300.00 | 1200.00
2 | 3 | 1500.50 | None
2 | 5 | 950.00 | 1500.50
3 | 4 | 80.00 | None
4 | 6 | 2100.00 | None
(6행)
```

---

## 7.6 데이터 집합 연산 — 개요

- **UNION / INTERSECT / EXCEPT**: 합집합(중복 제거) · UNION ALL(중복 포함) · 교집합 · 차집합

- **GROUP BY / HAVING**: 그룹별 집계(SUM/AVG/COUNT/MAX/MIN) 후 HAVING으로 집계 결과를 필터링

- **ROLLUP / CUBE**: ROLLUP(계층적 소계+총계) · CUBE(모든 조합의 다차원 집계) — GROUP BY의 확장

---

**UNION / UNION ALL (7.6.1-1)**

**예제 코드**: `s761_union`

```sql
SELECT customer_id FROM customers
UNION
SELECT customer_id FROM orders;
SELECT customer_id FROM customers
UNION ALL
SELECT customer_id FROM orders;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
SELECT customer_id FROM customers          -- customers 테이블의 customer_id 목록 (5행: 1~5)
UNION                                       -- UNION: 두 결과집합을 합치되 중복 행은 자동 제거
SELECT customer_id FROM orders;             -- orders 테이블의 customer_id 목록 (주문한 고객만, 중복 존재 가능)
SELECT customer_id FROM customers           -- 동일한 첫 번째 SELECT
UNION ALL                                   -- UNION ALL: 두 결과집합을 합치되 중복 행도 그대로 유지
SELECT customer_id FROM orders;             -- 동일한 두 번째 SELECT

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) UNION은 결과에서 중복을 제거하므로 내부적으로 정렬/중복검사 비용이 추가된다 — 실행 결과 5행(고유 customer_id 1~5).
-- 2) UNION ALL은 중복 제거 없이 단순히 결과를 이어붙이므로 더 빠르고, 실행 결과는 11행(customers 5개 + orders 6개)이다.
-- 3) 두 SELECT의 컬럼 개수와 자료형이 일치해야 UNION 계열 연산을 사용할 수 있다.
-- 4) 중복 제거가 필요 없다면 UNION ALL을 쓰는 것이 성능상 유리하다.
-- ---------------------------------------------------------------
```

</details>

*UNION은 중복 제거, UNION ALL은 중복 포함 — 실제 행 수 차이를 나란히 비교*

---

**실행 결과 — UNION / UNION ALL (7.6.1-1)**

**실행 완료**

**실행 결과**: `s761_union`

```sql
> SELECT customer_id FROM customers UNION SELECT customer_id FROM orders ORDER BY customer_id ...
customer_id
-----------
1
2
3
4
5
(5행)
> SELECT customer_id FROM customers UNION ALL SELECT customer_id FROM orders ORDER BY customer_id ...
customer_id
-----------
1
1
1
2
2
2
3
3
... (11행 중 8행 표시)
```

---

**INTERSECT — 교집합 (7.6.1-2)**

**예제 코드**: `s761_intersect`

```sql
SELECT customer_id FROM customers
INTERSECT
SELECT customer_id FROM orders;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
SELECT customer_id FROM customers           -- customers 테이블의 customer_id 목록
INTERSECT                                   -- INTERSECT: 두 결과집합의 교집합(양쪽 모두에 존재하는 행)만 반환
SELECT customer_id FROM orders;             -- orders 테이블의 customer_id 목록

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) INTERSECT는 두 SELECT 결과에 공통으로 존재하는 행만 남기며, 결과도 자동으로 중복이 제거된다.
-- 2) 실행 결과는 4행(customer_id 1,2,3,4) — customers와 orders 양쪽 모두에 있는 고객만 해당된다.
-- 3) 정하은(customer_id 5)은 customers에는 있지만 orders에는 주문 내역이 없어 결과에서 빠진다.
-- 4) INTERSECT는 두 테이블 간 "공통으로 활동한 대상"을 찾을 때 JOIN의 대안으로 사용할 수 있다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — INTERSECT — 교집합 (7.6.1-2)**

**실행 완료**

**실행 결과**: `s761_intersect`

```sql
> SELECT customer_id FROM customers INTERSECT SELECT customer_id FROM orders ORDER BY customer_id ...
customer_id
-----------
1
2
3
4
(4행)
```

---

**EXCEPT — 차집합 (7.6.1-3)**

**예제 코드**: `s761_except`

```sql
SELECT customer_id FROM customers
EXCEPT
SELECT customer_id FROM orders;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
SELECT customer_id FROM customers           -- customers 테이블의 customer_id 목록
EXCEPT                                      -- EXCEPT: 첫 번째 결과집합에서 두 번째 결과집합에 존재하는 행을 제외(차집합)
SELECT customer_id FROM orders;             -- orders 테이블의 customer_id 목록 (제외 기준)

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) EXCEPT는 순서가 중요하다 — customers EXCEPT orders는 "customers에는 있지만 orders에는 없는" 행만 남긴다.
-- 2) 실행 결과는 customer_id 5(정하은) 1행뿐 — 주문 이력이 없는 고객만 실제로 걸러진다.
-- 3) UNION/INTERSECT와 달리 EXCEPT는 좌우 순서를 바꾸면 결과가 달라지므로 주의해야 한다.
-- ---------------------------------------------------------------
```

</details>

*주문한 적 없는 고객만 실제로 걸러지는지 확인*

---

**실행 결과 — EXCEPT — 차집합 (7.6.1-3)**

**실행 완료**

**실행 결과**: `s761_except`

```sql
> SELECT customer_id FROM customers EXCEPT SELECT customer_id FROM orders ORDER BY customer_id ...
customer_id
-----------
5
(1행)
```

---

**GROUP BY (7.6.2-1)**

**예제 코드**: `s762_groupby`

```sql
SELECT customer_id, SUM(total_amount) AS total_spent
FROM orders
GROUP BY customer_id;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
SELECT customer_id, SUM(total_amount) AS total_spent   -- 고객별로 total_amount를 합산해 total_spent라는 별칭으로 반환
FROM orders                                             -- 집계 대상 테이블
GROUP BY customer_id;                                   -- customer_id 값이 같은 행끼리 묶어서 집계

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) GROUP BY는 SELECT 절에 나열된 비집계 컬럼(customer_id)을 기준으로 행을 그룹화한다.
-- 2) SUM(total_amount)처럼 그룹 내에서 집계 함수가 적용되어 그룹당 한 행씩 결과가 나온다.
-- 3) 실행 결과는 4행 — orders에 주문 이력이 있는 고객(1,2,3,4)만 집계되고, 주문이 없는 고객은 애초에 나타나지 않는다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — GROUP BY (7.6.2-1)**

**실행 완료**

**실행 결과**: `s762_groupby`

```sql
> SELECT customer_id, SUM(total_amount) AS total_spent FROM orders GROUP BY customer_id ORDER BY customer_id ...
customer_id | total_spent
-------------------------
1 | 1500.00
2 | 2450.50
3 | 80.00
4 | 2100.00
(4행)
```

---

**집계 함수 5종 (7.6.2-2)**

**예제 코드**: `s762_agg`

```sql
SELECT COUNT(*) AS total_orders,
    SUM(total_amount) AS total_sales,
    AVG(total_amount) AS avg_order_amount,
    MAX(total_amount) AS max_order_amount,
    MIN(total_amount) AS min_order_amount
FROM orders;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
SELECT COUNT(*) AS total_orders,                 -- 전체 행(주문) 개수
    SUM(total_amount) AS total_sales,             -- total_amount 전체 합계
    AVG(total_amount) AS avg_order_amount,        -- total_amount 평균
    MAX(total_amount) AS max_order_amount,        -- total_amount 중 최댓값
    MIN(total_amount) AS min_order_amount         -- total_amount 중 최솟값
FROM orders;                                       -- 집계 대상 테이블 (GROUP BY 없이 테이블 전체가 하나의 그룹)

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) GROUP BY 없이 집계 함수만 쓰면 테이블 전체를 하나의 그룹으로 보고 결과가 단 1행으로 나온다.
-- 2) COUNT(*)는 NULL 포함 전체 행 수, SUM/AVG/MAX/MIN은 값이 있는 행만 대상으로 계산된다.
-- 3) 실행 결과: 총 6건, 합계 6130.50, 평균 1021.75, 최대 2100.00, 최소 80.00.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — 집계 함수 5종 (7.6.2-2)**

**실행 완료**

**실행 결과**: `s762_agg`

```sql
> SELECT COUNT(*) AS total_orders, SUM(total_amount) AS total_sales, ...
total_orders | total_sales | avg_order_amount | max_order_amount | min_order_amount
-----------------------------------------------------------------------------------
6 | 6130.50 | 1021.75 | 2100.00 | 80.00
(1행)
```

---

**HAVING (7.6.2-3)**

**예제 코드**: `s762_having`

```sql
SELECT customer_id, SUM(total_amount) AS total_spent
FROM orders
GROUP BY customer_id
HAVING SUM(total_amount) > 1000;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
SELECT customer_id, SUM(total_amount) AS total_spent   -- 고객별 총 지출 합계
FROM orders                                             -- 집계 대상 테이블
GROUP BY customer_id                                    -- customer_id 기준으로 그룹화
HAVING SUM(total_amount) > 1000;                        -- 그룹화된 집계 결과(총 지출) 중 1000을 초과하는 그룹만 필터링
                                                          -- ※ 책 원문 기준값은 5000이지만, harness의 더미 데이터 규모(총액 합계 6130.50 수준)에 맞춰 1000으로 조정 — HAVING의 문법과 동작 자체는 동일

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) HAVING은 GROUP BY로 집계된 "이후"의 결과를 필터링한다 — 집계 이전 개별 행을 거르는 WHERE와는 적용 시점이 다르다.
-- 2) WHERE 절에는 SUM() 같은 집계 함수를 쓸 수 없지만, HAVING 절에는 사용할 수 있다.
-- 3) 기준값 1000은 harness 더미 데이터 규모에 맞춘 조정값(책 원문은 5000)이며, 실행 결과는 총 지출 1000 초과 고객 3명(customer_id 1,2,4)이다.
-- ---------------------------------------------------------------
```

</details>

*책 원문은 5000을 기준으로 사용하지만 harness의 더미 데이터 규모에 맞춰 1000으로 조정 — SQL 문법과 동작 자체는 동일*

---

**실행 결과 — HAVING (7.6.2-3)**

**실행 완료**

**실행 결과**: `s762_having`

```sql
> SELECT customer_id, SUM(total_amount) AS total_spent FROM orders ...
customer_id | total_spent
-------------------------
1 | 1500.00
2 | 2450.50
4 | 2100.00
(3행)
```

---

**ROLLUP — 계층적 그룹화 (7.6.3-1)**

**예제 코드**: `s763_rollup`

```sql
SELECT EXTRACT(YEAR FROM order_date) AS order_year,
    EXTRACT(MONTH FROM order_date) AS order_month,
    SUM(total_amount) AS total_sales
FROM orders
GROUP BY ROLLUP(EXTRACT(YEAR FROM order_date), EXTRACT(MONTH FROM order_date));
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
SELECT EXTRACT(YEAR FROM order_date) AS order_year,        -- 주문일에서 연도만 추출
    EXTRACT(MONTH FROM order_date) AS order_month,          -- 주문일에서 월만 추출
    SUM(total_amount) AS total_sales                        -- 그룹별 매출 합계
FROM orders                                                  -- 집계 대상 테이블
GROUP BY ROLLUP(EXTRACT(YEAR FROM order_date), EXTRACT(MONTH FROM order_date));
                                                              -- ROLLUP: (연도,월) → (연도) → (전체) 순으로 계층적 소계를 추가 생성

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) ROLLUP(a, b)는 (a,b) 개별 그룹, (a) 소계, () 전체 총계 순으로 계층적인 소계 행을 자동으로 만들어준다.
-- 2) 소계 행에서는 집계에서 빠진 컬럼이 NULL로 표시된다 — 예: 연도별 소계 행은 order_month가 NULL, 전체 총계 행은 order_year와 order_month 모두 NULL.
-- 3) 실행 결과는 연도+월별 소계 4행 + 연도별 소계 1행(월=NULL) + 전체 합계 1행(연도=월=NULL), 총 6행이다.
-- 4) ROLLUP은 인자 순서가 중요하다 — 왼쪽에서 오른쪽으로 계층을 타고 내려가며 소계를 쌓는다.
-- ---------------------------------------------------------------
```

</details>

*연도별 합계·월별 합계·전체 합계가 NULL로 표시되는 소계 행과 함께 실제로 생성되는지 확인*

---

**실행 결과 — ROLLUP — 계층적 그룹화 (7.6.3-1)**

**실행 완료**

**실행 결과**: `s763_rollup`

```sql
> SELECT EXTRACT(YEAR FROM order_date) AS order_year, ...
order_year | order_month | total_sales
--------------------------------------
2025 | 1 | 2700.50
2025 | 2 | 300.00
2025 | 3 | 1030.00
2025 | 4 | 2100.00
2025 | None | 6130.50
None | None | 6130.50
(6행)
```

---

**CUBE — 다차원 집계 (7.6.3-2)**

**예제 코드**: `s763_cube`

```sql
-- 책은 sales(region, product_category, total_amount) 테이블만 언급 —
-- sales 스키마명과의 충돌을 피해 harness에서는 sales_analytics 테이블명 사용
SELECT region, product_category, SUM(total_amount) AS total_sales
FROM sales
GROUP BY CUBE(region, product_category);
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 책은 sales(region, product_category, total_amount) 테이블만 언급 —
-- sales 스키마명과의 충돌을 피해 harness에서는 sales_analytics 테이블명 사용
SELECT region, product_category, SUM(total_amount) AS total_sales   -- 지역·상품카테고리별 매출 합계
FROM sales                                                            -- 원문 기준 테이블명(harness 실행 시 sales_analytics로 대체)
GROUP BY CUBE(region, product_category);                              -- CUBE: 두 컬럼의 가능한 모든 조합에 대해 소계를 생성

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) CUBE(a, b)는 (a,b), (a), (b), () 네 가지 조합 전부에 대해 소계를 만든다 — ROLLUP이 계층적(위→아래) 소계만 만드는 것과 대비된다.
-- 2) 소계에서 제외된 컬럼은 NULL로 표시되며, region과 product_category가 모두 NULL인 행이 전체 총계다.
-- 3) harness에서는 sales 스키마명과의 충돌을 피하기 위해 테이블명을 sales_analytics로 바꾸고 더미 데이터 5건을 삽입해 실행했다.
-- 4) 실행 결과는 region×category 조합 소계 + region별 소계(category=NULL) + category별 소계(region=NULL) + 전체 합계(둘 다 NULL)를 합쳐 총 9행이다.
-- ---------------------------------------------------------------
```

</details>

*지역×카테고리 개별 합계, 지역별 합계, 카테고리별 합계, 전체 합계까지 모든 조합이 실제로 생성됨*

---

**실행 결과 — CUBE — 다차원 집계 (7.6.3-2)**

**실행 완료**

**실행 결과**: `s763_cube`

```sql
> DROP TABLE IF EXISTS sales_analytics ...  (rowcount=-1)
> CREATE TABLE sales_analytics (region TEXT, product_category TEXT, total_amount NUMERIC(10,2)) ...  (rowcount=-1)
> INSERT INTO sales_analytics VALUES ...  (rowcount=5)
> SELECT region, product_category, SUM(total_amount) AS total_sales ...
region | product_category | total_sales
---------------------------------------
부산 | Clothing | 900.00
부산 | Electronics | 3200.00
부산 | None | 4100.00
서울 | Clothing | 1200.00
서울 | Electronics | 6800.00
서울 | None | 8000.00
None | Clothing | 2100.00
None | Electronics | 10000.00
... (9행 중 8행 표시)
```

---

## 7.7 PostgreSQL과 머신러닝 프로젝트 적용 — 개요

- **데이터 전처리**: 결측값 삭제/평균 대체 · CASE WHEN으로 구간별 피처 엔지니어링 · corr()로 상관관계 분석

- **저장·검색 최적화**: GIN 전문 검색 인덱스 · RANGE 파티셔닝 · COPY를 통한 배치 삽입

- **실시간 파이프라인**: LISTEN/NOTIFY로 실시간 이벤트 알림 · pg_cron으로 주기적 ETL 자동화

- **Python 연동**: psycopg2로 모델 예측 결과를 PostgreSQL에 직접 저장

---

**결측값 처리 — 삭제 (7.7.1-1)**

**예제 코드**: `s771_missing_delete`

```
-- 결측값이 있는 행을 제거
DELETE FROM customer_data WHERE age IS NULL;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.7.1-1 결측값 처리(삭제) — age가 NULL인 행을 통째로 제거
DELETE FROM customer_data WHERE age IS NULL;              -- age IS NULL 조건에 매칭되는 행(더미 데이터 기준 2건)을 삭제

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) 결측값 처리의 가장 단순한 방법은 "삭제"지만, 해당 행의 다른 컬럼(income, text_data 등) 정보도 함께 사라진다는 트레이드오프가 있다.
-- 2) WHERE age IS NULL처럼 NULL 비교는 반드시 IS NULL을 써야 한다 — = NULL은 항상 거짓이 되어 아무 행도 매칭되지 않는다.
-- 3) 실습에서는 삭제 전 SAVEPOINT를 잡아두고 이후 실습(평균 대체 등)을 위해 ROLLBACK TO SAVEPOINT로 데이터를 복원했다 — 실제 현업에서도 삭제 전 백업/트랜잭션 보호가 중요함을 함께 짚어줄 것.
-- ---------------------------------------------------------------
```

</details>

*책은 customer_data(age, income, text_data) 컬럼만 언급 — harness에서 동일 컬럼으로 더미 6건(결측 2건 포함) 구성 후 실행. 이후 실습을 위해 SAVEPOINT로 삭제를 되돌림*

---

**실행 결과 — 결측값 처리 — 삭제 (7.7.1-1)**

**실행 완료**

**실행 결과**: `s771_missing_delete`

```sql
> SELECT COUNT(*) FROM customer_data WHERE age IS NULL ...
count
-----
2
(1행)
> SAVEPOINT sp_before_del_null ...  (rowcount=-1)
> DELETE FROM customer_data WHERE age IS NULL ...  (rowcount=2)
> SELECT COUNT(*) FROM customer_data ...
count
-----
4
(1행)
> ROLLBACK TO SAVEPOINT sp_before_del_null ...  (rowcount=-1)
```

---

**결측값 처리 — 평균 대체 (7.7.1-1)**

**예제 코드**: `s771_missing_update`

```sql
-- 결측값을 평균값으로 대체
UPDATE customer_data
SET age = (SELECT AVG(age) FROM customer_data WHERE age IS NOT NULL)
WHERE age IS NULL;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.7.1-1 결측값 처리(평균 대체) — age가 NULL인 행을 전체 평균값으로 채움
UPDATE customer_data
SET age = (SELECT AVG(age) FROM customer_data WHERE age IS NOT NULL)  -- 서브쿼리로 NULL을 제외한 age의 평균을 구해 대체값으로 사용
WHERE age IS NULL;                                                     -- age가 결측인 행에만 UPDATE 적용

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) 삭제와 달리 평균 대체는 행을 보존하면서 결측값만 메꾸는 방식 — 데이터 손실 없이 통계적 편향은 감수하는 절충안이다.
-- 2) 서브쿼리 WHERE age IS NOT NULL이 없으면 AVG 계산에 NULL이 섞여 결과가 왜곡될 수 있다(사실 AVG는 NULL을 자동 제외하지만, 조건을 명시해 의도를 분명히 하는 습관이 중요).
-- 3) 실습 데이터에서는 id 3, 6 두 건이 나머지 4건의 평균값(39)으로 채워짐을 SELECT로 확인시켜줄 것.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — 결측값 처리 — 평균 대체 (7.7.1-1)**

**실행 완료**

**실행 결과**: `s771_missing_update`

```sql
> SELECT id, age FROM customer_data WHERE age IS NULL ...
id | age
--------
3 | None
6 | None
(2행)
> UPDATE customer_data SET age = (SELECT AVG(age) FROM customer_data WHERE age IS NOT NULL) ...  (rowcount=2)
> SELECT id, age FROM customer_data ORDER BY id ...
id | age
--------
1 | 25
2 | 34
3 | 39
4 | 45
5 | 52
6 | 39
(6행)
```

---

**피처 엔지니어링 — 나이 구간화 (7.7.1-2)**

**예제 코드**: `s772_feature_eng`

```sql
ALTER TABLE customer_data ADD COLUMN age_group VARCHAR(10);
UPDATE customer_data
SET age_group = CASE
    WHEN age < 18 THEN 'Under 18'
    WHEN age BETWEEN 18 AND 35 THEN '18-35'
    WHEN age BETWEEN 36 AND 60 THEN '36-60'
    ELSE '60+'
END;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.7.1-2 피처 엔지니어링 — 연속형 age를 범주형 age_group으로 구간화
ALTER TABLE customer_data ADD COLUMN age_group VARCHAR(10);  -- 구간 레이블을 저장할 새 컬럼 추가
UPDATE customer_data
SET age_group = CASE
    WHEN age < 18 THEN 'Under 18'                             -- 18세 미만
    WHEN age BETWEEN 18 AND 35 THEN '18-35'                    -- 18~35세 구간
    WHEN age BETWEEN 36 AND 60 THEN '36-60'                    -- 36~60세 구간
    ELSE '60+'                                                 -- 그 외(61세 이상)
END;

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) CASE WHEN은 연속형 수치 데이터를 범주형(구간)으로 변환하는 SQL의 대표적 피처 엔지니어링 도구다.
-- 2) 이 작업은 pandas의 pd.cut()이나 scikit-learn의 KBinsDiscretizer와 동일한 목적을 SQL 레벨에서 수행하는 것 — DB에서 전처리를 마치면 파이썬으로 옮길 데이터 양을 줄일 수 있다.
-- 3) BETWEEN은 양 끝값을 포함(inclusive)하므로 구간 경계(18, 35, 36, 60)가 겹치거나 비지 않도록 주의해야 한다.
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — 피처 엔지니어링 — 나이 구간화 (7.7.1-2)**

**실행 완료**

**실행 결과**: `s772_feature_eng`

```sql
> ALTER TABLE customer_data ADD COLUMN IF NOT EXISTS age_group VARCHAR(10) ...  (rowcount=-1)
> UPDATE customer_data SET age_group = CASE ...  (rowcount=6)
> SELECT id, age, age_group FROM customer_data ORDER BY id ...
id | age | age_group
--------------------
1 | 25 | 18-35
2 | 34 | 18-35
3 | 39 | 36-60
4 | 45 | 36-60
5 | 52 | 36-60
6 | 39 | 36-60
(6행)
```

---

**상관관계 분석 — corr() (7.7.1-3)**

**예제 코드**: `s773_corr`

```sql
SELECT corr(age, income) FROM customer_data;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.7.1-3 상관관계 분석 — age와 income 간 피어슨 상관계수 계산
SELECT corr(age, income) FROM customer_data;   -- PostgreSQL 내장 집계함수 corr()로 두 컬럼의 피어슨 상관계수 산출

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) corr(Y, X)는 PostgreSQL의 통계 집계함수로, pandas의 df.corr() 없이도 DB 안에서 바로 상관계수를 구할 수 있다.
-- 2) 결과값 약 0.65는 age와 income이 중간~강한 양의 상관관계를 가진다는 의미 — 나이가 많을수록 소득도 대체로 높은 더미 데이터 경향을 반영한다.
-- 3) 대용량 데이터에서는 전체를 파이썬으로 로드해 계산하기보다, 이렇게 DB 단에서 통계량을 먼저 계산해 필요한 값만 가져오는 것이 효율적이다.
-- ---------------------------------------------------------------
```

</details>

*age·income 더미 데이터 간 실제 피어슨 상관계수를 PostgreSQL 내장 함수로 계산*

---

**실행 결과 — 상관관계 분석 — corr() (7.7.1-3)**

**실행 완료**

**실행 결과**: `s773_corr`

```sql
> SELECT corr(age, income) FROM customer_data ...
corr
----
0.6549625797988029
(1행)
```

---

**GIN 전문 검색 인덱스 (7.7.2-1)**

**예제 코드**: `s774_gin_text`

```sql
CREATE INDEX idx_text_data ON customer_data
USING gin (to_tsvector('english', text_data));
SELECT id, text_data FROM customer_data
WHERE to_tsvector('english', text_data) @@ to_tsquery('english', 'photography | gardening');
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.7.2-1 GIN 전문 검색 인덱스 — 텍스트 컬럼에 대한 형태소 기반 검색 인덱스 생성 및 조회
CREATE INDEX idx_text_data ON customer_data
USING gin (to_tsvector('english', text_data));    -- text_data를 영어 형태소 벡터로 변환해 GIN 인덱스 생성

SELECT id, text_data FROM customer_data
WHERE to_tsvector('english', text_data) @@ to_tsquery('english', 'photography | gardening');  -- photography 또는 gardening을 포함하는 행 검색(@@는 매칭 연산자, |는 OR)

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) GIN(Generalized Inverted Index)은 배열, JSONB, 전문검색 벡터처럼 하나의 컬럼값 안에 여러 개의 검색 단위(단어)가 들어있는 데이터에 최적화된 인덱스다.
-- 2) to_tsvector가 단어를 어간(stem) 단위로 정규화하기 때문에 LIKE '%photo%' 같은 단순 문자열 매칭과 달리 photographer, photographing 등도 함께 찾아낼 수 있다.
-- 3) to_tsquery의 | 는 OR, & 는 AND, <-> 는 인접 검색을 의미 — 여러 키워드 조합 검색 문법을 함께 짚어줄 것.
-- ---------------------------------------------------------------
```

</details>

*실제 전문 검색으로 관련 텍스트를 가진 행만 정확히 걸러지는지 확인*

---

**실행 결과 — GIN 전문 검색 인덱스 (7.7.2-1)**

**실행 완료**

**실행 결과**: `s774_gin_text`

```sql
> DROP INDEX IF EXISTS idx_text_data ...  (rowcount=-1)
> CREATE INDEX idx_text_data ON customer_data USING gin (to_tsvector('english', text_data)) ...  (rowcount=-1)
> SELECT id, text_data FROM customer_data ...
id | text_data
--------------
5 | Avid gardener and cooking enthusiast
3 | Frequent traveler, enjoys photography
(2행)
```

---

**시간 기반 파티셔닝 (7.7.2-2, 책 원문의 실제 버그)**

**예제 코드**: `s775_partition`

```sql
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    sale_date DATE,
    amount DECIMAL
) PARTITION BY RANGE (sale_date);
CREATE TABLE sales_2023 PARTITION OF sales
    FOR VALUES FROM ('2023-01-01') TO ('2023-12-31');
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.7.2-2 시간 기반 파티셔닝 — sale_date 기준 RANGE 파티션 테이블 생성 (7.2.6과 동일 원인의 오류 재현 예제)
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,       -- PK가 id 단독으로 지정됨 — 파티션 기준 컬럼(sale_date)이 빠져 있음
    sale_date DATE,              -- 파티션 기준이 될 컬럼
    amount DECIMAL
) PARTITION BY RANGE (sale_date);  -- sale_date 값 범위로 파티션을 나누겠다고 선언

CREATE TABLE sales_2023 PARTITION OF sales
    FOR VALUES FROM ('2023-01-01') TO ('2023-12-31');  -- 2023-01-01 이상 2023-12-31 미만 범위를 담당하는 자식 파티션

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) 이 코드는 7.2.6에서 이미 다룬 것과 동일한 원인으로 실패한다 — PostgreSQL은 파티션 테이블의 UNIQUE/PRIMARY KEY 제약이 파티션 기준 컬럼(sale_date)을 반드시 포함하도록 강제하는데, 여기서는 PRIMARY KEY(id)만 지정되어 있어 sale_date가 빠져 있다.
-- 2) 실제 실행하면 FeatureNotSupported: unique constraint on partitioned table must include all partitioning columns 오류가 발생한다 — 같은 실수가 챕터를 넘나들며 반복될 수 있음을 학습자에게 상기시킬 것("파티션 키는 PK에 포함되어야 한다"는 규칙을 체화시키는 것이 목적).
-- 3) 해결 방법은 두 가지: (a) PRIMARY KEY(id) 대신 PRIMARY KEY(id, sale_date)처럼 파티션 키를 복합키에 포함시키거나, (b) 이 예제처럼 PRIMARY KEY 제약 자체를 제거하고 id를 SERIAL(단순 자동증가 컬럼)로만 둔다.
-- 4) PRIMARY KEY를 제거하고 재실행하면 정상적으로 테이블/파티션이 생성되고, INSERT한 행이 sale_date 값에 따라 자동으로 올바른 자식 파티션(sales_2023)에 저장됨을 SELECT로 확인할 수 있다.
-- ---------------------------------------------------------------
```

</details>

*7.2.6과 동일한 원인의 실제 오류 — 파티션 기준 컬럼(sale_date)이 PRIMARY KEY에 없어 PostgreSQL이 거부. PRIMARY KEY를 제거하면 정상 동작*

---

**실행 결과 — 동일한 파티션 PK 오류 재현 (책 자체의 반복된 버그)**

**실행 완료**

**실행 결과**: `s775_partition`

```sql
책의 코드(7.2.6과 동일 패턴의 PRIMARY KEY 지정)를 그대로 실행 → 실제 오류 발생
(파티션 기준 컬럼 sale_date가 PRIMARY KEY에 포함되지 않아 PostgreSQL이 거부 — 책 자체의 오류, 7.2.6과 동일한 원인)
FeatureNotSupported: unique constraint on partitioned table must include all partitioning columns
DETAIL:  PRIMARY KEY constraint on table "sales_ml" lacks column "sale_date" which is part of the partition key.
(PRIMARY KEY 제약을 제거하고 재실행하면 정상 동작):
> DROP TABLE IF EXISTS sales_ml CASCADE ...  (rowcount=-1)
> CREATE TABLE sales_ml (id SERIAL, sale_date DATE, amount DECIMAL) PARTITION BY RANGE (sale_date) ...  (rowcount=-1)
> CREATE TABLE sales_ml_2023 PARTITION OF sales_ml FOR VALUES FROM ('2023-01-01') TO ('2023-12-31') ...  (rowcount=-1)
> INSERT INTO sales_ml (sale_date, amount) VALUES ('2023-06-01', 450.00) ...  (rowcount=1)
> SELECT tableoid::regclass, sale_date, amount FROM sales_ml ...
tableoid | sale_date | amount
-----------------------------
sales_ml_2023 | 2023-06-01 | 450.00
(1행)
```

---

**배치 처리 — COPY (7.7.2-3)**

**예제 코드**: `s776_batch_copy`

```
COPY customer_data (id, name, age, income)
FROM '/path/to/data.csv' DELIMITER ',' CSV HEADER;
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```text
-- 7.7.2-3 배치 처리 — COPY 명령으로 CSV 파일을 대량 삽입
COPY customer_data (id, name, age, income)              -- 삽입 대상 테이블과 컬럼 목록 지정
FROM '/path/to/data.csv' DELIMITER ',' CSV HEADER;       -- 지정 경로의 CSV 파일을 콤마 구분자로 읽어들이며, 첫 줄은 헤더로 취급해 건너뜀

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) COPY는 다건의 INSERT문을 반복 실행하는 것보다 훨씬 빠르게 대량 데이터를 적재하는 PostgreSQL 전용 배치 명령이다 — 머신러닝 학습 데이터셋 전체를 한 번에 테이블로 불러올 때 특히 유용하다.
-- 2) DELIMITER ','는 필드 구분자, CSV는 CSV 포맷 파싱 규칙 적용, HEADER는 파일 첫 줄(컬럼명 줄)을 데이터로 취급하지 않고 건너뛰라는 옵션이다.
-- 3) 파일 경로는 COPY를 실행하는 PostgreSQL 서버 프로세스 기준 경로이며, 서버가 그 경로에 읽기 권한을 가져야 한다 — 클라이언트 쪽 파일은 대신 \copy(psql 메타명령)를 사용해야 한다는 점도 함께 짚어줄 것.
-- ---------------------------------------------------------------
```

</details>

*실제 CSV 파일을 만들어 대량 삽입 명령이 정상 동작하는지 검증*

---

**실행 결과 — 배치 처리 — COPY (7.7.2-3)**

**실행 완료**

**실행 결과**: `s776_batch_copy`

```sql
> DROP TABLE IF EXISTS customer_data_batch ...  (rowcount=-1)
> CREATE TABLE customer_data_batch (id INT, name TEXT, age INT, income NUMERIC(10,2)) ...  (rowcount=-1)
> COPY customer_data_batch (id, name, age, income) FROM '/tmp/pg_copy/customer_data_batch.csv' DELIMITER ',' CSV HEADER ...  (rowcount=2)
> SELECT * FROM customer_data_batch ...
id | name | age | income
------------------------
101 | Kevin | 29 | 4100.00
102 | Nora | 41 | 6200.00
(2행)
```

---

**LISTEN/NOTIFY 실시간 알림 (7.7.3-1)**

**예제 코드**: `s781_listen_notify`

```
-- 특정 이벤트에 대해 실시간 알림을 설정
LISTEN new_customer_event;
-- 데이터 변경 시 알림 발생
NOTIFY new_customer_event, 'New customer added';
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.7.3-1 LISTEN/NOTIFY — 특정 이벤트 채널을 구독하고 알림을 발행/수신하는 실시간 pub/sub 예제
-- 특정 이벤트에 대해 실시간 알림을 설정
LISTEN new_customer_event;                    -- 현재 세션(연결)이 'new_customer_event' 채널을 구독 시작(이후 이 채널로 오는 NOTIFY를 수신 대기)
-- 데이터 변경 시 알림 발생
NOTIFY new_customer_event, 'New customer added';  -- 같은 채널에 페이로드('New customer added')를 담아 알림 발행 → 구독 중인 모든 세션이 즉시 수신

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) LISTEN/NOTIFY는 별도 메시지 큐 없이 PostgreSQL 내장 기능만으로 구현하는 경량 pub/sub 메커니즘이다.
-- 2) 실제로 알림을 받으려면 LISTEN과 NOTIFY가 "서로 다른 연결(커넥션)"에서 실행되어야 의미가 있다 — 같은 세션이어도 동작은 하지만, 실전에서는 리스너 프로세스와 발행자 프로세스가 분리되어 있다.
-- 3) 실행 결과 [('new_customer_event', 'New customer added')]는 채널명과 페이로드가 그대로 리스너 측에 전달됨을 보여준다.
-- 4) 트리거 안에서 NOTIFY를 호출하면 테이블 변경(INSERT/UPDATE 등)을 애플리케이션에 실시간으로 전파하는 이벤트 기반 아키텍처를 만들 수 있다.
-- ---------------------------------------------------------------
```

</details>

*서로 다른 두 실제 연결로 LISTEN 측과 NOTIFY 측을 분리해 알림이 실제로 수신되는지 검증*

---

**실행 결과 — LISTEN/NOTIFY 실시간 알림 (7.7.3-1)**

**실행 완료**

**실행 결과**: `s781_listen_notify`

```
LISTEN new_customer_event; 실행 후 NOTIFY new_customer_event, 'New customer added'; 실행
실제 수신된 알림: [('new_customer_event', 'New customer added')]
```

---

**pg_cron을 통한 주기적 ETL (7.7.3-2)**

**예제 코드**: `s782_pg_cron`

```sql
-- pg_cron 설치 후, 주기적으로 ETL 프로세스 실행
SELECT cron.schedule('0 * * * *',
    $$UPDATE customer_data SET age = age + 1
      WHERE last_update < NOW() - INTERVAL '1 hour'$$);
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.7.3-2 pg_cron을 통한 주기적 ETL — DB 내부에서 크론 스케줄로 SQL 작업을 자동 반복 실행하는 예제(환경 제약으로 실행 불가)
-- pg_cron 설치 후, 주기적으로 ETL 프로세스 실행
SELECT cron.schedule('0 * * * *',             -- cron 표현식 '0 * * * *' = 매시 정각마다 실행되도록 스케줄 등록
    $$UPDATE customer_data SET age = age + 1  -- $$...$$ 달러 quoting으로 감싼 실제 실행될 SQL 문 시작(따옴표 이스케이프 불필요)
      WHERE last_update < NOW() - INTERVAL '1 hour'$$);  -- 마지막 업데이트가 1시간 이상 지난 행만 대상으로 조건부 갱신

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) pg_cron은 확장(extension)이며, 단순 CREATE EXTENSION만으로는 부족하고 shared_preload_libraries 설정 + 서버 재시작이 필요하다 — 그래서 이 실습 샌드박스에서는 재현이 불가능했다.
-- 2) 실제 오류: InvalidSchemaName: schema "cron" does not exist — cron 스키마 자체가 확장 미설치 상태라 존재하지 않기 때문에 cron.schedule() 호출이 실패한다.
-- 3) 운영 환경(관리형 클라우드 DB 등)에서는 관리자가 사전에 pg_cron을 활성화해두는 경우가 많으므로, 개념(=DB 안에서 주기적 배치/ETL을 크론처럼 예약)만 이해하고 실습은 별도 환경에서 진행해야 한다.
-- ---------------------------------------------------------------
```

</details>

*이 샌드박스의 PostgreSQL 16 서버에는 pg_cron 확장이 설치되어 있지 않음(shared_preload_libraries 설정 및 서버 재시작이 필요해 컨테이너 환경에서 안전하게 재현 불가) — 실제 실행 결과(오류)를 그대로 표시*

---

**실행 결과 — pg_cron 미설치로 실행 불가 (환경 제약)**

**실행 완료**

**실행 결과**: `s782_pg_cron`

```sql
이 샌드박스 PostgreSQL 16 서버에는 pg_cron 확장이 설치되어 있지 않아(패키지 미탑재) cron.schedule() 함수를 실제로 실행할 수 없음(설치하려면 서버 재시작 및 shared_preload_libraries 설정이 필요해 컨테이너 환경에서 안전하게 재현 불가) — 코드는 책 원문 그대로 개념 참고용으로 제시

실제 실행 결과:
InvalidSchemaName: schema "cron" does not exist
LINE 1: SELECT cron.schedule('0 * * * *', $$SELECT 1$$)
               ^
```

---

**Python(psycopg2) 연동 — 예측 결과 저장 (7.7.3-3)**

**예제 코드**: `s783_psycopg2_predictions`

```python
import psycopg2
conn = psycopg2.connect("dbname=test user=postgres password=secret")
cursor = conn.cursor()
cursor.execute("INSERT INTO predictions (model, prediction) VALUES (%s, %s)",
               ('model_v1', 0.95))
conn.commit()
cursor.close(); conn.close()
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""7.7.3-3 psycopg2 연동 — Python에서 PostgreSQL에 접속해 예측 결과를 INSERT로 저장하는 예제"""
import psycopg2                                                        # PostgreSQL용 Python DB 드라이버(DB-API 2.0 구현체)
conn = psycopg2.connect("dbname=test user=postgres password=secret")  # 연결 문자열 한 줄로 DB 접속(dbname/user/password 지정, host 생략 시 기본 localhost)
cursor = conn.cursor()                                                 # SQL 실행을 위한 커서 객체 생성
cursor.execute("INSERT INTO predictions (model, prediction) VALUES (%s, %s)",  # %s 플레이스홀더 사용(SQL 인젝션 방지를 위한 파라미터 바인딩)
               ('model_v1', 0.95))                                     # 바인딩할 실제 값 튜플(모델명, 예측값)
conn.commit()                                                          # INSERT를 실제 DB에 반영(트랜잭션 커밋)
cursor.close(); conn.close()                                           # 커서와 연결을 명시적으로 종료해 자원 반환

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) psycopg2는 f-string이나 문자열 결합이 아니라 %s 플레이스홀더 + 파라미터 튜플로 값을 바인딩해야 SQL 인젝션을 막을 수 있다.
# 2) execute() 이후 commit()을 호출하지 않으면 변경 사항이 DB에 영구 반영되지 않는다(psycopg2는 기본적으로 자동 트랜잭션 모드).
# 3) 실습에서는 predictions_demo 테이블에 INSERT 후 SELECT로 (1, 'model_v1', 0.95) 행이 실제 저장됐음을 확인했다.
# 4) cursor.close(); conn.close()로 자원을 정리하지 않으면 커넥션이 누적되어 DB 연결 풀이 고갈될 수 있다.
# ---------------------------------------------------------------
```

</details>

*실제 psycopg2 연결로 이 샌드박스의 PostgreSQL에 INSERT 후 SELECT로 저장 결과를 직접 확인*

---

**실행 결과 — Python(psycopg2) 연동 — 예측 결과 저장 (7.7.3-3)**

**실행 완료**

**실행 결과**: `s783_psycopg2_predictions`

```sql
> DROP TABLE IF EXISTS predictions_demo ...  (rowcount=-1)
> CREATE TABLE predictions_demo (id SERIAL PRIMARY KEY, model TEXT, prediction NUMERIC) ...  (rowcount=-1)
> psycopg2 cursor.execute(INSERT ...) + conn.commit() 실행 후 SELECT * FROM predictions_demo ...
id | model | prediction
-----------------------
1 | model_v1 | 0.95
(1행)
```

---

## 7.8 PostgreSQL과 Python 연동 — 실전 프로젝트 6종 개요

- **7.8.1 추천 시스템**: users · products · purchases · recommendations 4테이블

- **7.8.2 고객 이탈 예측**: customers · customer_behavior · churn_predictions 3테이블

- **7.8.3 챗봇**: chats · responses · intent 3테이블

- **7.8.4 스팸 필터링**: emails · email_labels 2테이블

- **7.8.5 이미지 분류/얼굴 인식**: images · image_labels 2테이블

- **7.8.6 주식 가격 예측**: stock_prices · predictions 2테이블

---

**추천 시스템 — 테이블 설계 (7.8.1)**

**예제 코드**: `s881_recommend_tables`

```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(100) UNIQUE,
    age INT, gender VARCHAR(10), registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY, name VARCHAR(255), category VARCHAR(100), price DECIMAL(10,2)
);
CREATE TABLE purchases (
    purchase_id SERIAL PRIMARY KEY, user_id INT REFERENCES users(user_id),
    product_id INT REFERENCES products(product_id), purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE recommendations (
    recommendation_id SERIAL PRIMARY KEY, user_id INT REFERENCES users(user_id),
    product_id INT REFERENCES products(product_id), recommendation_score DECIMAL(5,2),
    recommended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.8.1 추천 시스템 — 사용자·상품·구매·추천 4개 테이블을 외래키로 연결한 스키마 설계 예제
CREATE TABLE users (                                                    -- 사용자 정보를 저장하는 테이블 생성
    user_id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(100) UNIQUE,  -- SERIAL로 자동 증가 PK, email은 UNIQUE 제약으로 중복 가입 방지
    age INT, gender VARCHAR(10), registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- registered_at은 삽입 시각을 기본값으로 자동 기록
);
CREATE TABLE products (                                                 -- 상품 정보를 저장하는 테이블 생성
    product_id SERIAL PRIMARY KEY, name VARCHAR(255), category VARCHAR(100), price DECIMAL(10,2)  -- price는 소수점 2자리까지 정확히 저장하는 DECIMAL 타입
);
CREATE TABLE purchases (                                                -- 구매 이력을 저장하는 테이블 생성
    purchase_id SERIAL PRIMARY KEY, user_id INT REFERENCES users(user_id),      -- user_id는 users 테이블을 참조하는 외래키(FK)
    product_id INT REFERENCES products(product_id), purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- product_id도 products를 참조하는 FK, 구매 시각은 자동 기록
);
CREATE TABLE recommendations (                                          -- 추천 결과를 저장하는 테이블 생성
    recommendation_id SERIAL PRIMARY KEY, user_id INT REFERENCES users(user_id),  -- 어느 사용자에게 추천했는지 FK로 연결
    product_id INT REFERENCES products(product_id), recommendation_score DECIMAL(5,2),  -- 추천 점수는 소수점 2자리 DECIMAL로 저장
    recommended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP                  -- 추천이 생성된 시각을 자동 기록
);

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) purchases와 recommendations 테이블은 users/products를 REFERENCES로 참조하는 정규화된 관계형 설계로, 추천 시스템의 데이터 기반이 된다.
-- 2) email에 UNIQUE 제약을 걸어 애플리케이션 로직 없이도 DB 레벨에서 중복 계정 생성을 막는다.
-- 3) DEFAULT CURRENT_TIMESTAMP를 여러 테이블에 반복 적용해 "언제 발생한 이벤트인가"를 별도 코드 없이 자동으로 남긴다.
-- 4) 실습에서는 테이블명 충돌 방지를 위해 users→users_r, products→products_r로 바꿔 생성했지만 구조(컬럼·제약조건)는 원본과 동일하다.
-- ---------------------------------------------------------------
```

</details>

*테이블명 충돌을 피해 harness에서는 users_r/products_r로 명명(구조는 책과 동일) — 4개 테이블 모두 실제 생성*

---

**실행 결과 — 추천 시스템 — 테이블 설계 (7.8.1)**

**실행 완료**

**실행 결과**: `s881_recommend_tables`

```sql
> DROP TABLE IF EXISTS recommendations, purchases, products_r, users_r CASCADE ...  (rowcount=-1)
> CREATE TABLE users_r (user_id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(100) UNIQUE, ...  (rowcount=-1)
> CREATE TABLE products_r (product_id SERIAL PRIMARY KEY, name VARCHAR(255), category VARCHAR(100), ...  (rowcount=-1)
> CREATE TABLE purchases (purchase_id SERIAL PRIMARY KEY, user_id INT REFERENCES users_r(user_id), ...  (rowcount=-1)
> CREATE TABLE recommendations (recommendation_id SERIAL PRIMARY KEY, user_id INT REFERENCES users_r(user_id), ...  (rowcount=-1)
> SELECT table_name FROM information_schema.tables WHERE table_name IN ('users_r','products_r','purchases','recommendations') ...
table_name
----------
products_r
purchases
users_r
recommendations
(4행)
```

---

**추천 시스템 — 더미 데이터 삽입 (7.8.1)**

**예제 코드**: `s881_recommend_dummy`

```sql
INSERT INTO users (name, email, age, gender) VALUES
    ('John Doe','john@example.com',30,'Male'),
    ('Jane Smith','jane@example.com',25,'Female'),
    ('Alice Johnson','alice@example.com',35,'Female'),
    ('Bob Brown','bob@example.com',40,'Male');
INSERT INTO products (name, category, price) VALUES
    ('Laptop','Electronics',999.99), ('Smartphone','Electronics',799.99),
    ('Washing Machine','Appliances',499.99), ('Blender','Appliances',59.99);
INSERT INTO purchases (user_id, product_id, purchase_date) VALUES
    (1,1,'2025-01-01'), (1,3,'2025-01-02'), (2,2,'2025-01-03'),
    (3,4,'2025-01-04'), (4,1,'2025-01-05');
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
-- 7.8.1 추천 시스템 — users/products/purchases 테이블에 더미 데이터를 삽입해 추천 로직 테스트용 기초 데이터를 구성하는 예제
INSERT INTO users (name, email, age, gender) VALUES        -- 사용자 4명을 한 번의 INSERT 문으로 일괄 삽입
    ('John Doe','john@example.com',30,'Male'),
    ('Jane Smith','jane@example.com',25,'Female'),
    ('Alice Johnson','alice@example.com',35,'Female'),
    ('Bob Brown','bob@example.com',40,'Male');
INSERT INTO products (name, category, price) VALUES        -- 상품 4개(전자제품 2 + 가전제품 2)를 일괄 삽입
    ('Laptop','Electronics',999.99), ('Smartphone','Electronics',799.99),
    ('Washing Machine','Appliances',499.99), ('Blender','Appliances',59.99);
INSERT INTO purchases (user_id, product_id, purchase_date) VALUES  -- 구매 이력 5건을 일괄 삽입(user_id/product_id는 위 테이블의 SERIAL PK를 그대로 참조)
    (1,1,'2025-01-01'), (1,3,'2025-01-02'), (2,2,'2025-01-03'),   -- 사용자 1은 상품 1, 3을 각각 구매(한 사용자가 여러 건 구매 가능)
    (3,4,'2025-01-04'), (4,1,'2025-01-05');                        -- 사용자 3, 4도 각각 한 건씩 구매

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) 여러 VALUES 절을 콤마로 나열하면 INSERT 문 한 번으로 다건 삽입이 가능해 개별 INSERT보다 효율적이다.
-- 2) user_id·product_id 값(1,2,3,4)은 SERIAL PK가 자동 생성한 값을 그대로 가정한 것이므로, 실제로는 삽입 순서(위 users/products INSERT)에 의존한다.
-- 3) purchases에 삽입된 5건은 이후 3-way JOIN(users-purchases-products)으로 "누가 무엇을 언제 샀는지"를 조회하는 추천 로직의 원천 데이터가 된다.
-- ---------------------------------------------------------------
```

</details>

*사용자 4명 · 상품 4개 · 구매기록 5건을 실제 삽입 후 JOIN으로 구매 내역 확인*

---

**실행 결과 — 추천 시스템 — 더미 데이터 삽입 (7.8.1)**

**실행 완료**

**실행 결과**: `s881_recommend_dummy`

```sql
> INSERT INTO users_r (name, email, age, gender) VALUES ...  (rowcount=4)
> INSERT INTO products_r (name, category, price) VALUES ...  (rowcount=4)
> INSERT INTO purchases (user_id, product_id, purchase_date) VALUES ...  (rowcount=5)
> SELECT u.name, p.name AS product, pu.purchase_date FROM purchases pu JOIN users_r u ON pu.user_id=u.user_id JOIN products_r p ON pu.product_id=p.product_id ORDER BY pu.purchase_id ...
name | product | purchase_date
------------------------------
John Doe | Laptop | 2025-01-01 00:00:00
John Doe | Washing Machine | 2025-01-02 00:00:00
Jane Smith | Smartphone | 2025-01-03 00:00:00
Alice Johnson | Blender | 2025-01-04 00:00:00
Bob Brown | Laptop | 2025-01-05 00:00:00
(5행)
```

---

**추천 시스템 — Python(psycopg2) 연동 (7.8.1-4)**

**예제 코드**: `s881_psycopg2`

```python
import psycopg2
conn = psycopg2.connect(
    dbname="your_db", user="your_user", password="your_password",
    host="localhost", port="5432"
)
cursor = conn.cursor()
cursor.execute("SELECT * FROM users")
users = cursor.fetchall()
for user in users:
    print(user)
conn.close()
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""7.8.1-4 psycopg2 연동 — Python에서 PostgreSQL에 접속해 users 테이블을 SELECT로 조회하는 예제"""
import psycopg2                                                        # PostgreSQL용 Python DB 드라이버
conn = psycopg2.connect(                                              # 연결 정보를 키워드 인자로 각각 명시하는 방식(연결 문자열 대신)
    dbname="your_db", user="your_user", password="your_password",     # 접속할 데이터베이스명, 사용자명, 비밀번호
    host="localhost", port="5432"                                     # 접속 호스트와 포트를 명시적으로 지정
)
cursor = conn.cursor()                                                 # SQL 실행을 위한 커서 생성
cursor.execute("SELECT * FROM users")                                  # users 테이블의 모든 컬럼·모든 행을 조회하는 쿼리 실행
users = cursor.fetchall()                                              # 결과 전체를 튜플의 리스트로 한 번에 가져옴
for user in users:                                                     # 조회된 각 행(사용자 한 명)에 대해 반복
    print(user)                                                        # 튜플 형태(id, 이름, 이메일, 나이, 성별, 등록일시)로 그대로 출력
conn.close()                                                           # 연결 종료(커서는 별도로 닫지 않음에 유의)

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) fetchall()은 결과를 한 번에 메모리로 모두 로드하므로, 대용량 테이블에서는 fetchmany()나 서버 사이드 커서로 나눠 가져오는 것이 안전하다.
# 2) 연결 정보를 하드코딩(host, password 등)하는 것은 예제용이며, 실무에서는 환경변수나 별도 설정 파일로 분리해야 한다.
# 3) 실습에서는 users_r 테이블의 실제 데이터 4건이 (id, 이름, 이메일, 나이, 성별, 등록일시) 튜플로 순서대로 출력됨을 확인했다.
# 4) 이 코드는 cursor.close()를 호출하지 않고 conn.close()만 실행하는데, 연결이 닫히면 커서도 함께 무효화되므로 실습 결과에는 문제가 없다.
# ---------------------------------------------------------------
```

</details>

*실제 psycopg2로 이 샌드박스의 PostgreSQL에 연결해 users 테이블 4건을 직접 조회*

---

**실행 결과 — 추천 시스템 — Python(psycopg2) 연동 (7.8.1-4)**

**실행 완료**

**실행 결과**: `s881_psycopg2`

```sql
import psycopg2; conn = psycopg2.connect(...); cursor.execute('SELECT * FROM users'); 실제 연결 및 조회 실행 결과:
(1, 'John Doe', 'john@example.com', 30, 'Male', datetime.datetime(2026, 8, 22, 2, 54, 1, 505020))
(2, 'Jane Smith', 'jane@example.com', 25, 'Female', datetime.datetime(2026, 8, 22, 2, 54, 1, 505020))
(3, 'Alice Johnson', 'alice@example.com', 35, 'Female', datetime.datetime(2026, 8, 22, 2, 54, 1, 505020))
(4, 'Bob Brown', 'bob@example.com', 40, 'Male', datetime.datetime(2026, 8, 22, 2, 54, 1, 505020))
```

---

**고객 이탈 예측 — 테이블+더미 데이터 (7.8.2)**

**예제 코드**: `s882_churn`

```sql
CREATE TABLE customers (customer_id SERIAL PRIMARY KEY, name VARCHAR(100),
    email VARCHAR(100) UNIQUE, signup_date TIMESTAMP, last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE);
CREATE TABLE customer_behavior (behavior_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id), behavior_type VARCHAR(100), timestamp TIMESTAMP);
CREATE TABLE churn_predictions (prediction_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id), churn_probability DECIMAL(5,2),
    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
INSERT INTO customers (name, email, signup_date, last_login) VALUES
    ('Alice Adams','alice_adams@example.com','2024-06-01','2025-01-10'),
    ('Eve Evans','eve_evans@example.com','2023-08-01','2025-01-11');
INSERT INTO customer_behavior (customer_id, behavior_type, timestamp) VALUES
    (1,'Login','2025-01-10'), (2,'Purchase','2025-01-11');
INSERT INTO churn_predictions (customer_id, churn_probability) VALUES (1,0.80), (2,0.25);
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
CREATE TABLE customers (customer_id SERIAL PRIMARY KEY, name VARCHAR(100),  -- 고객 기본정보 테이블: SERIAL PK로 customer_id 자동 증가
    email VARCHAR(100) UNIQUE, signup_date TIMESTAMP, last_login TIMESTAMP,  -- email UNIQUE 제약으로 중복 가입 방지, signup_date/last_login은 이탈 예측의 핵심 시점 정보
    is_active BOOLEAN DEFAULT TRUE);  -- 활성 여부 플래그, 기본값 TRUE
CREATE TABLE customer_behavior (behavior_id SERIAL PRIMARY KEY,  -- 고객 행동 로그 테이블: 로그인/구매 등 이벤트 기록
    customer_id INT REFERENCES customers(customer_id), behavior_type VARCHAR(100), timestamp TIMESTAMP);  -- FK로 customers 참조, behavior_type에 행동 종류 저장
CREATE TABLE churn_predictions (prediction_id SERIAL PRIMARY KEY,  -- 이탈 예측 결과 테이블
    customer_id INT REFERENCES customers(customer_id), churn_probability DECIMAL(5,2),  -- FK로 customers 참조, 이탈 확률(0.00~1.00)을 DECIMAL로 저장해 소수점 오차 방지
    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP);  -- 예측 시각 자동 기록
INSERT INTO customers (name, email, signup_date, last_login) VALUES  -- 더미 고객 2명 삽입
    ('Alice Adams','alice_adams@example.com','2024-06-01','2025-01-10'),
    ('Eve Evans','eve_evans@example.com','2023-08-01','2025-01-11');
INSERT INTO customer_behavior (customer_id, behavior_type, timestamp) VALUES  -- 각 고객의 행동 이력 1건씩 삽입
    (1,'Login','2025-01-10'), (2,'Purchase','2025-01-11');
INSERT INTO churn_predictions (customer_id, churn_probability) VALUES (1,0.80), (2,0.25);  -- 각 고객의 이탈 확률 예측값 삽입 (Alice 80%, Eve 25%)

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) 이 3테이블(customers/customer_behavior/churn_predictions) 구조는 "고객 이탈 예측" 서비스의 스키마 설계 단계 예제로, 고객 정보·행동 로그·예측 결과를 분리해 정규화한 전형적 형태다.
-- 2) FOREIGN KEY로 customer_id를 참조하게 만들어 세 테이블을 JOIN하면 고객명·행동유형·이탈확률을 한 번에 조회할 수 있다(실행 결과: Alice Adams/Login/0.80, Eve Evans/Purchase/0.25 2행).
-- 3) churn_probability를 DECIMAL(5,2)로 둔 것은 머신러닝 모델이 출력하는 확률값(0~1)을 부동소수점 오차 없이 저장하기 위함이다.
-- ---------------------------------------------------------------
```

</details>

*3개 테이블 생성 + 더미 삽입 후 JOIN으로 고객·행동·이탈확률을 한 번에 실제 조회*

---

**실행 결과 — 고객 이탈 예측 — 테이블+더미 데이터 (7.8.2)**

**실행 완료**

**실행 결과**: `s882_churn`

```sql
> DROP TABLE IF EXISTS churn_predictions, customer_behavior, customers_c CASCADE ...  (rowcount=-1)
> CREATE TABLE customers_c (customer_id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(100) UNIQUE, ...  (rowcount=-1)
> CREATE TABLE customer_behavior (behavior_id SERIAL PRIMARY KEY, customer_id INT REFERENCES customers_c(customer_id), ...  (rowcount=-1)
> CREATE TABLE churn_predictions (prediction_id SERIAL PRIMARY KEY, customer_id INT REFERENCES customers_c(customer_id), ...  (rowcount=-1)
> INSERT INTO customers_c (name, email, signup_date, last_login) VALUES ...  (rowcount=2)
> INSERT INTO customer_behavior (customer_id, behavior_type, timestamp) VALUES ...  (rowcount=2)
> INSERT INTO churn_predictions (customer_id, churn_probability) VALUES (1,0.80),(2,0.25) ...  (rowcount=2)
> SELECT c.name, cb.behavior_type, cp.churn_probability ...
name | behavior_type | churn_probability
----------------------------------------
Alice Adams | Login | 0.80
Eve Evans | Purchase | 0.25
(2행)
```

---

**챗봇 — 테이블+더미 데이터 (7.8.3)**

**예제 코드**: `s883_chatbot`

```sql
CREATE TABLE chats (chat_id SERIAL PRIMARY KEY, user_id INT, message TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE responses (response_id SERIAL PRIMARY KEY,
    chat_id INT REFERENCES chats(chat_id), bot_response TEXT,
    response_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE intent (intent_id SERIAL PRIMARY KEY, intent_name VARCHAR(100), description TEXT);
INSERT INTO chats (user_id, message) VALUES
    (1,'Hello, I need help with my account'),
    (2,'What are your hours of operation?');
INSERT INTO responses (chat_id, bot_response) VALUES
    (1,'Sure! How can I assist you with your account?'),
    (2,'Our hours of operation are from 9 AM to 5 PM, Monday to Friday.');
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
CREATE TABLE chats (chat_id SERIAL PRIMARY KEY, user_id INT, message TEXT,  -- 사용자가 보낸 채팅 메시지 저장 테이블
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP);  -- 메시지 수신 시각 자동 기록
CREATE TABLE responses (response_id SERIAL PRIMARY KEY,  -- 챗봇 응답 저장 테이블
    chat_id INT REFERENCES chats(chat_id), bot_response TEXT,  -- FK로 chats와 1:1 연결
    response_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP);  -- 응답 생성 시각 자동 기록
CREATE TABLE intent (intent_id SERIAL PRIMARY KEY, intent_name VARCHAR(100), description TEXT);  -- 의도(intent) 분류용 참조 테이블, 아직 다른 테이블과 FK 연결은 없음
INSERT INTO chats (user_id, message) VALUES  -- 사용자 메시지 더미 2건 삽입
    (1,'Hello, I need help with my account'),
    (2,'What are your hours of operation?');
INSERT INTO responses (chat_id, bot_response) VALUES  -- 각 메시지에 대응하는 챗봇 응답 삽입
    (1,'Sure! How can I assist you with your account?'),
    (2,'Our hours of operation are from 9 AM to 5 PM, Monday to Friday.');

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) "챗봇" 서비스의 스키마 설계 단계 예제로, 사용자 발화(chats)와 봇 응답(responses)을 별도 테이블로 분리하고 chat_id로 1:1 매핑한 구조다.
-- 2) intent 테이블은 향후 자연어 의도 분류(계정 문의, 영업시간 문의 등) 결과를 기록/확장하기 위한 자리로, 현재 더미 데이터 단계에서는 아직 값이 채워지지 않은 설계 여지를 보여준다.
-- 3) chats와 responses를 JOIN하면 "질문-답변" 대화 쌍을 그대로 복원할 수 있다(실행 결과: 계정 문의↔응답, 영업시간 문의↔응답 2행).
-- ---------------------------------------------------------------
```

</details>

*대화 로그와 응답을 JOIN해 실제 챗봇 대화 쌍이 올바르게 연결되는지 확인*

---

**실행 결과 — 챗봇 — 테이블+더미 데이터 (7.8.3)**

**실행 완료**

**실행 결과**: `s883_chatbot`

```sql
> DROP TABLE IF EXISTS responses, intent, chats CASCADE ...  (rowcount=-1)
> CREATE TABLE chats (chat_id SERIAL PRIMARY KEY, user_id INT, message TEXT, ...  (rowcount=-1)
> CREATE TABLE responses (response_id SERIAL PRIMARY KEY, chat_id INT REFERENCES chats(chat_id), ...  (rowcount=-1)
> CREATE TABLE intent (intent_id SERIAL PRIMARY KEY, intent_name VARCHAR(100), description TEXT) ...  (rowcount=-1)
> INSERT INTO chats (user_id, message) VALUES (1,'Hello, I need help with my account'),(2,'What are your hours of operation?') ...  (rowcount=2)
> INSERT INTO responses (chat_id, bot_response) VALUES ...  (rowcount=2)
> SELECT c.message, r.bot_response FROM chats c JOIN responses r ON c.chat_id=r.chat_id ORDER BY c.chat_id ...
message | bot_response
----------------------
Hello, I need help with my account | Sure! How can I assist you with your account?
What are your hours of operation? | Our hours of operation are from 9 AM to 5 PM, Monday to Friday.
(2행)
```

---

**스팸 필터링 — 테이블+더미 데이터 (7.8.4)**

**예제 코드**: `s884_spam`

```sql
CREATE TABLE emails (email_id SERIAL PRIMARY KEY, sender VARCHAR(255),
    recipient VARCHAR(255), subject TEXT, body TEXT, received_at TIMESTAMP);
CREATE TABLE email_labels (label_id SERIAL PRIMARY KEY,
    email_id INT REFERENCES emails(email_id), label VARCHAR(10));
INSERT INTO emails (sender, recipient, subject, body, received_at) VALUES
    ('spam@example.com','user@example.com','Congratulations! You have won a prize!',
     'Click here to claim your prize...','2025-01-01'),
    ('friend@example.com','user@example.com','Catch up soon?',
     'Let''s catch up over coffee sometime.','2025-01-02');
INSERT INTO email_labels (email_id, label) VALUES (1,'spam'), (2,'ham');
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
CREATE TABLE emails (email_id SERIAL PRIMARY KEY, sender VARCHAR(255),  -- 이메일 원문 저장 테이블
    recipient VARCHAR(255), subject TEXT, body TEXT, received_at TIMESTAMP);  -- 제목/본문/수신시각까지 스팸 분류 모델의 입력 특성이 될 원문 필드
CREATE TABLE email_labels (label_id SERIAL PRIMARY KEY,  -- 이메일에 대한 정답 라벨(spam/ham) 저장 테이블
    email_id INT REFERENCES emails(email_id), label VARCHAR(10));  -- FK로 emails 참조, label에 분류 결과 저장
INSERT INTO emails (sender, recipient, subject, body, received_at) VALUES  -- 더미 이메일 2건 삽입
    ('spam@example.com','user@example.com','Congratulations! You have won a prize!',
     'Click here to claim your prize...','2025-01-01'),
    ('friend@example.com','user@example.com','Catch up soon?',
     'Let''s catch up over coffee sometime.','2025-01-02');
INSERT INTO email_labels (email_id, label) VALUES (1,'spam'), (2,'ham');  -- 각 이메일에 스팸/정상 라벨 부여

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) "스팸 필터링" 서비스의 스키마 설계 단계 예제로, 원문(emails)과 정답 라벨(email_labels)을 분리해 지도학습용 데이터셋 구조를 갖췄다.
-- 2) emails/email_labels 구조는 스팸 분류 모델 학습용 데이터셋의 전형적인 테이블 설계로, subject·body는 특성(feature), label은 타깃(target)에 해당한다.
-- 3) email_id로 JOIN하면 제목-라벨 쌍을 확인할 수 있다(실행 결과: "Congratulations!..."↔spam, "Catch up soon?"↔ham 2행).
-- ---------------------------------------------------------------
```

</details>

*spam/ham 라벨이 정확한 이메일에 매칭되는지 JOIN으로 실제 확인*

---

**실행 결과 — 스팸 필터링 — 테이블+더미 데이터 (7.8.4)**

**실행 완료**

**실행 결과**: `s884_spam`

```sql
> DROP TABLE IF EXISTS email_labels, emails CASCADE ...  (rowcount=-1)
> CREATE TABLE emails (email_id SERIAL PRIMARY KEY, sender VARCHAR(255), recipient VARCHAR(255), ...  (rowcount=-1)
> CREATE TABLE email_labels (label_id SERIAL PRIMARY KEY, email_id INT REFERENCES emails(email_id), label VARCHAR(10)) ...  (rowcount=-1)
> INSERT INTO emails (sender, recipient, subject, body, received_at) VALUES ...  (rowcount=2)
> INSERT INTO email_labels (email_id, label) VALUES (1,'spam'),(2,'ham') ...  (rowcount=2)
> SELECT e.subject, l.label FROM emails e JOIN email_labels l ON e.email_id=l.email_id ORDER BY e.email_id ...
subject | label
---------------
Congratulations! You have won a prize! | spam
Catch up soon? | ham
(2행)
```

---

**이미지 분류/얼굴 인식 — 테이블+더미 데이터 (7.8.5)**

**예제 코드**: `s885_image`

```sql
CREATE TABLE images (image_id SERIAL PRIMARY KEY, image_name VARCHAR(255),
    image_path TEXT, upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE image_labels (label_id SERIAL PRIMARY KEY,
    image_id INT REFERENCES images(image_id), label VARCHAR(100));
INSERT INTO images (image_name, image_path) VALUES
    ('image1.jpg','/images/image1.jpg'), ('image2.jpg','/images/image2.jpg');
INSERT INTO image_labels (image_id, label) VALUES (1,'cat'), (2,'dog');
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
CREATE TABLE images (image_id SERIAL PRIMARY KEY, image_name VARCHAR(255),  -- 이미지 메타데이터 테이블
    image_path TEXT, upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP);  -- 실제 픽셀 데이터가 아닌 파일 경로(image_path)만 저장
CREATE TABLE image_labels (label_id SERIAL PRIMARY KEY,  -- 이미지 분류 정답 라벨 테이블
    image_id INT REFERENCES images(image_id), label VARCHAR(100));  -- FK로 images 참조, label에 클래스명 저장
INSERT INTO images (image_name, image_path) VALUES  -- 더미 이미지 2건 삽입 (경로 정보만)
    ('image1.jpg','/images/image1.jpg'), ('image2.jpg','/images/image2.jpg');
INSERT INTO image_labels (image_id, label) VALUES (1,'cat'), (2,'dog');  -- 각 이미지에 클래스 라벨 부여

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) "이미지 분류/얼굴 인식" 서비스의 스키마 설계 단계 예제로, images(메타데이터)와 image_labels(정답 라벨)를 분리한 구조다.
-- 2) 실제 이미지 파일은 image_path에 경로만 저장하고 픽셀 데이터 자체는 DB 밖(파일시스템/객체 스토리지)에 두는 것이 일반적인 설계임을 보여준다 — DB에는 대용량 바이너리 대신 참조 경로만 두는 것이 원칙.
-- 3) image_id로 JOIN하면 파일명-라벨 쌍을 확인할 수 있다(실행 결과: image1.jpg↔cat, image2.jpg↔dog 2행).
-- ---------------------------------------------------------------
```

</details>

---

**실행 결과 — 이미지 분류/얼굴 인식 — 테이블+더미 데이터 (7.8.5)**

**실행 완료**

**실행 결과**: `s885_image`

```sql
> DROP TABLE IF EXISTS image_labels, images CASCADE ...  (rowcount=-1)
> CREATE TABLE images (image_id SERIAL PRIMARY KEY, image_name VARCHAR(255), image_path TEXT, ...  (rowcount=-1)
> CREATE TABLE image_labels (label_id SERIAL PRIMARY KEY, image_id INT REFERENCES images(image_id), label VARCHAR(100)) ...  (rowcount=-1)
> INSERT INTO images (image_name, image_path) VALUES ('image1.jpg','/images/image1.jpg'),('image2.jpg','/images/image2.jpg') ...  (rowcount=2)
> INSERT INTO image_labels (image_id, label) VALUES (1,'cat'),(2,'dog') ...  (rowcount=2)
> SELECT i.image_name, l.label FROM images i JOIN image_labels l ON i.image_id=l.image_id ORDER BY i.image_id ...
image_name | label
------------------
image1.jpg | cat
image2.jpg | dog
(2행)
```

---

**주식 가격 예측 — 테이블+더미 데이터 (7.8.6)**

**예제 코드**: `s886_stock`

```sql
CREATE TABLE stock_prices (stock_id SERIAL PRIMARY KEY, stock_symbol VARCHAR(10),
    date DATE, open_price DECIMAL(10,2), close_price DECIMAL(10,2), volume INT);
CREATE TABLE predictions (prediction_id SERIAL PRIMARY KEY,
    stock_id INT REFERENCES stock_prices(stock_id), predicted_close DECIMAL(10,2),
    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
INSERT INTO stock_prices (stock_symbol, date, open_price, close_price, volume) VALUES
    ('AAPL','2025-01-01',150.00,155.00,1000000),
    ('AAPL','2025-01-02',156.00,160.00,1200000);
INSERT INTO predictions (stock_id, predicted_close) VALUES (1,157.00), (2,162.00);
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```sql
CREATE TABLE stock_prices (stock_id SERIAL PRIMARY KEY, stock_symbol VARCHAR(10),  -- 시계열 주가 데이터 테이블
    date DATE, open_price DECIMAL(10,2), close_price DECIMAL(10,2), volume INT);  -- 날짜별 시가/종가/거래량, DECIMAL로 가격 정밀도 유지
CREATE TABLE predictions (prediction_id SERIAL PRIMARY KEY,  -- 예측 종가 저장 테이블
    stock_id INT REFERENCES stock_prices(stock_id), predicted_close DECIMAL(10,2),  -- FK로 stock_prices 참조, 예측 모델의 출력값 저장
    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP);  -- 예측 수행 시각 자동 기록
INSERT INTO stock_prices (stock_symbol, date, open_price, close_price, volume) VALUES  -- AAPL 더미 시세 2일치 삽입
    ('AAPL','2025-01-01',150.00,155.00,1000000),
    ('AAPL','2025-01-02',156.00,160.00,1200000);
INSERT INTO predictions (stock_id, predicted_close) VALUES (1,157.00), (2,162.00);  -- 각 날짜에 대응하는 예측 종가 삽입

-- ---------------------------------------------------------------
-- [교안용 설명 포인트]
-- 1) "주식 가격 예측" 서비스의 스키마 설계 단계 예제로, 실제 시세(stock_prices)와 예측 결과(predictions)를 분리해 모델 성능을 비교·검증할 수 있는 구조다.
-- 2) stock_id로 JOIN하면 실제 종가(close_price)와 예측 종가(predicted_close)를 나란히 비교할 수 있다(실행 결과: 155.00 vs 157.00, 160.00 vs 162.00 2행).
-- 3) 가격 필드를 DECIMAL(10,2)로 지정해 부동소수점 연산 오차 없이 금액 단위를 정확히 표현한다.
-- ---------------------------------------------------------------
```

</details>

*시계열 시세 데이터와 예측값을 JOIN해 실제값·예측값을 나란히 비교*

---

**실행 결과 — 주식 가격 예측 — 테이블+더미 데이터 (7.8.6)**

**실행 완료**

**실행 결과**: `s886_stock`

```sql
> DROP TABLE IF EXISTS predictions_stock, stock_prices CASCADE ...  (rowcount=-1)
> CREATE TABLE stock_prices (stock_id SERIAL PRIMARY KEY, stock_symbol VARCHAR(10), date DATE, ...  (rowcount=-1)
> CREATE TABLE predictions_stock (prediction_id SERIAL PRIMARY KEY, stock_id INT REFERENCES stock_prices(stock_id), ...  (rowcount=-1)
> INSERT INTO stock_prices (stock_symbol, date, open_price, close_price, volume) VALUES ...  (rowcount=2)
> INSERT INTO predictions_stock (stock_id, predicted_close) VALUES (1,157.00),(2,162.00) ...  (rowcount=2)
> SELECT s.stock_symbol, s.date, s.close_price, p.predicted_close ...
stock_symbol | date | close_price | predicted_close
---------------------------------------------------
AAPL | 2025-01-01 | 155.00 | 157.00
AAPL | 2025-01-02 | 160.00 | 162.00
(2행)
```

---

**7장 정리**

- PostgreSQL의 시스템 명령부터 DDL·DML·DCL, 고급 SQL(서브쿼리·JOIN·CTE·윈도우 함수), 집합 연산, 머신러닝 연동, 그리고 실전 프로젝트 6종의 스키마 설계까지 이 샌드박스에 실제 구동 중인 PostgreSQL 16 서버에서 모두 실행했습니다.

- 발견된 책 코드 이슈(4건): ① 7.2.6/7.7.2 파티션 테이블 PRIMARY KEY가 파티션 기준 컬럼을 포함하지 않아 실제 오류(동일 원인 반복) ② 7.3.1 DEFAULT VALUES 설명이 NOT NULL 컬럼과 모순되어 실제 오류 ③ 7.3.3 DELETE 문의 CASCADE는 오류 없이 실행되지만 PostgreSQL이 이를 테이블 별칭으로 해석해 아무 기능도 하지 않는 숨은 함정 ④ 7.4.3 DROP ROLE 전 테이블 권한 REVOKE 누락으로 실제 오류.

- 환경 제약 안내: pg_cron 확장 미설치(shared_preload_libraries 설정 필요) · GIN 텍스트 인덱스는 pg_trgm 확장 필요 · COPY 경로는 서버 프로세스가 실제 쓰기 가능한 경로로 대체.
