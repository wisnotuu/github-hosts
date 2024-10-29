import { Bindings } from "./types"
import { getHostsData } from "./services/hosts"

export async function handleSchedule(
  event: ScheduledEvent,
  env: Bindings
): Promise<void> {
  console.log("Running scheduled task...")

  try {
    // 获取最新的 hosts 数据
    await getHostsData(env)

    console.log("Scheduled task completed successfully")
  } catch (error) {
    console.error("Error in scheduled task:", error)
  }
}
