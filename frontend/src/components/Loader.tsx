import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate
} from 'react-native-reanimated';

const Loader = () => {
  const slideProgress = useSharedValue(0);
  const rotateProgress = useSharedValue(0);

  useEffect(() => {
    slideProgress.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.25, { duration: 100, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.75, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.8, { duration: 100, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    rotateProgress.value = withRepeat(
      withSequence(
        withTiming(0.25, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.75, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const beforeStyle = useAnimatedStyle(() => {
    let bottom = -35;
    const p = slideProgress.value;
    if (p <= 0.2) bottom = interpolate(p, [0, 0.2], [-35, 2]);
    else if (p <= 0.25) bottom = interpolate(p, [0.2, 0.25], [2, -2]);
    else if (p <= 0.75) bottom = -2;
    else if (p <= 0.8) bottom = interpolate(p, [0.75, 0.8], [-2, 2]);
    else bottom = interpolate(p, [0.8, 1], [2, -35]);

    return {
      bottom,
      transform: [
        { translateX: 12 },
        { translateY: -16 },
        { rotate: '45deg' }
      ]
    };
  });

  const afterStyle = useAnimatedStyle(() => {
    let angle = -15;
    const p = rotateProgress.value;
    if (p <= 0.25) angle = interpolate(p, [0, 0.25], [-15, 0]);
    else if (p <= 0.75) angle = 0;
    else angle = interpolate(p, [0.75, 1], [0, 25]);

    return {
      transform: [
        { translateX: 35 },
        { translateY: 145 },
        { rotate: `${angle}deg` },
        { translateX: -35 },
        { translateY: -145 }
      ]
    };
  });

  return (
    <View style={styles.loader}>
      <Animated.View style={[styles.before, beforeStyle]}>
        <View style={styles.boxShadow} />
      </Animated.View>
      <Animated.View style={[styles.after, afterStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  loader: {
    width: 64,
    height: 64,
    backgroundColor: '#FFF',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  before: {
    position: 'absolute',
    left: 0,
    width: 40,
    height: 40,
    backgroundColor: '#ff9371',
  },
  boxShadow: {
    position: 'absolute',
    left: 32 - 5,
    top: -34 - 5,
    width: 50,
    height: 50,
    backgroundColor: '#ff3d00'
  },
  after: {
    position: 'absolute',
    left: 10,
    top: 10,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ff3d00'
  }
});

export default Loader;
