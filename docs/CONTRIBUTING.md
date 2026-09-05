# 开发约定

## 添加工具

1. 在 `features/<slug>/` 放工具 UI、纯逻辑和局部样式。
2. 在 `app/tools/<slug>/page.tsx` 创建路由，导出工具专属 metadata，并组合功能组件。
3. 在 `lib/tools.ts` 登记名称、简介、分类、独立地址和简短功能说明。只登记已经可用的工具。
4. 复用根布局的导航和页脚、全站颜色及现有 `components/ui` 原语。工具样式限定在自己的容器下，避免影响其他工具。
5. 对有实质风险的逻辑添加针对用户行为的回归测试。通过 `npm run check` 后提交。

保持手写、明确的路由，不引入动态插件加载、工具运行时框架或数据库。工具量增长后再评估抽象。

## 本地数据

每个工具使用独立、带版本的存储键。捕获存储不可用和数据不合法的情况，不把暂存失败当作整个工具失败。既有键升级需要迁移策略；转盘继续使用 `just-spin-options-v1`。

## 提交和发布

主分支为 `main`。后续功能建议在功能分支开发，通过 PR 和自动检查合入。提交说明写清实际行为变化。不要提交 `.env`、令牌、日志、PID、依赖目录和构建产物。

`npm run build` 生成可独立托管的 `dist/client/`。目录路由使用末尾斜杠，便于 Python 或一般静态服务器提供对应的 `index.html`。GitHub Actions 只做检查和构建产物保存，部署单独决定。

现有生成的 `components/ui/` 和 `hooks/use-mobile.ts` 保留上游实现，不参与项目 lint；TypeScript 仍检查整个工程。项目 lint 针对站点和功能代码。转盘的两处 hydration/storage 状态更新带有局部 React 编译器规则例外及原因。

静态站点使用原生链接做完整页面导航，故关闭 `nextjs/no-html-link-for-pages`；这使导航不依赖 RSC 服务端。当前 Vinext 版本启用 `trailingSlash` 时预渲染可能跳过子路由，工程使用默认输出，再由 `scripts/prepare-static.ts` 检查每个已登记工具的 HTML 并生成目录入口。该检查失败则整个 build 失败，防止漏页发布。
