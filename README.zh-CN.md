# StreamSwitch

[![类型](https://img.shields.io/badge/%E7%B1%BB%E5%9E%8B-%E4%B8%AA%E4%BA%BA%E9%A1%B9%E7%9B%AE-2563eb?style=for-the-badge)](#)
[![技术](https://img.shields.io/badge/%E6%8A%80%E6%9C%AF-TypeScript_%C2%B7_RxJS-7c3aed?style=for-the-badge)](#)
[![许可证](https://img.shields.io/badge/%E8%AE%B8%E5%8F%AF%E8%AF%81-MIT-16a34a?style=for-the-badge)](LICENSE)


[English](README.md) · **中文**

> 一个基于 RxJS 的响应式数据包路由小游戏，用不可变状态、确定性模拟和可测试事件流实现。

StreamSwitch 是一个用来探索 **Functional Reactive Programming（函数式响应式编程）** 的独立浏览器项目。它把问题建模成数据包路由：数据包不断进入网关，你需要在它抵达前选择正确的 Alpha / Beta / Gamma 通道。

我真正想展示的不是小游戏本身，而是代码组织方式：键盘、鼠标、计时器、暂停、页面可见性、随机生成和重新开始都被建模成 Observable；游戏规则保持为纯函数；DOM 渲染被隔离在系统边界。

## 我想展示的几个技术点

- 单一不可变状态（immutable state）；
- 将外部事件统一转换成 typed actions；
- 使用纯 reducer 管理状态变化；
- 用 Observable gate 处理暂停，而不是散落的 mutable flag；
- 使用 deterministic PRNG，让同一个 seed 可以复现相同模拟；
- 将 DOM side effects 与业务状态逻辑分离；
- 用 Vitest 对 reducer、随机数与 stream primitive 分层测试。

项目采用独立的状态结构、reducer 设计、确定性随机算法、UI、测试和文档，重点展示可测试的数据流与状态管理。

## 操作

- `1` / `2` / `3`：选择 Alpha / Beta / Gamma
- `↑` / `↓`：切换路线
- 鼠标：点击路线按钮
- `P`：暂停 / 恢复
- `R`：重新开始

正确路由会提高分数与 streak；错误会损失生命值。随着运行时间增加，数据流速度也会提高。

## 架构

```text
浏览器事件 / Timer / Visibility
              │
              ▼
         RxJS Observable
              │
              ▼
          typed Action
              │
              ▼
      scan(reduceState, state)
              │
              ▼
        immutable state
              │
              ▼
           render()
```

`src/model.ts` 完全不读取 DOM、当前时间或随机源，所以同一组输入一定产生同一组输出。随机数也不在 reducer 内生成，而是在 stream layer 中先生成，再转成普通的 `spawn` action。

这种结构让我可以把“外部世界”和“状态规则”分开：前者负责事件与 side effect，后者负责可推理、可测试的状态变化。

## 运行

```bash
npm install
npm run dev
```

测试与构建：

```bash
npm run build
npm test
```

更完整的技术文章见：[用 RxJS 写一个小型响应式模拟器](docs/ARTICLE.zh-CN.md)。

## License

MIT
