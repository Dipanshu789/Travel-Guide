import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Image, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../config/ThemeContext';
import { auth } from '../../config/firebase';

const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

export default function ChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { colors, mode } = useTheme();
  const isDark = mode === 'dark';
  
  const { chatId, chatName, avatarColor = '#6C63FF', recipientAvatar: initialRecipientAvatar } = route.params || { chatName: 'Unknown' };

  const isGroupChat = chatId?.startsWith('group_') || false;

  const [recipientAvatar, setRecipientAvatar] = useState(initialRecipientAvatar || null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hey there! How are you?', sender: 'them', time: '10:00 AM', senderName: 'Alex' },
    { id: '2', text: 'I am doing great! Just planning my next trip.', sender: 'me', time: '10:02 AM', senderName: 'Me' },
  ]);

  // WhatsApp-style modal state
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [activeTheme, setActiveTheme] = useState('emerald'); // 'emerald', 'blue', 'orange', 'purple', 'dark'
  const [groupCustomName, setGroupCustomName] = useState(chatName);
  const [groupCustomImage, setGroupCustomImage] = useState(initialRecipientAvatar || DEFAULT_AVATAR);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [profileBio, setProfileBio] = useState('Hey there! I am using Travel Guide. Exploring the world one step at a time! 🌍✈️');
  const [groupMembers, setGroupMembers] = useState<any[]>([]);

  const flatListRef = useRef<FlatList>(null);

  React.useEffect(() => {
    const fetchMessages = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser && chatId) {
          const token = await currentUser.getIdToken();
          const res = await fetch(`${BACKEND_URL}/api/user/messages?chatWith=${chatId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.messages && data.messages.length > 0) {
              setMessages(data.messages);
            }
            if (data.recipientAvatar) {
              setRecipientAvatar(data.recipientAvatar);
              setGroupCustomImage(data.recipientAvatar);
            }
          }

          // Fetch user profile bio or group members
          if (isGroupChat) {
            const usersRes = await fetch(`${BACKEND_URL}/api/user/messages`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (usersRes.ok) {
              const usersData = await usersRes.json();
              if (usersData.chats) {
                const members = usersData.chats.filter((c: any) => !c.id.startsWith('group_'));
                setGroupMembers(members);
              }
            }
          } else {
            const profileRes = await fetch(`${BACKEND_URL}/api/user/public-profile?uid=${chatId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              if (profileData.profile && profileData.profile.bio) {
                setProfileBio(profileData.profile.bio);
              }
            }
          }
        }
      } catch (e) {
        console.error('Error fetching chat info:', e);
      }
    };
    fetchMessages();
  }, [chatId, isGroupChat]);

  // Check if route params contain a shared post
  React.useEffect(() => {
    if (route.params?.sharedPost) {
      const post = route.params.sharedPost;
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: `Check out this place: ${post.title}!`,
        sender: 'me',
        time: 'Just now',
        sharedPost: post
      } as any]);
    }
  }, [route.params?.sharedPost]);

  const sendMessage = async () => {
    if (message.trim().length === 0) return;
    const msgText = message;
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: msgText,
      sender: 'me',
      time: 'Just now',
      senderName: auth.currentUser?.displayName || 'Me'
    }]);
    setMessage('');
    
    // Scroll to bottom
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    // Store message and send notification to recipient
    try {
      const currentUser = auth.currentUser;
      if (currentUser && chatId) {
        const token = await currentUser.getIdToken();
        
        // Store message in DB
        await fetch(`${BACKEND_URL}/api/user/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            recipientId: chatId,
            recipientName: isGroupChat ? groupCustomName : chatName,
            message: msgText
          })
        });

        // Send notification
        await fetch(`${BACKEND_URL}/api/user/notifications`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            recipientId: chatId,
            message: msgText
          })
        });
      }
    } catch (err) {
      console.error('Failed to send message/notification:', err);
    }
  };

  const getThemeColors = () => {
    switch (activeTheme) {
      case 'blue':
        return { bubble: '#007AFF', background: '#E6F2FF', header: '#0051A8', text: '#FFF' };
      case 'orange':
        return { bubble: '#FF7043', background: '#FBE9E7', header: '#D84315', text: '#FFF' };
      case 'purple':
        return { bubble: '#8E24AA', background: '#F3E5F5', header: '#4A148C', text: '#FFF' };
      case 'dark':
        return { bubble: '#37474F', background: '#102027', header: '#263238', text: '#FFF' };
      case 'emerald':
      default:
        return { bubble: '#075E54', background: '#DCF8C6', header: '#128C7E', text: '#FFF' };
    }
  };

  const currentTheme = getThemeColors();

  const handleSaveGroupEdits = () => {
    setRecipientAvatar(groupCustomImage);
    setIsEditingGroup(false);
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender === 'me';
    
    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperThem]}>
        {!isMe && (
          <Image source={{ uri: recipientAvatar || DEFAULT_AVATAR }} style={styles.smallAvatar} />
        )}
        
        <View style={[
          styles.messageBubble, 
          isMe ? { backgroundColor: currentTheme.bubble } : { backgroundColor: isDark ? '#333' : '#FFF' }
        ]}>
          {isGroupChat && !isMe && (
            <Text style={[styles.senderNameText, { color: currentTheme.header }]}>
              {item.senderName || 'Member'}
            </Text>
          )}
          {item.sharedPost && (
            <View style={styles.sharedPostContainer}>
               <Image source={{ uri: item.sharedPost.image }} style={styles.sharedPostImage} />
               <Text style={[styles.sharedPostTitle, isMe ? { color: '#FFF' } : { color: colors.text }]} numberOfLines={1}>
                 {item.sharedPost.title}
               </Text>
            </View>
          )}
          <Text style={[styles.messageText, isMe ? { color: '#FFF' } : { color: colors.text }]}>
            {item.text}
          </Text>
          <Text style={[styles.messageTime, isMe ? { color: 'rgba(255,255,255,0.7)' } : { color: colors.textSecondary }]}>
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: currentTheme.header, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setInfoModalVisible(true)} style={styles.headerTitleContainer}>
          <Image source={{ uri: recipientAvatar || DEFAULT_AVATAR }} style={styles.headerAvatar} />
          
          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, { color: '#FFF' }]}>{isGroupChat ? groupCustomName : chatName}</Text>
            <Text style={[styles.headerStatus, { color: '#E0E0E0' }]}>
              {isGroupChat ? 'Tap here for group info' : 'Tap here for contact info'}
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="call-outline" size={22} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="videocam-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Chat Area */}
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0' }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
          />
          
          <TouchableOpacity 
            style={[styles.sendButton, message.trim().length > 0 ? { backgroundColor: currentTheme.bubble } : { backgroundColor: colors.border }]}
            onPress={sendMessage}
            disabled={message.trim().length === 0}
          >
            <Ionicons name="send" size={16} color="#FFF" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* WhatsApp-Style Profile / Group Info Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={infoModalVisible}
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isGroupChat ? 'Group Info' : 'Contact Info'}
              </Text>
              <TouchableOpacity onPress={() => setInfoModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
              <View style={styles.infoTopContainer}>
                <Image source={{ uri: recipientAvatar || DEFAULT_AVATAR }} style={styles.largeAvatar} />
                <Text style={[styles.infoName, { color: colors.text }]}>
                  {isGroupChat ? groupCustomName : chatName}
                </Text>
                <Text style={[styles.infoStatus, { color: colors.textSecondary }]}>
                  {isGroupChat ? `Group · ${groupMembers.length} participants` : 'Online'}
                </Text>
              </View>

              {/* Edit Group Info Section */}
              {isGroupChat && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Group Customization</Text>
                    <TouchableOpacity onPress={() => setIsEditingGroup(!isEditingGroup)}>
                      <Text style={[styles.editBtnText, { color: currentTheme.header }]}>
                        {isEditingGroup ? 'Cancel' : 'Edit'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {isEditingGroup ? (
                    <View style={styles.editGroupForm}>
                      <Text style={[styles.formLabel, { color: colors.text }]}>Group Name</Text>
                      <TextInput
                        style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                        value={groupCustomName}
                        onChangeText={setGroupCustomName}
                      />
                      <Text style={[styles.formLabel, { color: colors.text }]}>Group Image URL</Text>
                      <TextInput
                        style={[styles.formInput, { color: colors.text, borderColor: colors.border }]}
                        value={groupCustomImage}
                        onChangeText={setGroupCustomImage}
                      />
                      <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: currentTheme.header }]}
                        onPress={handleSaveGroupEdits}
                      >
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                      You can change the group subject, icon, and chat theme at any time.
                    </Text>
                  )}
                </View>
              )}

              {/* Description / Bio Section */}
              {!isGroupChat && (
                <View style={styles.sectionContainer}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
                  <Text style={[styles.bioText, { color: colors.text }]}>{profileBio}</Text>
                </View>
              )}

              {/* Theme Customization Section */}
              <View style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Chat Theme</Text>
                <View style={styles.themeSelectorContainer}>
                  {[
                    { id: 'emerald', label: 'Emerald', color: '#075E54' },
                    { id: 'blue', label: 'Ocean', color: '#007AFF' },
                    { id: 'orange', label: 'Sunset', color: '#FF7043' },
                    { id: 'purple', label: 'Amethyst', color: '#8E24AA' },
                    { id: 'dark', label: 'Shadow', color: '#37474F' },
                  ].map(t => (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        styles.themeOption,
                        { backgroundColor: t.color },
                        activeTheme === t.id && styles.themeOptionActive
                      ]}
                      onPress={() => setActiveTheme(t.id)}
                    >
                      <Text style={styles.themeOptionText}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Group Members Section */}
              {isGroupChat && (
                <View style={styles.sectionContainer}>
                  <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 15 }]}>
                    Participants ({groupMembers.length})
                  </Text>
                  {groupMembers.map((m: any) => (
                    <View key={m.id} style={styles.memberItem}>
                      <Image source={{ uri: m.avatar || DEFAULT_AVATAR }} style={styles.memberItemAvatar} />
                      <View style={styles.memberItemInfo}>
                        <Text style={[styles.memberItemName, { color: colors.text }]}>{m.name}</Text>
                        <Text style={[styles.memberItemSub, { color: colors.textSecondary }]}>
                          Active Traveler
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    zIndex: 10,
  },
  backButton: { marginRight: 15 },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 42, height: 42,
    borderRadius: 21,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  headerInfo: { flex: 1, justifyContent: 'center' },
  headerName: { fontSize: 17, fontWeight: 'bold' },
  headerStatus: { fontSize: 12, marginTop: 2 },
  headerIcon: { marginLeft: 15 },
  keyboardView: { flex: 1 },
  chatContainer: { padding: 15, paddingBottom: 20 },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 15,
    maxWidth: '85%',
  },
  messageWrapperMe: { alignSelf: 'flex-end' },
  messageWrapperThem: { alignSelf: 'flex-start' },
  smallAvatar: {
    width: 28, height: 28,
    borderRadius: 14,
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '100%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  senderNameText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageTime: { fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
  sharedPostContainer: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
    width: 200,
  },
  sharedPostImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 6,
  },
  sharedPostTitle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  attachButton: { padding: 8 },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    minHeight: 40,
    fontSize: 15,
    marginHorizontal: 8,
  },
  sendButton: {
    width: 40, height: 40,
    borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  modalScrollContent: {
    paddingBottom: 30,
  },
  infoTopContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  largeAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#075E54',
  },
  infoName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  infoStatus: {
    fontSize: 15,
  },
  sectionContainer: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  editBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  editGroupForm: {
    marginTop: 5,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 5,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
  },
  themeSelectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  themeOption: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionActive: {
    borderColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  themeOptionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  memberItemAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 15,
  },
  memberItemInfo: {
    flex: 1,
  },
  memberItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  memberItemSub: {
    fontSize: 13,
  },
});
