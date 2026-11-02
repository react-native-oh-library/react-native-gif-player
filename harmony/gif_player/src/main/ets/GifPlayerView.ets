/**
 * react-native-gif-player HarmonyOS (OpenHarmony) Fabric 组件实现。
 *
 * 行为对齐 Android(Fresco)/iOS(CADisplayLink) 端：
 * - onLoad {duration(毫秒), frameCount}；静态图返回 {0, 1} 且不进帧循环
 * - onStart/onStop 在播放/暂停切换时触发；onFrame 帧号从 1 起
 * - onEnd 在每轮最后一帧渲染时触发；loopCount=0 无限循环，>0 播放轮数后停在末帧并 onStop
 * - jumpToFrame(n) 显示第 n 帧（0 起），保持当前播放状态
 * - memoryClear 释放全部已解码帧与 ImageSource
 * - 网络/本地(rawfile)源加载失败最多重试 3 次后 onError
 */

import { RNOHContext, RNViewBase } from '@rnoh/react-native-openharmony';
import { RNC } from './generated';
import { image } from '@kit.ImageKit';
import { http } from '@kit.NetworkKit';
import { BusinessError } from '@kit.BasicServicesKit';

const MAX_RETRY_COUNT = 3;
const DEFAULT_FRAME_DELAY_MS = 100;
const MAX_DOWNLOAD_BYTES = 52428800;

interface LoadPayload {
  duration: number;
  frameCount: number;
}

interface FramePayload {
  frameNumber: number;
}

interface ErrorPayload {
  error: string;
}

interface EmptyPayload {
}

@Component
export struct GifPlayerView {
  public static readonly NAME = RNC.GifPlayerView.NAME;
  public ctx!: RNOHContext;
  public tag: number = 0;

  @State currentFrame: image.PixelMap | undefined = undefined;

  private eventEmitter: RNC.GifPlayerView.EventEmitter | undefined = undefined;
  private cleanUpCallbacks: (() => void)[] = [];

  private frames: image.PixelMap[] = [];
  private delays: number[] = [];
  private imageSource: image.ImageSource | undefined = undefined;

  private isPlaying: boolean = false;
  private isStaticImage: boolean = false;
  private displayIndex: number = 0;
  private completedLoops: number = 0;
  private restartFromZero: boolean = false;
  private timerId: number = -1;

  private pausedFromProps: boolean = true;
  private loopLimit: number = 0;
  private hasSourceApplied: boolean = false;
  private lastSourceKey: string = '';
  private loadGeneration: number = 0;

  aboutToAppear() {
    this.eventEmitter = new RNC.GifPlayerView.EventEmitter(this.ctx.rnInstance, this.tag);
    const initial = this.ctx.descriptorRegistry
      .findDescriptorWrapperByTag<RNC.GifPlayerView.DescriptorWrapper>(this.tag);
    if (initial !== null) {
      this.onDescriptorWrapperChange(initial);
    }
    this.cleanUpCallbacks.push(this.ctx.descriptorRegistry.subscribeToDescriptorChanges(this.tag,
      (descriptor) => {
        this.onDescriptorWrapperChange(new RNC.GifPlayerView.DescriptorWrapper(descriptor));
      }));
    const commandReceiver = new RNC.GifPlayerView.CommandReceiver(
      this.ctx.componentCommandReceiver, this.tag);
    this.cleanUpCallbacks.push(commandReceiver.subscribe('jumpToFrame', (argv) => {
      this.jumpToFrame(argv[0]);
    }));
    this.cleanUpCallbacks.push(commandReceiver.subscribe('memoryClear', () => {
      this.clearMemory();
    }));
  }

  aboutToDisappear() {
    this.loadGeneration += 1;
    this.stopTimer();
    this.isPlaying = false;
    this.releaseFrames();
    this.currentFrame = undefined;
    this.cleanUpCallbacks.forEach((cb: () => void) => cb());
    this.cleanUpCallbacks = [];
  }

  build() {
    RNViewBase({ ctx: this.ctx, tag: this.tag }) {
      if (this.currentFrame !== undefined) {
        Image(this.currentFrame)
          .objectFit(ImageFit.Contain)
      }
    }
  }

  // ───────────────────────── props ─────────────────────────

  private onDescriptorWrapperChange(descriptorWrapper: RNC.GifPlayerView.DescriptorWrapper) {
    const source = descriptorWrapper.props.source;
    const uri = source?.uri ?? '';
    const local = source?.local ?? false;
    const sourceKey = `${local ? 'L' : 'R'}|${uri}`;

    if (!this.hasSourceApplied) {
      this.hasSourceApplied = true;
      this.lastSourceKey = sourceKey;
      this.pausedFromProps = descriptorWrapper.props.paused;
      this.loopLimit = descriptorWrapper.props.loopCount;
      this.startLoad(uri, local);
      return;
    }
    if (sourceKey !== this.lastSourceKey) {
      this.lastSourceKey = sourceKey;
      this.startLoad(uri, local);
      return;
    }
    if (descriptorWrapper.props.paused !== this.pausedFromProps) {
      this.pausedFromProps = descriptorWrapper.props.paused;
      this.setPaused(descriptorWrapper.props.paused);
    }
    this.loopLimit = descriptorWrapper.props.loopCount;
  }

  // ───────────────────────── 加载管线 ─────────────────────────

  private startLoad(uri: string, local: boolean) {
    this.loadGeneration += 1;
    this.stopTimer();
    this.isPlaying = false;
    this.isStaticImage = false;
    this.completedLoops = 0;
    this.restartFromZero = false;
    this.displayIndex = 0;
    this.releaseFrames();
    this.currentFrame = undefined;
    if (uri.length > 0) {
      // Android DEBUG 同语义：http(s) URL 一律走网络下载（dev 模式下 metro 资产 URL 带 local=true）
      const isHttpUrl = uri.startsWith('http://') || uri.startsWith('https://');
      this.loadWithRetry(uri, local && !isHttpUrl, this.loadGeneration);
    }
  }

  private async loadWithRetry(uri: string, local: boolean, gen: number): Promise<void> {
    for (let attempt = 0; attempt <= MAX_RETRY_COUNT; attempt++) {
      try {
        const bytes = local
          ? await this.fetchLocalBytes(uri)
          : await this.fetchRemoteBytes(uri);
        if (gen !== this.loadGeneration) {
          return;
        }
        await this.decodeAndStart(bytes, gen);
        return;
      } catch (err) {
        if (gen !== this.loadGeneration) {
          return;
        }
        if (attempt === MAX_RETRY_COUNT) {
          const message = (err as BusinessError).message ?? 'Invalid image format';
          this.releaseFrames();
          const payload: ErrorPayload = { error: message };
          this.eventEmitter?.emit('error', payload);
        }
      }
    }
  }

  private async fetchRemoteBytes(uri: string): Promise<ArrayBuffer> {
    const httpRequest = http.createHttp();
    try {
      const options: http.HttpRequestOptions = {
        expectDataType: http.HttpDataType.ARRAY_BUFFER,
        connectTimeout: 15000,
        readTimeout: 30000,
        maxLimit: MAX_DOWNLOAD_BYTES,
      };
      const response = await httpRequest.request(uri, options);
      if (response.responseCode !== 200) {
        throw new Error(`HTTP ${response.responseCode}`);
      }
      return response.result as ArrayBuffer;
    } finally {
      httpRequest.destroy();
    }
  }

  private async fetchLocalBytes(uri: string): Promise<ArrayBuffer> {
    let path = uri;
    if (path.startsWith('asset://')) {
      // RNOH 官方语义（RNImage 同款）：asset:// 前缀替换为 assetsDest 还原 rawfile 相对路径，
      // 如 asset://src/assets/demo.gif → assets/src/assets/demo.gif
      const assetsDest = this.ctx.rnInstance.getAssetsDest();
      path = assetsDest + path.substring('asset://'.length);
    } else {
      if (path.startsWith('file://')) {
        path = path.substring('file://'.length);
      }
      const marker = 'rawfile/';
      const idx = path.indexOf(marker);
      if (idx >= 0) {
        path = path.substring(idx + marker.length);
      }
    }
    const manager = this.ctx.uiAbilityContext.resourceManager;
    const candidates: string[] = [path];
    if (!path.startsWith('assets/')) {
      candidates.push(`assets/${path}`);
    }
    for (const candidate of candidates) {
      try {
        const content = await manager.getRawFileContent(candidate);
        return content.buffer as ArrayBuffer;
      } catch (e) {
        // 尝试下一个候选路径
      }
    }
    throw new Error(`local asset not found: ${uri}`);
  }

  private async decodeAndStart(bytes: ArrayBuffer, gen: number): Promise<void> {
    let source: image.ImageSource | undefined = undefined;
    try {
      source = image.createImageSource(bytes);
      this.imageSource = source;
      const frameCount = await source.getFrameCount();
      if (gen !== this.loadGeneration) {
        return;
      }
      if (frameCount <= 1) {
        const pixelMap = await source.createPixelMap();
        if (gen !== this.loadGeneration) {
          return;
        }
        this.frames = [pixelMap];
        this.delays = [0];
        this.isStaticImage = true;
        this.displayIndex = 0;
        this.currentFrame = pixelMap;
        const loadPayload: LoadPayload = { duration: 0, frameCount: 1 };
        this.eventEmitter?.emit('load', loadPayload);
        return;
      }
      const pixelMaps = await source.createPixelMapList();
      if (gen !== this.loadGeneration) {
        return;
      }
      let delays: number[] = [];
      try {
        delays = await source.getDelayTimeList();
      } catch (e) {
        delays = [];
      }
      delays = this.normalizeDelays(delays, pixelMaps.length);
      this.frames = pixelMaps;
      this.delays = delays;
      this.isStaticImage = false;
      this.completedLoops = 0;
      this.displayIndex = 0;
      this.currentFrame = pixelMaps[0];
      let duration = 0;
      for (const d of delays) {
        duration += d;
      }
      const loadPayload: LoadPayload = {
        duration: duration,
        frameCount: pixelMaps.length,
      };
      this.eventEmitter?.emit('load', loadPayload);
      if (!this.pausedFromProps) {
        this.startPlaying();
      }
    } catch (e) {
      throw new Error('Invalid image format');
    }
  }

  private normalizeDelays(delays: number[], frameCount: number): number[] {
    if (delays.length !== frameCount) {
      const fallback: number[] = [];
      for (let i = 0; i < frameCount; i++) {
        fallback.push(DEFAULT_FRAME_DELAY_MS);
      }
      return fallback;
    }
    const normalized: number[] = [];
    for (const d of delays) {
      normalized.push(d > 0 ? d : DEFAULT_FRAME_DELAY_MS);
    }
    return normalized;
  }

  // ───────────────────────── 帧引擎 ─────────────────────────

  private setPaused(paused: boolean) {
    if (paused) {
      if (this.isPlaying) {
        this.stopTimer();
        this.isPlaying = false;
        const payload: EmptyPayload = {};
        this.eventEmitter?.emit('stop', payload);
      }
    } else {
      this.startPlaying();
    }
  }

  private startPlaying() {
    if (this.isPlaying) {
      return;
    }
    if (this.frames.length === 0 || this.isStaticImage) {
      return;
    }
    this.isPlaying = true;
    if (this.restartFromZero) {
      this.restartFromZero = false;
      this.displayIndex = 0;
      this.completedLoops = 0;
    }
    const startPayload: EmptyPayload = {};
    this.eventEmitter?.emit('start', startPayload);
    this.renderFrame(this.displayIndex);
    this.tick();
  }

  private tick() {
    if (!this.isPlaying) {
      return;
    }
    const count = this.frames.length;
    if (count === 0) {
      return;
    }
    let next = this.displayIndex + 1;
    if (next >= count) {
      this.completedLoops += 1;
      if (this.loopLimit > 0 && this.completedLoops >= this.loopLimit) {
        this.isPlaying = false;
        this.restartFromZero = true;
        const stopPayload: EmptyPayload = {};
        this.eventEmitter?.emit('stop', stopPayload);
        return;
      }
      next = 0;
    }
    const delay = this.delays[this.displayIndex];
    const nextIndex = next;
    this.timerId = setTimeout(() => {
      this.displayIndex = nextIndex;
      this.renderFrame(this.displayIndex);
      this.tick();
    }, delay);
  }

  private renderFrame(index: number) {
    const count = this.frames.length;
    if (index < 0 || index >= count) {
      return;
    }
    this.displayIndex = index;
    this.currentFrame = this.frames[index];
    const framePayload: FramePayload = { frameNumber: index + 1 };
    this.eventEmitter?.emit('frame', framePayload);
    if (index === count - 1) {
      const endPayload: EmptyPayload = {};
      this.eventEmitter?.emit('end', endPayload);
    }
  }

  // ───────────────────────── 命令 ─────────────────────────

  private jumpToFrame(frameNumber: number) {
    const count = this.frames.length;
    if (count === 0) {
      return;
    }
    let index = Math.floor(frameNumber);
    if (index < 0) {
      index = 0;
    }
    if (index > count - 1) {
      index = count - 1;
    }
    if (this.isPlaying) {
      this.stopTimer();
      this.renderFrame(index);
      this.tick();
    } else {
      this.renderFrame(index);
    }
  }

  private clearMemory() {
    this.loadGeneration += 1;
    this.stopTimer();
    this.isPlaying = false;
    this.isStaticImage = false;
    this.completedLoops = 0;
    this.restartFromZero = true;
    this.displayIndex = 0;
    this.releaseFrames();
    this.currentFrame = undefined;
  }

  // ───────────────────────── 资源释放 ─────────────────────────

  private releaseFrames() {
    for (const frame of this.frames) {
      frame.release().catch((e: BusinessError) => {
      });
    }
    this.frames = [];
    this.delays = [];
    if (this.imageSource !== undefined) {
      this.imageSource.release().catch((e: BusinessError) => {
      });
      this.imageSource = undefined;
    }
  }

  private stopTimer() {
    if (this.timerId !== -1) {
      clearTimeout(this.timerId);
      this.timerId = -1;
    }
  }
}
