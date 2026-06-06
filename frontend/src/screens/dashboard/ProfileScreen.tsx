import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Image, FlatList, Modal, Dimensions, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../config/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { useTheme } from '../../config/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import ImageEditorModal from '../../components/ImageEditorModal';
import StoryViewer from '../../components/StoryViewer';
import PostDetailModal from '../../components/PostDetailModal';
import ConnectionsModal from '../../components/ConnectionsModal';
import PublicProfileModal from '../../components/PublicProfileModal';

export default function ProfileScreen({ navigation }: any) {
  const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const [profile, setProfile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { colors, mode, toggleTheme } = useTheme();

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

  // Edit Profile States
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');

  const [editorVisible, setEditorVisible] = useState(false);
  const [isEditorForStory, setIsEditorForStory] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedBase64, setSelectedBase64] = useState<string | null>(null);

  const [activeStory, setActiveStory] = useState<any>(null);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);

  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [postDetailVisible, setPostDetailVisible] = useState(false);

  const [connectionsVisible, setConnectionsVisible] = useState(false);
  const [connectionsInitialTab, setConnectionsInitialTab] = useState<'followers' | 'following'>('followers');

  const [publicProfileVisible, setPublicProfileVisible] = useState(false);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const fetchProfileAndPosts = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigation.replace('Auth');
        return;
      }

      const token = await currentUser.getIdToken();
      
      // Fetch Profile
      const profileRes = await fetch(`${BACKEND_URL}/api/user/profile`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.profile);
        setEditDisplayName(data.profile?.displayName || '');
        setEditBio(data.profile?.bio || '');
        setEditPhotoURL(data.profile?.photoURL || '');
      }

      // Fetch Posts
      const postsRes = await fetch(`${BACKEND_URL}/api/user/posts`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (postsRes.ok) {
        const pData = await postsRes.json();
        setUserPosts(pData.posts || []);
      }

      // Fetch own story to show ring on avatar
      const storiesRes = await fetch(`${BACKEND_URL}/api/user/stories`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (storiesRes.ok) {
        const sData = await storiesRes.json();
        const ownStory = sData.stories?.find((s: any) => s.userId === currentUser.uid);
        if (ownStory) {
          setActiveStory(ownStory);
        } else {
          setActiveStory(null);
        }
      }

      // Fetch connection counts
      const connRes = await fetch(`${BACKEND_URL}/api/user/connections`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (connRes.ok) {
        const cData = await connRes.json();
        setFollowersCount(cData.followersCount || 0);
        setFollowingCount(cData.followingCount || 0);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndPosts();
  }, [navigation]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const uploadImageToCloudinary = async (base64Image: string, folder: string) => {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch(`${BACKEND_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: `data:image/jpeg;base64,${base64Image}`,
        folder
      })
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.url;
  };

  const handleEditProfile = async () => {
    setActionLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/api/user/profile`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          displayName: editDisplayName,
          bio: editBio,
          photoURL: editPhotoURL
        })
      });

      if (res.ok) {
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { 
            displayName: editDisplayName,
            photoURL: editPhotoURL
          });
        }
        setProfile({ ...profile, displayName: editDisplayName, bio: editBio, photoURL: editPhotoURL });
        setEditVisible(false);
      } else {
        Alert.alert("Error", "Failed to update profile");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const pickProfileImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setActionLoading(true);
      try {
        const uid = auth.currentUser?.uid;
        const url = await uploadImageToCloudinary(result.assets[0].base64, 'avatars');
        setEditPhotoURL(url);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to upload image");
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleCreatePostClick = async () => {
    setCreateVisible(false);
    setIsEditorForStory(false);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setSelectedImage(result.assets[0].uri);
      setSelectedBase64(result.assets[0].base64);
      setEditorVisible(true);
    }
  };

  const handleCreateStoryClick = async () => {
    setCreateVisible(false);
    setIsEditorForStory(true);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setSelectedImage(result.assets[0].uri);
      setSelectedBase64(result.assets[0].base64);
      setEditorVisible(true);
    }
  };

  const uploadMedia = async (brightness: number, contrast: number, saturation: number, caption: string) => {
    if (!selectedBase64) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      
      // 1. Upload to Cloudinary with filters
      const uploadRes = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: `data:image/jpeg;base64,${selectedBase64}`,
          folder: isEditorForStory ? 'stories' : 'posts',
          brightness, contrast, saturation
        })
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error);

      // 2. Save to NeonDB
      const endpoint = isEditorForStory ? `${BACKEND_URL}/api/user/stories` : `${BACKEND_URL}/api/user/posts`;
      const bodyPayload = isEditorForStory ? { image: uploadData.url } : { image: uploadData.url, caption };

      const saveRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      if (saveRes.ok) {
        fetchProfileAndPosts();
      } else {
        const saveData = await saveRes.json();
        throw new Error(saveData.error || 'Failed to save to database');
      }
    } catch (err: any) {
      console.error('Post upload failed:', err);
      Alert.alert("Upload Error", err.message || "Failed to upload.");
      throw err;
    }
  };

  const renderPost = ({ item }: any) => {
    const size = Dimensions.get('window').width / 3;
    return (
      <TouchableOpacity 
        style={{ width: size, height: size, padding: 1 }}
        onPress={() => {
          setSelectedPost({ ...item, username: profile?.displayName || auth.currentUser?.displayName, userAvatar: profile?.photoURL });
          setPostDetailVisible(true);
        }}
      >
        <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%', backgroundColor: colors.iconBackground }} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const displayName = profile?.displayName || auth.currentUser?.email?.split('@')[0] || 'Traveler';
  const displayEmail = profile?.email || auth.currentUser?.email || 'No email';
  const photoURL = profile?.photoURL || auth.currentUser?.photoURL;
  const bio = profile?.bio || 'Wandering the globe. 🌍✈️';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerUsername, { color: colors.text }]}>{displayName}</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => setCreateVisible(true)} style={styles.headerIconBtn}>
            <Ionicons name="add-circle-outline" size={28} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.headerIconBtn}>
            <Ionicons name="menu-outline" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfoContainer}>
        <View style={styles.statsRow}>
          <TouchableOpacity 
            onPress={() => {
              if (activeStory) setStoryViewerVisible(true);
              else pickProfileImage(); // optional fallback if they want to upload
            }}
            style={activeStory ? styles.storyAvatarWrapperActive : null}
          >
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Ionicons name="person" size={40} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
          
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{userPosts.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Posts</Text>
            </View>
            <TouchableOpacity 
              style={styles.statBox}
              onPress={() => { setConnectionsInitialTab('followers'); setConnectionsVisible(true); }}
            >
              <Text style={[styles.statNumber, { color: colors.text }]}>{followersCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statBox}
              onPress={() => { setConnectionsInitialTab('following'); setConnectionsVisible(true); }}
            >
              <Text style={[styles.statNumber, { color: colors.text }]}>{followingCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Following</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bioContainer}>
          <Text style={[styles.bioName, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.bioText, { color: colors.text }]}>{bio}</Text>
          <Text style={[styles.bioEmail, { color: colors.primary }]}>{displayEmail}</Text>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setEditVisible(true)}
          >
            <Text style={[styles.actionBtnText, { color: colors.text }]}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.actionBtnText, { color: colors.text }]}>Share Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Grid view of own posts */}
      {actionLoading && <ActivityIndicator size="small" color={colors.primary} style={{ margin: 10 }} />}
      
      <View style={styles.gridContainer}>
        <FlatList
          data={userPosts}
          renderItem={renderPost}
          keyExtractor={item => item.id}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 50, color: colors.textSecondary }}>No posts yet.</Text>
          }
        />
      </View>

      {/* Settings Modal */}
      <Modal visible={settingsVisible} animationType="slide" transparent={true} onRequestClose={() => setSettingsVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Settings</Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalRow} onPress={() => { setSettingsVisible(false); setEditVisible(true); }}>
              <Ionicons name="person-outline" size={24} color={colors.text} style={styles.icon} />
              <Text style={[styles.modalRowText, { color: colors.text }]}>Manage Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalRow} onPress={() => { toggleTheme(); setSettingsVisible(false); }}>
              <Ionicons name={mode === 'dark' ? 'sunny' : 'moon'} size={24} color={colors.text} style={styles.icon} />
              <Text style={[styles.modalRowText, { color: colors.text }]}>
                {mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalRow} onPress={() => { handleLogout(); setSettingsVisible(false); }}>
              <Ionicons name="log-out-outline" size={24} color={colors.error} style={styles.icon} />
              <Text style={[styles.modalRowText, { color: colors.error }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Modal */}
      <Modal visible={createVisible} animationType="slide" transparent={true} onRequestClose={() => setCreateVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create</Text>
              <TouchableOpacity onPress={() => setCreateVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalRow} onPress={handleCreatePostClick}>
              <Ionicons name="grid-outline" size={24} color={colors.text} style={styles.icon} />
              <Text style={[styles.modalRowText, { color: colors.text }]}>Post Photo/Video</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalRow} onPress={handleCreateStoryClick}>
              <Ionicons name="add-circle-outline" size={24} color={colors.text} style={styles.icon} />
              <Text style={[styles.modalRowText, { color: colors.text }]}>Story</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={editVisible} animationType="slide" transparent={true} onRequestClose={() => setEditVisible(false)}>
        <View style={[styles.fullModal, { backgroundColor: colors.background }]}>
          <View style={styles.editHeader}>
            <TouchableOpacity onPress={() => setEditVisible(false)}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.editTitle, { color: colors.text }]}>Edit Profile</Text>
            <TouchableOpacity onPress={handleEditProfile} disabled={actionLoading}>
              {actionLoading ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="checkmark" size={28} color={colors.primary} />}
            </TouchableOpacity>
          </View>

          <View style={styles.editAvatarContainer}>
            {editPhotoURL ? (
              <Image source={{ uri: editPhotoURL }} style={styles.avatarLarge} />
            ) : (
              <View style={[styles.avatarLarge, { backgroundColor: colors.primary }]}>
                <Ionicons name="person" size={50} color="#FFF" />
              </View>
            )}
            <TouchableOpacity onPress={pickProfileImage}>
              <Text style={[styles.changePhotoText, { color: colors.primary }]}>Change profile photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.editForm}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Name</Text>
            <TextInput 
              style={[styles.inputField, { color: colors.text, borderBottomColor: colors.border }]}
              value={editDisplayName}
              onChangeText={setEditDisplayName}
              placeholder="Your Name"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 20 }]}>Bio</Text>
            <TextInput 
              style={[styles.inputField, { color: colors.text, borderBottomColor: colors.border }]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Write a bio..."
              placeholderTextColor={colors.textSecondary}
              multiline
            />
          </View>
        </View>
      </Modal>

      <ImageEditorModal
        visible={editorVisible}
        imageUri={selectedImage}
        isStory={isEditorForStory}
        onClose={() => setEditorVisible(false)}
        onUpload={uploadMedia}
      />

      <StoryViewer
        visible={storyViewerVisible}
        story={activeStory}
        onClose={() => setStoryViewerVisible(false)}
      />

      <PostDetailModal
        visible={postDetailVisible}
        post={selectedPost}
        onClose={() => setPostDetailVisible(false)}
      />

      <ConnectionsModal
        visible={connectionsVisible}
        initialTab={connectionsInitialTab}
        onClose={() => setConnectionsVisible(false)}
        onUserSelect={(uid) => {
          setSelectedUid(uid);
          setConnectionsVisible(false);
          setTimeout(() => {
            setPublicProfileVisible(true);
          }, 500);
        }}
      />

      <PublicProfileModal
        visible={publicProfileVisible}
        uid={selectedUid}
        onClose={() => setPublicProfileVisible(false)}
        onMessage={(user) => {
          navigation.navigate('Messages', { screen: 'ChatDetail', params: { user } });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerUsername: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    marginLeft: 15,
  },
  profileInfoContainer: {
    padding: 15,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storyAvatarWrapperActive: {
    borderWidth: 3,
    borderColor: '#6C63FF',
    borderRadius: 43,
    padding: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    marginLeft: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 13,
  },
  bioContainer: {
    marginTop: 15,
  },
  bioName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  bioText: {
    fontSize: 14,
    marginTop: 2,
  },
  bioEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: 15,
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  actionBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  gridContainer: {
    flex: 1,
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  modalRowText: {
    fontSize: 16,
  },
  icon: {
    marginRight: 15,
  },
  fullModal: {
    flex: 1,
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  editTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  editAvatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  changePhotoText: {
    fontSize: 16,
    fontWeight: '600',
  },
  editForm: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  inputField: {
    fontSize: 16,
    borderBottomWidth: 1,
    paddingVertical: 8,
    ...(React.Component.prototype && { outlineStyle: 'none' } as any),
  },
});
