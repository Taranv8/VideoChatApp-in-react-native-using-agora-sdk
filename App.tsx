import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';

import {
  createAgoraRtcEngine,
  IRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  IRtcEngineEventHandler,
  RtcConnection,
} from 'react-native-agora';

const App = () => {
  const agoraEngineRef = useRef<IRtcEngine | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  // User-editable states
  const [appId, setAppId] = useState('e0e08e54d3af4a6282a29873c6c4a7c3');
  const [token, setToken] = useState('007eJxTYPi2p9Hs+BMdlW6hvg0nFBQFglZW++8JnvuQvTk0tcxjppECQ6pBqoFFqqlJinFimkmimZGFUaKRpYW5cbJZskmiebLxNcvKjIZARobEqDWMjAwQCOKzMpQkFiXmMTAAAB0jHpQ=');
  const [channelName, setChannelName] = useState('taran');

  const cleanupAgoraEngine = () => {
    console.log('🧹 Releasing Agora engine...');
    agoraEngineRef.current?.release();
    console.log('✅ Engine released');
  };

  useEffect(() => {
    const setup = async () => {
      if (Platform.OS === 'android') {
        await requestPermissions();
      }
      initializeAgoraEngine();
    };
    setup();

    return cleanupAgoraEngine;
  }, []);

  const requestPermissions = async () => {
    try {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);
      console.log('✅ Permissions granted');
    } catch (err) {
      console.warn('🚨 Permissions error:', err);
    }
  };

  const initializeAgoraEngine = async () => {
    console.log('⚙️ Initializing Agora engine...');
    agoraEngineRef.current = createAgoraRtcEngine();
    await agoraEngineRef.current.initialize({ appId });

    setupEventHandlers();

    await agoraEngineRef.current.enableAudio();
    await agoraEngineRef.current.enableVideo();
    console.log('✅ Engine initialized, audio & video enabled');
  };

  const setupEventHandlers = () => {
    const events: Partial<IRtcEngineEventHandler> = {
      onJoinChannelSuccess: (_connection, uid) => {
        console.log('🎉 Joined channel successfully, local uid:', uid);
        setIsJoined(true);
        setMessage(`Joined channel: ${channelName}`);
      },
      onUserJoined: (_connection: RtcConnection, uid: number) => {
        console.log('👀 Remote user joined:', uid);
        setRemoteUid(uid);
      },
      onUserOffline: (_connection: RtcConnection, uid: number) => {
        console.log('🚪 Remote user offline:', uid);
        setRemoteUid(null);
      },
      onLeaveChannel: () => {
        console.log('👋 Left the channel');
        setRemoteUid(null);
      },
      onError: (err) => {
        console.log('🚨 Agora error:', err);
      },
    };
    agoraEngineRef.current?.registerEventHandler(events);
    console.log('✅ Event handlers registered');
  };

  const joinChannel = async () => {
    if (isJoined) return;

    console.log('👉 Setting client role to Broadcaster...');
    await agoraEngineRef.current?.setClientRole(ClientRoleType.ClientRoleBroadcaster);

    console.log('👉 Starting local preview...');
    await agoraEngineRef.current?.startPreview();

    console.log('👉 Joining channel...');
    agoraEngineRef.current?.joinChannel(
      token,
      channelName,
      0,
      {
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      }
    );
  };

  const leaveChannel = () => {
    if (!isJoined) return;

    console.log('👉 Leaving channel...');
    agoraEngineRef.current?.leaveChannel();
    agoraEngineRef.current?.stopPreview();
    setIsJoined(false);
    setRemoteUid(null);
    setMessage('Left the channel');
    console.log('🚀 Left channel & stopped preview');
  };

  const switchCamera = () => {
    agoraEngineRef.current?.switchCamera();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Main Video Display */}
      {isJoined && remoteUid ? (
        <RtcSurfaceView canvas={{ uid: remoteUid }} style={{ flex: 1 }} />
      ) : isJoined ? (
        <RtcSurfaceView canvas={{ uid: 0 }} style={{ flex: 1 }} />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 18 }}>{message || 'Waiting...'}</Text>
        </View>
      )}

      {/* Local video preview in PiP style */}
      {isJoined && (
        <View style={{
          position: 'absolute',
          top: 30,
          right: 20,
          width: 120,
          height: 180,
          borderRadius: 10,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: '#fff',
          zIndex: 100,
          elevation: 20,
        }}>
          <RtcSurfaceView canvas={{ uid: 0 }} style={{ flex: 1 }} />
        </View>
      )}

      {/* Controls for Leave & Switch */}
      {isJoined && (
        <View style={{
          position: 'absolute',
          bottom: 50,
          left: 0,
          right: 0,
          flexDirection: 'row',
          justifyContent: 'space-evenly'
        }}>
          <TouchableOpacity
            onPress={leaveChannel}
            style={{
              backgroundColor: 'red',
              width: 60,
              height: 60,
              borderRadius: 30,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <Text style={{ color: '#fff', fontSize: 24 }}>📞</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={switchCamera}
            style={{
              backgroundColor: '#555',
              width: 60,
              height: 60,
              borderRadius: 30,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <Text style={{ color: '#fff', fontSize: 24 }}>🔄</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Inputs and Join button when not joined */}
      {!isJoined && (
        <KeyboardAvoidingView behavior="padding" style={{ padding: 20 }}>
          <ScrollView contentContainerStyle={{ alignItems: 'center' }}>
            <TextInput
              placeholder="App ID"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={appId}
              onChangeText={setAppId}
            />
            <TextInput
              placeholder="Token"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={token}
              onChangeText={setToken}
              multiline
            />
            <TextInput
              placeholder="Channel Name"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={channelName}
              onChangeText={setChannelName}
            />

            <TouchableOpacity
              onPress={joinChannel}
              style={styles.joinButton}>
              <Text style={{ color: '#fff', fontSize: 18 }}>Join Call</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = {
  input: {
    width: '90%',
    backgroundColor: '#222',
    color: '#fff',
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
  },
  joinButton: {
    marginTop: 20,
    backgroundColor: '#1e90ff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
  },
};

export default App;
