<div align="center">
  <img src="public/logo.svg" width="140" height="140" alt="github-host logo">
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
curl -o hosts https://github-host.tinsfox.com/hosts
copy /y hosts C:\Windows\System32\drivers\etc\hosts
ipconfig /flushdns
del hosts
```

MacOS/Linux 用户：
```bash
#!/bin/bash
curl -o hosts https://github-host.tinsfox.com/hosts
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
curl -X POST https://github-host.tinsfox.com/reset?key=xxxx
```

### 方法四：SwitchHosts 工具

1. 下载 [SwitchHosts](https://github.com/oldj/SwitchHosts) 工具
2. 添加规则：
   - 方案名：GitHub520
   - 类型：远程
   - URL：`https://github-host.tinsfox.com/hosts`
   - 自动更新：1 小时

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
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/TinsFox/github-host)

## 鸣谢

- [GitHub520](https://github.com/521xueweihan/GitHub520)


## 许可证

[MIT](./LICENSE)
