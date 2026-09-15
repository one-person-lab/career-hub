---
title: "SpringBoot"
source: https://www.yuque.com/<your-namespace>/yez2nd/oilbg8f4a7ngyay2
group: "01编程语言 / Java"
word_count: 3827
updated_at: 2025-02-10T09:00:36.000Z
fetched_at: 2026-09-11T09:34:51.483Z
---

# SpringBoot

#### **SpringBoot启动过程全流程？**

初始化数据

初始化容器

###### **什么是Spring Boot Starter？**

Spring Boot Starter是Spring提供的一系列开箱即用的依赖性集合。简化Spring Boot应用的依赖配置。

每一个Starter都专注于某个功能领域，包含了使用该功能所需的依赖包。

比如：spring-boot-starter-web、spring-boot-starter-jdbc、spring-boot-starter-amqp

也可以自己自定义Spring Boot Starter。

###### **什么是Spring Boot？**

Spring Boot的出现就是为了简化Spring的配置，相当于一个Spring应用的脚手架，通过简单配置就可以开发出生产级别的Spring应用，消除了繁琐的配置，使开发人员更专注于业务逻辑。约定大于配置。

###### **Spring Configuration Processor 是干嘛用的？**

Spring配置处理器，可以更安全的使用@ConfigurationProperties注解，在编译时进行配置绑定和验证，发现配置错误，减少配置引起的问题。

###### **Spring Boot自动装配流程是怎样的？**

1.  在Spring boot项目中的引导类有一个注解@SpringBootApplication，这个注解分别对三个注解进行了封装
2.  其中@EnableAutoConfiguration注解是实现自动装配的核心注解，该注解通过@Import导入对应的配置选择器。内部就是读取了该项目和该项目引用的Jar包的classpath路径下META-INF/spring.factories文件中所配置的类的全类名。在这些配置类中会根据条件装配来将符合条件的bean注入到spring容器中

自动装配就是为了将依赖注入自动化的一个简化配置的操作，不需要显示配置的情况下自动为bean注入依赖，是IOC容器实现控制反转的具体实现方式。

Spring Boot应用启动时会通过@EnableAutoConfiguration注解，里面的AutoConfigurationImportSelector找到META-INF/spring.factories配置文件和spring imports文件并解析，这些自动装配类通常使用条件注解，符合条件的自动装配类会被加载，它们会注册相应的bean到Spring IOC容器，大多数情况下Spring Boot的自动装配会满足大部分应用的需求，如果需要对自动配置进行定制可以通过修改配置文件或者在自己的配置类使用@Configuration注解，然后添加自己的bean或者覆盖现有的bean来实现定制。

SpringApplication调用run方法完成后会返回IOC容器，可以通过IOC容器查看容器里的组件

自动装配注解有以下几种实现方式：

1.  @Autowired 根据类型注入到容器中，名字
2.  @Resource

###### **@Autowired和@Resource的区别？**

@Autowired通过类型匹配进行依赖注入，如果存在多个匹配类型的实例，可以使用@Qualifier进行进一步指定，找不到则会抛出异常。@Resource通过名称匹配进行依赖注入，它可以指定name属性来指定所需的bean名称，找不到会根据类型查找，找不到不会抛出异常。

@Autowired是Spring特定的注解，在Spring框架上才有效；@Resource是JavaEE规范的一部分，支持JavaEE规范的环境也可以使用。

###### **Spring Boot的设计模式？**

Spring Boot默认会在底层配好所有的组件，但是用户配置了以用户的优先。

Spring Boot会先加载所有的自动配置类，每个自动配置类安装条件进行生效，生效的配置类会给容器装配组件，这时候功能就生效了

定制化配置

###### **Spring Boot常见注解作用？**

-   @EnableConfigurationProperties 注解的作用就是启用指定的配置属性类，将其注入Spring容器
-   @Bean 给@Bean标注的方法传入了对象参数，这个参数的值就会从容器中找

@SpringBootConfiguration注解由@Configuration修饰代表当前启动类是一个配置类

@ComponentScan用来指定扫描哪些包，默认扫描启动类的包以及子包

@EnableAutoConfiguration

###### **org.springframework.boot.autoconfigure.AutoConfiguration.imports和spring.factories的区别？**

imports定义基础自动配置类，这些配置类会被无条件导入，spring.factories中定义的自动配置类需要满足@Conditional条件才会生效，也就是按需装配。

###### **Spring Boot配置加载优先级是怎样的？**

它会加载Java属性文件、YAML文件、环境变量、命令行参数。

它会在如下位置查找配置文件，classpath根路径，classpath根路径下config目录，jar包当前目录，jar包当前目录的config目录，config目录的直接子目录，后面的配置会直接前面的同名配置。

配置文件加载顺序，jar包内部的application.properties和application.yaml，jar包内部的application-{profile}.properties和application-{profile}.yaml，再以此类推加载外部的，后面的覆盖前面。

#### **Springboot的tomcat是在何时进行启动的？**

当运行Spring Boot应用程序的main方法时，Spring Boot会创建一个应用程序上下文（ApplicationContext）并加载所有的配置。

SpringBoot会检查应用程序的类路径，以确定是否包含了Tomcat或其他嵌入式Web服务器的依赖项。

如果发现嵌入式Web服务器的依赖项，Spring boot会自动配置并启动嵌入式Web服务器。

一旦Tomcat启动成功，它会开始监听Http请求并路由它们到相应的Spring控制器，从而使应用程序可以处理Http请求。

###### **SpringAop的实现原理？**

嗯，SpringAop是面向切面编程，AOP的实现是基于代理的实现，有两种代理方式，一种是JDK代理，还有一种是Cglib代理。不过JDK只能针对接口代理。一般用来做公共代码的处理，减少代码的耦合。比如Spring的声明式事务管理就是通过AOP实现的，我们做操作日志记录也是通过AOP去实现。

AOP是整个IOC执行流程中的一个扩展点。

首先是先了解它的概念是什么，AOP是指面向切面编程，是Spring三大核心思想之一。

AOP的实现是基于代理的实现，有两种代理方式，一种是JDK代理，还有一种是Cglib代理。不过JDK只能针对接口代理，

其次是它的意义是什么，也就是为什么要用它。我们知道Java是面向对象编程的，当我们想要对某些方法在执行前或者执行后做一些公共的操作，比如日志记录权限控制，我们只能通过封装抽取出公共方法，然后供需要的方法去调用。这时候就会违背了软件设计原则中的单一职责，开闭原则等等原则，显然是不合理的。

#### **Spring事务失效的场景？**

-   主动捕获了异常没有抛出就会导致事务不能进入异常处理进行回滚操作导致失效
-   抛出了检查异常也会导致事务失效，因为Spring默认只会回滚非检查异常，需要配置rollbackFor = Exception.class
-   非public修饰的方法也会导致事务失效，Spring创建代理的前提是方法是public的

嗯，Spring事务可能会因为场景导致失效，比如主动捕获了异常没有抛出就会导致事务不能进入异常处理进行回滚操作导致失效，还有抛出了检查异常也会导致事务失效，因为Spring默认只会回滚非检查异常，需要配置rollbackFor = Exception.class，还有非public修饰的方法也会导致事务失效，Spring创建代理的前提是方法是public的。

#### **Bean的生命周期？**

接口：自上而下，约束和规范

抽象类：自下而上，抽取公共部分

通过BeanDefinition获取Bean的定义信息

BeanDefinitionReader接口，实现扩展性（xml、注解）

AbstractContextApplication，模板方法

-   实例化

Spring容器会根据配置信息创建Bean的实例，通过构造方法或工厂方法，在堆空间中申请内存，通过反射的方式完成，此时对象的属性为默认值，获取Class对象、获取构造器、构造器newInstance

-   属性赋值

一旦Bean被实例化，Spring会Bean的属性，这是通过依赖注入来完成的，完成后调用Aware接口，容器对象属性赋值

-   初始化

Spring容器会调用Bean的初始化回调方法，可以使用@PostConstruct注解，也可以通过实现InitializingBean接口，实现afterProperties方法，会在所有属性被注入后调用，初始化前后会执行BeanPostProcessor

-   使用

Bean可以被应用程序使用

-   销毁

在Bean不需要时，Spring容器可以销毁它。可以使用@PreDestroy，也可以通过实现DisposableBean接口，实现destroy方法，会在Bean销毁之前调用

BeanFactory是访问bean容器的根接口

beanFactoryPostProcessor 用来处理完整的BeanDefinition

BeanDedinitionRegistionPostProcessor 用来处理import注解

#### **Spring的循环依赖如何解决？**

循环依赖其实就是循环引用，比如A依赖于B，B又依赖于A，循环依赖在Spring中是允许存在的，Spring框架依据三级缓存已经解决了大部分的循环依赖

-   一级缓存：单例池，缓存已经初始化完成的bean对象，成品
-   二级缓存：缓存早期的bean对象（生命周期还没走完），半成品
-   三级缓存：缓存的是ObjectFactory，表示对象工厂，用来创建某个对象的，lambdachandas

1.  二级缓存解决一般对象循环依赖

实例化A时，首先创建A原始对象，放入到二级缓存，这时候A需要注入B，B不存在，所以去实例化B，创建B原始对象，放入到二级缓存，这时候B需要注入A，直接从二级缓存获取A，B对象创建成功，存储到一级缓存，再将对象B注入给A，然后存储到一级缓存，二级缓存则被清除掉。

1.  三级缓存解决代理对象循环依赖

实例化A时，原始对象A生成一个ObjectFactory对象（专门用来生成对象A），放入三级缓存，A需要注入B，B对象存在，去实例化B，原始对象B生成一个ObjectFactory对象，放到三级缓存中，对象B需要注入A，就从三级缓存获取A的ObjectFactory对象，通过A的ObjectFactory对象创建代理对象，放到二级缓存中，将A的代理对象注入B，B创建成功，放到一级缓存，将B注入A，A创建成功

-   构造函数出现了循环依赖怎么解决？

A依赖于B，B依赖于A，注入的方式是构造函数

原因：由于Bean的生命周期中构造函数是第一个执行的，Spring框架并不能解决构造函数的依赖注入

解决方案：使用@Lazy进行懒加载，什么时候需要对象再进行Bean对象的创建

#### **SpringMVC的执行流程？**

1.  用户发送请求到前端控制器DispatchServlet
2.  DispatchServlet收到请求调用HandlerMapping处理器映射器
3.  HandlerMapping找到具体的处理器，返回给DispatchServlet
4.  DispatthServlet调用HandlerAdapter处理器适配器
5.  HandlerAdapter经过适配调用具体的处理器Controller
6.  Controller执行完成返回ModelAndView对象
7.  HandlerAdapter将Controller的执行结果ModelAndView返回给DispatchServlet
8.  DispatchServlet将ModelAndView传给ViewReslover视图解析器
9.  ViewReslover解析后返回具体View
10.  DispatchServlet根据View进行视图渲染
11.  DispatchServlet响应用户

###### **介绍下Spring的依赖注入？**

依赖注入是IOC控制反转的具体实现方式，组件之间的依赖关系由Spring容器在运行期进行装配，完全声明式配置依赖，简化代码减少硬编码，可以通过构造器、setter或注解等方式进行注入。

###### **选择拦截器还是过滤器还是切面？**

-   过滤器最先执行，它可以在controller执行前和执行后执行，可以直接获取请求的链接，所以可用于过滤非法请求，但是过滤器不能使用spring容器资源，因为filter是被tomcat调用，interceptor是被spring调用；
-   拦截器其次执行，而且只能在请求进入controller前执行，所以适合做认证授权的检验，并且过滤器能实现的功能拦截器也能轻松实现；
-   全局异常处理器ControllerAdvice在之后执行；
-   切面最后执行，它可以通过配置在方法前后环绕异常时执行，可通过切点获取参数，所以可适用于记录接口请求时间，redis宕机，重复请求检验等，切面的适用范围会更广。

###### **切面中各种通知的适用范围？**

-   使用@Around环绕通知ProceedingJoinPoint，可以对请求参数及返回结果进行操作；
-   @After和@AfterReturning，returning会先执行，可以得到返回结果信息，在方法退出堆栈后才会执行after；
-   @AfterThrowing，拋异常的时候执行，after会在之后执行。

#### **实践场景：使用Spring Security和OAuth2实现用户管理**

1.单点登录如何实现呢？

意义：Single Sign On（SSO）单点登录，可以让多个站点，共用一套授权，用户方便，开发方便，运维方便，节约成本。

2.登录流程是怎样的？

（1）用户在客户端输入用户密码

（2）认证服务执行认证返回token

（3）客户端存储token

（4）用户携带token请求资源

（5）拦截请求检验请求是否合法

（6）检验权限返回资源

3.RBAC基于角色的访问控制（Role-Based Access Control）？

意义： 简化用户的权限管理，便于理解。

4.第三方登录设计？

为什么学习源码

应付面试

解决问题

学习设计思想

方便源码二开或者扩展

每隔半年出去试试，验证自己的技术储备是否满足市场需求，技术才是王道

一个月的时间，梳理宽度，选择两到三个精通项
