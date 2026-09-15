---
title: "Agent"
source: https://www.yuque.com/<your-namespace>/yez2nd/ida3ou9rc2lllwcy
group: "面试准备 / 面试基础"
word_count: 898
updated_at: 2026-08-28T12:24:29.000Z
fetched_at: 2026-09-11T09:34:51.483Z
---

# Agent

Spring AI Alibaba Graph

企业落地的合规困境

流程不可控

同样的输入，两次执行路径不同

随机跳过关键步骤，颠倒执行顺序

遗漏强制校验节点，重复调用工具

​  

审计不可追溯

无法固定复现链路

业务出现风险时，排查与整改困难

​  

Workflow

先编排好每个节点，以及节点与节点之间的流转性

DAG 有向无环图

Graph系统四大核心原语

State 状态 贯穿全图的的共享数据容器和上下文快照

Node 节点 最小执行单元，接收输入并更新状态

Edge 边 控制流路由，决定执行路径与流转方向

Graph 图 拓扑编排引擎，定义完整的生命周期

​  

开始节点和结束节点

节点：干活的人，节点就是一个函数

边：普通边、条件边，评估状态，决定流转逻辑

​  

Graph 需要编译，检查有没有孤立节点、死循环等结构问题

ChatClient调用大模型进行对话传入模型配置、系统提示词、用户提示词，设置结构化输出

也可以使用Spring AI Alibaba 的agentic，实现自主思考，调用工具

或者使用ReactAgent

加入边，需要有开始和结束节点

​  

写好 Graph 可以通过GraphRepresentation输出mermaid

SpringCloudAlibabaStudio 也可以直接展示，内部集成了 mermaid 引擎

条件边ConditionalEdge

​  

智能客服、自动化运营、辅助决策

​  

可以轻松构建单智能体、多智能体、流程编排

Agent=感知+大脑+规划+行动+反馈

Workflow 工作流编排 确定的有向无环图与状态机，具备绝对可控性与幻觉容忍度

Agentic 智能体自驱 以 ReAct框架为核心，基于总目标和工具库的自主决策，执行过程黑盒状态，可能陷入死循环，token 过度消耗

企业级混合架构 Agentic+Workflow

选型：Coze、Dify、FastGPT 正常个人使用

代码即图：流程图的一比一精确映射

SkillsAgentHook 调用 skill

PromptChatMemoryAdviser 拦截器去存储记忆

@Tool 注解 告诉大模型提供了什么工具 SpringAI 的底层会把这个方法的信息封装成 JSON，提供给大模型，需要做一些权限控制

​  

MCP

stdio 标准输入输出流 客户端 mcp 必须要本地具备 mcpserver对应的语言环境，无法动态鉴权

web 需要部署成 web 服务，比如高德、天气

​  

RAG

让大模型去分析并且做分割，通过余弦相似度把相关信息检索出来，向量数据库使用 Milvus

重排序模型

销售实战赋能 某某东西太贵了，可以分析竞品报告、市场调研数据、销售话术模板

技术运维排障 手册规则通讯录 将分散的文档串联成可执行的 SOP（标准作业程序）

功能：知识库管理

​  

问题：分片可能造成语义割裂

企业级RAG最佳分片策略？提供多种分片策略 自己选择分片参数 ，还有基于大模型的智能切分

​  

text-to-sql 处理聚合问题（统计、算数）

多路召回

噪音可以通过知识库分类解决

文档更新不用删除旧文档，但是要做好版本管理
