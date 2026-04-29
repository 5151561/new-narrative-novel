# 2026-04-29 Real Frontend Storybook Parity Checklist

## 目的

这份清单用于把前端验收从“Storybook 已同步”提升为“Storybook 与真实软件对同一 surface family 的结论都明确记录”。

它是一个 repo-local 的 parity gate 模板：

- 先定义本次改动影响哪些 `surface family`
- 再为每个 family 成对记录 `Storybook Sync Gate` 与 `Real Software Acceptance Gate`
- 最后给出该 family 的 parity verdict，而不是只给一个笼统的前端通过/失败

这份文档不引入新的大自动化框架，也不替代现有测试。它只要求未来的前端交付不能再用 Storybook-only 证据代替真实软件结论。

---

## 使用规则

1. 先读 `doc/frontend-workbench-constitution.md`。
2. 再读 `doc/frontend-delivery-acceptance-flow.md`。
3. 列出本次改动影响的 `surface family`。
4. 每个 `surface family` 必须同时填写：
   - Storybook story
   - 真实入口与 route
   - 成对检查项
   - 结构化快照
   - 截图
   - 结果
5. 任一 family 缺少真实软件证据时，默认该 family 不算验收通过。

---

## Surface Family 定义

推荐按用户实际感知的工作面分组，而不是按组件文件分组。

优先使用这类命名：

- `Workbench shell / layout`
- `Scene workspace / structure`
- `Scene workspace / orchestrate`
- `Scene workspace / draft`
- `Chapter workspace / structure`
- `Book workspace / structure`
- `Book workspace / draft`
- `Asset workspace / knowledge`

如果改动只影响支持面，也仍要挂到具体 family 上，例如：

- `Scene workspace / orchestrate + bottom dock`
- `Book workspace / draft + inspector`

---

## Story Pairing Matrix

先填写这张矩阵，明确 Storybook 与真实软件要检查的是同一个 family。

| Surface family | Storybook story id / name | Real entry path | Real route / launch path | Required parity checks |
| --- | --- | --- | --- | --- |
| `...` | `...` | `desktop-local` / `web/api` / `fixture demo` | `...` | `shell/layout, selection, main-stage task, inspector/dock support role, visible copy, error/empty behavior` |
| `...` | `...` | `...` | `...` | `...` |

填写要求：

- `Storybook story id / name` 必须可定位到具体 story。
- `Real route / launch path` 必须是可复现入口，不能写成“打开应用后看一下”。
- `Required parity checks` 只写和本次改动直接相关的检查项，不要抄整份清单。

---

## Per-Family Gate Template

对每一个 `surface family`，完整填写下面模板一次。

```md
## Surface Family: <name>

### Storybook Sync Gate
- Story: `<story id / story name>`
- Command: `<exact command>`
- Structured snapshot: `<where / how captured>`
- Screenshot: `<where / how captured>`
- Checked states:
  - `...`
  - `...`
- Result: `pass / fail / blocked`
- Notes: `...`

### Real Software Acceptance Gate
- Entry path: `desktop-local / web/api / fixture demo`
- Route / launch path: `<exact route or launch steps>`
- Command: `<exact command>`
- Runtime mode / project context: `<mode, project id/path, launcher state if relevant>`
- Structured snapshot: `<where / how captured>`
- Screenshot: `<where / how captured>`
- Checked states:
  - `...`
  - `...`
- Result: `pass / fail / blocked`
- Notes: `...`

### Parity Verdict
- Alignment: `aligned / drifted / blocked`
- Same family confirmed: `yes / no`
- Mismatch summary: `...`
- Follow-up needed: `none / narrow follow-up`
```

---

## Required Real-Software Checks By Family

不是每次都要全做，但至少覆盖与你本次改动直接相关的项。

### `Workbench shell / layout`

- 浏览器页面本身是否出现不该有的整页滚动
- main stage、navigator、inspector、bottom dock 是否各自内部滚动
- layout restore / reset / pane visibility 是否保持 WorkbenchShell owning layout
- dock 是否仍然是支持面，而不是挤掉主舞台

### `Scene workspace / structure | orchestrate | draft`

- route、lens、selected object 是否正确
- main stage 是否仍然只承载一个一级任务
- scene header / command bar / tab 状态是否与真实 route 一致
- prose / review / execution 的支持面是否落在 inspector 或 bottom dock，而不是抢主任务

### `Book / Chapter / Asset workspace`

- 真实 runtime 能否打开用户可见对象，而不是只在 story fixture 里成立
- navigator 点击后的 real route 是否可达
- unavailable / empty / error 是否与真实 runtime 行为一致
- supporting surfaces 是否仍然只是支持判断，不是额外页面壳子

---

## Failure Rules

出现以下任一情况时，不得写“前端验收通过”：

- 只记录了 Storybook，没有对应真实软件 family 记录
- 真实软件结论是 `blocked / fail`，却给 overall pass
- Storybook 检查的是 shell story，真实软件却只验证了另一个 route
- 只有截图，没有结构化快照
- 只跑测试或 `pnpm verify:prototype`，没有真实软件 gate

---

## Example Pairing Seeds

以下示例仅用于说明怎样配对，不是固定必测列表。

| Surface family | Storybook story id / name | Real entry path | Real route / launch path |
| --- | --- | --- | --- |
| `Workbench shell / layout` | `WorkbenchShell` 相关 shell/layout story | `web/api` | `/?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution&proposalId=proposal-midnight-platform-001` |
| `Scene workspace / orchestrate` | `SceneWorkspace` 或对应 orchestrate story | `web/api` | `/?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution` |
| `Scene workspace / draft` | `SceneProseContainer` 或对应 draft story | `web/api` | `/?scope=scene&id=scene-midnight-platform&lens=draft&tab=prose` |
| `Book workspace / structure` | `BookStructureWorkspace` 相关 story | `web/api` | `/?scope=book&id=book-signal-arc&lens=structure&view=sequence` |

如果要引用实际失败例子，可参考：

- `doc/review/2026-04-25-real-frontend-interaction-smoke.md`
- `doc/review/2026-04-26-workbench-layout-comment-summary.md`

---

## Final Output Skeleton

未来的前端验收报告至少应包含：

1. `Surface Family Matrix`
2. 每个 family 的 `Storybook Sync Gate`
3. 每个 family 的 `Real Software Acceptance Gate`
4. 每个 family 的 `Parity Verdict`
5. `Overall Verdict`

只要 `Parity Verdict` 仍是 `drifted` 或 `blocked`，就不能把 Storybook 通过当作真实软件通过。
