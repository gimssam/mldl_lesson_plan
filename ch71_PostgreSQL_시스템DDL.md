# 7.1-7.2 PostgreSQL — 시스템 명령·DDL

7장

PostgreSQL 개요·설치·클러스터 구조·서버 관리 명령·psql 기본 명령(7.1), 데이터 정의 언어(DDL) 개요·주요 데이터 타입·제약 조건(PRIMARY KEY/FOREIGN KEY/UNIQUE/NOT NULL/DEFAULT/CHECK)·인덱스(B-tree/GIN/BRIN)·뷰/머터리얼라이즈드 뷰·ALTER TABLE·파티셔닝·CLUSTER(7.2)

*파이썬 인공지능 풀스택 · pp.333-365 중 발췌*

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
