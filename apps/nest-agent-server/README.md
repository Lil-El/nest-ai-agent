# Nest

> 项目仅用作个人测试，package.json 中可以不使用 scope

## 架构

MVC 架构：

在 controller 里面写路由，比如 /list 的 get 接口，/create 的 post 接口。

在 service 里写具体的业务逻辑，比如增删改查、调用第三方服务等

这些都是以 module 的形式组织，一个 module 里有 controller、service 等

## 命令

```bash
  nest g module book --no-spec

  nest g res book --no-spec
```

1. `nest g module` 只创建的是 module

2. `nest g res` 创建的是 resource，包含完整的 RESTful 资源模块（模块 + 控制器 + 服务 + DTOs + 实体）
