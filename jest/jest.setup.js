/* eslint-env jest */

jest.mock('../src/GifPlayerViewNativeComponent', () => ({
  __esModule: true,
  default: 'GifPlayerViewNativeComponent',
  Commands: { jumpToFrame: jest.fn(), memoryClear: jest.fn() },
}));

jest.mock('react-native/Libraries/Image/resolveAssetSource', () => jest.fn());
