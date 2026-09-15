---
title: "Linux"
source: https://www.yuque.com/<your-namespace>/yez2nd/szq56vqs0zargfrw
group: "04云原生与运维"
word_count: 246
updated_at: 2025-12-30T08:29:37.000Z
fetched_at: 2026-09-11T09:34:51.483Z
---

# Linux

# 日志命令

```
# 过滤日志
grep storage_config_get example.log

# 查看实时日志
tail -f example.log
tail -f example.log | grep osd

# 查看日志最后 50 行
tail -n 50 example.log   

# 按时间范围查看 (awk)
awk '$0 >= "2025-03-11 10:00:00" && $0 <= "2025-03-11 12:00:00"' example.log
grep 10:00 example.log

# 清空日志
sudo > /www/wwwlogs/java/springboot/yudao_server_jar.log
```

### 通过 `less` 翻页查看（推荐）

```
less example.log
```

使用快捷键：

-   `↑/↓`：上下滚动
-   `Space`：向下翻页
-   `b`：向上翻页
-   `/关键字`：搜索
-   `n` / `N`：查找下一个 / 上一个匹配项
-   `q`：退出
-   `**g**`：跳转到文件开头
-   `**G**`：跳转到文件结尾（等效于 `less +G example.log`）

# 文件命令

```
# 查找文件
sudo find / -name service_delete.sh
```

# 授权命令

```
# 文件夹授权
chmod a+x exampleDir

# 查看文件夹的权限
ls -ld exampleDir

# 修改目录的所有者
sudo chown -R anuser:anuser /home/docker
```

# 时间调整

```
# 使用 date 命令直接设置时间：
sudo date -s "HH:MM:SS"

date

timedatectl status
```
