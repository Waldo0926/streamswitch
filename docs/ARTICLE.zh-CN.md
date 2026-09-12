# 用 RxJS 写一个小型响应式模拟器：从“会跑”到“可推理”

StreamSwitch 最开始是我对一个问题的实验：当时间、输入、随机生成、暂停、重启和渲染同时发生时，能不能仍然让前端状态变化保持清晰、可推理。于是我选择了 RxJS 和函数式状态管理，把它做成了一个小型数据包路由模拟器。

它是一个很小的数据包路由游戏：数据包从左侧进入网关，每个包属于 Alpha、Beta 或 Gamma 三条路线之一；玩家需要在数据包抵达前选择正确的出口。这个规则不复杂，但它刚好足够让计时器、键盘/鼠标输入、随机生成、暂停、重启、页面 visibility、渲染和测试全部发生交互。

我想解决的不是“怎么写一个小游戏”，而是：**怎么让一个不断发生事件的前端程序仍然保持可推理、可测试。**

## 1. 把事件当成数据

传统写法通常会让 `setInterval` 改一点状态、键盘事件再改一点状态、按钮点击又改一点状态。问题不是它不能工作，而是状态变化来自太多地方。

在 StreamSwitch 里，不同来源最后都变成 action：

```ts
merge(tick$, spawn$, routeInput$, pause$)
    .pipe(scan(reduceState, initialState));
```

Timer 产生 `tick`，随机生成器产生 `spawn`，键盘和鼠标产生 `select-route`。它们来自不同世界，但最后都走同一个 reducer。

这样做最大的好处不是代码短，而是**状态只有一个入口**。

## 2. Reducer 保持纯函数

`model.ts` 不读取 DOM，不读取当前时间，也不调用随机函数。

它只做一件事：

```text
旧状态 + Action -> 新状态
```

因此很多原本像“运行时问题”的东西，可以变成普通测试：

- 两个 packet 同一个 tick 抵达怎么办？
- 选错路线是否一定扣一条命？
- lives 归零后状态是否冻结？
- 时间越长，speed ramp 是否按预期增长？

这些都不需要真的打开浏览器。

## 3. 暂停不是到处写 `if (paused)`

暂停功能很容易写成一种“污染”：Timer 判断一次、键盘判断一次、spawn 判断一次、click 再判断一次。

我更喜欢把暂停理解成 **Observable 的 gate**：

```ts
export const gatedBy =
    <T>(gate$: Observable<boolean>) =>
    (source$: Observable<T>) =>
        source$.pipe(
            withLatestFrom(gate$),
            filter(([, open]) => open),
            map(([value]) => value),
        );
```

只要是 gameplay stream，就统一经过这道门。

Gate 关闭时产生的事件直接丢弃，而不是缓存。这样恢复以后不会突然把暂停期间积累的 timer event 一次性释放出来。

页面进入后台时我也复用同一套 gate，因为浏览器对后台 tab 的 timer throttling 并不保证每条 stream 完全同步。

## 4. 随机也可以是确定的

如果在 reducer 里直接调用 `Math.random()`，同样的状态和 action 可能产生不同结果，这会让 replay 和测试变得困难。

StreamSwitch 使用一个很小的 `xorshift32` PRNG。随机数先在 stream layer 生成，再变成普通的：

```ts
{ type: "spawn", route: 2 }
```

Reducer 根本不知道这个 route 是“随机”出来的。

于是一次 run 可以被描述为：

```text
seed + 用户输入历史
```

这意味着以后可以进一步做 replay、可复现 bug report，甚至 property-based testing。

## 5. DOM Side Effect 留在系统边界

我没有让 state 告诉 renderer “删除哪个 SVG node”。State 只保存当前还存在的 packet。

Renderer 自己维护：

```text
packet id -> SVG element
```

如果某个 id 不再出现在 state 里，就删除对应 node。

这让 model 更干净。代价是 renderer 每一帧需要比较一下当前 id，但这个项目规模下完全值得。

## 6. 我真正学到的东西

“函数式”并不是说整个浏览器程序不能有 side effect——那显然不现实。

真正有价值的是**规定 side effect 出现在哪里**：

- 随机数集中在 random / stream layer；
- 浏览器事件集中适配成 Observable；
- reducer 只负责纯状态变化；
- renderer 负责 DOM；
- main 只负责把模块组合起来。

这种边界对面试也很有帮助，因为我可以清楚解释每个文件为什么存在，以及为什么选择这样的数据流和状态结构。

## 7. 如果继续做

下一步我会考虑：

- 用 seed + input history 生成 replay 文件；
- 用 property-based tests 检查 reducer invariant；
- 做一个 Observable diagnostics panel，显示 tick/spawn/input 的实时速率；
- 增加难度、移动端手势和无障碍设置。

对我来说，这个项目最重要的不是最终小游戏有多复杂，而是它把 RxJS、不可变状态和纯函数真正变成了一个我能解释、能测试、也能继续扩展的结构。
