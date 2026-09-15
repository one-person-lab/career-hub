---
title: "Nginx"
source: https://www.yuque.com/<your-namespace>/yez2nd/rnmnsq1rbyq7s2cf
group: "04云原生与运维"
word_count: 1386
updated_at: 2025-02-22T04:23:14.000Z
fetched_at: 2026-09-11T09:34:51.483Z
---

# Nginx

#### **部署Nginx**

安装包部署

下载压缩包 wget http://nginx.org/download/nginx-1.24.0.tar.gz tar -zxvf nginx-1.24.0.tar.gz 配置、编译和安装Nginx ./configure make sudo make install

docker部署

docker pull nginx:1.24.0

#### **基础知识**

查看openresty的Nginx版本

nginx -v

```
server {
    allow 192.168.1.x;
    deny all;0
}
```

```
server {
    try_files $uri $uri/ /index.html;
}
```

#### **配置结构**

http { upstream xxx { keeplive } server { location xxx { } } }

对于后端服务器的连接，upstream块的配置优先考虑

对于客户端连接，首先查看location，其次是server，最后是http

#### **性能配置**

当请求量到一定数量，会直接返回502

查看nginx配置

worker\_processes 8; events { use epoll; worker\_connections 65535; }

#### **常用命令**

刷新Nginx配置

docker exec openresty nginx -t docker exec openresty nginx -s reload

Hexo 个人博客

## **静态资源服务器**

当客户端第一次请求静态资源的时候，会从服务器直接返回，Nginx 同时也会缓存一份静态资源。如果后续客户端请求相同的静态资源，只要对应的缓存未被清理目没有过期，就可以直接从 Nginx 缓存中取出返回给客户端了。

## **反向代理**

客户端将请求发送到反向代理服务器，由反向代理服务器去选择目标服务器，获取数据后再返回给客户端。对外暴露的是反向代理服务器地址，隐藏了真实服务器 IP 地址。

反向代理隐藏了真实的服务器，为服务器收发请求，使真实服务器对客户端不可见。一般在处理跨域请求的时候比较常用。现在基本上所有的大型网站都设置了反向代理。

Nginx 支持配置反向代理，通过反向代理实现网站的负载均衡。

Nginx 为什么适合做负载均衡呢？我简单总结了下面几方面主要原因：

Nginx 属于软件负载均衡，相比于硬件负载均衡来说，价格非常低廉，一个较低配置的服务器即可满足。

Nginx 使用简单，上手比较快，

Nginx基于C语言的实现，性能非常好。一般情况下，10000个非活跃的 HTTP Keep-Alive 连接在Nginx 中仅消耗 2.5MB 的内存，这是 Nginx 支持高并发连接的基础。并且，Nginx 单机支持 10 万以上的并发连接。

Nginx 自带 健康检查(服务器心跳检查)功能，会定期轮询向集群里的所有服务器发送健康检查请求，来检查集群中是否有服务器处于异常状态

Nginx 支持热部署，我们可以在不间断服务的情况下，升级 Nginx，这对于服务的高可用具有重大意

义。

Nginx 支持多种负载均衡策略比如轮询(Round Robin，默认)、IP 哈希、最小连接数。

-   nginx安全策略

使用Nginx限速模块

使用Nginx限连接数

使用IP黑名单

## **负载均衡算法**

随机法：所有服务器被访问到的概率都是相同的，可以根据服务器性能适当调整权重。

轮询法：挨个服务器访问，能保证每个服务器都能被访问到，也可以根据服务器性能适当调整权重。

加权轮询：加权轮询算法适合于服务器性能不等的集群，权重的存在可以使请求分配更加合理化。

IP哈希法：相同参数的请求总是访问同一台服务器，比如同个IP的请求，该算法在一定程度上解决了集群部署环境下 Session 不共享的问题。

最小连接法：请求当前请求连接数最小的服务器，实现上比较复杂。

## **Nginx 性能优化的常见方式**

设置 Nginx 运行工作进程个数:一般设置 CPU 的核心数或者核心数 x2;

开启 Gzip 压缩:这样可以使网站的图片、CSS、」S 等文件在传输时进行压缩，提高访问速度,优化Nginx 性能。

设置单个 worker 进程允许客户端最大连接数:一般设置为 65535 就足够了;

连接超时时间设置:避免在建立无用连接上消耗太多资源;

设置缓存:像图片、CSS、1S 等这类一般不会经常修改的文件，我们完全可以设置图片在浏览器本地缓存，提高访问速度，优化 Nginx 性能。

## **如何保证 Nginx 服务的高可用**

再来简单介绍-下 Keepalived+Nginx 实现高可用的常见方法:

1.准备 2 台 Nginx 服务器，一台为主服务，一台为备用服务;

2.在两台 Nginx 服务器上安装并配置 Keepalived;

3.为两台 Nginx 服务器绑定同一个虚拟IP;

4.编写 Nginx 检测脚本用于通过 Keepalived 检测 Nginx 主服务器的状态是否正常

如果 Nginx 主服务器宕机的话，会自动进行故障转移，备用 Nginx 主服务器升级为主服务。并且，这个切换对外是透明的，因为使用的虚拟IP，虚拟IP 不会改变。
