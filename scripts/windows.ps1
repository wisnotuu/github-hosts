# 检查管理员权限
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    Exit
}

# Banner 显示
Write-Host @"
    _______ __  __          __    __          __
   / ____(_) /_/ /_  __  __/ /_  / /_  ____  / /_
  / / __/ / __/ __ \/ / / / __ \/ __ \/ __ \/ __/
 / /_/ / / /_/ / / / /_/ / / / / /_/ / /_/ / /_
 \____/_/\__/_/ /_/\__,_/_/ /_/\____/\____/\__/

 GitHub Hosts Manager - https://github.com/TinsFox/github-host
"@ -ForegroundColor Cyan

# 定义常量
$HOSTS_API = "https://github-host.tinsfox.com/hosts"
$BASE_DIR = "$env:USERPROFILE\.github-hosts"
$CONFIG_FILE = "$BASE_DIR\config.json"
$BACKUP_DIR = "$BASE_DIR\backups"
$LOG_DIR = "$BASE_DIR\logs"
$HOSTS_FILE = "$env:windir\System32\drivers\etc\hosts"
$TASK_NAME = "GitHub Hosts Updater"

# 创建必要的目录
function Setup-Directories {
    New-Item -ItemType Directory -Force -Path $BASE_DIR, $BACKUP_DIR, $LOG_DIR | Out-Null
}

# 备份 hosts 文件
function Backup-HostsFile {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    Copy-Item $HOSTS_FILE "$BACKUP_DIR\hosts_$timestamp"
    Write-Host "已备份 hosts 文件到 $BACKUP_DIR\hosts_$timestamp"
}

# 还原最近的备份
function Restore-LatestBackup {
    $latest = Get-ChildItem $BACKUP_DIR | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latest) {
        Copy-Item $latest.FullName $HOSTS_FILE
        Write-Host "已还原到最近的备份: $($latest.Name)"
    } else {
        Write-Host "没有找到可用的备份"
    }
}

# 更新 hosts 文件
function Update-HostsFile {
    Write-Host "`n开始更新 hosts 文件..." -ForegroundColor Yellow
    $retryCount = 0
    $maxRetries = 3
    $tempFile = [System.IO.Path]::GetTempFileName()

    while ($retryCount -lt $maxRetries) {
        try {
            Write-Host "正在从服务器获取最新的 hosts 数据..." -ForegroundColor Cyan
            $response = Invoke-WebRequest -Uri $HOSTS_API -OutFile $tempFile
            if ((Get-Item $tempFile).Length -gt 0) {
                Write-Host "✓ 成功获取最新数据" -ForegroundColor Green

                Write-Host "正在备份当前 hosts 文件..." -ForegroundColor Cyan
                Backup-HostsFile

                Write-Host "正在更新 hosts 文件..." -ForegroundColor Cyan
                Get-Content $tempFile | Add-Content $HOSTS_FILE
                Remove-Item $tempFile -Force

                Write-Host "正在刷新 DNS 缓存..." -ForegroundColor Cyan
                ipconfig /flushdns | Out-Null
                Write-Host "✓ DNS 缓存已刷新" -ForegroundColor Green

                # 发送系统通知
                [System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms')
                $global:balloon = New-Object System.Windows.Forms.NotifyIcon
                $balloon.Icon = [System.Drawing.SystemIcons]::Information
                $balloon.Visible = $true
                $balloon.ShowBalloonTip(5000, 'GitHub Hosts', 'hosts 文件已更新', [System.Windows.Forms.ToolTipIcon]::Info)

                Write-Host "✅ hosts 文件更新成功！" -ForegroundColor Green
                return $true
            }
        } catch {
            $retryCount++
            Write-Host "❌ 更新失败 (尝试 $retryCount/$maxRetries)" -ForegroundColor Red
            Write-Host "等待 10 秒后重试..." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
            continue
        }
    }

    Write-Host "❌ 更新失败：已达到最大重试次数" -ForegroundColor Red
    return $false
}

# 更新配置文件
function Update-Config {
    param($interval)

    $config = @{
        updateInterval = $interval
        lastUpdate = (Get-Date).ToUniversalTime().ToString("o")
        version = "1.0.0"
    }

    $config | ConvertTo-Json | Set-Content $CONFIG_FILE
}

# 设置计划任务
function Setup-ScheduledTask {
    param($interval)

    $action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
        -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$BASE_DIR\update.ps1`""

    $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) `
        -RepetitionInterval (New-TimeSpan -Minutes $interval)

    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -Hidden

    # 创建更新脚本
    @"
# 设置日志文件
$TZ = [System.TimeZoneInfo]::FindSystemTimeZoneById("China Standard Time")
$CurrentTime = [System.TimeZoneInfo]::ConvertTimeFromUtc([datetime]::UtcNow, $TZ)
$LogFile = "$env:USERPROFILE\.github-hosts\logs\update_$($CurrentTime.ToString('yyyyMMdd')).log"
$Timestamp = $CurrentTime.ToString("yyyy-MM-dd HH:mm:ss")

# 日志函数
function Write-Log {
    param($Message)
    $CurrentTime = [System.TimeZoneInfo]::ConvertTimeFromUtc([datetime]::UtcNow, $TZ)
    $Timestamp = $CurrentTime.ToString("yyyy-MM-dd HH:mm:ss")
    $LogMessage = "[$Timestamp] $Message"
    Add-Content -Path $LogFile -Value $LogMessage
    Write-Host $LogMessage
}

Write-Log "开始更新 hosts 文件..."

# 重试逻辑
$RetryCount = 0
$MaxRetries = 3
$Success = $false

while ($RetryCount -lt $MaxRetries -and -not $Success) {
    try {
        Write-Log "尝试从服务器获取最新的 hosts 数据... (尝试 $(($RetryCount + 1))/$MaxRetries)"

        $Response = Invoke-WebRequest -Uri "$HOSTS_API" -ErrorAction Stop
        if ($Response.StatusCode -eq 200) {
            # 备份当前 hosts 文件
            $BackupFile = "$HOSTS_FILE.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
            Copy-Item -Path "$HOSTS_FILE" -Destination $BackupFile
            Write-Log "已备份 hosts 文件到 $BackupFile"

            # 更新 hosts 文件
            Add-Content -Path "$HOSTS_FILE" -Value $Response.Content
            Write-Log "hosts 文件已更新"

            # 刷新 DNS 缓存
            ipconfig /flushdns | Out-Null
            Write-Log "已刷新 DNS 缓存"

            Write-Log "更新完成"
            $Success = $true
        } else {
            Write-Log "错误: 服务器返回状态码 $(($Response.StatusCode))"
        }
    } catch {
        Write-Log "错误: $(($_.Exception.Message))"
        $RetryCount++
        if ($RetryCount -lt $MaxRetries) {
            Write-Log "等待 10 秒后重试..."
            Start-Sleep -Seconds 10
        }
    }
}

if (-not $Success) {
    Write-Log "错误: 更新失败，已达到最大重试次数"
    exit 1
}
"@ | Set-Content "$BASE_DIR\update.ps1"

    # 注册计划任务
    Register-ScheduledTask -TaskName $TASK_NAME -Action $action -Trigger $trigger `
        -Principal $principal -Settings $settings -Force | Out-Null
}

# 卸载函数
function Uninstall-GitHubHosts {
    Write-Host "正在卸载 GitHub Hosts..."

    # 删除计划任务
    Unregister-ScheduledTask -TaskName $TASK_NAME -Confirm:$false -ErrorAction SilentlyContinue

    # 还原最近的备份
    Restore-LatestBackup

    # 删除程序文件
    Remove-Item -Path $BASE_DIR -Recurse -Force -ErrorAction SilentlyContinue

    Write-Host "卸载完成"
    Exit
}

# 主菜单
function Show-MainMenu {
    Write-Host "`n请选择操作："
    Write-Host "1. 安装"
    Write-Host "2. 卸载"
    $choice = Read-Host "请输入选项 (1-2)"

    switch ($choice) {
        "1" { Show-InstallMenu }
        "2" { Uninstall-GitHubHosts }
        default { Write-Host "无效的选项"; Exit 1 }
    }
}

# 安装菜单
function Show-InstallMenu {
    Write-Host "`n请选择更新间隔："
    Write-Host "1. 每 30 分钟"
    Write-Host "2. 每 60 分钟"
    Write-Host "3. 每 120 分钟"
    $intervalChoice = Read-Host "请输入选项 (1-3)"

    $interval = switch ($intervalChoice) {
        "1" { 30 }
        "2" { 60 }
        "3" { 120 }
        default { Write-Host "无效的选项" -ForegroundColor Red; Exit 1 }
    }

    Write-Host "`n开始安装 GitHub Hosts..." -ForegroundColor Yellow

    Write-Host "1/4 创建必要的目录结构..." -ForegroundColor Cyan
    Setup-Directories
    Write-Host "✓ 目录创建完成" -ForegroundColor Green

    Write-Host "2/4 更新配置文件..." -ForegroundColor Cyan
    Update-Config $interval
    Write-Host "✓ 配置更新完成" -ForegroundColor Green

    Write-Host "3/4 更新 hosts 文件..." -ForegroundColor Cyan
    Update-HostsFile

    Write-Host "4/4 设置定时更新任务..." -ForegroundColor Cyan
    Setup-ScheduledTask $interval
    Write-Host "✓ 定时任务设置完成" -ForegroundColor Green

    Write-Host "`n🎉 安装完成！" -ForegroundColor Green
    Write-Host "• GitHub Hosts 将每 $interval 分钟自动更新一次"
    Write-Host "• 配置文件位置：$CONFIG_FILE"
    Write-Host "• 日志文件位置：$LOG_DIR\update.log"
    Write-Host "• 备份文件位置：$BACKUP_DIR"

    # 添加以下内容
    Write-Host "`n当前 hosts 文件内容：" -ForegroundColor Cyan
    Write-Host "----------------------------------------"
    # 使用 Select-String 显示包含 github 的行，忽略大小写
    $githubHosts = Get-Content $HOSTS_FILE | Select-String -Pattern "github" -CaseSensitive:$false
    if ($githubHosts) {
        $githubHosts | ForEach-Object { Write-Host $_ }
    } else {
        Write-Host "未找到 GitHub 相关记录" -ForegroundColor Yellow
    }
    Write-Host "----------------------------------------"
    Write-Host "提示：如果看到以上 GitHub 相关的 hosts 记录，说明安装成功！" -ForegroundColor Green
}

# 运行主菜单
Show-MainMenu