# JAMSI / 잠시

매일 꼭 필요한 이슈만 짧게 읽고 듣는 브리핑 서비스의 실행 가능한 로컬 구현입니다. 사용자용 PC 웹과 Android 앱, 운영자 CMS, FastAPI 서버를 한 저장소에 구성했습니다.

## 매일 AI 자동 발행

- 한국시간 오전 3시 50분: 전날 00:00~23:59 기사만 수집
- GitHub Models: 최신성 25%, 국민 영향도 30%, 안전성 25%, 출처 검증도 20%로 6개 선정
- 정치 기사: 좌우·정당 유불리 해석 없이 확정된 발표·결정·수치만 사용
- 파이어베이스에 예약판을 올리고 다음 날 오전 5시부터 웹과 APK에 자동 표시
- GitHub Actions 비밀값: `FIREBASE_ADMIN_EMAIL`, `FIREBASE_ADMIN_PASSWORD`

워크플로: `.github/workflows/daily-ai-publish.yml`

## 구현 범위

- 사용자 웹 `/user`: 일간·주간·월간 발행본, 날짜 선택, 6개 이슈, 정정 표시, 음성 브리핑, 안전한 광고 자리
- Android: Kotlin/Compose, Retrofit, Room 오프라인 캐시, WorkManager 갱신, MediaSessionService 백그라운드 재생, 원격 앱 설정
- 운영자 CMS `/`: 현황, 발행본 편집, 후보, 11개 검수 항목, 승인·예약·즉시 발행·정정·철회, 음성, 소스, 감사 로그, 서비스 설정
- API: 공개/관리자 API, JWT·역할·로그인 잠금, ETag/Cache-Control, 예약 발행, 소스·파이프라인·음성 자산, 감사 로그
- 데이터: SQLAlchemy/Alembic 3개 마이그레이션, 운영 PostgreSQL과 로컬 SQLite 지원

상세 구현 현황은 [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md), 데이터 구조는 [docs/ERD.md](docs/ERD.md)를 참고하세요.

## PC에서 바로 확인

PowerShell 창 1에서 API를 실행합니다.

```powershell
python -m pip install -r services/api/requirements.txt
$env:PYTHONPATH="services/api"
python -m uvicorn app.main:app --app-dir services/api --reload
```

PowerShell 창 2에서 웹을 실행합니다.

```powershell
npm install
Copy-Item .env.example .env.local
npm.cmd run dev
```

- 사용자 앱: `http://localhost:3000/user`
- 운영자 CMS: `http://localhost:3000`
- API 문서: `http://localhost:8000/docs`
- 로컬 관리자: `admin@jamsi.local / ChangeMe!2026`

공유 환경에서는 반드시 `.env`에서 관리자 비밀번호와 JWT/스케줄러 비밀값을 교체하세요.

## Android

Android Studio에서 `android/`를 열거나 다음 명령으로 디버그 APK를 만듭니다.

```powershell
cd android
.\gradlew.bat assembleDebug
```

에뮬레이터 기본 API 주소는 `http://10.0.2.2:8000/`입니다. 실제 기기에서는 `JAMSI_API_BASE_URL`을 PC의 같은 네트워크 IP로 지정해야 합니다.

## Docker API 스택

```powershell
Copy-Item services/api/.env.example .env
docker compose up --build
```

PostgreSQL, Redis, API와 06:00 예약 발행 스케줄러가 시작됩니다. 웹은 별도로 `npm.cmd run dev`를 실행합니다.

## 검증

```powershell
$env:PYTHONPATH="services/api"
python -m pytest services/api/tests -q
npm.cmd run lint
npm.cmd run build
cd android
.\gradlew.bat assembleDebug
```

## 주요 환경 변수

- API: `JAMSI_DATABASE_URL`, `JAMSI_JWT_SECRET`, `JAMSI_CORS_ORIGINS`
- 관리자: `JAMSI_SEED_ADMIN_EMAIL`, `JAMSI_SEED_ADMIN_PASSWORD`
- 스케줄러: `JAMSI_SCHEDULER_ENABLED`, `JAMSI_INTERNAL_SCHEDULER_TOKEN`
- 웹: `NEXT_PUBLIC_API_BASE_URL`
- Android: Gradle 속성 `JAMSI_API_BASE_URL`

상용 수집원, AI 요약, 상용 TTS, Google Mobile Ads, 알림·모니터링은 각 공급자 계정과 키를 넣어 교체하도록 경계를 분리했습니다. 현재 로컬 버전은 결정적인 샘플 파이프라인, 실제 재생 가능한 한국어 WAV, 테스트 광고 비표시 정책으로 안전하게 동작합니다.
