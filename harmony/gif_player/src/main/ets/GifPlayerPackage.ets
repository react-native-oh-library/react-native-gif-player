/**
 * react-native-gif-player HarmonyOS RNPackage。
 * 注册 Fabric 组件 GifPlayerView 的 DescriptorWrapper 工厂与 ArkTS 组件 Builder。
 */

import {
  RNOHPackage,
  ComponentBuilderContext,
} from '@rnoh/react-native-openharmony';
import type {
  DescriptorWrapperFactory,
  DescriptorWrapperFactoryByDescriptorType,
} from '@rnoh/react-native-openharmony/ts';
import { RNC } from './generated';
import { GifPlayerView } from './GifPlayerView';

@Builder
function buildGifPlayerView(ctx: ComponentBuilderContext) {
  GifPlayerView({ ctx: ctx.rnComponentContext, tag: ctx.tag })
}

export class GifPlayerPackage extends RNOHPackage {
  createDescriptorWrapperFactoryByDescriptorType(
    _ctx: Record<string, Object>
  ): DescriptorWrapperFactoryByDescriptorType {
    const result: DescriptorWrapperFactoryByDescriptorType = {};
    const factory: DescriptorWrapperFactory = (ctx) =>
      new RNC.GifPlayerView.DescriptorWrapper(ctx.descriptor);
    result[RNC.GifPlayerView.NAME] = factory;
    return result;
  }

  createWrappedCustomRNComponentBuilderByComponentNameMap():
    Map<string, WrappedBuilder<[ComponentBuilderContext]>> {
    return new Map<string, WrappedBuilder<[ComponentBuilderContext]>>()
      .set(GifPlayerView.NAME, wrapBuilder(buildGifPlayerView));
  }
}
