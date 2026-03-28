# OpenClaw 第二篇最短落地：在 `ops-agent` 基础上补 `research-agent`、`coding-agent`、`qa-agent`

> 这篇继续沿用上一篇已经配好的结果。
>
> 默认你已经做完：
>
> - `Telegram -> ops-agent`
> - `ops-agent <- telegram`
> - `channels status --probe` 里 Telegram 返回 `works`
>
> 这篇只做一件事：
>
> **把 `ops-agent` 再补成一个能调 3 个内部 worker 的最小编排底座。**

---

## 一、先说这篇做完后你会得到什么

做完以后，你的生产容器里会多出这 3 个内部 agent：

- `research-agent`
- `coding-agent`
- `qa-agent`

同时还会完成这 3 件事：

1. `ops-agent` 被明确允许调这 3 个 worker
2. 这 3 个 worker 都有各自独立的 `IDENTITY.md`
3. `openclaw agents list` 能看到完整拓扑

这篇**不保证你最后一定能真实跑通一次多 agent 对话**。

因为我这次在生产环境回归时，真正卡住的不是 agent 配置，而是模型提供方认证报了：

```text
HTTP 401: Invalid API key
```

也就是说：

- **多 agent 拓扑已经真实配好了**
- **但 provider 鉴权还没通，所以最终真实调用会卡在模型层**

这点我后面会单独写排障。

---

## 二、这篇的前提

我这次实际回归的环境是：

- OpenClaw 版本：`2026.3.2`
- 运行方式：Docker 容器
- 容器名：`openclaw-ORD17742461621975243`
- 上一篇已经完成：`Telegram -> ops-agent`

如果你的容器名不同，后面命令里的容器名换成你自己的即可。

---

## 三、Step 0：先备份这次要改的配置

先在宿主机进入容器：

```bash
docker exec -it openclaw-ORD17742461621975243 sh
```

然后先备份：

```bash
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.before-internal-workers-20260328.bak
ls -lh ~/.openclaw/openclaw.json.before-internal-workers-20260328.bak
```

这一步不要省。

因为这篇会继续往 `agents.list` 和 `subagents` 里加东西，备份好以后你随时能回滚。

---

## 四、Step 1：先加 `research-agent`

直接执行：

```bash
openclaw agents add "Research Agent" \
  --workspace ~/.openclaw/workspace-research \
  --agent-dir ~/.openclaw/agents/research-agent/agent \
  --model kiro-proxy/claude-haiku-4-5 \
  --non-interactive \
  --json
```

你要看到的关键结果是：

- `agentId` 变成 `research-agent`
- 命令执行成功，没有报配置错误

![先把 research-agent 加进去，这是后面拆调研任务的基础](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/oc-step-11-add-research-agent.png)

---

## 五、Step 2：继续补 `coding-agent` 和 `qa-agent`

继续执行：

```bash
openclaw agents add "Coding Agent" \
  --workspace ~/.openclaw/workspace-coding \
  --agent-dir ~/.openclaw/agents/coding-agent/agent \
  --model kiro-proxy/claude-haiku-4-5 \
  --non-interactive \
  --json

openclaw agents add "QA Agent" \
  --workspace ~/.openclaw/workspace-qa \
  --agent-dir ~/.openclaw/agents/qa-agent/agent \
  --model kiro-proxy/claude-haiku-4-5 \
  --non-interactive \
  --json
```

执行完以后，你的内部 worker 就齐了。

![把 coding-agent 和 qa-agent 一次补齐，内部 3 个 worker 才完整](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/oc-step-12-add-coding-qa-agents.png)

---

## 六、Step 3：明确允许 `ops-agent` 只能调这 3 个 worker

这一条是关键。

如果你只创建 worker，不给 `ops-agent` 写 allowlist，那主 agent 并不知道它可以调谁。

直接执行：

```bash
openclaw config set 'agents.list[1].subagents.allowAgents' '["research-agent","coding-agent","qa-agent"]'
openclaw config get 'agents.list[1].subagents.allowAgents'
```

正常情况下，你会看到返回：

```json
[
  "research-agent",
  "coding-agent",
  "qa-agent"
]
```

![把 ops-agent 的 allowAgents 写死成 3 个 worker，避免它乱调别的 agent](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/oc-step-13-set-allow-agents.png)

如果你返回的不是这 3 个名字，就先不要继续往后走。

---

## 七、Step 4：给 3 个 worker 写各自的 `IDENTITY.md`

这一条也别省。

如果你不写身份说明，这 3 个 worker 虽然存在，但它们的职责边界会很模糊。

直接写：

```bash
cat > ~/.openclaw/workspace-research/IDENTITY.md <<'EOF'
# 🔎 Research Agent

You are the research worker.
Your job is to gather facts, inspect docs, summarize findings, and return concise research notes.
Do not write production code unless explicitly asked.
EOF

cat > ~/.openclaw/workspace-coding/IDENTITY.md <<'EOF'
# 🛠️ Coding Agent

You are the coding worker.
Your job is to implement changes, edit files, and return concise implementation notes.
Do not spend your time on broad research unless explicitly asked.
EOF

cat > ~/.openclaw/workspace-qa/IDENTITY.md <<'EOF'
# ✅ QA Agent

You are the QA worker.
Your job is to review risks, design checks, validate outputs, and return concise QA notes.
Do not own the implementation unless explicitly asked.
EOF
```

![给 3 个 worker 分别写 IDENTITY.md，不然后面职责会混掉](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/oc-step-14-write-worker-identities.png)

这一步写完后，文件虽然已经在磁盘里了，但还没同步进 agent 配置。

---

## 八、Step 5：把 `IDENTITY.md` 同步进 3 个 worker

继续执行：

```bash
openclaw agents set-identity --agent research-agent --from-identity --workspace ~/.openclaw/workspace-research --json
openclaw agents set-identity --agent coding-agent --from-identity --workspace ~/.openclaw/workspace-coding --json
openclaw agents set-identity --agent qa-agent --from-identity --workspace ~/.openclaw/workspace-qa --json
```

如果这 3 条都成功，说明 worker 的身份描述已经真正写进 OpenClaw 配置。

![用 set-identity 把 3 个 worker 的身份同步进去，这一步之后 agents list 才会显示正确身份](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/oc-step-15-sync-worker-identities.png)

---

## 九、Step 6：重启容器，然后做最终回归

先在宿主机重启容器：

```bash
docker restart openclaw-ORD17742461621975243
```

然后重新进入容器，执行最终检查：

```bash
openclaw config validate
openclaw agents list
openclaw agents bindings
openclaw channels status --probe --timeout 15000
openclaw config get 'agents.list[1].subagents.allowAgents'
```

这一步你要重点确认 5 件事：

1. `Config valid`
2. `agents list` 里已经有：
   - `main`
   - `ops-agent`
   - `research-agent`
   - `coding-agent`
   - `qa-agent`
3. `ops-agent <- telegram` 还在
4. Telegram 仍然返回 `works`
5. `allowAgents` 里仍然是那 3 个 worker

![最后做一轮完整回归，确认拓扑、绑定、身份、allowlist 都还在](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/oc-step-16-final-topology-regression.png)

如果你这一步和图里结果一致，那就说明：

**第二篇该做的配置，已经真实落地成功了。**

---

## 十、到这一步你的拓扑到底长什么样

现在你的结构不是：

- 一个 Telegram 主 bot，再额外生成 3 个 Telegram 子 bot

也不是：

- 用飞书 bot 和 Discord bot 作为 Telegram 的子机器人

而是这套更简单、也更稳的结构：

```text
Telegram
  -> ops-agent
      -> research-agent
      -> coding-agent
      -> qa-agent
```

也就是说：

- **外部入口只有一个 Telegram**
- **内部 worker 不是额外的 Telegram 机器人**
- **它们只是 OpenClaw 容器内部可被调用的 agent**

这一点你一定要分清楚。

不然你会误以为还要去 Telegram 再创建 3 个 bot，其实不用。

---

## 十一、Step 7：真实多 agent 测试时，如果报 `HTTP 401: Invalid API key`

这一条是我这次真实回归时实际遇到的卡点。

我测试的是这条命令：

```bash
openclaw agent --agent ops-agent --message 'Use your available subagents. Ask each worker to return one line describing its role, then summarize the three roles in Chinese. Keep the final answer short.' --json --timeout 180
```

结果不是拓扑错误，也不是 `allowAgents` 错误，而是直接报：

```text
HTTP 401: Invalid API key
```

![真实多 agent 调用时卡在 provider 401，这不是拓扑问题，而是模型鉴权问题](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/oc-step-17-provider-401-troubleshooting.png)

这说明：

- agent 已经建好了
- Telegram 入口也还在
- worker 也已经挂上去了
- 但是模型提供方没通过认证，所以真正执行不下去

换句话说：

**这篇教程已经把多 agent 的“配置层”配通了，但你的“模型调用层”还得单独修。**

---

## 十二、你现在最少要检查哪几项

如果你现在也遇到 `401`，先查这几项：

1. `openclaw.json` 里当前 provider 的 `baseUrl`
2. `openclaw.json` 里当前 provider 的 `apiKey`
3. 你的代理服务本身认不认这个 key
4. 代理服务有没有换过 `REQUIRED_API_KEY`
5. 直接 `curl /v1/models` 会不会也报 `Invalid API key`

只要 `curl /v1/models` 都还是 `401`，那你就别继续怀疑多 agent 配置了。

因为问题根本不在 agent。

---

## 十三、这篇做完以后，你就算完成第二篇了

你现在的验收标准很简单，只看 6 条：

1. `research-agent` 已创建
2. `coding-agent` 已创建
3. `qa-agent` 已创建
4. `ops-agent` 的 `allowAgents` 正确
5. 3 个 worker 的身份已同步
6. Telegram 入口回归后仍然 `works`

满足这 6 条，就说明你的第二篇已经配成功了。

至于最后真实跑一次多 agent 对话，那是下一步去修 provider 鉴权，不是这篇配置文档本身失败。

---

## 十四、下一篇该写什么

这篇之后，最合理的下一篇不是继续空讲概念，而是二选一：

1. 直接继续写“怎么修 provider 401，让多 agent 真正跑起来”
2. 再写“Mission Control 里怎么观察这套多 agent 的任务流”

如果你要我继续按这个标准写，我建议先补第 1 个。

---

## 参考资料

- OpenClaw 多智能体官方文档：<https://docs.openclaw.ai/concepts/multi-agent>
- OpenClaw 子智能体官方文档：<https://docs.openclaw.ai/tools/subagents>
- OpenClaw Session Tool 官方文档：<https://docs.openclaw.ai/zh-CN/concepts/session-tool>
