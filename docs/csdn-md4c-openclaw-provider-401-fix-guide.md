# OpenClaw 第三篇最短排障：修 `provider 401`，让多 agent 真正能跑

> 这篇接着上一篇继续。
>
> 默认你已经做完：
>
> - `Telegram -> ops-agent`
> - `research-agent`、`coding-agent`、`qa-agent` 已创建
> - `ops-agent` 的 `allowAgents` 已经配好
>
> 但你现在一跑真实任务，就会报：
>
> ```text
> HTTP 401: Invalid API key
> ```
>
> 这篇只做一件事：
>
> **把这个 401 的根因查清楚，并给你一条最短修法。**

---

## 一、先说结论，不绕弯

这次我在同一套生产环境里实际查到的根因是：

**不是 OpenClaw 的多 agent 配置错了。**

真正的问题在 provider 认证层：

1. OpenClaw 当前用的是一个 `ak_` 前缀的 key
2. 3000 端口这个 AIClient 代理启用了 `token-manager`
3. 只要请求 key 以 `ak_` 开头，就会先走 token 校验插件
4. 这把 `ak_` key 在 3200 token 服务里校验失败
5. 所以请求根本还没到模型调用那一层，就已经被 401 拦下来了

说白了：

**你现在卡的不是 agent 编排，是 OpenClaw 连代理这一步的认证方式。**

---

## 二、这篇做完后，你应该得到什么

理想结果是这 3 件事：

1. `http://你的IP:3000/v1/models` 不再返回 `401`
2. OpenClaw 调 provider 时不再报 `HTTP 401: Invalid API key`
3. `ops-agent` 能真正去调内部 worker

这篇我分成两部分写：

- 前半部分：已经真实查实的根因
- 后半部分：最小修法和回归步骤

这样你照着排，不会跑偏。

---

## 三、Step 0：先确认你遇到的是不是同一个 401

先在 OpenClaw 容器里跑一次你之前失败的测试：

```bash
openclaw agent --agent ops-agent --message 'Use your available subagents. Ask each worker to return one line describing its role, then summarize the three roles in Chinese. Keep the final answer short.' --json --timeout 180
```

如果你看到的核心报错是：

```text
HTTP 401: Invalid API key
```

那就继续往下走。

如果你报的是别的错误，比如：

- `No healthy provider found in pool`
- `connection refused`
- `timeout`

那就不是这篇的范围。

---

## 四、Step 1：先看 OpenClaw 当前到底把请求打到哪儿了

在 OpenClaw 容器里执行：

```bash
openclaw config get models.providers
```

你要重点看两项：

1. `baseUrl`
2. `apiKey`

我这次实际查到的是：

- `baseUrl = http://45.136.14.88:3000/v1`
- `apiKey` 是一个 `ak_` 前缀的 key

这一步只是确认：

**OpenClaw 现在确实是在打 3000 这个 AIClient 代理。**

![先确认 OpenClaw 目前的 provider 指向哪里，以及它现在到底在用什么 key](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/oc-step-21-provider-auth-root-cause.png)

---

## 五、Step 2：再看 3000 代理这一层启用了什么认证插件

继续在代理机上看两个文件：

### 1. AIClient 主配置

```bash
sed -n '1,80p' /root/AIClient-2-API/configs/config.json
```

你要看：

- `REQUIRED_API_KEY`

### 2. 插件配置

```bash
cat /root/AIClient-2-API/configs/plugins.json
```

你要看：

- `token-manager.enabled`
- `default-auth.enabled`

我这次实际查到的是：

- `token-manager = true`
- `default-auth = true`

而且 OpenClaw 当前用的 key 和 `REQUIRED_API_KEY` 不是一回事。

这时候很多人会以为“那我把 `REQUIRED_API_KEY` 改成一样的不就行了吗？”

先别急。

因为只要这个 key 还是 `ak_` 前缀，它就会先被 `token-manager` 抢过去校验。

---

## 六、Step 3：直接验证 3200 token 服务认不认这把 `ak_` key

这一条是分水岭。

直接在代理机执行：

```bash
curl -H "Content-Type: application/json" \
  -X POST http://127.0.0.1:3200/api/tokens/validate \
  -d '{"api_key":"这里换成你当前 OpenClaw 用的 ak_ key","estimated_tokens":1}'
```

如果返回类似：

```json
{
  "valid": false,
  "error": "Invalid API key",
  "code": "INVALID_API_KEY",
  "reason": "API key not found or user inactive"
}
```

那根因就已经坐实了：

**不是 OpenClaw 配错了，而是这把 `ak_` key 在 token 系统里根本无效。**

然后你再测一次 3000：

```bash
curl -H "Authorization: Bearer 这里换成同一把 ak_ key" \
  http://127.0.0.1:3000/v1/models
```

如果它也返回：

```text
HTTP/1.1 401 Unauthorized
{"error":{"message":"Invalid API key","code":"INVALID_API_KEY"}}
```

那就说明链路非常清楚了：

`OpenClaw -> 3000 -> token-manager -> 3200 validate -> 401`

![真正的根因是 3200 token 校验没认这把 ak_ key，所以 3000 也会同步 401](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/oc-step-22-token-validate-401.png)

---

## 七、最小修法到底是什么

这里我先给结论：

**不要优先去关 `token-manager`。**

最小、最稳的修法是：

**给 OpenClaw 这条内部调用链单独换一把“非 `ak_` 前缀”的内部 key。**

为什么这样更合理？

因为：

1. `token-manager` 只会拦 `ak_` 前缀的 key
2. 非 `ak_` key 它会直接跳过
3. 跳过之后，请求就会落到 `default-auth`
4. 只要 `default-auth` 的 `REQUIRED_API_KEY` 和 OpenClaw 里配的是同一个非 `ak_` key，就能通过

这意味着：

- 你不用关 token 扣费插件
- 你不用动销售 token 体系
- 你只是在 OpenClaw 到 AIClient 之间，补了一条内部认证

这是我最建议你先走的方案。

---

## 八、Step 4：先备份两边配置

先备份，别裸改。

### 代理机

```bash
cp /root/AIClient-2-API/configs/config.json /root/AIClient-2-API/configs/config.json.before-provider-fix-20260328.bak
```

### OpenClaw 容器

```bash
docker exec -it openclaw-ORD17742461621975243 sh
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.before-provider-fix-20260328.bak
```

---

## 九、Step 5：给 AIClient 改成一把内部非 `ak_` key

这里你自己定一个内部 key。

要求只有一个：

**不要以 `ak_` 开头。**

比如你可以用这种格式：

```text
internal_openclaw_proxy_20260328_change_me
```

然后把 AIClient 的：

```json
"REQUIRED_API_KEY": "..."
```

改成这把新 key。

如果你喜欢直接命令改，可以用这种方式：

```bash
python3 - <<'PY'
import json
path = "/root/AIClient-2-API/configs/config.json"
new_key = "internal_openclaw_proxy_20260328_change_me"
with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)
data["REQUIRED_API_KEY"] = new_key
with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("updated REQUIRED_API_KEY")
PY
```

这一步改完以后，**AIClient 就准备接受一把非 `ak_` 的内部 key 了。**

---

## 十、Step 6：把 OpenClaw 的 provider key 改成同一把内部 key

接着进 OpenClaw 容器，把 provider 的 `apiKey` 改成同一个值。

比如：

```bash
openclaw config set 'models.providers.kiro-proxy.apiKey' 'internal_openclaw_proxy_20260328_change_me'
openclaw config validate
```

你一定要保证：

- AIClient 的 `REQUIRED_API_KEY`
- OpenClaw 的 `models.providers.kiro-proxy.apiKey`

这两个值完全一致。

而且都不能以 `ak_` 开头。

![最小修法不是关插件，而是给 OpenClaw 单独换一条内部非 ak_ 认证链路](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/oc-step-23-minimal-fix-non-ak-key.png)

---

## 十一、Step 7：重启 3000 代理和 OpenClaw

这一步你要按你现在的实际启动方式来。

我这次查到的环境里，3000 代理是从这个目录拉起来的：

```text
/root/AIClient-2-API
```

而且进程是：

```text
npm start -> node src/core/master.js
```

如果你和我一样是这么拉起来的，可以按自己的现网规则重启。

OpenClaw 这边也建议顺手重启一次容器：

```bash
docker restart openclaw-ORD17742461621975243
```

这一段我不建议你盲抄我的进程管理命令。

原因很简单：

**你自己的代理进程可能不是用同一种方式守护的。**

所以这里你只要记住一个原则：

- 改完 AIClient 配置后，要让 3000 那层真正加载新配置
- 改完 OpenClaw 配置后，要让容器重新读取新 key

就够了。

---

## 十二、Step 8：按这 3 条顺序做回归

### 1. 先测 3000 的 `/v1/models`

```bash
curl -H "Authorization: Bearer internal_openclaw_proxy_20260328_change_me" \
  http://127.0.0.1:3000/v1/models
```

你要看到的是：

- 不再是 `401`
- 能正常返回模型列表

### 2. 再测 OpenClaw 配置是否有效

```bash
docker exec openclaw-ORD17742461621975243 sh -lc "openclaw config validate"
```

你要看到：

```text
Config valid
```

### 3. 最后再测真实 agent 调用

```bash
docker exec openclaw-ORD17742461621975243 sh -lc "openclaw agent --agent ops-agent --message 'Use your available subagents. Ask each worker to return one line describing its role, then summarize the three roles in Chinese. Keep the final answer short.' --json --timeout 180"
```

如果前两步都通了，而这一步还是失败，那时你再去查：

- Kiro 账号池
- provider pool 健康状态
- 模型本身能不能出响应

但至少这时候，问题已经不再是 `401` 了。

![修完以后先回归 /v1/models，再回归 openclaw config，最后才回归真实 multi-agent 调用](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/oc-step-24-provider-fix-regression-checks.png)

---

## 十三、为什么我不建议你第一反应就关 `token-manager`

因为那样改动面更大。

你一旦关掉它，可能会影响：

- 正在走 `ak_` key 的其他 API 调用
- 你原本的 token 扣费逻辑
- 销售体系那边的校验链路

而“给 OpenClaw 单独换一把内部非 `ak_` key”只影响一条内部链路。

这就是为什么我说它是**最小修法**。

---

## 十四、你现在到底该怎么判断自己是不是修好了

别靠感觉。

你就看这 4 条：

1. `3200 validate` 你不再拿它去校验 OpenClaw 的内部 key
2. `3000 /v1/models` 对内部 key 返回 `200`
3. OpenClaw `config validate` 返回 `Config valid`
4. 真实 `openclaw agent --agent ops-agent ...` 不再报 `HTTP 401: Invalid API key`

满足这 4 条，才叫真的修完。

---

## 十五、如果你修完以后还不通，下一步查什么

如果 401 已经没了，但真实调用还是不通，那下一步就查：

1. `provider_pools.json` 里 Kiro 账号是不是被禁用
2. `provider_health` 有没有 unhealthy provider
3. 3000 日志里有没有上游 `403`、`429`、`suspended`
4. 模型名是不是和当前 provider 真支持的一致

也就是说：

**先把 401 修掉，再去看模型本身能不能跑。**

这两个层次不要混。

---

## 十六、这篇的核心价值只有一句话

如果你现在的 OpenClaw provider 用的是 `ak_` key，而 3000 代理又启用了 `token-manager`，那你的请求会先走 token 校验，不会直接走默认认证。

只要这把 `ak_` key 在 3200 里无效，OpenClaw 就一定会报：

```text
HTTP 401: Invalid API key
```

这就是这次问题的真正根因。

---

## 参考资料

- OpenClaw 多智能体官方文档：<https://docs.openclaw.ai/concepts/multi-agent>
- OpenClaw 子智能体官方文档：<https://docs.openclaw.ai/tools/subagents>
- OpenClaw Session Tool 官方文档：<https://docs.openclaw.ai/zh-CN/concepts/session-tool>
