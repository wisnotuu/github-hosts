<div align="center">
  <img src="public/logo.svg" width="140" height="140" alt="github-hosts logo">
  <h1>github-hosts</h1>
</div>

GitHub 访问加速，解决 GitHub 访问慢的问题。使用 Cloudflare Workers 和公共 DNS API 来获取 IP 地址。

## 快速开始

### Windows 用户
在管理员权限的 PowerShell 中执行：
```powershell
irm https://cdn.jsdelivr.net/gh/TinsFox/github-hosts@main/windows.ps1 | iex
```

### MacOS/Linux 用户
```bash
curl -fsSL https://cdn.jsdelivr.net/gh/TinsFox/github-hosts@main/unix.sh | sudo bash
```

## 其他使用方法

### 方法一：手动更新 hosts 文件

1. 访问以下地址获取 hosts 内容：
   - [https://github-hosts.tinsfox.com/hosts](https://github-hosts.tinsfox.com/hosts)

2. 复制文件内容
3. 替换本地 hosts 文件：
   - Windows：`C:\Windows\System32\drivers\etc\hosts`
   - MacOS/Linux：`/etc/hosts`
4. 刷新 DNS 缓存：
   - Windows：`ipconfig /flushdns`
   - MacOS：`sudo killall -HUP mDNSResponder`
   - Linux：`sudo systemd-resolve --flush-caches`

### 方法二：使用 SwitchHosts 工具

1. 下载 [SwitchHosts](https://github.com/oldj/SwitchHosts) 工具
2. 添加规则：
   - 方案名：GitHub Hosts
   - 类型：远程
   - URL：`https://github-hosts.tinsfox.com/hosts`
   - 自动更新：1 小时

## 常见问题

1. **权限问题**
   - Windows：需要以管理员身份运行 PowerShell 或命令提示符
   - MacOS/Linux：需要 sudo 权限

2. **定时任务未生效**
   - Windows：检查任务计划程序中的 "GitHub Hosts Updater" 任务
   - MacOS/Linux：使用 `crontab -l` 检查定时任务

3. **更新失败**
   - 检查日志文件（`~/.github-hosts/logs/update.log`）
   - 确保网络连接正常
   - 确保有足够的权限修改 hosts 文件

4. **脚本下载失败**
   - 如果无法访问 GitHub，可以使用以下备用地址：
     ```bash
     # jsDelivr CDN
     curl -fsSL https://cdn.jsdelivr.net/gh/TinsFox/github-hosts@main/install.sh | sudo bash
     ```

## 与原项目的区别

1. 使用 Cloudflare Workers 部署，无需服务器
2. 使用 DNS 服务获取 IP 地址，支持：
   - Cloudflare DNS (1.1.1.1) （默认）
   - Google DNS
3. 使用 Cloudflare KV 存储数据
4. 提供 REST API 接口
5. 每 60 分钟自动更新一次 DNS 记录

## API 接口

- `GET /hosts` - 获取 hosts 文件内容
- `GET /hosts.json` - 获取 JSON 格式的数据
- `GET /{domain}` - 获取指定域名的实时 DNS 解析结果
- `POST /reset` - 清空缓存并重新获取所有数据（需要 API 密钥）

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
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/TinsFox/github-hosts)

## 鸣谢

- [GitHub520](https://github.com/521xueweihan/GitHub520)


## 许可证

[MIT](./LICENSE)
