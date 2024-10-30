#!/bin/bash

# Banner 显示
echo '
    _______ __  __          __    __          __
   / ____(_) /_/ /_  __  __/ /_  / /_  ____  / /_
  / / __/ / __/ __ \/ / / / __ \/ __ \/ __ \/ __/
 / /_/ / / /_/ / / / /_/ / / / / /_/ / /_/ / /_
 \____/_/\__/_/ /_/\__,_/_/ /_/\____/\____/\__/

 GitHub Hosts Manager - https://github.com/TinsFox/github-host
'

# 检查是否有 root 权限
if [ "$EUID" -ne 0 ]; then
    echo "请使用 sudo 运行此脚本"
    exit 1
fi

# 定义常量
HOSTS_API="https://github-host.tinsfox.com/hosts"
BASE_DIR="$HOME/.github-hosts"
CONFIG_FILE="$BASE_DIR/config.json"
BACKUP_DIR="$BASE_DIR/backups"
LOG_DIR="$BASE_DIR/logs"
HOSTS_FILE="/etc/hosts"
CRON_FILE="/etc/cron.d/github-hosts"

# 创建必要的目录
setup_directories() {
    mkdir -p "$BASE_DIR" "$BACKUP_DIR" "$LOG_DIR"
    chmod 755 "$BASE_DIR"
}

# 备份 hosts 文件
backup_hosts() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    cp "$HOSTS_FILE" "$BACKUP_DIR/hosts_$timestamp"
    echo "已备份 hosts 文件到 $BACKUP_DIR/hosts_$timestamp"
}

# 还原最近的备份
restore_latest_backup() {
    local latest_backup=$(ls -t "$BACKUP_DIR" | head -n 1)
    if [ -n "$latest_backup" ]; then
        cp "$BACKUP_DIR/$latest_backup" "$HOSTS_FILE"
        echo "已还原到最近的备份: $latest_backup"
    else
        echo "没有找到可用的备份"
    fi
}

# 更新 hosts 文件
update_hosts() {
    echo "开始更新 hosts 文件..."
    local temp_file=$(mktemp)
    local retry_count=0
    local max_retries=3

    while [ $retry_count -lt $max_retries ]; do
        echo "正在从服务器获取最新的 hosts 数据..."
        if curl -fsSL "$HOSTS_API" > "$temp_file"; then
            if [ -s "$temp_file" ] && ! grep -q "error" "$temp_file"; then
                echo "✓ 成功获取最新数据"
                echo "正在备份当前 hosts 文件..."
                backup_hosts
                echo "正在更新 hosts 文件..."
                cat "$temp_file" >> "$HOSTS_FILE"
                rm "$temp_file"

                echo "正在刷新 DNS 缓存..."
                if [ "$(uname)" == "Darwin" ]; then
                    killall -HUP mDNSResponder
                else
                    systemd-resolve --flush-caches || systemctl restart systemd-resolved
                fi

                echo "✓ DNS 缓存已刷新"

                # 发送系统通知
                if [ "$(uname)" == "Darwin" ]; then
                    osascript -e 'display notification "GitHub Hosts 已更新" with title "GitHub Hosts"'
                else
                    which notify-send >/dev/null && notify-send "GitHub Hosts" "hosts 文件已更新"
                fi

                echo "✅ hosts 文件更新成功！"
                return 0
            fi
        fi

        retry_count=$((retry_count + 1))
        echo "❌ 更新失败 (尝试 $retry_count/$max_retries)"
        echo "等待 10 秒后重试..."
        sleep 10
    done

    echo "❌ 更新失败：已达到最大重试次数"
    return 1
}

# 创建或更新配置文件
update_config() {
    local interval=$1
    cat > "$CONFIG_FILE" << EOF
{
    "updateInterval": $interval,
    "lastUpdate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "version": "1.0.0"
}
EOF
}

# 设置定时任务
setup_cron() {
    local interval=$1
    local cron_schedule

    case $interval in
        30) cron_schedule="*/30 * * * *" ;;
        60) cron_schedule="0 * * * *" ;;
        120) cron_schedule="0 */2 * * *" ;;
        *) echo "无效的时间间隔"; return 1 ;;
    esac

    # 创建定时任务脚本
    cat > "$BASE_DIR/update.sh" << 'EOF'
#!/bin/bash

# 设置日志文件
LOG_FILE="$HOME/.github-hosts/logs/update_$(TZ='Asia/Shanghai' date '+%Y%m%d').log"
TIMESTAMP=$(TZ='Asia/Shanghai' date '+%Y-%m-%d %H:%M:%S')

# 日志函数
log() {
    echo "[$TIMESTAMP] $1" >> "$LOG_FILE"
}

log "开始更新 hosts 文件..."

# 创建临时文件
TEMP_FILE=$(mktemp)
RETRY_COUNT=0
MAX_RETRIES=3

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    log "尝试从服务器获取最新的 hosts 数据... (尝试 $((RETRY_COUNT + 1))/$MAX_RETRIES)"

    if curl -fsSL "https://github-host.tinsfox.com/hosts" > "$TEMP_FILE" 2>> "$LOG_FILE"; then
        if [ -s "$TEMP_FILE" ] && ! grep -q "error" "$TEMP_FILE"; then
            log "成功获取最新数据"

            # 备份当前 hosts 文件
            BACKUP_FILE="/etc/hosts.backup_$(date +%Y%m%d_%H%M%S)"
            cp /etc/hosts "$BACKUP_FILE"
            log "已备份 hosts 文件到 $BACKUP_FILE"

            # 更新 hosts 文件
            cat "$TEMP_FILE" >> /etc/hosts
            log "hosts 文件已更新"

            # 清理临时文件
            rm -f "$TEMP_FILE"

            # 刷新 DNS 缓存
            if [ "$(uname)" == "Darwin" ]; then
                killall -HUP mDNSResponder
                log "已刷新 MacOS DNS 缓存"
            else
                if systemd-resolve --flush-caches; then
                    log "已刷新 Linux DNS 缓存 (systemd-resolve)"
                elif systemctl restart systemd-resolved; then
                    log "已重启 systemd-resolved 服务"
                else
                    log "警告: 无法刷新 DNS 缓存"
                fi
            fi

            log "更新完成"
            exit 0
        else
            log "错误: 获取到的数据无效或包含错误"
        fi
    else
        log "错误: 无法从服务器获取数据"
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        log "等待 10 秒后重试..."
        sleep 10
    fi
done

log "错误: 更新失败，已达到最大重试次数"
exit 1
EOF

    chmod +x "$BASE_DIR/update.sh"

    # 设置定时任务
    echo "$cron_schedule root $BASE_DIR/update.sh > $LOG_DIR/update.log 2>&1" > "$CRON_FILE"
    chmod 644 "$CRON_FILE"

    # 重启 cron 服务
    if [ "$(uname)" == "Darwin" ]; then
        launchctl unload ~/Library/LaunchAgents/com.github.hosts.plist 2>/dev/null || true
        cat > ~/Library/LaunchAgents/com.github.hosts.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.github.hosts</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>$BASE_DIR/update.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>$((interval * 60))</integer>
</dict>
</plist>
EOF
        launchctl load ~/Library/LaunchAgents/com.github.hosts.plist
    else
        systemctl restart cron
    fi
}

# 卸载函数
uninstall() {
    echo "正在卸载 GitHub Hosts..."

    # 删除定时任务
    if [ "$(uname)" == "Darwin" ]; then
        launchctl unload ~/Library/LaunchAgents/com.github.hosts.plist 2>/dev/null
        rm -f ~/Library/LaunchAgents/com.github.hosts.plist
    else
        rm -f "$CRON_FILE"
    fi

    # 还原最近的备份
    restore_latest_backup

    # 删除程序文件
    rm -rf "$BASE_DIR"

    echo "卸载完成"
    exit 0
}

# 主菜单
main_menu() {
    echo "请选择操作："
    echo "1. 安装"
    echo "2. 卸载"
    read -p "请输入选项 (1-2): " choice

    case $choice in
        1) install_menu ;;
        2) uninstall ;;
        *) echo "无效的选项"; exit 1 ;;
    esac
}

# 安装菜单
install_menu() {
    echo "请选择更新间隔："
    echo "1. 每 30 分钟"
    echo "2. 每 60 分钟"
    echo "3. 每 120 分钟"
    read -p "请输入选项 (1-3): " interval_choice

    local interval
    case $interval_choice in
        1) interval=30 ;;
        2) interval=60 ;;
        3) interval=120 ;;
        *) echo "无效的选项"; exit 1 ;;
    esac

    echo -e "\n开始安装 GitHub Hosts..."
    echo "1/4 创建必要的目录结构..."
    setup_directories
    echo "✓ 目录创建完成"

    echo "2/4 更新配置文件..."
    update_config "$interval"
    echo "✓ 配置更新完成"

    echo "3/4 更新 hosts 文件..."
    update_hosts

    echo "4/4 设置定时更新任务..."
    setup_cron "$interval"
    echo "✓ 定时任务设置完成"

    echo -e "\n🎉 安装完成！"
    echo "• GitHub Hosts 将每 $interval 分钟自动更新一次"
    echo "• 配置文件位置：$CONFIG_FILE"
    echo "• 日志文件位置：$LOG_DIR/update.log"
    echo "• 备份文件位置：$BACKUP_DIR"

    echo -e "\n当前 hosts 文件内容："
    echo "----------------------------------------"
    # 使用 grep 显示包含 github 的行，忽略大小写
    grep -i "github" "$HOSTS_FILE" || echo "未找到 GitHub 相关记录"
    echo "----------------------------------------"
    echo "提示：如果看到以上 GitHub 相关的 hosts 记录，说明安装成功！"
}

# 运行主菜单
main_menu