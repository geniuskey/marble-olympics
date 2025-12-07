# 🏅 구슬 올림픽 (Marble Olympics)

참여자 추첨/순위 결정을 위한 물리 기반 구슬 레이싱 게임입니다.

## 🎮 데모

[👉 플레이하기](https://euiyun.github.io/marble-olympics/)

## ✨ 기능

- **물리 엔진**: 실감나는 구슬 물리 시뮬레이션
- **다양한 장애물**: 핀, 범퍼, 스피너, 포탈, 부스터, 벽, 삼각형
- **3가지 맵**: 카오스, 핀볼, 깔때기
- **4쌍의 포탈**: 색상별로 구분되는 순간이동 장치
- **실시간 순위**: 레이스 중 순위 실시간 업데이트
- **스크롤링 카메라**: 선두 구슬을 따라가는 카메라
- **진행도 바**: 레이스 진행률 표시

## 🎯 사용법

1. 참여자 이름 입력 (줄바꿈 또는 쉼표로 구분)
   - `이름*숫자` 형식으로 복수 참여 가능 (예: `철수*3`)
2. 맵 선택
3. 시작 버튼 클릭!

## 🛠️ 장애물 종류

| 장애물 | 설명 |
|--------|------|
| ⚫ 핀 (Peg) | 기본 장애물, 구슬을 튕겨냄 |
| 🔴 범퍼 (Bumper) | 강한 반발력, 충돌 시 애니메이션 |
| 🌀 스피너 (Spinner) | 회전하는 막대 |
| 🔵 포탈 (Portal) | 순간이동 (색상별 쌍) |
| ⬆️ 부스터 (Booster) | 방향성 가속 |
| ➖ 벽 (Wall) | 경로 구조물 |
| 🔺 삼각형 (Triangle) | 방향 전환 |

## 📁 파일 구조

```
marble-olympics/
├── index.html          # 메인 게임 파일
├── README.md           # 이 파일
└── .github/
    └── workflows/
        └── deploy.yml  # GitHub Pages 자동 배포
```

## 🚀 배포

이 프로젝트는 GitHub Pages로 자동 배포됩니다.
`main` 브랜치에 push하면 자동으로 업데이트됩니다.

## 📄 라이선스

MIT License

---

Made with ❤️ by euiyun

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/euiyun)
