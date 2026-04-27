# new-narrative-novel：从 PR50 到真实项目长期使用路线图

> 目标：不要再把终点不断后移。接下来所有 PR 都必须服务于一个结果：作者能用这个软件长期写一个真实小说项目，而不是只演示 fixture 原型。
>
> 本文档是给 Codex / AI agent 执行用的路线图。它故意不写“改哪个文件”的细节，只规定阶段、顺序、边界、验收和暂停项。

---

## 0. 当前基线：PR50 之后到底站在哪里

PR50 之后，项目已经不是早期 UI demo。

当前已经具备：

- `fixture-seed / api / renderer / desktop` 四条 workspace 主线。
- `book-signal-arc -> scene-midnight-platform -> run -> proposal -> review -> canon patch -> prose draft -> chapter draft -> book draft -> trace` 的 usable prototype 演示链。
- Workbench scope 已覆盖 `Book / Chapter / Scene / Asset`。
- Scene run 已有 REST 合同、run events、review gate、artifact / trace read surface。
- Desktop 已能作为 Electron shell 托管本地 fixture API。
- `pnpm typecheck`、`pnpm test`、`pnpm verify:prototype` 已成为基本验收入口。

但当前还不能算“真实项目长期使用”，主要缺口是：

- prose 仍然有 fixture 渲染成分，不是完整真实 Scene Prose Writer。
- fixture API 不是真实项目持久化后端。
- 用户还不能创建 / 打开 / 保存自己的长期项目。
- context builder 还不能稳定支持真实角色、地点、lore、canon、可见性和上下文预算。
- chapter / book 还没有真正成为持续生成、审阅、修订、汇总的主工作流。
- model key、model binding、成本、失败恢复、重试、迁移、备份、导出、发布准备都还没进入可长期使用状态。

所以 PR51 以后不再追“更漂亮的原型”，而是追“真实项目可长期写作”。

---

## 1. 最终可用标准：什么叫“真实项目长期使用”

到本路线图结束时，必须能做到下面这些事。

### 1.1 作者视角

作者可以：

1. 创建一个真实项目，而不是只打开 `book-signal-arc` fixture。
2. 建 book / chapter / scene / asset。
3. 配置模型 key 和 model binding。
4. 选中一个 scene，给目标或约束，运行生成 proposal。
5. 审阅 proposal，accept / edit / reject / request rewrite。
6. accepted proposal 进入 canon patch。
7. 从 accepted canon 生成 prose draft。
8. 对 prose 进行 rewrite / revise / accept。
9. chapter draft 能汇总 scene prose，明确显示缺口。
10. book draft 能汇总章节稿，能导出可读 manuscript。
11. asset / canon / trace 能解释某段正文为什么这样写。
12. 关闭软件再打开，项目状态不丢。
13. 运行失败可以重试，模型错误不会破坏 canon。
14. 可以连续写至少 3 个 chapter、10 个 scene，而不需要开发者手动修 fixture。

### 1.2 系统视角

系统必须满足：

```text
AI output != canon
proposal != canon
accepted canon patch = story truth
prose = rendered artifact / draft
trace = explanation chain
```

长期真相必须在 project store / domain store 里，而不是在临时 run、LLM response、Temporal history、chat transcript 或 fixture seed 里。

### 1.3 验收视角

最终 release candidate 必须能跑通：

```text
Create project
-> create book/chapter/scene/assets
-> run scene with real model
-> review proposal
-> accept/edit
-> canon patch
-> prose draft
-> revise prose
-> chapter assembly
-> book assembly
-> export manuscript
-> close app
-> reopen project
-> continue from saved state
```

这条链跑不通，就不叫真实长期可用。

---

## 2. 总执行纪律

每个 PR 必须遵守这些规则。

### 2.1 每个 PR 只允许服务一个主目标

每个 PR 开头必须写清：

```text
This PR moves the project closer to real long-term project usage by doing X.
```

如果一个 PR 做不出可验证的用户能力，就不要开。

### 2.2 每个 PR 必须有“不做项”

Codex 很容易顺手扩展。每个 PR 必须明确：

```text
This PR must not introduce a new product horizon.
```

### 2.3 Fixture 只能当 demo / test fallback

PR51 以后，任何长期能力都不能继续把 fixture 当产品真相。

允许 fixture 用于：

- Storybook
- tests
- demo seed
- fallback
- migration example

不允许 fixture 用于：

- 用户真实项目保存
- real project canon truth
- real prose truth
- long-term project identity

### 2.4 UI 继续服从 Workbench Constitution

真实后端不能成为 UI 偏航借口。

所有新能力都必须落进 Workbench：

```text
Scope -> Lens -> Main Stage primary task -> Inspector support -> Bottom Dock runtime/trace
```

禁止新增 dashboard / page collection / chat-first flow。

### 2.5 每阶段必须有 gate

不要等 18 个 PR 后才发现不能用。路线图分成 5 个 gate：

```text
Gate A：真实单 scene 可生成
Gate B：真实项目可保存
Gate C：chapter/book 可持续写作
Gate D：长期项目质量与恢复
Gate E：desktop release candidate
```

任何 gate 未过，不进入下一阶段。

---

## 3. 路线总览

```text
Phase 1 / PR51-PR53：真实单 Scene 生成闭环
Phase 2 / PR54-PR57：真实项目持久化与模型配置
Phase 3 / PR58-PR61：Chapter / Book 持续写作流
Phase 4 / PR62-PR65：长期项目质量、修订、资产、分支
Phase 5 / PR66-PR68：桌面端、可靠性、Release Candidate
```

总量控制：**18 个 PR 左右到真实长期可用候选版**。

如果某个 PR 过大，允许拆成 A/B，但不能改变阶段目标，也不能新增阶段。

---

# Phase 1：真实单 Scene 生成闭环

目标：先让一场戏真正可写，不再只是 fixture prose。  
完成后，作者能在一个 scene 上完成真实模型生成、审阅、落 canon、出 prose、修订。

---

## PR51：Real Scene Prose Writer Gateway

### 目标

把 `accepted proposal / canon patch -> prose draft` 从 fixture 文本升级为真实模型生成路径。

### 大体做法

- 建立独立的 Scene Prose Writer 能力，而不是复用 scene planner。
- 输入来自 accepted proposal、selected variants、canon patch、scene context、style constraints。
- 输出是结构化 prose draft，而不是散乱聊天消息。
- prose 必须以 artifact 形式保存，再 materialize 到 scene prose read model。
- 失败时可以 fallback fixture，但 artifact 必须标明 fallback reason。

### 验收

```text
Run Scene
-> Accept / Accept With Edit
-> Prose generated
-> Open Prose
-> 看到真实模型生成的正文，而不是固定 fixture 模板
```

### 不做

- 不做 chapter workflow。
- 不做 prompt editor。
- 不做 RAG。
- 不做 Temporal。
- 不做 token streaming。

---

## PR52：Real Context Builder v1

### 目标

让 prose writer 和 planner 吃到真实、可解释、可控的上下文，而不是粗糙拼 prompt。

### 大体做法

建立第一版 context packet：

```text
book premise
chapter goal
scene objective
scene setup
accepted canon facts
current scene state
cast summary
location summary
relevant asset facts
style instruction
visibility / redaction info
context budget summary
```

每次 run 必须能解释：

```text
included what
excluded what
redacted what
why included
```

### 验收

- Context packet artifact 能被打开。
- Prose artifact 能显示它引用了哪个 context packet。
- 如果 asset 被 redacted，模型输入与 artifact explanation 都一致。

### 不做

- 不做自动向量检索。
- 不做 policy mutation UI。
- 不做完整 Prompt Manager。
- 不做用户自由拖 prompt section。

---

## PR53：Scene Prose Revision Loop

### 目标

让用户不是只能一次生成，还能对 prose 进行可追踪修订。

### 大体做法

支持：

```text
current prose draft
-> user revision instruction
-> model rewrite / local edit
-> prose revision artifact
-> review / accept revision
-> current scene prose updated
```

修订必须保留 source chain：

```text
original prose draft
revision instruction
model invocation
accepted revision
```

### 验收

- 用户可以对一段 scene prose 提出修改。
- 修改后能看到 diff summary。
- Accept revision 后 chapter draft 读到新版本。
- Trace 能说明 prose revision 来源。

### 不做

- 不做全文编辑器大工程。
- 不做多人评论。
- 不做复杂 paragraph-level merge。

---

## Gate A：真实单 Scene 可用

必须跑通：

```text
真实模型 planner/prose writer 或至少真实 prose writer
-> review
-> canon patch
-> prose
-> revision
-> trace
```

如果 prose 仍主要依赖 fixture 模板，不进入 Phase 2。

---

# Phase 2：真实项目持久化与模型配置

目标：离开 fixture。用户可以创建自己的项目，保存真实运行结果，关闭再打开不丢。

---

## PR54：Local Project Store v1

### 目标

建立真实项目存储，不再把 fixture API 当产品终态。

### 大体做法

选择一个本地优先存储策略：

```text
project directory
+ project manifest
+ local database / structured store
+ artifact store
+ migrations
```

建议优先本地-first，不要现在做 cloud/auth。

存储必须覆盖：

```text
books
chapters
scenes
assets
canon facts
runs
run events
agent invocations
context packets
proposal sets
reviews
canon patches
prose drafts
trace links
```

### 验收

- 创建一个非 fixture project。
- 创建 book/chapter/scene。
- 运行 scene 并生成 prose。
- 关闭 API/desktop 后重新打开，所有状态仍在。

### 不做

- 不做云同步。
- 不做用户登录。
- 不做协作。
- 不做完整 import/export 格式生态。

---

## PR55：Project Create / Open / Backup / Migration

### 目标

让真实项目具备长期保存的基本安全性。

### 大体做法

支持：

```text
Create Project
Open Project
Recent Projects
Project version
Migration check
Automatic backup before migration
Manual backup/export project archive
```

迁移失败不能破坏原项目。

### 验收

- 新建项目能进入 Workbench。
- 打开旧项目会检查 schema version。
- migration 前自动备份。
- migration 失败能回滚或保留原项目。

### 不做

- 不做 marketplace。
- 不做多人 workspace。
- 不做 cloud project picker。

---

## PR56：Fixture-to-Real Runtime Boundary

### 目标

明确并执行三种 runtime：

```text
fixture demo
mock/storybook
real local project
```

防止真实项目和 fixture 混杂。

### 大体做法

- Workbench 顶栏明确显示当前 runtime。
- fixture seed 可以创建 demo project，但不能污染真实 project store。
- API 需要能区分 fixture project 和 user project。
- renderer 不允许在 real local project 下 silent fallback 到 mock truth。

### 验收

- real project 下 API 断开必须显示 degraded，不许静默显示 mock 数据。
- fixture demo 仍可跑 `verify:prototype`。
- Storybook/mock 仍保留。

### 不做

- 不做云环境。
- 不做权限系统。

---

## PR57：Model Binding / Credential Store v1

### 目标

让长期用户可以安全配置模型，不再靠临时环境变量。

### 大体做法

支持 model binding：

```text
Planner model
Scene Prose Writer model
Revision model
Continuity Reviewer model
Summary/cheap model
```

支持 credential storage：

- desktop 使用系统 credential store 或至少本地加密/受限保存策略；
- web/dev 环境仍可用 env；
- 前端不直接接触 provider raw secret。

### 验收

- 用户能在 settings 中配置 provider/model。
- Scene run 使用配置的 model binding。
- 错误 key 有明确错误。
- secret 不进 run event、不进 trace、不进 artifact。

### 不做

- 不做模型 marketplace。
- 不做复杂路由/自动评测。
- 不做多用户 key 管理。

---

## Gate B：真实项目可保存

必须跑通：

```text
Create real project
-> configure model
-> create scene
-> run/prose/revise
-> close app
-> reopen
-> continue
```

如果仍需要手动 fixture 或 env 才能作为长期项目使用，不进入 Phase 3。

---

# Phase 3：Chapter / Book 持续写作流

目标：从“一场戏能写”升级到“一章、一卷书可以持续推进”。

---

## PR58：Chapter Planning and Scene Backlog

### 目标

让 chapter 不只是 scene 列表，而能规划本章 scene backlog。

### 大体做法

支持：

```text
chapter goal
chapter constraints
scene backlog proposals
scene order
scene status: planned / running / needs review / drafted / revised
```

Chapter planner 只生成 scene plan / proposal，不直接写正文。

### 验收

- 新建 chapter 后可生成 scene backlog。
- 用户可以 accept/edit scene plan。
- accepted scene plan 成为可运行 scenes。

### 不做

- 不做全自动写完整章。
- 不做复杂 timeline/board polish。
- 不做 Spatial/Blender。

---

## PR59：Chapter Run Orchestration v1

### 目标

让一个 chapter 可以按 scene 顺序推进，但仍保留 review gate。

### 大体做法

Chapter run 应该做：

```text
for each scene in accepted chapter scene order:
  prepare scene context
  run planner/proposal
  wait review or use explicit user batch action
  generate prose after accepted canon
  update chapter draft status
```

可以先半自动：每场戏都停在 review。

### 验收

- 用户能从 Chapter / Structure 或 Draft 启动下一场未完成 scene。
- 系统明确显示本章 drafted / missing / waiting review 状态。
- 不会跳过用户 review 直接改 canon。

### 不做

- 不做 fully autonomous novel generation。
- 不做后台无限跑。
- 不做复杂并发调度。

---

## PR60：Chapter Draft Assembly v2

### 目标

让 chapter draft 成为真正可读、可修、可继续推进的工作面。

### 大体做法

Chapter Draft 需要支持：

```text
read assembled chapter
show scene boundaries
show missing scenes
show weak transitions
generate transition prose
revise selected scene prose
refresh after scene revision
```

Transition prose 也必须是 artifact，不是直接塞正文。

### 验收

- 章内多个 scene prose 能汇总成可读稿。
- 缺 scene 明确显示，不假装完成。
- transition 可以生成/接受/追溯。

### 不做

- 不做完美排版。
- 不做正式出版格式。
- 不做复杂段落级编辑器。

---

## PR61：Book Draft / Manuscript Assembly v1

### 目标

让全书 manuscript 可以持续汇总和导出初版。

### 大体做法

Book Draft 支持：

```text
chapter order
chapter draft status
assembled manuscript read view
missing chapter/scene gaps
basic export: Markdown / plain text
source manifest
```

先做能长期写作的 manuscript assembly，不做出版系统。

### 验收

- 多 chapter 可以汇总成 book draft。
- export 出 Markdown / text 后能阅读。
- source manifest 能说明章节/scene/prose 来源。

### 不做

- 不做复杂 DOCX/PDF 排版。
- 不做 publishing platform。
- 不做 cover/image/export marketplace。

---

## Gate C：Chapter / Book 可持续写作

必须跑通：

```text
真实项目
-> book/chapter/scene backlog
-> 多 scene run/review/prose
-> chapter assembly
-> book assembly
-> export readable manuscript
```

如果只能写单 scene，不进入 Phase 4。

---

# Phase 4：长期项目质量、修订、资产、分支

目标：让它不是只能“生成”，而是能长期维护一个复杂项目。

---

## PR62：Review Inbox / Continuity QA v1

### 目标

建立长期写作必须的质量检查入口。

### 大体做法

Review Inbox 汇总：

```text
continuity conflicts
missing trace
asset inconsistency
unresolved proposal
stale prose after canon change
chapter gap
export readiness issue
```

Continuity reviewer 可以是模型辅助，但输出必须进入 review issue，不直接改 canon。

### 验收

- 修改 canon 后，相关 prose/chapter 可以标记 stale。
- Continuity issue 能定位到 scene/asset/canon/prose。
- 用户能 accept fix / dismiss / create rewrite request。

### 不做

- 不做全自动修复。
- 不做复杂 issue tracker。
- 不做团队协作 review。

---

## PR63：Asset Story Bible MVP

### 目标

把 Asset 从只读展示升级成真实项目的 story bible。

### 大体做法

支持 typed assets：

```text
Character
Location
Organization
Object
Lore/Rule
```

每个 asset 至少支持：

```text
profile
canon facts
private facts
mentions / appearances
relations
state timeline
context visibility
```

Asset 可以进入 context packet，但必须受 visibility/policy 控制。

### 验收

- 创建角色/地点。
- scene context 能引用它们。
- prose/trace 能显示 mentions。
- private fact 不会泄漏给不该看到的 agent context。

### 不做

- 不做 graph-first UI。
- 不做 wiki clone。
- 不做自由 schema builder。

---

## PR64：Checkpoint / Experiment Branch v1

### 目标

让长期项目可以试错，不怕毁掉 main canon/manuscript。

### 大体做法

支持：

```text
create checkpoint
create experiment branch from checkpoint
run scene/chapter in branch
compare to main
selectively adopt accepted changes
archive branch
```

Branch 是 canon/manuscript branch，不是 chat branch。

### 验收

- 从当前 chapter 创建 branch。
- 在 branch 中生成 alternate scene。
- compare main vs branch。
- 选择性合并一个 canon patch / prose draft。

### 不做

- 不做 Git UI。
- 不做复杂三方 merge。
- 不做多人分支协作。

---

## PR65：Failure Recovery / Cost / Observability v1

### 目标

让长期使用时的失败、成本、运行状态可控。

### 大体做法

支持：

```text
run retry
provider error classification
model timeout handling
partial run resume where possible
cost/token estimate and actual usage
per-run log summary
artifact-level failure detail
safe cancellation
```

Bottom Dock / Runtime 只显示支持信息，不接管主工作流。

### 验收

- 模型失败不会破坏 canon/prose。
- 用户能 retry failed step。
- 能看到本次 run 大致 token/cost。
- cancel 后状态明确。

### 不做

- 不做完整 APM 平台。
- 不做复杂 provider router。
- 不做 multi-tenant billing。

---

## Gate D：长期项目质量可控

必须跑通：

```text
真实项目写多章
-> asset/story bible 支撑 context
-> review inbox 抓质量问题
-> branch/checkpoint 试错
-> 失败可恢复
-> 成本可见
```

如果一失败就要手动改数据库，或项目越写越不可解释，不进入 Phase 5。

---

# Phase 5：桌面端、可靠性、Release Candidate

目标：让用户不用开发者姿势运行。能安装、打开项目、配置模型、写作、备份、导出。

---

## PR66：Desktop Real Project Mode

### 目标

让 desktop 成为真实长期使用入口，而不只是 fixture demo shell。

### 大体做法

Desktop 支持：

```text
open/create project directory
recent projects
local API supervisor for selected project
worker supervisor placeholder or real worker
runtime health/restart/logs
credential settings entry
```

Renderer 仍然 web-first，业务仍走 API contract。

### 验收

- 用户运行 `pnpm dev:desktop` 或 packaged app 后能创建/打开真实项目。
- 不需要手动启动 API。
- API 崩溃能提示 restart。
- Desktop 不直接把业务逻辑塞进 Electron main。

### 不做

- 不做插件系统。
- 不做云同步。
- 不做复杂 native 文件管理器。

---

## PR67：Durable Workflow Adapter v1

### 目标

让长任务从“请求期间跑完”升级为可恢复的 durable run。

### 大体做法

不要一上来做大平台。先抽象 workflow adapter：

```text
start run
query run status
append product run events
wait review signal
resume after review
retry failed activity
cancel run
```

底层可以先用本地 job queue / database-backed worker；如果决定上 Temporal，也必须守住边界：

```text
Workflow owns execution state.
Domain store owns story truth.
Artifact store owns large payload.
Frontend consumes product run_events, not raw workflow history.
```

### 验收

- app 重启后，waiting review / failed run 状态仍可恢复。
- review decision 能继续推进 workflow。
- 大 prompt/prose 不进入 workflow history 或 run event。

### 不做

- 不做完整 Temporal 平台化 UI。
- 不做 worker cluster 运维。
- 不做多租户调度。

---

## PR68：Long Project Dogfood / Release Candidate Lock

### 目标

停止新增功能，用一个真实 dogfood 项目验证长期使用。

### 大体做法

创建一个非 fixture dogfood 项目，至少包含：

```text
1 book
3 chapters
10 scenes
5 characters
3 locations
若干 lore/rules
multiple scene runs
multiple prose revisions
at least one branch experiment
at least one export
```

这一 PR 只修 P0/P1：

```text
数据丢失
无法继续写
trace 断裂
canon 被绕过
model config 不可用
project reopen 失败
export 不可读
```

### 验收

完整 dogfood script 必须通过：

```text
Create/open real project
-> configure model
-> write 3 chapters / 10 scenes through workflow
-> revise prose
-> use assets
-> branch experiment
-> export manuscript
-> backup
-> close/reopen
-> continue writing
```

### 不做

- 不做新大功能。
- 不做视觉大改。
- 不做 Spatial/Blender。
- 不做 plugin/extension。
- 不做 cloud/collaboration。

---

## Gate E：真实长期使用候选版

PR68 完成后，项目可以标成：

```text
Local-first Narrative IDE Release Candidate
```

而不是：

```text
fixture prototype
API contract demo
scene run demo
```

---

# 4. PR68 前总暂停清单

这些都不是永远不做，但在真实长期使用候选版之前不要做：

```text
Spatial Blackboard / Blender
visual scene generation
plugin / extension marketplace
full prompt manager
free-form scripting / recipes
cloud sync
multi-user collaboration
full auth system
mobile layout
graph-first asset UI
complex command palette
status bar polish beyond runtime essentials
full publishing pipeline
DOCX/PDF advanced layout
agent marketplace
custom schema builder
TTS/image generation
```

理由很简单：它们会继续移动终点。

---

# 5. PR68 之后才考虑的方向

PR68 之后可以开新阶段，但必须基于真实用户痛点选择，不要一次全开。

候选方向：

## Direction A：Publish / Export Pro

```text
DOCX / PDF / EPUB
front matter
chapter numbering
style profiles
export preview
export validation
```

## Direction B：Spatial / Visual Layer

```text
Spatial Blackboard
scene blocking
camera hint
Blender CLI / image prompt support
```

## Direction C：Automation Recipes

```text
safe domain commands
batch continuity check
batch missing draft generation
scheduled project QA
```

## Direction D：Plugin System

```text
typed extension points
model provider plugins
export profile plugins
asset importer plugins
```

## Direction E：Cloud / Collaboration

```text
account/auth
sync
shared comments
project sharing
team review
```

这些都必须等 Local-first 长期使用版站稳后再做。

---

# 6. 给 Codex 的固定执行协议

以后每个 PR，Codex 必须先回答：

```text
1. 这个 PR 属于哪个 Phase / Gate？
2. 它让真实长期使用前进了哪一步？
3. 它有没有引入新 horizon？
4. 它有没有继续依赖 fixture 当产品真相？
5. 它有没有绕过 proposal -> review -> canon -> prose？
6. 它有没有绕过 WorkbenchShell / Scope x Lens？
7. 它完成后用户能多做哪一件真实写作任务？
```

每个 PR 最后必须给出：

```text
What changed for the user
What changed in system truth
What remains intentionally out of scope
How to verify
Which gate this moves toward
```

---

# 7. 每个 PR 的最低测试/验收纪律

除非 PR 明确只改文档，否则默认至少跑：

```bash
pnpm typecheck
pnpm test
pnpm verify:prototype
```

涉及 desktop：

```bash
pnpm typecheck:desktop
pnpm test:desktop
```

涉及真实项目 store：

```text
create project
write data
restart app/API
read data
run migration test
backup/restore smoke test
```

涉及 model：

```text
fixture fallback test
invalid provider/key test
valid provider contract test using mocked provider
artifact provenance test
secret leakage test
```

涉及 prose/canon：

```text
proposal accepted -> canon patch
canon patch -> prose artifact
prose artifact -> scene read model
scene -> chapter assembly
chapter -> book assembly
trace links intact
```

---

# 8. 最终一句话

PR50 之前的工作把“可用原型链”做出来了。  
PR51 以后不要再证明“架构可以更完整”。  
接下来只证明一件事：

```text
一个作者能用它长期写完一个真实小说项目。
```

如果某个 PR 不让这句话更接近现实，就不要做。
