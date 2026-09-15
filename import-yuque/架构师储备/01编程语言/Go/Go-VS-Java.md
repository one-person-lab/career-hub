---
title: "Go VS Java"
source: https://www.yuque.com/<your-namespace>/yez2nd/vhmoqtcm5l292yzn
group: "01编程语言 / Go"
word_count: 272
updated_at: 2025-04-08T01:30:47.000Z
fetched_at: 2026-09-11T09:34:51.483Z
---

# Go VS Java

## 指针

指针是用来存储变量内存地址的变量。`&`用于获取变量的地址，而`*`用于访问该地址指向的值。

## 编译与运行

-   **Go**：编译型语言，生成独立的二进制文件，不需要额外运行时。
-   **Java**：运行在JVM上，需依赖JRE。

## 并发模型

-   **Go**：通过Goroutine和Channel实现轻量级并发，调度由Go runtime管理。
-   **Java**：通过Thread实现并发，线程较重，需手动调度。

## 内存管理

-   **Go**：有自动垃圾回收，但没有`try-catch-finally`，使用`defer`处理资源释放。
-   **Java**：依赖JVM的垃圾回收机制，支持异常处理。

## 开发效率

-   **Go**：语法简洁，代码量少，适合快速开发。
-   **Java**：语法相对复杂，需更多样板代码。

## 生态与工具

-   **Go**：标准库功能强大，但第三方库较少。
-   **Java**：生态系统成熟，第三方库丰富。
