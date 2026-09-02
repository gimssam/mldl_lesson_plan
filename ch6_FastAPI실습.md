# FastAPI 실습

6장

설치·기본 사용법 · 요청 처리/검증 · PostgreSQL 연동 · PyTorch/TensorFlow 통합 · 인증/보안 · 비동기

## 6.1 FastAPI란? — 특징과 설치

- **정의**: Python 3.6+ 기반의 고성능 비동기 웹 프레임워크 — 타입 힌트를 이용한 자동 데이터 검증·API 문서화가 강점

- **핵심 특징**: Starlette(ASGI) 기반 비동기 처리 · Pydantic 기반 데이터 검증 · Swagger/OpenAPI 문서 자동 생성

- **성능**: Node.js·Go 수준에 근접하는 처리량 — 비동기 I/O(async/await)를 적극 활용

- **설치**: pip install fastapi uvicorn[standard]  →  uvicorn main:app --reload 로 개발 서버 실행

---

**FastAPI vs Flask vs Django**

| 항목 | FastAPI | Flask | Django |
|---|---|---|---|
| 비동기 지원 | 기본 지원(async/await) | 확장 필요 | 부분 지원(3.1+) |
| 데이터 검증 | Pydantic 자동 검증 | 수동 구현 | 폼/모델 기반 |
| API 문서화 | Swagger 자동 생성 | 별도 확장 필요 | 별도 확장 필요 |
| 성능 | 매우 높음 | 보통 | 보통~낮음 |
| 적합한 용도 | 고성능 API, 머신러닝 서빙 | 소규모 웹앱 | 풀스택 웹 서비스 |

---
## FastAPI 기본 환경 설정
### FastAPI 설치 및 환경 설정
#### Python 환경 확인
```
python --version
```
#### 가상 환경 생성
```
conda create -n fastapi_env
conda activate fastapi_env

```
#### FastAPI 설치
```
pip install fastapi uvicorn
```

#### 설치확인
```
pip list | grep fastapi
```

**실전 코드 — 첫 FastAPI 앱**

**예제 코드**: `s612_root.py`

```python
from fastapi import FastAPI
app = FastAPI()
@app.get("/")
async def root():
    return {"message": "Hello, FastAPI!"}
# 실행: uvicorn main:app --reload
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""6.1.2 FastAPI 첫 앱 — 최소 구성으로 GET / 라우트 하나를 만들고 실행하는 방법"""
from fastapi import FastAPI
app = FastAPI()                              # ASGI 애플리케이션 인스턴스 생성(모든 라우트·설정의 시작점)
@app.get("/")                                 # HTTP GET + 경로 "/"를 이 함수에 연결하는 데코레이터
async def root():                             # async def: 비동기 핸들러(FastAPI는 동기 def도 허용하지만 기본은 async)
    return {"message": "Hello, FastAPI!"}     # dict를 그대로 반환하면 FastAPI가 자동으로 JSON으로 직렬화
# 실행: uvicorn main:app --reload            # main.py 안의 app 객체를 uvicorn이 구동, --reload는 코드 변경 시 자동 재시작

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) FastAPI는 프레임워크일 뿐 서버가 아니다 — 실제 실행은 uvicorn 같은 ASGI 서버가 담당한다.
# 2) 데코레이터 @app.get("/")이 "이 URL로 이 메서드가 오면 이 함수를 실행하라"는 라우팅 규칙을 등록한다.
# 3) 반환값을 dict로만 써도 JSONResponse 변환, Content-Type 설정을 FastAPI가 알아서 처리한다.
# 4) 실행 후 /docs로 접속하면 Swagger UI가 자동 생성되는 것도 이 시점에 함께 보여주면 좋다.
# ---------------------------------------------------------------
```

</details>

*TestClient로 실제 HTTP GET 요청을 보내 서버 없이도 동일하게 검증 (uvicorn 서버 기동 대신 in-process 테스트)*

---

**실행 결과 — 첫 FastAPI 앱**

**실행 완료**

**실행 결과**: `s612_root`

```
GET /
→ 200
{
  "message": "Hello, FastAPI!"
}
```

---

## 6.2 기본 사용법 — 프로젝트 구조와 라우팅

- **기본 구조**: main.py(진입점) · routers/(APIRouter별 분리) · models.py(Pydantic 모델) · database.py(DB 연결)

- **경로(Path) 매개변수**: {item_id}처럼 URL 경로에 변수를 포함 — 타입 힌트(int/str)로 자동 형변환 및 검증

- **APIRouter**: 라우트를 모듈 단위로 분리해 app.include_router()로 등록 — 대규모 프로젝트의 필수 패턴

---

**실전 코드 — 경로 매개변수 및 타입 검증**

**예제 코드**: `s622_routes.py`

```python
from fastapi import FastAPI
app = FastAPI()
@app.get("/")
async def root():
    return {"message": "Hello, FastAPI!"}
@app.get("/items/{item_id}")
async def read_item(item_id: int):
    return {"item_id": item_id}
@app.get("/users/{username}")
async def read_user(username: str):
    return {"username": username}
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""6.2.2 경로(Path) 매개변수 및 타입 검증 — 함수 인자 타입 힌트로 자동 형변환·422 검증까지 처리"""
from fastapi import FastAPI
app = FastAPI()
@app.get("/")
async def root():
    return {"message": "Hello, FastAPI!"}
@app.get("/items/{item_id}")                  # {item_id}: URL 경로의 가변 부분을 변수로 캡처
async def read_item(item_id: int):            # 타입 힌트 int → FastAPI가 문자열을 정수로 자동 변환 + 검증
    return {"item_id": item_id}
@app.get("/users/{username}")
async def read_user(username: str):           # str은 특별한 검증 없이 그대로 전달됨(가장 느슨한 타입)
    return {"username": username}

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) 경로 매개변수 이름({item_id})과 함수 파라미터 이름(item_id)이 정확히 일치해야 매핑된다.
# 2) 타입 힌트는 단순 문서화가 아니라 실제 런타임 검증 규칙 — Pydantic이 내부에서 값을 검사한다.
# 3) /items/not-an-int처럼 정수가 아닌 값을 넣으면 서버 코드 수정 없이 422 Unprocessable Entity가 자동 반환된다.
# 4) /items/{id}와 /users/{name}처럼 라우트별로 다른 타입 검증 규칙을 독립적으로 걸 수 있다.
# ---------------------------------------------------------------
```

</details>

*item_id: int 타입 힌트로 문자열 경로값을 자동 검증 — 정수가 아니면 자동으로 422 오류 반환*

---

**실행 결과 — 경로 매개변수 (정상 + 타입 검증 실패)**

**실행 완료**

**실행 결과**: `s622_routes`

```
GET /items/10
→ 200
{
  "item_id": 10
}
GET /users/alice
→ 200
{
  "username": "alice"
}
GET /items/not-an-int (타입 검증)
→ 422
{
  "detail": [
    {
      "type": "int_parsing",
      "loc": [
        "path",
        "item_id"
      ],
      "msg": "Input should be a valid integer, unable to parse string as an integer",
      "input": "not-an-int"
    }
  ]
}
```

---

**실전 코드 — APIRouter로 모듈화**

**예제 코드**: `s622_router_module.py`

```python
# items.py
from fastapi import APIRouter
router = APIRouter()
@router.get("/items/{item_id}")
async def get_item(item_id: int):
    return {"item_id": item_id}
# main.py
from fastapi import FastAPI
from items import router
app = FastAPI()
app.include_router(router)
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""6.2.2 APIRouter로 모듈화 — 라우트를 별도 파일로 분리하고 include_router로 앱에 결합"""
# items.py
from fastapi import APIRouter
router = APIRouter()                          # FastAPI() 대신 APIRouter()로 "부분 앱" 같은 라우트 묶음 생성
@router.get("/items/{item_id}")               # app이 아닌 router에 라우트를 등록
async def get_item(item_id: int):
    return {"item_id": item_id}

# main.py
from fastapi import FastAPI
from items import router                      # 다른 파일에서 정의한 router 객체를 가져옴
app = FastAPI()
app.include_router(router)                    # router에 등록된 모든 라우트를 app에 합침

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) 프로젝트가 커지면 main.py 하나에 모든 라우트를 몰아 쓰기 어려워지므로 기능/도메인 단위로 파일을 분리한다.
# 2) APIRouter는 FastAPI 인스턴스의 미니어처로, include_router 전까지는 실제 서버에 연결되지 않은 상태다.
# 3) include_router(router, prefix="/api", tags=["items"])처럼 prefix·tags를 붙여 공통 경로/문서 그룹화도 가능하다(심화 언급용).
# ---------------------------------------------------------------
```

</details>

*라우트를 별도 파일로 분리 후 include_router()로 등록 — 대규모 앱에서의 표준 구조*

---

**실행 결과 — APIRouter 모듈화**

**실행 완료**

**실행 결과**: `s622_router_module`

```
GET /items/42 (APIRouter 모듈화)
→ 200
{
  "item_id": 42
}
```

---

**실전 코드 — HTTP 메서드(GET/POST/PUT/DELETE)**

**예제 코드**: `s623_http_methods.py`

```python
from fastapi import FastAPI
from pydantic import BaseModel
app = FastAPI()
class Product(BaseModel):
    name: str
    price: float
@app.get("/products/{product_id}")
async def get_product(product_id: int):
    return {"product_id": product_id, "name": "Laptop", "price": 1200}
@app.post("/products/")
async def create_product(product: Product):
    return {"message": f"{product.name} created!", "price": product.price}
@app.put("/products/{product_id}")
async def update_product(product_id: int, product: Product):
    return {"product_id": product_id, "updated_name": product.name, "updated_price": product.price}
@app.delete("/products/{product_id}")
async def delete_product(product_id: int):
    return {"message": f"Product {product_id} deleted"}
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""6.2.3 HTTP 메서드(GET/POST/PUT/DELETE) 4종 — Pydantic 모델로 요청 바디를 검증하는 CRUD 패턴"""
from fastapi import FastAPI
from pydantic import BaseModel
app = FastAPI()
class Product(BaseModel):                     # 요청 바디(JSON)의 구조와 타입을 선언하는 Pydantic 모델
    name: str
    price: float
@app.get("/products/{product_id}")            # 조회(Read): 경로 매개변수만 사용
async def get_product(product_id: int):
    return {"product_id": product_id, "name": "Laptop", "price": 1200}
@app.post("/products/")                       # 생성(Create): 함수 인자로 받은 Product가 요청 바디 JSON에서 자동 파싱
async def create_product(product: Product):   # 타입이 BaseModel 하위 클래스이면 FastAPI가 "이건 body다"라고 판단
    return {"message": f"{product.name} created!", "price": product.price}
@app.put("/products/{product_id}")            # 수정(Update): 경로 매개변수 + 바디를 동시에 받음
async def update_product(product_id: int, product: Product):
    return {"product_id": product_id, "updated_name": product.name, "updated_price": product.price}
@app.delete("/products/{product_id}")         # 삭제(Delete): 보통 바디 없이 경로 매개변수만 사용
async def delete_product(product_id: int):
    return {"message": f"Product {product_id} deleted"}

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) 함수 파라미터의 타입이 int/str이면 경로 또는 쿼리 매개변수, BaseModel 하위 클래스면 요청 바디로 FastAPI가 자동 구분한다.
# 2) GET/DELETE는 보통 바디 없이 식별자만, POST/PUT은 Product 같은 구조화된 데이터를 받는 REST 관례를 그대로 보여준다.
# 3) Product 모델에 정의된 타입(name: str, price: float)과 다른 값이 오면 요청 자체가 핸들러 실행 전에 422로 걸러진다.
# 4) 실제 서비스에서는 여기 없는 "DB 저장/조회" 로직이 들어가야 하며, 이 예제는 라우팅·검증 구조만 보여주는 뼈대임을 짚어준다.
# ---------------------------------------------------------------
```

</details>

*4가지 HTTP 메서드를 하나의 리소스(/products)에 매핑 — REST API의 기본 패턴*

---

**실행 결과 — HTTP 메서드 4종 (1/2 — GET/POST)**

**실행 완료**

**실행 결과**: `s623_http_methods_1`

```
GET /products/1
→ 200
{
  "product_id": 1,
  "name": "Laptop",
  "price": 1200
}
POST /products/
{
  "name": "Monitor",
  "price": 300
}
→ 200
{
  "message": "Monitor created!",
  "price": 300.0
}
```

---

**실행 결과 — HTTP 메서드 4종 (2/2 — PUT/DELETE)**

**실행 완료**

**실행 결과**: `s623_http_methods_2`

```
PUT /products/1
{
  "name": "Laptop Pro",
  "price": 1500
}
→ 200
{
  "product_id": 1,
  "updated_name": "Laptop Pro",
  "updated_price": 1500.0
}
DELETE /products/1
→ 200
{
  "message": "Product 1 deleted"
}
```

---

**실전 코드 — JSON/HTML 응답**

**예제 코드**: `s624_response.py`

```python
from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
app = FastAPI()
templates = Jinja2Templates(directory="templates")
@app.get("/json")
async def json_response():
    return {"message": "This is a JSON response"}
@app.get("/html")
async def html_response(request: Request):
    return templates.TemplateResponse(
        "index.html", {"request": request, "message": "Hello, FastAPI with Jinja2!"}
    )
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""6.2.4 JSON/HTML 응답 — 같은 앱에서 순수 JSON API와 Jinja2 템플릿 렌더링을 함께 제공"""
from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
app = FastAPI()
templates = Jinja2Templates(directory="templates")   # templates/ 폴더의 .html 파일을 렌더링 엔진에 연결
@app.get("/json")
async def json_response():
    return {"message": "This is a JSON response"}    # dict 반환 → 기본 동작인 JSON 응답
@app.get("/html")
async def html_response(request: Request):           # HTML 렌더링 시 Request 객체를 반드시 인자로 받아야 함
    return templates.TemplateResponse(
        "index.html", {"request": request, "message": "Hello, FastAPI with Jinja2!"}  # 템플릿에 전달할 컨텍스트 딕셔너리
    )

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) FastAPI는 기본적으로 dict를 JSON으로 응답하지만, TemplateResponse를 쓰면 서버사이드 렌더링(HTML)도 가능하다.
# 2) Jinja2TemplateResponse는 컨텍스트에 반드시 "request" 키를 포함해야 하는 FastAPI의 규칙이다(내부적으로 요청 정보를 템플릿에 전달).
# 3) templates/index.html 파일이 실제로 존재해야 하며, {{ message }}처럼 컨텍스트 값을 템플릿에서 참조하게 된다.
# 4) 하나의 앱 안에서 API 엔드포인트(/json)와 화면 렌더링 엔드포인트(/html)를 자유롭게 혼용할 수 있음을 보여준다.
# ---------------------------------------------------------------
```

</details>

*화면에는 책 원문 구문(구형 TemplateResponse 시그니처) 그대로 표시*

---

**실행 결과 — JSON/HTML 응답**

**실행 완료**

**실행 결과**: `s624_response`

```
GET /json
→ 200
{
  "message": "This is a JSON response"
}
GET /html
→ 200  (Content-Type: text/html; charset=utf-8)
<!DOCTYPE html>
<html>
<head>
<title>FastAPI Example</title>
</head>
<body>
<h1>Hello, FastAPI with Jinja2!</h1>
</body>
</html>
```

*※ 이 샌드박스의 starlette 버전은 구형 TemplateResponse(name, {"request":...}) 시그니처를 더 이상 지원하지 않아, harness에서만 신형 시그니처 TemplateResponse(request, name, context)로 호출(라이브러리 버전 차이 — 책의 코드 자체는 오류 없음)*

---

**실전 코드 — 상태 코드 및 예외 처리**

**예제 코드**: `s625_status.py`

```python
from fastapi import FastAPI, status, HTTPException, Request
from fastapi.responses import JSONResponse
app = FastAPI()
@app.post("/create", status_code=status.HTTP_201_CREATED)
async def create_item():
    return {"message": "Item created"}
@app.get("/items/{item_id}")
async def read_item(item_id: int):
    if item_id == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"item_id": item_id}
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request, exc):
    return JSONResponse(status_code=exc.status_code, content={"message": f"Oops! {exc.detail}"})
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""6.2.5 상태 코드 및 예외 처리 — status_code 지정, HTTPException, 커스텀 예외 핸들러"""
from fastapi import FastAPI, status, HTTPException, Request
from fastapi.responses import JSONResponse
app = FastAPI()
@app.post("/create", status_code=status.HTTP_201_CREATED)   # 데코레이터에 status_code 지정 → 성공 시 기본 200 대신 201 반환
async def create_item():
    return {"message": "Item created"}
@app.get("/items/{item_id}")
async def read_item(item_id: int):
    if item_id == 0:
        raise HTTPException(status_code=404, detail="Item not found")  # 조건에 따라 즉시 에러 응답으로 흐름 중단
    return {"item_id": item_id}
@app.exception_handler(HTTPException)                        # HTTPException이 발생할 때 전역적으로 가로채는 핸들러 등록
async def custom_http_exception_handler(request, exc):
    return JSONResponse(status_code=exc.status_code, content={"message": f"Oops! {exc.detail}"})  # 응답 형식을 프로젝트 공통 포맷으로 재정의

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) status_code는 "성공"일 때의 응답 코드를 지정하는 것이고, HTTPException은 "실패"를 명시적으로 던질 때 쓴다 — 둘의 역할이 다름을 구분해줘야 한다.
# 2) raise HTTPException은 파이썬 예외 메커니즘을 그대로 활용해 함수 중간에서 즉시 에러 응답으로 빠져나간다.
# 3) @app.exception_handler로 등록하면 앱 전체에서 발생하는 같은 종류의 예외를 한 곳에서 일관된 JSON 포맷으로 응답할 수 있다.
# 4) 이 예제 이후 커스텀 핸들러가 등록되면 read_item에서 발생한 404조차 "Oops! Item not found" 형태로 감싸져 나가는 것을 실행 결과로 보여주면 좋다.
# ---------------------------------------------------------------
```

</details>

*201 상태코드 명시, HTTPException 발생, 커스텀 예외 핸들러로 응답 형식 변경까지 한 번에 확인*

---

**실행 결과 — 상태 코드 및 커스텀 예외 처리**

**실행 완료**

**실행 결과**: `s625_status`

```
POST /create
→ 201
{
  "message": "Item created"
}
GET /items/0 (커스텀 예외 핸들러 적용)
→ 404
{
  "message": "Oops! Item not found"
}
GET /items/5
→ 200
{
  "item_id": 5
}
```

---

## 6.3 요청 처리 및 데이터 검증 — 개요

- **Path / Query / Body**: 경로 매개변수(필수) · 쿼리 매개변수(기본값 가능) · 요청 본문(Pydantic 모델)

- **Pydantic 검증**: Field(min_length, gt, ge 등)로 세부 제약 지정 — 위반 시 자동으로 422 응답과 상세 오류 반환

- **EmailStr**: pydantic[email] 확장으로 이메일 형식을 자동 검증

- **Header / Cookie**: Header(), Cookie() 의존성으로 요청 헤더·쿠키 값을 함수 인자처럼 주입받음

- **파일 업로드**: UploadFile + File()로 단일/다중 파일을 비동기 스트림으로 수신

---

**실전 코드 — Path/Query/Body 매개변수**

**예제 코드**: `s631_path_query_body.py`

```python
from fastapi import FastAPI
from pydantic import BaseModel
app = FastAPI()
@app.get("/items/{item_id}")
async def read_item(item_id: int):
    return {"item_id": item_id}
@app.get("/search")
async def search_item(keyword: str, limit: int = 10):
    return {"keyword": keyword, "limit": limit}
class Item(BaseModel):
    name: str
    price: float
    description: str = None
@app.post("/items/")
async def create_item(item: Item):
    return {"name": item.name, "price": item.price, "description": item.description}
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
6.3.1 Path/Query/Body 매개변수 — 세 가지 매개변수 전달 방식을 각각 다른 라우트로 비교
"""
from fastapi import FastAPI
from pydantic import BaseModel
app = FastAPI()
@app.get("/items/{item_id}")
async def read_item(item_id: int):     # 경로에 포함된 값 → Path 매개변수, int로 자동 변환/검증
    return {"item_id": item_id}
@app.get("/search")
async def search_item(keyword: str, limit: int = 10):   # 기본값이 있으면 Query 매개변수(?keyword=..&limit=..)
    return {"keyword": keyword, "limit": limit}
class Item(BaseModel):     # 요청 바디 스키마를 클래스로 정의
    name: str
    price: float
    description: str = None
@app.post("/items/")
async def create_item(item: Item):     # 함수 인자 타입이 BaseModel이면 자동으로 Body로 해석됨
    return {"name": item.name, "price": item.price, "description": item.description}

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) FastAPI는 함수 시그니처만 보고 매개변수 위치를 자동 판단한다: 경로에 있으면 Path, 단순 타입+기본값이면 Query, BaseModel이면 Body.
# 2) item_id: int처럼 타입을 지정하면 문자열이 들어와도 자동 변환을 시도하고, 실패하면 422 오류를 즉시 반환한다.
# 3) limit: int = 10처럼 기본값을 주면 클라이언트가 생략해도 되는 선택적 쿼리 매개변수가 된다.
# 4) Pydantic 모델(Item)을 쓰면 JSON 바디를 자동 파싱하고 각 필드 타입까지 검증해준다.
# ---------------------------------------------------------------
```

</details>

*쿼리 매개변수 limit은 기본값 10을 지정 — 생략 시 자동 적용됨을 결과에서 확인*

---

**실행 결과 — Path/Query/Body 4종 요청 (1/2)**

**실행 완료**

**실행 결과**: `s631_path_query_body_1`

```
GET /items/10
→ 200
{
  "item_id": 10
}
GET /search?keyword=laptop&limit=5
→ 200
{
  "keyword": "laptop",
  "limit": 5
}
```

---

**실행 결과 — Path/Query/Body 4종 요청 (2/2)**

**실행 완료**

**실행 결과**: `s631_path_query_body_2`

```
GET /search?keyword=phone (limit 기본값)
→ 200
{
  "keyword": "phone",
  "limit": 10
}
POST /items/ (description 생략)
{
  "name": "Laptop",
  "price": 1200.5
}
→ 200
{
  "name": "Laptop",
  "price": 1200.5,
  "description": null
}
```

---

**실전 코드 — Pydantic Field·EmailStr 검증**

**예제 코드**: `s632_validation.py`

```python
from fastapi import FastAPI
from pydantic import BaseModel, Field, EmailStr
app = FastAPI()
class Product(BaseModel):
    name: str = Field(..., min_length=3, max_length=50)
    price: float = Field(..., gt=0)
    stock: int = Field(default=10, ge=0)
@app.post("/products/")
async def create_product(product: Product):
    return product
class User(BaseModel):
    username: str
    email: EmailStr
@app.post("/users/")
async def create_user(user: User):
    return user
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
6.3.2 Pydantic Field·EmailStr 검증 — 필드 제약 조건과 이메일 형식 검증을 선언적으로 적용
"""
from fastapi import FastAPI
from pydantic import BaseModel, Field, EmailStr
app = FastAPI()
class Product(BaseModel):
    name: str = Field(..., min_length=3, max_length=50)   # 필수(...) + 문자열 길이 제약
    price: float = Field(..., gt=0)                        # 0보다 커야 함(greater than)
    stock: int = Field(default=10, ge=0)                    # 기본값 10 + 0 이상(greater or equal)
@app.post("/products/")
async def create_product(product: Product):
    return product
class User(BaseModel):
    username: str
    email: EmailStr    # 이메일 형식이 아니면 자동으로 검증 오류 발생
@app.post("/users/")
async def create_user(user: User):
    return user

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) Field(...)의 첫 인자 '...'는 "필수 값"이라는 의미이며, gt/ge/lt/le, min_length/max_length 같은 제약을 함께 선언할 수 있다.
# 2) 검증에 실패하면 FastAPI가 별도 코드 없이 자동으로 422 Unprocessable Entity와 상세 오류(loc, msg, ctx)를 반환한다.
# 3) EmailStr을 쓰려면 pydantic의 email-validator 확장 설치가 필요하며, "형식이 맞는 문자열"만 검증할 뿐 실제 메일 존재 여부는 확인하지 않는다.
# 4) 이런 선언적 검증 덕분에 개발자가 if/raise로 직접 유효성 검사 코드를 작성할 필요가 없다.
# ---------------------------------------------------------------
```

</details>

*min_length=3, gt=0 등 제약 위반 시 실제 422 오류와 상세 위치(loc)까지 함께 반환됨을 확인*

---

**실행 결과 — Field 검증 (products, 실패/성공)**

**실행 완료**

**실행 결과**: `s632_validation_1`

```
POST /products/ (price=-100, 검증 실패)
{
  "name": "TV",
  "price": -100
}
→ 422
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": [
        "body",
        "name"
      ],
      "msg": "String should have at least 3 characters",
      "input": "TV",
      "ctx": {
        "min_length": 3
      }
    },
    {
      "type": "greater_than",
      "loc": [
        "body",
        "price"
      ],
      "msg": "Input should be greater than 0",
      "input": -100,
      "ctx": {
        "gt": 0.0
      }
    }
  ]
}
POST /products/ (정상)
{
  "name": "Television",
  "price": 500
}
→ 200
{
  "name": "Television",
  "price": 500.0,
  "stock": 10
}
```

---

**실행 결과 — EmailStr 검증 (users, 실패/성공)**

**실행 완료**

**실행 결과**: `s632_validation_2`

```
POST /users/ (잘못된 이메일)
{
  "username": "alice",
  "email": "not-an-email"
}
→ 422
{
  "detail": [
    {
      "type": "value_error",
      "loc": [
        "body",
        "email"
      ],
      "msg": "value is not a valid email address: An email address must have an @-sign.",
      "input": "not-an-email",
      "ctx": {
        "reason": "An email address must have an @-sign."
      }
    }
  ]
}
POST /users/ (정상)
{
  "username": "alice",
  "email": "alice@example.com"
}
→ 200
{
  "username": "alice",
  "email": "alice@example.com"
}
```

---

**실전 코드 — Header/Cookie 의존성**

**예제 코드**: `s633_header_cookie.py`

```python
from fastapi import FastAPI, Header, Cookie
app = FastAPI()
@app.get("/headers/")
async def read_headers(user_agent: str = Header(None)):
    return {"User-Agent": user_agent}
@app.get("/cookies/")
async def read_cookies(session_id: str = Cookie(None)):
    return {"session_id": session_id}
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
6.3.3 Header/Cookie 의존성 — 요청 헤더와 쿠키 값을 함수 인자로 바로 주입받기
"""
from fastapi import FastAPI, Header, Cookie
app = FastAPI()
@app.get("/headers/")
async def read_headers(user_agent: str = Header(None)):   # 'User-Agent' 헤더 값을 자동으로 매핑
    return {"User-Agent": user_agent}
@app.get("/cookies/")
async def read_cookies(session_id: str = Cookie(None)):   # 'session_id' 쿠키 값을 자동으로 매핑
    return {"session_id": session_id}

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) Header(None)/Cookie(None)의 None은 기본값으로, 해당 헤더/쿠키가 없어도 오류 없이 None이 들어온다.
# 2) 파이썬 변수명(user_agent)은 자동으로 하이픈이 붙은 실제 헤더 이름(User-Agent)으로 변환되어 매핑된다.
# 3) Body나 Query처럼 별도의 파싱 코드 없이 함수 인자 선언만으로 HTTP 헤더/쿠키를 꺼내 쓸 수 있다.
# ---------------------------------------------------------------
```

</details>

*Header()/Cookie() 의존성으로 요청 헤더·쿠키 값을 함수 인자처럼 자동 주입*

---

**실행 결과 — Header/Cookie 추출**

**실행 완료**

**실행 결과**: `s633_header_cookie`

```
GET /headers/ (User-Agent: Mozilla/5.0)
→ 200
{
  "User-Agent": "Mozilla/5.0"
}
GET /cookies/ (Cookie: session_id=abc123)
→ 200
{
  "session_id": "abc123"
}
```

---

**실전 코드 — 쿼리+바디 결합**

**예제 코드**: `s634_query_body_combo.py`

```python
from fastapi import FastAPI
app = FastAPI()
@app.post("/order/")
async def create_order(order_id: int, quantity: int, customer: str, address: str = None):
    return {"order_id": order_id, "quantity": quantity, "customer": customer, "address": address}
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
6.3.4 쿼리+바디 결합 — Pydantic 모델 없이 단순 타입 인자만으로 요청 매개변수 구성
"""
from fastapi import FastAPI
app = FastAPI()
@app.post("/order/")
async def create_order(order_id: int, quantity: int, customer: str, address: str = None):
    # 모델 없이 단순 타입만 쓰면 POST여도 전부 Query 매개변수로 해석됨(바디로 안 들어감)
    return {"order_id": order_id, "quantity": quantity, "customer": customer, "address": address}

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) POST 요청이라도 인자가 BaseModel이 아닌 int/str 같은 단순 타입이면 FastAPI는 이를 Query 매개변수로 취급한다(6.3.1의 규칙 재확인).
# 2) 실무에서는 이런 다중 필드 요청도 보통 Pydantic 모델(OrderRequest)로 감싸 Body로 받는 것이 유지보수에 유리하다.
# 3) 이 예제는 "모델 없이 짜면 어떻게 되는가"를 보여주는 대조군으로, 왜 모델화가 필요한지 설명할 때 좋은 소재다.
# ---------------------------------------------------------------
```

</details>

*address는 기본값 None — 생략 시 결과에서 null로 확인 가능*

---

**실행 결과 — 쿼리+바디 결합**

**실행 완료**

**실행 결과**: `s634_query_body_combo`

```
POST /order/?order_id=123&quantity=2&customer=John
→ 200
{
  "order_id": 123,
  "quantity": 2,
  "customer": "John",
  "address": null
}
```

---

**실전 코드 — 파일 업로드(단일/다중)**

**예제 코드**: `s635_file_upload.py`

```python
from fastapi import FastAPI, File, UploadFile
from typing import List
app = FastAPI()
@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    return {"filename": file.filename, "content_type": file.content_type}
@app.post("/upload-multiple/")
async def upload_multiple_files(files: List[UploadFile] = File(...)):
    return {"filenames": [f.filename for f in files]}
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
6.3.5 파일 업로드(단일/다중) — UploadFile로 파일 메타데이터를 받는 두 가지 엔드포인트
"""
from fastapi import FastAPI, File, UploadFile
from typing import List
app = FastAPI()
@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):   # 단일 파일: File(...)로 필수 지정
    return {"filename": file.filename, "content_type": file.content_type}
@app.post("/upload-multiple/")
async def upload_multiple_files(files: List[UploadFile] = File(...)):   # 다중 파일: List[UploadFile]
    return {"filenames": [f.filename for f in files]}

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) UploadFile은 파일을 메모리에 통째로 올리지 않고 스풀 파일로 처리해 대용량 업로드에도 효율적이다.
# 2) 클라이언트는 요청을 반드시 multipart/form-data로 보내야 하며, JSON 바디와 함께 섞어 쓰려면 Form을 추가로 사용해야 한다.
# 3) file.filename, file.content_type 외에도 file.file(실제 파일 객체), await file.read() 등으로 내용에 접근할 수 있다.
# 4) List[UploadFile]로 다중 파일을 받으면 각 파일을 리스트 컴프리헨션 등으로 순회 처리하기 편하다.
# ---------------------------------------------------------------
```

</details>

*TestClient로 실제 바이너리 파일 데이터를 전송해 파일명·MIME 타입 인식을 검증*

---

**실행 결과 — 단일/다중 파일 업로드**

**실행 완료**

**실행 결과**: `s635_file_upload`

```
POST /upload/ (image.jpg)
→ 200
{
  "filename": "image.jpg",
  "content_type": "image/jpeg"
}
POST /upload-multiple/ (a.txt, b.txt)
→ 200
{
  "filenames": [
    "a.txt",
    "b.txt"
  ]
}
```

---

## 6.4 의존성 주입 및 PostgreSQL 연동 — 개요

- **Depends()**: 함수 인자에 다른 함수(의존성)의 반환값을 자동 주입 — 공통 로직(DB 세션, 인증 등)의 재사용에 핵심

- **SQLAlchemy 연동**: create_engine + sessionmaker로 DB 세션 생성 → Depends(get_db)로 각 요청마다 세션 주입

- **연결 정보**: postgresql://postgres:1234@localhost/company — 실제 이 샌드박스의 PostgreSQL 16 서버와 정확히 일치

- **CRUD**: Employee 모델(id, name, age, department, salary) 기준 Create/Read/Update/Delete 4종 엔드포인트

---

**실전 코드 — 기본 의존성 주입**

**예제 코드**: `s641_di.py`

```python
from fastapi import FastAPI, Depends
app = FastAPI()
def common_dependency():
    return "Hello, Dependency!"
@app.get("/")
async def root(dep: str = Depends(common_dependency)):
    return {"message": dep}
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
6.4.1 기본 의존성 주입 — Depends()로 공통 로직을 함수 매개변수에 주입하는 FastAPI 패턴
"""
from fastapi import FastAPI, Depends
app = FastAPI()
def common_dependency():
    return "Hello, Dependency!"  # 의존성 함수: 특별한 데코레이터 없이 반환값만 있으면 됨
@app.get("/")
async def root(dep: str = Depends(common_dependency)):  # Depends(...)가 실행 결과를 dep에 자동 주입
    return {"message": dep}

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) Depends()는 함수를 "미리 실행해서 결과를 매개변수로 꽂아주는" FastAPI의 의존성 주입 도구다.
# 2) common_dependency처럼 단순 값을 반환하는 함수도, DB 세션을 여는 함수도 동일한 방식으로 주입할 수 있다.
# 3) 라우트 함수는 dep이 어디서 왔는지 신경 쓰지 않고 값만 사용 — 로직 재사용과 테스트 용이성이 핵심 장점이다.
# ---------------------------------------------------------------
```

</details>

*common_dependency()의 반환값이 dep 인자로 자동 주입됨*

---

**실행 결과 — 기본 의존성 주입**

**실행 완료**

**실행 결과**: `s641_di`

```
GET / (Depends(common_dependency))
→ 200
{
  "message": "Hello, Dependency!"
}
```

---

**실전 코드 — PostgreSQL 연동 + Employee CRUD**

**예제 코드**: `s644_crud_postgres.py`

```python
from fastapi import FastAPI, Depends
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.orm import sessionmaker, declarative_base, Session
DATABASE_URL = "postgresql://postgres:1234@localhost/company"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    age = Column(Integer)
    department = Column(String)
    salary = Column(Float)
Base.metadata.create_all(bind=engine)
app = FastAPI()
@app.post("/employees/")
def create_employee(name: str, age: int, department: str, salary: float, db: Session = Depends(get_db)):
    employee = Employee(name=name, age=age, department=department, salary=salary)
    db.add(employee); db.commit(); db.refresh(employee)
    return employee
@app.get("/employees/")
def read_employees(db: Session = Depends(get_db)):
    return db.query(Employee).all()
@app.get("/employees/{employee_id}")
def read_employee(employee_id: int, db: Session = Depends(get_db)):
    return db.query(Employee).filter(Employee.id == employee_id).first()
@app.put("/employees/{employee_id}")
def update_employee(employee_id: int, name: str, age: int, department: str, salary: float, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    employee.name = name; employee.age = age; employee.department = department; employee.salary = salary
    db.commit()
    return employee
@app.delete("/employees/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    db.delete(employee); db.commit()
    return {"message": "Employee deleted"}
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
6.4.2~6.4.4 PostgreSQL 연동 및 Employee 테이블 CRUD API 구현
"""
from fastapi import FastAPI, Depends
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.orm import sessionmaker, declarative_base, Session
DATABASE_URL = "postgresql://postgres:1234@localhost/company"  # 접속 문자열(계정/비번/호스트/DB명)
engine = create_engine(DATABASE_URL)  # DB와의 실제 연결을 관리하는 엔진 객체
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)  # 세션 팩토리
Base = declarative_base()  # 모델 클래스들이 상속받을 기본 클래스
def get_db():
    db = SessionLocal()
    try:
        yield db  # 요청 처리 동안만 세션을 열어주는 제너레이터 의존성
    finally:
        db.close()  # 요청이 끝나면(예외가 나도) 반드시 세션을 닫음
class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    age = Column(Integer)
    department = Column(String)
    salary = Column(Float)
Base.metadata.create_all(bind=engine)  # 테이블이 없으면 자동 생성(실무에서는 Alembic 마이그레이션 권장)
app = FastAPI()
@app.post("/employees/")
def create_employee(name: str, age: int, department: str, salary: float, db: Session = Depends(get_db)):
    employee = Employee(name=name, age=age, department=department, salary=salary)
    db.add(employee); db.commit(); db.refresh(employee)  # commit 후 refresh로 DB가 채운 id 등을 다시 읽어옴
    return employee
@app.get("/employees/")
def read_employees(db: Session = Depends(get_db)):
    return db.query(Employee).all()
@app.get("/employees/{employee_id}")
def read_employee(employee_id: int, db: Session = Depends(get_db)):
    return db.query(Employee).filter(Employee.id == employee_id).first()
@app.put("/employees/{employee_id}")
def update_employee(employee_id: int, name: str, age: int, department: str, salary: float, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    employee.name = name; employee.age = age; employee.department = department; employee.salary = salary
    db.commit()  # 주의: 여기서 db.refresh(employee)가 빠져 있음 — 아래 설명 포인트 참고
    return employee  # commit 직후 객체 속성이 expire되어 응답이 빈 객체({})로 나오는 실제 버그
@app.delete("/employees/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    db.delete(employee); db.commit()
    return {"message": "Employee deleted"}

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) get_db()는 yield를 쓰는 제너레이터 의존성 — 요청마다 세션을 열고, 응답 후 finally에서 무조건 close()한다.
# 2) create_employee는 commit() 다음에 refresh(employee)를 호출해 DB가 생성한 id 등을 다시 읽어와 정상적으로 채워진 객체를 반환한다.
# 3) 반면 update_employee는 db.commit()만 하고 refresh()를 호출하지 않는다. SQLAlchemy 세션은 기본 설정(expire_on_commit=True)에서 commit 시점에 객체 속성을 "만료"시키므로, refresh 없이 그대로 반환하면 실행 시 PUT 응답이 빈 객체({})로 돌아오는 버그가 발생한다.
# 4) 이 버그의 해결책은 update_employee의 db.commit() 다음 줄에 db.refresh(employee)를 추가하는 것 — create_employee와 대조해서 "커밋 후 refresh를 안 하면 무슨 일이 생기는지"를 직접 실습으로 확인시키기 좋은 포인트다.
# ---------------------------------------------------------------
```

</details>

*이 샌드박스에 실제 구동 중인 PostgreSQL 16 서버(company DB)에 그대로 연결해 실제 INSERT/SELECT/UPDATE/DELETE 수행*

---

**실행 결과 — 실제 PostgreSQL CRUD (1/2 — POST/GET)**

**실행 완료**

**실행 결과**: `s644_crud_postgres_1`

```
POST /employees/ (실제 PostgreSQL company DB에 INSERT)
→ 200
{
  "id": 1,
  "name": "John Doe",
  "age": 30,
  "department": "IT",
  "salary": 60000.0
}
GET /employees/
→ 200
[
  {
    "name": "John Doe",
    "department": "IT",
    "age": 30,
    "id": 1,
    "salary": 60000.0
  }
]
GET /employees/1
→ 200
{
  "name": "John Doe",
  "department": "IT",
  "age": 30,
  "id": 1,
  "salary": 60000.0
}
```

---

**실행 결과 — 실제 PostgreSQL CRUD (2/2 — PUT/DELETE, 책 코드의 버그)**

**실행 완료**

**실행 결과**: `s644_crud_postgres_2`

```
PUT /employees/1
→ 200
{}
DELETE /employees/1
→ 200
{
  "message": "Employee deleted"
}
```

*※ PUT 결과가 {}로 비어있는 것은 harness 오류가 아니라 책 코드 자체의 버그: update_employee()가 db.commit() 후 db.refresh(employee)를 호출하지 않아, SQLAlchemy의 기본 expire_on_commit 동작으로 반환 객체의 속성이 비어버림 (POST는 db.refresh()가 있어 정상)*

---

## 6.5 FastAPI + 모델 통합 — 개요

- **목표**: PyTorch/TensorFlow로 학습된 모델을 FastAPI 엔드포인트에 로드해 실시간 예측 API로 서빙

- **모델 로드**: torch.load() / tf.keras.models.load_model()로 저장된 가중치 파일을 불러와 예측에 사용

- **학습+버전관리**: 학습 완료 후 정확도·시각을 PostgreSQL model_versions 테이블에 기록해 버전 이력 관리

- **실시간 예측**: WebSocket으로 클라이언트가 특징값을 보내면 서버가 즉시 예측 결과를 반환

---

**실전 코드 — PyTorch 모델 로드 및 예측**

**예제 코드**: `s651_pytorch_predict.py`

```python
import torch, torch.nn as nn
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
class SimpleModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(10, 1)
    def forward(self, x):
        return self.fc(x)
model = SimpleModel()
model.load_state_dict(torch.load("model.pth"))
model.eval()
def predict(input_data: list):
    input_tensor = torch.tensor(input_data, dtype=torch.float32)
    with torch.no_grad():
        output = model(input_tensor)
    return output.numpy().tolist()
app = FastAPI()
class InputData(BaseModel):
    features: List[float]
@app.post("/predict/")
def predict_api(input_data: InputData):
    prediction = predict(input_data.features)
    return {"prediction": prediction}
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
6.5.1 PyTorch 모델 로드 및 FastAPI 예측 API 구현
"""
import torch, torch.nn as nn
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
class SimpleModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(10, 1)  # 입력 10차원 → 출력 1차원의 단순 선형 계층
    def forward(self, x):
        return self.fc(x)
model = SimpleModel()
model.load_state_dict(torch.load("model.pth"))  # 미리 학습되어 저장된 가중치 파일을 불러옴
model.eval()  # 추론 모드 전환(Dropout/BatchNorm 등을 비활성화)
def predict(input_data: list):
    input_tensor = torch.tensor(input_data, dtype=torch.float32)  # 파이썬 리스트 → 텐서 변환
    with torch.no_grad():  # 추론 시 그래디언트 계산을 꺼서 메모리·속도 최적화
        output = model(input_tensor)
    return output.numpy().tolist()  # 텐서를 JSON 응답 가능한 파이썬 리스트로 변환
app = FastAPI()
class InputData(BaseModel):
    features: List[float]  # 요청 바디 검증용 Pydantic 스키마
@app.post("/predict/")
def predict_api(input_data: InputData):
    prediction = predict(input_data.features)
    return {"prediction": prediction}

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) 모델은 서버 시작 시 딱 한 번(모듈 로드 시점)만 로드되고, 이후 요청마다 재사용된다 — 요청마다 로드하면 매우 느려진다.
# 2) model.eval()과 torch.no_grad()는 학습이 아닌 "추론 전용" 실행을 위한 필수 설정이다.
# 3) 텐서는 JSON으로 직접 반환할 수 없으므로 .numpy().tolist()로 순수 파이썬 자료형으로 변환해야 한다.
# 4) Pydantic의 InputData 스키마가 요청 바디의 features 필드 타입을 자동 검증해준다.
# ---------------------------------------------------------------
```

</details>

*책에 model.pth 파일이 제공되지 않아, harness에서 동일 구조(nn.Linear(10,1))로 무작위 초기화된 실제 가중치를 저장 후 다시 로드 — torch.load()와 순전파 자체는 100% 실제 실행*

---

**실행 결과 — PyTorch 모델 예측**

**실행 완료**

**실행 결과**: `s651_pytorch_predict`

```
(사전 학습된 model.pth가 책에 제공되지 않아, 동일 구조(nn.Linear(10,1))로 무작위 초기화된 실제 가중치를 저장 후 다시 로드해 사용 — 예측 알고리즘 자체는 100% 실제 PyTorch 순전파)
POST /predict/
{
  "features": [
    0.5,
    1.2,
    -0.3,
    0.8,
    2.5,
    -1.3,
    0.7,
    0.4,
    -0.6,
    1.5
  ]
}
→ 200
{
  "prediction": [
    -0.17775177955627441
  ]
}
```

---

**실전 코드 — TensorFlow 모델 통합**

**예제 코드**: `s652_tensorflow_predict.py`

```python
import numpy as np, tensorflow as tf
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
model = tf.keras.models.load_model("model.h5")
def predict_tf(input_data: list):
    input_array = np.array([input_data])
    prediction = model.predict(input_array)
    return prediction.tolist()
app = FastAPI()
class InputData(BaseModel):
    features: List[float]
@app.post("/predict_tf/")
def predict_api_tf(input_data: InputData):
    prediction = predict_tf(input_data.features)
    return {"prediction": prediction}
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
6.5.2 TensorFlow(Keras) 모델을 FastAPI 예측 API로 통합
"""
import numpy as np, tensorflow as tf
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
model = tf.keras.models.load_model("model.h5")  # 저장된 Keras 모델 파일(.h5)을 서버 시작 시 로드
def predict_tf(input_data: list):
    input_array = np.array([input_data])  # 배치 차원을 추가해 2차원 배열로 변환(예: (10,) → (1,10))
    prediction = model.predict(input_array)
    return prediction.tolist()
app = FastAPI()
class InputData(BaseModel):
    features: List[float]
@app.post("/predict_tf/")
def predict_api_tf(input_data: InputData):
    prediction = predict_tf(input_data.features)
    return {"prediction": prediction}

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) PyTorch 버전(6.5.1)과 흐름은 동일 — 모델을 전역에서 한 번만 로드하고 요청마다 predict만 호출한다.
# 2) Keras의 model.predict()는 배치 입력을 기대하므로 np.array([input_data])로 차원을 하나 더 감싸줘야 한다.
# 3) numpy 배열도 텐서와 마찬가지로 JSON 직렬화가 안 되므로 .tolist()로 변환한다.
# ---------------------------------------------------------------
```

</details>

*이 프로세스는 torch와 tensorflow를 함께 로드하면 네이티브 라이브러리 충돌로 세그폴트가 발생해(환경 문제) 별도 서브프로세스로 격리 실행 — 코드 자체는 그대로*

---

**실행 결과 — TensorFlow 모델 예측**

**실행 완료**

**실행 결과**: `s652_tensorflow_predict`

```
(사전 학습된 model.h5가 책에 제공되지 않아, 동일 구조(Dense(1))의 실제 Keras 모델을 만들어 저장 후 다시 로드 — tf.keras.models.load_model()과 실제 예측은 100% 실행)
POST /predict_tf/
{
  "features": [
    0.5,
    1.2,
    -0.3,
    0.8,
    2.5,
    -1.3,
    0.7,
    0.4,
    -0.6,
    1.5
  ]
}
→ 200
{
  "prediction": [
    [
      0.7612043619155884
    ]
  ]
}
```

*※ 책에 model.h5 파일이 제공되지 않아 동일 구조(Dense(1))로 실제 모델을 만들어 저장 후 재로드 — 예측은 100% 실제 Keras 실행. load_model() 기본값(compile=True)은 이 샌드박스의 Keras 버전에서 레거시 HDF5 컴파일 정보 역직렬화 오류가 발생해 compile=False로 로드(환경 문제, 화면 코드는 원문 그대로)*

---

**실전 코드 — 모델 학습 + PostgreSQL 버전 저장**

**예제 코드**: `s653_train.py`

```python
import torch, torch.nn as nn, torch.optim as optim
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from datetime import datetime
class ModelVersion(Base):
    __tablename__ = "model_versions"
    id = Column(Integer, primary_key=True, index=True)
    version = Column(String, unique=True, index=True)
    accuracy = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
@app.post("/train/")
def train_model(db: Session = Depends(get_db)):
    X_train = torch.randn(100, 10)
    y_train = torch.randn(100, 1)
    model = SimpleModel()
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.01)
    for epoch in range(100):
        optimizer.zero_grad()
        loss = criterion(model(X_train), y_train)
        loss.backward()
        optimizer.step()
    torch.save(model.state_dict(), "model.pth")
    new_version = ModelVersion(version="1.0", accuracy=0.95)
    db.add(new_version); db.commit()
    return {"message": "Model trained and saved", "accuracy": 0.95}
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
6.5.3 PyTorch 모델 학습 API + PostgreSQL에 모델 버전 기록 저장
"""
import torch, torch.nn as nn, torch.optim as optim
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from datetime import datetime
class ModelVersion(Base):  # 6.4절에서 정의한 Base를 그대로 재사용(같은 앱 파일 내 이어지는 코드)
    __tablename__ = "model_versions"
    id = Column(Integer, primary_key=True, index=True)
    version = Column(String, unique=True, index=True)  # 버전 문자열은 중복 불가
    accuracy = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)  # 레코드 생성 시각 자동 기록
@app.post("/train/")
def train_model(db: Session = Depends(get_db)):
    X_train = torch.randn(100, 10)  # 실습용 더미 데이터(실제로는 DB나 파일에서 로드해야 함)
    y_train = torch.randn(100, 1)
    model = SimpleModel()  # 6.5.1에서 정의한 모델 클래스 재사용
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.01)
    for epoch in range(100):  # 100 에폭 동안 순전파-역전파 반복
        optimizer.zero_grad()
        loss = criterion(model(X_train), y_train)
        loss.backward()
        optimizer.step()
    torch.save(model.state_dict(), "model.pth")  # 학습된 가중치를 파일로 저장(6.5.1이 다음 로드 시 사용)
    new_version = ModelVersion(version="1.0", accuracy=0.95)  # 학습 결과를 DB에 메타데이터로 기록
    db.add(new_version); db.commit()
    return {"message": "Model trained and saved", "accuracy": 0.95}

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) 모델 파일(model.pth)은 파일 시스템에, 버전·정확도 같은 메타데이터는 PostgreSQL에 나눠 저장하는 전형적인 MLOps 패턴이다.
# 2) X_train, y_train은 무작위 더미 텐서 — 실제 서비스라면 검증된 데이터셋으로 교체해야 한다는 점을 강조할 것.
# 3) accuracy=0.95는 실제로 계산된 값이 아니라 하드코딩된 예시값 — 실습 후 학생들이 loss 기반 실제 지표로 바꿔보게 유도하면 좋다.
# 4) 이 코드는 6.4절의 Base/Column/get_db, 6.5.1의 SimpleModel을 그대로 가져다 쓰는 "같은 앱 파일의 연속 코드"임을 짚어준다.
# ---------------------------------------------------------------
```

</details>

*book의 accuracy=0.95는 예시로 고정된 값 — harness는 실제 100 epoch Adam 학습을 수행해 loss 감소분으로 정확도를 계산*

---

**실행 결과 — 실제 100epoch 학습 + PostgreSQL 저장**

**실행 완료**

**실행 결과**: `s653_train`

```
(book의 accuracy=0.95는 예시로 고정된 값 — 여기서는 실제 100 epoch Adam 학습을 수행해 loss 감소분으로 계산한 실제 수치)
POST /train/
→ 200
{
  "message": "Model trained and saved",
  "accuracy": 0.5091,
  "initial_loss": 1.7558,
  "final_loss": 0.862
}
```

---

**실전 코드 — 모델 버전 조회**

**예제 코드**: `s654_model_versions.py`

```python
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
@app.get("/model_versions/")
def get_model_versions(db: Session = Depends(get_db)):
    return db.query(ModelVersion).all()
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
6.5.4 저장된 모델 버전 목록 조회 API
"""
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
@app.get("/model_versions/")
def get_model_versions(db: Session = Depends(get_db)):
    return db.query(ModelVersion).all()  # model_versions 테이블의 모든 레코드를 조회해 반환

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) 6.5.3에서 /train/ 호출 시마다 쌓인 ModelVersion 레코드를 한눈에 조회할 수 있는 엔드포인트다.
# 2) 코드가 짧지만 db.query(...).all() 패턴은 6.4절 read_employees()와 완전히 동일 — CRUD 패턴의 재사용성을 강조하기 좋다.
# 3) 실무에서는 이 목록에서 최신 버전을 골라 실제 서빙 모델을 교체하는 로직(모델 롤아웃)으로 확장할 수 있다.
# ---------------------------------------------------------------
```

</details>

*직전 /train/ 요청으로 저장된 행을 실제 PostgreSQL SELECT로 조회*

---

**실행 결과 — 모델 버전 조회**

**실행 완료**

**실행 결과**: `s654_model_versions`

```
GET /model_versions/ (실제 PostgreSQL 조회 — 직전 /train/에서 저장된 행)
→ 200
[
  {
    "id": 1,
    "version": "1.0",
    "accuracy": 0.5091,
    "created_at": "2026-08-22 02:44:15.238722"
  }
]
```

---

**실전 코드 — WebSocket 실시간 예측**

**예제 코드**: `s655_websocket.py`

```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            features = data["features"]
            prediction = predict(features)
            await websocket.send_json({"prediction": prediction})
    except WebSocketDisconnect:
        pass
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
6.5.5 WebSocket을 이용한 실시간 예측 API
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()  # 클라이언트의 WebSocket 연결 요청을 수락
    try:
        while True:  # 연결이 끊길 때까지 계속 메시지를 주고받음
            data = await websocket.receive_json()  # 클라이언트가 보낸 JSON 데이터 수신
            features = data["features"]
            prediction = predict(features)  # 6.5.1에서 정의한 PyTorch predict() 함수 재사용
            await websocket.send_json({"prediction": prediction})  # 예측 결과를 즉시 클라이언트로 전송
    except WebSocketDisconnect:
        pass  # 클라이언트가 연결을 끊으면 예외를 조용히 무시하고 종료

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) REST API(@app.post)와 달리 WebSocket은 연결을 유지한 채 while True 루프로 여러 번 요청-응답을 주고받는다.
# 2) receive_json()/send_json()으로 별도 파싱 코드 없이 JSON을 주고받을 수 있다 — 실시간 스트리밍 예측에 적합.
# 3) WebSocketDisconnect를 except로 잡지 않으면 클라이언트가 연결을 끊을 때마다 서버 로그에 에러가 남으므로 이 처리가 필수다.
# 4) predict()는 6.5.1에서 정의한 함수를 그대로 재사용 — REST와 WebSocket이 동일한 추론 로직을 공유하는 구조를 보여준다.
# ---------------------------------------------------------------
```

</details>

*TestClient.websocket_connect()로 실제 WebSocket 핸드셰이크 및 양방향 메시지 송수신을 검증*

---

**실행 결과 — WebSocket 실시간 예측**

**실행 완료**

**실행 결과**: `s655_websocket`

```
WS 클라이언트 → 서버: {"features": [0.5, 1.2, -0.3, 0.8, 2.5, -1.3, 0.7, 0.4, -0.6, 1.5]}
WS 서버 → 클라이언트: {"prediction": [-0.17775177955627441]}
```

---

## 6.6 인증 및 보안 — 개요

- **JWT 인증**: python-jose로 토큰 발급/검증 · passlib(bcrypt)로 비밀번호 해시 저장·검증

- **OAuth2 (Google/Facebook)**: authlib으로 소셜 로그인 연동 — 실제 리다이렉트·외부 자격 증명이 필요해 개념 코드로만 소개

- **Basic Auth**: HTTPBasic + HTTPBasicCredentials로 간단한 사용자명/비밀번호 인증

- **미들웨어 보안**: TrustedHostMiddleware(허용 호스트 제한) · CORSMiddleware(교차 출처 제어) · 커스텀 보안 헤더

---

**실전 코드 — JWT 로그인/토큰 발급/검증**

**예제 코드**: `s661_jwt.py`

```python
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
SECRET_KEY = "mysecretkey"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def create_access_token(data: dict, expires_delta=None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    if form_data.username != FAKE_USER["username"] or not pwd_context.verify(
        form_data.password, FAKE_USER["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return {"access_token": create_access_token({"sub": form_data.username}), "token_type": "bearer"}
@app.get("/users/me/")
def read_users_me(token: str = Depends(oauth2_scheme)):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return {"username": payload.get("sub")}
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
6.6.1 JWT 로그인/토큰 발급/검증 — OAuth2PasswordBearer로 토큰 발급 후 보호된 엔드포인트에서 검증
"""
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

SECRET_KEY = "mysecretkey"          # 토큰 서명용 비밀키(실무에서는 환경변수로 분리)
ALGORITHM = "HS256"                 # 대칭키 서명 알고리즘
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")  # 비밀번호 해시/검증 도구

def create_access_token(data: dict, expires_delta=None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))  # 기본 만료 15분
    to_encode.update({"exp": expire})   # JWT 표준 클레임 "exp"에 만료 시각 삽입
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)  # 서명된 JWT 문자열 생성

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")  # "Authorization: Bearer <token>" 헤더를 자동 추출

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):  # username/password 폼 데이터 자동 파싱
    if form_data.username != FAKE_USER["username"] or not pwd_context.verify(
        form_data.password, FAKE_USER["hashed_password"]):  # 평문 비밀번호를 해시와 비교(해시 자체를 비교하지 않음)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return {"access_token": create_access_token({"sub": form_data.username}), "token_type": "bearer"}  # sub 클레임에 사용자 식별자 저장

@app.get("/users/me/")
def read_users_me(token: str = Depends(oauth2_scheme)):  # 의존성 주입으로 토큰 추출(없으면 401 자동 응답)
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])  # 서명 검증 + 만료 확인을 한 번에 수행
    return {"username": payload.get("sub")}

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) 비밀번호는 저장할 때부터 bcrypt로 해시하고, 로그인 시에는 verify()로 "평문 vs 해시"를 비교한다 — 절대 해시를 다시 해서 비교하지 않는다.
# 2) JWT는 "sub"(주체), "exp"(만료시각) 같은 표준 클레임을 담은 서명된 토큰으로, 서버가 세션을 저장하지 않아도 상태를 검증할 수 있다(Stateless).
# 3) OAuth2PasswordBearer(tokenUrl="token")는 실제 인증 로직이 아니라 Swagger UI에 로그인 폼을 띄우고 Authorization 헤더를 파싱해주는 "장치"일 뿐이다.
# 4) jwt.decode()에서 서명이 위조되었거나 만료된 토큰이면 JWTError가 발생하므로, 실전 코드에서는 이를 try/except로 감싸 401을 반환해야 한다(예제는 생략됨).
# ---------------------------------------------------------------
```

</details>

*실제 bcrypt 해시 생성·검증 + 실제 JWT 서명/디코딩까지 100% 실행 (python-jose + passlib)*

---

**실행 결과 — 실제 JWT 로그인/검증/오류 케이스**

**실행 완료**

**실행 결과**: `s661_jwt`

```
POST /token (username=alice, password=secret123)
→ 200
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5...(생략)",
  "token_type": "bearer"
}
GET /users/me/ (Authorization: Bearer <token>)
→ 200
{
  "username": "alice"
}
POST /token (잘못된 비밀번호)
→ 401
{
  "detail": "Invalid credentials"
}
```

---

**참고 코드 — Google/Facebook OAuth2 로그인 (6.6.2)**

- 이 예제는 실행하지 않고 참고용으로만 제시합니다

- authlib을 통한 Google/Facebook OAuth2 연동은 실제 외부 서비스로의 브라우저 리다이렉트와 실 자격 증명(client_id/secret)이 필요해, 이 샌드박스처럼 대화형 브라우저·네트워크 리다이렉트가 없는 환경에서는 안전하게 재현할 수 없습니다.

```python
from authlib.integrations.starlette_client import OAuth
oauth = OAuth()
oauth.register(
    name="google",
    client_id="YOUR_GOOGLE_CLIENT_ID",
    client_secret="YOUR_GOOGLE_CLIENT_SECRET",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)
@app.get("/login/google")
async def login_google(request: Request):
    redirect_uri = request.url_for("auth_google")
    return await oauth.google.authorize_redirect(request, redirect_uri)
@app.get("/auth/google")
async def auth_google(request: Request):
    token = await oauth.google.authorize_access_token(request)
    user = token["userinfo"]
    return dict(user)
```

---

**실전 코드 — HTTP Basic 인증**

**예제 코드**: `s663_basic_auth.py`

```python
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBasic, HTTPBasicCredentials
app = FastAPI()
security = HTTPBasic()
@app.get("/basic-auth/")
def basic_auth(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = "admin"
    correct_password = "password123"
    if credentials.username != correct_username or credentials.password != correct_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"message": "Authenticated"}
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
6.6.3 HTTP Basic 인증 — Authorization 헤더의 아이디/비밀번호를 직접 비교하는 간단한 인증
"""
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBasic, HTTPBasicCredentials

app = FastAPI()
security = HTTPBasic()  # "Authorization: Basic base64(id:pw)" 헤더를 파싱하는 의존성

@app.get("/basic-auth/")
def basic_auth(credentials: HTTPBasicCredentials = Depends(security)):  # 헤더가 없으면 자동으로 401 + 인증창 유도
    correct_username = "admin"
    correct_password = "password123"     # 코드에 평문으로 하드코딩(실무 부적합, 예시용)
    if credentials.username != correct_username or credentials.password != correct_password:  # 단순 문자열 비교
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"message": "Authenticated"}

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) HTTP Basic은 매 요청마다 브라우저가 Base64로 인코딩한 "아이디:비밀번호"를 헤더에 실어 보내는 방식으로, JWT처럼 발급/만료 개념이 없는 가장 원시적인 인증이다.
# 2) Base64는 암호화가 아니라 인코딩이므로 HTTPS 없이 쓰면 아이디/비밀번호가 그대로 노출된다 — 반드시 TLS와 함께 사용해야 한다.
# 3) 이 예제는 비밀번호를 평문 비교하지만, 실무에서는 s661처럼 해시된 값과 비교해야 한다.
# ---------------------------------------------------------------
```

</details>

*TestClient의 auth=(user, pass) 옵션으로 실제 Basic 인증 헤더를 전송해 성공/실패 케이스 모두 검증*

---

**실행 결과 — Basic 인증 성공/실패**

**실행 완료**

**실행 결과**: `s663_basic_auth`

```
GET /basic-auth/ (admin:password123)
→ 200
{
  "message": "Authenticated"
}
GET /basic-auth/ (admin:wrongpass)
→ 401
{
  "detail": "Invalid credentials"
}
```

---

**실전 코드 — CORS/보안 헤더 미들웨어**

**예제 코드**: `s665_security.py`

```python
from fastapi import FastAPI, Request
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["example.com"])
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                    allow_methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["*"])
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
6.6.4~6.6.5 CORS/보안 헤더 미들웨어 — TrustedHost/CORS 미들웨어와 커스텀 보안 헤더 추가
"""
from fastapi import FastAPI, Request
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["example.com"])  # Host 헤더 위조 요청 차단(Host 헤더 스푸핑 방어)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,  # 모든 출처 허용 + 자격증명(쿠키 등) 포함 허용
                    allow_methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["*"])

@app.middleware("http")
async def add_security_headers(request: Request, call_next):  # 모든 요청/응답을 가로채는 커스텀 미들웨어
    response = await call_next(request)  # 실제 라우터 처리를 먼저 실행하고 응답 객체를 받음
    response.headers["X-Frame-Options"] = "DENY"  # 다른 사이트 iframe에 삽입 금지(클릭재킹 방지)
    response.headers["X-Content-Type-Options"] = "nosniff"  # 브라우저의 MIME 타입 추측 실행 방지
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"  # 항상 HTTPS로만 접속하도록 강제(HSTS)
    return response

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) 미들웨어는 위에서 등록한 순서와 반대로(가장 나중에 등록한 것이 가장 먼저) 요청을 처리하며, 모든 요청/응답에 공통 로직을 끼워 넣을 때 사용한다.
# 2) allow_origins=["*"] + allow_credentials=True 조합은 실제 브라우저 스펙상 거부되거나 보안상 위험하므로, 운영 환경에서는 origin을 구체적인 도메인 목록으로 제한해야 한다.
# 3) TrustedHostMiddleware는 CORS(브라우저 측 출처 제어)와 달리 서버가 받는 요청의 Host 헤더 자체를 검증해 도메인 위조 공격을 막는다.
# 4) X-Frame-Options, HSTS 같은 보안 헤더는 코드 로직이 아니라 브라우저에게 "이렇게 방어해달라"고 지시하는 선언적 방어 수단이다.
# ---------------------------------------------------------------
```

</details>

*실제 응답 헤더에 CORS 허용 출처 및 3가지 보안 헤더가 모두 포함되는지 직접 검증*

---

**실행 결과 — 실제 응답 헤더 확인**

**실행 완료**

**실행 결과**: `s665_security`

```
GET / (CORS + 보안 헤더 미들웨어 적용됨)
→ 200
{
  "body": {
    "message": "ok"
  },
  "response_headers": {
    "access-control-allow-origin": "https://myfrontend.com",
    "x-frame-options": "DENY",
    "x-content-type-options": "nosniff",
    "strict-transport-security": "max-age=31536000; includeSubDomains"
  }
}
```

---

## 6.7 비동기 프로그래밍 — 개요

- **AsyncIO 기본**: async def + await로 비동기 함수 정의 · asyncio.run()으로 실행

- **비동기 DB**: asyncpg 드라이버 + SQLAlchemy AsyncSession으로 논블로킹 PostgreSQL 접근

- **BackgroundTasks**: 응답을 즉시 반환하면서 후속 작업(로그 기록 등)을 백그라운드에서 처리

- **SSE/WebSocket 스트리밍**: StreamingResponse로 서버-전송 이벤트, WebSocket으로 양방향 실시간 통신

---

**실전 코드 — AsyncIO 기본 및 비동기 엔드포인트**

**예제 코드**: `s671_asyncio_basic.py`

```python
import asyncio
async def async_function():
    print("비동기 실행 시작")
    await asyncio.sleep(2)
    print("비동기 실행 완료")
asyncio.run(async_function())
# --- FastAPI 비동기 엔드포인트 ---
from fastapi import FastAPI
app = FastAPI()
@app.get("/async-example")
async def async_example():
    await asyncio.sleep(2)
    return {"message": "비동기 API 실행 완료"}
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
6.7.1 AsyncIO 기본 및 비동기 엔드포인트 — asyncio.sleep으로 논블로킹 대기 흐름 확인
"""
import asyncio

async def async_function():          # async def로 선언된 코루틴 함수
    print("비동기 실행 시작")
    await asyncio.sleep(2)           # 2초 동안 "논블로킹"으로 대기(다른 작업에 제어권 양보)
    print("비동기 실행 완료")

asyncio.run(async_function())        # 이벤트 루프를 생성해 코루틴을 실행하는 진입점

# --- FastAPI 비동기 엔드포인트 ---
from fastapi import FastAPI
app = FastAPI()

@app.get("/async-example")
async def async_example():           # 엔드포인트 함수 자체가 코루틴
    await asyncio.sleep(2)           # 대기 중에도 서버는 다른 요청을 동시에 처리 가능
    return {"message": "비동기 API 실행 완료"}

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) time.sleep(2)는 스레드 전체를 멈추는 "블로킹"이지만, await asyncio.sleep(2)는 대기 시간 동안 이벤트 루프가 다른 코루틴을 실행할 수 있게 "제어권을 양보"한다.
# 2) async def로 선언된 함수는 호출만 해서는 실행되지 않고, await로 기다리거나 asyncio.run() 같은 이벤트 루프 진입점이 있어야 실제로 동작한다.
# 3) FastAPI의 async def 엔드포인트는 이 원리를 그대로 활용해, 하나의 요청이 I/O(DB, 외부 API 등) 대기 중일 때도 서버가 다른 요청을 동시에 처리할 수 있게 해준다.
# ---------------------------------------------------------------
```

</details>

*asyncio.sleep(2)를 harness에서 0.3초로 축소해 실제 대기 시간을 직접 측정(로직은 동일)*

---

**실행 결과 — AsyncIO 기본**

**실행 완료**

**실행 결과**: `s671_asyncio_basic`

```
비동기 실행 시작
비동기 실행 완료
(실제 소요 시간: 0.30초 — 책 예제의 asyncio.sleep(2)를 0.3초로 축소해 실행)
```

---

**실행 결과 — 비동기 엔드포인트 응답 시간 측정**

**실행 완료**

**실행 결과**: `s671_async_endpoint`

```
GET /async-example
→ 200
{
  "message": "비동기 API 실행 완료"
}
(실제 응답 시간: 0.30초 — 책 예제의 2초 대기를 0.3초로 축소)
```

---

**실전 코드 — 비동기 PostgreSQL 연동(asyncpg)**

**예제 코드**: `s672_async_db.py`

```python
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
DATABASE_URL = "postgresql+asyncpg://postgres:1234@localhost/company"
async def main():
    engine = create_async_engine(DATABASE_URL, echo=True)
    AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with AsyncSessionLocal() as session:
        new_user = AsyncUser(username="async_alice", email="async_alice@example.com")
        session.add(new_user)
        await session.commit()
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(AsyncUser))
        users = result.scalars().all()
        for u in users:
            print(u.username, u.email)
asyncio.run(main())
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
6.7.2 비동기 PostgreSQL 연동(asyncpg) — SQLAlchemy AsyncSession으로 비동기 insert/select 수행
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select

DATABASE_URL = "postgresql+asyncpg://postgres:1234@localhost/company"  # asyncpg 드라이버 지정(psycopg2와 다름)

async def main():
    engine = create_async_engine(DATABASE_URL, echo=True)  # 비동기 엔진 생성, echo=True로 SQL 로그 출력
    AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)  # 커밋 후에도 객체 속성 유지

    async with AsyncSessionLocal() as session:      # 세션도 async with로 열고 자동으로 닫음
        new_user = AsyncUser(username="async_alice", email="async_alice@example.com")
        session.add(new_user)
        await session.commit()                      # DB write는 await로 대기

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(AsyncUser))  # 쿼리 실행 자체가 await 대상
        users = result.scalars().all()               # 결과에서 ORM 객체 리스트 추출
        for u in users:
            print(u.username, u.email)

asyncio.run(main())

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) 동기 코드의 session.query(...).all() 대신 await session.execute(select(...)) + result.scalars().all() 패턴을 쓰는 것이 SQLAlchemy 2.0 비동기 스타일의 핵심 차이다.
# 2) DB 접속 문자열의 드라이버가 postgresql+asyncpg://로 바뀌는데, 동기용 psycopg2와 달리 asyncpg는 비동기 I/O를 지원하는 별도 드라이버다.
# 3) expire_on_commit=False를 주지 않으면 커밋 직후 객체 속성에 접근할 때 세션이 다시 DB를 조회하려 하며 비동기 컨텍스트에서 오류가 나기 쉽다.
# 4) engine, session 모두 async with로 관리해 커넥션 반납/자원 정리를 명시적으로 보장한다.
# ---------------------------------------------------------------
```

</details>

*asyncpg 드라이버로 실제 PostgreSQL(company DB)에 논블로킹 INSERT/SELECT를 수행*

---

**실행 결과 — 실제 비동기 DB 연동**

**실행 완료**

**실행 결과**: `s672_async_db`

```
실제 asyncpg 드라이버로 PostgreSQL(company DB)에 비동기 연결 — INSERT 후 SELECT 결과:
[
  {
    "id": 1,
    "username": "async_alice",
    "email": "async_alice@example.com"
  }
]
```

---

**실전 코드 — BackgroundTasks**

**예제 코드**: `s673_background.py`

```python
from fastapi import BackgroundTasks, FastAPI
app = FastAPI()
def write_log(message: str):
    with open("log.txt", mode="a") as f:
        f.write(f"{message}\n")
@app.get("/background-task/")
async def run_background_task(background_tasks: BackgroundTasks):
    background_tasks.add_task(write_log, "비동기 작업 실행")
    return {"message": "Background task started"}
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
6.7.3 BackgroundTasks — 응답을 먼저 보내고 로그 기록 같은 후속 작업을 백그라운드로 실행
"""
from fastapi import BackgroundTasks, FastAPI
app = FastAPI()

def write_log(message: str):           # 백그라운드에서 실행될 일반 함수(async 아니어도 됨)
    with open("log.txt", mode="a") as f:
        f.write(f"{message}\n")

@app.get("/background-task/")
async def run_background_task(background_tasks: BackgroundTasks):  # FastAPI가 자동 주입하는 작업 큐 객체
    background_tasks.add_task(write_log, "비동기 작업 실행")  # 함수와 인자를 등록만 하고 즉시 반환
    return {"message": "Background task started"}          # 응답이 먼저 클라이언트에 전달됨

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) add_task로 등록된 write_log는 response가 클라이언트로 전송된 "이후"에 실행되므로, 클라이언트는 로그 기록이 끝나길 기다리지 않고 즉시 응답을 받는다.
# 2) BackgroundTasks는 별도의 메시지 큐(Celery, Redis 등) 없이 같은 프로세스 안에서 가벼운 후속 작업을 처리할 때 적합하며, 무거운 작업이나 재시도가 필요한 작업에는 부적합하다.
# 3) write_log 함수는 동기(def) 함수인데, FastAPI가 내부적으로 별도 스레드풀에서 실행해 이벤트 루프를 막지 않는다.
# ---------------------------------------------------------------
```

</details>

*응답 반환 이후 실제로 log.txt 파일에 기록되는지 파일을 직접 열어 확인*

---

**실행 결과 — 백그라운드 작업 실제 파일 기록 확인**

**실행 완료**

**실행 결과**: `s673_background`

```
GET /background-task/
→ 200
{
  "message": "Background task started"
}
log.txt 실제 기록 내용: "비동기 작업 실행"
```

---

**실전 코드 — SSE 스트리밍 + WebSocket**

**예제 코드**: `s674_stream_ws.py`

```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from starlette.responses import StreamingResponse
import asyncio
app = FastAPI()
async def event_stream():
    for i in range(10):
        yield f"data: Hello {i}\n\n"
        await asyncio.sleep(1)
@app.get("/stream")
async def stream():
    return StreamingResponse(event_stream(), media_type="text/event-stream")
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Received: {data}")
    except WebSocketDisconnect:
        print("WebSocket disconnected")
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
6.7.4 SSE 스트리밍 + WebSocket — 서버 전송 이벤트 스트림과 양방향 실시간 통신 구현
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from starlette.responses import StreamingResponse
import asyncio
app = FastAPI()

async def event_stream():
    for i in range(10):
        yield f"data: Hello {i}\n\n"    # SSE 규격: "data: 내용\n\n" 형태로 한 이벤트씩 전송
        await asyncio.sleep(1)          # 1초 간격으로 이벤트를 순차 전송(연결 유지)

@app.get("/stream")
async def stream():
    return StreamingResponse(event_stream(), media_type="text/event-stream")  # 응답을 청크 단위로 스트리밍

@app.websocket("/ws")                   # HTTP가 아닌 WebSocket 프로토콜 전용 라우트 데코레이터
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()            # 클라이언트의 연결 요청을 수락(핸드셰이크 완료)
    try:
        while True:                     # 연결이 끊길 때까지 계속 메시지를 주고받음
            data = await websocket.receive_text()   # 클라이언트 메시지를 비동기로 대기
            await websocket.send_text(f"Received: {data}")  # 받은 즉시 응답 전송(양방향)
    except WebSocketDisconnect:         # 클라이언트가 연결을 끊으면 예외 발생
        print("WebSocket disconnected")

# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) SSE(event_stream)는 서버 → 클라이언트 단방향 스트림으로, StreamingResponse가 제너레이터의 yield 값을 순서대로 청크 전송한다(실시간 알림, 진행률 표시 등에 적합).
# 2) WebSocket은 한 번 연결(accept)되면 양방향으로 계속 메시지를 주고받는 상시 연결이며, 채팅처럼 클라이언트도 언제든 데이터를 보낼 수 있는 경우에 적합하다.
# 3) WebSocketDisconnect 예외를 반드시 잡아야 클라이언트가 브라우저를 닫거나 네트워크가 끊겼을 때 서버가 비정상 종료 없이 정리 로직을 수행할 수 있다.
# 4) media_type="text/event-stream"을 지정해야 브라우저가 이 응답을 SSE로 인식하고 EventSource로 계속 수신 대기한다.
# ---------------------------------------------------------------
```

</details>

*SSE는 3개 청크만 소비(반복 횟수·대기 축소), WebSocket은 실제 에코 응답을 확인*

---

**실행 결과 — SSE 스트리밍 + WebSocket 에코**

**실행 완료**

**실행 결과**: `s674_stream_ws`

```
GET /stream (StreamingResponse, text/event-stream)
→ 200
data: Hello 0
data: Hello 1
data: Hello 2
WS 클라이언트 → 서버: "hello server"
WS 서버 → 클라이언트: "Received: hello server"
```

---

**6장 정리**

- FastAPI의 비동기·자동 검증·자동 문서화 기반 위에서 PostgreSQL, PyTorch/TensorFlow, JWT/OAuth2, WebSocket/SSE까지 전 영역을 실제로 연동·실행했습니다.

- 실행 환경 안내: model.pth/model.h5는 책에 제공되지 않아 동일 구조로 재생성, torch·tensorflow 동시 로딩 세그폴트는 프로세스 분리로 회피, starlette TemplateResponse는 신형 시그니처로 호출(화면 코드는 모두 책 원문 그대로), Google/Facebook OAuth2는 실제 리다이렉트가 필요해 참고 코드로만 제시했습니다.

- 발견된 책 코드 이슈: 6.4.4 update_employee()가 db.refresh()를 누락해 PUT 응답이 빈 객체({})로 반환되는 실제 SQLAlchemy 동작을 그대로 확인했습니다.
