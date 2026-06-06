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
import { useTheme } from '../config/ThemeContext';

const AuthLoader = () => {
  const { colors } = useTheme();
  const progress1 = useSharedValue(0);
  const progress2 = useSharedValue(0);
  const progress3 = useSharedValue(0);
  const rotation = useSharedValue(0);

  const createDotAnimation = () => {
    return withRepeat(
      withSequence(
        withTiming(0.2, { duration: 400, easing: Easing.linear }),
        withTiming(0.45, { duration: 500, easing: Easing.linear }),
        withTiming(0.6, { duration: 300, easing: Easing.linear }),
        withTiming(0.8, { duration: 400, easing: Easing.linear }),
        withTiming(1, { duration: 400, easing: Easing.linear })
      ),
      -1,
      false
    );
  };

  useEffect(() => {
    progress1.value = createDotAnimation();
    progress2.value = createDotAnimation();
    progress3.value = createDotAnimation();
    
    rotation.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1100, easing: Easing.linear }),
        withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 400, easing: Easing.linear })
      ),
      -1,
      false
    );
  }, []);

  const getStyle = (pVal: any, maxTx: number, maxTy: number, midTx: number, midTy: number, zIndexBase: number) => {
    return useAnimatedStyle(() => {
      const p = pVal.value;
      let tx = 0;
      let ty = 0;
      let scale = 1;

      if (p <= 0.2) {
        tx = 0; ty = 0; scale = 1;
      } else if (p <= 0.45) {
        tx = interpolate(p, [0.2, 0.45], [0, midTx]);
        ty = interpolate(p, [0.2, 0.45], [0, midTy]);
        scale = interpolate(p, [0.2, 0.45], [1, 0.45]);
      } else if (p <= 0.6) {
        tx = interpolate(p, [0.45, 0.6], [midTx, maxTx]);
        ty = interpolate(p, [0.45, 0.6], [midTy, maxTy]);
        scale = 0.45;
      } else if (p <= 0.8) {
        tx = maxTx; ty = maxTy; scale = 0.45;
      } else {
        tx = interpolate(p, [0.8, 1], [maxTx, 0]);
        ty = interpolate(p, [0.8, 1], [maxTy, 0]);
        scale = interpolate(p, [0.8, 1], [0.45, 1]);
      }

      return {
        zIndex: zIndexBase,
        transform: [
          { translateX: tx },
          { translateY: ty },
          { scale }
        ]
      };
    });
  };

  const style3 = getStyle(progress3, 0, -90, 0, -18, 3);
  const style2 = getStyle(progress2, -80, 60, -16, 12, 2);
  const style1 = getStyle(progress1, 80, 60, 16, 12, 1);

  const containerStyle = useAnimatedStyle(() => {
    const angle = rotation.value * 360;
    return {
      transform: [
        { rotate: `${angle}deg` }
      ]
    };
  });

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.container, containerStyle]}>
        <Animated.View style={[styles.dot, { backgroundColor: colors.primary }, style3]} />
        <Animated.View style={[styles.dot, { backgroundColor: '#4ECDC4' }, style2]} />
        <Animated.View style={[styles.dot, { backgroundColor: colors.error }, style1]} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 70,
    height: 70,
    borderRadius: 35,
    position: 'absolute',
  }
});

export default AuthLoader;
