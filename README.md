# 节拍器

基于 Vue 3 + Vite 的网页节拍器，纯前端、无第三方 UI 库，用 Web Audio 调度发声。

## 功能

- **BPM 20–300**：下拉预设（Largo / Adagio / Andante / Allegro 等意大利语术语）、滑块、数字框三种方式，三者始终同步
- **拍号**：2/4、3/4、4/4、6/8 四种按钮，默认 4/4，切换即改变每小节拍数与音柱数量
- **音柱**：按小节位置阶梯递减（首拍最高、依次降至 30%），高亮当前拍
- **首拍强调音**：可选，开启时小节第一拍用更高更响的音色
- **切分音**：每拍可拆 2 / 3 / 4 份（八分、三连音、十六分），图标按钮选择，并可给反拍加重音
- **暂停 / 继续**：暂停时静音并停止调度，恢复时不补打积压的节拍
- **定时停止**：可选，1–120 分钟，到点自动停止
- **自动增速**：可选，每 N 分钟按固定 BPM 或百分比提速，结果限制在 20–300

## 技术要点

节拍不靠 `setInterval` 直接发声：定时器只做 25ms 一次的调度唤醒，真正的击打提前 100ms 排进 `AudioContext` 时钟，避免 JS 定时器抖动导致节奏不稳。倒计时、自动增速和音柱高亮同样以音频时钟为准，暂停时全部冻结。

目录结构：

```
src/
  main.ts                 # 应用入口
  App.vue                 # 页面：控件与音柱
  composables/
    useMetronome.ts       # 音频调度、播放状态、倒计时、增速
  lib/
    tempo.ts              # BPM 范围与预设、增速计算、clickVoice 音色选择
    timer.ts              # 分钟范围、剩余时间与格式化
    *.check.ts            # 断言自检，由 pnpm check 执行
```

纯计算都放在 `src/lib/`（无 Vue 依赖、可直接用 node 跑测试），有状态和副作用的封装放在 `src/composables/`，组件只负责展示与绑定。

## 开发

需要 Node `^22.18.0 || >=24.12.0` 与 pnpm。

```sh
pnpm install      # 安装依赖
pnpm dev          # 开发服务器，默认 http://localhost:5173
```

## 构建与检查

```sh
pnpm build        # 类型检查 + 生产构建
pnpm type-check   # 仅 vue-tsc 类型检查
pnpm check        # 运行 lib 下的断言自检
pnpm lint         # oxlint + eslint，带 --fix
pnpm format       # prettier 格式化 src/
```

## 浏览器要求

需要支持 Web Audio API 的现代浏览器。音频在首次点击「开始」后才初始化，符合浏览器的自动播放策略。

## 更多

面向 AI coding agent 的项目约定见 [AGENTS.md](./AGENTS.md)。
