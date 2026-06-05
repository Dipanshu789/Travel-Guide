import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Image, SafeAreaView, TouchableOpacity, Dimensions, Animated as RNAnimated, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StoryViewerProps {
  visible: boolean;
  story: any;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export default function StoryViewer({ visible, story, onClose }: StoryViewerProps) {
  const progress = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (visible && story) {
      progress.setValue(0);
      RNAnimated.timing(progress, {
        toValue: 1,
        duration: 5000, // 5 seconds per story
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          onClose();
        }
      });
    } else {
      progress.stopAnimation();
      progress.setValue(0);
    }
  }, [visible, story]);

  const handlePress = (evt: any) => {
    const x = evt.nativeEvent.locationX;
    // Tapping right side goes to next (or closes if last). Tapping left could go back (omitted for simplicity, just resets for now)
    if (x > width / 2) {
      onClose(); // Close on tap right for now, since we show 1 story at a time
    } else {
      progress.setValue(0);
      RNAnimated.timing(progress, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) onClose();
      });
    }
  };

  if (!story) return null;

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Progress Bar Container like WhatsApp */}
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.progressBarBackground}>
            <RNAnimated.View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>

          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Image source={{ uri: story.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' }} style={styles.avatar} />
              <View>
                <Text style={styles.username}>{story.userName}</Text>
                <Text style={styles.timeText}>Just now</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={32} color="#FFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <TouchableWithoutFeedback onPress={handlePress}>
          <Image source={{ uri: story.image }} style={styles.image} />
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
    zIndex: -1,
  },
  headerSafeArea: {
    paddingTop: 10,
    zIndex: 10,
  },
  progressBarBackground: {
    flexDirection: 'row',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 10,
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFF',
    marginRight: 10,
  },
  username: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  timeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  closeBtn: {
    padding: 5,
  }
});
