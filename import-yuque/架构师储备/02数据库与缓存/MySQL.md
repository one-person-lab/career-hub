---
title: "MySQL"
source: https://www.yuque.com/<your-namespace>/yez2nd/wlmr8kdb2olcy78y
group: "02数据库与缓存"
word_count: 7202
updated_at: 2025-06-26T03:24:22.000Z
fetched_at: 2026-09-11T09:34:51.483Z
---

# MySQL

# **基础知识**

## **1.1 MySQL存储引擎？**

-   InnoDB 支持事务，支持外键，默认使用聚簇索引，适合高并发。
-   MyISAM 不支持事务，不支持外键，查询速度快，适合读多写少的场景。

## **1.2 MySQL索引类型？**

<table data-lake-id="y7Mbk" id="y7Mbk" margin="true" class="lake-table" style="width: 500px"><colgroup><col width="100"><col width="100"><col width="100"><col width="100"><col width="100"></colgroup><tbody><tr data-lake-id="u5f3a947c" id="u5f3a947c"><td data-lake-id="ued31ec7f" id="ued31ec7f" style="background-color: rgb(117, 128, 147)"><p data-lake-id="u06dd98eb" id="u06dd98eb"><strong><span data-lake-id="u2100ec7a" id="u2100ec7a" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">索引类型</span></strong></p></td><td data-lake-id="u8ccb2881" id="u8ccb2881" style="background-color: rgb(117, 128, 147)"><p data-lake-id="u4f326cdf" id="u4f326cdf"><strong><span data-lake-id="ubd83c8cd" id="ubd83c8cd" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">是否唯一</span></strong></p></td><td data-lake-id="u49348f39" id="u49348f39" style="background-color: rgb(117, 128, 147)"><p data-lake-id="u4328cd51" id="u4328cd51"><strong><span data-lake-id="ue7b582d8" id="ue7b582d8" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">允许 NULL</span></strong></p></td><td data-lake-id="u2cec36ad" id="u2cec36ad" style="background-color: rgb(117, 128, 147)"><p data-lake-id="uf3f174cf" id="uf3f174cf"><strong><span data-lake-id="u3a00dae0" id="u3a00dae0" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">适用场景</span></strong></p></td><td data-lake-id="ue3022d7a" id="ue3022d7a" style="background-color: rgb(117, 128, 147)"><p data-lake-id="u9add4379" id="u9add4379"><strong><span data-lake-id="u9d5dd949" id="u9d5dd949" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">额外特点</span></strong></p></td></tr><tr data-lake-id="uf40cd4c2" id="uf40cd4c2"><td data-lake-id="u0e03fe20" id="u0e03fe20"><p data-lake-id="u73b67ff5" id="u73b67ff5"><span data-lake-id="u99facf12" id="u99facf12" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">主键索引</span></p></td><td data-lake-id="u7bfc52e2" id="u7bfc52e2"><p data-lake-id="u1ec339d0" id="u1ec339d0"><span data-lake-id="u91e994b3" id="u91e994b3" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">是</span></p></td><td data-lake-id="u1b46acfa" id="u1b46acfa"><p data-lake-id="u4edf9b81" id="u4edf9b81"><span data-lake-id="u254fb50c" id="u254fb50c" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">否</span></p></td><td data-lake-id="u9a027b52" id="u9a027b52"><p data-lake-id="u214ce352" id="u214ce352"><span data-lake-id="u9aa5f089" id="u9aa5f089" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">唯一标识记录</span></p></td><td data-lake-id="u11619817" id="u11619817"><p data-lake-id="u2e15eb9e" id="u2e15eb9e"><span data-lake-id="ue9969abc" id="ue9969abc" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">自动创建聚簇索引</span></p></td></tr><tr data-lake-id="u886d15ba" id="u886d15ba"><td data-lake-id="uf390f08e" id="uf390f08e"><p data-lake-id="u48081629" id="u48081629"><span data-lake-id="uffc55f73" id="uffc55f73" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">唯一索引</span></p></td><td data-lake-id="u67f5c162" id="u67f5c162"><p data-lake-id="ua717dcc6" id="ua717dcc6"><span data-lake-id="uf4d489a1" id="uf4d489a1" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">是</span></p></td><td data-lake-id="u2d49f043" id="u2d49f043"><p data-lake-id="uc6fc91bf" id="uc6fc91bf"><span data-lake-id="u4a7008e0" id="u4a7008e0" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">是</span></p></td><td data-lake-id="u1d1d7704" id="u1d1d7704"><p data-lake-id="ub593c23e" id="ub593c23e"><span data-lake-id="ueadf9a12" id="ueadf9a12" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">保证列值唯一</span></p></td><td data-lake-id="u319d96f1" id="u319d96f1"><p data-lake-id="u30d5bac5" id="u30d5bac5"><span data-lake-id="ub383e1b4" id="ub383e1b4" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">可为多个列创建</span></p></td></tr><tr data-lake-id="ub8f53bf8" id="ub8f53bf8"><td data-lake-id="ua339371a" id="ua339371a"><p data-lake-id="u14cc41c5" id="u14cc41c5"><span data-lake-id="u7394b694" id="u7394b694" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">普通索引</span></p></td><td data-lake-id="u731e7da6" id="u731e7da6"><p data-lake-id="ua2d83983" id="ua2d83983"><span data-lake-id="ub1674905" id="ub1674905" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">否</span></p></td><td data-lake-id="u52f34274" id="u52f34274"><p data-lake-id="uc7b92cea" id="uc7b92cea"><span data-lake-id="u33320c9b" id="u33320c9b" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">是</span></p></td><td data-lake-id="u89174771" id="u89174771"><p data-lake-id="udcccbe40" id="udcccbe40"><span data-lake-id="uaea3b40f" id="uaea3b40f" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">加速查询</span></p></td><td data-lake-id="ua87b5bea" id="ua87b5bea"><p data-lake-id="u51b305a5" id="u51b305a5"><span data-lake-id="u25644b76" id="u25644b76" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">无限制</span></p></td></tr><tr data-lake-id="ue95b617d" id="ue95b617d"><td data-lake-id="ua3e12e8f" id="ua3e12e8f"><p data-lake-id="u1ed84f5a" id="u1ed84f5a"><span data-lake-id="uf179c265" id="uf179c265" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">全文索引</span></p></td><td data-lake-id="u68fddf7c" id="u68fddf7c"><p data-lake-id="u02ccbdd8" id="u02ccbdd8"><span data-lake-id="uec5b7f1f" id="uec5b7f1f" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">否</span></p></td><td data-lake-id="u619ce1dc" id="u619ce1dc"><p data-lake-id="u746ff138" id="u746ff138"><span data-lake-id="u39765bea" id="u39765bea" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">是</span></p></td><td data-lake-id="uc9dfc7f0" id="uc9dfc7f0"><p data-lake-id="u79cb9361" id="u79cb9361"><span data-lake-id="u3703ecc6" id="u3703ecc6" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">文本内容检索</span></p></td><td data-lake-id="u02af87c9" id="u02af87c9"><p data-lake-id="u71564c70" id="u71564c70"><span data-lake-id="u98dd2881" id="u98dd2881" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">支持 MATCH ... AGAINST 查询</span></p></td></tr><tr data-lake-id="ufd557f5a" id="ufd557f5a"><td data-lake-id="u6c613251" id="u6c613251"><p data-lake-id="ud2a7639a" id="ud2a7639a"><span data-lake-id="u5683ad63" id="u5683ad63" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">联合索引</span></p></td><td data-lake-id="ube7b027e" id="ube7b027e"><p data-lake-id="uef1d1719" id="uef1d1719"><span data-lake-id="u1495560e" id="u1495560e" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">否（可唯一）</span></p></td><td data-lake-id="ud03b32ca" id="ud03b32ca"><p data-lake-id="uc0d2accd" id="uc0d2accd"><span data-lake-id="u6b5f964f" id="u6b5f964f" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">是</span></p></td><td data-lake-id="ufb4c08db" id="ufb4c08db"><p data-lake-id="u7fe65edd" id="u7fe65edd"><span data-lake-id="uef21f78d" id="uef21f78d" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">多列组合查询</span></p></td><td data-lake-id="ua35cd497" id="ua35cd497"><p data-lake-id="ud0465a76" id="ud0465a76"><span data-lake-id="u28f3624e" id="u28f3624e" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">遵循最左前缀原则</span></p></td></tr></tbody></table>

## **1.3 B树和B+树的区别？**

### **1\. 基础**

\[未知卡片\]

B+树：

-   数据分布：数据只存储在叶子节点，内节点仅用于索引。内节点用于快速缩小查找范围，叶子节点用于精确找到目标数据。
-   查询效率：范围查询效率极高（通过叶子节点链表顺序扫描）。
-   适用场景：适合范围查询、多数据扫描的场景，如数据库索引和文件系统。在进行范围查询的时候，B+树效率更好，因为B+树都在叶子节点存储，并且叶子节点是一个双向链表。

B树：

-   数据分布：数据分布在所有节点（内节点和叶子节点）中。如果节点中存储的数据量大，就会导致分支因子较小（每个节点的子节点数量少）。导致层级高，增加IO操作。
-   查询效率：查找数据时可能在内节点直接找到，查询效率稍高。
-   适用场景：适合查询和写入都需要较高效率的场景，但不擅长范围查询。

### **2\. 阶数**

阶数的定义：一个 B+树的阶数 m 决定了节点的容量。

-   每个内节点最多有 m 个子节点。
-   每个内节点最多存储 m-1 个关键字（索引值）。

### **3\. MySQL阶数**

在 MySQL 中，阶数并不是固定值，**MySQL 中 B+树的阶数计算，**阶数 ≈ 页大小 / 索引项大小

**影响因素**

-   页的大小：
-   索引项的大小：

**计算示例**

-   如果主键是 INT 类型（4 字节）：

-   索引项大小 = 4（主键值） + 6（页内指针） = **10 字节**。
-   阶数 ≈ ⌊16,384 / 10⌋ = **1638**。

-   如果主键是 BIGINT 类型（8 字节）：

-   索引项大小 = 8（主键值） + 6（页内指针） = **14 字节**。
-   阶数 ≈ ⌊16,384 / 14⌋ = **1170**。

由于 B+ 树的高度一般为 3～4 层，但3到4层的B+树足以支撑千万级别的数据。

### **4\. 索引选择**

-   主键自增的好处：

主键自增可以确保新插入的数据总是被追加到叶子节点的最后，避免页分裂。

-   索引字段尽量占用空间小：

索引字段的大小直接影响节点的分支因子：

### **5\. 磁盘页与节点的关系**

-   一个节点对应一个磁盘页：

在 B+ 树索引中，每个节点的内容会被存储在磁盘中的一个磁盘页内。

由于磁盘访问速度比内存慢得多，为了提高查询效率，数据库将一个节点的内容尽量放入一个磁盘页中，这样每次读取节点时只需一次磁盘 I/O。

-   **每层能存储的数据量：**

每层能存储的数据量是当前层节点总数与每个节点的 Key 数量的乘积：每层存储的数据量=当前层的节点数×每节点的 Key 数量\\text{每层存储的数据量} = \\text{当前层的节点数} \\times \\text{每节点的 Key 数量}每层存储的数据量=当前层的节点数×每节点的 Key 数量

假设根节点有 1 个，阶数为 1162：

第一层：1×11611 \\times 11611×1161 = 1161 条记录。

第二层：1162×1161≈1,348,4821162 \\times 1161 \\approx 1,348,4821162×1161≈1,348,482 条记录。

第三层：1,348,482×1161≈1.56×1091,348,482 \\times 1161 \\approx 1.56 \\times 10^91,348,482×1161≈1.56×109 条记录。

### **6\. 其他数据结构**

-   Hash 表的缺点：
-   其他树结构的不足：

二叉搜索树：左边小右边大，平衡二叉树O(lgn)，最坏的二叉树会退化成一个链表O(n)

红黑树：保持树的平衡O(lgn)，数据量大值树很高，查找效率一样会变低

B树：相对于二叉树，B树每个节点可以有多个分支，并且每个节点存储指向前后数据的指针，每个分支存储着对应的值

B+树：非叶子节点不存储数据，只存储指针，只有在叶子节点存储数据，非叶子节点主要是用来导航找到叶子节点，B+树便于扫库和区间查询，叶子节点是一个双向链表

### **7\. Innodb引擎为什么用B+树？**

MySQL数据是存储在磁盘上的，磁盘读写的最小单位是扇区512B，操作系统的最小读写单位是块4KB，数据库的索引是保存上磁盘上的，查询过程可能会发生多次磁盘IO，查询某行数据时，需要先从磁盘读取索引到内存，如果涉及回表会再进行读取磁盘到内存。众所周知，磁盘IO速度和内存速度不是一个量级的。

-   有序性

B+树的叶子节点之间使用指针形成一个有序的双向链表，这种有序性非常适合范围查询，在B+树中，相关数据通常在物理上也是相邻存储的，这有助于减少磁盘IO次数。

-   节点高度低

由于B+树的节点通常是较大的，节点高度低，每次从磁盘读取节点时，能够充分利用数据库的缓冲池，减少磁盘IO的次数。

-   弊端

不适合做全文检索，树如果很高，IO就会很多，效率就会急速下降，这时候就需要考虑读写分离、分库分表，或优化索引。

## **1.4 MySQL并发？**

### **1\. MVCC 的作用是什么？**

MySQL 中的 MVCC（**Multiversion Concurrency Control**，多版本并发控制）是用于在数据库中实现 **高效并发** 的一种机制。当一个事务要对数据库中的数据进行修改时，MVCC 会为该事务创建一个数据快照，而不是直接修改实际的数据行。

MVCC 通过为每个事务生成多个版本的数据快照，避免了事务之间的锁争用问题，从而实现了：

-   读写分离：读操作不阻塞写，写操作也不阻塞读。
-   高并发：提高事务并发性能。
-   一致性读：保证每个事务读取到的是一致的数据视图。

适用于 MySQL 的 **RR（可重复读）** 和 **RC（读已提交）** 隔离级别。

### **2\. MVCC 的实现机制是什么？**

MVCC 在 InnoDB 中通过以下方式实现：

1.  隐藏的系统字段（每行数据多出两个隐藏字段）：
2.  事务的版本号：
3.  一致性视图（Read View）：
4.  undo log（回滚日志）：

**当前读**：

-   当前读是读取最新版本的数据，并会对读取的数据加锁。
-   适用于以下语句：

-   SELECT ... FOR UPDATE
-   SELECT ... LOCK IN SHARE MODE
-   INSERT/UPDATE/DELETE

**快照读**：

-   快照读是读取数据的历史版本（快照），它不会阻塞其他事务的写操作。
-   普通的 SELECT 语句（不带锁的查询）。

### **3\.** **隔离级别**

事务隔离级别定义了多个事务之间操作的可见性规则，事务的隔离级别就是用来解决并发事务问题，事务隔离级别越高，数据越安全，但是性能越低。

<table data-lake-id="DzRrf" id="DzRrf" margin="true" class="lake-table" style="width: 500px"><colgroup><col width="100"><col width="100"><col width="100"><col width="100"><col width="100"></colgroup><tbody><tr data-lake-id="uda656de7" id="uda656de7"><td data-lake-id="u5fe77715" id="u5fe77715" style="background-color: rgb(117, 128, 147)"><p data-lake-id="u25f377da" id="u25f377da"><span data-lake-id="u76772e95" id="u76772e95" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">隔离级别</span></p></td><td data-lake-id="u6cf20ae4" id="u6cf20ae4" style="background-color: rgb(117, 128, 147)"><p data-lake-id="udbd9120d" id="udbd9120d"><span data-lake-id="u7dc2d7e1" id="u7dc2d7e1" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">脏读</span></p></td><td data-lake-id="ud6cdeb54" id="ud6cdeb54" style="background-color: rgb(117, 128, 147)"><p data-lake-id="u418d359a" id="u418d359a"><span data-lake-id="u3b210a32" id="u3b210a32" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">不可重复读</span></p></td><td data-lake-id="ueda4a3b2" id="ueda4a3b2" style="background-color: rgb(117, 128, 147)"><p data-lake-id="uf31445be" id="uf31445be"><span data-lake-id="u65140f46" id="u65140f46" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">幻读</span></p></td><td data-lake-id="udcd6f563" id="udcd6f563" style="background-color: rgb(117, 128, 147)"><p data-lake-id="uabf26097" id="uabf26097"><span data-lake-id="u2d75bc44" id="u2d75bc44" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">并发性</span></p></td></tr><tr data-lake-id="ua9fa4193" id="ua9fa4193"><td data-lake-id="u8e1cfbbf" id="u8e1cfbbf"><p data-lake-id="u5e72fdbf" id="u5e72fdbf"><span data-lake-id="ue4769d82" id="ue4769d82" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">读未提交 (RU) </span><strong><span data-lake-id="u785df212" id="u785df212" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">(Read Uncommitted)</span></strong></p></td><td data-lake-id="uc3155df1" id="uc3155df1"><p data-lake-id="ud9372598" id="ud9372598"><span data-lake-id="u9c4a6edf" id="u9c4a6edf" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">√</span></p></td><td data-lake-id="u08a5daa5" id="u08a5daa5"><p data-lake-id="u237ef4a2" id="u237ef4a2"><span data-lake-id="u384f8d26" id="u384f8d26" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">√</span></p></td><td data-lake-id="u1227403c" id="u1227403c"><p data-lake-id="ud09ed06b" id="ud09ed06b"><span data-lake-id="u02aef18a" id="u02aef18a" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">√</span></p></td><td data-lake-id="uc0b40725" id="uc0b40725"><p data-lake-id="u45e52304" id="u45e52304"><span data-lake-id="u76b61883" id="u76b61883" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">高</span></p></td></tr><tr data-lake-id="ud93a74ce" id="ud93a74ce"><td data-lake-id="u71911b2c" id="u71911b2c"><p data-lake-id="ubcdf8d09" id="ubcdf8d09"><span data-lake-id="u49a64c3f" id="u49a64c3f" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">读已提交 (RC) </span><strong><span data-lake-id="u842dd414" id="u842dd414" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">(Read Committed)</span></strong></p></td><td data-lake-id="u399516d8" id="u399516d8"><p data-lake-id="u8b80d901" id="u8b80d901"><span data-lake-id="u66890d6a" id="u66890d6a" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">×</span></p></td><td data-lake-id="ud9fdd14e" id="ud9fdd14e"><p data-lake-id="u9e6b00c7" id="u9e6b00c7"><span data-lake-id="u4b55bbb4" id="u4b55bbb4" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">√</span></p></td><td data-lake-id="ud4d3c060" id="ud4d3c060"><p data-lake-id="u14bba42d" id="u14bba42d"><span data-lake-id="ua215a8f8" id="ua215a8f8" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">√</span></p></td><td data-lake-id="ufa2b591c" id="ufa2b591c"><p data-lake-id="u91044a7d" id="u91044a7d"><span data-lake-id="u9d6b17df" id="u9d6b17df" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">较高</span></p></td></tr><tr data-lake-id="uf94eef7e" id="uf94eef7e"><td data-lake-id="u59c82535" id="u59c82535"><p data-lake-id="u5dfd856e" id="u5dfd856e"><span data-lake-id="u578cb6c9" id="u578cb6c9" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">可重复读 (RR) </span><strong><span data-lake-id="u9de4493c" id="u9de4493c" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">(Repeatable Read)</span></strong></p></td><td data-lake-id="u06510626" id="u06510626"><p data-lake-id="u4c2c35d1" id="u4c2c35d1"><span data-lake-id="u4360266a" id="u4360266a" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">×</span></p></td><td data-lake-id="uc6a067b6" id="uc6a067b6"><p data-lake-id="u02644cd5" id="u02644cd5"><span data-lake-id="u8f05847a" id="u8f05847a" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">×</span></p></td><td data-lake-id="u2c317f8a" id="u2c317f8a"><p data-lake-id="ua8d3a60c" id="ua8d3a60c"><span data-lake-id="u87b10e1f" id="u87b10e1f" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">√</span></p></td><td data-lake-id="u16a22d99" id="u16a22d99"><p data-lake-id="ufd1de49a" id="ufd1de49a"><span data-lake-id="u7d19c103" id="u7d19c103" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">中</span></p></td></tr><tr data-lake-id="udb110b89" id="udb110b89"><td data-lake-id="ucbfa937c" id="ucbfa937c"><p data-lake-id="uc81b7854" id="uc81b7854"><span data-lake-id="ueed67f86" id="ueed67f86" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">串行化 (Serializable) </span><strong><span data-lake-id="u29043a87" id="u29043a87" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">(Serializable)</span></strong></p></td><td data-lake-id="u80c0a20b" id="u80c0a20b"><p data-lake-id="u981edbca" id="u981edbca"><span data-lake-id="uaa1f72e6" id="uaa1f72e6" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">×</span></p></td><td data-lake-id="ud8f4811b" id="ud8f4811b"><p data-lake-id="u6b4cbc54" id="u6b4cbc54"><span data-lake-id="u3045be63" id="u3045be63" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">×</span></p></td><td data-lake-id="u0f9224c8" id="u0f9224c8"><p data-lake-id="uf72c8c09" id="uf72c8c09"><span data-lake-id="u2571275b" id="u2571275b" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">×</span></p></td><td data-lake-id="u2a8f3f85" id="u2a8f3f85"><p data-lake-id="ufd9351bf" id="ufd9351bf"><span data-lake-id="u87c40135" id="u87c40135" class="lake-fontsize-11" style="color: rgb(0, 0, 0)">低</span></p></td></tr></tbody></table>

查看事务隔离级别：MySQL 隔离级别默认可重复读

SELECT @@TRANSACTION\_ISOLATION

### **4\. 三种并发问题**

1.  脏读：

一个事务读到另外一个事务还没有提交的数据

-   事务 A 读取了事务 B 尚未提交的数据，事务 B 回滚后，A 读取的数据变得无效。
-   解决：从 **读已提交 (RC)** 隔离级别开始避免。

1.  不可重复读：

一个事务先后读取同一条数据，但两次读取的数据不同，称之为不可重复读

事务 A 在某时读取某条数据，事务 B 修改并提交后，事务 A 再次读取同一数据，发现数据已改变。

-   定义：同一个事务中两次读取同一行数据，结果不同。
-   原因：另一个事务对已存在的记录进行了**修改**或**删除**，并提交。
-   本质：**“同一行的内容变化”**。
-   示例： 假设有一张用户余额表 accounts：

+----+-------+-------+ | id | name | money | +----+-------+-------+ | 1 | Alice | 100 | +----+-------+-------+

-   解决办法：

-   使用 **可重复读 (Repeatable Read)** 或更高隔离级别，确保同一事务中数据行的内容一致。

1.  幻读：

一个事务按照条件查询数据时，没有对应的数据行，但是在插入数据时，又发现这行数据已经存在，好像出现了幻影

事务 A 按条件查询一组数据，事务 B 插入或删除了符合条件的新数据，事务 A 再次查询时，发现数据行数发生变化。

-   定义：同一个事务中两次查询，结果集的行数或范围发生了变化。
-   原因：另一个事务**新增或删除了记录**，并提交。
-   本质：**“结果集中行的变化”**。
-   示例：假设有一张订单表 orders：

+----+-------+-------+ | id | name | total | +----+-------+-------+ | 1 | Order1| 100 | +----+-------+-------+

-   解决办法：

-   使用 **串行化 (Serializable)** 隔离级别，或在 **可重复读 (Repeatable Read)** 下通过 **Next-Key Locks** 解决。

### **5\. 如何在可重复读隔离级别下解决幻读？**

MySQL 使用了一种 **Next-Key Locks** 的锁机制，来解决事务并发中的**幻读问题**。

在 **可重复读 (RR)** 隔离级别下，快照读可以防止不可重复读，但对于**幻读**（新增行导致结果集的变化）则无法避免。**Next-Key Locks** 能通过对范围加锁防止新行插入，进而解决幻读问题。

**Next-Key Lock** = 行锁 + 间隙锁：锁住一条记录及其前后之间的范围。

假设我们有如下表 orders：

CREATE TABLE orders ( id INT PRIMARY KEY, total INT ); -- 表中已有数据： -- +----+-------+ -- | id | total | -- +----+-------+ -- | 1 | 100 | -- | 3 | 300 | -- +----+-------+

1.  当前查询范围加锁：当事务执行带条件的查询语句（如 SELECT ... WHERE total > 50 FOR UPDATE）时，MySQL 会对满足条件的记录及其范围加锁。
2.  防止插入新行：锁住的范围不仅包括现有数据，还包括这些数据之间的“间隙”。例如：

### **6\. 数据库的ACID特性？**

ACID 是数据库事务的四个核心特性。

-   原子性（Atomicity）：原子性保证事务要么全部执行，要么全部不执行。

实现方式：通过 **UNDO 日志** 实现，在事务失败时利用日志将已经执行的操作撤销。

-   一致性（Consistency）：事务执行前后，数据保持一致，例如转账业务中，无论是否成功，转账者和收款人的总额应该是不变的 。

实现方式：通过其他三种特性来实现。

-   隔离性（Isolation）：隔离性保证事务在执行过中不会受其他并行事务影响。

实现方式：通过 **锁机制**（Next-Key Locks）和 **MVCC** 实现隔离性。更高的隔离级别需要更多的锁和阻塞，降低并发性能。

-   持久性（Durability）：持久性保证事务一旦提交成功，数据不会丢失。

实现方式：**Redo 日志** 在事务提交前将变更持久化到磁盘，当系统重启时通过日志恢复提交的数据。

### **7\. MySQL日志？**

**Redo Log（重做日志）**

-   作用：保证事务的 **持久性**（Durability）。

**Undo Log（回滚日志）**

-   作用：保证事务的 **原子性**（Atomicity）和 MVCC 的多版本并发控制。

**Binlog（二进制日志）**

-   作用：记录对数据库的所有修改（增、删、改），用于 **数据恢复** 和 **主从复制**。

**Slow Query Log（慢查询日志）**

-   作用：记录执行时间超过指定阈值的 SQL 语句，用于性能优化。

**Relay Log（中继日志）**

-   作用：用于主从复制，从库接收主库的 Binlog 后存储在 Relay Log 中，将日志暂存至这里，因为会执行不过来会导致不一致。

**Error Log（错误日志）**

-   作用：记录 MySQL 的启动、关闭和运行时的错误信息。

### **8\. MySQL****行级锁？**

行级锁是 MySQL InnoDB 存储引擎中实现的一种锁粒度最细的锁，锁定表中的一行数据。提高并发性能，避免因锁粒度过大（如表锁）而引发的性能瓶颈。

InnoDB实现了以下两种类型的行锁：

1.  共享锁（S 锁 / Shared Lock）：允许其他事务读取被锁定的行，但不能修改。
2.  排他锁（X 锁 / Exclusive Lock）：阻止其他事务对被锁定的行进行读或写。

增删改时默认是排他锁，自动加锁，查询不加任何锁，select for update 是排他锁

**锁定索引**：

-   InnoDB 的行锁是通过锁定索引项来实现的，而不是直接锁定行。
-   如果没有索引，会导致 **表锁**，锁住所有行。

# **索引及优化**

## **2.1 索引**

### **1\. 索引底层数据结构选型**

Hash表：通过key即可取出对应的值O(1)，产生Hash冲突可以通过链表解决，如果链表过长，可以转为红黑树。为什么哈希表这么快，MySQL没有使用其作为索引的数据结构呢，因为Hash索引不支持顺序和范围查询。

-   占用额外的存储空间。
-   对写操作（如INSERT、UPDATE、DELETE）性能有影响。

### **2\. 聚簇索引**

叶子节点存储完整数据行。

聚簇索引查找速度更快（少一次回表操作）。

聚簇索引选取：如果定义了主键，InnoDB 会自动将主键作为聚簇索引；如果没有定义主键，会选择第一个非空唯一索引；如果没有这样的索引，InnoDB 会自动生成一个隐藏的 6 字节 ROWID 作为聚簇索引。

### **3\. 非聚簇索引**

叶子节点存储的是索引值和数据行的指针。

非聚簇索引支持更多查询场景。

## **2.2 索引设计原则？**

优先为高频查询列加索引，where、order by、group by等操作。

避免为频繁更新的列加索引，因为会频繁调整索引结构性能开销很大。

索引字段尽量小，减少存储空间占用，降低索引树层高，增加查询性能。

联合索引支持索引覆盖查询，避免回表，提高查询效率。

## **2.3 索引失效情况？**

-   查询中对索引列进行了函数运算或隐式类型转换（比如本来是int类型通过String查询，就会导致索引失效）。
-   查询条件包含or，会导致索引失效
-   查询条件不符合最左前缀匹配原则，联合索引查询时的条件列不是联合索引的第一列，会导致索引失效
-   like查询如果包含左模糊，也会导致索引失效
-   查询条件使用 !=、<>、 not in，会导致索引失效
-   查询条件使用is null或者is not null，可能导致索引失效

## **2.4 索引其他问题**

### **1\. 为什么不建议对长字符串列建索引？**

-   解答思路：

-   长字符串索引会占用较多存储空间，导致索引树层高增加，降低查询性能。
-   可以使用前缀索引，例如 CREATE INDEX idx ON table(column(10))。

### **2\. 如何优化 MySQL 索引？**

-   解答思路：

-   删除冗余索引，减少写性能开销。
-   对查询频繁的列，选择合适的索引类型。
-   使用 EXPLAIN 分析查询计划，确定索引是否被正确利用。

### **3\. 索引覆盖查询是什么？**

-   解答思路：

-   查询所需的数据完全可以通过索引获取，无需回表。
-   覆盖索引提升性能：

-   减少回表操作。
-   索引比数据行更小，读取速度更快。

### **4\. 如何为一个查询语句选择合适的索引？**

-   解答思路：

-   分析查询条件。
-   找出选择性较高的列，作为索引列。
-   对复杂条件，设计联合索引。

# **读写分离**

MySQL主从复制

1.  主库将数据库中数据的变化写入到 binlog
2.  从库连接主库
3.  从库会创建一个 I/O 线程向主库请求更新的 binlog
4.  主库会创建一个 binlog dump 线程来发送 binlog ，从库中的 I/O 线程负责接收
5.  从库的 I/O 线程将接收的 binlog 写入到 relay log 中。
6.  从库的 SQL 线程读取 relay log 同步数据到本地（也就是再执行一遍 SQL ）。

### **如何避免主从延迟？**

#### **强制将读请求路由到主库处理**

既然你从库的数据过期了，那我就直接从主库读取嘛！这种方案虽然会增加主库的压力，但是，实现起来比较简单，也是我了解到的使用最多的一种方式。

比如 Sharding-JDBC 就是采用的这种方案。通过使用 Sharding-JDBC 的 HintManager 分片键值管理器，我们可以强制使用主库。

## **如何排查主从同步延迟问题？**

-   问题背景：你的系统中发现主从延迟，如何排查并解决？
-   解答思路：

# **实战**

## **1\. 如何排查慢查询问题？**

我们在做系统压测的时候有部分接口响应很慢，接口的响应时间都超过了两秒。

-   问题背景：你的 MySQL 应用中有一部分查询很慢，你会怎么排查并优化？
-   解答思路：

## **2\. 如果一个表有上亿数据，如何快速查询？**

-   问题背景：设计一个查询方案，快速从亿级数据中查询符合条件的记录。当时我负责的签到服务，签到数据达到十亿级别，每天都能新增百万条数据。后续采用了冷热分离的方式进行优化。
-   解答思路：

-   表结构设计

-   采用自增主键，避免出现页分裂乱序插入
-   合理分配每个字段的类型大小，避免造成不必要的空间浪费

-   索引设计：

## **3\. 如何应对高并发场景下的锁等待问题？**

-   问题背景：高并发下，MySQL 出现大量锁等待，如何处理？
-   解答思路：

## **4\. 如何防止超卖问题？**

-   问题背景：在秒杀活动中，如何防止库存超卖？
-   解答思路：

SELECT stock FROM products WHERE id = ? FOR UPDATE;

UPDATE products SET stock = stock - 1, version = version + 1 WHERE id = ? AND version = current\_version;

## **5\. 如何对海量数据进行增量更新？**

-   问题背景：表中有上亿条记录，每天需要批量更新部分数据。
-   解答思路：

sql复制代码UPDATE table\_name SET column = new\_value WHERE condition LIMIT 1000;

## **6\. 如果索引没有生效怎么办？**

-   问题背景：查询性能较慢，发现索引未被使用，如何排查？
-   解答思路：

## **8\. 删除一张一亿条数据的表中90%的数据？**

-   如果删除数据量大且条件明确，我会使用 **新表替换**。将保留的数据迁移到新表，然后替换原表，这样可以避免大范围事务和锁定问题。
-   如果删除条件较复杂，我会采用 **分批删除**，每次删除一小部分数据，通过脚本循环执行，避免锁表和性能问题。
-   如果对业务无影响，我也可能考虑 **标记删除**，先逻辑删除，再定期物理清理。这种操作需要结合业务需求和系统负载进行选择，以保证系统的稳定性和效率。

## **9\. EXPLAIN 的作用是什么？**

EXPLAIN 用于分析 SQL 查询的执行计划，帮助我们了解查询是否走了索引，是否有全表扫描、临时表或排序操作，从而优化查询性能。

**问题 1：有一张表，EXPLAIN 显示 type 为 ALL，怎么优化？**

-   回答：ALL 表示全表扫描，可能是因为查询条件未能使用索引。优化方法：

**问题 2：查询显示 Using filesort，如何优化？**

-   回答：Using filesort 表示查询需要额外排序，可能是因为 ORDER BY 字段未走索引。

-   解决方法：

id：表示select查询的序列号，id相同，执行顺序从上到下；id不同，值越大，越先执行

type：表示连接类型，性能由好到差，NULL（不访问表）、system（访问系统表）、const（根据主键或唯一索引）、eq\_ref、ref（非唯一索引）、range、index（遍历整个索引树）、all

possible\_keys：可能用到的索引

key：实际使用的索引

filtered：表示返回结果的行数占需读取行数的百分比，值越大越好

### **MySQL做过哪些优化？**

insert优化，批量插入、手动提交事务、主键顺序插入

update优化，避免行锁升级为表锁，更新字段要根据索引字段进行更新，否则会升级为表锁。InnoDB的行锁是针对索引加的锁，不是针对记录加的锁，并且索引不能失效，否则会从行锁升级为表锁

主键优化，尽量降低主键的长度，尽量选择顺序插入，使用自增主键，否则会容易出现页分裂，尽量不使用UUID做主键，因为会乱序插入

order by优化，Using filesort效率低，Using index效率高，尽量使用覆盖索引，如果一个升序一个降序需要增加联合索引的规则（ASC/DESC），如果不可避免的出现filesort，大数据量排序时，可以增大排序缓冲区大小sort\_buffer\_size

group by优化，同样要通过索引提高效率，同时满足最左前缀法则

limit优化，通过覆盖索引+子查询优化，explain select \* from tb\_sku t, (select id from tb\_sku order by id limit 100000, 10) a where t.id = a.id，通过范围查询

count优化，count(主键) 需要取主键、count(字段) 需要取字段、count(1) 不取值但有赋值、count(\*)性能最高，InnoDB引擎专门做了优化，不取值，服务层直接按行进行累加，如果一定要对大数据量的表进行count，优化思路就是自己使用redis换成计数

### **Mysql超大分页优化？**

-   使用索引

确保查询where条件字段上有索引，以减少扫描的数据量

-   避免使用offset偏移量

可以考虑使用主键或唯一索引定位记录，再进行分页 where id > last\_max\_id limit page\_size

### **Sharding-JDBC分库分表？**

采用单数据库存储，存在以下性能瓶颈

我们的签到数据是很大的，每天都是千万级别的，这时候就需要进行分表操作，

随着公司业务发展，数据库中的数据量猛增，访问性能也变慢了，优化迫在眉睫。单机存储容量、连接数、处理能力都有限。当单表的数据量达到1000W，由于查询维度多，即使添加从库、优化索引，做很多操作时性能仍下降严重。

把数据库通过不同的模块拆分为若干独立的数据库，并对大表拆分成若干小表，通过这种数据库拆分的方法来解决数据库的性能问题。

分库分表就是为了解决由于数据量过大导致数据库性能降低的问题，提升数据库性能

IO瓶颈：热点数据太多，数据库缓存不足，产生大量磁盘IO；请求数据太多，带宽不够，网络IO瓶颈

CPU瓶颈：请求数太多，CPU出现瓶颈

-   垂直分表

垂直分割是将数据库中的不同表按照关联性进行拆分，每个分片包含一组表。例如，将用户信息表、订单表、产品信息表

将一个表按照字段分成多表，每个表存储其中一部分字段。将不常用的字段拆分出来放在附表中，将text、blob等大字段拆分出来放在附表中，经常组合查询的列放在一张表中

为了避免IO争抢并减少锁表的几率

-   垂直分库

按照业务将表进行分类，分布到不同的数据库上

-   水平分表
-   水平分库

通过分片键来分割数据，Sharding-JDBC支持多种分片策略，如按范围、按哈希、按日期等。

​  

# 常用配置命令

```
# 当前已建立的连接数
SHOW STATUS LIKE 'Threads_connected';
# 当前活跃的连接数
SHOW STATUS LIKE 'Threads_running';
# 数据库最大连接数
SHOW VARIABLES LIKE 'max_connections';
# 最大使用过的连接数，连接池内同时打开过的最大连接数
show status like '%Max_used_connections%';
# 设置数据库连接池大小
SET GLOBAL max_connections = 200;
```

  

```
# my.conf配置文件，只有本机能访问
bind_address = 127.0.0.1
# 查看密码强度校验策略
SHOW VARIABLES LIKE 'validate_password%';
# 设置密码强度为强口令
INSTALL PLUGIN validate_password SONAME 'validate_password.so';
SET GLOBAL validate_password_policy = 'STRONG';
# 修改密码
ALTER USER 'fourfatih'@'localhost' IDENTIFIED BY 'test123';
```

  

# 数据库初始化

```
SHOW DATABASES;
DROP DATABASE example_db;
SHOW CREATE DATABASE example_db;
ALTER DATABASE example_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW VARIABLES LIKE 'character_set%';

CREATE DATABASE example_db 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_general_ci;

source /backup/schema.sql

source /backup/data.sql

SET NAMES utf8mb4;

mysqldump -u <db-user> -p --default-character-set=utf8mb4 example_db > /backup/schema.sql;

```
