# FastAPI 실습

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
conda create -n fastapi_env python=3.7.0
```
### 가상 환경 접속
```
conda activate fastapi_env
```
### pip 명령어 안될때
```
conda install pip
```
#### FastAPI 설치

```
pip install fastapi uvicorn
```

#### 설치 확인 | findstr(cmd), grep(리눅스)
```
pip list | findstr fastapi
```

**실전 코드 — 첫 FastAPI 앱**

**예제 코드**: ex01/main.py

```python
from fastapi import FastAPI
# 1. FastAPI 애플리케이션 인스턴스 생성
app = FastAPI()

# 2. 루트 경로("/")에 대한 GET 요청 핸들러 정의
@app.get("/")
async def root():
    # 파이썬 딕셔너리를 반환하면 FastAPI가 자동으로 JSON 포맷으로 직렬화(Serialize)하여 응답
    return {"message": "Hello, FastAPI!"}

@app.get("/items/{item_id}")
# 매개변수에 타입 힌트(int)를 지정하면 FastAPI가 자동으로 형변환과
# 유효성 검사를 수행한다.
# 예: /items/3 -> item_id=3(정수)으로 전달
#     /items/abc -> 자동으로 422 Unprocessable Entity 응답
async def read_item(item_id: int):
    return {"item_id": item_id}

# 문자열 타입 경로 매개변수 예시.
@app.get("/users/{username}")
# item_id와 달리 str 타입이므로 별도 형변환 없이 문자열 그대로 전달된다.
async def read_user(username: str):
    return {"username": username}
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

### FastApi 실행 방법
```
uvicorn main:app --reload
```
---

### API 테스트 
#### 기본 엔드포인트 확인: http://127.0.0.1:8000/ 
#### Swagger UI 문서 확인: http://127.0.0.1:8000/docs 


**실행 결과**: `main.py`

```
GET /
→ 200
{
  "message": "Hello, FastAPI!"
}
```

---

## 6.2 FastAPI 기본 사용법
FastAPI를 효과적으로 사용하기 위해서는 -> 애플리케이션 구조, 라우터 설정, HTTP 메서드, 응답 처리, HTTP 상태 코드 등을 이해하는 것이 중요함

- **기본 구조**: main.py(진입점) · routers/(APIRouter별 분리) · models.py(Pydantic 모델) · database.py(DB 연결)

- **경로(Path) 매개변수**: {item_id}처럼 URL 경로에 변수를 포함 — 타입 힌트(int/str)로 자동 형변환 및 검증

- **APIRouter**: 라우트를 모듈 단위로 분리해 app.include_router()로 등록 — 대규모 프로젝트의 필수 패턴
### 6.2.1. FastAPI 애플리케이션 구조
#### 기본 프로젝트 구조
![](images/Pasted_image_20260902143913.png)

#### 간단한 FastAPI 프로젝트 구조
- main.py: FastAPI 애플리케이션 실행 파일 
- routes/: API 엔드포인트를 정의하는 폴더 
- models/: 데이터베이스 모델을 정의하는 폴더 
- schemas/: 요청 및 응답을 위한 데이터 스키마 정의 
- database.py: 데이터베이스 연결 설정 
- services.py: 비즈니스 로직을 처리하는 파일 
- config.py: 설정 값을 관리하는 파일

### 6.2.2. 경로 및 라우터 설정
API 엔드포인트를 정의할 때 라우트(route)와 경로(path) 개념을 사용
##### (1)기본적인 경로(route) 설정
@app.get(), @app.post(), @app.put(), @app.delete() 등의 데코레이터를 사용하여 경로를 설정

**예제 코드**: `ex01/routes/users.py`
```python
from fastapi import FastAPI
router = APIRouter(prefix="/users", tags=["users"])
@router.get("/{username}")
async def read_user(username: str):
    return {"username": username}
@router.get("/items/{item_id}")
async def read_item(item_id: int):
    return {"item_id": item_id}    
```


<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""6.2.2 경로(Path) 매개변수 및 타입 검증 — 함수 인자 타입 힌트로 자동 형변환·422 검증까지 처리"""
# FastAPI 클래스를 임포트한다.
# FastAPI는 파이썬 웹 프레임워크로, 요청/응답 처리, 라우팅,
# 타입 힌트 기반 데이터 검증, API 문서 자동 생성 기능을 제공한다.
from fastapi import FastAPI

# APIRouter 인스턴스 생성
router = APIRouter(prefix="/users", tags=["users"])

@router.get("/{username}")
async def read_user(username: str):
    return {"username": username}
    
@router.get("/items/{item_id}")
async def read_item(item_id: int):
    return {"item_id": item_id}
# ---------------------------------------------------------------
# [교안용 설명 포인트]
# 1) 경로 매개변수 이름({item_id})과 함수 파라미터 이름(item_id)이 정확히 일치해야 매핑된다.
# 2) 타입 힌트는 단순 문서화가 아니라 실제 런타임 검증 규칙 — Pydantic이 내부에서 값을 검사한다.
# 3) /items/not-an-int처럼 정수가 아닌 값을 넣으면 서버 코드 수정 없이 422 Unprocessable Entity가 자동 반환된다.
# 4) /items/{id}와 /users/{name}처럼 라우트별로 다른 타입 검증 규칙을 독립적으로 걸 수 있다.
# ---------------------------------------------------------------
```

</details>

---
**실행 결과**: `ex01/routes/users.py`
![](images/Pasted_image_20260902153538.png)

##### docs에서 테스트
![](images/Pasted_image_20260902154356.png)
![](images/Pasted_image_20260902154456.png)

---

## **실전 코드 — HTTP 메서드(GET/POST/PUT/DELETE)**

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
#### FastAPI 서버 실행
```
uvicorn s623_http_methods:app --reload
```

**실행 결과 — HTTP 메서드 4종 (1/2 — GET/POST/PUT/DELETE)**

**FastAPI에 접속하여 결과 확인**
---
![](images/Pasted_image_20260902162029.png)

---
## **실전 코드 — JSON/HTML 응답**

```
pip install jinja2    -- 설치후 서버 실행
uvicorn s624_response:app --reload -- 서버 실행
```

**예제 코드**: `ex01/templates/index.html` 이 꼭 있어야 API /html 호출 시 실행됨
```
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>FastAPI Jinja2</title>
</head>
<body>
    <h1>{{ message }}</h1>
</body>
</html>
```

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

### **실행 결과 — JSON/HTML 응답**

![](images/Pasted_image_20260902175635.png)

---

## **실전 코드 — 상태 코드 및 예외 처리**

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
![](images/Pasted%20image%2020260902182030.png)

> 200_OK로 코드 바꾸면 아래와 같이 나옴
> ![](images/Pasted%20image%2020260902181915.png)

---

## **실행 결과 — 상태 코드 및 커스텀 예외 처리**

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

## **실전 코드 — Path/Query/Body 매개변수**

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

### **실행 결과 — Path/Query/Body 4종 요청 (1/2)**

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

### **실행 결과 — Path/Query/Body 4종 요청 (2/2)**

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

## **실전 코드 — Pydantic Field·EmailStr 검증**
```
pip install email-validator
uvicorn s632_validation:app --reload
```

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

### **실행 결과 — Field 검증 (products, 실패/성공)**

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

### **실행 결과 — EmailStr 검증 (users, 실패/성공)**

Post 값에 @이메일 주소 안붙이면 422에러 남
![](images/Pasted%20image%2020260902185112.png)
![](images/Pasted%20image%2020260902185155.png)

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

![](images/Pasted%20image%2020260902184902.png)

---
## **실전 코드 — Header/Cookie 의존성**

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
### **실행 결과 — Header/Cookie 추출**

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
![](images/Pasted%20image%2020260902203227.png)

---

## **실전 코드 — 쿼리+바디 결합**

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
### **실행 결과 — 쿼리+바디 결합**

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

![](images/Pasted%20image%2020260902203529.png)

---

## **실전 코드 — 파일 업로드(단일/다중)**
```
pip install python-multipart
uvicorn s635_file_upload:app --reload
```

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
### **실행 결과 — 단일/다중 파일 업로드**

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

![](images/Pasted%20image%2020260902203807.png)

---

## 6.4 의존성 주입 및 PostgreSQL 연동 — 개요

- **Depends()**: 함수 인자에 다른 함수(의존성)의 반환값을 자동 주입 — 공통 로직(DB 세션, 인증 등)의 재사용에 핵심

- **SQLAlchemy 연동**: create_engine + sessionmaker로 DB 세션 생성 → Depends(get_db)로 각 요청마다 세션 주입

- **연결 정보**: postgresql://postgres:1111@localhost/company — 실제 이 샌드박스의 PostgreSQL 16 서버와 정확히 일치

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

```
GET / (Depends(common_dependency))
→ 200
{
  "message": "Hello, Dependency!"
}
```

---

### **실전 코드 — PostgreSQL 연동 + Employee CRUD**
```
pip install sqlalchemy
pip install psycopg2
uvicorn s644_crud_postgres:app --reload
```

> PUT 할때 실제 eployees 테이블에 있는 id pk 있는 번호로 테스트 함 => 1

**예제 코드**: `s644_crud_postgres.py`

```python
from fastapi import FastAPI, Depends
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.orm import sessionmaker, declarative_base, Session
DATABASE_URL = "postgresql://postgres:11114@localhost/company"
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
DATABASE_URL = "postgresql://postgres:1111@localhost/company"  # 접속 문자열(계정/비번/호스트/DB명)
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

**실행 결과 — 실제 PostgreSQL CRUD (2/2 — PUT/DELETE)**


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

### **실전 코드 — PyTorch 모델 로드 및 예측**
```
pip install "numpy<2.0.0"
python -c "import torch, torch.nn as nn; torch.save(nn.Linear(10, 1).state_dict(), 'model.pth')"
uvicorn s651_pytorch_predict:app --reload
```

**예제 코드**: `s651_pytorch_predict.py`

```python
"""
PyTorch Linear 모델 기반 FastAPI 실시간 예측 API 서빙 예제
"""
import torch
import torch.nn as nn
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

# 1. 모델 아키텍처 정의
class SimpleModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(10, 1)

    def forward(self, x):
        return self.fc(x)

# 2. 모델 인스턴스 생성 및 안전한 로드 (해결 방법 2 적용)
model = SimpleModel()
try:
    # 기존 가중치 파일 로드 시도
    model.load_state_dict(torch.load("model.pth", map_location="cpu"))
except (RuntimeError, FileNotFoundError):
    # 파일이 없거나 state_dict 키(fc.weight 등)가 불일치하면
    # 현재 SimpleModel 규격으로 model.pth를 새로 생성하여 로드
    torch.save(model.state_dict(), "model.pth")
    model.load_state_dict(torch.load("model.pth", map_location="cpu"))

# 추론 모드 전환
model.eval()

# 3. 추론 함수 정의
def predict(input_data: list):
    input_tensor = torch.tensor(input_data, dtype=torch.float32)
    # 1차원 데이터가 들어올 경우를 대비해 배치 차원 추가 ([10] -> [1, 10])
    if input_tensor.ndim == 1:
        input_tensor = input_tensor.unsqueeze(0)
    with torch.no_grad():
        output = model(input_tensor)
    return output.squeeze().tolist()
    
# 4. FastAPI 인스턴스 생성
app = FastAPI(title="PyTorch Model Serving")

# 5. Pydantic 요청 스키마 정의
class InputData(BaseModel):
    features: List[float]

# 6. 실시간 예측 엔드포인트
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
"""
PyTorch Linear 모델 기반 FastAPI 실시간 예측 API 서빙 예제
"""

import torch
import torch.nn as nn
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List

# 1. 모델 아키텍처 정의
class SimpleModel(nn.Module):
    def __init__(self):
        super().__init__()
        # 입력 특성 수: 10, 출력: 1 (회귀 또는 이진 분류 전 단계)
        self.fc = nn.Linear(10, 1)

    def forward(self, x):
        return self.fc(x)

# 2. 모델 인스턴스 생성 및 가중치 파일 로드
model = SimpleModel()

# map_location='cpu'를 지정하면 GPU에서 학습된 가중치도 CPU 전용 서버에서 에러 없이 로드 가능
# weights_only=True 옵션은 파이토치 최신 버전에서 임의 코드 실행 보안 취약점을 방지합니다.
model.load_state_dict(torch.load("model.pth", map_location="cpu", weights_only=True))

# 평가/추론 전용 모드 전환 (Dropout, BatchNorm 등의 동작을 추론용으로 고정)
model.eval()

# 3. 추론 함수 정의
def predict(input_data: list):
    # 입력 리스트를 PyTorch Tensor로 변환
    input_tensor = torch.tensor(input_data, dtype=torch.float32)
    
    # 1차원 데이터([10])가 들어올 경우 모델 연산을 위해 배치 차원 추가 -> shape: [1, 10]
    if input_tensor.ndim == 1:
        input_tensor = input_tensor.unsqueeze(0)
    
    # 기울기(Gradient) 계산 비활성화 (메모리 절약 및 연산 속도 향상)
    with torch.no_grad():
        output = model(input_tensor)
    # 파이토치 핵심 모듈(텐서 연산) 및 신경망 계층(nn.Module, nn.Linear 등)을 임포트한다.
import torch
import torch.nn as nn

# FastAPI 프레임워크와 요청 데이터 검증을 위한 Pydantic BaseModel을 임포트한다.
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

# -------------------------------------------------------------
# 1. 모델 아키텍처 정의
# -------------------------------------------------------------
# PyTorch의 모든 신경망 모듈은 nn.Module을 상속받아 구현한다.
class SimpleModel(nn.Module):
    def __init__(self):
        super().__init__()
        # 10개의 입력 특성을 받아 1개의 출력값을 계산하는 단일 선형 회귀(Linear) 레이어 정의
        # 내부 파라미터는 'fc.weight'와 'fc.bias'라는 이름으로 관리된다.
        self.fc = nn.Linear(10, 1)

    def forward(self, x):
        # 순전파 연산: x에 가중치를 곱하고 편향을 더해(Wx + b) 반환한다.
        return self.fc(x)

# -------------------------------------------------------------
# 2. 모델 인스턴스 생성 및 안전한 가중치 로드
# -------------------------------------------------------------
# 정의된 구조를 기반으로 모델 인스턴스를 메모리에 생성한다.
model = SimpleModel()

try:
    # 기존 가중치 파일(model.pth)을 CPU 디바이스에 맞춰 로드한다.
    # map_location="cpu": GPU에서 학습된 가중치 파일도 CPU 전용 서버에서 에러 없이 로드하도록 설정
    model.load_state_dict(torch.load("model.pth", map_location="cpu"))
except (RuntimeError, FileNotFoundError):
    # 파일이 아직 없거나(FileNotFoundError),
    # 기존 파일의 레이어 이름이 현재 클래스(fc.weight 등)와 맞지 않아 키 불일치가 발생할 경우(RuntimeError):
    # 1) 현재 SimpleModel의 초기 가중치 상태를 파일로 새로 저장한다.
    torch.save(model.state_dict(), "model.pth")
    # 2) 새로 생성한 가중치 파일을 다시 로드하여 런타임 오류를 방지한다.
    model.load_state_dict(torch.load("model.pth", map_location="cpu"))

# 모델을 추론/평가 모드로 전환한다.
# Dropout, BatchNorm 등의 레이어가 학습 모드에서 추론 모드로 고정된다.
model.eval()

# -------------------------------------------------------------
# 3. 추론 함수 정의
# -------------------------------------------------------------
def predict(input_data: list):
    # 클라이언트로부터 전달받은 파이썬 리스트를 32비트 부동소수점 텐서로 변환한다.
    input_tensor = torch.tensor(input_data, dtype=torch.float32)

    # PyTorch 레이어는 기본적으로 [배치 크기, 입력 차원]의 2차원 입력을 요구한다.
    # 1차원 데이터([10])가 들어온 경우 0번 축에 차원을 추가하여 2차원([1, 10]) 형태로 맞춘다.
    if input_tensor.ndim == 1:
        input_tensor = input_tensor.unsqueeze(0)

    # 추론 시에는 역전파(Backpropagation)에 필요한 기울기(Gradient)를 계산할 필요가 없으므로
    # torch.no_grad()를 적용해 메모리 사용량을 줄이고 추론 속도를 높인다.
    with torch.no_grad():
        output = model(input_tensor)

    # 연산 결과 텐서에서 불필요한 1차원 축을 제거(squeeze)한 후,
    # JSON 직렬화가 가능하도록 파이썬 표준 리스트(또는 단일 float)로 변환하여 반환한다.
    return output.squeeze().tolist()

# -------------------------------------------------------------
# 4. FastAPI 인스턴스 생성
# -------------------------------------------------------------
# 웹 애플리케이션 진입점 생성 (Swagger 문서의 제목 설정)
app = FastAPI(title="PyTorch Model Serving")

# -------------------------------------------------------------
# 5. Pydantic 요청 스키마 정의
# -------------------------------------------------------------
# HTTP POST 요청 본문(JSON Body)의 데이터 규격을 정의한다.
# 클라이언트가 보낸 JSON의 "features" 키가 float 리스트 형태인지 자동으로 검증한다.
class InputData(BaseModel):
    features: List[float]

# -------------------------------------------------------------
# 6. 실시간 예측 엔드포인트
# -------------------------------------------------------------
# POST /predict/ 경로로 들어오는 요청을 처리하는 핸들러 함수
@app.post("/predict/")
def predict_api(input_data: InputData):
    # Pydantic을 통과해 유효성이 검증된 features 리스트를 추론 함수로 전달한다.
    prediction = predict(input_data.features)
    
    # 모델 예측 결과를 딕셔너리로 감싸서 반환하면 FastAPI가 JSON 포맷으로 자동 응답한다.
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

---

### **실행 결과 — PyTorch 모델 예측**
> API 테스트시 Edit Value에 JSON 값 넣어줌 =>
> {
  "features": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0]
}

![](images/Pasted%20image%2020260902224845.png)
![](images/Pasted%20image%2020260902225029.png)

---

### **실전 코드 — TensorFlow 모델 통합**
#### 모듈 설치
```
pip install tensorflow "numpy<2.0.0"  -- 텐서플로우 버전충돌
pip uninstall -y tensorflow
pip install "tensorflow<2.13.0"
pip install "urllib3<2.0.0"
```

**예제 코드**: `s652_tensorflow_predict.py`

```python
import collections
import os
from typing import List
import typing
import typing_extensions

# 1. Python 3.7 typing 호환성 패치 (OrderedDict 제네릭 지원)
typing.OrderedDict = typing_extensions.OrderedDict

import numpy as np
import tensorflow as tf
from fastapi import FastAPI
from pydantic import BaseModel

# 2. model.h5 자동 생성 및 로드
MODEL_PATH = "model.h5"

if not os.path.exists(MODEL_PATH):
    # 입력 특성 10개, 출력 1개인 회귀 모델 생성 및 저장
    dummy_model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(10,)),
        tf.keras.layers.Dense(1)
    ])
    dummy_model.compile(optimizer="adam", loss="mse")
    dummy_model.save(MODEL_PATH)

# 모델 로드
model = tf.keras.models.load_model(MODEL_PATH)

# 3. FastAPI 앱 및 Pydantic 스키마 정의
app = FastAPI(title="TensorFlow Model Serving")

class InputData(BaseModel):
    features: List[float]

# 4. 실시간 예측 엔드포인트
@app.post("/predict/")
def predict_api(input_data: InputData):
    # 입력 데이터 shape를 [1, 10]으로 변환
    input_array = np.array([input_data.features], dtype=np.float32)
    
    # Keras 추론 실행
    prediction = model.predict(input_array, verbose=0)
    
    # JSON 직렬화를 위해 float 값으로 반환
    return {"prediction": float(prediction.squeeze())}
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
6.5.2 TensorFlow(Keras) 모델을 FastAPI 예측 API로 통합
"""
import collections
import os
from typing import List
import typing
import typing_extensions

# 1. Python 3.7 typing 호환성 패치 (OrderedDict 제네릭 지원)
typing.OrderedDict = typing_extensions.OrderedDict

import numpy as np
import tensorflow as tf
from fastapi import FastAPI
from pydantic import BaseModel

# 2. model.h5 자동 생성 및 로드
MODEL_PATH = "model.h5"

if not os.path.exists(MODEL_PATH):
    # 입력 특성 10개, 출력 1개인 회귀 모델 생성 및 저장
    dummy_model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(10,)),
        tf.keras.layers.Dense(1)
    ])
    dummy_model.compile(optimizer="adam", loss="mse")
    dummy_model.save(MODEL_PATH)

# 모델 로드
model = tf.keras.models.load_model(MODEL_PATH)

# 3. FastAPI 앱 및 Pydantic 스키마 정의
app = FastAPI(title="TensorFlow Model Serving")

class InputData(BaseModel):
    features: List[float]

# 4. 실시간 예측 엔드포인트
@app.post("/predict/")
def predict_api(input_data: InputData):
    # 입력 데이터 shape를 [1, 10]으로 변환
    input_array = np.array([input_data.features], dtype=np.float32)
    
    # Keras 추론 실행
    prediction = model.predict(input_array, verbose=0)
    
    # JSON 직렬화를 위해 float 값으로 반환
    return {"prediction": float(prediction.squeeze())}

# ---------------------------------------------------------------
# [교안용 설명 포인트].
# ---------------------------------------------------------------
```

</details>

*이 프로세스는 torch와 tensorflow를 함께 로드하면 네이티브 라이브러리 충돌로 세그폴트가 발생해(환경 문제) 별도 서브프로세스로 격리 실행 — 코드 자체는 그대로*

---

### **실행 결과 — TensorFlow 모델 예측**

![](images/Pasted%20image%2020260902232554.png)


---

### **실전 코드 — 모델 학습 + PostgreSQL 버전 저장**

**예제 코드**: `s653_train.py`

```python
import datetime
from typing import List
from fastapi import Depends, FastAPI, HTTPException
import numpy as np
from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Float, Integer, String, create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

# -------------------------------------------------------------
# 1. 데이터베이스 설정 (SQLite)
# -------------------------------------------------------------
DATABASE_URL = "sqlite:///./models.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
# -------------------------------------------------------------
# 2. SQLAlchemy ORM 모델 정의
# -------------------------------------------------------------

class ModelVersion(Base):
    __tablename__ = "model_versions"
    id = Column(Integer, primary_key=True, index=True)
    version = Column(String, unique=True, index=True)
    accuracy_or_loss = Column(Float)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
# DB 테이블 자동 생성
Base.metadata.create_all(bind=engine)

# DB 세션 의존성 주입 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
# -------------------------------------------------------------
# 3. FastAPI 및 Pydantic 스키마 정의
# -------------------------------------------------------------
app = FastAPI(title="Model Training & Versioning API")

class TrainRequest(BaseModel):
    version: str
    description: str = "Linear Regression Model Training"
    epochs: int = 100
    
class ModelVersionResponse(BaseModel):
    id: int
    version: str
    accuracy_or_loss: float
    description: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True  # Pydantic v2 호환 (v1일 경우 orm_mode = True)
# -------------------------------------------------------------
# 4. 학습 엔드포인트
# -------------------------------------------------------------

@app.post("/train/", response_model=ModelVersionResponse)
def train_model(request: TrainRequest, db: Session = Depends(get_db)):
    # 1) 동일 버전 중복 검사
    existing_version = (
        db.query(ModelVersion)
        .filter(ModelVersion.version == request.version)
        .first()
    )

    if existing_version:
        raise HTTPException(
            status_code=400, detail=f"Version '{request.version}' already exists."
        )

    # 2) 모델 학습 로직 (더미 학습 예시: y = 2x + 1)
    x_data = np.random.rand(100, 10).astype(np.float32)

    # 실제 학습을 대신하여 모의 손실(Loss) 계산
    simulated_loss = float(np.random.uniform(0.01, 0.1))

    # 3) DB에 학습 메타데이터 기록
    model_record = ModelVersion(
        version=request.version,
        accuracy_or_loss=simulated_loss,
        description=request.description,
    )
    db.add(model_record)
    db.commit()
    db.refresh(model_record)

    return model_record
# -------------------------------------------------------------
# 5. 버전 목록 조회 엔드포인트
# -------------------------------------------------------------
@app.get("/versions/", response_model=List[ModelVersionResponse])
def list_model_versions(db: Session = Depends(get_db)):
    versions = (
        db.query(ModelVersion).order_by(ModelVersion.id.desc()).all()
    )
    return versions
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
6.5.3 PyTorch 모델 학습 API + PostgreSQL에 모델 버전 기록 저장
"""
import datetime
from typing import List

# FastAPI 프레임워크 핵심 모듈 및 의존성 주입(Depends), 예외 처리(HTTPException)를 임포트한다.
from fastapi import Depends, FastAPI, HTTPException
# 데이터 전처리 및 수치 연산을 위한 NumPy를 임포트한다.
import numpy as np
# 요청/응답 본문의 데이터 유효성 검증을 위한 Pydantic BaseModel을 임포트한다.
from pydantic import BaseModel
# SQLAlchemy ORM 매핑 및 DB 엔진 생성을 위한 컴포넌트들을 임포트한다.
from sqlalchemy import Column, DateTime, Float, Integer, String, create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

# -------------------------------------------------------------
# 1. 데이터베이스 설정 (SQLite)
# -------------------------------------------------------------
# 로컬 디렉터리에 models.db 파일 형태로 저장되는 SQLite DB URL을 정의한다.
DATABASE_URL = "sqlite:///./models.db"

# 데이터베이스 연결 엔진 생성
# connect_args={"check_same_thread": False}:
# SQLite는 기본적으로 동일 스레드 접근만 허용하므로, FastAPI 멀티스레드 비동기 환경에서 동작할 수 있도록 제한을 해제한다.
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# DB 세션을 생성하는 팩토리(SessionLocal)를 정의한다.
# autocommit=False: 명시적으로 db.commit()을 호출해야만 데이터가 반영된다.
# autoflush=False: 쿼리 실행 시 버퍼의 변경 사항을 자동 플러시하지 않는다.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ORM 매핑 모델들이 상속받을 베이스 클래스를 생성한다.
Base = declarative_base()


# -------------------------------------------------------------
# 2. SQLAlchemy ORM 모델 정의
# -------------------------------------------------------------
class ModelVersion(Base):
    # 실제 SQLite 데이터베이스에 생성될 테이블 이름을 지정한다.
    __tablename__ = "model_versions"

    # 고유 식별자(기본키, 자동 증가)
    id = Column(Integer, primary_key=True, index=True)
    # 모델 버전 식별 문자열 (중복 불가, 검색 최적화를 위해 인덱스 생성)
    version = Column(String, unique=True, index=True)
    # 학습 결과 메트릭(정확도 또는 손실값)을 저장할 실수형 필드
    accuracy_or_loss = Column(Float)
    # 모델에 대한 부가 설명 (비어있을 수 있음)
    description = Column(String, nullable=True)
    # 레코드 생성 시각 (기본값으로 UTC 현재 시각 저장)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# 정의된 ORM 모델 구조를 바탕으로 실제 DB 파일에 테이블이 없으면 생성한다.
Base.metadata.create_all(bind=engine)


# FastAPI 엔드포인트에서 사용할 DB 세션 의존성(Dependency) 함수
def get_db():
    # 요청마다 독립된 새 DB 세션을 연다.
    db = SessionLocal()
    try:
        # yield를 통해 라우트 핸들러 함수에 세션을 전달한다.
        yield db
    finally:
        # 엔드포인트 처리가 끝나거나 에러가 발생해도 반드시 커넥션을 닫아 누수를 방지한다.
        db.close()


# -------------------------------------------------------------
# 3. FastAPI 및 Pydantic 스키마 정의
# -------------------------------------------------------------
# API 애플리케이션 인스턴스 생성
app = FastAPI(title="Model Training & Versioning API")


# 클라이언트가 POST /train/ 요청 시 전송해야 하는 요청 본문(JSON) 규격
class TrainRequest(BaseModel):
    version: str
    description: str = "Linear Regression Model Training"
    epochs: int = 100


# 클라이언트에게 반환할 응답 데이터(JSON) 규격
class ModelVersionResponse(BaseModel):
    id: int
    version: str
    accuracy_or_loss: float
    description: str
    created_at: datetime.datetime

    class Config:
        # SQLAlchemy ORM 객체의 속성을 Pydantic 모델이 자동으로 읽어들여 직렬화할 수 있도록 설정
        # (Pydantic v2 기준 from_attributes = True, v1 기준 orm_mode = True)
        from_attributes = True


# -------------------------------------------------------------
# 4. 학습 엔드포인트
# -------------------------------------------------------------
# response_model: 반환하는 ORM 객체를 ModelVersionResponse 스키마에 맞춰 JSON으로 변환
@app.post("/train/", response_model=ModelVersionResponse)
def train_model(request: TrainRequest, db: Session = Depends(get_db)):
    # 1) 동일한 버전명이 이미 DB에 존재하는지 중복 검사
    existing_version = (
        db.query(ModelVersion)
        .filter(ModelVersion.version == request.version)
        .first()
    )
    if existing_version:
        # 이미 존재하는 버전일 경우 400 Bad Request 에러를 클라이언트에 반환
        raise HTTPException(
            status_code=400, detail=f"Version '{request.version}' already exists."
        )

    # 2) 모델 학습 로직 (실제 학습 파이프라인 대신 모의 연산 예시)
    # 입력 데이터 더미 생성
    x_data = np.random.rand(100, 10).astype(np.float32)
    # 학습 완료 후 나온 모의 손실(Loss) 값 산출
    simulated_loss = float(np.random.uniform(0.01, 0.1))

    # 3) DB에 새로 학습된 모델의 메타데이터 레코드 생성
    model_record = ModelVersion(
        version=request.version,
        accuracy_or_loss=simulated_loss,
        description=request.description,
    )
    # 트랜잭션 대기열에 추가
    db.add(model_record)
    # DB에 실제 저장(커밋)
    db.commit()
    # 생성된 자동 증가 ID, 기본 생성 시각 등을 DB로부터 다시 읽어와 객체 갱신
    db.refresh(model_record)

    # 저장된 ORM 모델 객체 반환
    return model_record


# -------------------------------------------------------------
# 5. 버전 목록 조회 엔드포인트
# -------------------------------------------------------------
# 등록된 모든 모델 버전 메타데이터를 역순(최신순)으로 조회하여 반환
@app.get("/versions/", response_model=List[ModelVersionResponse])
def list_model_versions(db: Session = Depends(get_db)):
    # ID 역순 정렬 후 전체 레코드 조회
    versions = (
        db.query(ModelVersion).order_by(ModelVersion.id.desc()).all()
    )
    return versions

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

![](images/Pasted%20image%2020260902233728.png)

---

**6장 정리**

- FastAPI의 비동기·자동 검증·자동 문서화 기반 위에서 PostgreSQL, PyTorch/TensorFlow 전 영역을 실제로 연동·실행했습니다.

