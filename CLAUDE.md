@AGENTS.md

# Git workflow

- Never push directly to `main` — it's protected and direct pushes will be rejected.
- For any change, create a feature branch (`git checkout -b feature/short-description`), commit there, then open a pull request (`gh pr create`) targeting `main`.
- Keep PRs focused and pull the latest `main` before starting new work to avoid conflicts.

# Docs

- 기획·디자인·스펙 문서는 `docs/`에 있다. 지도는 `docs/README.md`.
- 작업 단위는 `docs/prd/02-requirements.md`의 요구사항 ID(`SEC-1`, `DIF-3` 등)로 부르고, PR 제목에 ID를 넣는다.
- API·스키마를 바꾸면 `docs/spec/`을 같은 PR에서 고친다. 결정이 바뀌면 `docs/prd/decisions.md`에 한 줄 추가한다.
