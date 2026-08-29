# 7.7-7.8 PostgreSQL — ML 연동·실전 프로젝트

7장

결측값 처리(삭제/평균 대체)·피처 엔지니어링(CASE WHEN 구간화)·corr() 상관관계 분석·GIN 전문 검색 인덱스·시간 기반 파티셔닝·COPY 배치 삽입·LISTEN/NOTIFY·pg_cron·psycopg2 연동(7.7), 추천 시스템·고객 이탈 예측·챗봇·스팸 필터링·이미지 분류/얼굴 인식·주식 가격 예측 실전 프로젝트 6종 테이블 설계+더미데이터+psycopg2(7.8)

*파이썬 인공지능 풀스택 · pp.333-365 중 발췌*

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
