export const GITHUB_URLS = [
  "alive.github.com",
  "api.github.com",
  "assets-cdn.github.com",
  "avatars.githubusercontent.com",
  "avatars0.githubusercontent.com",
  "avatars1.githubusercontent.com",
  "avatars2.githubusercontent.com",
  "avatars3.githubusercontent.com",
  "avatars4.githubusercontent.com",
  "avatars5.githubusercontent.com",
  "camo.githubusercontent.com",
  "central.github.com",
  "cloud.githubusercontent.com",
  "codeload.github.com",
  "collector.github.com",
  "desktop.githubusercontent.com",
  "favicons.githubusercontent.com",
  "gist.github.com",
  "github-cloud.s3.amazonaws.com",
  "github-com.s3.amazonaws.com",
  "github-production-release-asset-2e65be.s3.amazonaws.com",
  "github-production-repository-file-5c1aeb.s3.amazonaws.com",
  "github-production-user-asset-6210df.s3.amazonaws.com",
  "github.blog",
  "github.com",
  "github.community",
  "github.githubassets.com",
  "github.global.ssl.fastly.net",
  "github.io",
  "github.map.fastly.net",
  "githubstatus.com",
  "live.github.com",
  "media.githubusercontent.com",
  "objects.githubusercontent.com",
  "pipelines.actions.githubusercontent.com",
  "raw.githubusercontent.com",
  "user-images.githubusercontent.com",
  "vscode.dev",
  "education.github.com",
  "private-user-images.githubusercontent.com",
]

export const HOSTS_TEMPLATE = `# github hosts
# 本项目是 GitHub520 的一个分支实现，使用 Cloudflare Workers 和公共 DNS API
# 原项目地址：https://github.com/521xueweihan/GitHub520
# 本项目地址：https://github.com/TinsFox/github-host
# 文档地址：https://github-host.tinsfox.com
# 获取 hosts 文件：https://github-host.tinsfox.com/hosts
# ================================================================
# 使用方法：
# 1. Windows 系统：将以下内容复制到 C:\\Windows\\System32\\drivers\\etc\\hosts
# 2. MacOS/Linux 系统：将以下内容复制到 /etc/hosts
# 3. 刷新 DNS 缓存：
#    - Windows：在 CMD 中运行 ipconfig /flushdns
#    - MacOS：在终端中运行 sudo killall -HUP mDNSResponder
#    - Linux：在终端中运行 sudo systemd-resolve --flush-caches
# ================================================================

# 请复制我 ⬇️

{content}

# 请复制我 ⬆️

# 项目开源地址：https://github.com/TinsFox/github-host
# 数据更新时间：{updateTime}
# github hosts End
`

export const GITHUB_API_BASE = "https://api.github.com"

export const HOSTS_PATH = "hosts"

export const DNS_PROVIDERS = [
  {
    url: (domain: string) => `https://1.1.1.1/dns-query?name=${domain}&type=A`,
    headers: { Accept: "application/dns-json" },
    name: "Cloudflare DNS",
  },
  {
    url: (domain: string) => `https://dns.google/resolve?name=${domain}&type=A`,
    headers: { Accept: "application/dns-json" },
    name: "Google DNS",
  },
]
