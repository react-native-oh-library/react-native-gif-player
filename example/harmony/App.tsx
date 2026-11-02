import * as React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GifPlayerView } from 'react-native-gif-player';
import { combineReducers } from './utils';

// 稳定可复现的网络 GIF 源（Giphy 公开 CDN 直链，无需 API key）
const REMOTE_GIFS = [
  'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif',
  'https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif',
];
// 本地资产：动图（require → resolveAssetSource → local=true）
const LOCAL_GIF = require('./src/assets/demo.gif');
// 本地资产：静态图（验证 onLoad {duration:0, frameCount:1} 兜底路径）
const LOCAL_PNG = require('./src/assets/static.png');

type SourceMode = 'local' | 'remote' | 'static' | 'custom';

const initialState = {
  mode: 'local' as SourceMode,
  remoteIndex: 0,
  customUrl: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif',
  paused: false,
  loopCount: 0,
  loading: true,
  duration: 0,
  frameCount: 0,
  currentFrame: 0,
  error: null as string | null,
  endCount: 0,
  log: [] as string[],
};

export default function App() {
  const [state, setState] = React.useReducer(combineReducers, initialState);
  const {
    mode,
    remoteIndex,
    customUrl,
    paused,
    loopCount,
    loading,
    duration,
    frameCount,
    currentFrame,
    error,
    endCount,
    log,
  } = state;
  const gifPlayerRef = React.useRef<GifPlayerView | null>(null);

  const appendLog = (line: string) => {
    setState((prev: typeof initialState) => ({
      log: [line, ...prev.log].slice(0, 8),
    }));
  };

  const switchMode = (next: SourceMode, nextRemoteIndex = 0) => {
    setState({
      mode: next,
      remoteIndex: nextRemoteIndex,
      loading: true,
      error: null,
      duration: 0,
      frameCount: 0,
      currentFrame: 0,
      endCount: 0,
    });
  };

  const source =
    mode === 'local'
      ? LOCAL_GIF
      : mode === 'static'
      ? LOCAL_PNG
      : mode === 'custom'
      ? { uri: customUrl }
      : { uri: REMOTE_GIFS[remoteIndex % REMOTE_GIFS.length] };

  const sourceLabel =
    mode === 'local'
      ? '本地动图 require()'
      : mode === 'static'
      ? '本地静态图 require()'
      : mode === 'custom'
      ? '自定义 URL'
      : `网络 GIF #${remoteIndex % REMOTE_GIFS.length + 1}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>react-native-gif-player · HarmonyOS</Text>
        <Text style={styles.subtitle}>源：{sourceLabel}</Text>
      </View>

      <Pressable
        style={styles.gifContainer}
        onPressIn={() => setState({ paused: true })}
        onPressOut={() => setState({ paused: false })}
      >
        <GifPlayerView
          ref={gifPlayerRef}
          style={styles.box}
          source={source}
          paused={paused}
          loopCount={loopCount}
          onLoad={(event: any) => {
            const { duration: d, frameCount: c } = event?.nativeEvent || {};
            setState({ loading: false, error: null, duration: Math.round(d), frameCount: c });
            appendLog(`onLoad duration=${Math.round(d)}ms frameCount=${c}`);
          }}
          onStart={() => appendLog('onStart')}
          onStop={() => appendLog('onStop')}
          onEnd={() => setState((prev: typeof initialState) => ({ endCount: prev.endCount + 1 }))}
          onFrame={(event: any) => {
            const { frameNumber } = event?.nativeEvent || {};
            setState({ currentFrame: frameNumber });
          }}
          onError={(event: any) => {
            const message = event?.nativeEvent?.error;
            setState({ loading: false, error: message });
            appendLog(`onError ${message}`);
          }}
        />
        {loading ? (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="white" />
          </View>
        ) : null}
        {!loading && error !== null ? (
          <View style={styles.overlay}>
            <Text style={styles.error}>加载失败：{error}</Text>
          </View>
        ) : null}
      </Pressable>

      <View style={styles.infoBar}>
        <Text style={styles.infoText}>duration: {duration}ms</Text>
        <Text style={styles.infoText}>frameCount: {frameCount}</Text>
        <Text style={styles.infoText}>currentFrame: {currentFrame}</Text>
        <Text style={styles.infoText}>onEnd: {endCount}次</Text>
        <Text style={styles.infoText}>
          {paused ? '已暂停' : '播放中'} · loop={loopCount === 0 ? '∞' : loopCount}
        </Text>
      </View>

      <ScrollView style={styles.logPanel} contentContainerStyle={styles.logContent}>
        {log.length === 0 ? (
          <Text style={styles.logEmpty}>事件日志（onLoad/onStart/onStop/onEnd/onError）</Text>
        ) : (
          log.map((line: string, idx: number) => (
            <Text key={idx} style={styles.logLine}>
              {line}
            </Text>
          ))
        )}
      </ScrollView>

      <View style={styles.controls}>
        <View style={styles.row}>
          <Button label="本地GIF" active={mode === 'local'} onPress={() => switchMode('local')} />
          <Button
            label="网络GIF"
            active={mode === 'remote'}
            onPress={() => switchMode('remote', remoteIndex + 1)}
          />
          <Button label="静态图" active={mode === 'static'} onPress={() => switchMode('static')} />
          <Button
            label="换下一张"
            active={false}
            onPress={() => {
              if (mode !== 'remote') {
                switchMode('remote', 0);
              } else {
                switchMode('remote', remoteIndex + 1);
              }
            }}
          />
        </View>

        <View style={styles.row}>
          <Button
            label={paused ? '播放' : '暂停'}
            highlight
            onPress={() => setState({ paused: !paused })}
          />
          <Button
            label="跳到第0帧"
            onPress={() => gifPlayerRef.current?.jumpToFrame(0)}
          />
          <Button
            label="跳到中间帧"
            onPress={() =>
              gifPlayerRef.current?.jumpToFrame(Math.max(0, Math.floor(frameCount / 2)))
            }
          />
          <Button
            label="清内存"
            onPress={() => {
              gifPlayerRef.current?.memoryClear();
              appendLog('memoryClear 已执行（帧缓存与画面已释放）');
            }}
          />
        </View>

        <View style={styles.row}>
          <Button
            label="循环:无限"
            active={loopCount === 0}
            onPress={() => setState({ loopCount: 0 })}
          />
          <Button
            label="循环:1轮"
            active={loopCount === 1}
            onPress={() => setState({ loopCount: 1 })}
          />
          <Button
            label="循环:3轮"
            active={loopCount === 3}
            onPress={() => setState({ loopCount: 3 })}
          />
        </View>

        <View style={styles.urlRow}>
          <TextInput
            style={styles.textInput}
            value={customUrl}
            onChangeText={(t: string) => setState({ customUrl: t })}
            placeholder="输入 GIF URL"
            placeholderTextColor="#888"
          />
          <Button
            label="加载URL"
            active={mode === 'custom'}
            onPress={() => {
              if (customUrl.length > 0) {
                switchMode('custom');
              }
            }}
          />
        </View>
      </View>
    </View>
  );
}

function Button(props: { label: string; onPress: () => void; active?: boolean; highlight?: boolean }) {
  const { label, onPress, active = false, highlight = false } = props;
  return (
    <Pressable
      style={[styles.button, active ? styles.buttonActive : null, highlight ? styles.buttonHighlight : null]}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, active ? styles.buttonTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    padding: 12,
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#9e9e9e',
    fontSize: 12,
    marginTop: 4,
  },
  gifContainer: {
    width: '100%',
    height: Dimensions.get('screen').height * 0.32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  box: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: '#ff8a80',
    fontSize: 16,
    paddingHorizontal: 24,
    textAlign: 'center',
  },
  infoBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'white',
    marginHorizontal: 8,
    marginTop: 8,
    borderRadius: 6,
    padding: 6,
  },
  infoText: {
    color: 'black',
    fontSize: 12,
    marginRight: 10,
  },
  logPanel: {
    flex: 1,
    marginHorizontal: 8,
    marginTop: 6,
    backgroundColor: '#1c1c1c',
    borderRadius: 6,
  },
  logContent: {
    padding: 8,
  },
  logEmpty: {
    color: '#666',
    fontSize: 12,
  },
  logLine: {
    color: '#8bc34a',
    fontSize: 12,
    lineHeight: 18,
  },
  controls: {
    padding: 8,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 6,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#2b2b2b',
    borderWidth: 1,
    borderColor: '#444',
  },
  buttonActive: {
    backgroundColor: '#388e3c',
    borderColor: '#4caf50',
  },
  buttonHighlight: {
    borderColor: '#ffb74d',
  },
  buttonText: {
    color: 'white',
    fontSize: 13,
  },
  buttonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 6,
    paddingHorizontal: 10,
    color: 'black',
    fontSize: 13,
    marginRight: 8,
  },
});
