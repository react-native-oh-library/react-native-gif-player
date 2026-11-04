/*
 * Copyright (c) 2026 Huawei Device Co., Ltd. All rights reserved
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Keep testerino 0.0.12 source types compatible with the example's React 19 types.
const fs = require('fs');
const path = require('path');
const root = path.dirname(require.resolve('@rnoh/testerino/package.json'));
if (require(path.join(root, 'package.json')).version !== '0.0.12') {
  throw new Error(
    'Review the React 19 type fix before changing testerino versions.',
  );
}
for (const name of [
  'AutomatedTestCase.tsx',
  'ManualTestCase.tsx',
  'TestSuite.tsx',
]) {
  const file = path.join(root, 'src/react-native', name);
  const source = fs.readFileSync(file, 'utf8');
  const updated = source
    .replace(/(?<!React\.)\bJSX\.Element\b/g, 'React.JSX.Element')
    .replace(
      /isValidElement\((child|currentChild)\)/g,
      'isValidElement<Record<string, any>>($1)',
    );
  if (updated !== source) {
    fs.writeFileSync(file, updated);
  }
}
