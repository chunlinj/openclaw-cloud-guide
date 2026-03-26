# OpenClaw 保姆级安装教程：从 0 到 1 搭建自己的“大龙虾”

> 这篇文章写给第一次接触 OpenClaw 的用户。
>
> 目标很简单：不用你先懂一堆底层原理，先把 OpenClaw 跑起来，再进入控制台，最后完成基础可用状态。

---

## 一、先说人话：OpenClaw 到底适合谁

如果你正好有下面这些想法，这篇教程就适合你：

- 想用 Claude Sonnet 4.5 一类的模型做日常开发
- 想要一个 24 小时在线的 AI 助手
- 想通过 Telegram、Discord 这类渠道和 AI 对话
- 不想自己从零研究一整套网关、接入、容器和后台配置

很多人不是不会用 AI，而是卡在第一步：

- 不知道怎么装
- 不知道先装 Docker 还是先装 Node
- 不知道控制台从哪进
- 不知道装完后如何确认自己是不是装成功了

这篇文章就只解决一件事：

**把 OpenClaw 先装起来，并确认它真的能跑。**

---

## 二、这篇教程采用哪种安装方式

OpenClaw 官方有多种安装方式，但如果你是第一次安装，我建议你优先走：

**Docker + 官方安装脚本**

原因很简单：

- 更适合新手
- 环境更隔离
- 后续迁移、备份、重建更方便
- 官方文档对这条路径写得更完整

这篇文章默认采用的就是这条路线。

![OpenClaw 官方 Docker 安装文档截图](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/openclaw-docker-doc-top.png)

上面这张图就是官方 Docker 安装文档页面，第一次安装建议优先跟着这条路径走。

---

## 三、准备工作

在开始之前，你至少需要准备下面这些东西：

### 1. 一台能跑 Docker 的机器

推荐：

- Linux 服务器
- 本地 Linux
- WSL2
- macOS

如果你是 Windows 用户，官方更推荐你通过 **WSL2** 来运行。

### 2. 安装 Docker 和 Docker Compose v2

你需要确保下面两个东西可用：

- Docker Engine 或 Docker Desktop
- `docker compose` 命令

你可以先执行：

```bash
docker --version
docker compose version
```

如果这两个命令都能正常返回版本号，说明 Docker 这一层基本就绪。

### 3. 至少 2GB 可用内存

官方 Docker 文档提到，镜像构建阶段至少建议有 **2 GB RAM**，否则某些依赖安装阶段可能因为内存不足直接失败。

如果你机器配置太低，建议优先用预构建镜像，少走弯路。

---

## 四、正式开始安装

### 第一步：拉取 OpenClaw 仓库

先执行：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

进入项目目录后，再执行下一步。

![OpenClaw 官方 GitHub 仓库首页截图](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/openclaw-github-repo.png)

如果你不确定仓库有没有找对，可以先对照一下官方 GitHub 仓库首页。

---

### 第二步：运行官方 Docker 安装脚本

在仓库根目录执行：

```bash
./scripts/docker/setup.sh
```

这一步会做几件关键事情：

- 构建或拉取 OpenClaw 镜像
- 引导你完成 onboarding
- 生成网关 token
- 写入 `.env`
- 启动 Docker Compose 服务

如果你不想本地构建镜像，也可以直接指定官方预构建镜像：

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
./scripts/docker/setup.sh
```

对于新手来说，如果你只是想先快速跑通，我更建议你优先试这个预构建镜像方案。

![OpenClaw Docker 安装步骤截图](https://cdn.jsdelivr.net/gh/chunlinj/openclaw-cloud-guide@main/docs/images/openclaw-docker-doc-steps.png)

这张图对应的是官方文档里最核心的一段安装流程，包括 `setup.sh`、onboarding、控制台入口和渠道配置。

---

## 五、安装过程中会让你做什么

官方脚本运行后，通常会进入 onboarding 流程。

它会引导你完成一些基础设置，比如：

- 模型提供商相关配置
- 网关基础配置
- 生成控制台访问 token

你可以把它理解成：

**安装脚本不仅是在装程序，也是在帮你完成第一次初始化。**

所以当你看到它开始问配置问题时，不要以为报错了，那通常是正常流程。

---

## 六、安装完成后，控制台从哪进

安装完成后，默认可以通过下面地址打开控制台：

```text
http://127.0.0.1:18789/
```

打开后，把安装过程中生成的 token 粘进去即可。

如果你忘了控制台地址或者想重新打印一次，可以执行：

```bash
docker compose run --rm openclaw-cli dashboard --no-open
```

这个命令会输出控制台地址，而不是强制帮你打开浏览器。

---

## 七、怎么确认自己真的装成功了

这是很多新手最容易忽略的一步。

不要看到“脚本跑完了”就以为一定成功，最好自己再做一次验证。

### 方法 1：看容器状态

```bash
docker compose ps
```

如果核心容器状态正常，没有持续重启，没有 `Exited`，说明大概率已经跑起来了。

### 方法 2：看健康检查

```bash
curl -fsS http://127.0.0.1:18789/healthz
curl -fsS http://127.0.0.1:18789/readyz
```

这两个接口是官方文档里给出的健康检查方式：

- `healthz` 看存活
- `readyz` 看是否准备就绪

如果这两个接口都能正常返回，说明 OpenClaw 网关基本可用。

---

## 八、如果你后面还想接 Telegram 或 Discord

装好 OpenClaw 只是第一步。

如果你后面想真正把它用起来，通常还要继续接渠道。

官方 Docker 文档里给出的典型命令是：

### Telegram

```bash
docker compose run --rm openclaw-cli channels add --channel telegram --token "<你的 Telegram Bot Token>"
```

### Discord

```bash
docker compose run --rm openclaw-cli channels add --channel discord --token "<你的 Discord Bot Token>"
```

也就是说，**安装成功 != 渠道已经接好**。

安装完成后，你还需要根据自己的使用方式继续做渠道绑定。

这部分我建议后面单独再写一篇，讲得会更清楚。

---

## 九、新手最常见的几个坑

### 1. Docker 没装好

表现：

- `docker` 命令不存在
- `docker compose` 不能执行
- 权限不够

解决思路：

- 先别急着怪 OpenClaw
- 先把 Docker 层跑通
- 确保 `docker --version` 和 `docker compose version` 正常

### 2. 内存太小，构建失败

表现：

- 安装卡住
- 构建中断
- 依赖安装阶段被系统杀掉

解决思路：

- 换大一点的机器
- 或者直接使用官方预构建镜像

### 3. 控制台打不开

常见原因：

- 服务没起来
- 端口没有监听
- 你不是在安装机器本机访问

排查顺序建议：

1. `docker compose ps`
2. `curl http://127.0.0.1:18789/healthz`
3. 再看端口和网络暴露问题

### 4. VPS 直接暴露控制台到公网

这个风险比较高。

官方文档明确提到，如果你在 VPS 或公网主机上跑，应该认真看网络暴露和安全加固说明，不要把未经限制的控制面板直接裸奔到公网。

这一点很多人会忽略，但实际上很关键。

---

## 十、给第一次安装的人一个建议

如果你是第一次接触 OpenClaw，我建议你按下面顺序来：

1. 先把 Docker 安装好
2. 先把 OpenClaw 跑起来
3. 先确认控制台能打开
4. 先确认健康检查通过
5. 再去接 Telegram / Discord
6. 最后再考虑 Skill、自动化和高阶玩法

不要一上来就想着全部一起装完。

**先跑通，再优化。**

这是最快的路。

---

## 十一、如果你觉得本地安装太麻烦

说实话，OpenClaw 自己部署并不算离谱，但对于很多人来说，麻烦的从来不是“能不能装”，而是：

- 要不要准备服务器
- 要不要准备域名
- 要不要自己管部署
- 要不要自己处理渠道接入
- 要不要自己承担 token 和后续运维成本

如果你只是想：

- 快速开始用
- 直接拿到自己的 AI 助手
- 省掉安装、部署、配对、维护这些步骤

也可以直接看我这边做的云端版入口：

- 购买地址：`https://opensale.chunlin.lat/`

如果你想要教程、或者懒得自己折腾安装，也可以直接联系我：

- 邮箱：`17671460675@163.com`
- 微信：`17671460675`

---

## 十二、下一篇准备写什么

如果这篇你觉得有用，后面我会继续把这个系列补全，至少包括这几个方向：

- OpenClaw 如何对接飞书
- OpenClaw 的 Skill 怎么安装和使用
- OpenClaw 的高阶玩法和避坑点

如果你想要我把后面几篇也一起整理成可直接发 CSDN 的 Markdown，我可以继续往下写。

---

## 参考资料

- OpenClaw Docker 官方文档：<https://docs.openclaw.ai/install/docker>
- OpenClaw 官方仓库：<https://github.com/openclaw/openclaw>
- OpenClaw 安装说明整理页：<https://aboutclaw.com/>
