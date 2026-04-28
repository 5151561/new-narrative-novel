# PR69–PR72：API 设置与真实生成闭环救火计划

## 结论

PR68 现在不是“没有任何生成链路”，而是：

- 有 fixture API demo；
- 有 OpenAI provider 的后端代码；
- 有 run / review / canon patch / prose / trace 的原型链；
- 但没有用户可理解、可操作、可验证的真实模型配置入口；
- 默认 fallback 太温柔，导致真实生成失败时仍像“成功跑了 fixture”；
- 没有 first-run onboarding，用户不知道应该先配置模型、创建/打开项目，还是直接进 workbench；
- 所谓 release candidate lock 锁住的是 demo 路径，不是可长期使用路径。

所以用户体感是正确的：**这不是一个可用软件，只是一个很厚的工程原型。**

---

## 根因

### 1. 项目长期把“架构正确”排在“用户首次成功”前面

过去大量 PR 在补：

- workbench shell
- scope / lens
- artifact / trace
- fixture API
- review gate
- chapter / book assembly
- desktop shell
- branch / review / asset / observability

这些都不是废物，但它们没有强制回答一个最朴素问题：

> 用户打开软件后，在哪里填 API key？填完后，点哪里生成？生成失败怎么看见？

### 2. OpenAI 接入成了“隐藏能力”，不是产品能力

后端可以通过环境变量配置 provider / model / key / role binding，但这不是普通用户能发现的产品路径。

真正可用的软件必须有：

- Settings / Model Bindings 页面；
- API Key 保存；
- Test Connection；
- 当前 provider / model 显示；
- run 前阻断未配置状态；
- 失败时不自动伪装成 fixture 成功。

### 3. Fixture fallback 掩盖了真实失败

fixture fallback 对开发有价值，但对真实用户危险。

在真实项目 / real model mode 下：

- key 缺失不能 fallback 成 fixture；
- provider error 不能 fallback 成 fixture；
- invalid output 不能 fallback 成 fixture；
- 必须显示失败、保留 run、允许 retry。

否则用户永远分不清：

```text
我是在真实生成，还是在看假数据？
```

### 4. PR68 锁错了对象

PR68 应该锁“真实用户路径”，但实际更像锁“可验证 demo 路径”。

现在必须重排：

```text
先救真实可用路径，再谈继续扩展。
```

---

# 新路线

## PR69：Model Settings / API Key First-Run Gate

### 目标

让用户第一次打开软件时能完成：

```text
打开 Settings
-> 选择 provider
-> 填 API key
-> 选择 planner / prose / revision model
-> Test Connection
-> 保存
-> 顶栏显示 model configured
```

### 必做

#### 1. 新增 Settings 入口

位置：Workbench 顶栏或 Mode Rail 底部。

最低限度只做一个 modal / workbench opened context：

```text
Settings
  -> Models
```

不要做完整用户偏好系统。

#### 2. Model Bindings UI

字段：

```text
Provider: fixture | openai
OpenAI API Key
Planner model
Scene prose writer model
Scene revision model
Continuity reviewer model
Summary model
```

默认可以给推荐值，但必须允许用户改。

#### 3. Test Connection

至少测试：

```text
provider reachable
api key usable
selected model responds with tiny structured output
```

失败必须显示具体错误：

```text
missing key
invalid key
model not found
network error
schema parse failure
```

#### 4. 保存位置

Desktop：保存到桌面安全存储 / 本地配置，不进 git，不进 project state 明文。

Web dev：允许 `.env.local` / localStorage dev-only，但 UI 必须明确这是开发模式。

#### 5. Runtime badge 升级

顶栏不能只显示 API Healthy。

要显示：

```text
API Healthy
Model Fixture / Model OpenAI
Key Missing / Key Configured / Test Failed
```

### 不做

- 不做 Anthropic / Gemini；
- 不做团队账号；
- 不做云同步；
- 不做完整偏好系统；
- 不做 prompt marketplace。

### 验收

```text
无 key：Run Scene 按钮不可直接进入假成功，必须提示配置模型。
有 key 且 Test Connection 通过：Run Scene 可进入真实 provider。
key 错误：run failed，不 fallback fixture。
```

---

## PR70：Real Project First-Run / No Silent Fixture Fallback

### 目标

让用户能明确处在三种模式之一：

```text
Fixture Demo
Real Project + Fixture Model
Real Project + Real Model
```

### 必做

#### 1. First-run screen

启动后不要直接丢进复杂 workbench。

先给三个按钮：

```text
Open Demo Project
Create Real Project
Open Existing Project
```

#### 2. Real Project 模式禁止静默 mock

规则：

```text
real project mode 下，如果 API / model / project store 不可用，显示错误；不能自动回 mock runtime。
```

#### 3. Demo mode 明确标记

如果用户选择 demo，顶栏必须一直显示：

```text
Demo Fixture Project
```

### 验收

```text
用户能一眼知道自己是在 demo 还是 real project。
真实项目缺模型配置时不能假跑成功。
```

---

## PR71：Real Scene Generation Happy Path

### 目标

跑通一条真实生成路径：

```text
真实 OpenAI planner
-> proposal set
-> human review
->真实 OpenAI prose writer
-> prose draft
-> scene draft
-> chapter/book draft
-> trace
```

### 必做

#### 1. run provenance 前台化

Run timeline / artifact / trace 必须展示：

```text
provider: openai | fixture
modelId
fallbackReason? 必须可见
```

#### 2. 禁止真实模式 fallback fixture

在 real model mode：

```text
missing-config -> blocked before run
provider-error -> run failed
invalid-output -> run failed with raw artifact reference
```

Fixture fallback 只允许 demo mode。

#### 3. 真实生成 smoke test

测试可以 mock OpenAI client，但必须走真实 provider code path。

### 验收

```text
配置 OpenAI 后，点击 Run Scene，proposal/prose artifact provenance 显示 openai。
断网/错 key 时，run failed 且 UI 可 retry。
不会显示 fixture prose 假装成功。
```

---

## PR72：Usability Lock / One-Hour Dogfood

### 目标

做一个真正能自己用一小时的锁定版。

### 必做

#### 1. 新 dogfood script

文档必须从“开发者 demo”变成“真实用户流程”：

```text
安装
启动 desktop
创建项目
配置 OpenAI key
新建 book/chapter/scene
写 scene premise
Run Scene
Review
生成 prose
回到 chapter draft
保存
重启
继续
```

#### 2. P0 阻断清单

以下任一情况都不能通过：

```text
找不到 settings
不知道当前是 demo 还是 real
key 配错后仍假成功
生成失败后无 retry
prose 不落盘
重启后丢失
chapter/book 读不到已生成 scene prose
```

#### 3. 删除“release candidate”错觉

README 里必须明确：

```text
Fixture demo path
Real model dogfood path
Known limitations
```

---

# PR69 前禁止事项

在 API 设置和真实生成路径完成前，禁止继续做：

- 新 asset graph；
- 新 branch 体验；
- 新 review inbox；
- 新 Storybook polish；
- 新 command palette；
- 新 dashboard；
- 新 Blender / Spatial；
- 新 Temporal 平台化；
- 新 export 高级功能。

---

# 给 AI agent 的执行口径

从下一 PR 开始，指令第一行必须写：

```text
This PR must make the app closer to real first-run generation, not a better fixture demo.
```

每个 PR 验收必须回答：

```text
一个没有参与开发的人，能不能打开软件、配置 API、生成一段真实正文、保存并继续？
```

不能回答“能”，就不要再叫 release candidate。

