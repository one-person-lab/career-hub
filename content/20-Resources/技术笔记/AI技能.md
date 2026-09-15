---
title: "AI技能"
source: https://www.yuque.com/<your-namespace>/yft77g/rp8z9t4bbovl5m19
yuque_type: Doc
word_count: 325
updated_at: 2026-09-09T09:22:50.000Z
fetched_at: 2026-09-11T04:13:45.903Z
---

# AI技能

# SSH

部署

操作数据库

# MCP

### MYSQL MCP

powershell -ExecutionPolicy ByPass -c "irm [https://astral.sh/uv/install.ps1](https://astral.sh/uv/install.ps1) | iex"

安装mysql mcp（ Windows 安全中心 实时保护需要关闭）

uv tool install mcp-server-mysql

### SSH MCP

1.  需要在本地生成 id\_ed25519 密钥

```
ssh-keygen -t ed25519 -f "$HOME\.ssh\id_ed25519" -C "user@example-host"
```

2.  把公钥添加到服务器

用密码登录服务器并执行：

```
ssh root@your-server-ip
# 输入密码：<your-password>

# 第一次在服务器上执行：
mkdir -p ~/.ssh
echo "ssh-ed25519 AAAA...(your-public-key) user@example-host" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
exit

# 追加公钥，公钥在这个文件 id_ed25519.pub
type $HOME\.ssh\id_ed25519.pub | ssh root@your-server-ip "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

3.  创建 SSH 配置文件

在本地 PowerShell 执行：

```
@"
Host example-server
    HostName your-server-ip
    Port 22
    User root
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
"@ | Out-File -FilePath $HOME/.ssh/config -Encoding UTF8

@"
Host example-server
    HostName your-server-ip
    Port 22
    User root
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
"@ | Out-File -FilePath "$HOME/.ssh/config" -Encoding UTF8

Host example-server
    HostName your-server-ip
    User root
    Port 22
    IdentityFile C:\Users\<user>\.ssh\id_rsa
```

4.  测试 SSH 连接

```
ssh example-server
```

如果能免密登录，说明配置成功！

5.  重启 Kiro

配置完成后重启 Kiro，SSH MCP Server 就可以使用了！

之后你就可以直接对我说：

"列出 SSH 主机"

"在 example-server 上执行 ps aux | grep example"

"上传文件到服务器"

"查看服务器日志"

# 生图

  

  

## Lottie

### 动画设计

[https://lottiefiles.com/](https://lottiefiles.com/)
