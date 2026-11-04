import GifPlayerPackage from '@react-native-ohos/react-native-gif-player';
import { RNPackageContext, RNPackage } from '@rnoh/react-native-openharmony/ts';
export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
  return [
    new GifPlayerPackage(ctx),
  ];
}
