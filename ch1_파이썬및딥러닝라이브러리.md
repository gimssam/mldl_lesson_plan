**1장. 파이썬 및 딥러닝 라이브러리 환경 구성**

# 1장. 파이썬 및 딥러닝 라이브러리 환경 구성

miniconda · Visual Studio Code · PostgreSQL 설치와 Python 가상환경 구성 · 데이터 준비 · FastAPI 웹 프레임워크 연동

*파이썬 인공지능 풀스택 · 교재 9~45쪽*

이 장은 이후 모든 차시에서 공통으로 사용할 개발 환경을 만드는 과정이다. Visual Studio Code와 miniconda3로 Python 실행 환경을 갖추고, PostgreSQL과 pip로 모델 학습에 쓸 데이터베이스·패키지를 준비한 다음, 그 데이터를 실제로 서비스하는 FastAPI 웹 프레임워크까지 한 번에 연결해본다. 절 구성은 1.1 개발 환경 구성, 1.2 데이터베이스 설치와 데이터 준비, 1.3 FastAPI 웹 프레임워크 순서다.

## 1. 개발 환경 구성 — Visual Studio Code · miniconda · 가상환경

### 1.1 Visual Studio Code 설치

Visual Studio Code(VS Code)는 Microsoft가 제공하는 무료 편집기로, 그 자체는 가벼운 텍스트 편집기이지만 확장 프로그램을 설치하면 Python 개발에 필요한 통합 개발 환경(IDE) 기능을 모두 얻을 수 있다. 다양한 터미널 환경, 가상환경 선택, 실행·디버깅, 미리보기 기능을 확장 프로그램 하나로 붙였다 뗄 수 있다는 점이 핵심이다.

설치 절차는 다음과 같다.

1. `code.visualstudio.com/Download`에 접속해 **User Installer(x64)** 를 내려받는다. (교재 그림 1-1)
2. Downloads 디렉터리에서 `VSCodeUserSetup-x64-*.exe` 파일을 더블클릭해 설치를 시작한다. (교재 그림 1-2)
3. 라이선스 동의 화면에서 "동의합니다(A)"를 선택하고 다음으로 진행한다. (교재 그림 1-3)
4. 바탕화면 바로가기·파일 형식 편집기 등록·PATH 추가 등 추가 작업 항목을 체크한 뒤 설치를 진행한다. (교재 그림 1-4)
5. 설치 완료 화면에서 종료를 클릭하면 VS Code가 자동으로 실행된다. (교재 그림 1-5)

### 1.2 miniconda3 설치와 가상환경 관리 도구 준비

miniconda3는 Google Colab과 비슷한 Python 실행 환경을 로컬에 그대로 재현해주는 도구로, Jupyter Notebook 실행과 가상환경(Conda env) 관리를 함께 담당한다. 설치는 Windows 명령 프롬프트(cmd)를 관리자 권한으로 열고, Anaconda 공식 문서의 "Quick command line install" 가이드에 있는 명령을 그대로 붙여넣는 방식으로 진행한다. (교재 그림 1-6, 1-7)

**예제 코드**: `cmd (관리자 권한)`

```cmd
curl https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe -o miniconda.exe
start /wait "" .\miniconda.exe /S
del miniconda.exe
```

*miniconda 설치 파일을 내려받아 무인 설치(`/S`)로 실행한 뒤 설치 파일을 삭제하는 3줄짜리 명령이다. Quick command line install 가이드 페이지의 Copy to clipboard 버튼을 쓰면 그대로 붙여넣을 수 있다.*

**실행 결과**: `cmd (관리자 권한)` — 교재 원문 인용

```
curl https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe -o miniconda.exe
start /wait "" .\miniconda.exe /S
del miniconda.exe
(설치 완료 후 프롬프트로 복귀 — 별도 출력 없음)
```

*클라우드 실습 환경은 네트워크 정책상 conda/miniconda 설치 파일 다운로드가 차단되어 있어(패키지 레지스트리 외 접속 불가) 이 명령은 직접 실행하지 않고, 교재 지면에 인쇄된 실제 명령과 출력을 그대로 인용했다. 실습은 Windows PC에서 진행한다.*

설치가 끝나면 Windows 시작 메뉴에서 **Miniconda3 (64-bit) → Anaconda Prompt** 를 실행하고, 패키지를 conda-forge 채널에서 우선적으로 받아오도록 채널 설정을 바꾼다. (교재 그림 1-8)

**예제 코드**: `Anaconda Prompt`

```cmd
conda config --add channels conda-forge && conda config --set channel_priority strict
```

*conda-forge 레포지터리 채널을 추가하고, 채널 우선순위를 strict로 바꿔 conda-forge 쪽 패키지가 우선 설치되도록 한다. 성공하면 별도 출력 없이 `.condarc` 파일에 설정이 반영된다.*

### 1.3 필수 확장 프로그램 설치와 인터프리터 선택

VS Code 왼쪽 툴바의 다섯 번째 아이콘(Extensions, 단축키 `Ctrl+Shift+X`)에서 다음 세 가지 확장을 검색해 설치한다. (교재 그림 1-9~1-12)

- **Korean Language Pack**: VS Code 메뉴를 한국어 UI로 바꿔주는 언어팩. 설치 후 재시작이 필요하다.
- **Python Extension Pack**: Python 개발에 필요한 확장을 한 번에 설치해주는 모음팩.
- **Jupyter**: Jupyter Notebook을 VS Code 안에서 실행·미리보기할 수 있게 해주는 확장.

이어서 실습용 프로젝트 폴더를 준비한다. `Ctrl+K, O` 또는 [파일]-[폴더 열기...] 메뉴로 `fullstack` 폴더를 새로 만들어 연 다음(교재 그림 1-13, 1-14), 명령 팔레트(`Ctrl+Shift+P`)에서 "Python: Select Interpreter"를 검색해 miniconda3의 **base** 환경을 인터프리터로 선택한다. (교재 그림 1-15~1-17) 마지막으로 새 터미널(`Ctrl+J`)을 열고 셸을 Command Prompt로 바꾼 뒤, 프롬프트 앞에 `(base)`가 붙어 Conda 가상환경이 활성화됐는지 확인한다. (교재 그림 1-18~1-20)

### 1.4 프로젝트 가상환경 생성과 Jupyter 설치

base 환경을 그대로 쓰지 않고, 이 강의 전용 가상환경 `fullstack_proj_env`를 새로 만들어 프로젝트마다 패키지 버전이 서로 꼬이지 않게 한다.

**예제 코드**: `cmd`

```cmd
conda create -n fullstack_proj_env python=3.12 -y
conda info --envs
conda activate fullstack_proj_env
conda install notebook -y
conda config --show channels
```

*Python 3.12 기반의 새 가상환경을 만들고(`conda create`), 현재 만들어진 환경 목록을 확인한 뒤(`conda info --envs`), 새 환경을 활성화하고(`conda activate`), Jupyter Notebook을 설치한다(`conda install notebook`). 필요 없어지면 `conda remove -n fullstack_proj_env --all`로 통째로 지울 수 있다.*

**실행 결과**: `cmd` — 교재 원문 인용

```
conda create -n fullstack_proj_env python=3.12 -y
...
The following NEW packages will be INSTALLED:
  python  conda-forge/win-64::python-3.12.8-h3f84c4b_1_cpython  (등 10개 패키지)
done
#
# To activate this environment, use
#     $ conda activate fullstack_proj_env
#
conda info --envs
# conda environments:
base                    *  C:\Users\FT-LABS\anaconda3
fullstack_proj_env         C:\Users\FT-LABS\anaconda3\envs\fullstack_proj_env
conda activate fullstack_proj_env
(fullstack_proj_env) C:\Users\사용자계정\fullstack>
conda install notebook -y
...
Successfully installed  (notebook 및 종속 패키지 다수)
conda config --show channels
channels:
  - conda-forge
  - defaults
```

*이 절의 conda/miniconda 명령들은 클라우드 실습 환경의 네트워크 정책상 직접 실행할 수 없어 교재 원문의 실제 출력을 그대로 인용했다. 이후 1.2절부터는 실습 환경에서 실제로 실행한 pip·Python 명령 결과를 사용한다.*

---

## 2. PostgreSQL 설치와 pip 패키지 관리

### 2.1 PostgreSQL 다운로드·설치와 pgAdmin 설정

모델 훈련용 데이터와 서비스가 응답할 데이터를 저장·관리할 데이터베이스로 PostgreSQL을 설치한다. 이후 실습에서 만드는 `company` 데이터베이스는 1.2절부터 이 장이 끝날 때까지, 그리고 FastAPI 데이터베이스 연동(1.3.4절)까지 계속 재사용되는 공용 데이터베이스다.

설치 절차는 다음과 같다.

1. `enterprisedb.com/downloads/postgres-postgresql-downloads`에서 운영체제에 맞는 설치 파일(`postgresql-17.x-x-windows-x64.exe`)을 내려받는다. (교재 그림 1-21, 1-22)
2. Setup 마법사에서 설치 디렉터리, 설치할 구성 요소(**PostgreSQL Server, pgAdmin 4, Command Line Tools** 선택, Stack Builder는 제외), 데이터 디렉터리를 차례로 지정한다. (교재 그림 1-23~1-26)
3. 관리자 계정(기본값 `postgres`)의 비밀번호와 포트 번호(기본값 **5432**)를 설정하고, 로케일 등 추가 옵션을 지정한 뒤 설치를 진행·완료한다. (교재 그림 1-27~1-32)

설치가 끝나면 pgAdmin으로 GUI에서 서버를 등록하고 실습용 데이터베이스를 만든다.

1. pgAdmin을 실행해 PostgreSQL 서버 연결 화면에서 [General] 탭의 Name에 `Test1`을 입력해 서버를 등록한다. (교재 그림 1-33, 1-34)
2. [Connection] 탭에서 Host name `localhost`, Port `5432`, Maintenance database `postgres`를 입력하고 설치 시 지정한 비밀번호로 저장하면 서버에 연결된다. (교재 그림 1-35)
3. `Test1` 서버를 우클릭해 [Create]-[Database…]로 database 이름에 `company`를 입력해 실습용 데이터베이스를 만든다. (교재 그림 1-36)
4. 생성된 `company` 데이터베이스를 우클릭해 [Query Tool]을 열면, 이후 모든 SQL 작업은 이 화면에서 진행한다. (교재 그림 1-37)

### 2.2 pip 패키지 관리

pip는 PyPI에서 패키지를 찾아 설치해주는 Python 표준 패키지 관리자다. Python 3.4 이상에는 기본으로 포함되어 있으며, 패키지 설치·삭제·버전 관리·의존성 해석까지 담당하고 가상환경과 함께 쓸 때 가장 효과적이다. 이 절의 명령은 모두 클라우드 실습 환경(Linux, Python 3.11)에서 실제로 실행한 결과이며, 교재의 Windows/Conda 환경과 경로·버전 표기는 다를 수 있지만 pip 명령 자체의 동작은 동일하다.

**예제 코드**: `pip --version`

```bash
pip --version
```

**실행 결과**: `pip --version`

```
pip 24.0 from /usr/lib/python3/dist-packages/pip (python 3.11)
```

*설치된 pip 버전과 그 pip가 어떤 Python 인터프리터에 연결되어 있는지 확인한다. pip가 없다면 `get-pip.py` 스크립트로 수동 설치할 수 있다.*

패키지 이름만 적으면 pip가 PyPI에서 최신 버전을 찾아 설치한다.

**예제 코드**: `pip install pandas`

```bash
pip install pandas
```

**실행 결과**: `pip install pandas`

```
Requirement already satisfied: pandas in /usr/local/lib/python3.11/dist-packages (3.0.2)
Requirement already satisfied: numpy>=1.26.0 in /usr/local/lib/python3.11/dist-packages (from pandas) (2.4.6)
Requirement already satisfied: python-dateutil>=2.8.2 in /root/.local/lib/python3.11/site-packages (from pandas) (2.9.0.post0)
Requirement already satisfied: six>=1.5 in /usr/local/lib/python3.11/dist-packages (from python-dateutil>=2.8.2->pandas) (1.17.0)
WARNING: Running pip as the 'root' user can result in broken permissions and conflicting behaviour with the system package manager. It is recommended to use a virtual environment instead: https://pip.pypa.io/warnings/venv
```

*이미 pandas가 설치돼 있어 "Requirement already satisfied"만 출력됐다. 마지막 WARNING은 root 권한으로 pip를 쓸 때 나오는 표준 경고로, 실무에서는 가상환경 안에서 pip를 쓰라는 의미다.*

버전을 명시하면 그 버전을 정확히 설치(또는 재설치)한다.

**예제 코드**: `pip install numpy==2.1.1`

```bash
pip install numpy==2.1.1
```

**실행 결과**: `pip install numpy==2.1.1`

```
Collecting numpy==2.1.1
  Downloading numpy-2.1.1-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl.metadata (60 kB)
Downloading numpy-2.1.1-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (16.3 MB)
Installing collected packages: numpy
  Attempting uninstall: numpy
    Found existing installation: numpy 2.4.6
    Uninstalling numpy-2.4.6:
      Successfully uninstalled numpy-2.4.6
Successfully installed numpy-2.1.1
WARNING: Running pip as the 'root' user can result in broken permissions and conflicting behaviour with the system package manager. It is recommended to use a virtual environment instead: https://pip.pypa.io/warnings/venv
```

*기존에 설치돼 있던 numpy 2.4.6을 자동으로 제거(`Uninstalling`)하고 지정한 2.1.1로 맞춘다. `==`는 정확히 이 버전을 쓰겠다는 뜻이다.*

최소 버전 이상을 지정하거나, `requirements.txt`로 여러 패키지를 한 번에 설치할 수도 있다.

**예제 코드**: `requirements.txt`

```bash
# 최소 버전 이상 지정
pip install matplotlib>=3.10.0

# requirements.txt로 여러 패키지 한 번에 설치
```

```text
scikit-learn
tensorflow
fastapi
uvicorn[standard]
sqlalchemy
psycopg2-binary
```

```bash
pip install -r requirements.txt
```

*`>=`는 그 버전 이상이면 무엇이든 허용한다는 뜻이다. `requirements.txt`에는 scikit-learn·tensorflow·torch 계열(머신러닝·딥러닝), fastapi·sqlalchemy·psycopg2 계열(API 서버), pillow·matplotlib·seaborn 계열(시각화)처럼 역할별로 패키지를 묶어 관리하면 편리하다.*

설치된 패키지 목록과 특정 패키지의 상세 정보를 확인할 수 있다.

**예제 코드**: `pip list` / `pip show numpy`

```bash
pip list
pip show numpy
```

**실행 결과**: `pip list`

```
Package                    Version
-------------------------- ---------------
absl-py                    2.4.0
aiosqlite                  0.22.1
annotated-doc              0.0.5
annotated-types            0.7.0
anyio                      4.13.0
argcomplete                3.1.4
astunparse                 1.6.3
asyncpg                    0.31.0
attrs                      26.1.0
audioread                  3.1.0
babel                      2.18.0
backrefs                   6.2
... (총 233개 패키지 설치됨)
```

**실행 결과**: `pip show numpy`

```
Name: numpy
Version: 2.1.1
Summary: Fundamental package for array computing in Python
Home-page: https://numpy.org
Author: Travis E. Oliphant et al.
Author-email:
License: Copyright (c) 2005-2024, NumPy Developers.
All rights reserved.
```

*`pip list`는 현재 가상환경에 설치된 모든 패키지와 버전을 나열하고, `pip show 패키지이름`은 그중 하나를 골라 요약·홈페이지·라이선스 등 상세 정보를 보여준다.*

이미 설치된 패키지를 최신 버전으로 올리거나(`--upgrade`), 필요 없어진 패키지를 지울 수 있다(`uninstall`).

**예제 코드**: `pip install --upgrade numpy`

```bash
pip install --upgrade numpy
```

**실행 결과**: `pip install --upgrade numpy`

```
Requirement already satisfied: numpy in /usr/local/lib/python3.11/dist-packages (2.1.1)
Collecting numpy
  Downloading numpy-2.4.6-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl.metadata (6.6 kB)
Downloading numpy-2.4.6-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl (16.9 MB)
Installing collected packages: numpy
  Attempting uninstall: numpy
    Found existing installation: numpy 2.1.1
    Uninstalling numpy-2.1.1:
      Successfully uninstalled numpy-2.1.1
Successfully installed numpy-2.4.6
```

*앞서 2.1.1로 낮춰뒀던 numpy를 다시 최신 버전(2.4.6)으로 올렸다. 교재 원문은 `dask` 패키지로 이 명령을 시연하지만, 실습에서는 앞 단계에서 낮춘 numpy로 같은 명령을 그대로 재현했다.*

**예제 코드**: `pip uninstall requests`

```bash
pip install requests
pip uninstall requests -y
```

**실행 결과**: `pip uninstall requests`

```
Requirement already satisfied: requests in /usr/local/lib/python3.11/dist-packages (2.33.1)
Found existing installation: requests 2.33.1
Uninstalling requests-2.33.1:
  Successfully uninstalled requests-2.33.1
```

*설치 직후 곧바로 삭제하는 과정을 실제로 시연했다. `-y` 옵션을 주면 삭제 확인 프롬프트 없이 바로 진행한다.*

pip 캐시는 한 번 내려받은 패키지 파일을 재사용하기 위한 저장소로, 위치 확인과 삭제가 모두 가능하다.

**예제 코드**: `pip cache dir` / `pip cache purge`

```bash
pip cache dir
pip cache purge
```

**실행 결과**: `pip cache dir`

```
/root/.cache/pip
```

**실행 결과**: `pip cache purge`

```
Files removed: 10
```

*`pip cache dir`는 현재 환경의 캐시 저장 경로를, `pip cache purge`는 그 캐시를 전부 지워 디스크 공간을 확보한다.*

pip는 가상환경과 함께 쓸 때 가장 효과적이다. 가상환경을 만들고 켜고 끄고 지우는 명령을 정리하면 다음과 같다. 이 명령은 1.3절 FastAPI 실습에서 `ai_venv`라는 이름으로 실제로 사용한다.

**예제 코드**: `venv`

```bash
# 생성
python -m venv 가상환경이름

# 활성화 — Windows
가상환경이름\Scripts\activate

# 활성화 — macOS/Linux
source 가상환경이름/bin/activate

# 비활성화
deactivate

# 삭제 — Windows
rmdir /s /q 가상환경디렉터리이름

# 삭제 — macOS/Linux
rm -rf 가상환경디렉터리이름
```

*`conda create`가 miniconda3 전용이라면, `venv`는 Python 표준 라이브러리에 내장된 가상환경 도구다. 둘 중 무엇을 쓰든 "패키지를 프로젝트별로 격리한다"는 목적은 같다.*

---

## 3. 데이터 준비 — 데이터베이스 · CSV · pickle · JSON · 공개 데이터셋

이 절에서는 모델 훈련에 쓸 데이터를 다섯 가지 형식(PostgreSQL DB, CSV, pickle, JSON, scikit-learn 공개 데이터셋)으로 각각 준비하고 실제로 불러와본다. 앞서 2.1절에서 만든 `company` 데이터베이스를 계속 재사용한다.

### 3.1 PostgreSQL에 실습용 테이블과 더미 데이터 준비

`company` 데이터베이스 안에 사용자(`users`), 상품(`products`), 리뷰(`reviews`) 3개 테이블을 만들고, `generate_series`와 `random()`으로 사용자 20건, 상품 20건, 리뷰 300건의 더미 데이터를 채운다.

**예제 코드**: `table_create.sql`

```sql
-- 사용자 테이블
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE
);

-- 상품 테이블
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- 리뷰 테이블
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    product_id INT REFERENCES products(id),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**실행 결과**: `table_create.sql`

```
DROP TABLE
DROP TABLE
DROP TABLE
CREATE TABLE
CREATE TABLE
CREATE TABLE
```

*pgAdmin의 Query Tool로 `company` 데이터베이스에 테이블 3개를 실제로 생성했다. `reviews.rating`에는 1~5 사이 값만 허용하는 `CHECK` 제약이 걸려 있다는 점을 기억해두자 — 바로 다음 단계에서 이 제약에 걸린다.*

더미 데이터를 삽입하는 SQL은 책 원문 그대로 실행하면 실제로 오류가 난다.

**예제 코드**: `table_insert.sql` — 책 원문 그대로

```sql
-- 사용자 데이터 삽입 (20건)
INSERT INTO users (username)
SELECT 'user' || generate_series(1, 20);

-- 상품 데이터 삽입 (20건)
INSERT INTO products (name)
SELECT 'Product ' || generate_series(1, 20);

-- 리뷰 데이터 삽입 (300건)
INSERT INTO reviews (user_id, product_id, rating, review_text)
SELECT
    (random() * 19 + 1)::INT,                       -- user_id (1~20)
    (random() * 19 + 1)::INT,                        -- product_id (1~20)
    (random() * 5 + 1)::INT,                          -- rating (1~5 의도)
    'Review text for product ' || (random() * 19 + 1)::INT
FROM generate_series(1, 300);
```

**실행 결과**: `table_insert.sql` — 책 원문의 실제 버그

```
ERROR:  new row for relation "reviews" violates check constraint "reviews_rating_check"
DETAIL:  Failing row contains (26, 9, 17, 6, Review text for product 20, 2026-08-22 09:39:48.516162).
```

*PostgreSQL은 실수를 정수로 캐스팅(`::INT`)할 때 절삭이 아니라 반올림한다. `random() * 5 + 1`의 이론적 상한은 6.0 미만이지만, 5.5 이상 6.0 미만 구간의 값이 나오면 반올림돼 `6`이 되어 `CHECK (rating BETWEEN 1 AND 5)`를 위반한다. 300건을 생성하는 동안 이 구간에 값이 걸릴 확률은 약 10%로, 확률적으로 실제 발생하는 책 SQL 자체의 버그다.*

`::INT` 캐스팅을 반올림이 아니라 절삭으로 처리하도록 `floor()`를 추가하면 항상 1~5 범위 안에 들어온다.

**예제 코드**: `table_insert.sql` — harness 보정

```sql
INSERT INTO reviews (user_id, product_id, rating, review_text)
SELECT
    (random() * 19 + 1)::INT,
    (random() * 19 + 1)::INT,
    (floor(random() * 5) + 1)::INT,  -- 반올림 대신 절삭 후 +1 로 1~5 범위 보장
    'Review text for product ' || (random() * 19 + 1)::INT
FROM generate_series(1, 300);
```

**실행 결과**: `table_insert.sql` — 보정 후

```
INSERT 0 300
```

*`random() * 5`는 0.0~5.0 미만이므로 `floor()`로 소수점을 항상 내림한 값은 0~4 정수이고, 여기에 `+1`을 더하면 1~5 정수 범위를 절대 벗어나지 않는다. `::INT`의 반올림 대신 `floor()`의 명시적 절삭을 쓰는 것이 핵심 수정이다.*

### 3.2 psycopg2 + pandas로 데이터베이스 데이터 불러오기

DB 연결에는 `psycopg2`, 조회 결과를 다루는 데는 `pandas`를 함께 쓴다.

**예제 코드**: `pip install`

```bash
pip install psycopg2 pandas
```

*`psycopg2`는 PostgreSQL 연결·조작 라이브러리, `pandas`는 조회 결과를 표(DataFrame) 형태로 다루는 라이브러리다.*

**예제 코드**: `data_loading1.py`

```python
import psycopg2
import pandas as pd

# PostgreSQL 연결 설정
db_config = {
    "dbname": "company",
    "user": "postgres",
    "password": "1234",
    "host": "localhost",
    "port": 5432,
}


def load_and_print_data():
    try:
        # 데이터베이스 연결
        conn = psycopg2.connect(**db_config)
        print("Database connection successful!")
        # 테이블 데이터를 가져오는 SQL 쿼리
        queries = {
            "users": "SELECT * FROM users;",
            "products": "SELECT * FROM products;",
            "reviews": "SELECT * FROM reviews;",
        }
        # 데이터 로드 및 출력
        for table, query in queries.items():
            print(f"\nLoading data from table: {table}")
            df = pd.read_sql_query(query, conn)
            print(df)
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        # 연결 닫기
        if "conn" in locals() and conn:
            conn.close()
            print("Database connection closed.")


# 실행
load_and_print_data()
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
1.2.3 psycopg2 + pandas로 company 데이터베이스의 세 테이블을 순서대로 조회

db_config 딕셔너리에 담긴 접속 정보로 PostgreSQL에 연결한 뒤, users·products·reviews
테이블을 차례로 조회해 각각 pandas DataFrame으로 출력한다. try/except/finally로 연결
실패와 정상 종료를 모두 처리한다는 점이 이 코드의 핵심 패턴이다.
"""

import psycopg2
import pandas as pd

# db_config: connect(**db_config) 형태로 키워드 인자로 그대로 풀어 넘길 수 있게
# psycopg2.connect()가 요구하는 인자 이름(dbname/user/password/host/port)과
# 딕셔너리 키 이름을 똑같이 맞춰뒀다
db_config = {
    "dbname": "company",
    "user": "postgres",
    "password": "1234",
    "host": "localhost",
    "port": 5432,
}


def load_and_print_data():
    try:
        # **db_config: 딕셔너리를 키워드 인자로 풀어 전달 (dbname=..., user=..., ...)
        conn = psycopg2.connect(**db_config)
        print("Database connection successful!")

        # 테이블 이름 -> 조회 SQL을 딕셔너리로 묶어, 아래 for문 하나로 세 테이블을 반복 처리
        queries = {
            "users": "SELECT * FROM users;",
            "products": "SELECT * FROM products;",
            "reviews": "SELECT * FROM reviews;",
        }

        for table, query in queries.items():
            print(f"\nLoading data from table: {table}")
            # pd.read_sql_query: SQL 쿼리 실행 결과를 바로 DataFrame으로 변환
            # (커서를 직접 다루는 psycopg2 API보다 훨씬 간결하다)
            df = pd.read_sql_query(query, conn)
            print(df)

    except Exception as e:
        # 연결 실패, SQL 오류 등 모든 예외를 한 곳에서 잡아 메시지만 출력
        print(f"An error occurred: {e}")

    finally:
        # try 블록에서 connect()가 실패하면 conn 변수 자체가 만들어지지 않으므로
        # "conn" in locals()로 변수 존재 여부부터 확인한 뒤 닫는다
        if "conn" in locals() and conn:
            conn.close()
            print("Database connection closed.")


load_and_print_data()

# ─────────────────────────────────────────────────────────────
# [교안용 설명 포인트]
# 1) try/except/finally 구조를 강조한다 — DB 연결처럼 "외부 자원"을 쓰는 코드는
#    성공하든 실패하든 반드시 연결을 정리(close)해야 한다는 점을 finally로 보여준다.
# 2) pd.read_sql_query(query, conn) 한 줄이 SQL 결과를 바로 표(DataFrame)로
#    바꿔준다는 것이 이 예제의 핵심 — SQL과 pandas를 잇는 가장 기본적인 다리다.
# 3) reviews 테이블처럼 행이 많을 때 pandas가 가운데 행을 "..."로 축약해서 보여주는
#    출력 방식(다음 실행 결과에서 실제로 확인)도 함께 짚어주면 좋다.
# ─────────────────────────────────────────────────────────────
```

</details>

**실행 결과 (1/3)**: `data_loading1.py` — users 테이블

```
Database connection successful!

Loading data from table: users
    id username
0    1    user1
1    2    user2
2    3    user3
...
18  19   user19
19  20   user20
```

**실행 결과 (2/3)**: `data_loading1.py` — products 테이블

```
Loading data from table: products
    id        name
0    1   Product 1
1    2   Product 2
...
18  19  Product 19
19  20  Product 20
```

**실행 결과 (3/3)**: `data_loading1.py` — reviews 테이블 (300건, pandas 기본 축약 표시)

```
Loading data from table: reviews
      id  user_id  ...                 review_text                 created_at
0     27       10  ...  Review text for product 17 2026-08-22 09:39:48.563587
1     28        2  ...  Review text for product 18 2026-08-22 09:39:48.563587
2     29        3  ...   Review text for product 3 2026-08-22 09:39:48.563587
..   ...      ...  ...                         ...                        ...
297  324       17  ...  Review text for product 10 2026-08-22 09:39:48.563587
298  325        9  ...   Review text for product 9 2026-08-22 09:39:48.563587
299  326        4  ...  Review text for product 11 2026-08-22 09:39:48.563587

[300 rows x 6 columns]
Database connection closed.
```

*reviews 테이블은 열이 6개, 행이 300개라 pandas가 기본 출력 옵션에서 가운데 행과 열을 `...`으로 축약해 보여준다. 실제로는 300행 6열 데이터가 모두 들어 있으며, `pd.set_option('display.max_rows', None)`으로 축약을 풀 수 있다.*

### 3.3 CSV 데이터 불러오기

CSV(Comma-Separated Values)는 값을 쉼표로 구분한 가장 단순한 표 형식 데이터 파일이다. NBA 선수의 신체·기록 데이터를 담은 `nba_positions.csv`를 포지션(Position) 분류 실습용 데이터로 사용한다.

**예제 코드**: `nba_positions.csv` (일부)

```csv
Height,Weight,Points,Rebounds,Assists,Position
211,113,25.1,10.5,3.2,Center
200,98,15.4,7.3,2.8,Forward
198,92,20.3,6.2,5.5,Guard
213,122,18.2,12.4,1.6,Center
203,100,22.0,8.3,4.2,Forward
195,88,24.1,5.1,6.7,Guard
```

*키(Height)·몸무게(Weight)·득점(Points)·리바운드(Rebounds)·어시스트(Assists) 5개 수치형 특성으로 포지션(Center/Forward/Guard)을 예측하는 분류 문제에 쓰기 좋은 형태다. `pip install pandas scikit-learn`이 필요하다.*

**예제 코드**: `data_loading2.py`

```python
import pandas as pd

# CSV 파일 경로
csv_file = "nba_positions.csv"

# CSV 파일 로드
df = pd.read_csv(csv_file)

# 데이터 출력
print(df.head())  # 첫 5개 데이터 출력
print(df)          # 전체 데이터 출력
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
1.2.3 pandas.read_csv()로 CSV 파일을 DataFrame으로 불러오기

CSV처럼 이미 표 형태를 갖춘 파일은 pandas의 read_csv() 한 줄이면 곧바로 DataFrame이
된다. df.head()로 앞부분만 빠르게 훑어보고, print(df)로 전체를 확인하는 두 단계
습관을 보여주는 가장 기본적인 예제다.
"""

import pandas as pd

csv_file = "nba_positions.csv"

# read_csv: 첫 줄을 헤더(컬럼 이름)로 자동 인식하고, 쉼표(,) 기준으로 값을 나눠
# 각 컬럼의 자료형(정수/실수/문자열)까지 추론해 DataFrame으로 변환한다
df = pd.read_csv(csv_file)

# head(): 기본값 5개 행만 미리 보여줌 — 데이터가 클 때 로드가 잘 됐는지
# 전체를 출력하기 전에 빠르게 확인하는 관용적인 방법
print(df.head())

# 인자 없이 print(df)를 하면 pandas가 설정된 출력 옵션(기본 행/열 수 제한)에 맞춰
# 전체 데이터를 보여준다 — 데이터가 아주 크면 자동으로 가운데를 축약한다
print(df)

# ─────────────────────────────────────────────────────────────
# [교안용 설명 포인트]
# 1) df.head()와 print(df)를 나란히 실행해 "확인용 미리보기"와 "전체 출력"의
#    쓰임새 차이를 보여주면 좋다. 실무에서는 head()만 습관적으로 먼저 찍어본다.
# 2) read_csv()가 각 컬럼 자료형(Height/Weight/Points 등은 숫자, Position은
#    문자열)을 자동으로 추론한다는 점을 df.dtypes로 확인해보는 실습을 붙이기 좋다.
# ─────────────────────────────────────────────────────────────
```

</details>

**실행 결과**: `data_loading2.py`

```
   Height  Weight  Points  Rebounds  Assists Position
0     211     113    25.1      10.5      3.2   Center
1     200      98    15.4       7.3      2.8  Forward
2     198      92    20.3       6.2      5.5    Guard
3     213     122    18.2      12.4      1.6   Center
4     203     100    22.0       8.3      4.2  Forward
   Height  Weight  Points  Rebounds  Assists Position
0     211     113    25.1      10.5      3.2   Center
1     200      98    15.4       7.3      2.8  Forward
2     198      92    20.3       6.2      5.5    Guard
3     213     122    18.2      12.4      1.6   Center
4     203     100    22.0       8.3      4.2  Forward
5     195      88    24.1       5.1      6.7    Guard
6     208     110    17.5       9.8      2.1   Center
7     201      95    19.8       6.9      4.8  Forward
8     193      85    23.6       4.5      7.2    Guard
9     215     125    16.9      13.1      1.2   Center
```

*첫 출력이 `df.head()`(5행), 두 번째 출력이 `print(df)`(전체 10행)다. 이번 데이터셋은 행이 10개뿐이라 축약 없이 전부 출력됐다.*

### 3.4 pickle로 학습 결과 저장하고 다시 불러오기

pickle은 Python 객체를 그대로 바이너리로 직렬화해 저장하는 표준 모듈이다. DataFrame이든 학습된 모델이든 Python 객체라면 형태를 그대로 유지한 채 파일로 저장했다가 다음 실행에서 재사용할 수 있다. 고객 100명의 나이(Age)·소득(Income)·소비 점수(Spending Score) 더미 데이터를 만들고 K-평균(K=3)으로 군집화한 뒤 그 결과를 pickle로 저장해본다.

**예제 코드**: `data_create3.py`

```python
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import pickle

# 랜덤 데이터 생성
np.random.seed(42)
n_samples = 100
age = np.random.randint(18, 70, size=n_samples)              # 나이 (18-70)
income = np.random.randint(20000, 120000, size=n_samples)    # 연소득 (20,000~120,000)
spending_score = np.random.randint(1, 100, size=n_samples)   # 소비 점수 (1~100)

data = pd.DataFrame({"Age": age, "Income": income, "Spending Score": spending_score})

# 표준화 (Standardization)
scaler = StandardScaler()
scaled_data = scaler.fit_transform(data)

# K-평균 군집화 (3개의 군집으로 분할)
kmeans = KMeans(n_clusters=3, random_state=42)
kmeans.fit(scaled_data)
data["Cluster"] = kmeans.labels_

# pickle로 저장
with open("customer_segments.pkl", "wb") as f:
    pickle.dump(data, f)

print(data.head())
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
1.2.3 고객 세분화 더미 데이터 생성 -> K-평균 군집화 -> pickle 직렬화 저장

이 스크립트는 세 단계로 이뤄진다: (1) 나이·소득·소비점수 더미 데이터 100건 생성,
(2) StandardScaler로 표준화한 뒤 KMeans(k=3)로 군집화, (3) 군집 결과가 담긴
DataFrame 전체를 pickle로 저장. "모델이 만든 결과물을 파일로 남겨 재사용한다"는
pickle의 전형적인 쓰임을 보여준다.
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import pickle

# seed(42): 난수 생성 시작점을 고정해, 이 코드를 몇 번 실행하든 항상 같은
# 더미 데이터가 만들어지도록 재현성을 보장한다
np.random.seed(42)
n_samples = 100
age = np.random.randint(18, 70, size=n_samples)
income = np.random.randint(20000, 120000, size=n_samples)
spending_score = np.random.randint(1, 100, size=n_samples)

data = pd.DataFrame({"Age": age, "Income": income, "Spending Score": spending_score})

# StandardScaler: 세 특성의 값 범위가 서로 크게 다르므로(나이 10~70대, 소득
# 2만~12만) 평균 0·표준편차 1로 맞춰야 KMeans의 거리 계산이 특정 축(소득처럼
# 값이 큰 축)에 치우치지 않는다
scaler = StandardScaler()
scaled_data = scaler.fit_transform(data)

# KMeans(n_clusters=3): 군집 개수를 미리 3개로 지정 — "저소비/중간/고소비"
# 같은 3개 고객 세그먼트로 나누는 상황을 가정한 것
kmeans = KMeans(n_clusters=3, random_state=42)
kmeans.fit(scaled_data)
data["Cluster"] = kmeans.labels_   # 원본(비표준화) 데이터프레임에 군집 번호만 추가

# pickle.dump: DataFrame 객체 자체를 바이너리로 그대로 저장 — CSV와 달리
# 자료형 정보(정수/실수 구분 등)까지 그대로 보존된다
with open("customer_segments.pkl", "wb") as f:
    pickle.dump(data, f)

print(data.head())

# ─────────────────────────────────────────────────────────────
# [교안용 설명 포인트]
# 1) pickle은 "Python 객체를 그대로" 저장한다는 점이 CSV/JSON과 다르다 — DataFrame의
#    dtype, 인덱스까지 보존되므로 다시 읽었을 때 추가 변환이 필요 없다.
# 2) StandardScaler를 fit_transform()에는 쓰지만, 군집 번호(Cluster)는 원본
#    data(비표준화 값)에 붙인다는 점 — "계산은 표준화된 값으로, 해석은 원래 단위로"
#    하는 습관을 짚어주면 좋다.
# 3) random_state=42를 KMeans에도 지정해야 군집 초기화까지 재현 가능해진다는 점도
#    seed(42)와 함께 강조할 만하다.
# ─────────────────────────────────────────────────────────────
```

</details>

**실행 결과**: `data_create3.py`

```
   Age  Income  Spending Score  Cluster
0   56   81228              59        0
1   69   68984              32        0
2   46   60774              96        2
3   32   22568              88        2
4   60   82592              52        0
```

*`customer_segments.pkl` 파일이 실제로 생성됐고, 고객마다 군집 번호(0~2)가 붙었다. 이제 이 파일을 다시 불러와본다.*

**예제 코드**: `data_loading3.py`

```python
import pickle

with open("customer_segments.pkl", "rb") as f:
    loaded_data = pickle.load(f)

print("Pickle 데이터 로드 완료:")
print(loaded_data.head())
```

*`"rb"`(read binary) 모드로 파일을 열고 `pickle.load()`로 객체를 복원한다. 저장할 때 DataFrame이었다면 불러올 때도 그대로 DataFrame이다 — 별도의 파싱·형변환이 전혀 필요 없다.*

**실행 결과**: `data_loading3.py`

```
Pickle 데이터 로드 완료:
   Age  Income  Spending Score  Cluster
0   56   81228              59        0
1   69   68984              32        0
2   46   60774              96        2
3   32   22568              88        2
4   60   82592              52        0
```

*저장 직전에 출력했던 `data.head()`와 완전히 같은 내용이 그대로 복원됐다 — pickle이 객체를 손실 없이 직렬화·역직렬화한다는 것을 보여준다.*

### 3.5 JSON 데이터 만들기

JSON(JavaScript Object Notation)은 키-값 쌍으로 이뤄진 텍스트 기반의 경량 데이터 교환 형식으로, 웹 API 응답에서 특히 많이 쓰인다. 스팸 메일 분류 실습에 쓸 이메일 100건(내용 + 스팸 여부 라벨)을 더미로 만들어본다.

**예제 코드**: `data_create4.py`

```python
import json
import random

# 이메일 내용 및 라벨 (스팸 여부)
spam_keywords = ["free", "winner", "money", "guaranteed", "limited time", "offer", "prize", "cash"]
ham_keywords = ["meeting", "report", "schedule", "project", "team", "follow up", "thank you", "feedback"]


def generate_email(label):
    if label == "spam":
        email = " ".join(random.choices(spam_keywords, k=random.randint(3, 7)))
    else:
        email = " ".join(random.choices(ham_keywords, k=random.randint(3, 7)))
    return email


emails = []
for i in range(100):
    label = random.choice(["spam", "ham"])
    email_content = generate_email(label)
    emails.append({"email_content": email_content, "label": label})

# JSON 데이터로 저장
with open("email_spam_data.json", "w") as f:
    json.dump(emails, f, indent=4)

print(json.dumps(emails[:5], indent=4))
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
1.2.3 스팸/정상 메일 100건을 무작위로 만들어 JSON 파일로 저장

스팸 메일에 자주 쓰이는 단어 목록과 일반(ham) 메일에 자주 쓰이는 단어 목록을 각각
준비해두고, 매 건마다 둘 중 하나를 골라 그 목록에서 단어를 3~7개 무작위로 뽑아
이어 붙이는 방식으로 "그럴듯한" 더미 이메일 본문을 만든다. json 모듈은 파이썬
내장 라이브러리라 별도 설치가 필요 없다.
"""

import json
import random

spam_keywords = [
    "free", "winner", "money", "guaranteed",
    "limited time", "offer", "prize", "cash",
]
ham_keywords = [
    "meeting", "report", "schedule", "project",
    "team", "follow up", "thank you", "feedback",
]


def generate_email(label):
    # random.choices(..., k=n): 목록에서 "중복을 허용하며" n개를 무작위로 뽑는다
    # (n을 3~7 사이로 무작위 지정해 이메일마다 길이가 조금씩 다르게 만든다)
    if label == "spam":
        email = " ".join(random.choices(spam_keywords, k=random.randint(3, 7)))
    else:
        email = " ".join(random.choices(ham_keywords, k=random.randint(3, 7)))
    return email


emails = []
for i in range(100):
    # random.choice(["spam", "ham"]): 두 라벨 중 하나를 무작위로 선택
    label = random.choice(["spam", "ham"])
    email_content = generate_email(label)
    # 하나의 이메일을 {"email_content": ..., "label": ...} 딕셔너리로 표현 —
    # JSON에서 객체(object) 하나에 해당하는 형태를 그대로 파이썬 딕셔너리로 미리 구성
    emails.append({"email_content": email_content, "label": label})

# json.dump(emails, f, indent=4): 딕셔너리 리스트를 JSON 배열로 직렬화해 파일에 저장
# indent=4는 사람이 읽기 좋게 들여쓰기를 넣어준다(생략하면 한 줄로 압축 저장됨)
with open("email_spam_data.json", "w") as f:
    json.dump(emails, f, indent=4)

# json.dumps(): 파일이 아니라 문자열로 직렬화 — 화면에 미리보기로 출력할 때 사용
print(json.dumps(emails[:5], indent=4))

# ─────────────────────────────────────────────────────────────
# [교안용 설명 포인트]
# 1) json.dump()는 파일에 쓰고, json.dumps()는 문자열을 돌려준다는 이름 차이(끝의
#    s)를 pickle의 dump()/load() 짝과 비교해 헷갈리지 않도록 짚어주면 좋다.
# 2) emails 리스트의 각 원소가 파이썬 딕셔너리 -> JSON 파일에서는 그대로 객체가
#    된다는 것 -> "파이썬 자료구조와 JSON 구조가 거의 1:1로 대응한다"는 감각을
#    실행 결과와 비교해가며 확인시켜주면 좋다.
# 3) random.choices()의 k 값을 random.randint(3, 7)로 매번 다르게 주기 때문에,
#    이 코드를 다시 실행하면 매번 다른 이메일 내용이 만들어진다는 점(=재현성이
#    없다는 점)도 pickle/CSV 예제와 비교해 짚어줄 수 있다.
# ─────────────────────────────────────────────────────────────
```

</details>

**실행 결과**: `data_create4.py` — 첫 5건

```json
[
    {
        "email_content": "cash limited time prize limited time guaranteed limited time guaranteed",
        "label": "spam"
    },
    {
        "email_content": "free limited time cash free limited time limited time",
        "label": "spam"
    },
    {
        "email_content": "thank you schedule report",
        "label": "ham"
    },
    {
        "email_content": "cash limited time free offer",
        "label": "spam"
    },
    {
        "email_content": "thank you report feedback",
        "label": "ham"
    }
]
```

*`email_spam_data.json`에 100건이 모두 저장됐고, 그중 처음 5건만 미리보기로 출력했다. `random`을 쓰기 때문에 다시 실행하면 내용이 매번 달라진다.*

### 3.6 공개 데이터셋 활용 — Boston 데이터셋의 제거와 California Housing 대체

Iris는 1936년 Ronald Fisher가 소개한 대표적인 다중 클래스 분류 데이터셋이고, Boston 주택가격 데이터셋은 방 개수·범죄율 등 여러 특성으로 주택 가격을 예측하는 회귀 예제로 오랫동안 쓰여왔다. 교재 원문은 `sklearn.datasets.load_boston()`으로 Boston 데이터셋을 불러오는 코드를 보여주지만, 이 코드를 그대로 실행하면 실제로 오류가 난다.

**예제 코드**: `data_loading5.py` — 책 원문

```python
import numpy as np
import pandas as pd
from sklearn.datasets import load_boston
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

boston = load_boston()
boston_df = pd.DataFrame(boston.data, columns=boston.feature_names)
boston_df["Price"] = boston.target
print(boston_df.head())
```

**실행 결과**: `data_loading5.py` — 실제 오류 (scikit-learn 1.2+에서 `load_boston` 제거됨)

```
Traceback (most recent call last):
  File "data_loading5.py", line 3, in <module>
    from sklearn.datasets import load_boston
ImportError:
`load_boston` has been removed from scikit-learn since version 1.2.

The Boston housing prices dataset has an ethical problem: as investigated in [1],
the authors of this dataset engineered a non-invertible variable "B" assuming that
racial self-segregation had a positive impact on house prices [2]. Furthermore the
goal of the research that led to the creation of this dataset was to study the
impact of air quality but it did not give adequate demonstration of the validity
of this assumption.

The scikit-learn maintainers therefore strongly discourage the use of this dataset
unless the purpose of the code is to study and educate about ethical issues in
data science and machine learning.

Alternative datasets include the California housing dataset and the Ames housing
dataset.
```

*scikit-learn 1.8.0(현재 실습 환경)에서 실제로 발생하는 오류다. Boston 데이터셋은 인종 차별적 함의를 가진 변수(`B`)를 포함하고 있다는 윤리적 문제로 1.2 버전부터 완전히 제거되어 `load_boston()` 자체가 더 이상 존재하지 않는다. scikit-learn 공식 오류 메시지도 California housing, Ames housing 데이터셋을 대안으로 안내한다.*

실습에서는 오류 메시지가 권장하는 대로 California Housing 데이터셋으로 대체해 실제로 실행한다.

**예제 코드**: `data_loading5.py` — harness 보정

```python
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.datasets import fetch_california_housing
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import train_test_split

# 캘리포니아 주택 가격 데이터셋 로드 (as_frame=True 사용 시 pandas 객체로 직접 반환)
housing = fetch_california_housing(as_frame=True)

# 데이터셋을 데이터프레임으로 변환
housing_df = housing.data

# 타겟 값(주택 가격)을 데이터프레임에 추가
housing_df["Price"] = housing.target

# 데이터 확인
print(housing_df.head())
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
1.2.3 Boston 데이터셋 대체 — fetch_california_housing()으로 회귀용 공개 데이터셋 불러오기

load_boston()이 제거된 뒤 scikit-learn이 공식적으로 권장하는 California Housing
데이터셋을 fetch_california_housing()으로 불러온다. as_frame=True 옵션 하나로
데이터를 바로 pandas DataFrame으로 받을 수 있다는 점이 load_boston() 시절보다
오히려 더 간결해진 부분이다.
"""

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.datasets import fetch_california_housing
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import train_test_split

# as_frame=True: 반환값의 .data가 numpy 배열이 아니라 컬럼 이름이 붙은
# pandas DataFrame으로 바로 나온다 — 이후 pd.DataFrame(...)으로 다시
# 감쌀 필요가 없어진다
housing = fetch_california_housing(as_frame=True)

# housing.data: 특성(방 개수 평균, 인구, 위도/경도 등) 8개 컬럼을 담은 DataFrame
housing_df = housing.data

# housing.target: 예측 대상인 주택 가격(단위: 10만 달러) — 별도 컬럼으로 추가
housing_df["Price"] = housing.target

print(housing_df.head())

# ─────────────────────────────────────────────────────────────
# [교안용 설명 포인트]
# 1) load_boston()의 제거는 "라이브러리가 버전을 올리면 예전 코드가 깨질 수
#    있다"는 점을 보여주는 좋은 실제 사례다 — 교재가 쓰인 시점과 지금 사이에
#    scikit-learn 버전이 달라졌기 때문에 생긴 문제라는 것을 강조하면 좋다.
# 2) 단순히 "오류가 났으니 넘어간다"가 아니라, 오류 메시지 자체가 대안
#    (California housing)을 안내해준다는 점 — 실무에서 Deprecation/Removal
#    오류를 만났을 때 오류 메시지부터 끝까지 읽는 습관을 강조할 수 있다.
# 3) as_frame=True 옵션 하나로 numpy 배열 -> DataFrame 변환 코드 두 줄이
#    사라졌다는 것도 "라이브러리 API가 점점 더 pandas 친화적으로 바뀐다"는
#    흐름을 보여주는 좋은 소재다.
# ─────────────────────────────────────────────────────────────
```

</details>

**실행 결과**: `data_loading5.py` — California Housing으로 대체 실행

```
   MedInc  HouseAge  AveRooms  AveBedrms  Population  AveOccup  Latitude  Longitude  Price
0  8.3252      41.0  6.984127   1.023810       322.0  2.555556     37.88    -122.23  4.526
1  8.3014      21.0  6.238137   0.971880      2401.0  2.109842     37.86    -122.22  3.585
2  7.2574      52.0  8.288136   1.073446       496.0  2.802260     37.85    -122.24  3.521
3  5.6431      52.0  5.817352   1.073059       558.0  2.547945     37.85    -122.25  3.413
4  3.8462      52.0  6.281853   1.081081       565.0  2.181467     37.85    -122.25  3.422
```

*Boston 데이터셋과 마찬가지로 "특성 여러 개 → 주택 가격(Price)"을 예측하는 회귀 문제 형태를 그대로 유지하면서, 윤리적 문제가 없는 California Housing 데이터로 안전하게 대체했다.*

### 3.7 Kaggle API로 외부 데이터셋 내려받기 (참고자료)

Iris·California Housing처럼 scikit-learn에 내장된 데이터셋 외에, Kaggle에 공개된 대용량 실전 데이터셋을 코드로 직접 내려받아 쓸 수도 있다. Kaggle 계정에서 API Key를 발급받아 `kaggle.json`을 `~/.kaggle/` 디렉터리에 저장해두면, `KaggleApi().authenticate()`로 인증한 뒤 `dataset_download_files()`로 데이터셋을 내려받아 pandas로 바로 읽을 수 있다.

**예제 코드**: `data_loading6.py` — 참고자료

```python
import os
from kaggle.api.kaggle_api_extended import KaggleApi
import pandas as pd

# Kaggle API 인증
api = KaggleApi()
api.authenticate()

# 데이터셋 다운로드
dataset_name = "mohitsinghrajput1307/practice-dataset1"
api.dataset_download_files(dataset_name, path="./data", unzip=True)

# 다운로드된 데이터 확인
data_path = "./data/customer_purchase_data.csv"
data = pd.read_csv(data_path)
print(data.head())
```

*개인 Kaggle 계정의 API 인증 정보(`kaggle.json`)가 있어야 실행할 수 있어, 클라우드 실습 환경에서는 직접 실행하지 않고 책 원문 코드만 참고자료로 제시한다. 6장 FastAPI OAuth2 실습에서도 같은 이유로 개인 인증 정보가 필요한 코드는 참고자료로만 다룬다. `pip install kaggle tensorflow scikit-learn pandas matplotlib`가 필요하다.*

---

## 4. FastAPI 웹 프레임워크 — 설치부터 데이터베이스 연동까지

지금까지는 데이터를 "준비하고 불러오는" 단계였다면, 이 절에서는 그 데이터를 실제로 서비스하는 웹 API를 만들어본다. FastAPI로 기본 애플리케이션을 작성해 실행하고, Swagger UI·ReDoc으로 직접 테스트한 다음, 2절에서 만든 `company` 데이터베이스의 `products` 테이블과 연동하는 CRUD API까지 완성한다.

### 4.1 FastAPI란?

FastAPI는 Python 비동기(AsyncIO)를 활용해 Node.js·Go에 견줄 만한 속도를 내는 웹 프레임워크로, Starlette(웹 처리)과 Pydantic(데이터 검증) 위에 만들어졌다.

- **고성능**: 비동기 처리를 기본으로 하여 동시 요청이 많은 상황에서도 빠르다.
- **자동 문서화**: 코드에 붙인 타입 힌트만으로 OpenAPI·JSON Schema 기반의 Swagger UI·ReDoc 문서를 자동 생성한다.
- **타입 힌트 기반 개발**: 함수 파라미터에 타입을 명시하면 IDE 자동완성과 요청 데이터 검증이 함께 따라와 버그가 줄어든다.
- **유연성**: 비동기(`async def`)와 동기(`def`) 핸들러를 모두 지원하고, 데이터 유효성 검사·직렬화가 간단하다.

개발 속도(타입 힌트·자동 문서화)와 오류 처리(잘못된 요청에 명확한 오류 메시지)가 큰 장점이며, RESTful API·ML/AI 모델 배포·IoT 데이터 수집·마이크로서비스처럼 다양한 곳에 쓰인다. 이 강의에서는 이후 6장 FastAPI 실습에서 이 기초를 확장한다.

### 4.2 설치 및 실행 환경 준비

FastAPI 실습은 앞서 만든 `fullstack_proj_env`와는 별도로, `ai_venv`라는 이름의 새 가상환경에서 진행한다.

**예제 코드**: `venv`

```bash
# Python 버전 확인 (3.7 이상 필요)
python --version

# 가상환경 생성
python -m venv ai_venv

# 가상환경 활성화 — Windows
ai_venv\Scripts\activate

# 가상환경 활성화 — Mac/Linux
source ai_venv/bin/activate
```

**실행 결과**: `python --version`

```
Python 3.11.15
```

*실습 클라우드 샌드박스의 실제 Python 버전이다(교재는 Windows 기준 3.7 이상을 요구). 가상환경을 활성화하면 터미널 프롬프트 앞에 `(ai_venv)`가 표시된다.*

**예제 코드**: `pip install`

```bash
pip install fastapi
pip install "uvicorn[standard]"
```

*FastAPI 자체는 웹 프레임워크일 뿐 개발 서버를 포함하지 않으므로, ASGI 서버인 uvicorn을 함께 설치해야 실제로 애플리케이션을 실행할 수 있다.*

**실행 결과**: `python -c "import fastapi, uvicorn"`

```
fastapi 0.141.1
uvicorn 0.46.0
```

### 4.3 기본 FastAPI 애플리케이션 작성과 실행

경로(`/`)와 동적 경로(`/items/{item_id}`) 두 개짜리 가장 단순한 FastAPI 앱을 작성한다.

**예제 코드**: `ex02/main.py`

```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI application!"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
1.3.2 가장 단순한 FastAPI 애플리케이션 — 경로(route) 2개

FastAPI() 인스턴스를 만들고, 파이썬 데코레이터(@app.get(...))로 URL 경로마다
함수를 하나씩 연결한다. 함수가 반환하는 딕셔너리는 FastAPI가 자동으로 JSON으로
직렬화해 응답으로 내려준다 — Flask 등 다른 프레임워크와 달리 jsonify() 같은
별도 변환 함수가 필요 없다.
"""

from fastapi import FastAPI

# app: 이 파일에서 만드는 FastAPI 애플리케이션 인스턴스. uvicorn 실행 시
# "main:app"처럼 "파일이름:변수이름"으로 이 객체를 가리킨다
app = FastAPI()


# @app.get("/"): HTTP GET 메서드로 루트 경로(/)에 요청이 오면 이 함수를 실행
@app.get("/")
def read_root():
    # 딕셔너리를 그대로 return하면 FastAPI가 자동으로 JSON 응답으로 바꿔준다
    return {"message": "Welcome to the FastAPI application!"}


# {item_id}: 경로 안의 중괄호는 "경로 파라미터" — 이 부분에 들어온 값이
# 함수의 item_id 인자로 그대로 전달된다
# item_id: int  ->  타입 힌트를 붙이면 FastAPI가 "42" 같은 문자열을 자동으로
# 정수로 변환하고, 숫자가 아닌 값이 오면 자동으로 422 오류를 응답한다
# q: str = None ->  경로에 없는 파라미터는 쿼리 파라미터로 취급되고,
# 기본값(None)이 있으므로 선택적(optional) 파라미터가 된다
@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}

# ─────────────────────────────────────────────────────────────
# [교안용 설명 포인트]
# 1) 함수 시그니처의 타입 힌트(item_id: int)가 곧 "요청 데이터 검증 규칙"이 된다는
#    점이 FastAPI의 핵심 특징이다 — Flask라면 직접 int(request.args["id"])처럼
#    변환·검증 코드를 써야 하지만 FastAPI는 타입 힌트 한 줄로 끝난다.
# 2) 경로 파라미터(item_id, {} 안에 있음)와 쿼리 파라미터(q, {} 밖에 있고 기본값이
#    있음)를 함수 시그니처만 보고 구분하는 규칙을 강조하면 좋다. 4.5절의
#    create_product(name: str)에서 이 규칙 때문에 실제로 오류가 나는 사례로
#    다시 연결된다.
# 3) app = FastAPI() 자체는 아직 서버가 아니라 "애플리케이션 정의"일 뿐이고,
#    실제로 요청을 받으려면 다음 단계의 uvicorn이 필요하다는 점도 짚어준다.
# ─────────────────────────────────────────────────────────────
```

</details>

애플리케이션을 uvicorn으로 실행한다.

**예제 코드**: `uvicorn`

```bash
uvicorn main:app --reload
```

*`main`은 파일 이름(`main.py`), `app`은 그 안의 FastAPI 객체 이름, `--reload`는 코드가 바뀌면 서버를 자동으로 다시 시작해주는 개발용 옵션이다.*

**실행 결과**: `uvicorn main:app --reload`

```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8010 (Press CTRL+C to quit)
```

*실습 환경에서 실제로 uvicorn을 백그라운드로 실행해 확인한 로그다. 서버가 뜨면 다음 두 문서 화면으로 API 명세를 바로 확인할 수 있다: Swagger UI(`http://127.0.0.1:8000/docs`), ReDoc(`http://127.0.0.1:8000/redoc`).*

### 4.4 웹 브라우저로 직접 테스트하기

`ex03/main.py`는 4.3절과 완전히 같은 기본 FastAPI 앱이다. 이번에는 서버를 실행한 뒤 실제로 curl과 브라우저로 접근해 응답을 확인한다.

**예제 코드**: `ex03/main.py`

```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI application!"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}
```

**실행 결과**: `GET /`

```json
{
    "message": "Welcome to FastAPI!"
}
```

*실제 uvicorn 서버에 curl로 요청해 확인한 응답이다.*

**실행 결과**: `GET /items/42?q=example`

```json
{
    "item_id": 42,
    "q": "example"
}
```

*경로 파라미터 `42`는 정수로 변환되어 `item_id`에, 쿼리 문자열 `q=example`은 그대로 `q`에 담겼다.*

Swagger UI(`/docs`)는 각 엔드포인트를 화면에서 바로 호출해볼 수 있는 대화형 문서이고, ReDoc(`/redoc`)은 더 단순한 디자인의 읽기 전용 문서다. 실습 환경에서는 실제 uvicorn 서버에 Chromium 헤드리스 브라우저로 접속해 화면을 그대로 캡처했다.

**Swagger UI 화면**

![Swagger UI 문서 화면](data:image/png;base64,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)

*실제 uvicorn 서버(127.0.0.1:8010)에 접속해 캡처한 Swagger UI 문서 화면이다. CDN 대신 로컬 정적 파일(swagger-ui-dist)을 서빙해 오프라인 샌드박스에서도 실제 렌더링 화면을 확인할 수 있었다.*

**Swagger UI — "Try it out" 실행 결과**

![Swagger UI Try it out 실행 결과](data:image/png;base64,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)

*`GET /` 엔드포인트를 Try it out → Execute로 실제 호출한 응답 화면이다.*

**ReDoc 화면**

![ReDoc 문서 화면](data:image/png;base64,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clhEZFTV+k2yuhbg38AKMAAAAABAFQjAAAAAAABV4BZo4G/cAg0AwJv9J2+BBqAqrAADAAAAAFSBAAwAAAAAUAUCMAAAAABAFQjAAAAAAABVIAADAAAAAFSBAAwAAAAAUAUCMAAAAABAFQjAAAAAAABVIAADAAAAAFSBAAwAAAAAUAUCMAAAAABAFQjAAAAAAABVIAADAAAAAFRBL6sLACDz5s1bvnx5xhY9PT07O7sKFSp8++23uXPnzqrCAAAAgP8SAjCQXbRq1crKykr5/Pz5c39/f29v74MHD65atapAgQJZWxsAAADwH0AABrKLNm3aFC9ePGPLsWPHhg0btnr16p9++imrqgIAAAD+MwjAQPbl4eGhr69///59bUt4ePjUqVOvXbsWExOTN2/eevXqffvttzo6OiKSmpq6cePGPXv2BAUF5cqVq3jx4s2aNfPw8BCRmTNn/vnnnwcPHlyyZMmZM2ciIiLKlCkzfvx4S0tLZdjExMRZs2adOXMmLCzMysqqdOnSI0eONDc3F5Fz5871799/yZIld+7c2bdv340bN4oUKdKlS5c6deoox96+fXv58uWXL1+Ojo4uWrSos7Nzv379TExMlG83b968efPmhw8fGhsbFy5cePjw4UWKFFG+iomJ+eOPP06dOvX48eMCBQoULVq0e/fuhQsX/pcuLgAAANSHAAxkX0FBQcnJyXZ2dsqPMTExHTt21NXV7dSpU/78+f38/NatWxcRETF69GgRmT9//po1a3r37t27d++nT58eOnRo+PDhGzZsKFSokJ6eXnp6ev/+/du0adOzZ8/AwMARI0YMHDhw3bp1ysj9+vW7cuVKt27dypYtGxQUtG7dui5dumzdulVfX19fX19EFi1a5OTkNH369NjY2BkzZvz000+lSpWytbWNiIjo1atXsWLFevXqZWVlFRQUtGTJkqioqF9++UVEli5dunDhwnr16vXu3Ts8PPzgwYPdu3dfu3atg4ODiHh6ekZERHTp0iVfvnyhoaEbN24cOHDgrl27dHV1s+ZyAwCyt+TERANJDX8S9jwuLqtryUZMTE1t8tgmiY6+gWFW1wJ8AQjAQHb04sWLc+fOeXl5iUirVq2UxqVLl8bFxW3atCl//vwiUqtWLXt7++nTp3fu3NnR0fHs2bOurq69evVSOjdo0OCPP/54/vy5dszatWu3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)

*같은 서버의 `/redoc` 경로에 접속해 캡처한 ReDoc 문서 화면이다.*

### 4.5 PostgreSQL 데이터베이스와 FastAPI 연동

2.1절에서 만든 `company` 데이터베이스의 `products` 테이블을 FastAPI와 연결해, 상품을 조회·등록하는 CRUD API를 완성한다. `sqlalchemy`(테이블 정의·동기 작업), `databases`(비동기 쿼리 실행), `asyncpg`(PostgreSQL 비동기 드라이버) 세 라이브러리를 함께 쓰고, 파일은 `database.py`(연결 설정) → `models.py`(테이블 모델) → `main.py`(FastAPI 앱) 순서로 구성한다.

**예제 코드**: `pip install`

```bash
pip install sqlalchemy databases asyncpg
```

먼저 교재 원문 그대로 연결 설정을 작성하면 서버 실행 시 실제로 오류가 난다.

**예제 코드**: `database.py` — 책 원문

```python
from sqlalchemy import create_engine, MetaData
from databases import Database

DATABASE_URL = "postgresql+asyncpg://postgres:1234@localhost/company"
database = Database(DATABASE_URL)
metadata = MetaData()

# 데이터베이스 엔진 (동기 방식)
engine = create_engine(DATABASE_URL)
```

**실행 결과**: `database.py` — 책 원문의 실제 버그

```
sqlalchemy.exc.MissingGreenlet: greenlet_spawn has not been called;
can't call await_only() here. Was IO attempted in an unexpected place?
```

*`asyncpg`는 비동기 전용 드라이버인데, 동기 함수인 `create_engine()`에 동일한 `postgresql+asyncpg://...` URL을 그대로 넘겼다. `metadata.create_all(bind=engine)`처럼 동기 방식으로 이 엔진을 쓰는 순간, 비동기 드라이버가 동기 컨텍스트에서 호출되어 실제로 실패한다.*

비동기 쿼리용 URL과 동기 작업(테이블 생성)용 URL을 서로 다른 드라이버로 분리하면 해결된다.

**예제 코드**: `ex04/database.py` — harness 보정

```python
from sqlalchemy import create_engine, MetaData
from databases import Database

# 비동기 쿼리용 (FastAPI 요청 처리)
DATABASE_URL = "postgresql+asyncpg://postgres:1111@localhost/company"
database = Database(DATABASE_URL)
metadata = MetaData()

# 테이블 생성 등 동기 작업용 (psycopg2)
SYNC_DATABASE_URL = "postgresql://postgres:1111@localhost/company"
engine = create_engine(SYNC_DATABASE_URL)

print("Database connection established successfully.")
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
1.3.4 비동기 전용 드라이버(asyncpg)와 동기 엔진(create_engine)의 충돌 해결

같은 PostgreSQL 접속 정보를 "비동기로 실제 쿼리를 실행할 때"와
"애플리케이션 시작 시 테이블을 동기적으로 생성할 때"라는 서로 다른 두 목적에
쓰기 위해, 두 개의 접속 URL(DATABASE_URL / SYNC_DATABASE_URL)로 분리한 것이
이 파일의 핵심이다.
"""

from sqlalchemy import create_engine, MetaData
from databases import Database

# DATABASE_URL: databases.Database 객체(비동기 쿼리 실행용)에만 사용.
# "postgresql+asyncpg://" 접두사는 SQLAlchemy에게 asyncpg 드라이버를 쓰라고
# 알려주는 표기다
DATABASE_URL = "postgresql+asyncpg://postgres:1111@localhost/company"
database = Database(DATABASE_URL)
metadata = MetaData()

# SYNC_DATABASE_URL: create_engine()(동기 엔진)에만 사용. 드라이버를 명시하지
# 않은 "postgresql://" 형태는 SQLAlchemy가 기본 동기 드라이버(psycopg2 계열)를
# 사용하도록 만든다 — 비동기 드라이버(asyncpg)가 섞이지 않는다
SYNC_DATABASE_URL = "postgresql://postgres:1111@localhost/company"
engine = create_engine(SYNC_DATABASE_URL)

print("Database connection established successfully.")

# ─────────────────────────────────────────────────────────────
# [교안용 설명 포인트]
# 1) 같은 데이터베이스에 접속하더라도 "비동기로 쓸 것인가, 동기로 쓸 것인가"에
#    따라 드라이버(URL 접두사)가 달라야 한다는 것이 이 버그의 핵심 교훈이다.
#    이후 웹 백엔드 실습(6장)에서도 자주 마주치는 패턴이므로 여기서 확실히
#    짚어두면 좋다.
# 2) engine(동기)은 애플리케이션 "시작 시점"에 테이블을 만드는 등 한 번만
#    필요한 작업에, database(비동기)는 매 요청마다 실행되는 쿼리에 쓰인다는
#    역할 구분을 강조한다.
# 3) 비밀번호가 코드에 그대로 노출돼 있다는 점도 짚을 만하다 — 실무에서는
#    환경변수(os.environ)나 .env 파일로 분리해야 한다는 것을 언급하면 좋다.
# ─────────────────────────────────────────────────────────────
```

</details>

*비동기 `database` 객체는 책 원문 그대로 `asyncpg` URL을 유지하고, `metadata.create_all()`에서만 쓰이는 동기 `engine`은 드라이버를 명시하지 않은 URL로 분리했다 — 비동기 쿼리 처리 흐름은 그대로 두고, 충돌이 나던 지점만 최소한으로 고친 것이다.*

**예제 코드**: `ex04/models.py`

```python
from sqlalchemy import Table, Column, Integer, String
from database import metadata

# products 테이블 모델 정의
products = Table(
    "products",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String(255), nullable=False),
)
```

*`Table(...)`은 실제 SQL의 `CREATE TABLE`에 대응하는 SQLAlchemy 표현이다. `metadata`는 `database.py`에서 만든 것을 그대로 가져와, 이 테이블 정의가 앞서 만든 연결·엔진과 같은 메타데이터 레지스트리에 등록되도록 한다.*

**예제 코드**: `ex04/main.py`

```python
from fastapi import FastAPI, HTTPException
from database import database, engine, metadata
from models import products

# FastAPI 애플리케이션 생성
app = FastAPI()
# 데이터베이스 초기화
metadata.create_all(bind=engine)


@app.on_event("startup")
async def startup():
    await database.connect()


@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()


# 상품 목록 조회 API
@app.get("/products")
async def get_products():
    query = products.select()
    rows = await database.fetch_all(query)
    return [dict(row) for row in rows]


# 상품 추가 API
@app.post("/products")
async def create_product(name: str):
    query = products.insert().values(name=name)
    last_record_id = await database.execute(query)
    return {"id": last_record_id, "name": name}


# 상품 단일 조회 API
@app.get("/products/{product_id}")
async def get_product(product_id: int):
    query = products.select().where(products.c.id == product_id)
    product = await database.fetch_one(query)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return dict(product)
```

<details>
<summary><span class="label-badge">코드분석</span></summary>

```python
"""
1.3.4 FastAPI + SQLAlchemy + databases로 products 테이블 CRUD API 완성

database.py의 database(비동기)·engine(동기)·metadata, models.py의 products
테이블 정의를 모두 가져와, GET(목록 조회) · GET(단일 조회) · POST(등록) 세 개의
엔드포인트를 완성한다. FastAPI의 startup/shutdown 이벤트로 DB 연결의 시작과
끝을 애플리케이션 생명주기에 맞춘다는 것이 이 파일의 핵심 구조다.
"""

from fastapi import FastAPI, HTTPException
from database import database, engine, metadata
from models import products

app = FastAPI()

# metadata.create_all(bind=engine): products 테이블이 아직 없다면 여기서
# 실제 CREATE TABLE을 실행한다 — 동기 엔진(engine)을 쓰므로 서버가 켜지는
# 시점에 한 번만 동기적으로 실행되고 끝난다
metadata.create_all(bind=engine)


# @app.on_event("startup"): 서버가 요청을 받기 시작하기 "직전"에 한 번 실행됨
# — 비동기 커넥션 풀(database)을 여기서 미리 열어둔다
@app.on_event("startup")
async def startup():
    await database.connect()


# @app.on_event("shutdown"): 서버가 종료될 때 한 번 실행됨 — 열어둔 커넥션을
# 정리한다 (프로세스가 죽을 때 커넥션이 좀비로 남지 않도록)
@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()


@app.get("/products")
async def get_products():
    # products.select(): SQLAlchemy Core 문법으로 "SELECT * FROM products"에
    # 해당하는 쿼리 객체를 만든다 (아직 실행되지 않음)
    query = products.select()
    # await database.fetch_all(query): 비동기로 쿼리를 실행하고 모든 행을 가져옴
    rows = await database.fetch_all(query)
    return [dict(row) for row in rows]


@app.post("/products")
async def create_product(name: str):
    # name: str  ->  Pydantic 모델이 아니라 단순 타입 힌트이므로, FastAPI는
    # 이 값을 요청 바디가 아니라 "쿼리 파라미터"로 받는다 (4.3절에서 짚은 규칙)
    query = products.insert().values(name=name)
    last_record_id = await database.execute(query)
    return {"id": last_record_id, "name": name}


@app.get("/products/{product_id}")
async def get_product(product_id: int):
    query = products.select().where(products.c.id == product_id)
    product = await database.fetch_one(query)
    if product is None:
        # HTTPException: FastAPI가 이 예외를 잡아 지정한 status_code와
        # detail 메시지를 담은 JSON 오류 응답으로 자동 변환해준다
        raise HTTPException(status_code=404, detail="Product not found")
    return dict(product)

# ─────────────────────────────────────────────────────────────
# [교안용 설명 포인트]
# 1) @app.on_event("startup"/"shutdown")은 최신 FastAPI 문서에서는 lifespan
#    컨텍스트 매니저로 대체를 권장하는 legacy 패턴이지만, 실습에 쓰인 FastAPI
#    0.141.1에서는 여전히 정상 동작한다는 점을 알려주면 좋다.
# 2) create_product(name: str)에서 "타입 힌트만 있고 Pydantic 모델이 아니면
#    쿼리 파라미터로 인식된다"는 규칙이 실제로 어떤 결과를 낳는지는 바로 다음
#    curl 테스트에서 422 오류로 확인한다 — 이 지점을 미리 강조해두면 좋다.
# 3) products.c.id처럼 .c로 컬럼에 접근하는 SQLAlchemy Core 문법과, ORM
#    방식(클래스 기반 모델)의 차이를 궁금해하는 학습자가 있다면, 이 코드는
#    "Core" 스타일이라는 것을 짚어줄 수 있다.
# ─────────────────────────────────────────────────────────────
```

</details>

*`@app.on_event("startup"/"shutdown")`은 최신 FastAPI에서는 사실상 legacy 패턴이지만, 실습 버전(0.141.1)에서는 정상 동작한다.*

서버를 `uvicorn main:app --reload`로 실행하면 Swagger UI에 `products` 관련 세 엔드포인트가 노출된다.

**products API — Swagger UI**

![products API Swagger UI 화면](data:image/png;base64,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6LGr7EerS6o98oo8daqIziOsrU5EbL87LNUiWk2evbWWvjLv/CI5Szr/dWxXV3tRy1k+/eGFGXb//uOTbFvW78ytMIT3uG3ylLFxrkigZS6c8sjiPAkfdHcv28aNqVlmuygdb5476544g4hW+NPnb7ydnJZrsSv+Ub1G3/Pw6F51ccX800evzl+xs0j8Y5PGd28431VLXzDlsWV5En3ja/PujJbcZVMfeSdDgkY+99qkbq6oohWmLlvw0bK0wxab4h/eudfQ0beNSwxWzRufm/Ti1oraYYqSn74lWUQkaNCz8yf1Mopo5vQNS75clrIj02JX/KPiusYPHH3bqNgT44913zdL99nDR4/tFXT8G5qmiYhqOC7HZnwwefqXuRI+9I74wtVr04rtho79J0x6aFSU6yzrT289MnNNkdLxhts7565N2ZlbIaLE3z/n2XFRqoiWk/LO/I82phXbRPGP7n3bwxNH1X6xohVue2fOgrUZFgnqOnJcVMN+qPWn1yfOTLYoXf82f8aoCDnu66r9dm2Z33/0zicp6UUVdqV9bK/EkbfcODTOkLNy1iPz99lrh8n7cvL/fSkiEnbzvFfuiTtNojJveWXSrM2W2lf+/We8MrXvsRb0Kap1UVWDQUTEbj/praZpOSvnTF+QF3f7A7NndAsy2IrSt306f9709EmvTEtqIgGa01d+vSquY68Yw/Hvq/6xdzw396ZoVbTSrB3L3n9j3nzDnJYkzzOl5aR+uTTv5l5EVgAAgLPVsNfqUp9d6wW2b1+fWpd8u7bnVVefcMLOn3688fqhIaEdvv1+Y2D79uepVPeKrDExMqith1RULtpQtrZArVErvYw+Dw40dlSckT66nLLa0/IOHn1ml6Pi2HXeXgbZlGkTEcVXfXyY4Qqd9vUm23dmERGdwb9VPqR2KHnZDot/r3sHnPhPecumxStE8VFEbLm73pn1umnetAHBDd7PTV6UK6L4BJmkyGwxW0VECje8PmXuZouIKD6K3ZK19eOnM/OenDepb4Boh5a/OGtJml1ExJKR/E5GS4osTHl16rxNtV1ouyV337pPJLZvwqgI1RTXObao2FaYl2sTESUoPMygihrU0SQiouWsnDf97X12ETG0DzcZ7Lnb133feeTQWKN6/PBblm8sUno+POykLHuquJW79uNcUQyK2G2HN82fYwya89BVDSYV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)

*`GET /products`, `POST /products`, `GET /products/{product_id}` 세 엔드포인트가 실제로 노출된 화면이다.*

교재 원문대로 JSON 바디로 상품을 등록하는 curl 명령을 실행하면 실제로 오류가 난다.

**실행 결과**: `curl (JSON body)` — 책 원문의 실제 버그

```
curl -X POST "http://127.0.0.1:8000/products" -H "Content-Type: application/json" -d '{"name": "Sample Product"}'

HTTP 422
{"detail":[{"type":"missing","loc":["query","name"],"msg":"Field required","input":null}]}
```

*`create_product(name: str)`은 Pydantic 모델이 아닌 단순 `str` 파라미터라서 FastAPI가 `name`을 요청 바디가 아니라 쿼리 파라미터로 인식한다. 책이 보여준 JSON 바디(`-d`) 방식으로는 `name` 값을 찾을 수 없어 실제로 `422 Unprocessable Entity`가 반환된다.*

함수 시그니처에 맞춰 `name`을 쿼리 문자열로 전달하면 정상 등록된다.

**실행 결과**: `curl (query parameter)` — 보정 후 상품 추가 성공

```
curl -X POST "http://127.0.0.1:8000/products?name=Sample%20Product"

HTTP 200
{"id":21,"name":"Sample Product"}
```

*URL 쿼리 문자열로 `name`을 전달하니 실제로 정상 등록됐다. 등록된 `id`가 21인 것은, 2.1절에서 SQL로 미리 넣어둔 20개 상품(`id` 1~20) 다음 번호가 자동으로 채번됐기 때문이다.*

**실행 결과**: `curl (GET /products)` — 상품 목록 조회

```
curl -X GET "http://127.0.0.1:8000/products"

HTTP 200
[{"id":1,"name":"Product 1"},{"id":2,"name":"Product 2"}, ... ,
 {"id":20,"name":"Product 20"},{"id":21,"name":"Sample Product"}]
```

*2.1절에서 준비한 상품 20개에 방금 추가한 `Sample Product`까지 총 21개가 실제로 조회됐다.*

**실행 결과**: `curl (GET /products/9999)` — 존재하지 않는 상품 조회

```
curl -X GET "http://127.0.0.1:8000/products/9999"

HTTP 404
{"detail":"Product not found"}
```

*`get_product()`의 `HTTPException(status_code=404)` 분기가 실제로 정상 동작해, 존재하지 않는 `id`를 조회하면 명확한 404 오류를 돌려준다.*

---

## 핵심 정리

- **개발 환경**: VS Code(편집기) + miniconda3(Python 실행·가상환경 관리)로 기본 개발 환경을 만들고, `conda create`로 프로젝트 전용 가상환경(`fullstack_proj_env`)을 분리한다.
- **패키지 관리**: pip는 설치(`install`)·특정 버전 고정(`==`)·최소 버전 지정(`>=`)·목록 확인(`list`, `show`)·업그레이드(`--upgrade`)·삭제(`uninstall`)·캐시 관리(`cache dir`, `cache purge`)를 모두 담당하며, `venv`와 함께 쓸 때 가장 효과적이다.
- **데이터 준비**: 같은 데이터를 PostgreSQL(관계형 DB) · CSV(단순 표) · pickle(Python 객체 그대로) · JSON(키-값 텍스트) · scikit-learn 공개 데이터셋 다섯 가지 형식으로 각각 준비·로드하는 방법을 실제 코드로 확인했다. Boston 데이터셋처럼 라이브러리 버전이 올라가며 사라진 API를 California Housing으로 대체하는 과정도 실습했다.
- **FastAPI**: 타입 힌트만으로 요청 검증과 API 문서(Swagger UI·ReDoc)가 자동으로 만들어진다는 것이 핵심 특징이다. `database.py`(연결) → `models.py`(테이블) → `main.py`(엔드포인트) 3단 구조로 PostgreSQL과 연동하는 CRUD API를 완성했다.
- **실제 버그 3건**: `::INT` 반올림으로 인한 `CHECK` 제약 위반(SQL), `load_boston()` 제거(scikit-learn), `asyncpg` URL을 동기 엔진에 그대로 쓴 `MissingGreenlet` 오류(SQLAlchemy) — 모두 "책이 쓰인 시점과 지금 사이에 라이브러리가 바뀌었거나, 타입 규칙을 놓쳤을 때" 실제로 발생하는 오류라는 공통점이 있다.

## 다음 절 안내

다음 차시부터는 이 장에서 갖춘 환경 위에서 본격적으로 Python 문법(2장)과 수학·통계 기초(3장)를 다지고, 이어서 데이터 전처리(4장)와 머신러닝 모델링(5장)으로 이어간다.

