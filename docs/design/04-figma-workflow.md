# 04. Figma 연동 (Figma MCP)

Claude Code에 Figma MCP를 연결해서 **화면 ID ↔ Figma 프레임 ↔ 코드**를 한 번에 오가게 한다. Figma 렌더링 이미지를 페르소나 평가에 쓰고, 고친 디자인을 코드에 반영한다.

## 준비

1. Claude Code에서 Figma 플러그인(MCP)을 켜고 Figma 계정으로 인증한다.
2. Figma 파일의 프레임 이름을 화면 ID로 맞춘다. 예: `C-12 기록`, `G-01 보호자 보고서`. ([02-screens.md](02-screens.md))
3. 각 프레임의 링크(`node-id`가 붙은 URL)를 [02-screens.md](02-screens.md)의 `Figma 프레임` 칸에 붙인다.

## 자주 쓰는 요청

| 하려는 일 | Claude Code에 이렇게 요청 |
| --- | --- |
| 화면 연결 | "docs/design/02-screens.md의 화면마다 Figma 파일 `<URL>`에서 같은 이름의 프레임을 찾아 링크를 채워줘" |
| Figma 렌더링 보기 | "C-12 프레임을 렌더링해서 보여주고, 지금 `RecordScreen.tsx` 화면과 다른 점을 표로 정리해줘" |
| 페르소나 평가 | "C-12 Figma 렌더링으로 `/ux-persona-review C-12` 실행해줘" |
| 디자인 → 코드 | "C-14 프레임대로 `ReviewForm.tsx`를 고쳐줘. 색·크기는 `globals.css` 토큰만 써줘" |
| 코드 → 디자인 | "지금 코드의 C-17 서류 초안 화면을 Figma에 새 프레임으로 만들어줘" |
| 토큰 맞추기 | "Figma 변수와 `docs/design/01-design-system.md`의 색 토큰을 비교해서 다른 값만 알려줘" |

## 규칙

- 기준은 **코드**다. Figma와 코드가 다르면 어느 쪽이 맞는지 디자인 담당이 정하고, [01-design-system.md](01-design-system.md)를 고친다.
- 새 컴포넌트는 Figma에서 먼저 만들고, `app/components/ui/`에 같은 이름으로 만든다.
- 디자인을 코드에 반영할 때 색 코드를 직접 쓰지 않고 토큰을 쓴다.
