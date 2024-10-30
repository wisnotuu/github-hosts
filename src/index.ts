import { Hono } from "hono"
import {
  formatHostsFile,
  getDomainData,
  getHostsData,
  resetHostsData,
} from "./services/hosts"
import { handleSchedule } from "./scheduled"
import { Bindings } from "./types"

const app = new Hono<{ Bindings: Bindings }>()

// Welcome page
app.get("/", (c) => {
  // 获取当前请求的 URL
  const baseUrl = c.req.url.replace(/\/$/, "")
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitHub Host - 加速访问 GitHub</title>

    <!-- Open Graph tags -->
    <meta property="og:title" content="GitHub Host - 加速访问 GitHub">
    <meta property="og:description" content="使用 Cloudflare Workers 和公共 DNS API 加速访问 GitHub">
    <meta property="og:image" content="${baseUrl}/og.svg">
    <meta property="og:url" content="${baseUrl}">
    <meta property="og:type" content="website">

    <link rel="stylesheet" href="/index.css">
</head>
<body>
    <div class="header">
    <div class="logo-container">
      <img src="/logo.svg" alt="GitHub Host" class="logo" />
    </div>
    <h1>GitHub Host</h1>
    <p>使用 Cloudflare Workers 和公共 DNS API 加速访问 GitHub</p>
  </div>

    <h2>📝 项目介绍</h2>
    <p>GitHub 访问加速，解决 GitHub 访问慢的问题。使用 Cloudflare Workers 和公共 DNS API 来获取 IP 地址。</p>
    感谢 <a href="https://github.com/521xueweihan/GitHub520">GitHub520</a> 提供的灵感。

    <h2>🚀 特点</h2>
    <ul>
        <li>使用 Cloudflare Workers 部署，无需服务器</li>
        <li>使用 Cloudflare DNS (1.1.1.1) 和 Google DNS 进行域名解析</li>
        <li>使用 Cloudflare KV 存储数据，确保高可用性</li>
        <li>提供 REST API 接口</li>
        <li>每 60 分钟自动更新一次 DNS 记录</li>
    </ul>

    <h2>💻 使用方法</h2>
    <h3>1. 直接修改 hosts 文件</h3>
    <p>使用方法：</p>
    <ul>
        <li>Windows 系统：将以下内容复制到 C:\Windows\System32\drivers\etc\hosts</li>
        <li>MacOS/Linux 系统：将以下内容复制到 /etc/hosts</li>
        <li>刷新 DNS 缓存：
            <ul>
                <li>Windows：在 CMD 中运行 ipconfig /flushdns</li>
                <li>MacOS：在终端中运行 sudo killall -HUP mDNSResponder</li>
                <li>Linux：在终端中运行 sudo systemd-resolve --flush-caches</li>
            </ul>
        </li>
    </ul>
    <p>把下面的内容追加到你的 hosts 文件中 <button class="copy-btn">复制</button></p>
    <pre id="hosts">正在加载 hosts 内容...</pre>

    <h3>2. 使用 SwitchHosts 工具</h3>
    <ol>
        <li>下载并安装 <a href="https://github.com/oldj/SwitchHosts">SwitchHosts</a></li>
        <li>添加规则：
            <ul>
                <li>方案名：github-hosts</li>
                <li>类型：远程</li>
                <li>URL：<span id="switchHostsUrl"></span></li>
                <li>自动更新：1 小时</li>
            </ul>
        </li>
    </ol>

    <h2>🔧 API 接口文档</h2>
    <table class="api-table">
        <tr>
            <th>接口</th>
            <th>方法</th>
            <th>描述</th>

        </tr>
        <tr>
            <td>/hosts</td>
            <td><span class="method get">GET</span></td>
            <td>获取 hosts 文件内容</td>
        </tr>
        <tr>
            <td>/hosts.json</td>
            <td><span class="method get">GET</span></td>
            <td>获取 JSON 格式的数据</td>

        </tr>
        <tr>
            <td>/{domain}</td>
            <td><span class="method get">GET</span></td>
            <td>获取指定域名的实时 DNS 解析结果</td>

        </tr>
        <tr>
            <td>/reset</td>
            <td><span class="method post">POST</span></td>
            <td>清空缓存并重新获取所有数据（需要 API Key）</td>

        </tr>
    </table>

    <h2>📦 源码</h2>
    <p>本项目完全开源，欢迎访问 <a href="https://github.com/TinsFox/github-host">GitHub 仓库</a></p>

    <footer style="margin-top: 50px; text-align: center; color: #666;">
        <p>Made with ❤️ by <a href="https://github.com/TinsFox">TinsFox</a></p>
    </footer>

    <script src="/index.js"></script>
</body>
</html>`

  return c.html(html)
})

// JSON endpoint
app.get("/hosts.json", async (c) => {
  const data = await getHostsData(c.env)
  return c.json(data)
})

// Text hosts file endpoint
app.get("/hosts", async (c) => {
  const data = await getHostsData(c.env)
  const hostsContent = formatHostsFile(data)
  return c.text(hostsContent)
})

// Reset endpoint
app.post("/reset", async (c) => {
  const apiKey = c.req.query("key")

  // 验证 API key
  if (apiKey !== c.env.API_KEY) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const newEntries = await resetHostsData(c.env)

  return c.json({
    message: "Reset completed",
    entriesCount: newEntries.length,
    entries: newEntries,
  })
})

// 新增：查询单个域名的 IP 接口
app.get("/:domain", async (c) => {
  const domain = c.req.param("domain")
  const data = await getDomainData(c.env, domain)

  if (!data) {
    return c.json({ error: "Domain not found" }, 404)
  }

  return c.json(data)
})

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    ctx.waitUntil(handleSchedule(event, env))
  },
}
