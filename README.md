> 文档模板：v0.4.2

<p align="center">
  <h1 align="center"> <code>react-native-gif-player</code> </h1>
</p>

本项目基于 [react-native-gif-player](https://github.com/ysfzrn/react-native-gif-player) v1.0.0 开发，版本所属关系如下：

| 三方库名称 | 三方库版本（npm地址） | 发布信息 | 支持RN版本 | Autolink | 编译API版本 | 社区基线版本 | 源码地址 |
| ---------- | -------------------- | -------- | ---------- | -------- | ----------- | ------------ | -------- |
| react-native-gif-player | [~ 1.0.0](https://www.npmjs.com/package/react-native-gif-player) | [Github Releases](https://github.com/react-native-oh-library/react-native-gif-player/releases) | 72.*/0.77.*/0.82.*/ 0.84.*   | 是 | API12+ | 1.0.0 | [master](https://github.com/react-native-oh-library/react-native-gif-player) |

## 简介

react-native-gif-player 是一个用于播放 GIF / 动图 WebP / 静态图片的 React Native 视图组件。RN 自带的 `Image` 组件虽然可以显示 GIF，但缺少停止播放的能力；本组件提供了暂停/继续、循环次数控制、帧监听、跳帧、内存释放等能力。上游基于 iOS `UIImage` 与 Android `Fresco` 封装。

鸿蒙化版本在 ArkTS 侧基于 ImageKit 解码与帧循环调度，实现了同名 Fabric 组件 `GifPlayerView`，接口行为对齐 iOS/Android 端：

- `onLoad {duration(毫秒), frameCount}`；静态图返回 `{0, 1}` 且不进入帧循环；
- `onStart`/`onStop` 在播放/暂停切换时触发；`onFrame` 帧号从 1 起；
- `onEnd` 在每轮最后一帧渲染时触发；`loopCount=0` 无限循环，`>0` 播放指定轮数后停在末帧并触发 `onStop`；
- 网络/本地源加载失败最多重试 3 次后触发 `onError`。

## 下载安装

进入到工程目录并输入以下命令：

**npm**

```bash
npm install @react-native-ohos/react-native-gif-player
```

**yarn**

```bash
yarn add @react-native-ohos/react-native-gif-player
```

## Link

| | 是否支持autolink | RN框架版本 |
| - | - | - |
| ~1.0.0 | 是 | 0.72.* / 0.77.* / 0.82.* / 0.84.* |

使用AutoLink的工程需要根据该文档配置，Autolink框架指导文档：https://gitcode.com/CPF-RN/ohos_react_native/blob/master/docs/zh-cn/Autolinking.md

如您使用的版本支持 Autolink，并且工程已接入 Autolink，可跳过ManualLink配置。
<details>
  <summary>ManualLink: 此步骤为手动配置原生依赖项的指导</summary>

首先需要使用 DevEco Studio 打开项目里的 HarmonyOS 工程 `harmony`。

### 1. Overrides RN SDK

为了让工程依赖同一个版本的 RN SDK，需要在工程根目录的 `oh-package.json5` 添加 overrides 字段，指向工程需要使用的 RN SDK 版本。替换的版本既可以是一个具体的版本号，也可以是一个模糊版本，还可以是本地存在的 HAR 包或源码目录。

关于该字段的作用请阅读[官方说明](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides-V5/ide-oh-package-json5-V5#zh-cn_topic_0000001792256137_overrides)

```json5
{
  "overrides": {
    "@rnoh/react-native-openharmony": "~0.84.2" // 0.84 工程;其他框架版本使用对应的 RNOH 版本
    // "@rnoh/react-native-openharmony" : "./react_native_openharmony.har" // 指向本地 har 包的路径
    // "@rnoh/react-native-openharmony" : "./react_native_openharmony" // 指向源码路径
  }
}
```

### 2. 引入原生端代码

目前有两种方法：

- 通过 har 包引入；
- 直接链接源码。

方法一：通过 har 包引入（推荐）

> [!TIP] har 包位于三方库安装路径的 `harmony` 文件夹下。

打开 `entry/oh-package.json5`，添加以下依赖

```json
"dependencies": {
    "@rnoh/react-native-openharmony": "file:../react_native_openharmony",
    "@react-native-ohos/react-gif-player": "file:../../node_modules/@react-native-ohos/react-gif-player/harmony/gif_player.har"
  }
```

点击右上角的 `sync` 按钮

或者在命令行终端执行：

```bash
cd entry
ohpm install
```

方法二：直接链接源码

> [!TIP] 如需使用直接链接源码，请参考[直接链接源码说明](https://gitcode.com/CPF-RN/usage-docs/blob/master/zh-cn/link-source-code.md)

### 3. 配置 CMakeLists 和引入 GifPlayerPackage

> 若工程已接入 RNOH AutoLink,且本库的 `harmony.autolinking` 配置生效(GifPlayerPackage / gif_player),则 CMake 与 PackageProvider 注册可由 AutoLink 自动生成,可跳过本节手动配置。

打开 `entry/src/main/cpp/CMakeLists.txt`，添加：

```diff
project(rnapp)
cmake_minimum_required(VERSION 3.4.1)
set(CMAKE_SKIP_BUILD_RPATH TRUE)
set(RNOH_APP_DIR "${CMAKE_CURRENT_SOURCE_DIR}")
set(NODE_MODULES "${CMAKE_CURRENT_SOURCE_DIR}/../../../../../node_modules")
set(OH_MODULES "${CMAKE_CURRENT_SOURCE_DIR}/../../../oh_modules")
set(RNOH_CPP_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../../../oh_modules/@rnoh/react-native-openharmony/src/main/cpp")
set(LOG_VERBOSITY_LEVEL 1)
set(CMAKE_ASM_FLAGS "-Wno-error=unused-command-line-argument -Qunused-arguments")
set(CMAKE_CXX_FLAGS "-fstack-protector-strong -Wl,-z,relro,-z,now,-z,noexecstack -s -fPIE -pie")
set(WITH_HITRACE_SYSTRACE 1) # for other CMakeLists.txt files to use
add_compile_definitions(WITH_HITRACE_SYSTRACE)

add_subdirectory("${RNOH_CPP_DIR}" ./rn)
+ add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-gif-player/src/main/cpp" ./gif_player)

# RNOH_BEGIN: manual_package_linking_1
# RNOH_END: manual_package_linking_1

file(GLOB GENERATED_CPP_FILES "./generated/*.cpp")

add_library(rnoh_app SHARED
    ${GENERATED_CPP_FILES}
    "./PackageProvider.cpp"
    "${RNOH_CPP_DIR}/RNOHAppNapiBridge.cpp"
)
target_link_libraries(rnoh_app PUBLIC rnoh)
+ target_link_libraries(rnoh_app PUBLIC gif_player)
```

打开 `entry/src/main/cpp/PackageProvider.cpp`，添加：

```diff
  #include "RNOH/PackageProvider.h"
+ #include "GifPlayerPackage.h"

  using namespace rnoh;

  std::vector<std::shared_ptr<Package>> PackageProvider::getPackages(Package::Context ctx) {
      return {
+       std::make_shared<GifPlayerPackage>(ctx),
      };
  }
```

### 4. 在 ArkTS 侧引入 GifPlayerPackage

打开 `entry/src/main/ets/RNPackagesFactory.ts`（或 `.ets`），添加：

```diff
+ import { GifPlayerPackage } from '@react-native-ohos/react-native-gif-player';

  export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
    return [
+     new GifPlayerPackage(ctx),
    ];
  }
```
</details>

### 运行

点击右上角的 `sync` 按钮

或者在命令行终端执行：

```bash
cd entry
ohpm install
```

然后编译、运行即可。

## 约束与限制

### 兼容性

本文档内容基于以下版本验证通过：
1. RNOH：0.72.20；SDK：HarmonyOS NEXT Developer Beta1；IDE：DevEco Studio 5.0.3.200；ROM：3.0.0.18；
2. RNOH：0.77.18；SDK：HarmonyOS 6.0.0 Release SDK；IDE：DevEco Studio 6.0.0.868；ROM：6.0.0.112；
3. RNOH：0.82.1；SDK：HarmonyOS 6.0.1 Release SDK；IDE：DevEco Studio 6.0.1 Release；ROM：6.0.0.120 SP7；
4. RNOH：0.84.1；SDK：HarmonyOS 6.0.1 Release SDK；IDE：DevEco Studio 6.0.1 Release；ROM：6.0.0.120 SP7；

### 权限要求

库本身无特殊权限要求。加载网络 GIF/WebP 源时，需应用已声明 `ohos.permission.INTERNET` 权限（RNOH 工程模板默认已声明）。

### 已知限制

1. 网络 GIF/WebP 源通过 `@kit.NetworkKit` 的 `http` 模块整体下载后解码，下载上限为 50MB，超出上限加载失败并触发 `onError`；
2. `memoryClear` 释放全部已解码帧后画面清空，此时再次播放/跳帧无效，需重新设置 `source` 重新加载后方可恢复播放。

## 使用示例

安装并完成鸿蒙侧集成（见「使用说明」）后，在业务代码中使用 `GifPlayerView`：

```tsx
import { useRef, useState } from 'react';
import { Button } from 'react-native';
import { GifPlayerView } from '@react-native-ohos/react-native-gif-player';

const App = () => {
  const gifPlayerRef = useRef<GifPlayerView>(null);
  const [paused, setPaused] = useState(false);

  return (
    <>
      {/* 网络源：source={{ uri: 'https://.../demo.gif' }}；本地源：source={require('./demo.gif')} */}
      <GifPlayerView
        ref={gifPlayerRef}
        style={{ width: 300, height: 300 }}
        source={{ uri: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif' }}
        paused={paused}
        loopCount={0}
        onLoad={(event) => {
          const { duration, frameCount } = event.nativeEvent;
        }}
        onFrame={(event) => {
          const { frameNumber } = event.nativeEvent;
        }}
        onError={(event) => {
          const { error } = event.nativeEvent;
        }}
      />
      <Button title="jumpToFrame(0)" onPress={() => gifPlayerRef.current?.jumpToFrame(0)} />
      <Button title={paused ? 'Play' : 'Pause'} onPress={() => setPaused(!paused)} />
    </>
  );
};
```

完整示例（本地 GIF / 网络 GIF / 静态图 / 自定义 URL 四种源、事件日志、跳帧与内存释放演示）见 [example](./example) 目录。

## 接口说明

> [!TIP] "平台"列表示该属性在原三方库上支持的平台。

> [!TIP] "OpenHarmony平台支持"列为 "是" 表示 OpenHarmony 平台支持该属性；"否" 则表示不支持；"部分支持" 表示仅实现了功能的一部分。使用方法跨平台一致，效果对标 iOS 或 Android 的效果。

### GifPlayerView Props

| 名称 | 参数类型 | 默认值 | 必填 | 平台 | OpenHarmony平台支持 | 描述 |
| --- | --- | --- | --- | --- | --- | --- |
| source | `{ uri: string; type?: string }` \| `number` | - | 是 | iOS, Android | 支持 | 图片源；网络/远程源传 `{ uri }`，本地资源传 `require('./demo.gif')`（内部经 `resolveAssetSource` 解析） |
| paused | boolean | `false` | 是 | iOS, Android | 支持 | 是否暂停播放。注意：若未显式传入该 prop，组件默认**自动播放**（与 iOS/Android 端默认行为一致） |
| loopCount | Int32 | `0` | 否 | iOS, Android | 支持 | 循环次数；`0` 表示无限循环，`>0` 时播放指定轮数后停在末帧 |

### Events

以下事件均通过 `event.nativeEvent` 携带数据：

| 名称 | 参数类型 | 默认值 | 必填 | 平台 | OpenHarmony平台支持 | 描述 |
| --- | --- | --- | --- | --- | --- | --- |
| onLoad | `{ duration: Double; frameCount: Int32 }` | - | 否 | iOS, Android | 支持 | 加载完成；duration 为总时长（毫秒），静态图返回 `{ duration: 0, frameCount: 1 }` |
| onStart | - | - | 否 | iOS, Android | 支持 | 开始播放 |
| onStop | - | - | 否 | iOS, Android | 支持 | 暂停或停止播放 |
| onEnd | - | - | 否 | iOS, Android | 支持 | 每轮播放到最后一帧 |
| onFrame | `{ frameNumber: Int32 }` | - | 否 | iOS, Android | 支持 | 帧变化；帧号从 1 开始 |
| onError | `{ error: string }` | - | 否 | iOS, Android | 支持 | 加载/播放失败（网络/本地源加载失败自动重试 3 次后触发） |

### Methods（ref 命令）

| 名称 | 参数类型 | 默认值 | 必填 | 平台 | OpenHarmony平台支持 | 描述 |
| --- | --- | --- | --- | --- | --- | --- |
| jumpToFrame | `frameNumber: Int32` | - | 是 | iOS, Android | 支持 | 跳转到指定帧（从 0 开始），保持当前播放状态 |
| memoryClear | - | - | 否 | iOS, Android | 支持 | 释放全部已解码帧与 ImageSource，回收内存；调用后画面清空，需重新设置 `source` 才能恢复播放 |

## 遗留问题

无

## 其他


## 目录结构

````
/react-native-gif-player                # 项目根目录
├── src/                                # JS/TS 源码
│   ├── index.tsx                       # GifPlayerView 组件（props 处理、require 资源解析）
│   ├── GifPlayerViewNativeComponent.ts # Codegen 组件规格（Props/Events/Commands）
│   └── __tests__/                      # 单元测试
├── harmony/
│   ├── gif_player.har                  # 鸿蒙静态共享包（供鸿蒙工程集成）
│   └── gif_player/                     # 鸿蒙库工程源码
│       ├── index.ets                   # 鸿蒙库导出入口
│       ├── oh-package.json5            # 鸿蒙包定义（包名 @react-native-ohos/react-native-gif-player）
│       └── src/main/ets/
│           ├── GifPlayerView.ets       # Fabric 组件 ArkTS 实现（ImageKit 解码 + 帧循环）
│           └── GifPlayerPackage.ets    # RNOH Package 注册
├── example/                            # 示例工程（含 RNOH 0.72 鸿蒙工程）
├── assets/                             # 文档图片
├── package.json                        # npm 包定义
├── LICENSE                             # MIT 协议
└── README.md                           # 中文安装使用方法
````

## 贡献代码

使用过程中发现任何问题都可以提交 [Issue](https://github.com/react-native-oh-library/react-native-gif-player/issues)，当然，也非常欢迎提交 [PR](https://github.com/react-native-oh-library/react-native-gif-player/pulls)。

## 开源协议

本项目基于 [MIT License](https://github.com/ysfzrn/react-native-gif-player/blob/main/LICENSE) 开源，协议全文见 [LICENSE](./LICENSE)，请自由地享受和参与开源。
