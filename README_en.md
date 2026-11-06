> Document template: v0.4.2

<p align="center">
  <h1 align="center"> <code>react-native-gif-player</code> </h1>
</p>

This project is developed based on [react-native-gif-player](https://github.com/ysfzrn/react-native-gif-player) v1.0.0. The version information is as follows:

| Third-party Library | Version (npm link) | Release Info | Supported RN Versions | Autolink | Compilation API Version | Community Baseline Version | Source Code |
| ---------- | -------------------- | -------- | ---------- | -------- | ----------- | ------------ | -------- |
| react-native-gif-player | [~ 1.0.0](https://www.npmjs.com/package/react-native-gif-player) | [Github Releases](https://github.com/react-native-oh-library/react-native-gif-player/releases) | 72.*/0.77.*/0.82.*/ 0.84.*   | Yes | API12+ | 1.0.0 | [master](https://github.com/react-native-oh-library/react-native-gif-player) |

## Introduction

react-native-gif-player is a React Native view component for playing GIF / animated WebP / static images. React Native's built-in `Image` component can display GIFs but lacks a stop feature; this component provides pause/resume, loop count control, frame watching, jumping to a frame, and memory clearing. The upstream library wraps `UIImage` (iOS) and `Fresco` (Android).

The HarmonyOS adaptation implements a Fabric component of the same name, `GifPlayerView`, on the ArkTS side based on ImageKit decoding and a frame-loop scheduler, with behavior aligned to the iOS/Android implementations:

- `onLoad {duration(ms), frameCount}`; static images return `{0, 1}` and never enter the frame loop;
- `onStart`/`onStop` fire when playback switches between playing and paused; `onFrame` frame numbers start from 1;
- `onEnd` fires when the last frame of each loop is rendered; `loopCount=0` loops infinitely, `>0` stops on the last frame after the given number of loops and fires `onStop`;
- Network/local source load failures are retried up to 3 times before firing `onError`.

## Installation

Navigate to your project directory and run the following command:

**npm**

```bash
npm install @react-native-ohos/react-native-gif-player
```

**yarn**

```bash
yarn add @react-native-ohos/react-native-gif-player
```

## Link

| | Supported Autolink | Supported RN Version |
| - | - | - |
| ~0.5.1 | Yes | 0.72.* / 0.77.* / 0.82.* / 0.84.* |

Projects using AutoLink need to be configured according to this document, AutoLink framework guide: https://gitcode.com/CPF-RN/ohos_react_native/blob/master/docs/en/Autolinking.md

If the version you are using supports Autolink and the project has integrated Autolink, you can skip the ManualLink configuration.

<details>
  <summary>ManualLink: This step provides guidance for manually configuring native dependencies.</summary>

Open the `harmony` directory of the OpenHarmony project in DevEco Studio.

### 1. Overrides RN SDK

To ensure the project relies on the same version of the RN SDK, you need to add an `overrides` field in the project's root `oh-package.json5` file, specifying the RN SDK version to be used. The replacement version can be a specific version number, a semver range, or a locally available HAR package or source directory.

For more information about the purpose of this field, please refer to the [official documentation](https://developer.huawei.com/consumer/en/doc/harmonyos-guides-V5/ide-oh-package-json5-V5#en-us_topic_0000001792256137_overrides).

```json5
{
  "overrides": {
    "@rnoh/react-native-openharmony": "~0.84.2" // 0.84 project; use the matching RNOH version for other framework versions
    // "@rnoh/react-native-openharmony" : "./react_native_openharmony.har" // path to a local har package
    // "@rnoh/react-native-openharmony" : "./react_native_openharmony" // path to source code
  }
}
```

### 2. Introducing Native Code

Currently, two methods are available:

- Use the HAR file.
- Directly link to the source code.

Method 1 (recommended): Use the HAR file.

> [!TIP] The HAR file is stored in the `harmony` directory in the installation path of the third-party library.

Open `entry/oh-package.json5` file and add the following dependencies:

```json
"dependencies": {
    "@rnoh/react-native-openharmony": "file:../react_native_openharmony",
    "@react-native-ohos/react-native-gif-player": "file:../../node_modules/@react-native-ohos/react-native-gif-player/harmony/gif_player.har"
  }
```

Click the `sync` button in the upper right corner.

Alternatively, run the following instruction on the terminal:

```bash
cd entry
ohpm install
```

Method 2: Directly link to the source code.

> [!TIP] For details, see [Directly Linking Source Code](https://gitcode.com/CPF-RN/usage-docs/blob/master/en/link-source-code.md).

### 3. Configuring CMakeLists and Introducing GifPlayerPackage

> If the project has integrated RNOH AutoLink and the `harmony.autolinking` configuration (GifPlayerPackage / gif_player) takes effect, the CMake and PackageProvider registration can be generated automatically by AutoLink, and this section can be skipped.

Open `entry/src/main/cpp/CMakeLists.txt` and add the following code:

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

Open `entry/src/main/cpp/PackageProvider.cpp` and add:

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

### 4. Introducing GifPlayerPackage to ArkTS

Open `entry/src/main/ets/RNPackagesFactory.ts` (or `.ets`) and add:

```diff
+ import { GifPlayerPackage } from '@react-native-ohos/react-native-gif-player';

  export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
    return [
+     new GifPlayerPackage(ctx),
    ];
  }
```
</details>

## Running

Click the `sync` button in the upper right corner.

Alternatively, run the following instruction on the terminal:

```bash
cd entry
ohpm install
```

Then build and run the code.

## Constraints and Limitations

### Compatibility

The content of this document has been verified with the following versions:
1. RNOH：0.72.20；SDK：HarmonyOS NEXT Developer Beta1；IDE：DevEco Studio 5.0.3.200；ROM：3.0.0.18;
2. RNOH：0.77.18；SDK：HarmonyOS 6.0.0 Release SDK；IDE：DevEco Studio 6.0.0.868；ROM：6.0.0.112;
3. RNOH：0.82.1；SDK：HarmonyOS 6.0.1 Release SDK；IDE：DevEco Studio 6.0.1 Release；ROM：6.0.0.120 SP7;
4. RNOH：0.84.1；SDK：HarmonyOS 6.0.1 Release SDK；IDE：DevEco Studio 6.0.1 Release；ROM：6.0.0.120 SP7;


### Permission Requirements

The library itself requires no special permissions. When loading remote GIF/WebP sources, your app must declare the `ohos.permission.INTERNET` permission (already declared by the RNOH project template by default).

### Known Limitations

1. Remote GIF/WebP sources are downloaded in full via the `http` module of `@kit.NetworkKit` and then decoded; the download size limit is 50MB — exceeding it fails the load and fires `onError`;
2. After `memoryClear` releases all decoded frames, the view is cleared and further play/jump calls have no effect; set a new `source` to reload and resume playback.

## Usage Example

After installing the package and completing the HarmonyOS-side integration (see "Usage"), use `GifPlayerView` in your business code:

```tsx
import { useRef, useState } from 'react';
import { Button } from 'react-native';
import { GifPlayerView } from '@react-native-ohos/react-native-gif-player';

const App = () => {
  const gifPlayerRef = useRef<GifPlayerView>(null);
  const [paused, setPaused] = useState(false);

  return (
    <>
      {/* Remote source: source={{ uri: 'https://.../demo.gif' }}; local asset: source={require('./demo.gif')} */}
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

For a complete example (four source types — local GIF / remote GIF / static image / custom URL, event log, jump-to-frame and memory-clear demos), see the [example](./example) directory.

## API Description

> [!TIP] The **Platform** column indicates the platform where the properties are supported in the original third-party library.

> [!TIP] If the value of **OpenHarmony Platform Support** is **Yes**, it means that the OpenHarmony platform supports this property; **No** means the opposite; **Partially** means some capabilities of this property are supported. The usage method is the same on different platforms and the effect is the same as that of iOS or Android.

### GifPlayerView Props

| Name | Parameter Type | Default | Required | Platform | OpenHarmony Platform Support | Description |
| --- | --- | --- | --- | --- | --- | --- |
| source | `{ uri: string; type?: string }` \| `number` | - | Yes | iOS, Android | Yes | Image source; pass `{ uri }` for remote sources, or `require('./demo.gif')` for local assets (resolved internally via `resolveAssetSource`) |
| paused | boolean | `false` | Yes | iOS, Android | Yes | Whether playback is paused. Note: if this prop is not passed explicitly, the component **autoplays** by default (consistent with the iOS/Android default behavior) |
| loopCount | Int32 | `0` | No | iOS, Android | Yes | Number of loops; `0` means infinite loop, `>0` stops on the last frame after the given number of loops |

### Events

All events carry their data via `event.nativeEvent`:

| Name | Parameter Type | Default | Required | Platform | OpenHarmony Platform Support | Description |
| --- | --- | --- | --- | --- | --- | --- |
| onLoad | `{ duration: Double; frameCount: Int32 }` | - | No | iOS, Android | Yes | Loading completes; duration is the total duration in ms, static images return `{ duration: 0, frameCount: 1 }` |
| onStart | - | - | No | iOS, Android | Yes | Playback starts |
| onStop | - | - | No | iOS, Android | Yes | Playback is paused or stopped |
| onEnd | - | - | No | iOS, Android | Yes | The last frame of each loop is rendered |
| onFrame | `{ frameNumber: Int32 }` | - | No | iOS, Android | Yes | The displayed frame changes; frame numbers start from 1 |
| onError | `{ error: string }` | - | No | iOS, Android | Yes | Loading/playback fails (network/local source load failures are retried up to 3 times first) |

### Methods (ref commands)

| Name | Parameter Type | Default | Required | Platform | OpenHarmony Platform Support | Description |
| --- | --- | --- | --- | --- | --- | --- |
| jumpToFrame | `frameNumber: Int32` | - | Yes | iOS, Android | Yes | Jump to the given frame (starting from 0), keeping the current playback state |
| memoryClear | - | - | No | iOS, Android | Yes | Release all decoded frames and the ImageSource to reclaim memory; the view is cleared afterwards — set a new `source` to resume playback |

## Known Issues

None

## Others


## Directory Structure

````
/react-native-gif-player                # Project root directory
├── src/                                # JS/TS source code
│   ├── index.tsx                       # GifPlayerView component (props handling, require asset resolution)
│   ├── GifPlayerViewNativeComponent.ts # Codegen component spec (Props/Events/Commands)
│   └── __tests__/                      # Unit tests
├── harmony/
│   ├── gif_player.har                  # HarmonyOS static shared package (for Harmony project integration)
│   └── gif_player/                     # Harmony library project source code
│       ├── index.ets                   # Harmony library export entry
│       ├── oh-package.json5            # Harmony package definition (package name @react-native-ohos/react-native-gif-player)
│       └── src/main/ets/
│           ├── GifPlayerView.ets       # Fabric component ArkTS implementation (ImageKit decoding + frame loop)
│           └── GifPlayerPackage.ets    # RNOH Package registration
├── example/                            # Example project (includes an RNOH 0.72 Harmony project)
├── assets/                             # Documentation images
├── package.json                        # npm package definition
├── LICENSE                             # MIT License
└── README.md                           # Installation and usage guide (Chinese)
````

## Contributing

If you encounter any problems while using this library, feel free to submit an [Issue](https://github.com/react-native-oh-library/react-native-gif-player/issues). Pull requests are also highly welcome.

## License

This project is open-sourced under the [MIT License](https://github.com/ysfzrn/react-native-gif-player/blob/main/LICENSE). See [LICENSE](./LICENSE) for the full license text. Feel free to enjoy and contribute to open source.
