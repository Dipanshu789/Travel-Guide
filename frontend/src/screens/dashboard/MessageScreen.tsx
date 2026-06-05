import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../config/ThemeContext';

export default function MessageScreen() {
  const { colors } = useTheme();
  const activeChats = [
    { id: 1, name: 'Travel Support', message: 'Your flight to Paris is confirmed! ✈️', time: '10:42 AM', unread: 2, avatarColor: '#6C63FF' },
    { id: 2, name: 'Local Guide Marco', message: 'See you at the Colosseum tomorrow at 9.', time: 'Yesterday', unread: 0, avatarColor: '#4ECDC4' },
    { id: 3, name: 'Hotel Bellevue', message: 'Yes, we can arrange an early check-in.', time: 'Monday', unread: 0, avatarColor: '#FF6B6B' },
    { id: 4, name: 'Group: Bali Trippers', message: 'Sarah: Did anyone pack sunscreen?', time: 'Sunday', unread: 5, avatarColor: '#FFD700' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
          <TouchableOpacity style={[styles.composeBtn, { backgroundColor: colors.iconBackground }]}>
            <Ionicons name="create-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Chat List */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {activeChats.map((chat) => (
            <TouchableOpacity key={chat.id} style={styles.chatRow}>
              
              <View style={[styles.avatar, { backgroundColor: chat.avatarColor }]}>
                <Text style={styles.avatarText}>{chat.name.charAt(0)}</Text>
              </View>

              <View style={[styles.chatInfo, { borderBottomColor: colors.border }]}>
                <View style={styles.chatHeader}>
                  <Text style={[styles.chatName, { color: colors.text }, chat.unread > 0 && { color: colors.text, fontWeight: 'bold' }]}>{chat.name}</Text>
                  <Text style={[styles.chatTime, { color: colors.textSecondary }, chat.unread > 0 && { color: colors.primary, fontWeight: 'bold' }]}>{chat.time}</Text>
                </View>
                
                <View style={styles.chatFooter}>
                  <Text 
                    style={[styles.chatMessage, { color: colors.textSecondary }, chat.unread > 0 && { color: colors.text, fontWeight: 'bold' }]} 
                    numberOfLines={1}
                  >
                    {chat.message}
                  </Text>
                  {chat.unread > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{chat.unread}</Text>
                    </View>
                  )}
                </View>
              </View>

            </TouchableOpacity>
          ))}
        </ScrollView>

      </View>
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
    marginTop: 10,
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  composeBtn: {
    padding: 8,
    backgroundColor: '#F0F0FF',
    borderRadius: 20,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 15,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatMessage: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  unreadText: {
    fontWeight: 'bold',
    color: '#000',
  },
  unreadTime: {
    color: '#6C63FF',
    fontWeight: 'bold',
  },
  unreadMessage: {
    fontWeight: 'bold',
    color: '#333',
  },
  badge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
