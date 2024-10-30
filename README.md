<div align="center">
  <img src="public/logo.svg" width="140" height="140" alt="github-hosts logo">
  <h1>github-hosts</h1>
  <p>GitHub 访问加速，解决 GitHub 访问慢的问题。使用 Cloudflare Workers 和公共 DNS API 来获取 IP 地址。</p>
</div>

## 特性

- 🚀 使用 Cloudflare Workers 部署，无需服务器
- 🌍 多 DNS 服务支持（Cloudflare DNS、Google DNS）
- ⚡️ 每 60 分钟自动更新 DNS 记录
- 💾 使用 Cloudflare KV 存储数据
- 🔄 提供多种使用方式（脚本、手动、工具）
- 📡 提供 REST API 接口

## 使用方法

### 1. 命令行工具（推荐）

#### Windows 用户
在管理员权限的 PowerShell 中执行：
```powershell
irm https://cdn.jsdelivr.net/gh/TinsFox/github-hosts@v1.0.6/github-hosts.windows-amd64.exe | iex
```

#### MacOS 用户
```bash
# Apple Silicon (ARM64)
sudo curl -fsSL https://cdn.jsdelivr.net/gh/TinsFox/github-hosts@v1.0.6/github-hosts.darwin-arm64 -o /usr/local/bin/github-hosts && sudo chmod +x /usr/local/bin/github-hosts && github-hosts
```

#### Linux 用户
```bash
# AMD64 架构
sudo curl -fsSL https://cdn.jsdelivr.net/gh/TinsFox/github-hosts@v1.0.6/github-hosts.linux-amd64 -o /usr/local/bin/github-hosts && sudo chmod +x /usr/local/bin/github-hosts && github-hosts
```

> 📝 更多架构版本请查看[下载说明](#下载说明)

### 2. SwitchHosts 工具

1. 下载 [SwitchHosts](https://github.com/oldj/SwitchHosts)
2. 添加规则：
   - 方案名：GitHub Hosts
   - 类型：远程
   - URL：`https://github-hosts.tinsfox.com/hosts`
   - 自动更新：1 小时

### 3. 手动更新

1. 获取 hosts：访问 [https://github-hosts.tinsfox.com/hosts](https://github-hosts.tinsfox.com/hosts)
2. 更新本地 hosts 文件：
   - Windows：`C:\Windows\System32\drivers\etc\hosts`
   - MacOS/Linux：`/etc/hosts`
3. 刷新 DNS：
   - Windows：`ipconfig /flushdns`
   - MacOS：`sudo killall -HUP mDNSResponder`
   - Linux：`sudo systemd-resolve --flush-caches`

## 下载说明

### 预编译二进制文件

从 [Release 页面](https://github.com/TinsFox/github-hosts/releases/tag/v1.0.6) 下载：

- Windows: [AMD64](https://cdn.jsdelivr.net/gh/TinsFox/github-hosts@v1.0.6/github-hosts.windows-amd64.exe) | [386](https://cdn.jsdelivr.net/gh/TinsFox/github-hosts@v1.0.6/github-hosts.windows-386.exe)
- MacOS: [ARM64](https://cdn.jsdelivr.net/gh/TinsFox/github-hosts@v1.0.6/github-hosts.darwin-arm64) | [AMD64](https://cdn.jsdelivr.net/gh/TinsFox/github-hosts@v1.0.6/github-hosts.darwin-amd64)
- Linux: [AMD64](https://cdn.jsdelivr.net/gh/TinsFox/github-hosts@v1.0.6/github-hosts.linux-amd64) | [ARM64](https://cdn.jsdelivr.net/gh/TinsFox/github-hosts@v1.0.6/github-hosts.linux-arm64) | [386](https://cdn.jsdelivr.net/gh/TinsFox/github-hosts@v1.0.6/github-hosts.linux-386)

## API 文档

- `GET /hosts` - 获取 hosts 文件内容
- `GET /hosts.json` - 获取 JSON 格式的数据
- `GET /{domain}` - 获取指定域名的实时 DNS 解析结果
- `POST /reset` - 清空缓存并重新获取所有数据（需要 API 密钥）

## 常见问题

### 权限问题
- Windows：需要以管理员身份运行
- MacOS/Linux：需要 sudo 权限

### 定时任务未生效
- Windows：检查任务计划程序中的 "GitHub Hosts Updater"
- MacOS/Linux：使用 `crontab -l` 检查

### 更新失败
- 检查日志：`~/.github-hosts/logs/update.log`
- 确保网络连接和文件权限正常

## 部署指南

1. Fork 本项目
2. 创建 Cloudflare Workers 账号
3. 安装并部署：
```bash
npm install
npm run dev    # 本地开发
npm run deploy # 部署到 Cloudflare
```

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/TinsFox/github-hosts)

## 鸣谢

- [GitHub520](https://github.com/521xueweihan/GitHub520)

## 许可证

[MIT](./LICENSE)
