# 7.3-7.4 PostgreSQL — DML·DCL

7장

INSERT/UPDATE/DELETE·COPY FROM/TO·RETURNING·트랜잭션(BEGIN/COMMIT/ROLLBACK/SAVEPOINT)(7.3), GRANT/REVOKE·비밀번호 암호화(SCRAM-SHA-256/pgcrypto)·역할 및 그룹 관리·Row-Level Security(7.4)

*파이썬 인공지능 풀스택 · pp.333-365 중 발췌*

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
