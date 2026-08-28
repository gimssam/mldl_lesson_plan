# 웹 교안 배포 가이드

이 폴더(`01_교안`)를 그대로 GitHub Pages로 배포하면 웹 교안이 됩니다.

> 참고: 이 폴더는 이미 GitHub 저장소(`gimssam/mldl_lesson_plan`)와 연결되어 있고,
> 로컬에서 파일을 저장하면 어떤 동기화 도구가 자동으로 git commit/push까지 해주는
> 것으로 확인됐다(2026-08-28). GitHub Pages도 브랜치에서 바로 서비스하는 방식이라
> push 이후 별도 배포 조작 없이 1~2분 안에 실제 사이트에 반영된다. 아래 "1. 이 폴더를
> 저장소로 만들기" ~ "3. GitHub Pages 켜기"는 저장소를 처음 만들 때만 필요한 절차이며,
> 이 차시에서는 이미 끝난 상태다. 새 차시를 다른 폴더에서 처음 배포할 때만 참고하면 된다.

## 폴더 구성

- `ch532_신경망심층학습.md` : 교안 원본. 이 파일을 수정하면 웹 페이지 내용도 그대로 바뀐다. 다시 배포할 필요 없이 새로고침만으로 반영된다.
- `index.html` : 마크다운 파일을 불러와 화면에 그려주는 뷰어 골격. css/js를 불러오기만 하는 얇은 껍데기다.
- `css/style.css` : 화면 스타일. 클레이(Clay) 디자인 톤(크림 배경, 다크 네이비 포인트, 딥티일 코드 박스)을 적용했다.
- `js/app.js` : 마크다운을 불러와 렌더링하고, 목차·콜아웃·코드 하이라이트 등을 만드는 로직.
- `js/vendor-marked.min.js`, `js/vendor-dompurify.min.js` : 마크다운 렌더링에 쓰는 라이브러리. 외부 CDN 없이 내장되어 있어 인터넷 연결이 불안정한 강의실에서도 그대로 열린다.
- `images/` : 배너, 스펙트로그램 등 교안에 쓰인 이미지.
- `lessons.json` : 이 폴더에서 보여줄 교안 목록. 파일을 추가하면 상단에 탭이 자동으로 생긴다.
- `.nojekyll` : GitHub Pages가 Jekyll 처리 없이 파일을 그대로 서비스하도록 하는 표시 파일.

## 새 차시를 추가할 때

1. 같은 폴더에 새 `.md` 파일을 넣는다.
2. `lessons.json`의 `lessons` 배열에 `{ "file": "새파일명.md", "label": "표시할 이름" }`을 한 줄 추가한다.
3. 별도 빌드 없이 그대로 반영된다.

## GitHub Pages로 배포하기

### 1. 이 폴더를 저장소로 만들기

폴더 안에서 다음 명령을 순서대로 실행한다.

```
git init
git add .
git commit -m "웹 교안 초기 배포"
```

### 2. GitHub에 저장소 만들고 연결하기

GitHub 웹사이트에서 새 저장소를 만든 뒤(예: `neural-network-lesson`), 아래 명령의 주소를 본인 저장소 주소로 바꿔 실행한다.

```
git branch -M main
git remote add origin https://github.com/사용자명/저장소명.git
git push -u origin main
```

`gh` CLI가 설치되어 있다면 저장소 생성부터 한 번에 처리할 수 있다.

```
gh repo create 저장소명 --public --source=. --remote=origin --push
```

### 3. GitHub Pages 켜기

1. GitHub 저장소 페이지에서 `Settings` -> `Pages`로 이동한다.
2. `Build and deployment` -> `Source`를 `Deploy from a branch`로 둔다.
3. `Branch`를 `main`, 폴더를 `/(root)`로 선택하고 저장한다.
4. 1~2분 뒤 `https://사용자명.github.io/저장소명/` 주소로 접속하면 웹 교안이 열린다.

## 이후 수정 시

교안 내용만 바꿀 때는 `.md` 파일만 수정하고 아래 명령으로 다시 올리면 된다.

```
git add .
git commit -m "교안 내용 수정"
git push
```

## 로컬에서 미리보기

`index.html`을 더블클릭해서 여는 방식(`file://`)은 브라우저 보안 정책 때문에 마크다운 파일을 불러오지 못한다. 아래처럼 폴더 안에서 간이 서버를 띄운 뒤 접속해서 확인한다.

```
python -m http.server 8000
```

브라우저에서 `http://localhost:8000` 접속.
