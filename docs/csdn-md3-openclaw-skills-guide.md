# OpenClaw 的 Skill 怎么安装和使用：从 ClawHub 到自己写一个最小技能

> 这篇文章适合已经把 OpenClaw 跑起来的人。
>
> 目标很明确：不是讲抽象概念，而是让你真正搞清楚 Skill 是什么、去哪里找、怎么装、怎么验证，以及怎么自己写一个最小可用 Skill。

---

## 一、先说人话：OpenClaw 里的 Skill 到底是什么

根据 OpenClaw 官方文档，**Skill 本质上就是一个目录，里面至少要有一个 `SKILL.md` 文件**。

这个 `SKILL.md` 里会写两类东西：

- 这个 Skill 叫什么、适合什么时候触发
- 触发之后，智能体应该怎么做

你可以把它理解成：

**Skill 不是模型本身，而是“教 OpenClaw 在某类任务里怎么更专业地做事”的一份操作手册。**

比如：

- 让它更会做天气查询
- 让它更会查 GitHub
- 让它更会做搜索
- 让它更会处理某一类固定工作流

---

## 二、Skill 和 Plugin 有什么区别

这是很多人第一次接触 OpenClaw 最容易搞混的点。

### 1. Skill

- 更偏“说明书”和“工作流”
- 核心是 `SKILL.md`
- 主要告诉智能体：什么时候该用、该怎么用

### 2. Plugin

- 更偏“代码扩展”
- 可以给 OpenClaw 增加新的工具、命令和能力
- 官方文档也明确提到：**插件本身也可以顺带发布自己的 Skills**

所以最简单的理解是：

**Plugin 更像“新增功能模块”，Skill 更像“教你怎么把已有功能用好”。**

如果你只是想让 OpenClaw 更擅长某类任务，先从 Skill 开始最合适。

---

## 三、先记住一个结论：普通用户优先从 ClawHub 装现成 Skill

OpenClaw 官方把 **ClawHub** 定义为公共 Skills 注册中心。

它适合你做这几件事：

- 找别人已经写好的 Skill
- 看这个 Skill 是干什么的
- 查看它的版本、文件和安全扫描信息
- 一键安装到自己的工作区

对大部分用户来说，最合理的路线是：

1. 先去 ClawHub 找现成 Skill
2. 先装一个跑通
3. 确认自己理解了 Skill 的目录结构
4. 再自己写最小 Skill

不要一上来就自己从零发明一整套复杂 Skill。

**先会用，再自己写。**

---

## 四、去哪里找 Skill

地址：

- `https://clawhub.ai/`

现在打开首页，你就能直接看到它在干什么，包括安装命令示例和 `Browse skills` 入口。

![ClawHub 首页，能直接看到安装命令和浏览技能入口](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/clawhub-home-install-command.png)

如果你点进 Skills 列表页，就能按下载量、名称、关键词去筛选你要的 Skill。

![ClawHub Skills 列表页，可以直接搜索和筛选技能](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/clawhub-skills-list.jpeg)

这一步我建议你别盲装，先看三件事：

- 这个 Skill 的简介是不是和你的需求匹配
- 它有没有运行依赖，比如二进制工具或环境变量
- 它的文件和安全扫描信息看起来是否正常

---

## 五、装现成 Skill，最推荐的流程是什么

根据最新官方文档，现在最标准的安装路线是：

- 用 `clawhub` CLI 搜索、安装、更新 Skill
- 用 `openclaw skills` 这组命令做检查、查看和验证

也就是说：

- `clawhub` 负责“找”和“装”
- `openclaw skills` 负责“看”和“查”

### 第零步：先装 `clawhub` CLI

选一个你顺手的：

```bash
npm i -g clawhub
```

或者：

```bash
pnpm add -g clawhub
```

如果你只是偶尔用，也可以直接：

```bash
npx clawhub@latest search "weather"
```

### 第一步：先找到你要装的 Skill slug

比如你在 ClawHub 看到了一个天气 Skill：

- `weather`

点进详情页后，你可以重点看：

- 功能简介
- 当前版本
- 安全扫描结果
- Runtime requirements
- `SKILL.md` 内容

![Skill 详情页可以看简介、安全扫描和运行依赖](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/clawhub-weather-skill-detail.jpeg)

### 第二步：安装 Skill

最推荐：

```bash
clawhub install weather
```

官方文档说明了两点：

- `clawhub install` 默认装到当前工作目录下的 `./skills`，或者回退到已配置的 OpenClaw 工作区
- OpenClaw 会在下一个新会话里把它当作 `<workspace>/skills` 来加载

如果你还没决定装什么，也可以先搜：

```bash
clawhub search "calendar"
```

所以对新手来说，装之前最好先确认：

**你当前所在的工作目录，就是你想让 OpenClaw 读取 Skill 的那个工作区。**

### 第三步：开一个新会话

这一步很重要，很多人会漏。

官方文档明确写了：

**安装完 Skill 之后，要开一个新的 OpenClaw 会话，它才会稳定识别到新 Skill。**

你可以这样做：

```text
/new
```

或者重启网关：

```bash
openclaw gateway restart
```

### 第四步：确认是否真的装成功

执行：

```bash
openclaw skills list
```

如果你能在列表里看到刚刚安装的 Skill，说明基本已经装进来了。

---

## 六、Skill 装到哪儿了，优先级怎么算

这点最好一次搞清楚，不然后面你会经常遇到“明明有这个 Skill，为什么不是我改过的版本在生效”。

官方文档给出的加载位置有三个：

1. 内置 Skills
2. `~/.openclaw/skills`
3. `<workspace>/skills`

优先级是：

`<workspace>/skills` 最高，`~/.openclaw/skills` 其次，内置 Skills 最低。

这意味着什么？

- 你在当前工作区自己放一个同名 Skill，可以覆盖全局的
- 你在 `~/.openclaw/skills` 里放的 Skill，可以给同机多个智能体共用
- 如果同名冲突，工作区版本优先

对普通用户来说，你可以先这么记：

- **只想这个项目用**：放进当前工作区的 `skills/`
- **想多套 OpenClaw 共用**：放进 `~/.openclaw/skills`

---

## 七、自己写一个最小可用 Skill，其实没有你想的那么复杂

如果你只是想试试自己的 Skill，完全没必要一上来就写很复杂。

官方文档给了一个最小示例，我这里直接按官方思路来写。

### 第一步：先建目录

你可以在自己的工作区里建：

```bash
mkdir -p ~/.openclaw/workspace/skills/hello-world
```

如果你当前就在某个 OpenClaw 工作区里，也可以直接建：

```bash
mkdir -p ./skills/hello-world
```

### 第二步：写一个最小 `SKILL.md`

在这个目录里新建 `SKILL.md`：

```md
---
name: hello_world
description: A simple skill that says hello.
---

# Hello World Skill

When the user asks for a greeting, use the `echo` tool to say "Hello from your custom skill!".
```

这里最关键的是前面三行：

- `name`
- `description`
- 正确的 frontmatter 格式

官方文档要求至少有这两个字段。

### 第三步：重新载入

最稳妥的方式还是新开会话：

```text
/new
```

或者：

```bash
openclaw gateway restart
```

### 第四步：检查它有没有被识别

```bash
openclaw skills list
```

### 第五步：测试触发

官方文档示例是：

```bash
openclaw agent --message "give me a greeting"
```

你也可以直接在聊天里说一句类似：

- 你好，打个招呼
- 给我一个 greeting

如果你的 `description` 和正文写得足够清楚，OpenClaw 就有机会正确触发它。

---

## 八、写 Skill 时，哪些地方最容易翻车

### 1. `description` 写得太废话

很多人会把 `description` 写成很空的话，比如：

- 一个很好用的 Skill
- 用来帮助用户完成任务

这种写法几乎没价值。

因为对 OpenClaw 来说，`description` 是判断“什么时候该用这个 Skill”的关键线索。

你应该写清楚：

- 这个 Skill 是干什么的
- 哪些场景下应该触发

### 2. 装完 Skill，不开新会话

这是最常见的坑之一。

根据官方文档，Skill 会在会话开始时做快照复用。

也就是说：

- 你刚装完
- 你刚改完 `SKILL.md`
- 但你还在旧会话里继续聊

那很可能你看到的还是旧状态。

虽然官方也提到默认有 Skills watcher，会监听 `SKILL.md` 变化并自动刷新快照，但我依旧建议你对新手用户直接按最稳的方式来：

**改完 Skill，就新开会话。**

### 3. 只看名字，不看运行依赖

有些 Skill 不是单靠一份 `SKILL.md` 就能跑。

它可能依赖：

- 某个本地二进制
- 某个环境变量
- 某段配置项

官方文档里专门有 `metadata.openclaw.requires.bins`、`requires.env`、`requires.config` 这种门控机制。

所以你在 ClawHub 看到一个 Skill 很酷，不代表它装完就一定能直接用。

先看依赖，再安装。

### 4. 把第三方 Skill 当绝对安全

官方文档明确提醒：

**第三方 Skill 要按不受信任代码来对待。**

我建议你至少做三件事：

- 先看 Skill 详情页里的安全扫描
- 先看 `SKILL.md` 和文件列表
- 涉及敏感环境时优先用沙箱

### 5. 装太多没用的 Skill

这个也容易被忽略。

官方文档提到，OpenClaw 会把可用 Skill 的紧凑列表注入到系统提示里，这本身会增加上下文开销。

简单说就是：

**Skill 不是越多越好。**

留真正常用的，删除不用的，反而更干净。

---

## 九、普通用户最推荐的 Skill 使用路线

如果你问我，最合理的路线是什么，我会建议你按这个顺序：

1. 先去 ClawHub 找一个最简单的现成 Skill
2. 先用 `clawhub install` 装进去
3. 先用 `openclaw skills list` 确认它被识别
4. 先新开会话测试是否触发
5. 再照着最小模板自己写一个 `hello-world`
6. 最后再考虑做更复杂的工作流 Skill

这样走，基本不会乱。

---

## 十、如果你只是想快速拥有一个已经配好的 OpenClaw

看到这里你应该已经发现了，真正麻烦的并不是“建一个 `SKILL.md` 文件”。

真正麻烦的是：

- OpenClaw 本体怎么装
- 渠道怎么接
- Skill 怎么筛选
- 哪些 Skill 安全
- 哪些 Skill 还依赖额外环境
- 后面怎么维护和更新

如果你只是想：

- 快速开始用
- 少折腾安装和运维
- 直接拿到自己的云端 OpenClaw 助手

也可以直接看我这边的云端入口：

- 购买地址：`https://opensale.chunlin.lat/`

如果你想要教程，或者想让我继续把后面的系列也整理成可直接发 CSDN 的 Markdown，也可以直接联系我：

- 邮箱：`17671460675@163.com`
- 微信：`17671460675`

---

## 十一、下一篇写什么

如果你觉得这篇有用，后面我会继续按这个路线往下写：

- OpenClaw 的高阶玩法之多 agent 团队搭建协作
- OpenClaw 的高阶玩法之 Mission Control 多任务 UI 工作流管理
- OpenClaw 的高阶玩法之 agent 创建 AI，实现自我进化

---

## 参考资料

- OpenClaw Skills 官方文档：<https://docs.openclaw.ai/zh-CN/tools/skills>
- OpenClaw ClawHub 官方文档：<https://docs.openclaw.ai/zh-CN/tools/clawhub>
- OpenClaw Creating Skills 官方文档：<https://docs.openclaw.ai/tools/creating-skills>
- ClawHub：<https://clawhub.ai/>
