@AGENTS.md

# Git workflow

- Never push directly to `main` — it's protected and direct pushes will be rejected.
- For any change, create a feature branch (`git checkout -b feature/short-description`), commit there, then open a pull request (`gh pr create`) targeting `main`.
- Keep PRs focused and pull the latest `main` before starting new work to avoid conflicts.
