---
title: "Go基础"
source: https://www.yuque.com/<your-namespace>/yez2nd/gbdxbgrnifsldzb2
group: "01编程语言 / Go"
word_count: 783
updated_at: 2025-08-29T14:33:26.000Z
fetched_at: 2026-09-11T09:34:51.483Z
---

# Go基础

# Go介绍

Golang 是2012 年 Google 开源的编程语言。

-   **简洁高效**：语法简单、编译速度快，便于快速开发。
-   **并发支持**：原生支持并发编程，提供了Goroutine和Channel。
-   **强大的标准库**：内置了丰富的库，涵盖网络、文件操作等常见需求。
-   **跨平台**：支持多种操作系统，编译后生成的二进制文件无需依赖额外运行环境。

# 环境搭建

### 安装Go语言环境

1.  下载Go语言：访问[Go官网](https://golang.org/dl/)，选择适合操作系统的安装包。
2.  安装：按照安装向导完成安装。
3.  验证安装：

```
go version
```

确保输出Go语言的版本信息。

### 配置环境变量

1.  设置`GOPATH`和工作目录（默认值为`$HOME/go`）。
2.  确保`GOROOT`和`PATH`已正确配置。

### 编辑器推荐

-   推荐使用[VS Code](https://code.visualstudio.com/)并安装以下插件：

-   `Go`插件：提供语法高亮、代码补全等功能。
-   `Go Test Explorer`：便于运行单元测试。

# Go运行

```
go run main.go
```

# 基础语法

## Hello World程序

第一个Go程序：

```
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
```

## 变量和常量

-   变量声明：

```
var name string = "Go"
age := 10 // 简短声明
```

-   常量声明：

```
const pi = 3.14
```

## 数据类型

-   基本类型：

-   整型：`int`, `uint`
-   浮点型：`float32`, `float64`
-   布尔型：`bool`
-   字符串：`string`

-   复合类型：

-   数组：`[5]int`
-   切片：`[]int`
-   映射：`map[string]int`
-   结构体：

```
type Person struct {
    Name string
    Age  int
}
```

## 控制流程

-   条件语句：

```
if x > 10 {
    fmt.Println("x大于10")
} else {
    fmt.Println("x小于或等于10")
}
```

-   循环语句：

```
for i := 0; i < 5; i++ {
    fmt.Println(i)
}
```

* * *

# 函数与方法

## 函数定义与调用

```
func add(a int, b int) int {
    return a + b
}
```

调用：

```
result := add(2, 3)
fmt.Println(result)
```

## 匿名函数与闭包

-   匿名函数：

```
f := func(a, b int) int {
    return a + b
}
fmt.Println(f(1, 2))
```

-   闭包：

```
func counter() func() int {
    count := 0
    return func() int {
        count++
        return count
    }
}
c := counter()
fmt.Println(c()) // 1
fmt.Println(c()) // 2
```

* * *

# 并发编程

## Goroutine

Go语言的轻量级线程：

```
func printNumbers() {
    for i := 1; i <= 5; i++ {
        fmt.Println(i)
    }
}
go printNumbers() // 开启一个新的Goroutine
```

## Channel

-   Channel用于Goroutine间的通信：

```
ch := make(chan int)

go func() {
    ch <- 42 // 发送数据
}()

value := <-ch // 接收数据
fmt.Println(value)
```

-   带缓冲的Channel：

```
ch := make(chan int, 2)
ch <- 1
ch <- 2
fmt.Println(<-ch) // 1
fmt.Println(<-ch) // 2
```

* * *

# 包管理与项目结构

## 包与模块

-   创建模块：

```
go mod init example.com/myapp
```

-   导入和使用包：

```
import "example.com/myapp/utils"
```

## 项目目录结构

```
myapp/
├── go.mod
├── main.go
└── utils/
└── utils.go
```

* * *

# 7\. 高级特性

## 接口

-   接口定义：

```
type Shape interface {
    Area() float64
}
```

-   接口实现：

```
type Circle struct {
    Radius float64
}

func (c Circle) Area() float64 {
    return 3.14 * c.Radius * c.Radius
}
```

## 反射

-   使用`reflect`包动态获取类型信息：

```
import "reflect"

var x = 42
t := reflect.TypeOf(x)
v := reflect.ValueOf(x)
fmt.Println(t, v)
```

* * *
