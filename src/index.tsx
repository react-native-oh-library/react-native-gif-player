import React, {
  createRef,
  type ElementRef,
  Component,
  type ComponentProps,
} from 'react';
import GifPlayerViewNativeComponent from './GifPlayerViewNativeComponent';
import GifPlayerNativeView from './GifPlayerViewNativeComponent';
import type { GifPlayerViewComponent } from './GifPlayerViewNativeComponent';
import { Commands } from './GifPlayerViewNativeComponent';
import type { Int32 } from 'react-native/Libraries/Types/CodegenTypes';
// RN <= 0.77 exports the function directly (module.exports, CJS), while
// RN >= 0.82 uses `export default` (ESM), so require() returns `{ default: fn }`.
// Babel interop only applies to `import` statements, so unwrap `.default` manually
// to stay compatible with both module shapes.
const resolveAssetSourceModule = require('react-native/Libraries/Image/resolveAssetSource');
const resolveAssetSource =
  typeof resolveAssetSourceModule === 'function'
    ? resolveAssetSourceModule
    : resolveAssetSourceModule.default;

type Props = ComponentProps<typeof GifPlayerNativeView>;
interface SourceProps {
  uri?: string;
  type?: string;
}

class GifPlayerView extends Component<Props> {
  private innerRef = createRef<ElementRef<GifPlayerViewComponent>>();

  jumpToFrame = (frameNumber: Int32) => {
    const ref = this.innerRef.current;

    if (ref) {
      Commands.jumpToFrame(ref, frameNumber);
    }
  };

  memoryClear = () => {
    const ref = this.innerRef.current;

    if (ref) {
      Commands.memoryClear(ref);
    }
  };

  render() {
    const { source, paused, loopCount } = this.props || {};

    let resolvedAsset: SourceProps = { uri: '', type: '' };

    if (source?.uri) {
      resolvedAsset = source;
    } else {
      resolvedAsset = resolveAssetSource(source);
    }

    return (
      <GifPlayerViewNativeComponent
        ref={this.innerRef}
        {...this.props}
        source={{
          uri: resolvedAsset?.uri,
          type: source?.type,
          local: source?.uri ? false : true,
        }}
        paused={paused === null ? true : paused}
        loopCount={loopCount || 0}
      />
    );
  }
}

export { GifPlayerView };
