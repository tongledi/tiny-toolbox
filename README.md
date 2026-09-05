# 随手工具箱 · Tiny Toolbox

**小事，顺手解决。** 手机优先、无需注册的小工具站，当前从「随它转」随机选择转盘开始。

## 已有工具

| 工具   | 地址                     | 功能                                                   |
| ------ | ------------------------ | ------------------------------------------------------ |
| 随它转 | `/tools/decision-wheel/` | 输入 2–24 个选项、等概率转盘、显示结果、浏览器自动暂存 |

`/` 为工具首页。只有已经可用的工具才进入首页；后续方向见 [路线图](docs/ROADMAP.md)。

## 本地运行

需要 **Node.js 22.16+（22.x）**、npm、Python 3（用于静态服务）。依赖版本由 `package-lock.json` 固定。

```sh
npm ci
npm run dev
```

开发地址：`http://localhost:8765/`。同一局域网的手机用 `http://<电脑局域网IP>:8765/` 访问，电脑需保持开机、不休眠。开发服务也使用 8765 端口，启动前请关闭已运行的静态服务，或使用 `npm run dev -- --port 8766`。

正式本地服务：

```sh
npm run build
npm start
```

构建输出在 `dist/client/`，Python 只提供这个静态目录。Mac 可双击 `启动工具箱.command`；兼容原来的 `启动转盘.command`。启动器会在缺少构建时提示先构建。端口冲突会直接报错，不会关闭其他进程。

## 工程结构

```text
app/
  page.tsx                    # 工具目录首页
  layout.tsx                  # 全站导航、页脚与默认元信息
  globals.css                 # 全站主题和首页样式
  tools/decision-wheel/       # 转盘路由及页面元信息
features/decision-wheel/
  decision-wheel.tsx          # 转盘交互与本地暂存
  logic.ts                    # 输入规则、随机抽取、停靠角度
  wheel.css                   # 仅作用于 .wheel-tool 的样式
lib/tools.ts                  # 可用工具目录
components/ui/                # 既有通用 UI 组件
tests/                       # 核心逻辑回归测试
docs/                        # 产品方向与开发约定
```

沿用 React 19、TypeScript、Vinext/Vite、Tailwind 与现有 Shadcn/Base UI 组件。静态导出，无业务后端、数据库或登录系统。

## 检查与协作

```sh
npm run typecheck
npm run lint
npm test
npm run build
# 或一次执行全部检查
npm run check
```

GitHub Actions 对 `main` 的推送及 PR 执行同样的检查，并保留静态构建产物 7 天。CI 不自动发布网站。新增工具参见 [开发指南](docs/CONTRIBUTING.md)。

## 数据与兼容

- 选项使用浏览器 `localStorage`，不会上传到服务端；不会跨浏览器、设备同步。
- 保留原始存储键 `just-spin-options-v1`。从原转盘迁移到新路由，原站点同源下的选项仍可读取。
- 清除网站数据会删除暂存。地址中的主机或端口发生变化，也会被浏览器视作不同站点。
- 随机使用 `crypto.getRandomValues` 和拒绝采样，每个格子概率相等。重复文字仍算多个格子；40 字按 Unicode 码点计数。
- 兼容支持当前 JavaScript/CSS 的手机浏览器；已处理减少动画偏好。iPhone 微信内实际交互仍需真机验收。
- 转盘保留可选的 `start_wheel_spin` WebMCP 接口。无支持该接口的验证环境，尚未验证此接口；普通浏览器不依赖它。

项目保持私有，暂未选择开源许可证。对外开放或公网部署前另行决定许可证、域名和托管方式。
