# QC Automation Rules — Design Spec

- **Date:** 2026-06-16
- **Repo:** `agent-rules` (private, `~/Github/agent-rules`) — kho agent rule chung, chia folder theo từng agent/mục đích.
- **Folder build đợt này:** `qc-automation/`
- **Status:** Design approved — pending implementation plan.

## 1. Mục tiêu

Một **Claude Code Skill** (`qc-automation`) là single source of truth để Claude **tự tuân theo** khi viết / sửa / setup test automation. Stack chính **TypeScript**: Playwright (web E2E), supertest/axios (API), WebdriverIO + Appium (mobile), k6 (performance). Bao phủ 6 nhóm rule và enforce theo 2 phase.

Repo `agent-rules` là monorepo của các bộ rule; mỗi mục đích = 1 folder top-level self-contained, cùng convention. Đợt này chỉ build `qc-automation/`; phần còn lại là scaffolding + convention để mở rộng.

### Non-goals (YAGNI)
- Không build các folder agent khác (chỉ scaffolding + convention).
- Không tự viết test cho dự án thật trong repo này (chỉ rule + `examples/` minh hoạ).
- Không thay thế CLAUDE.md toàn cục — rule sống ở skill, CLAUDE.md chỉ là pointer.
- Không hỗ trợ Python/Java ở đợt này (rule + ví dụ là TS/JS).

## 2. Consumer & cơ chế dùng

Consumer chính = **AI agent (Claude Code)**. Rule sống ở **Skill** (load khi trigger, có checklist + gate), KHÔNG phải CLAUDE.md (luôn nhét context, tốn token, không gate).

Ba cách dùng trong dự án test thật:
1. **Global skill** — symlink `qc-automation/` → `~/.claude/skills/qc-automation/` (cho máy cá nhân; update repo = cập nhật ngay).
2. **Per-project skill** (mặc định cho team) — copy folder vào `<repo-test>/.claude/skills/qc-automation/`, commit theo repo; team + CI dùng chung.
3. **CLAUDE.md pointer** (bổ trợ) — dòng ngắn trong repo test: *"Khi viết/sửa test automation, BẮT BUỘC dùng skill `qc-automation`."* Chỉ trỏ, không chứa rule.

Mặc định triển khai: **(2)+(3) qua `install.sh`**, đồng thời hỗ trợ **(1) global** cho máy chủ sở hữu. `install.sh` lo việc copy/symlink + chèn pointer (idempotent), giải bài drift bằng cách re-sync.

## 3. Enforcement — 2 phase

- **Phase 1 (làm ngay): skill + gate tự kiểm.** Checklist bắt buộc → TodoWrite → self-review gate Claude phải pass trước khi báo xong. Mềm, không cần hạ tầng.
- **Phase 2 (ship sau): enforce bằng máy.** `starter-pack/` gồm ESLint rules + playwright.config + git-hooks + CI workflow. Rule nào máy enforce được thì fail thật sự, không chỉ dựa Claude tự giác.

Phân chia: rule **xác định được bằng máy** (no-hard-wait, no-XPath, no-secret, no-floating-promises, naming, on-fail-evidence) → Phase 2 lint/CI. Rule **mang tính phán đoán** (atomic, independent, traceability, negative coverage) → gate self-review của skill.

## 4. Repo layout

```
agent-rules/
├── README.md                     # index: các bộ rule, cách cài, convention thêm folder
├── install.sh                    # --global | --project <path> | --starter <path>
├── CHANGELOG.md
├── docs/superpowers/specs/       # spec này
└── qc-automation/                # bộ rule build đợt này
    ├── SKILL.md                  # trigger + checklist gate + self-review + routing + red-flags
    ├── references/
    │   ├── code-structure.md
    │   ├── test-design.md
    │   ├── reporting.md
    │   ├── process-gates.md
    │   ├── visual-a11y.md
    │   └── performance.md
    ├── starter-pack/             # Phase 2 — enforce bằng máy
    │   ├── eslint/
    │   ├── playwright/
    │   ├── git-hooks/
    │   ├── ci/
    │   └── tsconfig/
    └── examples/                 # mini test repo TS chạy được, minh hoạ rule đúng
```

**Convention mọi folder:** mỗi folder = 1 skill độc lập, `SKILL.md` ở gốc folder, tên skill = tên folder; cài qua `install.sh`.

## 5. `SKILL.md` — cơ chế gate (trái tim)

**a) Frontmatter trigger.** `description` kiểu *"Use when viết/sửa/setup test automation (Playwright web / API / Appium mobile / k6)..."* để auto-kích hoạt đúng lúc.

**b) Mandatory checklist → TodoWrite.** Khi kích hoạt, Claude PHẢI tạo todo từ checklist và làm theo thứ tự:
1. **Trước khi viết** — xác định loại test (web/API/mobile/perf) + tier (smoke/regression) + map test-ID ↔ requirement.
2. **Khi viết code** — tuân `code-structure.md`.
3. **Khi thiết kế case** — tuân `test-design.md` (gồm negative-test bắt buộc).
4. **Reporting** — bật trace/screenshot/video-on-fail, report đúng format (`reporting.md`).
5. **Self-review gate (bắt buộc trước khi báo xong)** — chạy checklist refute: có hard-wait? có phụ thuộc test khác? chạy song song/đảo thứ tự được? có evidence khi fail? có web-first assertion (không `expect(await ...isVisible())`)? có negative case? test-ID map requirement? **Fail bất kỳ mục → quay lại sửa, KHÔNG báo hoàn thành.**

**c) Routing block** — bảng "cần gì đọc file nào" (progressive disclosure; chỉ load reference liên quan).

**d) Red-flags table** — "câu tự bào chữa = STOP" (vd *"test nhỏ khỏi cần independent"* → Sai). Học pattern skill superpowers chống Claude lười.

## 6. Nội dung `references/` (6 file)

Mỗi file: **principle (rule + lý do) → ví dụ TS đúng/sai → áp cho 3 stack (Playwright / API / Appium-WDIO)**.

### 6.1 `code-structure.md`
- POM với **BasePage abstract**; API có service-client layer; mobile có screen-object. Không nhét logic test vào POM.
- **Cấm hard-wait** (`waitForTimeout`/`sleep`) → web-first assertion / explicit conditional wait.
- **Locator priority:** `getByRole → getByLabel → getByPlaceholder → getByText → getByTestId → CSS`; **cấm XPath brittle, cấm index-based**; chain + `.filter({ hasText })` cho locator bền.
- **Network interception** (`page.route`) mock 3rd-party, "guarantee the response" — không phụ thuộc dịch vụ ngoài.
- Auth **`storageState` reuse** qua fixture, không login lại mỗi test.
- Config/env: base URL/credentials qua env/`.env`, **không hardcode secret**; `playwright.config` chuẩn (retry, `trace:'on-first-retry'`, screenshot/video on-fail, projects đa browser).
- API: reusable request/response spec builder; JSON **schema validation** cho contract testing.
- Setup/teardown idempotent; không phụ thuộc thứ tự chạy.

### 6.2 `test-design.md`
- **Test hành vi user nhìn thấy, không test implementation detail** (philosophy đầu file).
- 1 test = 1 hành vi; **atomic & independent** (chạy riêng/song song/đảo thứ tự vẫn pass).
- AAA / Given-When-Then; tên test = hành vi + kết quả mong đợi.
- **Web-first retry-able assertion bắt buộc**: `await expect(locator).toBeVisible()`; **cấm** `expect(await locator.isVisible()).toBe(true)`. `expect.soft()` cho nhiều assert trong 1 flow.
- **Negative testing bắt buộc** (không tuỳ chọn): mỗi feature có case lỗi — validation, missing field, sai format, unauthorized. "Happy-path avoidance".
- Data-driven (parametrize) thay vì copy-paste; test data tự tạo & tự dọn, không dựa data sẵn trên môi trường.
- Tier rõ: `@smoke` / `@regression`; test-ID map requirement (traceability).
- Assertion có ý nghĩa, không assert trùng/quá rộng; không try/catch nuốt lỗi.

### 6.3 `reporting.md`
- Report chuẩn: Playwright HTML report + (tuỳ chọn) Allure cho aggregate.
- **On-fail evidence bắt buộc**: trace + screenshot + video (web) / screen recording + page source (mobile) / request-response log (API).
- Flaky tracking: đánh dấu, quarantine, không để flaky làm xanh giả CI.
- Traceability matrix: test-ID ↔ requirement ↔ kết quả; báo cáo pass/fail/skip rõ lý do skip.

### 6.4 `process-gates.md`
- PR review checklist cho test (dùng chung gate self-review).
- **Definition-of-Done 1 test**: pass 3 lần liên tiếp local, có evidence, có tag/test-ID, không hard-wait.
- Commit convention; flaky-quarantine policy.
- **CI gating**: lint → typecheck → test (parallel + `--shard`) → report; upload trace/report artifact.
- **Test randomization** (đảo thứ tự bắt test phụ thuộc nhau) + **per-test timeout**.
- Naming convention file/spec; cấu trúc thư mục test.

### 6.5 `visual-a11y.md`
**Visual regression**
- `toHaveScreenshot()` (built-in) mặc định; baseline commit vào repo, review diff khi update.
- Mask vùng động; chốt viewport + device scale; disable animation/caret; chờ trạng thái ổn định (fonts/network idle) trước khi chụp.
- Threshold/maxDiffPixels có chủ đích; baseline tách theo OS/browser, chụp trong Docker/CI nhất quán (không trộn baseline local).

**Accessibility**
- `@axe-core/playwright` scan a11y trong E2E flow chính; mobile dùng accessibility id làm selector (a11y + stable locator).
- Severity gate: `critical`/`serious` → fail; `moderate`/`minor` → log/track (cấu hình được).
- Manual: keyboard navigation, focus order, ARIA role/label cho component custom.
- A11y assertion gắn test-ID map WCAG → vào traceability matrix chung.

### 6.6 `performance.md`
- k6, TS. 5 loại: smoke (1 VU) / load (ramp→100) / stress (ramp→400) / spike (jump→500) / soak (50 VU sustained) — mỗi loại mục đích rõ.
- Pass/fail bằng **threshold trong code**, không đọc số bằng mắt: `http_req_duration: ['p(95)<500']`, `http_req_failed: ['rate<0.01']`.
- Scenario-based + per-scenario threshold; custom metrics (Trend/Rate/Counter/Gauge).
- **CI chỉ chạy smoke perf; perf lớn ở môi trường pre-release riêng**; threshold **WARN, không auto-block deploy** (false-positive nhiều); cadence 2–3 lần/tuần staging; **không stress-test production**.
- Test data & ramp-profile realistic; cảnh báo không perf-test môi trường share gây nhiễu.

## 7. `starter-pack/` (Phase 2)

Copy vào repo test thật để enforce bằng máy:
- **`eslint/`** — `eslint-plugin-playwright` (`no-wait-for-timeout`, `no-element-handle`, `valid-expect`, `no-focused-test`, `no-skipped-test`) + `@typescript-eslint/no-floating-promises` + custom rule chặn hardcode secret & cấm XPath.
- **`playwright/`** — `playwright.config.ts` chuẩn: retry, `trace:'on-first-retry'`, screenshot/video on-fail, reporter html, projects đa browser.
- **`git-hooks/`** — pre-commit (husky/lint-staged): eslint + `tsc --noEmit` + chạy test đã đổi; pre-push: smoke tag.
- **`ci/`** — GitHub Actions: install → lint → typecheck → test (shard) → upload report/trace → a11y/visual gate; smoke perf job tách riêng.
- **`tsconfig/`** — strict config nền cho test project.

## 8. `install.sh`, `examples/`, `README`

**`install.sh`** (idempotent, 3 mode):
- `--global` → symlink `qc-automation/` → `~/.claude/skills/qc-automation/`.
- `--project <path>` → copy vào `<path>/.claude/skills/qc-automation/` + chèn pointer vào `<path>/CLAUDE.md`.
- `--starter <path>` → copy `qc-automation/starter-pack/*` vào repo test.
- In hướng dẫn next-step sau cài.

**`examples/`** — mini test repo TS chạy được (`npm test` pass): 1 web spec (POM + web-first assert + network mock), 1 API spec (schema validation + negative case), 1 visual, 1 a11y test. Tài liệu sống + tham chiếu cho Claude.

**`README.md`** — index: các bộ rule, cách cài (`install.sh`), convention thêm folder mới, link CHANGELOG.

## 9. Nguồn tham khảo
- Playwright official best practices (test user-visible behavior, web-first assertion, network interception, `no-floating-promises`, sharding, trace-on-retry).
- k6 / Grafana automated performance testing guide (threshold warn-not-block, env isolation, không stress-test prod, cadence).
- qaskills.sh blog (locator priority chain, BasePage, storageState reuse, negative testing emphasis) — lọc bỏ phần Python/Java & CLI thương mại.

## 10. Build order đề xuất
1. Repo skeleton + `README` + `install.sh` (global + project mode) + convention.
2. `qc-automation/SKILL.md` (trigger + checklist gate + self-review + routing + red-flags).
3. 6 file `references/` (principle + ví dụ TS).
4. `examples/` mini repo chạy được (chứng minh rule khả thi).
5. Phase 2: `starter-pack/` (eslint → playwright config → git-hooks → ci) + `install.sh --starter`.
