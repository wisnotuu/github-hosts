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
  // 更新所有包含 ${baseUrl} 的元素
  document.querySelectorAll('meta[property^="og:"]').forEach((meta) => {
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
}

window.addEventListener("load", () => {
  updateBaseUrls()
  loadHosts()
  setupEventListeners()
})
