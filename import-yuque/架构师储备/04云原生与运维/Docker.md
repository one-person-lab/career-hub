---
title: "Docker"
source: https://www.yuque.com/<your-namespace>/yez2nd/kk8fybwmkvq20oem
group: "04云原生与运维"
word_count: 1089
updated_at: 2025-09-03T10:27:24.000Z
fetched_at: 2026-09-11T09:34:51.483Z
---

# Docker

Docker 是一种开源的容器化平台，允许开发者在轻量级、隔离的环境中打包、分发和运行应用程序。它解决了 "运行在我机器上但无法运行在其他机器上" 的问题，极大地提高了开发、测试和部署的效率。

# 核心概念

镜像（Image）:

-   Docker 镜像是只读的模板，用于创建容器。
-   类似于操作系统的快照，包含了应用程序、运行时环境、库及配置文件。

容器（Container）:

-   容器是镜像的运行实例，轻量级、隔离性好。
-   容器共享主机的内核，具有自己的进程、网络空间和文件系统。

Dockerfile:

-   构建 Docker 镜像的脚本文件，包含指令（如安装依赖、复制文件、执行命令等）。
-   通过 docker build 命令基于 Dockerfile 创建镜像。

Docker Hub:

-   官方的镜像仓库，用于存储和分发镜像。
-   也可以部署私有镜像仓库（如 Harbor）。

Volume（数据卷）:

-   持久化存储，用于容器间共享数据或将数据保存到主机。

网络（Network）:

-   Docker 提供多种网络模式`bridge`（默认）、`host`（共享主机网络）、`none`（无网络）、`overlay`（跨主机通信），支持容器间通信。

Docker Compose:

-   用于定义和管理多容器应用。
-   配置文件为 docker-compose.yml，通过 docker-compose up 启动。

1.使用多阶段构建：使用多阶段构建可以减少镜像的大小，因为你可以在不同的镜像中执行不同的构建步骤，并在最终镜像中只保留必要的文件和依赖。

2.清理不需要的文件和依赖：在Dockerfile中，你可以使用一系列命令来清理不需要的文件和依赖，例如使用rm命令删除不需要的文件，使用--no-cache选项来清理缓存等。

3.使用轻量的基础镜像：选择一个轻量的基础镜像作为你的镜像的基础，这样可以减少镜像的大小。

4.合并镜像层：在Dockerfile中，你可以使用多个命令来合并多个操作，这样可以减少镜像的层数和大小。

5.我们应该把变化最少的部分放在 Dockerfile 的前面，将经常变化的内容放在最后面，这样可以充分利用镜像缓存。

最后在网上找到一些其他的优化手段，在这里汇总一下：

-   编写.dockerignore 文件
-   容器只运行单个应用
-   将多个 RUN 指令合并为一个
-   基础镜像的标签不要用 latest
-   每个 RUN 指令后删除多余文件
-   选择合适的基础镜像(alpine 版本最好)
-   设置 WORKDIR 和 CMD
-   使用 ENTRYPOINT (可选)
-   在 entrypoint 脚本中使用 exec
-   COPY 与 ADD 优先使用前者
-   合理调整 COPY 与 RUN 的顺序
-   设置默认的环境变量，映射端口和数据卷
-   使用 LABEL 设置镜像元数据
-   添加 HEALTHCHECK

​  

# 常用命令

```
# 进入容器
docker exec -it xxx /bin/bash

# 查看容器的compose文件
docker insepct xxx

# 导出docker容器文件
docker cp <container_id>:/path/to/container/file /path/on/host

# 给镜像加标签
docker tag <image_id> <new_name>:<new_tag>

# 导出导入镜像
docker save -o myimage.tar myimage:latest
docker load -i myimage.tar
docker images

# 重启所有正在运行容器
docker restart $(docker ps -q)

# 创建网络
docker network create ff-bridge-network
```

​  

```
# 执行升级脚本
docker exec -i mysql8 mysql -u<db-user> -p<db-password> example_db < data_upgrade.sql
```

  

```
# 通过compose文件启动
docker-compose -f docker-compose.yml up -d
```

  

```
version: '3.1'
networks:
  ff-bridge-network:
    external: true

services:
  mysql:
    image: mysql:8.0.29
    container_name: mysql8
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: <your-password>
    command:
      --default-authentication-plugin=mysql_native_password
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_general_ci
      --explicit_defaults_for_timestamp=true
      --skip-name-resolve
      --max_allowed_packet=128M
      --max_connections=10240
      --thread_cache_size=64
      --sort_buffer_size=16M
      --lower_case_table_names=1
      --federated
    ports:
      # <宿主机端口>:<容器内端口>
      - 3306:3306
    volumes:
      # <宿主机目录>:<容器内目录>
      - ./mysql/data:/var/lib/mysql
      - ./mysql/my.cnf:/etc/my.cnf
      - ./mysql/logs:/logs
      - /etc/localtime:/etc/localtime:ro
    networks:
      - ff-bridge-network

  redis:
    image: redis:5.0.7
    container_name: ffredis
    restart: always
    command: redis-server /etc/redis.conf # 启动redis命令
    privileged: true
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - /etc/localtime:/etc/localtime:ro # 设置容器时区与宿主机保持一致
      - ./redis/data:/data
      - ./redis/redis.conf:/etc/redis.conf
    ports:
      - "6379:6379"
    networks:
      - ff-bridge-network
```
