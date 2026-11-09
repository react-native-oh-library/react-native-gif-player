/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { GifPlayerView } from '../../src/index';
import { Commands } from '../../src/GifPlayerViewNativeComponent';
const resolveAsset: jest.Mock = require('react-native/Libraries/Image/resolveAssetSource');

beforeEach(() => jest.clearAllMocks());

describe('GifPlayerView', () => {
  it('passes a remote source and playback options to the native view', () => {
    const onEnd = jest.fn();
    const view = new GifPlayerView({
      source: { uri: 'https://example.com/a.gif', type: 'image/gif' },
      paused: false,
      loopCount: 3,
      onEnd,
    });
    expect(view.render().props).toMatchObject({
      source: {
        uri: 'https://example.com/a.gif',
        type: 'image/gif',
        local: false,
      },
      paused: false,
      loopCount: 3,
      onEnd,
    });
    expect(resolveAsset).not.toHaveBeenCalled();
  });

  it('resolves a bundled asset and applies playback defaults', () => {
    resolveAsset.mockReturnValue({ uri: 'asset:/a.gif' });
    const view = new GifPlayerView({ source: 42, paused: null } as any);
    expect(view.render().props).toMatchObject({
      source: { uri: 'asset:/a.gif', type: undefined, local: true },
      paused: true,
      loopCount: 0,
    });
    expect(resolveAsset).toHaveBeenCalledWith(42);
  });

  it('handles an unresolved or missing asset', () => {
    resolveAsset.mockReturnValue(null);
    const view = new GifPlayerView({ paused: false });
    expect(view.render().props.source).toEqual({
      uri: undefined,
      type: undefined,
      local: true,
    });
    expect(resolveAsset).toHaveBeenCalledWith(undefined);
  });

  it('forwards commands only when the native view is available', () => {
    const view = new GifPlayerView({ paused: false });
    view.jumpToFrame(4);
    view.memoryClear();
    expect(Commands.jumpToFrame).not.toHaveBeenCalled();
    expect(Commands.memoryClear).not.toHaveBeenCalled();

    const nativeRef = {};
    (view as any).innerRef.current = nativeRef;
    view.jumpToFrame(4);
    view.memoryClear();
    expect(Commands.jumpToFrame).toHaveBeenCalledWith(nativeRef, 4);
    expect(Commands.memoryClear).toHaveBeenCalledWith(nativeRef);
  });
});
