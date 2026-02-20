import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { Audio } from 'expo-av';
import * as MailComposer from 'expo-mail-composer';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/theme';
import { processVoiceFeedback } from '../services/feedback';

const FEEDBACK_EMAIL = 'santiago@example.com'; // TODO: replace with real email

type FeedbackState = 'idle' | 'recording' | 'processing' | 'done' | 'error';

export default function FeedbackButton() {
  const [modalVisible, setModalVisible] = useState(false);
  const [state, setState] = useState<FeedbackState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const recordingRef = useRef<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  const startPulse = () => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, easing: Easing.ease, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
  };

  const stopPulse = () => {
    pulseLoop.current?.stop();
    pulseAnim.setValue(1);
  };

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setState('recording');
      startPulse();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      setState('error');
      setErrorMsg('Could not start recording');
    }
  };

  const stopAndSend = async () => {
    stopPulse();
    setState('processing');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const recording = recordingRef.current;
      if (!recording) throw new Error('No recording');

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) throw new Error('No audio file');

      const feedback = await processVoiceFeedback(uri);

      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) throw new Error('Email not available on this device');

      await MailComposer.composeAsync({
        recipients: [FEEDBACK_EMAIL],
        subject: 'Camila App Feedback',
        body: feedback,
      });

      setState('done');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        setModalVisible(false);
        setState('idle');
      }, 1500);
    } catch (e: any) {
      setState('error');
      setErrorMsg(e.message || 'Something went wrong');
    }
  };

  const close = () => {
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => {});
    }
    stopPulse();
    setModalVisible(false);
    setState('idle');
  };

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setModalVisible(true)} activeOpacity={0.7}>
        <Text style={styles.triggerText}>Report / Suggest</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Voice Feedback</Text>
            <Text style={styles.sheetHint}>
              {state === 'idle' && 'Tap the mic to record your feedback'}
              {state === 'recording' && 'Recording... tap to stop & send'}
              {state === 'processing' && 'Processing with AI...'}
              {state === 'done' && 'Sent! Thank you.'}
              {state === 'error' && errorMsg}
            </Text>

            {(state === 'idle' || state === 'recording') && (
              <TouchableOpacity
                onPress={state === 'idle' ? startRecording : stopAndSend}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={[
                    styles.micButton,
                    state === 'recording' && styles.micRecording,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                >
                  <Text style={styles.micIcon}>{state === 'recording' ? '⏹' : '🎙'}</Text>
                </Animated.View>
              </TouchableOpacity>
            )}

            {state === 'processing' && <ActivityIndicator size="large" color={COLORS.burgundy} style={{ marginTop: 20 }} />}
            {state === 'done' && <Text style={styles.checkmark}>✓</Text>}

            <TouchableOpacity style={styles.cancelBtn} onPress={close}>
              <Text style={styles.cancelText}>{state === 'done' ? 'Close' : 'Cancel'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  triggerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textDecorationLine: 'underline',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 32,
    alignItems: 'center',
    paddingBottom: 48,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray800,
    marginBottom: 8,
  },
  sheetHint: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: 'center',
    marginBottom: 24,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micRecording: {
    backgroundColor: COLORS.errorLight,
  },
  micIcon: {
    fontSize: 32,
  },
  checkmark: {
    fontSize: 48,
    color: COLORS.success,
    marginTop: 20,
  },
  cancelBtn: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelText: {
    fontSize: 15,
    color: COLORS.gray500,
  },
});
