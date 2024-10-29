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
    <style>
        :root {
            --primary-color: #3b82f6;
            --primary-hover: #2563eb;
            --success-color: #166534;
            --success-bg: #dcfce7;
            --info-color: #1e40af;
            --info-bg: #dbeafe;
            --border-color: #e5e7eb;
            --bg-hover: #f1f5f9;
            --text-primary: #374151;
            --text-secondary: #4b5563;
            --radius-sm: 6px;
            --radius-md: 8px;
            --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            --transition: all 0.2s ease;
        }

        body {
            max-width: min(1000px, 95%);
            margin: 0 auto;
            padding: 20px;
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.5;
            color: var(--text-primary);
        }

        .header {
            text-align: center;
            margin-bottom: 3rem;
            padding: 2rem 0;
        }

        .header h1 {
            margin: 0;
            font-size: 2.5rem;
            color: var(--primary-color);
        }

        .api-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin: 1.5rem 0;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            background-color: white;
            box-shadow: var(--shadow-md);
        }

        .api-table th {
            background-color: #f9fafb;
            padding: 1rem 1.5rem;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
            font-size: 0.875rem;
            font-weight: 600;
        }

        .api-table td {
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--border-color);
            font-size: 0.875rem;
            vertical-align: top;
        }

        .api-table tr:last-child td {
            border-bottom: none;
        }

        .method {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.25rem 0.75rem;
            border-radius: var(--radius-sm);
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            min-width: 60px;
            transition: var(--transition);
        }

        .get {
            background-color: var(--info-bg);
            color: var(--info-color);
        }

        .post {
            background-color: var(--success-bg);
            color: var(--success-color);
        }

        .try-btn {
            background-color: var(--primary-color);
            color: white;
            border: none;
            padding: 0.25rem 0.75rem;
            border-radius: var(--radius-sm);
            font-size: 0.75rem;
            font-weight: 500;
            cursor: pointer;
            transition: var(--transition);
            box-shadow: var(--shadow-sm);
        }

        .try-btn.loading {
            position: relative;
            padding-left: 2rem;
        }

        .try-btn.loading::before {
            content: '';
            position: absolute;
            left: 0.5rem;
            top: 50%;
            width: 1rem;
            height: 1rem;
            border: 2px solid #fff;
            border-radius: 50%;
            border-top-color: transparent;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        td:hover .try-btn {
            display: inline-flex;
            align-items: center;
        }

        .try-btn:hover {
            background-color: var(--primary-hover);
            transform: translateY(-1px);
            box-shadow: var(--shadow-md);
        }

        .try-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
        }

        .response-area {
            display: none;
            margin-top: 1rem;
            padding: 1rem;
            background-color: #f9fafb;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            font-family: ui-monospace, monospace;
            font-size: 0.875rem;
            line-height: 1.6;
            position: relative;
            transition: var(--transition);
        }

        .response-area .action-buttons {
            position: absolute;
            right: 0.5rem;
            top: 0.5rem;
            display: none;
            gap: 0.5rem;
            padding: 0.25rem;
            background-color: rgba(249, 250, 251, 0.9);
            border-radius: var(--radius-sm);
        }

        .response-area:hover .action-buttons {
            display: flex;
        }

        .response-copy-btn,
        .response-collapse-btn {
            background-color: var(--text-secondary);
            border: none;
            padding: 0.25rem 0.75rem;
            border-radius: var(--radius-sm);
            color: white;
            font-size: 0.75rem;
            cursor: pointer;
            transition: var(--transition);
        }

        .response-copy-btn:hover,
        .response-collapse-btn:hover {
            background-color: var(--text-primary);
            transform: translateY(-1px);
        }

        .response-area.collapsed {
            max-height: 100px;
            overflow-y: hidden;
            cursor: pointer;
        }

        .response-area.collapsed::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 40px;
            background: linear-gradient(transparent, #f9fafb);
            pointer-events: none;
        }

        .code-block {
            background-color: #f8f9fa;
            padding: 0.75rem;
            border-radius: var(--radius-sm);
            margin: 0.5rem 0;
            position: relative;
        }

        .copy-btn {
            right: 0.5rem;
            background-color: var(--text-secondary);
            color: white;
            border: none;
            padding: 0.25rem 0.75rem;
            border-radius: var(--radius-sm);
            font-size: 0.75rem;
            cursor: pointer;
            transition: var(--transition);
            opacity: 1;
        }

        .code-block:hover  {
            opacity: 1;
        }


        @media (max-width: 640px) {
            body {
                padding: 1rem;
            }

            .api-table td,
            .api-table th {
                padding: 0.75rem;
            }

            .header h1 {
                font-size: 2rem;
            }
        }

        .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1rem;
            perspective: 1000px;
        }

        .logo {
            width: 140px;
            height: 140px;
            transition: transform 0.3s ease;
            transform: translateZ(0);
            will-change: transform;
        }

        .logo:hover {
            transform: scale(1.05) rotate3d(1, 1, 0, 5deg);
        }

        @media (prefers-reduced-motion: reduce) {
            .logo {
                animation: none;
                transition: none;
            }

            svg animate,
            svg animateTransform {
                animation: none;
            }
        }

        @media (max-width: 640px) {
            .logo {
                width: 100px;
                height: 100px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-container">
            <svg class="logo" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
                <!-- 速度轨迹 -->
                <defs>
                    <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0"/>
                        <stop offset="50%" style="stop-color:#3b82f6;stop-opacity:0.8"/>
                        <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0"/>
                        <animate attributeName="x1" values="0%;100%;0%" dur="1.5s" repeatCount="indefinite"/>
                        <animate attributeName="x2" values="100%;200%;100%" dur="1.5s" repeatCount="indefinite"/>
                    </linearGradient>
                </defs>

                <!-- 速度轨迹线 -->
                <g transform="translate(70,70) rotate(-30)">
                    <path d="M-50,0 A50,50 0 1,1 50,0" fill="none" stroke="url(#speedGradient)" stroke-width="4">
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0"
                            to="360"
                            dur="3s"
                            repeatCount="indefinite"/>
                    </path>
                    <path d="M-45,0 A45,45 0 1,1 45,0" fill="none" stroke="url(#speedGradient)" stroke-width="4">
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="360"
                            to="0"
                            dur="2s"
                            repeatCount="indefinite"/>
                    </path>
                </g>

                <!-- GitHub 猫咪 -->
                <g transform="translate(45,45) scale(0.8)">
                    <!-- 速度光效 -->
                    <circle cx="35" cy="35" r="32" fill="none" stroke="#3b82f6" stroke-width="2" opacity="0.3">
                        <animate attributeName="r" values="32;36;32" dur="2s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite"/>
                    </circle>

                    <!-- GitHub 图标主体 -->
                    <path d="M35 14c-11.6 0-21 9.4-21 21 0 9.3 6 17.1 14.3 19.9 1 .2 1.4-.5 1.4-1 0-.5 0-1.8-.1-3.5-5.8 1.3-7.1-2.8-7.1-2.8-1-2.4-2.3-3.1-2.3-3.1-1.9-1.3.1-1.3.1-1.3 2.1.1 3.2 2.2 3.2 2.2 1.9 3.2 4.9 2.3 6.1 1.7.2-1.4.7-2.3 1.3-2.8-4.7-.5-9.6-2.3-9.6-10.4 0-2.3.8-4.2 2.2-5.6-.2-.5-.9-2.7.2-5.6 0 0 1.8-.6 5.8 2.2 1.7-.5 3.5-.7 5.2-.7 1.8 0 3.6.2 5.2.7 4-2.7 5.8-2.2 5.8-2.2 1.1 2.9.4 5 .2 5.6 1.4 1.5 2.2 3.3 2.2 5.6 0 8.1-4.9 9.8-9.6 10.3.8.7 1.4 2 1.4 3.9 0 2.8-.1 5.1-.1 5.8 0 .6.4 1.2 1.4 1 8.3-2.8 14.3-10.6 14.3-19.9 0-11.6-9.4-21-21-21z"
                        fill="#374151">
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            values="0 35 35;5 35 35;0 35 35;-5 35 35;0 35 35"
                            dur="3s"
                            repeatCount="indefinite"/>
                    </path>
                </g>

                <!-- 速度尾迹 -->
                <g transform="translate(70,70)">
                    <g transform="rotate(-45)">
                        <line x1="-40" y1="0" x2="-20" y2="0" stroke="#3b82f6" stroke-width="3" stroke-linecap="round">
                            <animate attributeName="opacity" values="0;0.8;0" dur="1s" repeatCount="indefinite"/>
                            <animate attributeName="x1" values="-40;-35;-40" dur="1s" repeatCount="indefinite"/>
                        </line>
                        <line x1="-30" y1="10" x2="-10" y2="10" stroke="#3b82f6" stroke-width="3" stroke-linecap="round">
                            <animate attributeName="opacity" values="0;0.8;0" dur="1s" repeatCount="indefinite" begin="0.2s"/>
                            <animate attributeName="x1" values="-30;-25;-30" dur="1s" repeatCount="indefinite"/>
                        </line>
                        <line x1="-35" y1="-10" x2="-15" y2="-10" stroke="#3b82f6" stroke-width="3" stroke-linecap="round">
                            <animate attributeName="opacity" values="0;0.8;0" dur="1s" repeatCount="indefinite" begin="0.4s"/>
                            <animate attributeName="x1" values="-35;-30;-35" dur="1s" repeatCount="indefinite"/>
                        </line>
                    </g>
                </g>

                <!-- 光速环 -->
                <circle cx="70" cy="70" r="65" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="10 5" opacity="0.5">
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 70 70"
                        to="360 70 70"
                        dur="8s"
                        repeatCount="indefinite"/>
                    <animate
                        attributeName="stroke-dashoffset"
                        values="0;-30"
                        dur="2s"
                        repeatCount="indefinite"/>
                </circle>
            </svg>
        </div>
        <h1>GitHub Host</h1>
        <p>使用 Cloudflare Workers 和公共 DNS API 加速访问 GitHub</p>
    </div>

    <h2>📝 项目介绍</h2>
    <p>这是 <a href="https://github.com/521xueweihan/GitHub520">GitHub520</a> 项目的一个分支实现，使用 Cloudflare Workers 和公共 DNS API 来提供服务。本项目通过优化 DNS 解析来加速 GitHub 的访问速度。</p>

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

    <script>
        // 获取当前页面的基础 URL
        const baseUrl = window.location.origin;

        function escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        async function copyToClipboard(btn) {
            try {
                const hostsElement = document.getElementById('hosts');
                await navigator.clipboard.writeText(hostsElement.textContent);

                const originalText = btn.textContent;
                btn.textContent = '已复制';

                setTimeout(() => {
                    btn.textContent = originalText;
                }, 1000);
            } catch (err) {
                console.error('复制失败:', err);
            }
        }


        async function loadHosts() {
            const hostsElement = document.getElementById('hosts');
            try {
                const response = await fetch(\`\${baseUrl}/hosts\`);
                if (!response.ok) throw new Error('Failed to load hosts');
                const hostsContent = await response.text();
                hostsElement.textContent = hostsContent;
            } catch (error) {
                hostsElement.textContent = '加载 hosts 内容失败，请稍后重试';
                console.error('Error loading hosts:', error);
            }
        }

        function setupEventListeners() {
            document.querySelectorAll('.copy-btn').forEach(btn => {
                btn.addEventListener('click', () => copyToClipboard(btn));
            });

            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('response-collapse-btn')) {
                    toggleCollapse(e.target);
                }

                if (e.target.closest('.response-area.collapsed')) {
                    const collapseBtn = e.target.closest('.response-area').querySelector('.response-collapse-btn');
                    if (collapseBtn) {
                        toggleCollapse(collapseBtn);
                    }
                }
            });


        }

        window.addEventListener('load', () => {
            loadHosts();
            setupEventListeners();
        });
    </script>
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
