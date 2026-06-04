import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSharedValue } from 'react-native-reanimated';
import InteractiveAirplane from '../components/InteractiveAirplane';
import { signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '../config/firebase';

export default function AuthScreen({ navigation }: any) {
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const cursorX = useSharedValue(200);
  const cursorY = useSharedValue(200);

  const handlePointerMove = (e: any) => {
    // For Web, clientX and clientY are global. Fallback to nativeEvent.x/y if needed.
    cursorX.value = e.clientX || e.nativeEvent.pageX || e.nativeEvent.x;
    cursorY.value = e.clientY || e.nativeEvent.pageY || e.nativeEvent.y;
  };

  const syncWithBackend = async (idToken: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: idToken })
      });
      if (!response.ok) {
        console.error('Failed to sync with backend');
      }
    } catch (error) {
      console.error('Backend sync error:', error);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      await syncWithBackend(token);
      navigation.replace('Dashboard');
    } catch (error: any) {
      console.error(error);
      alert('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      await syncWithBackend(token);
      navigation.replace('Dashboard');
    } catch (error: any) {
      console.error(error);
      alert('Sign Up failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const token = await userCredential.user.getIdToken();
      await syncWithBackend(token);
      navigation.replace('Dashboard');
    } catch (error: any) {
      console.error(error);
      alert('Google login failed: ' + error.message);
    }
  };

  const handleAppleLogin = async () => {
    try {
      const userCredential = await signInWithPopup(auth, appleProvider);
      const token = await userCredential.user.getIdToken();
      await syncWithBackend(token);
      navigation.replace('Dashboard');
    } catch (error: any) {
      console.error(error);
      alert('Apple login failed: ' + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1 }} onPointerMove={handlePointerMove}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <InteractiveAirplane
            cursorX={cursorX}
            cursorY={cursorY}
            isPasswordFocused={passwordFocus}
            isPasswordVisible={isPasswordVisible}
          />
          <View style={styles.form}>
            <View style={styles.flexColumn}>
              <Text style={styles.label}>Email</Text>
            </View>
            <View style={[styles.inputForm, emailFocus && styles.inputFormFocused]}>
              <Ionicons name="mail-outline" size={20} color="#666" />
              <TextInput
                style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                placeholder="Enter your Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
              />
            </View>

            <View style={[styles.flexColumn, { marginTop: 15 }]}>
              <Text style={styles.label}>Password</Text>
            </View>
            <View style={[styles.inputForm, passwordFocus && styles.inputFormFocused]}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" />
              <TextInput
                style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                placeholder="Enter your Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                onFocus={() => setPasswordFocus(true)}
                onBlur={() => setPasswordFocus(false)}
              />
              <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={{ padding: 5 }}>
                <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.flexRow}>
              <View style={styles.rememberMeContainer}>
                <View style={styles.radioPlaceholder} />
                <Text style={styles.rememberText}>Remember me</Text>
              </View>
              <Text style={styles.span}>Forgot password?</Text>
            </View>

            <TouchableOpacity style={styles.buttonSubmit} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonSubmitText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.p}>
              Don't have an account? <Text style={styles.span} onPress={handleSignUp}>Sign Up</Text>
            </Text>

            <Text style={styles.pLine}>Or With</Text>

            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.btn} onPress={handleGoogleLogin}>
                <Ionicons name="logo-google" size={20} color="#EA4335" />
                <Text style={styles.btnText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btn} onPress={handleAppleLogin}>
                <Ionicons name="logo-apple" size={20} color="#000" />
                <Text style={styles.btnText}>Apple</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    width: '100%',
    maxWidth: 450,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  flexColumn: {
    flexDirection: 'column',
    marginBottom: 5,
  },
  label: {
    color: '#151717',
    fontWeight: '600',
    fontSize: 14,
  },
  inputForm: {
    borderWidth: 1.5,
    borderColor: '#ecedec',
    borderRadius: 10,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
  },
  inputFormFocused: {
    borderColor: '#2d79f3',
  },
  input: {
    marginLeft: 10,
    borderRadius: 10,
    width: '100%',
    height: '100%',
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ccc',
    marginRight: 8,
  },
  rememberText: {
    fontSize: 14,
    color: 'black',
    fontWeight: '400',
  },
  span: {
    fontSize: 14,
    marginLeft: 5,
    color: '#2d79f3',
    fontWeight: '500',
  },
  buttonSubmit: {
    marginTop: 25,
    marginBottom: 15,
    backgroundColor: '#151717',
    borderRadius: 10,
    height: 50,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSubmitText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
  p: {
    textAlign: 'center',
    color: 'black',
    fontSize: 14,
    marginVertical: 5,
  },
  pLine: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginVertical: 20,
    fontWeight: '500',
    position: 'relative',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  btn: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ededef',
    backgroundColor: 'white',
  },
  btnText: {
    fontWeight: '500',
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  }
});
