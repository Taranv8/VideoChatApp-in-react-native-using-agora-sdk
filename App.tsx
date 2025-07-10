import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
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

const appId = 'e0e08e54d3af4a6282a29873c6c4a7c3';
const token = '007eJxTYJg5X19Cc1+L/sXMR2/VXnHF3NW/oH3AbrnTN379EMtFt04pMKQapBpYpJqapBgnppkkmhlZGCUaWVqYGyebJZskmicb5zEXZDQEMjIsf+3MwsgAgSA+K0NJYlFiHgMDAFeSH3Q=';
const channelName = 'taran';

const App = () => {
  const agoraEngineRef = useRef<IRtcEngine | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  // Removed localUid state since we'll use 0 for local video

  // Cleanup on unmount
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

  // Request permissions
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

  // Initialize Agora
  const initializeAgoraEngine = async () => {
    console.log('⚙️ Initializing Agora engine...');
    agoraEngineRef.current = createAgoraRtcEngine();
    await agoraEngineRef.current.initialize({ appId });

    setupEventHandlers();

    await agoraEngineRef.current.enableAudio();
    await agoraEngineRef.current.enableVideo();
    console.log('✅ Engine initialized, audio & video enabled');
  };

  // Set up Agora event handlers
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

  // Join channel
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
      0,  // Use 0 for local UID
      {
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      }
    );
  };

  // Leave channel
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

  // Switch camera
  const switchCamera = () => {
    agoraEngineRef.current?.switchCamera();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Main video area - Always show remote if available */}
      {isJoined && remoteUid ? (
        <RtcSurfaceView
          canvas={{ uid: remoteUid }}
          style={{ flex: 1 }}
        />
      ) : isJoined ? (
        // Show local preview in main area when alone
        <RtcSurfaceView
          canvas={{ uid: 0 }}  // Use 0 for local video
          style={{ flex: 1 }}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 18 }}>{message || 'Waiting...'}</Text>
        </View>
      )}

      {/* Local video as small PiP - Always show local video when joined */}
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
          <RtcSurfaceView
            canvas={{ uid: 0 }}  // Always use 0 for local video
            style={{ flex: 1 }}
          />
        </View>
      )}

      {/* Buttons at bottom */}
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

      {/* If not joined, show Join button */}
      {!isJoined && (
        <View style={{ position: 'absolute', bottom: 50, alignSelf: 'center' }}>
          <TouchableOpacity
            onPress={joinChannel}
            style={{
              backgroundColor: '#1e90ff',
              paddingHorizontal: 30,
              paddingVertical: 15,
              borderRadius: 30
            }}>
            <Text style={{ color: '#fff', fontSize: 18 }}>Join Call</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default App;