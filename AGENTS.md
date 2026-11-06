# AGENTS.md

节拍器 Web 应用。给本仓库写代码的 agent 用这个文件当入口。

## 技术栈

- Vue 3（`<script setup lang="ts">`，Composition API）+ TypeScript
- Vite 8 构建，`@` 别名指向 `src/`
- pnpm 包管理（`pnpm-lock.yaml`，不要用 npm/yarn）
- Node `^22.18.0 || >=24.12.0`
- 代码检查：oxlint + ESLint（`eslint-plugin-vue`、`@vue/eslint-config-typescript`）
- 格式化：Prettier
- 测试：**未配置**。新增非平凡逻辑（分支、循环、解析、时序）时加自检或先引入 Vitest。

## 目录结构

```
src/
  main.ts                 # createApp 挂载入口
  App.vue                 # 页面根组件
  composables/            # 组合式函数（状态 + 副作用）
    useMetronome.ts       # 节拍器：音频调度、播放状态、练习倒计时
  lib/                    # 与 Vue 无关的纯函数
    tempo.ts              # BPM 范围、clampBpm、secondsPerBeat、TEMPO_PRESETS、自动增速、clickVoice
    timer.ts              # 分钟范围、clampMinutes、remainingSeconds、formatSeconds
    *.check.ts            # 对应的断言自检，由 pnpm check 执行
```

约定：

- 纯计算放 `src/lib/`，无 Vue 依赖，便于测试。
- 有状态/副作用的封装放 `src/composables/`，命名 `useXxx`，返回 `ref` 和函数。
- 组件只负责展示与绑定，不在组件里写调度或音频细节。
- 新增 UI 依赖前先确认必要性；当前**没有任何第三方 UI 库**，需要的外部组件由使用者自行安装。

## 命令

```sh
pnpm install      # 安装依赖
pnpm dev          # 开发服务器（默认 http://localhost:5173）
pnpm build        # 类型检查 + 生产构建
pnpm type-check   # 仅 vue-tsc 类型检查
pnpm check        # 跑 src/lib/*.check.ts 自检（node 直接执行 TS）
pnpm lint         # oxlint + eslint，带 --fix
pnpm format       # prettier 格式化 src/
```

提交前至少跑 `pnpm type-check` 和 `pnpm lint`。

## 代码风格

- Prettier：无分号、单引号、`printWidth: 100`、2 空格缩进、LF、UTF-8。
- 使用相对/`@` 别名导入，`@/lib/tempo` 这类绝对别名优先于 `../../`。
- 只注释代码表达不出的“为什么”，一行搞定。
- 不做没被要求的抽象、配置项、兼容层。

## 领域约定

- BPM 范围 `MIN_BPM=20` ~ `MAX_BPM=300`，一律经 `clampBpm()` 归一化。
- 常用速度预设放在 `tempo.ts` 的 `TEMPO_PRESETS`（40/60/66/80/100/120/152/176，附意大利语术语）。下拉框与滑块、数字框共用同一个 `bpm` ref，三者始终同步；当前值不在预设里时，下拉框会多出一个 disabled 的“自定义 N”选项来保持显示。
- 拍号默认 4/4，由 `useMetronome(bpm, beatsPerBar=4)` 决定拍数；`currentBeat` 是 0-based 的小节内位置，UI 负责 +1 渲染。
- 首拍强调是开关 `accentFirstBeat`（默认开），首拍 1600Hz/0.8、其余 1000Hz/0.5；开关只在调度下一拍时读取，播放中切换从下一拍或下一小节生效。
- 自动增速是可选功能：`rampEnabled` 默认关，`rampMode` 为 `fixed`（每步加固定 BPM）或 `percent`（每步按当前 BPM 百分比放大），`rampAmount` 默认 10、`rampInterval` 默认 1 分钟，结果一律经 `increaseBpm()` 再 `clampBpm()` 兜到 20–300。增速逻辑写在 `schedule()` 里读 `AudioContext.currentTime`，不用 `setInterval`，后台标签页被节流时不会拖慢进度；用 `Math.floor(已播放时间 / 步长)` 和 `rampStepsDone` 比对来补步，掉帧时不会漏步或重复加速。
- 练习倒计时是可选功能：`timerEnabled`（默认 `false`）关闭时无限播放，UI 只显示“定时停止”复选框；开启后才出现分钟数与剩余时间。`timerMinutes`（1–120，默认 5）决定时长，`remaining` 是剩余秒数，归零自动 `stop()`。关闭时 `timerStopAt = Infinity`，调度循环的边界条件自然失效，无需分支。倒计时读的是 `AudioContext.currentTime`，与节拍同源；调度循环另用 `nextBeatAt < timerStopAt` 兜底，避免倒计时归零后还有已排程的击打声。
- 暂停/继续是可选操作：`isPaused` 为真时 `schedule()` 直接返回，同时停掉主增益（`master` GainNode）并取消待触发的视觉定时器。恢复时 `nextBeatAt` 重设为当前音频时间，所以暂停期间不会补打积压的节拍。所有与“已播放多久”相关的逻辑（倒计时、自动增速）都走 `elapsed()` = 暂停前累计 + 当前段已播放时间，暂停冻结、继续接续。`stop()` 还会 `osc.stop()` 掉已排程的点击，避免停止后仍有残响。
- 切分音两个维度：`subdivision` 把每拍拆成 1/2/3/4 份（1 = 不拆），`accentOffbeat` 给“反拍”加重音。反拍定义是拍内的后半，即 `tick * 2 === subdivision`（4 拆时是第 3 个 tick，2 拆时是第 2 个）；三连音没有正中间的点，所以不会命中反拍。四种音色由 `lib/tempo.ts` 的 `clickVoice()` 纯函数决定（`accent` / `beat` / `offbeat` / `subdivision`），频率与音量在 `useMetronome.ts` 的 `CLICK` 表里。音柱只在整拍（`tick === 0`）推进，细分不点亮柱子。
- 音柱按小节位置阶梯递减：首拍最高，之后每拍等距下降，最低到 30%；高度是百分比，容器 `.bar` 用 `align-items: flex-end` 从底部对齐，所以柱子底部始终齐平、顶边成阶梯。
- 视觉指示同样跟音频时钟：排程时用 `setTimeout(at - currentTime)` 反推渲染时刻，不用 `setInterval` 猜测；停止时要清理这些待触发的 timer。
- 改 BPM 时不要重建 `AudioContext`；仅在组件卸载时关闭。

## 无障碍与交互

- 控件用原生语义元素（`button`、`input[type=range]`、`input[type=number]`、`select`），保留键盘操作。
