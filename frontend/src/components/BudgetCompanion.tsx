import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import GenerateButton from './GenerateButton';

const TypewriterText = ({ text, onComplete }: { text: string, onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      if (index < text.length) {
        // Fast streaming effect like ChatGPT
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, 10); // 10ms per character gives a smooth, fast stream
    return () => clearInterval(timer);
  }, [text]); // only run when text changes

  return <Text style={styles.gptText}>{displayedText}</Text>;
};

interface BudgetCompanionProps {
  visible: boolean;
  onClose: () => void;
  initialFrom?: string;
  initialTo?: string;
  initialBudget?: string;
  initialDays?: string;
}

export default function BudgetCompanion({ visible, onClose, initialFrom = '', initialTo = '', initialBudget = '', initialDays = '' }: BudgetCompanionProps) {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [budget, setBudget] = useState(initialBudget);
  const [days, setDays] = useState(initialDays);

  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const generatePlan = async () => {
    if (!from || !to || !budget || !days) {
      setError('Please fill out all fields.');
      return;
    }

    setError('');
    setLoading(true);
    setPlan(null);
    setIsTyping(false);

    try {
      let BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
      if (BACKEND_URL.endsWith('/')) BACKEND_URL = BACKEND_URL.slice(0, -1);
      const response = await fetch(`${BACKEND_URL}/api/ai/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: from.trim(), to: to.trim(), budget, days })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch plan');
      }

      setPlan(data.plan);
      setIsTyping(true); // Start the typing effect
    } catch (err: any) {
      setError(err.message || 'Something went wrong while connecting to the ML Service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI Trip Planner ✨</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Input Form */}
            <View style={styles.inputGroup}>
              <View style={styles.inputRow}>
                <Ionicons name="airplane-outline" size={20} color="#6C63FF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="From (e.g. New York)"
                  value={from}
                  onChangeText={setFrom}
                />
              </View>
              <View style={styles.inputRow}>
                <Ionicons name="location-outline" size={20} color="#FF6B6B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="To (e.g. Paris)"
                  value={to}
                  onChangeText={setTo}
                />
              </View>
              <View style={styles.inputRow}>
                <Ionicons name="wallet-outline" size={20} color="#4ECDC4" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Total Budget (INR)"
                  keyboardType="numeric"
                  value={budget}
                  onChangeText={setBudget}
                />
              </View>
              <View style={styles.inputRow}>
                <Ionicons name="calendar-outline" size={20} color="#FFA07A" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="How many days stay?"
                  keyboardType="numeric"
                  value={days}
                  onChangeText={setDays}
                />
              </View>

              <View style={{ alignItems: 'center', marginTop: 15 }}>
                <GenerateButton onPress={generatePlan} disabled={loading} loading={loading} />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            {/* Loading State */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6C63FF" />
                <Text style={styles.loadingText}>Running predictions...</Text>
              </View>
            )}

            {/* AI Results */}
            {plan && !loading && (
              <Animated.View entering={FadeInUp.duration(600)} exiting={FadeOutDown}>

                {/* GPT Style Modern Report */}
                <View style={styles.gptContainer}>
                  <View style={styles.gptAvatar}>
                    <Ionicons name="sparkles" size={16} color="#FFF" />
                  </View>
                  <View style={styles.gptBubble}>
                    <TypewriterText text={plan.formatted_report} onComplete={() => setIsTyping(false)} />
                  </View>
                </View>

                {/* Show the rich cards ONLY AFTER the AI finishes typing */}
                {!isTyping && (
                  <Animated.View entering={FadeInUp.duration(800)}>
                    {/* Primary Recommendations */}
                    <View style={styles.recommendationGrid}>
                      <View style={styles.primaryCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#F0F0FF' }]}>
                          <Ionicons name={plan.transport?.toLowerCase() === 'flight' ? 'airplane' : 'train'} size={24} color="#6C63FF" />
                        </View>
                        <Text style={styles.cardLabel}>Transport</Text>
                        <Text style={styles.cardValue}>{plan.transport}</Text>
                      </View>

                      <View style={styles.primaryCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#FFF0F0' }]}>
                          <Ionicons name="bed" size={24} color="#FF6B6B" />
                        </View>
                        <Text style={styles.cardLabel}>Hotel</Text>
                        <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>{plan.hotel_name}</Text>
                        <Text style={styles.cardCost}>₹{plan.hotel_price_per_night} / night</Text>
                      </View>
                    </View>

                    {/* Top Attractions */}
                    <View style={styles.attractionSection}>
                      <View style={styles.sectionHeaderRow}>
                        <Ionicons name="map" size={20} color="#4ECDC4" />
                        <Text style={styles.sectionHeading}>Top Attractions</Text>
                      </View>
                      <Text style={styles.subtext}>Est. Ticket Cost: ₹{plan.attraction_ticket_cost}</Text>

                      <View style={styles.pillContainer}>
                        {plan.top_attractions?.split('|').map((attr: string, index: number) => (
                          <View key={index} style={styles.pill}>
                            <Text style={styles.pillText}>{attr.trim()}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Alternatives */}
                    <View style={styles.alternativeSection}>
                      <Text style={styles.sectionHeading}>Alternative Hotels</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.altScroll}>
                        {plan.alternative_hotels && plan.alternative_hotels.length > 0 ? plan.alternative_hotels.map((hotel: string, index: number) => (
                          <View key={index} style={styles.altCard}>
                            <Ionicons name="business" size={16} color="#FF9F43" style={{ marginRight: 6 }} />
                            <Text style={styles.altText}>{hotel}</Text>
                          </View>
                        )) : <Text style={styles.altText}>None found in this budget.</Text>}
                      </ScrollView>
                    </View>

                    <View style={styles.alternativeSection}>
                      <Text style={styles.sectionHeading}>Alternative Attractions</Text>
                      {plan.alternative_attractions && plan.alternative_attractions.length > 0 ? plan.alternative_attractions.slice(0, 3).map((attrs: string, index: number) => (
                        <View key={index} style={styles.altAttractionCard}>
                          <Ionicons name="compass-outline" size={16} color="#6C63FF" style={{ marginTop: 2, marginRight: 8 }} />
                          <Text style={styles.altAttractionText}>{attrs.split('|').map((a: string) => a.trim()).join(', ')}</Text>
                        </View>
                      )) : <Text style={styles.altText}>None found.</Text>}
                    </View>
                  </Animated.View>
                )}

              </Animated.View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    maxHeight: '92%',
    minHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeBtn: {
    padding: 5,
    backgroundColor: '#EEEEEE',
    borderRadius: 20,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 10,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    ...(React.Component.prototype && { outlineStyle: 'none' } as any),
  },
  errorText: {
    color: '#FF6B6B',
    marginTop: 10,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  loadingText: {
    marginTop: 15,
    color: '#666',
    fontSize: 16,
  },

  /* --- NEW GPT CHAT STYLES --- */
  gptContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingRight: 10,
  },
  gptAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#10A37F', // OpenAI Green
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 4,
  },
  gptBubble: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderTopLeftRadius: 0, // Gives the speech bubble effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  gptText: {
    color: '#333333',
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'Inter',
  },

  /* --- RICH CARDS --- */
  recommendationGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  primaryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardCost: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },

  attractionSection: {
    backgroundColor: '#E0F9F5',
    padding: 15,
    borderRadius: 16,
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 6,
  },
  subtext: {
    fontSize: 13,
    color: '#666',
    marginLeft: 26,
    marginBottom: 12,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  pillText: {
    color: '#2B8C85',
    fontSize: 12,
    fontWeight: '600',
  },

  alternativeSection: {
    marginBottom: 20,
  },
  altScroll: {
    marginTop: 10,
    paddingBottom: 5,
  },
  altCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  altText: {
    color: '#555',
    fontSize: 13,
    fontWeight: '500',
  },
  altAttractionCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F0FF',
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#DEDEFF',
  },
  altAttractionText: {
    color: '#444',
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  }
});
