import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/ThemeContext';
import { auth } from '../config/firebase';

interface PublicProfileModalProps {
  visible: boolean;
  uid: string | null;
  onClose: () => void;
  onMessage?: (user: any) => void;
}

const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');

const PublicProfileModal: React.FC<PublicProfileModalProps> = ({ visible, uid, onClose, onMessage }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (visible && uid) {
      fetchProfile();
    } else {
      setProfileData(null);
      setLoading(true);
    }
  }, [visible, uid]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/api/user/public-profile?uid=${uid}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
      } else {
        Alert.alert("Error", "Could not load profile");
        onClose();
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Network error");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profileData) return;
    setActionLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const action = profileData.isFollowing ? 'unfollow' : 'follow';
      const res = await fetch(`${BACKEND_URL}/api/user/connections`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, targetUid: uid })
      });

      if (res.ok) {
        setProfileData((prev: any) => ({
          ...prev,
          isFollowing: !prev.isFollowing,
          stats: {
            ...prev.stats,
            followers: prev.isFollowing ? prev.stats.followers - 1 : prev.stats.followers + 1
          }
        }));
      } else {
        Alert.alert("Error", "Could not update follow status");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="chevron-down" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {profileData?.profile?.displayName || 'Profile'}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {loading || !profileData ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.profileHeader}>
              {profileData.profile.photoURL ? (
                <Image source={{ uri: profileData.profile.photoURL }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Ionicons name="person" size={40} color="#FFF" />
                </View>
              )}

              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: colors.text }]}>{profileData.stats.posts}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Posts</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: colors.text }]}>{profileData.stats.followers}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: colors.text }]}>{profileData.stats.following}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Following</Text>
                </View>
              </View>
            </View>

            <View style={styles.bioContainer}>
              <Text style={[styles.bioName, { color: colors.text }]}>{profileData.profile.displayName}</Text>
              <Text style={[styles.bioText, { color: colors.text }]}>{profileData.profile.bio || 'Wandering the globe. 🌍✈️'}</Text>
            </View>

            <View style={styles.actionButtonsRow}>
              {profileData.profile.uid !== auth.currentUser?.uid && (
                <>
                  <TouchableOpacity 
                    style={[
                      styles.actionBtn, 
                      { 
                        backgroundColor: profileData.isFollowing ? colors.card : colors.primary,
                        borderColor: profileData.isFollowing ? colors.border : colors.primary
                      }
                    ]}
                    onPress={handleFollowToggle}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color={profileData.isFollowing ? colors.text : '#FFF'} size="small" />
                    ) : (
                      <Text style={[styles.actionBtnText, { color: profileData.isFollowing ? colors.text : '#FFF' }]}>
                        {profileData.isFollowing ? 'Following' : 'Follow'}
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => {
                      onClose();
                      if (onMessage) onMessage(profileData.profile);
                    }}
                  >
                    <Text style={[styles.actionBtnText, { color: colors.text }]}>Message</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
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
  closeBtn: { padding: 5 },
  title: { fontSize: 18, fontWeight: 'bold' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 15 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  statsContainer: { flexDirection: 'row', flex: 1, justifyContent: 'space-around', marginLeft: 20 },
  statBox: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 13 },
  bioContainer: { marginTop: 15 },
  bioName: { fontWeight: 'bold', fontSize: 14 },
  bioText: { fontSize: 14, marginTop: 2 },
  actionButtonsRow: { flexDirection: 'row', marginTop: 15, justifyContent: 'space-between' },
  actionBtn: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginHorizontal: 5 },
  actionBtnText: { fontWeight: '600', fontSize: 14 }
});

export default PublicProfileModal;
