import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../config/ThemeContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { auth } from '../../config/firebase';

const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

export default function MessageScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const defaultChats = [
    { id: '1', name: 'Travel Support', message: 'Your flight to Paris is confirmed! ✈️', time: '10:42 AM', unread: 2, avatarColor: '#6C63FF', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' },
    { id: '2', name: 'Local Guide Marco', message: 'See you at the Colosseum tomorrow at 9.', time: 'Yesterday', unread: 0, avatarColor: '#4ECDC4', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150' },
    { id: '3', name: 'Hotel Bellevue', message: 'Yes, we can arrange an early check-in.', time: 'Monday', unread: 0, avatarColor: '#FF6B6B', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150' },
    { id: '4', name: 'Group: Bali Trippers', message: 'Sarah: Did anyone pack sunscreen?', time: 'Sunday', unread: 5, avatarColor: '#FFD700', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150' },
  ];

  const [activeChats, setActiveChats] = useState<any[]>(defaultChats);
  const [modalVisible, setModalVisible] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupImage, setGroupImage] = useState('https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=500&q=80');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetchRecentChats = async () => {
        try {
          const currentUser = auth.currentUser;
          if (currentUser) {
            const token = await currentUser.getIdToken();
            const res = await fetch(`${BACKEND_URL}/api/user/messages`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              if (data.chats && data.chats.length > 0) {
                setActiveChats([...data.chats, ...defaultChats]);
              } else {
                setActiveChats(defaultChats);
              }
            }
          }
        } catch (e) {
          console.error('Error fetching recent chats:', e);
        }
      };
      fetchRecentChats();
    }, [])
  );

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    const finalImage = groupImage.trim() || DEFAULT_AVATAR;
    const groupId = 'group_' + Date.now() + '|' + encodeURIComponent(finalImage);
    const finalGroupName = groupName.trim();

    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        await fetch(`${BACKEND_URL}/api/user/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            recipientId: groupId,
            recipientName: finalGroupName,
            message: `Group created by ${currentUser.displayName || 'Traveler'}`
          })
        });
      }
    } catch (e) {
      console.error('Error creating group:', e);
    }

    const newGroupChat = {
      id: groupId,
      name: finalGroupName,
      message: `Group created with ${selectedMembers.length} members`,
      time: 'Just now',
      unread: 0,
      avatarColor: '#FFD700',
      avatar: finalImage
    };

    setActiveChats(prev => [newGroupChat, ...prev]);
    setModalVisible(false);
    setGroupName('');
    setSelectedMembers([]);

    navigation.navigate('Chat', { 
      chatId: groupId, 
      chatName: finalGroupName, 
      avatarColor: '#FFD700', 
      recipientAvatar: finalImage 
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
          <TouchableOpacity 
            style={[styles.composeBtn, { backgroundColor: colors.iconBackground }]}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Chat List */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {activeChats.map((chat) => (
            <TouchableOpacity 
              key={chat.id} 
              style={styles.chatRow}
              onPress={() => navigation.navigate('Chat', { chatId: chat.id, chatName: chat.name, avatarColor: chat.avatarColor, recipientAvatar: chat.avatar || DEFAULT_AVATAR })}
            >
              
              <Image source={{ uri: chat.avatar || DEFAULT_AVATAR }} style={styles.avatar} />

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

        {/* Group Creation Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Group</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: colors.text }]}>Group Name</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="Enter group name..."
                placeholderTextColor={colors.textSecondary}
                value={groupName}
                onChangeText={setGroupName}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Group Profile Picture URL</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="Image URL..."
                placeholderTextColor={colors.textSecondary}
                value={groupImage}
                onChangeText={setGroupImage}
              />

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: 10, marginBottom: 10 }]}>
                Add Members ({selectedMembers.length} selected)
              </Text>
              
              <ScrollView style={styles.membersScrollView}>
                {activeChats.filter(c => !c.id.startsWith('group_')).map(member => {
                  const isSelected = selectedMembers.includes(member.id);
                  return (
                    <TouchableOpacity
                      key={member.id}
                      style={[styles.memberRow, { borderBottomColor: colors.border }]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                        } else {
                          setSelectedMembers([...selectedMembers, member.id]);
                        }
                      }}
                    >
                      <Image source={{ uri: member.avatar || DEFAULT_AVATAR }} style={styles.memberAvatar} />
                      <Text style={[styles.memberName, { color: colors.text }]}>{member.name}</Text>
                      <View style={[styles.checkbox, isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                        {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={[styles.createGroupBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreateGroup}
              >
                <Text style={styles.createGroupBtnText}>Create Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  membersScrollView: {
    maxHeight: 250,
    marginBottom: 20,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memberName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createGroupBtn: {
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  createGroupBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
