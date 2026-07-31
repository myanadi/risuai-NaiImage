# 🎨 NAI Image — RisuAI Plugin

A NovelAI image generation plugin for [RisuAI](https://github.com/kwaroran/Risuai). Reads the latest RP turn, converts it into a Danbooru-tag scene prompt, and generates the image — without inventing details the turn never mentioned.

## ✨ Features

* **Three generation modes** — Character profile / free input / scene extraction from the latest AI turn
* **Structured scene prompts** — `scene:` (place, time, lighting, mood, framing, camera angle) + `char:` (pose, expression, action, props, outfit), up to 3 named characters
* **Crowd handling** — Background people collapse into a single `crowd` tag instead of individual character lines
* **Anti-hallucination guardrail** — The extractor may interpret mood freely but must not invent settings. No sunsets, beaches or cherry blossoms unless the turn says so; neutral background when unclear
* **Full parameter control** — 6 NAI models, 6 samplers, 4 noise schedules, with quality negative prompt defaults
* **Job recovery** — Generation jobs persist; stalled jobs are detected after 7 minutes and can be resumed or cleared
* **ZIP response parsing** — Reads NAI's ZIP payload directly (EOCD + local file headers), no external library
* **Blocked-call fallback** — Detects environment-level plugin blocks and format errors, then falls back instead of failing silently
* **History** — Last 30 generations kept with their prompts

## 🚀 Installation

1. Download `NAIImage.js`
2. In RisuAI: Settings → Plugins → Import Plugin
3. Add your NovelAI persistent token (`pst-…`) in plugin settings
4. Enable

## 🛠️ Tech Stack

* Vanilla JavaScript (no frameworks)
* NovelAI Image Generation API
* RisuAI Plugin API v3.0
* Developed with AI-assisted workflow (Claude/GPT)

## 📝 Why This Plugin

The earlier GPT Image plugin in this series handles natural-language prompts. NovelAI doesn't work that way — it wants Danbooru tags, it names characters positionally, and it hands back a ZIP file instead of an image. Reusing the old pipeline wasn't an option, so this is a separate one built around those constraints.

The part that took the most iteration wasn't the API — it was teaching the extractor where to stop. Left alone, an LLM asked to describe a scene will happily add a sunset because the mood felt like one, and then the same room looks different every turn. The prompt draws an explicit line: **background is fact and may not be invented, mood is interpretation and may be.** That single rule did more for scene consistency than any parameter tuning.

## 🇰🇷 한국어 요약

RisuAI 대화 턴을 읽어 Danbooru 태그 기반 장면 프롬프트로 변환하고 NovelAI로 이미지를 생성하는 플러그인입니다. 프로필·자유입력·장면추출 3개 모드를 제공하며, 장면은 `scene`(장소·시간대·광원·분위기·구도·앵글)과 `char`(포즈·표정·행동·소지품·복장) 형식으로 최대 3인까지 구조화합니다. 핵심은 환각 방지 규약으로, **배경은 사실이라 지어낼 수 없고 무드는 해석이라 허용**한다는 경계를 프롬프트에 명문화했습니다. ZIP 응답 직접 파싱, 7분 stale 기준 작업 복구, 차단 상황 폴백을 지원합니다.

## 📜 License

MIT — see [LICENSE](LICENSE)

## 🔗 Links

* Author Portfolio: https://app.notion.com/p/Portfolio-377742607f3c811fb73ce8226a96ae64
* RisuAI: https://github.com/kwaroran/Risuai
* NovelAI: https://novelai.net
