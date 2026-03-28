# OpenClaw 最短落地教程：用生产容器从 0 到 1 配出 `Telegram -> ops-agent`

> 这篇不是概念文。
>
> 这篇只做一件事：把已经跑起来的 OpenClaw 生产容器，配置成 **Telegram 消息进入 `ops-agent`**。
>
> 整个过程我已经在自己的真实生产容器里跑过一遍，并做了回归检查。

---

## 一、先说最关键的结论

如果你现在打开的是：

```text
http://你的IP:19000/agents
```

然后看到：

- 没有 `Create agent` 按钮
- 页面上有 `origin not allowed`

那是正常的。

**这版 OpenClaw 2026.3.2，不要指望在 Control UI 里点按钮创建 agent。**

最稳的方式是：

1. 进容器
2. 用 `openclaw agents add`
3. 用 `openclaw agents bind`
4. 用 `openclaw config set`
5. 最后再回 UI 验收

也就是说：

**先配 CLI，再看 UI。**

---

## 二、这篇做完以后，你会得到什么

做完后，你至少能确认下面这 4 件事：

1. 容器里已经多了一个 `ops-agent`
2. Telegram 已经明确绑定到 `ops-agent`
3. 子 agent 的基础并发参数已经写进配置
4. `channels status --probe` 返回 `works`

这篇先不讲：

- 飞书
- Discord
- 多个外部 bot
- 复杂编排提示词

先把最短路径跑通。

---

## 三、环境前提

我这次实际回归的环境是：

- OpenClaw 版本：`2026.3.2`
- 运行方式：Docker 容器
- 容器名：`openclaw-ORD17742461621975243`
- Telegram 渠道已经提前接好 bot token

如果你的容器名不一样，后面命令里的容器名替换成你自己的就行。

---

## 四、Step 0：先备份配置

先备份，别直接裸改。

进入容器后执行：

```bash
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.before-ops-agent.bak
ls -lh ~/.openclaw/openclaw.json*
```

![先备份当前 openclaw.json，避免改坏之后没法回滚](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/oc-step-00-backup-config.png)

如果你后面配坏了，直接把备份文件拷回去再重启容器就行。

---

## 五、Step 1：先找到你的 OpenClaw 容器名

先在宿主机执行：

```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"
```

![先找到正确的 OpenClaw 容器名，后面所有命令都要用到它](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/oc-step-01-find-container.png)

然后进入容器：

```bash
docker exec -it openclaw-ORD17742461621975243 sh
```

---

## 六、Step 2：先确认当前是不是“只有 main，没有绑定”

在容器里执行：

```bash
openclaw agents list
openclaw agents bindings
```

如果你现在还是最原始状态，通常会看到：

- 只有一个 `main`
- `No routing bindings`

我这次配置前的实际状态就是这样。

![配置前先确认当前状态，避免你以为自己已经有路由了](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/oc-step-02-before-state.png)

只要你确认这里还是空的，就继续下一步。

---

## 七、Step 3：创建 `ops-agent`，并把 Telegram 绑给它

这一条是最核心的一步。

直接执行：

```bash
openclaw agents add "Ops Agent" \
  --workspace ~/.openclaw/workspace-main \
  --agent-dir ~/.openclaw/agents/ops-agent/agent \
  --model kiro-proxy/claude-haiku-4-5 \
  --bind telegram \
  --non-interactive \
  --json
```

成功以后，你会看到：

- `agentId` 被规范成 `ops-agent`
- `bindings.added` 里出现 `telegram`

![创建 ops-agent 并绑定 Telegram，这一步跑成功就已经完成一半了](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/oc-step-03-add-ops-agent.png)

如果你这里报错，就不要往后走，先解决这里。

---

## 八、Step 4：把子 agent 的基础限制补进去

虽然这篇先不展开讲复杂编排，但最起码的子 agent 限制你可以先配好。

直接执行：

```bash
openclaw config set agents.defaults.subagents.maxConcurrent 2
openclaw config set agents.defaults.subagents.maxSpawnDepth 2
openclaw config set agents.defaults.subagents.maxChildrenPerAgent 4
```

![把子 agent 的基础并发和层级参数先写好，后面继续扩展就不用返工](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/oc-step-04-set-subagents.png)

你先把这 3 个数字记住就行：

- `maxConcurrent = 2`
- `maxSpawnDepth = 2`
- `maxChildrenPerAgent = 4`

这是很适合第一版落地的保守值。

---

## 九、Step 5：重启容器

虽然这次我的生产容器日志里显示配置已经被动态读到了，但为了避免“你这边没生效、我这边生效”这种扯皮，最简单的方法就是直接重启一次容器。

在宿主机执行：

```bash
docker restart openclaw-ORD17742461621975243
```

![重启一次容器，避免你纠结到底是热加载还是没生效](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/oc-step-05-restart-container.png)

重启完等几秒，再继续下一步。

---

## 十、Step 6：做回归检查

这一步不要省。

继续在容器里执行：

```bash
openclaw config validate
openclaw agents list
openclaw agents bindings
openclaw channels status --probe --timeout 15000
```

我这次真实跑出来的结果是：

- `Config valid`
- `ops-agent` 已经存在
- `Routing bindings` 里已经有 `ops-agent <- telegram`
- `Telegram default` 返回 `works`

![最后用 validate、agents、bindings、channels status 做一轮完整回归](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/oc-step-06-regression-checks.png)

只要你这里也看到 `works`，那这篇教程的目标就已经达成了。

---

## 十一、这时候你到底算成功了没有

如果你满足下面 4 条，就算成功：

1. `openclaw config validate` 返回 `Config valid`
2. `openclaw agents list` 里有 `ops-agent`
3. `openclaw agents bindings` 里有 `ops-agent <- telegram`
4. `openclaw channels status --probe` 里 Telegram 返回 `works`

说白了：

**到了这一步，你的 Telegram 入口已经不再是系统默认乱接，而是明确路由到了 `ops-agent`。**

---

## 十二、如果你打开 UI 还是看到 `0 configured`

这不是一定没配成功。

更大的可能是：

- 你是公网 `http` 直接打开
- `gateway.controlUi.allowedOrigins` 没放行你的来源
- 页面虽然能打开，但没拿到完整数据

所以这里一定要分清楚：

- **配置是否成功**：看 CLI 输出
- **UI 是否显示正常**：看你的访问方式和 origin 配置

这篇教程的判断标准，以 CLI 回归结果为准，不以公网 UI 页面显示为准。

---

## 十三、一个非常容易踩的 Telegram 坑

你现在的渠道如果还带这个警告：

```text
channels.telegram.groupPolicy is "allowlist" but groupAllowFrom is empty
```

那意思是：

**Telegram 群消息会被静默丢掉。**

但这不影响你做私聊版最短教程。

也就是说：

- 如果你先做 Telegram 私聊，当前配置可以继续用
- 如果你后面要做群聊，再单独处理 `groupPolicy` 和 `groupAllowFrom`

这一步不要混在今天这篇里一起做，不然教程又会变复杂。

---

## 十四、这篇教程我实际做过的回归结果

这次我不是凭空写命令，而是在真实生产容器里做了下面这些动作：

1. 先备份原配置
2. 新增 `ops-agent`
3. 把 Telegram 显式绑定到 `ops-agent`
4. 写入子 agent 默认限制
5. 重启容器
6. 跑 `config validate`
7. 跑 `agents list`
8. 跑 `agents bindings`
9. 跑 `channels status --probe`

最终结果是通过的。

所以你如果照着这篇做，至少能把：

**生产容器 + Telegram + ops-agent**

这条链稳定配出来。

---

## 十五、下一步该做什么

你把这条最短链跑通以后，下一步才值得继续做：

1. 给 `ops-agent` 增加编排提示
2. 再拆内部 worker agent
3. 再继续做真正的多 agent 团队协作

不要一开始就想同时配：

- Telegram
- 飞书
- Discord
- 多个外部 bot
- 多层编排

那样最容易乱。

这篇的目标只有一个：

**先让 `Telegram -> ops-agent` 成功。**
