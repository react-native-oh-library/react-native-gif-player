/**
 * RN 0.74 起 babel preset 由 metro-react-native-babel-preset 更名为 @react-native/babel-preset，
 * 此处按实际安装情况自适应，兼容 0.72 / 0.77 / 0.82 / 0.84 多版本切换。
 */
let presets;
try {
  require.resolve('@react-native/babel-preset');
  presets = ['module:@react-native/babel-preset'];
} catch (e) {
  presets = ['module:metro-react-native-babel-preset'];
}

module.exports = {
  presets,
};
