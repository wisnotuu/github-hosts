<div align="center">
  <svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0"/>
            <stop offset="50%" style="stop-color:#3b82f6;stop-opacity:0.8"/>
            <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0"/>
            <animate attributeName="x1" values="0%;100%;0%" dur="1.5s" repeatCount="indefinite"/>
            <animate attributeName="x2" values="100%;200%;100%" dur="1.5s" repeatCount="indefinite"/>
        </linearGradient>
    </defs>
    <g transform="translate(70,70) rotate(-30)">
        <path d="M-50,0 A50,50 0 1,1 50,0" fill="none" stroke="url(#speedGradient)" stroke-width="4">
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="3s" repeatCount="indefinite"/>
        </path>
        <path d="M-45,0 A45,45 0 1,1 45,0" fill="none" stroke="url(#speedGradient)" stroke-width="4">
            <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="2s" repeatCount="indefinite"/>
        </path>
    </g>
    <g transform="translate(45,45) scale(0.8)">
        <circle cx="35" cy="35" r="32" fill="none" stroke="#3b82f6" stroke-width="2" opacity="0.3">
            <animate attributeName="r" values="32;36;32" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite"/>
        </circle>
        <path d="M35 14c-11.6 0-21 9.4-21 21 0 9.3 6 17.1 14.3 19.9 1 .2 1.4-.5 1.4-1 0-.5 0-1.8-.1-3.5-5.8 1.3-7.1-2.8-7.1-2.8-1-2.4-2.3-3.1-2.3-3.1-1.9-1.3.1-1.3.1-1.3 2.1.1 3.2 2.2 3.2 2.2 1.9 3.2 4.9 2.3 6.1 1.7.2-1.4.7-2.3 1.3-2.8-4.7-.5-9.6-2.3-9.6-10.4 0-2.3.8-4.2 2.2-5.6-.2-.5-.9-2.7.2-5.6 0 0 1.8-.6 5.8 2.2 1.7-.5 3.5-.7 5.2-.7 1.8 0 3.6.2 5.2.7 4-2.7 5.8-2.2 5.8-2.2 1.1 2.9.4 5 .2 5.6 1.4 1.5 2.2 3.3 2.2 5.6 0 8.1-4.9 9.8-9.6 10.3.8.7 1.4 2 1.4 3.9 0 2.8-.1 5.1-.1 5.8 0 .6.4 1.2 1.4 1 8.3-2.8 14.3-10.6 14.3-19.9 0-11.6-9.4-21-21-21z" fill="#374151">
            <animateTransform attributeName="transform" type="rotate" values="0 35 35;5 35 35;0 35 35;-5 35 35;0 35 35" dur="3s" repeatCount="indefinite"/>
        </path>
    </g>
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
    <circle cx="70" cy="70" r="65" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="10 5" opacity="0.5">
        <animateTransform attributeName="transform" type="rotate" from="0 70 70" to="360 70 70" dur="8s" repeatCount="indefinite"/>
        <animate attributeName="stroke-dashoffset" values="0;-30" dur="2s" repeatCount="indefinite"/>
    </circle>
  </svg>

  <h1>github-host</h1>
</div>


GitHub 访问加速，解决 GitHub 访问慢的问题。使用 Cloudflare Workers 和公共 DNS API 来获取 IP 地址。

## 使用方法

### 方法一：直接使用 hosts 文件

1. 访问以下任一地址获取 hosts 内容：
   - 主地址：[https://github-host.tinsfox.com/hosts](https://github-host.tinsfox.com/hosts)

2. 复制文件内容
3. 替换本地 hosts 文件：
   - Windows：`C:\Windows\System32\drivers\etc\hosts`
   - MacOS/Linux：`/etc/hosts`
4. 刷新 DNS 缓存：
   - Windows：在命令提示符中运行 `ipconfig /flushdns`
   - MacOS：在终端中运行 `sudo killall -HUP mDNSResponder`
   - Linux：在终端中运行 `sudo systemd-resolve --flush-caches`

### 方法二：使用自动更新脚本

Windows 用户：
```batch
@echo off
:: 尝试主地址
curl -o hosts https://github-host.tinsfox.com/hosts
if %errorlevel% neq 0 (
    :: 如果失败，尝试 jsDelivr CDN
    curl -o hosts https://cdn.jsdelivr.net/gh/TinsFox/github-host@main/hosts
)
copy /y hosts C:\Windows\System32\drivers\etc\hosts
ipconfig /flushdns
del hosts
```

MacOS/Linux 用户：
```bash
#!/bin/bash
# 尝试主地址
if ! curl -o hosts https://github-host.tinsfox.com/hosts; then
    # 如果失败，尝试 jsDelivr CDN
    curl -o hosts https://cdn.jsdelivr.net/gh/TinsFox/github-host@main/hosts
fi
sudo cp hosts /etc/hosts
# MacOS
[ "$(uname)" == "Darwin" ] && sudo killall -HUP mDNSResponder
# Linux
[ "$(uname)" == "Linux" ] && sudo systemd-resolve --flush-caches
rm hosts
```

### 方法三：使用 API 接口

1. 获取所有 hosts：
```bash
curl https://github-host.tinsfox.com/hosts
```

2. 获取 JSON 格式数据：
```bash
curl https://github-host.tinsfox.com/hosts.json
```

3. 查询单个域名：
```bash
curl https://github-host.tinsfox.com/github.com
```

4. 刷新所有数据：
```bash
curl -X POST https://github-host.tinsfox.com/reset?key=44a8f0231c01157a14765cd3b2f2138f
```

### 方法四：SwitchHosts 工具

1. 下载 [SwitchHosts](https://github.com/oldj/SwitchHosts) 工具
2. 添加规则：
   - 方案名：GitHub520
   - 类型：远程
   - URL 选择以下任一地址：
     - `https://github-host.tinsfox.com/hosts`
     - `https://cdn.jsdelivr.net/gh/TinsFox/github-host@main/hosts`
   - 自动更新：1 小时

## 与原项目的区别

1. 使用 Cloudflare Workers 部署，无需服务器
2. 使用 Cloudflare DNS (1.1.1.1) 和 Google DNS 进行域名解析
3. 使用 Cloudflare KV 存储数据
4. 提供 REST API 接口
5. 每 60 分钟自动更新一次 DNS 记录

## API 接口

- `GET /hosts` - 获取 hosts 文件内容
- `GET /hosts.json` - 获取 JSON 格式的数据
- `GET /{domain}` - 获取指定域名的实时 DNS 解析结果
- `POST /reset` - 清空缓存并重新获取所有数据

## 部署方法

1. Fork 本项目
2. 创建 Cloudflare Workers 账号
3. 安装依赖：

```
npm install
npm run dev
```

```
npm run deploy
```
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/TinsFox/github-host)

## 鸣谢

- [GitHub520](https://github.com/521xueweihan/GitHub520)


## 许可证

[MIT](./LICENSE)
