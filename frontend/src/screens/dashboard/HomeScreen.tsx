import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../config/firebase';
import Animated, { FadeInDown, FadeInRight, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import BudgetCompanion from '../../components/BudgetCompanion';

export default function HomeScreen() {
  const user = auth.currentUser;
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Traveler';

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // Notification Bell Pulse Animation
  const bellScale = useSharedValue(1);
  useEffect(() => {
    bellScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 200 }),
        withTiming(1, { duration: 200 }),
        withTiming(1.2, { duration: 200 }),
        withTiming(1, { duration: 2000 })
      ),
      -1, // infinite loop
      false
    );
  }, []);

  const bellAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bellScale.value }]
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <Animated.View style={styles.header} entering={FadeInDown.duration(800).springify()}>
          <View>
            <Text style={styles.greeting}>Hello, {displayName}!</Text>
            <Text style={styles.subtitle}>Where to next?</Text>
          </View>
          <Animated.View style={bellAnimatedStyle}>
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons name="notifications-outline" size={24} color="#333" />
              <View style={styles.badge} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Trip Planner Card */}
        <Animated.View style={styles.plannerCard} entering={FadeInDown.duration(800).delay(200).springify()}>
          <View style={styles.inputWrapper}>
            <Ionicons name="airplane-outline" size={20} color="#6C63FF" style={styles.inputIcon} />
            <TextInput 
              style={styles.plannerInput} 
              placeholder="From (e.g. New York)" 
              placeholderTextColor="#999"
              value={from}
              onChangeText={setFrom}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.inputWrapper}>
            <Ionicons name="location-outline" size={20} color="#FF6B6B" style={styles.inputIcon} />
            <TextInput 
              style={styles.plannerInput} 
              placeholder="To (e.g. Paris)" 
              placeholderTextColor="#999"
              value={to}
              onChangeText={setTo}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.planBtn} 
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="sparkles" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.planBtnText}>Plan Budget with AI</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Categories */}
        <View style={styles.section}>
          <Animated.Text style={styles.sectionTitle} entering={FadeInDown.duration(800).delay(300).springify()}>
            Categories
          </Animated.Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
            {['Flights', 'Hotels', 'Experiences', 'Cars'].map((item, index) => (
              <Animated.View key={index} entering={FadeInRight.duration(600).delay(400 + (index * 100)).springify()}>
                <TouchableOpacity style={styles.categoryItem}>
                  <View style={styles.categoryIcon}>
                    <Ionicons 
                      name={item === 'Flights' ? 'airplane' : item === 'Hotels' ? 'bed' : item === 'Experiences' ? 'compass' : 'car'} 
                      size={24} 
                      color="#6C63FF" 
                    />
                  </View>
                  <Text style={styles.categoryText}>{item}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        {/* Popular Destinations */}
        <View style={styles.section}>
          <Animated.View style={styles.sectionHeader} entering={FadeInDown.duration(800).delay(600).springify()}>
            <Text style={styles.sectionTitle}>Popular Destinations</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </Animated.View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.destinations}>
            {[1, 2, 3].map((item, index) => (
              <Animated.View key={item} entering={FadeInRight.duration(600).delay(700 + (index * 150)).springify()} style={styles.destinationCard}>
                <View style={[styles.destinationImage, { backgroundColor: item === 1 ? '#FFD700' : item === 2 ? '#FF6B6B' : '#4ECDC4' }]} />
                <View style={styles.destinationInfo}>
                  <Text style={styles.destinationName}>{item === 1 ? 'Paris, France' : item === 2 ? 'Tokyo, Japan' : 'Bali, Indonesia'}</Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.ratingText}>4.9</Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <BudgetCompanion 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        initialFrom={from}
        initialTo={to}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 25,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  notificationBtn: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
  },
  plannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  plannerInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    ...(React.Component.prototype && { outlineStyle: 'none' } as any),
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 5,
  },
  planBtn: {
    flexDirection: 'row',
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingVertical: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  planBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  seeAll: {
    color: '#6C63FF',
    fontWeight: 'bold',
  },
  categories: {
    flexDirection: 'row',
    paddingBottom: 10,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 25,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#F0F0FF',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryText: {
    color: '#333',
    fontWeight: '600',
  },
  destinations: {
    flexDirection: 'row',
    paddingBottom: 20,
  },
  destinationCard: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  destinationImage: {
    width: '100%',
    height: 150,
  },
  destinationInfo: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  destinationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 5,
    fontWeight: 'bold',
    color: '#666',
  },
});
