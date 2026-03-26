# OpenClaw 如何对接飞书、Telegram、Discord：国内用户实战指南

> 这篇文章适合已经把 OpenClaw 装起来的人。
>
> 目标不是讲概念，而是直接把 3 个最常见的聊天渠道接起来：飞书、Telegram、Discord。

---

## 一、先说结论：国内用户优先顺序怎么选

如果你人在国内，或者你的用户主要在国内，我先把结论讲清楚：

- **飞书**：最省心，国内网络通常可直接使用，不需要额外折腾国际网络访问
- **Telegram**：可用，但国内用户通常需要稳定的国际网络访问环境
- **Discord**：也可用，但国内用户通常同样需要稳定的国际网络访问环境

所以如果你是：

- 自己给自己用
- 想尽快跑通
- 希望先做一个稳定入口

我建议你先接 **飞书**。

如果你本身就在 Telegram / Discord 社群里活跃，再去接后面两个会更顺手。

---

## 二、这篇文章会讲什么

这篇文章分三部分：

1. OpenClaw 如何对接飞书
2. OpenClaw 如何对接 Telegram
3. OpenClaw 如何对接 Discord

每一部分都按这个标准来写：

- 适合谁
- 需要准备什么
- 具体操作步骤
- 常见坑
- 我建议你怎么选

---

## 三、OpenClaw 对接飞书

### 1. 为什么我建议国内用户优先接飞书

因为飞书这条路径，对国内用户最友好：

- 管理后台能正常打开
- 官方开放平台可直接访问
- 不依赖 Telegram / Discord 的国际网络环境
- 更适合作为你自己的第一个稳定工作入口

而且 OpenClaw 官方的飞书通道，走的是 **Feishu / Lark Bot + WebSocket 事件订阅**，这有一个很实用的好处：

**不需要你额外暴露公网 webhook URL。**

这点对新手非常友好。

![OpenClaw 官方 Feishu 文档截图](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/openclaw-feishu-doc-top.png)

---

### 2. 飞书通道需要准备什么

你需要准备：

- 一套已经装好的 OpenClaw
- 一个飞书企业或团队环境
- 飞书开放平台后台权限
- 用来创建机器人的 App ID 和 App Secret

根据 OpenClaw 官方文档，当前版本的 Feishu 插件通常已经是 **bundled plugin**，也就是默认随版本一起带上。

如果你是很老的版本，或者自定义构建没有带插件，才需要手动执行：

```bash
openclaw plugins install @openclaw/feishu
```

---

### 3. 飞书侧具体怎么做

#### 第一步：打开飞书开放平台

地址：

- `https://open.feishu.cn`

如果你用的是国际版 Lark，则使用：

- `https://open.larksuite.com/app`

如果你走的是 Lark 国际版，后面 OpenClaw 配置里还要把 `domain` 设成 `lark`。

#### 第二步：创建企业应用

根据 OpenClaw 官方文档，流程是：

1. 点击创建企业自建应用
2. 填应用名称和描述
3. 选一个应用图标

#### 第三步：复制凭证

在应用后台的 `Credentials & Basic Info` 里，复制：

- `App ID`
- `App Secret`

这里尤其要注意：

**App Secret 是敏感信息，不要随手发到聊天窗口里。**

#### 第四步：配置权限

官方文档建议在飞书权限页使用批量导入，把所需权限一次导进去。

这一步是很多人最容易漏掉的地方。

如果权限没配全，常见现象就是：

- 机器人能创建成功
- 但收不到消息
- 或者能收到消息但发不出去

#### 第五步：开启 Bot 能力

在应用能力里，打开 `Bot`，并设置机器人名称。

#### 第六步：配置事件订阅

这一步也很关键。

根据 OpenClaw 官方文档，飞书这里建议：

1. 先确保你已经在 OpenClaw 里加过 Feishu 通道
2. 确保网关已经启动
3. 在飞书后台选择 **Use long connection to receive events**
4. 添加事件：`im.message.receive_v1`

也就是说，飞书这条线路推荐的是 **长连接 / WebSocket 模式**，不是你自己再搭一层公网 webhook。

#### 第七步：发布应用

最后要去做：

1. 创建版本
2. 提交审核 / 发布
3. 等企业管理员审批

如果你没发布，很多时候后台配置看着都对，但机器人还是不能正常被使用。

---

### 4. OpenClaw 这边怎么配置飞书

OpenClaw 官方给了两种方式：

- `openclaw onboard`
- `openclaw channels add`

如果你刚装完 OpenClaw，我建议直接走：

```bash
openclaw onboard
```

如果你已经完成安装，只是后来单独补飞书通道，更直接的是：

```bash
openclaw channels add
```

然后在交互里选择 `Feishu`，再填：

- App ID
- App Secret

如果你喜欢手改配置文件，也可以在 `~/.openclaw/openclaw.json` 里写：

```json
{
  "channels": {
    "feishu": {
      "enabled": true,
      "dmPolicy": "pairing",
      "accounts": {
        "main": {
          "appId": "cli_xxx",
          "appSecret": "xxx",
          "name": "My AI assistant"
        }
      }
    }
  }
}
```

如果你走的是国际版 Lark，再补上：

```json
{
  "channels": {
    "feishu": {
      "domain": "lark"
    }
  }
}
```

---

### 5. 飞书接好后怎么验证

建议你按这个顺序检查：

```bash
openclaw gateway status
openclaw logs --follow
```

然后自己给机器人发一条测试消息。

如果默认走 `dmPolicy: "pairing"`，第一次发消息通常会走配对流程。

如果你后面希望开放更多人直接聊天，再考虑把策略从 `pairing` 改到更宽松的模式。

---

### 6. 飞书最常见的坑

#### 坑 1：应用建了，但没发布

这是最常见的问题之一。

后台都配好了，但应用没真正发布，用户侧就会表现得像“机器人不工作”。

#### 坑 2：事件订阅没配对

如果 `im.message.receive_v1` 没加，OpenClaw 就收不到消息。

#### 坑 3：网关没启动就去配长连接

官方文档已经明确提醒了这一点：如果网关没在运行，长连接配置可能保存失败。

#### 坑 4：把 App Secret 当普通字符串到处发

这个本质上和 Discord Bot Token 一样，都应该当密钥看待。

---

## 四、OpenClaw 对接 Telegram

### 1. Telegram 适合哪些人

Telegram 更适合这类用户：

- 本身就长期用 Telegram
- 已经在 Telegram 里有自己的开发群或个人 Bot
- 希望和 OpenClaw 的对话非常轻量、直接

但是要先讲清楚一个现实问题：

**国内用户要使用 Telegram，通常需要稳定的国际网络访问环境。**

这不仅仅是“聊天时要能打开 Telegram”，还包括：

- 创建 Bot
- 管理 Bot
- 和机器人长期稳定收发消息

所以如果你不想折腾网络环境，先接飞书通常更稳。

![OpenClaw 官方 Telegram 文档截图](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/openclaw-telegram-doc-top.png)

---

### 2. Telegram 侧需要准备什么

Telegram 这边最核心的就是一个东西：

- `Bot Token`

官方文档建议你去找：

- `@BotFather`

然后执行：

```text
/newbot
```

按流程创建完成后，保存好 Bot Token。

---

### 3. OpenClaw 这边怎么配置 Telegram

OpenClaw 官方文档里给的是配置式方案，而不是登录式方案。

它特别提到：

**Telegram 不走 `openclaw channels login telegram` 这种方式。**

你要做的是：

- 把 Bot Token 写进配置
- 或者写成环境变量
- 然后启动网关

最基础的配置示例如下：

```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "123:abc",
      "dmPolicy": "pairing",
      "groups": {
        "*": {
          "requireMention": true
        }
      }
    }
  }
}
```

环境变量兜底也可以：

```bash
export TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN"
```

---

### 4. Telegram 第一次怎么完成配对

官方文档里的流程很直白：

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

也就是说：

1. 先把网关跑起来
2. 你在 Telegram 里私聊 Bot
3. Bot 给你一个配对码
4. 你再去 OpenClaw 侧批准这个配对码

并且官方文档明确写了：

**配对码默认 1 小时过期。**

---

### 5. Telegram 群聊怎么处理

如果你后面不只是想私聊机器人，还想把它加进群聊，那要额外注意 Telegram 的群组策略。

官方文档提到两个关键点：

#### 1. Privacy Mode

Telegram 机器人默认会开启 `Privacy Mode`，这会限制它在群里能看到的消息范围。

如果你希望机器人看见更多群消息，通常有两种做法：

- 在 BotFather 里用 `/setprivacy` 关闭隐私模式
- 或者直接把机器人设成群管理员

#### 2. 群权限和可见性

文档还提到：

- 机器人如果是管理员，通常能看到更多群内消息
- 改完隐私模式后，最好把机器人从群里移除再重新加一次，让新设置生效

这一步很容易被忽略。

很多人明明“设置都改了”，但因为没重新加群，最后还是以为 OpenClaw 没接好。

---

### 6. Telegram 常见坑

#### 坑 1：把 BotFather 搞错

一定要确认句柄是精确的 `@BotFather`。

#### 坑 2：只配了 token，没启动 gateway

没启动网关，Bot 不会自己工作。

#### 坑 3：群聊里机器人不回

十有八九是：

- Privacy Mode 没处理
- 没给管理员权限
- `requireMention` 还开着

---

## 五、OpenClaw 对接 Discord

### 1. Discord 适合哪些人

Discord 更适合：

- 你自己本来就在 Discord 上工作
- 你有自己的私有服务器
- 你希望把不同频道当成不同工作上下文

但和 Telegram 一样，国内用户这里也要先知道一件事：

**Discord 这条线路，通常也需要稳定的国际网络访问环境。**

如果是给国内普通用户直接用，我依旧更建议先推飞书。

![OpenClaw 官方 Discord 文档截图](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/openclaw-discord-doc-top.png)

---

### 2. Discord 官方建议怎么接

OpenClaw 官方文档对 Discord 的建议非常明确：

**最好先准备一个你自己的私有服务器，再把 Bot 加进去。**

这是因为 Discord 不只是 DM 模式，它还很适合做“每个频道一个上下文”的工作空间。

如果你还没有自己的服务器，先自己建一个最方便。

---

### 3. Discord 侧具体操作

#### 第一步：创建应用和 Bot

去：

- `https://discord.com/developers/applications`

然后：

1. 点击 `New Application`
2. 填一个应用名，比如 `OpenClaw`
3. 进入左侧 `Bot`
4. 设置 Bot 名称

#### 第二步：开启 Intents

根据 OpenClaw 官方文档，至少要开：

- `Message Content Intent`，这是必需的

推荐再开：

- `Server Members Intent`

可选：

- `Presence Intent`

如果 `Message Content Intent` 没开，最常见的结果就是：

**Bot 在线，但看不到你发的消息。**

#### 第三步：复制 Bot Token

在 Bot 页面点 `Reset Token`。

官方文档专门提醒过：

虽然按钮名字叫 Reset，但第一次生成 token 也会走这个按钮，不是说你真的重置了什么旧 token。

复制后妥善保存。

#### 第四步：生成邀请链接并拉进服务器

在左侧 `OAuth2` 页面里，打开 URL Generator。

按官方文档，至少勾上：

- `bot`
- `applications.commands`

Bot Permissions 至少建议勾上：

- `View Channels`
- `Send Messages`
- `Read Message History`
- `Embed Links`
- `Attach Files`
- `Add Reactions`（可选）

这一步你可以理解成：

**不给权限，OpenClaw 不一定没装好，但 Bot 在 Discord 里就是干不了活。**

#### 第五步：开启 Developer Mode，复制 ID

OpenClaw 官方文档还要求你取两个关键 ID：

- `Server ID`
- `User ID`

开启方式：

1. Discord 用户设置
2. `Advanced`
3. 打开 `Developer Mode`

然后：

- 右键服务器图标，复制 `Server ID`
- 右键你自己的头像，复制 `User ID`

#### 第六步：允许服务器成员给你发私信

这一点很容易漏。

官方文档明确说了，**如果你想通过 Discord DM 完成 pairing，就要允许服务器成员给你发 DM。**

路径一般是：

- 右键服务器
- `Privacy Settings`
- 打开 `Direct Messages`

---

### 4. OpenClaw 这边怎么配置 Discord

官方文档推荐把 Bot Token 作为环境变量处理，而不是明文到处写：

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

如果 OpenClaw 已经作为后台服务在跑，就用：

```bash
openclaw gateway restart
```

---

### 5. Discord 第一次怎么完成配对

根据 OpenClaw 官方文档：

1. 等 gateway 跑起来
2. 在 Discord 私聊你的 Bot
3. Bot 会回复一个 pairing code
4. 执行批准命令

CLI 示例：

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

同样，官方文档也写明了：

**配对码默认 1 小时过期。**

---

### 6. 如果你想把 Discord 当长期工作空间

Discord 这点和 Telegram、飞书不太一样。

OpenClaw 官方文档专门提到，Discord 很适合往“guild workspace”方向使用。

简单说就是：

- 不是只有私聊
- 你还可以让它在服务器频道里工作
- 每个频道都能形成自己的会话上下文

如果你只是在自己的私有服务器里用，官方文档还给了两个很实用的建议：

#### 1. 先把服务器加入 allowlist

让 Bot 不只在 DM 里工作，也能在你的服务器频道里响应。

#### 2. 私有服务器里可以关掉 requireMention

默认情况下，Discord 频道里需要 `@提及` 才响应。

如果这个服务器就是你自己和 Bot 的工作区，其实可以把：

- `requireMention: false`

这样就会更像真正的常驻工作助手。

---

### 7. Discord 常见坑

#### 坑 1：Message Content Intent 没开

这是最典型的坑。

表现就是：

- Bot 在
- 也授权了
- 但你发消息它像没看见一样

#### 坑 2：权限没配够

尤其是这些：

- Send Messages
- Read Message History
- Attach Files

少一个都可能影响日常使用体验。

#### 坑 3：没允许 Direct Messages

这样 pairing 根本走不通。

#### 坑 4：把 Bot 直接加进公开大群就开始试

官方文档更推荐你先在自己的私有服务器里调通，再考虑更复杂的场景。

这个建议非常合理。

---

## 六、如果你让我给个实际建议，我会怎么选

如果你问我：

**OpenClaw 到底先接哪个渠道最合理？**

我会这么建议：

### 情况 1：你人在国内，只想先跑通

优先：

- 飞书

因为最稳，最不依赖外部网络条件。

### 情况 2：你本来就在 Telegram 上活跃

优先：

- Telegram

因为接入轻，交互直接。

### 情况 3：你想把 OpenClaw 变成一个真正的频道化工作空间

优先：

- Discord

因为 Discord 在“一个服务器多个频道多个上下文”这件事上更强。

---

## 七、最后说一句：如果你懒得折腾这些接入流程

你看到这里应该也发现了：

真正麻烦的从来不是“会不会点按钮”，而是：

- 平台后台怎么配
- Token 怎么保存
- pairing 怎么过
- 权限怎么勾
- 群聊和私聊策略怎么设

如果你只是想：

- 快速开始用
- 少折腾接入
- 直接拿到自己的 OpenClaw 助手

也可以直接看我这边的云端入口：

- 购买地址：`https://opensale.chunlin.lat/`

如果你想要教程，或者希望我后面继续补更细的图文版，也可以直接联系我：

- 邮箱：`17671460675@163.com`
- 微信：`17671460675`

---

## 八、下一篇可以写什么

如果你觉得这篇有用，后面这个系列我建议继续写：

- OpenClaw 的 Skill 怎么安装和使用
- OpenClaw 的高阶玩法和常见误区
- OpenClaw 如何做长期稳定运行

---

## 参考资料

- OpenClaw Feishu 官方文档：<https://docs.openclaw.ai/channels/feishu>
- OpenClaw Telegram 官方文档：<https://docs.openclaw.ai/channels/telegram>
- OpenClaw Discord 官方文档：<https://docs.openclaw.ai/channels/discord>
