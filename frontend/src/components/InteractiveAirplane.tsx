import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  useDerivedValue,
  withRepeat,
  Easing,
  SharedValue,
  withSequence
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  cursorX: SharedValue<number>;
  cursorY: SharedValue<number>;
  isPasswordFocused: boolean;
  isPasswordVisible: boolean;
}

const { width } = Dimensions.get('window');
const AIRPLANE_X = width / 2;
const AIRPLANE_Y = 150;

export default function InteractiveAirplane({ cursorX, cursorY, isPasswordFocused, isPasswordVisible }: Props) {
  const cloudOffset = useSharedValue(0);
  const blinkOffset = useSharedValue(0);

  useEffect(() => {
    // Seamless clouds
    cloudOffset.value = withRepeat(
      withTiming(-width, { duration: 15000, easing: Easing.linear }),
      -1,
      false
    );
    // Blinking anti-collision light
    blinkOffset.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 900 })
      ),
      -1,
      false
    );
  }, []);

  const cloudLayerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cloudOffset.value }],
  }));

  const blinkStyle = useAnimatedStyle(() => ({
    opacity: blinkOffset.value,
  }));

  // Character animation logic
  const headTranslateX = useDerivedValue(() => {
    if (isPasswordFocused && !isPasswordVisible) return withSpring(0);
    const dx = cursorX.value - AIRPLANE_X;
    return withSpring(Math.max(-8, Math.min(8, dx / 30)), { damping: 20 });
  });

  const headTranslateY = useDerivedValue(() => {
    if (isPasswordVisible) return withSpring(60, { damping: 15, stiffness: 90 }); // Hide
    if (isPasswordFocused) return withSpring(8, { damping: 20 }); // Look down
    const dy = cursorY.value - AIRPLANE_Y;
    return withSpring(Math.max(-5, Math.min(8, dy / 30)), { damping: 20 });
  });

  const pupilTranslateX = useDerivedValue(() => {
    if (isPasswordFocused && !isPasswordVisible) return withSpring(0);
    const dx = cursorX.value - AIRPLANE_X;
    return withSpring(Math.max(-3, Math.min(3, dx / 40)));
  });

  const pupilTranslateY = useDerivedValue(() => {
    if (isPasswordVisible) return withSpring(0);
    if (isPasswordFocused) return withSpring(3);
    const dy = cursorY.value - AIRPLANE_Y;
    return withSpring(Math.max(-3, Math.min(3, dy / 40)));
  });

  const headAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: headTranslateX.value },
      { translateY: headTranslateY.value }
    ]
  }));

  const pupilAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pupilTranslateX.value },
      { translateY: pupilTranslateY.value }
    ]
  }));

  const CloudSet = () => (
    <View style={{ width, height: 200, position: 'relative' }}>
      <View style={[styles.cloud, { top: 30, left: '10%', transform: [{ scale: 0.7 }] }]} />
      <View style={[styles.cloud, { top: 130, left: '35%', transform: [{ scale: 1.2 }] }]} />
      <View style={[styles.cloud, { top: 60, left: '75%', transform: [{ scale: 0.9 }] }]} />
      <View style={[styles.cloud, { top: 160, left: '85%', transform: [{ scale: 0.5 }] }]} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Seamless Looping Clouds */}
      <Animated.View style={[styles.cloudWrapper, cloudLayerStyle]}>
        <CloudSet />
        <CloudSet />
      </Animated.View>

      {/* Full Airplane */}
      <View style={styles.airplane}>
        
        {/* Tail Fin */}
        <LinearGradient 
          colors={['#2D79F3', '#1C5BBE']}
          style={styles.tail} 
        >
          {/* Logo on tail */}
          <View style={styles.tailLogo} />
        </LinearGradient>

        {/* Back horizontal stabilizer */}
        <View style={styles.tailStabilizer} />

        {/* Main Fuselage */}
        <View style={styles.fuselageContainer}>
          <LinearGradient
            colors={['#FFFFFF', '#E8E8E8', '#C0C0C0']}
            locations={[0.1, 0.6, 1]}
            style={styles.fuselage}
          >
            {/* Airline Stripe */}
            <View style={styles.stripeBlue} />
            <View style={styles.stripeOrange} />

            {/* Cockpit Window */}
            <View style={styles.cockpit}>
              <View style={styles.cockpitGlare} />
            </View>
            
            {/* Passenger Windows */}
            <View style={[styles.smallWindow, { left: 155 }]} />
            <View style={[styles.smallWindow, { left: 185 }]} />
            <View style={[styles.smallWindow, { left: 215 }]} />

            {/* The Interactive Window with Character */}
            <View style={styles.interactiveWindow}>
              {/* Dark interior background */}
              <View style={styles.windowInterior} />
              
              <Animated.View style={[styles.characterBody, headAnimatedStyle]}>
                <View style={styles.shoulders} />
                <View style={styles.head}>
                  <View style={styles.hair} />
                  <View style={styles.eyesContainer}>
                    <View style={styles.eye}>
                      <Animated.View style={[styles.pupil, pupilAnimatedStyle]} />
                    </View>
                    <View style={styles.eye}>
                      <Animated.View style={[styles.pupil, pupilAnimatedStyle]} />
                    </View>
                  </View>
                  <View style={styles.nose} />
                </View>
              </Animated.View>
              {/* Window Glare */}
              <View style={styles.windowGlare} />
            </View>
          </LinearGradient>
        </View>

        {/* Engine and Wing Layered over fuselage */}
        
        {/* Engine Pylon (strut) */}
        <View style={styles.engineStrut} />

        {/* Turbine Engine */}
        <LinearGradient
          colors={['#E0E0E0', '#999999']}
          style={styles.engine}
        >
          {/* Engine Intake */}
          <View style={styles.engineIntake} />
        </LinearGradient>

        {/* Main Wing */}
        <LinearGradient
          colors={['#FFFFFF', '#B0B0B0']}
          style={styles.wing}
        />

        {/* Blinking Red Light on top of fuselage */}
        <Animated.View style={[styles.beaconLight, blinkStyle]} />

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 240, // Increased height for better proportions
    marginBottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cloudWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 240,
    flexDirection: 'row',
  },
  cloud: {
    position: 'absolute',
    width: 80,
    height: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Fluffy white clouds
    borderRadius: 20,
    shadowColor: '#FFF',
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  airplane: {
    width: 320,
    height: 140,
    position: 'relative',
    marginTop: 20,
  },
  fuselageContainer: {
    position: 'absolute',
    top: 30,
    left: 10,
    width: 290,
    height: 75,
    borderRadius: 45, // Full rounded pill shape
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    zIndex: 2,
  },
  fuselage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 50,
    borderBottomLeftRadius: 25,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  stripeBlue: {
    position: 'absolute',
    top: 35,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#2D79F3',
  },
  stripeOrange: {
    position: 'absolute',
    top: 41,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#FFB800',
  },
  tail: {
    position: 'absolute',
    right: 15,
    top: -10,
    width: 60,
    height: 65,
    borderTopRightRadius: 25,
    borderTopLeftRadius: 10,
    transform: [{ skewX: '-30deg' }],
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tailLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    transform: [{ skewX: '30deg' }], // Counter skew
  },
  tailStabilizer: {
    position: 'absolute',
    right: 5,
    top: 40,
    width: 40,
    height: 15,
    backgroundColor: '#C0C0C0',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 5,
    transform: [{ skewX: '-30deg' }],
    zIndex: 3,
  },
  wing: {
    position: 'absolute',
    left: 120,
    bottom: 25,
    width: 110,
    height: 35,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 15,
    borderTopLeftRadius: 10,
    transform: [{ skewX: '-40deg' }],
    zIndex: 4, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  engineStrut: {
    position: 'absolute',
    left: 125,
    bottom: 35,
    width: 10,
    height: 25,
    backgroundColor: '#888',
    zIndex: 2,
  },
  engine: {
    position: 'absolute',
    left: 105,
    bottom: 12,
    width: 50,
    height: 24,
    borderRadius: 12,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  engineIntake: {
    width: 8,
    height: 20,
    backgroundColor: '#333',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    marginLeft: -1, // slight overlap
  },
  beaconLight: {
    position: 'absolute',
    top: 26,
    left: 150,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF0000',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    zIndex: 6,
  },
  cockpit: {
    position: 'absolute',
    left: 8,
    top: 15,
    width: 45,
    height: 28,
    backgroundColor: '#1E3A8A',
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 5,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 2,
    overflow: 'hidden',
  },
  cockpitGlare: {
    position: 'absolute',
    top: 2,
    left: 5,
    width: 20,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 5,
    transform: [{ rotate: '-10deg' }],
  },
  interactiveWindow: {
    position: 'absolute',
    left: 80,
    top: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#E0E0E0',
    backgroundColor: '#C5E4F3',
  },
  windowInterior: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#6BA4C4', // Darker interior back wall
  },
  windowGlare: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 80,
    height: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    transform: [{ rotate: '-30deg' }],
  },
  smallWindow: {
    position: 'absolute',
    top: 20,
    width: 20,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#1E3A8A',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  characterBody: {
    position: 'absolute',
    bottom: -20,
    left: '50%',
    marginLeft: -25, 
    width: 50,
    height: 80,
    alignItems: 'center',
    zIndex: 1,
  },
  shoulders: {
    position: 'absolute',
    bottom: 0,
    width: 50,
    height: 25,
    backgroundColor: '#151717', // Match the sign in button color for style
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  head: {
    position: 'absolute',
    top: 10,
    width: 36,
    height: 36,
    backgroundColor: '#FFE0BD',
    borderRadius: 18,
    alignItems: 'center',
  },
  hair: {
    position: 'absolute',
    top: -2,
    width: 40,
    height: 14,
    backgroundColor: '#3E2723',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  eyesContainer: {
    flexDirection: 'row',
    marginTop: 15,
    width: 20,
    justifyContent: 'space-between',
  },
  eye: {
    width: 8,
    height: 8,
    backgroundColor: '#FFF',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pupil: {
    width: 4,
    height: 4,
    backgroundColor: '#000',
    borderRadius: 2,
  },
  nose: {
    width: 6,
    height: 4,
    backgroundColor: '#E0AC69',
    borderRadius: 2,
    marginTop: 3,
  },
});
