# @oh-rn/react-native-gif-player for HarmonyOS

本项目基于 [react-native-gif-player](https://github.com/ysfzrn/react-native-gif-player) 开发，为 React Native 鸿蒙（OpenHarmony）适配版本。

## 版本对应关系

| 鸿蒙适配包版本 | 原始库版本 | 支持 RN 版本 | Autolink | 编译 API 版本 |
| ------------ | ---------- | ------------ | -------- | ------------- |
| 见发布记录 | 1.0.2 | 0.72+ | 是 | API12+ |

## 安装

```bash
npm install @oh-rn/react-native-gif-player
```

## 使用

```tsx
import { GifPlayerView } from 'react-native-gif-player';

// 网络或本地（require()）GIF 播放
<GifPlayerView
  ref={gifPlayerRef}
  style={styles.box}
  source={require('./assets/demo.gif')}   // 或 { uri: 'https://.../x.gif' }
  paused={false}
  loopCount={0}                            // 0 = 无限循环
  onLoad={(e) => console.log(e.nativeEvent.duration, e.nativeEvent.frameCount)}
  onFrame={(e) => console.log(e.nativeEvent.frameNumber)}
  onEnd={() => console.log('one loop ended')}
  onError={(e) => console.log(e.nativeEvent.error)}
/>

// 命令：跳帧 / 清内存
gifPlayerRef.current?.jumpToFrame(0);
gifPlayerRef.current?.memoryClear();
```

> import 时使用原库名 `'react-native-gif-player'`，而非鸿蒙包名（由 RNOH alias 映射）。

**权限要求**：
- 加载网络 GIF 需在 `module.json5` 声明 `ohos.permission.INTERNET`（system_grant 级，声明即可）。

## Link

| 版本 | 是否支持 Autolink |
|------|------------------|
| 当前版本 | 是 |

如使用版本支持 Autolink 且工程已接入，可跳过手动配置。

<details>
<summary>Manual Link 配置</summary>

> **说明**：本模块需要同时在 C++ 侧和 ETS 侧注册 Package。

### 1. Overrides RN SDK

在工程根目录 `oh-package.json5` 添加：

```json
{
  "overrides": {
    "@rnoh/react-native-openharmony": "./react_native_openharmony"
  }
}
```

### 2. 引入原生端依赖

打开 `entry/oh-package.json5`，添加：

```json
"dependencies": {
  "@oh-rn/react-native-gif-player": "file:../../node_modules/@oh-rn/react-native-gif-player/harmony/gif_player.har"
}
```

执行 `ohpm install`。

### 3. 配置 CMakeLists

打开 `entry/src/main/cpp/CMakeLists.txt`，添加：

```cmake
set(OH_MODULES "${CMAKE_CURRENT_SOURCE_DIR}/../../../oh_modules")

add_subdirectory("${OH_MODULES}/@oh-rn/react-native-gif-player/src/main/cpp" ./gif_player)

target_link_libraries(rnoh_app PUBLIC gif_player)
```

### 4. 注册 Package（C++ 侧）

打开 `entry/src/main/cpp/PackageProvider.cpp`，添加：

```cpp
#include "GifPlayerPackage.h"

std::vector<std::shared_ptr<Package>> PackageProvider::getPackages(Package::Context ctx) {
    return {
        std::make_shared<GifPlayerPackage>(ctx),
    };
}
```

### 5. 注册 Package（ETS 侧）

打开 `entry/src/main/ets/RNPackagesFactory.ets`，添加：

```typescript
import { GifPlayerPackage } from '@oh-rn/react-native-gif-player/ts';

export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
  return [
    new GifPlayerPackage(ctx),
  ];
}
```

</details>

## 属性 / API

| API | 描述 | 参数 | 返回值 | HarmonyOS 支持 |
|-----|------|------|--------|----------------|
| source | 播放源（网络 URL / 本地 require() 资产 / 自定义 URL） | `{ uri?: string, type?: string, local?: boolean }` | — | ✅ 完全支持 |
| paused | 暂停 / 播放 | `boolean`（必填） | — | ✅ 完全支持 |
| loopCount | 循环次数，0 = 无限循环 | `Int32`（默认 0） | — | ✅ 完全支持 |
| onLoad | 加载完成（动图含总时长与帧数；静态图返回 duration=0, frameCount=1） | — | `{ duration: number(ms), frameCount: number }` | ✅ 完全支持 |
| onStart | 动画开始 | — | — | ✅ 完全支持 |
| onStop | 动画暂停 / 停止 | — | — | ✅ 完全支持 |
| onEnd | 一轮播完最后一帧 | — | — | ✅ 完全支持 |
| onFrame | 帧切换（帧号从 1 起） | — | `{ frameNumber: number }` | ✅ 完全支持 |
| onError | 加载 / 解码失败（最多重试 3 次后上报） | — | `{ error: string }` | ✅ 完全支持 |
| jumpToFrame | 跳到指定帧并保持播放状态 | `frameNumber: Int32`（0 起） | — | ✅ 完全支持 |
| memoryClear | 释放全部已解码帧与 ImageSource | — | — | ✅ 完全支持 |

### 平台差异
- 填充模式对应 RN `FIT_CENTER` / iOS `scaleAspectFit`（`ImageFit.Contain`）。
- `jumpToFrame` 采用 Android 参数语义（跳到第 n 帧）；iOS 端忽略参数恒回第 0 帧。
- 帧引擎为 Image Kit 全帧解码 + 按每帧延迟逐帧渲染（ArkUI 无逐帧回调/跳帧控件），超大帧数 GIF 会一次性解码全部帧，注意内存。

### 使用限制
- 网络源需 `ohos.permission.INTERNET`；下载上限 50 MB。
- `memoryClear` 后画面清空，需切换 source 重新加载。

## 快速验证（运行 Example）

### 前置条件

| 依赖 | 版本要求 |
|------|----------|
| Node.js | >= 18 |
| DevEco Studio | 5.0+ / 6.0+ |
| HarmonyOS SDK | API 12+ |

### 运行步骤

**1. 克隆仓库**

```bash
git clone <仓库地址>
cd <仓库目录>
```

**2. 安装依赖并构建**

```bash
npm install --legacy-peer-deps
npm pack           # 生成 tgz 包（会自动触发 prepare 构建 JS 产物）
```

**3. 进入 example 目录，安装依赖**

```bash
cd example
npm install --legacy-peer-deps
```

**4. 生成 JS Bundle**

```bash
npm run dev
```

产物：`harmony/entry/src/main/resources/rawfile/bundle.harmony.js`

**5. 用 DevEco Studio 打开鸿蒙工程**

- 打开 DevEco Studio
- 选择 `example/harmony` 目录
- 等待 Sync 完成

**6. 编译并运行 HAP**

在 DevEco Studio 中点击运行按钮，将 HAP 安装到设备/模拟器。

> **注意**：Example 中已预置插件依赖和 Package 注册，无需手动配置 Link。

## 约束与限制

### 兼容性

- RNOH: 0.72+
- HarmonyOS SDK: API 12+
- DevEco Studio: 5.0+

## 遗留问题

无

## 开源协议

本项目基于 [MIT License](https://github.com/ysfzrn/react-native-gif-player/blob/main/LICENSE)，详见 [LICENSE](./LICENSE) 文件。