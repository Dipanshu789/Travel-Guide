import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withDelay } from 'react-native-reanimated';

export default function AnimatedButton({ onPress, title = "Hover me" }: { onPress: () => void, title?: string }) {
  const isHovered = useSharedValue(false);

  // Easing function from cubic-bezier(0.19, 1, 0.22, 1)
  const ease = Easing.bezier(0.19, 1, 0.22, 1);

  const layer1Style = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(isHovered.value ? 1 : 0, { duration: 1300, easing: ease }) }]
  }));
  
  const layer2Style = useAnimatedStyle(() => ({
    transform: [{ scale: withDelay(isHovered.value ? 100 : 0, withTiming(isHovered.value ? 1 : 0, { duration: 1300, easing: ease })) }]
  }));

  const layer3Style = useAnimatedStyle(() => ({
    transform: [{ scale: withDelay(isHovered.value ? 200 : 0, withTiming(isHovered.value ? 1 : 0, { duration: 1300, easing: ease })) }]
  }));

  const staticTextStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isHovered.value ? 0 : 1, { duration: 300, easing: Easing.linear }),
    transform: [{ translateY: withTiming(isHovered.value ? -20 : 0, { duration: 1400, easing: ease }) }]
  }));

  const hoverTextStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isHovered.value ? 1 : 0, { duration: 1400, easing: ease }),
    transform: [{ translateY: withTiming(isHovered.value ? 0 : 20, { duration: 1400, easing: ease }) }]
  }));

  const PressableComponent = Pressable as any; // Type assertion to bypass TS for onHoverIn on native

  return (
    <PressableComponent
      onPress={onPress}
      onHoverIn={() => { isHovered.value = true; }}
      onHoverOut={() => { isHovered.value = false; }}
      onPressIn={() => { isHovered.value = true; }} // For mobile fallback
      onPressOut={() => { isHovered.value = false; }}
      style={styles.container}
    >
      <View style={styles.buttonBg}>
        <View style={styles.layersContainer}>
          <Animated.View style={[styles.layer, styles.layer1, layer1Style]} />
          <Animated.View style={[styles.layer, styles.layer2, layer2Style]} />
          <Animated.View style={[styles.layer, styles.layer3, layer3Style]} />
        </View>
      </View>
      
      <View style={styles.textContainer}>
        <Animated.Text style={[styles.text, styles.staticText, staticTextStyle]}>{title}</Animated.Text>
        <Animated.Text style={[styles.text, styles.hoverText, hoverTextStyle]}>{title}</Animated.Text>
      </View>
    </PressableComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56, // 3.5rem
    paddingHorizontal: 32, // 2rem
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'transparent',
    minWidth: 160,
  },
  buttonBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 208, 116, 1)',
    borderRadius: 9999,
    overflow: 'hidden',
    borderColor: 'rgba(255, 208, 116, 1)',
    borderWidth: 1,
  },
  layersContainer: {
    position: 'absolute',
    left: '50%',
    top: '-60%',
    width: 300,
    height: 300,
    marginLeft: -150, // To center horizontally based on left: 50%
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 9999,
    transform: [{ scale: 0 }],
  },
  layer1: { backgroundColor: 'rgba(163, 116, 255, 1)' },
  layer2: { backgroundColor: 'rgba(23, 241, 209, 1)' },
  layer3: { backgroundColor: 'rgba(255, 208, 116, 1)' },
  textContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: Platform.OS === 'web' ? 'Segoe UI' : 'System',
    fontSize: 19.2, // 1.2rem
    fontWeight: '600',
    color: '#1d1d1f',
    letterSpacing: -1.15,
  },
  staticText: {
  },
  hoverText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    textAlign: 'center',
    opacity: 0,
    transform: [{ translateY: 20 }],
  }
});
