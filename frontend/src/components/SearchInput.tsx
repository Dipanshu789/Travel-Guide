import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withSequence,
  interpolateColor
} from 'react-native-reanimated';

const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

interface SearchInputProps {
  onPress?: () => void;
  style?: any;
}

const SearchInput: React.FC<SearchInputProps> = ({ onPress, style }) => {
  const pressed = useSharedValue(0);

  const handlePressIn = () => {
    pressed.value = withSequence(
      withTiming(0.5, { duration: 150 }), // Fast bounce
      withTiming(1, { duration: 150 })
    );
  };

  const handlePressOut = () => {
    pressed.value = withTiming(0, { duration: 300 });
  };

  const bgStyle = useAnimatedStyle(() => {
    let tx, ty;
    if (pressed.value < 0.5) {
      const progress = pressed.value * 2; // 0 to 1
      tx = -64 + (76.8 * progress); // -64 to 12.8
      ty = 64 - (76.8 * progress);  // 64 to -12.8
    } else {
      const progress = (pressed.value - 0.5) * 2; // 0 to 1
      tx = 12.8 - (12.8 * progress);  // 12.8 to 0
      ty = -12.8 + (12.8 * progress); // -12.8 to 0
    }
    return {
      transform: [
        { translateX: tx },
        { translateY: ty }
      ]
    };
  });

  const iconStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      pressed.value,
      [0, 1],
      ['#DB7093', '#FFFFFF'] // palevioletred is #DB7093
    );
    return {
      color,
      transform: [{ scale: pressed.value > 0.5 ? 1.3 : 1 }]
    };
  });

  return (
    <View style={[styles.wrapper, style]}>
      <Pressable 
        style={styles.button}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <Animated.View style={[styles.bgFill, bgStyle]} />
        <AnimatedIcon name="search" size={24} style={[styles.icon, iconStyle]} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  button: {
    width: 64,
    height: 64,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  bgFill: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'palevioletred',
    left: 0,
    bottom: 0,
  },
  icon: {
    zIndex: 1,
  }
});

export default SearchInput;
