// 获取当前页面的基础 URL
const baseUrl = window.location.origin

function escapeHtml(str) {
  const div = document.createElement("div")
  div.textContent = str
  return div.innerHTML
}

async function copyToClipboard(btn) {
  try {
    const hostsElement = document.getElementById("hosts")
    await navigator.clipboard.writeText(hostsElement.textContent)

    const originalText = btn.textContent
    btn.textContent = "已复制"

    setTimeout(() => {
      btn.textContent = originalText
    }, 1000)
  } catch (err) {
    console.error("复制失败:", err)
  }
}

async function loadHosts() {
  const hostsElement = document.getElementById("hosts")
  try {
    const response = await fetch(`${baseUrl}/hosts`)
    if (!response.ok) throw new Error("Failed to load hosts")
    const hostsContent = await response.text()
    hostsElement.textContent = hostsContent
  } catch (error) {
    hostsElement.textContent = "加载 hosts 内容失败，请稍后重试"
    console.error("Error loading hosts:", error)
  }
}

function setupEventListeners() {
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => copyToClipboard(btn))
  })

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("response-collapse-btn")) {
      toggleCollapse(e.target)
    }

    if (e.target.closest(".response-area.collapsed")) {
      const collapseBtn = e.target
        .closest(".response-area")
        .querySelector(".response-collapse-btn")
      if (collapseBtn) {
        toggleCollapse(collapseBtn)
      }
    }
  })
}

function updateBaseUrls() {
  // 更新所有包含 ${baseUrl} 的 meta 标签
  document.querySelectorAll('meta[content*="${baseUrl}"]').forEach((meta) => {
    const content = meta.getAttribute("content")
    if (content) {
      meta.setAttribute("content", content.replace("${baseUrl}", baseUrl))
    }
  })

  // 更新 canonical 链接
  const canonicalLink = document.querySelector('link[rel="canonical"]')
  if (canonicalLink) {
    canonicalLink.setAttribute("href", baseUrl)
  }

  // 更新 Twitter Card meta 标签
  document.querySelectorAll('meta[name^="twitter:"]').forEach((meta) => {
    const content = meta.getAttribute("content")
    if (content && content.includes("${baseUrl}")) {
      meta.setAttribute("content", content.replace("${baseUrl}", baseUrl))
    }
  })

  // 更新 SwitchHosts URL
  const switchHostsUrlElement = document.getElementById("switchHostsUrl")
  if (switchHostsUrlElement) {
    switchHostsUrlElement.textContent = `${baseUrl}/hosts`
  }

  // 更新任何其他可能包含 ${baseUrl} 的元素
  document.querySelectorAll("*:not(script):not(style)").forEach((element) => {
    if (
      element.childNodes.length === 1 &&
      element.firstChild?.nodeType === Node.TEXT_NODE
    ) {
      const text = element.textContent
      if (text && text.includes("${baseUrl}")) {
        element.textContent = text.replace("${baseUrl}", baseUrl)
      }
    }
  })
}

window.addEventListener("load", () => {
  updateBaseUrls()
  loadHosts()
  setupEventListeners()
})
