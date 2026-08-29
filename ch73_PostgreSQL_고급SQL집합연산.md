# 7.5-7.6 PostgreSQL — 고급 SQL·집합 연산

7장

서브쿼리(EXISTS/IN/ANY/ALL)·이중쿼리·JOIN 5종·CTE·재귀 CTE(직원 계층 구조)·윈도우 함수(RANK/DENSE_RANK/LEAD/LAG)(7.5), UNION/UNION ALL/INTERSECT/EXCEPT·GROUP BY/HAVING·ROLLUP/CUBE(7.6)

*파이썬 인공지능 풀스택 · pp.333-365 중 발췌*

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
