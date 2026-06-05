import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../config/firebase';
import Animated, { FadeInDown, FadeInRight, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import BudgetCompanion from '../../components/BudgetCompanion';
import ImageEditorModal from '../../components/ImageEditorModal';
import StoryViewer from '../../components/StoryViewer';
import PostDetailModal from '../../components/PostDetailModal';
import { useTheme } from '../../config/ThemeContext';
import * as ImagePicker from 'expo-image-picker';

export default function HomeScreen() {
  const { colors } = useTheme();
  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
  
  const [profile, setProfile] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchProfile = async () => {
        try {
          const token = await auth.currentUser?.getIdToken();
          const profileRes = await fetch(`${BACKEND_URL}/api/user/profile`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (profileRes.ok) {
            const data = await profileRes.json();
            setProfile(data.profile);
          }
        } catch (e) {
          console.error(e);
        }
      };
      
      if (auth.currentUser) {
        fetchProfile();
      }
    }, [])
  );

  const displayGreetingName = profile?.displayName || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Traveler';
  const displayAvatar = profile?.photoURL || auth.currentUser?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [feedTab, setFeedTab] = useState<'Recommended' | 'Following'>('Recommended');
  const [stories, setStories] = useState<any[]>([]);
  const [ownStory, setOwnStory] = useState<any>(null);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [activeStory, setActiveStory] = useState<any>(null);

  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [postDetailVisible, setPostDetailVisible] = useState(false);

  const [editorVisible, setEditorVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedBase64, setSelectedBase64] = useState<string | null>(null);

  const fetchStories = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/api/user/stories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const allStories = data.stories || [];
        const uid = auth.currentUser?.uid;
        
        // Find the user's own story
        const myStory = allStories.find((s: any) => s.userId === uid);
        setOwnStory(myStory || null);
        
        // Filter out the user's own story from the main list
        setStories(allStories.filter((s: any) => s.userId !== uid));
      }
    } catch (e) {
      console.error('Failed to fetch stories', e);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleAddStoryClick = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [9, 16], // Vertical aspect ratio for stories
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setSelectedImage(result.assets[0].uri);
      setSelectedBase64(result.assets[0].base64);
      setEditorVisible(true);
    }
  };

  const uploadStory = async (brightness: number, contrast: number, saturation: number, caption: string) => {
    if (!selectedBase64) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      
      // 1. Upload to Cloudinary with filters
      const uploadRes = await fetch(`${BACKEND_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: `data:image/jpeg;base64,${selectedBase64}`,
          folder: 'stories',
          brightness, contrast, saturation
        })
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error);

      // 2. Save to NeonDB
      const saveRes = await fetch(`${BACKEND_URL}/api/user/stories`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: uploadData.url })
      });

      if (saveRes.ok) {
        fetchStories();
      }
    } catch (err) {
      console.error('Story upload failed:', err);
      throw err;
    }
  };

  const feedData = {
    Recommended: [
      {
        id: '1',
        username: 'wanderlust_jane',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150',
        location: 'Santorini, Greece',
        postImage: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5f1?auto=format&fit=crop&q=80&w=800',
        caption: 'The sunsets here are absolutely unreal! 🌅✨',
        likes: 1240,
        comments: 89
      },
      {
        id: '2',
        username: 'travel_with_mark',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150',
        location: 'Kyoto, Japan',
        postImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=800',
        caption: 'Finding peace in the bamboo forests of Arashiyama 🎋',
        likes: 856,
        comments: 42
      }
    ],
    Following: [
      {
        id: '3',
        username: 'emily_explores',
        userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150',
        location: 'Banff, Canada',
        postImage: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&q=80&w=800',
        caption: 'Lake Louise is a dream come true! 🏔️🚣‍♀️',
        likes: 342,
        comments: 15
      }
    ]
  };

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <Animated.View style={styles.header} entering={FadeInDown.duration(800).springify()}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>Hello, {displayGreetingName}!</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Where to next?</Text>
          </View>
          <Animated.View style={bellAnimatedStyle}>
            <TouchableOpacity style={[styles.notificationBtn, { backgroundColor: colors.card }]}>
              <Ionicons name="notifications-outline" size={24} color={colors.text} />
              <View style={styles.badge} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Stories Horizontal Bar */}
        <Animated.View style={styles.storiesContainer} entering={FadeInDown.duration(800).delay(100).springify()}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
            {/* Add/View Your Story Button */}
            <TouchableOpacity 
              style={styles.storyItem} 
              onPress={() => {
                if (ownStory) {
                  setActiveStory(ownStory);
                  setStoryViewerVisible(true);
                } else {
                  handleAddStoryClick();
                }
              }}
            >
              <View style={[styles.storyAvatarWrapper, ownStory ? styles.storyAvatarWrapperActive : { borderColor: colors.border }, ownStory ? { borderColor: colors.primary } : null]}>
                <Image source={{ uri: ownStory ? (ownStory.userAvatar || displayAvatar) : displayAvatar }} style={styles.storyAvatar} />
                {!ownStory && (
                  <View style={styles.addStoryIcon}>
                    <Ionicons name="add" size={14} color="#FFF" />
                  </View>
                )}
              </View>
              <Text style={[styles.storyUsername, { color: colors.text }]} numberOfLines={1}>Your Story</Text>
            </TouchableOpacity>

            {/* Other Users' Stories */}
            {stories.map((story) => (
              <TouchableOpacity 
                key={story.id} 
                style={styles.storyItem}
                onPress={() => {
                  setActiveStory(story);
                  setStoryViewerVisible(true);
                }}
              >
                <View style={[styles.storyAvatarWrapper, styles.storyAvatarWrapperActive, { borderColor: colors.primary }]}>
                  <Image source={{ uri: story.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' }} style={styles.storyAvatar} />
                </View>
                <Text style={[styles.storyUsername, { color: colors.text }]} numberOfLines={1}>{story.userName}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Trip Planner Card */}
        <Animated.View style={[styles.plannerCard, { backgroundColor: colors.card }]} entering={FadeInDown.duration(800).delay(200).springify()}>
          <View style={styles.inputWrapper}>
            <Ionicons name="airplane-outline" size={20} color={colors.primary} style={styles.inputIcon} />
            <TextInput 
              style={[styles.plannerInput, { color: colors.text }]} 
              placeholder="From (e.g. New York)" 
              placeholderTextColor={colors.textSecondary}
              value={from}
              onChangeText={setFrom}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.inputWrapper}>
            <Ionicons name="location-outline" size={20} color="#FF6B6B" style={styles.inputIcon} />
            <TextInput 
              style={[styles.plannerInput, { color: colors.text }]} 
              placeholder="To (e.g. Paris)" 
              placeholderTextColor={colors.textSecondary}
              value={to}
              onChangeText={setTo}
            />
          </View>
          
        </Animated.View>

        {/* Categories */}
        <View style={styles.section}>
          <Animated.Text style={[styles.sectionTitle, { color: colors.text }]} entering={FadeInDown.duration(800).delay(300).springify()}>
            Categories
          </Animated.Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
            {['Flights', 'Hotels', 'Experiences', 'Cars'].map((item, index) => (
              <Animated.View key={index} entering={FadeInRight.duration(600).delay(400 + (index * 100)).springify()}>
                <TouchableOpacity style={styles.categoryItem}>
                  <View style={[styles.categoryIcon, { backgroundColor: colors.iconBackground }]}>
                    <Ionicons 
                      name={item === 'Flights' ? 'airplane' : item === 'Hotels' ? 'bed' : item === 'Experiences' ? 'compass' : 'car'} 
                      size={24} 
                      color={colors.primary} 
                    />
                  </View>
                  <Text style={[styles.categoryText, { color: colors.text }]}>{item}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        {/* Social Feed */}
        <View style={styles.feedSection}>
          <Animated.View style={[styles.feedTabs, { borderBottomColor: colors.border }]} entering={FadeInDown.duration(800).delay(500).springify()}>
            <TouchableOpacity onPress={() => setFeedTab('Recommended')} style={[styles.feedTab, feedTab === 'Recommended' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
              <Text style={[styles.feedTabText, feedTab === 'Recommended' ? { color: colors.primary, fontWeight: 'bold' } : { color: colors.textSecondary }]}>Recommended</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFeedTab('Following')} style={[styles.feedTab, feedTab === 'Following' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
              <Text style={[styles.feedTabText, feedTab === 'Following' ? { color: colors.primary, fontWeight: 'bold' } : { color: colors.textSecondary }]}>Following</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.feedList}>
            {feedData[feedTab].map((post, index) => (
              <Animated.View key={post.id} entering={FadeInDown.duration(600).delay(600 + (index * 100)).springify()} style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Post Header */}
                <View style={styles.postHeader}>
                  <View style={styles.postUserInfo}>
                    <Image source={{ uri: post.userAvatar }} style={styles.postAvatar} />
                    <View>
                      <Text style={[styles.postUsername, { color: colors.text }]}>{post.username}</Text>
                      <Text style={[styles.postLocation, { color: colors.textSecondary }]}>{post.location}</Text>
                    </View>
                  </View>
                  <TouchableOpacity>
                    <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Post Image */}
                <TouchableOpacity 
                  activeOpacity={0.9} 
                  onPress={() => {
                    setSelectedPost(post);
                    setPostDetailVisible(true);
                  }}
                >
                  <Image source={{ uri: post.postImage }} style={styles.postImage} />
                </TouchableOpacity>

                {/* Post Actions */}
                <View style={styles.postActions}>
                  <View style={styles.postActionGroup}>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Ionicons name="heart-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Ionicons name="paper-plane-outline" size={22} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity>
                    <Ionicons name="bookmark-outline" size={22} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Post Footer */}
                <View style={styles.postFooter}>
                  <Text style={[styles.postLikes, { color: colors.text }]}>{post.likes.toLocaleString()} likes</Text>
                  <Text style={[styles.postCaptionText, { color: colors.text }]}>
                    <Text style={{ fontWeight: 'bold' }}>{post.username}</Text> {post.caption}
                  </Text>
                  <TouchableOpacity>
                    <Text style={[styles.postComments, { color: colors.textSecondary }]}>View all {post.comments} comments</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating AI Button */}
      <TouchableOpacity 
        style={[styles.floatingAiBtn, { backgroundColor: colors.primary }]} 
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="sparkles" size={28} color="#FFF" />
      </TouchableOpacity>

      <BudgetCompanion 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        initialFrom={from}
        initialTo={to}
      />

      <ImageEditorModal
        visible={editorVisible}
        imageUri={selectedImage}
        isStory={true}
        onClose={() => setEditorVisible(false)}
        onUpload={uploadStory}
      />

      {/* WhatsApp Style Story Viewer */}
      <StoryViewer
        visible={storyViewerVisible}
        story={activeStory}
        onClose={() => setStoryViewerVisible(false)}
      />

      {/* Post Detail Modal */}
      <PostDetailModal
        visible={postDetailVisible}
        post={selectedPost}
        onClose={() => setPostDetailVisible(false)}
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
  floatingAiBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
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
  feedSection: {
    marginTop: 10,
    marginBottom: 80,
  },
  feedTabs: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
  },
  feedTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  feedTabText: {
    fontSize: 16,
  },
  feedList: {
    gap: 20,
  },
  postCard: {
    borderWidth: 1,
    borderRadius: 15,
    overflow: 'hidden',
    paddingBottom: 15,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  postUsername: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  postLocation: {
    fontSize: 12,
    marginTop: 2,
  },
  postImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#333', // Placeholder color while loading
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  postActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    marginRight: 15,
  },
  postFooter: {
    paddingHorizontal: 12,
  },
  postLikes: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 6,
  },
  postCaptionText: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  postComments: {
    fontSize: 14,
    marginTop: 4,
  },
  storiesContainer: {
    marginBottom: 20,
  },
  storiesScroll: {
    paddingRight: 20,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 15,
    width: 70,
  },
  storyAvatarWrapper: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  storyAvatarWrapperActive: {
    borderWidth: 3,
  },
  storyAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  addStoryIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  storyUsername: {
    fontSize: 11,
  }
});
