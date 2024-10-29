import { GITHUB_URLS, HOSTS_TEMPLATE } from "../constants"
import { Bindings } from "../types"

export type HostEntry = [string, string]

interface DomainData {
  ip: string
  lastUpdated: string
  lastChecked: string
}

interface DnsQuestion {
  name: string
  type: number
}

interface DnsAnswer {
  name: string
  type: number
  TTL: number
  data: string
}

interface DnsResponse {
  Status: number
  TC: boolean
  RD: boolean
  RA: boolean
  AD: boolean
  CD: boolean
  Question: DnsQuestion[]
  Answer: DnsAnswer[]
}

async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (retries === 0) throw error
    await new Promise((resolve) => setTimeout(resolve, delay))
    return retry(fn, retries - 1, delay * 2)
  }
}

export async function fetchIpFromIpaddress(
  domain: string
): Promise<string | null> {
  const dnsProviders = [
    {
      url: (domain: string) =>
        `https://1.1.1.1/dns-query?name=${domain}&type=A`,
      headers: { Accept: "application/dns-json" },
    },
    {
      url: (domain: string) =>
        `https://dns.google/resolve?name=${domain}&type=A`,
      headers: { Accept: "application/dns-json" },
    },
  ]

  for (const provider of dnsProviders) {
    try {
      const response = await retry(() =>
        fetch(provider.url(domain), { headers: provider.headers })
      )

      if (!response.ok) continue

      const data = (await response.json()) as DnsResponse

      // 查找类型为 1 (A记录) 的答案
      const aRecord = data.Answer?.find((answer) => answer.type === 1)
      const ip = aRecord?.data

      if (ip && /^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
        return ip
      }
    } catch (error) {
      console.error(`Error with DNS provider:`, error)
      continue
    }
  }

  return null
}

export async function fetchLatestHostsData(): Promise<HostEntry[]> {
  const entries: HostEntry[] = []
  const batchSize = 5

  for (let i = 0; i < GITHUB_URLS.length; i += batchSize) {
    console.log(
      `Processing batch ${i / batchSize + 1}/${Math.ceil(
        GITHUB_URLS.length / batchSize
      )}`
    )

    const batch = GITHUB_URLS.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(async (domain) => {
        const ip = await fetchIpFromIpaddress(domain)
        console.log(`Domain: ${domain}, IP: ${ip}`)
        return ip ? ([ip, domain] as HostEntry) : null
      })
    )

    entries.push(
      ...batchResults.filter((result): result is HostEntry => result !== null)
    )

    if (i + batchSize < GITHUB_URLS.length) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  console.log(`Total entries found: ${entries.length}`)
  return entries
}

export async function getHostsData(env: Bindings): Promise<HostEntry[]> {
  // 检查是否需要更新，如果上次更新时间超过 1 小时，则更新
  const lastUpdated = (await env.github_host.get("lastUpdated", {
    type: "text",
  })) as string | null
  if (
    lastUpdated &&
    new Date(lastUpdated).getTime() + 1000 * 60 * 60 < Date.now()
  ) {
    return await resetHostsData(env)
  }

  try {
    // 从 KV 获取所有域名的数据
    const entries: HostEntry[] = []

    for (const domain of GITHUB_URLS) {
      const data = (await env.github_host.get(
        domain,
        "json"
      )) as DomainData | null
      if (data?.ip) {
        entries.push([data.ip, domain])
      }
    }

    console.log("KV data entries:", entries)

    // 如果没有数据，获取新数据并存储
    if (entries.length === 0) {
      const newEntries = await fetchLatestHostsData()
      console.log("Fetched new entries:", newEntries)
      await updateHostsData(env, newEntries)
      return newEntries
    }

    return entries
  } catch (error) {
    console.error("Error getting hosts data:", error)
    return []
  }
}

export async function updateHostsData(
  env: Bindings,
  newEntries?: HostEntry[]
): Promise<void> {
  try {
    const currentTime = new Date().toISOString()

    if (!newEntries) {
      // 只更新检查时间
      for (const domain of GITHUB_URLS) {
        const data = (await env.github_host.get(
          domain,
          "json"
        )) as DomainData | null
        if (data) {
          await env.github_host.put(
            domain,
            JSON.stringify({
              ...data,
              lastChecked: currentTime,
            })
          )
        }
      }
      return
    }

    // 更新每个域名的数据
    const updatePromises = newEntries.map(async ([ip, domain]) => {
      const oldData = (await env.github_host.get(
        domain,
        "json"
      )) as DomainData | null

      // 检查 IP 是否有变化
      const hasChanged = !oldData || oldData.ip !== ip

      const newData: DomainData = {
        ip,
        lastUpdated: hasChanged
          ? currentTime
          : oldData?.lastUpdated || currentTime,
        lastChecked: currentTime,
      }

      await env.github_host.put(domain, JSON.stringify(newData))
    })

    await Promise.all(updatePromises)
  } catch (error) {
    console.error("Error updating hosts data:", error)
  }
}

export function formatHostsFile(entries: HostEntry[]): string {
  const content = entries
    .map(([ip, domain]) => `${ip.padEnd(30)}${domain}`)
    .join("\n")

  const updateTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Shanghai",
    hour12: false,
  })

  return HOSTS_TEMPLATE.replace("{content}", content).replace(
    "{updateTime}",
    updateTime
  )
}

// 修改：获取单个域名数据的方法，直接从爬虫获取实时数据
export async function getDomainData(
  env: { github_host: KVNamespace },
  domain: string
): Promise<DomainData | null> {
  try {
    // 直接从爬虫获取最新数据
    const ip = await fetchIpFromIpaddress(domain)
    if (!ip) {
      return null
    }

    const currentTime = new Date().toISOString()
    const newData: DomainData = {
      ip,
      lastUpdated: currentTime,
      lastChecked: currentTime,
    }

    // 更新 KV 存储
    await env.github_host.put(domain, JSON.stringify(newData))
    await env.github_host.put("lastUpdated", currentTime)
    return newData
  } catch (error) {
    console.error(`Error getting data for domain ${domain}:`, error)
    return null
  }
}

// 新增：清空 KV 并重新获取所有数据
export async function resetHostsData(env: Bindings): Promise<HostEntry[]> {
  try {
    // 清空所有 KV 数据
    console.log("Clearing all KV data...")
    const deletePromises = GITHUB_URLS.map((domain) =>
      env.github_host.delete(domain)
    )
    await Promise.all(deletePromises)
    console.log("KV data cleared")

    // 重新获取所有域名的 IP
    console.log("Fetching new data...")
    const newEntries = await fetchLatestHostsData()
    console.log("New entries fetched:", newEntries)

    // 存储新数据
    await updateHostsData(env, newEntries)
    console.log("New data stored in KV")

    return newEntries
  } catch (error) {
    console.error("Error resetting hosts data:", error)
    return []
  }
}
