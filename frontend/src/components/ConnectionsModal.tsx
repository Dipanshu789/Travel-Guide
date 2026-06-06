import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, Image, ActivityIndicator, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/ThemeContext';
import { auth } from '../config/firebase';

interface ConnectionsModalProps {
  visible: boolean;
  initialTab: 'followers' | 'following';
  onClose: () => void;
  onUserSelect: (uid: string) => void;
}

const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');

const ConnectionsModal: React.FC<ConnectionsModalProps> = ({ visible, initialTab, onClose, onUserSelect }) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
      fetchConnections(initialTab);
    } else {
      setSearchQuery('');
      setSearchResults(null);
    }
  }, [visible, initialTab]);

  const fetchConnections = async (tab: 'followers' | 'following') => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/api/user/connections?type=${tab}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data[tab] || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults(null);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      searchGlobalUsers(searchQuery);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const searchGlobalUsers = async (query: string) => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/api/user/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'follow' | 'unfollow' | 'remove_follower', targetUid: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/api/user/connections`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, targetUid })
      });

      if (res.ok) {
        if (action === 'remove_follower') {
          setUsers(prev => prev.filter(u => u.uid !== targetUid));
        } else if (action === 'unfollow') {
          if (activeTab === 'following') {
            setUsers(prev => prev.filter(u => u.uid !== targetUid));
          }
        }
        // If it's follow, it's usually handled on the public profile or search
      } else {
        Alert.alert("Error", "Action failed");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isSearch = searchResults !== null;
    let actionBtnText = '';
    let actionBtnStyle: any = { backgroundColor: colors.card, borderColor: colors.border };
    let actionBtnTextColor = colors.text;
    let onPressAction = () => {};

    if (isSearch) {
      // In global search, we don't know follow status unless we fetch it. We'll direct to profile.
      actionBtnText = 'View Profile';
      onPressAction = () => onUserSelect(item.uid);
    } else if (activeTab === 'followers') {
      actionBtnText = 'Remove';
      onPressAction = () => handleAction('remove_follower', item.uid);
    } else if (activeTab === 'following') {
      actionBtnText = 'Following';
      onPressAction = () => handleAction('unfollow', item.uid);
    }

    return (
      <TouchableOpacity style={[styles.userRow, { borderBottomColor: colors.border }]} onPress={() => onUserSelect(item.uid)}>
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Ionicons name="person" size={20} color="#FFF" />
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>{item.display_name}</Text>
          <Text style={[styles.userHandle, { color: colors.textSecondary }]}>@{item.display_name.replace(/\s+/g, '').toLowerCase()}</Text>
        </View>
        <TouchableOpacity style={[styles.actionBtn, actionBtnStyle]} onPress={onPressAction}>
          <Text style={[styles.actionBtnText, { color: actionBtnTextColor }]}>{actionBtnText}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Connections</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsRow}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'followers' && { borderBottomColor: colors.text }]} 
            onPress={() => { setActiveTab('followers'); setSearchQuery(''); fetchConnections('followers'); }}
          >
            <Text style={[styles.tabText, { color: activeTab === 'followers' ? colors.text : colors.textSecondary }]}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'following' && { borderBottomColor: colors.text }]} 
            onPress={() => { setActiveTab('following'); setSearchQuery(''); fetchConnections('following'); }}
          >
            <Text style={[styles.tabText, { color: activeTab === 'following' ? colors.text : colors.textSecondary }]}>Following</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.iconBackground }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text, ...(React.Component.prototype && { outlineStyle: 'none' } as any) }]}
              placeholder="Search users..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {loading && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />}
        
        {!loading && (
          <FlatList
            data={searchResults !== null ? searchResults : users}
            keyExtractor={(item) => item.uid}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 20 }}>No users found.</Text>}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  closeBtn: { padding: 5 },
  tabsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.2)' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontWeight: '600', fontSize: 16 },
  searchContainer: { padding: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 10, height: 40 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, height: '100%' },
  listContent: { paddingHorizontal: 15, paddingBottom: 20 },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  userInfo: { flex: 1, marginLeft: 15 },
  userName: { fontWeight: 'bold', fontSize: 16 },
  userHandle: { fontSize: 14, marginTop: 2 },
  actionBtn: { borderWidth: 1, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { fontWeight: '600', fontSize: 13 }
});

export default ConnectionsModal;
