import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, ScrollView, TouchableOpacity, Image, ActivityIndicator, useWindowDimensions, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../../config/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';

// Removed static Dimensions calculation
const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');

const CATEGORIES = [
  { id: 'all', name: 'For You', icon: 'compass-outline' },
  { id: 'treks', name: 'Trekking Buddies', icon: 'walk-outline' },
  { id: 'pilgrimage', name: 'Yatras', icon: 'flower-outline' },
  { id: 'festivals', name: 'Festivals', icon: 'musical-notes-outline' },
  { id: 'cab', name: 'Cab Pool', icon: 'car-outline' },
  { id: 'food', name: 'Food Walks', icon: 'restaurant-outline' },
  { id: 'local', name: 'Local Connect', icon: 'chatbubbles-outline' },
];

// Fallback dummy videos to mix in with Google Places photos to keep it visually rich
const DUMMY_VIDEOS = [
  { id: 'v1', type: 'video', category: 'all', title: 'Road Trip Vibes', location: 'On the road', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', groupSize: 'Live', isHot: true },
  { id: 'v2', type: 'video', category: 'all', title: 'Mountain View', location: 'Himalayas', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', groupSize: 'Live', isHot: true },
];

export default function SearchScreen() {
  const route = useRoute<any>();
  const { colors, mode } = useTheme();
  const isDark = mode === 'dark';
  const [searchQuery, setSearchQuery] = useState(route.params?.searchQuery || '');
  const [activeCategory, setActiveCategory] = useState('all');
  const [displayData, setDisplayData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const { width } = useWindowDimensions();
  const ITEM_SIZE = width / 3;

  const fetchExploreData = useCallback(async (query: string, category: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/explore?q=${encodeURIComponent(query)}&category=${category}`);
      const data = await response.json();
      
      let fetchedResults = data.results || [];
      
      // Inject some dummy videos to maintain the Instagram Explore feel (since Places API only gives images)
      if (fetchedResults.length > 3) {
        fetchedResults.splice(2, 0, DUMMY_VIDEOS[0]);
      }
      if (fetchedResults.length > 8) {
        fetchedResults.splice(7, 0, DUMMY_VIDEOS[1]);
      }

      // Pad results if too few to make grid look good
      if (fetchedResults.length > 0 && fetchedResults.length < 6) {
        const pad = [...fetchedResults, ...fetchedResults, ...fetchedResults].slice(0, 6);
        fetchedResults = pad.map((item, i) => ({ ...item, id: `${item.id}_${i}` }));
      }

      setDisplayData(fetchedResults);
    } catch (error) {
      console.error('Failed to fetch explore data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch when category changes
  useEffect(() => {
    fetchExploreData(searchQuery, activeCategory);
  }, [activeCategory, fetchExploreData]);

  // Handle incoming search query from navigation
  useEffect(() => {
    if (route.params?.searchQuery && route.params.searchQuery !== searchQuery) {
      setSearchQuery(route.params.searchQuery);
      fetchExploreData(route.params.searchQuery, activeCategory);
    }
  }, [route.params?.searchQuery]);

  const handleSearchSubmit = () => {
    fetchExploreData(searchQuery, activeCategory);
  };

  const GradientOverlay = ({ item }: { item: any }) => (
    <LinearGradient
      colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']}
      style={styles.overlay}
    >
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.itemMeta}>
          {item.type !== 'video' && <Ionicons name="people" size={12} color="#fff" style={{ marginRight: 4 }} />}
          <Text style={styles.itemGroupSize}>{item.groupSize}</Text>
        </View>
      </View>
    </LinearGradient>
  );

  const renderGridItem = (item: any, widthMultiplier = 1, heightMultiplier = 1) => {
    if (!item) return <View style={[styles.gridItem, { width: ITEM_SIZE * widthMultiplier, height: ITEM_SIZE * heightMultiplier }]} />;
    
    return (
      <TouchableOpacity 
        key={item.id} 
        style={[
          styles.gridItem, 
          { 
            width: ITEM_SIZE * widthMultiplier, 
            height: ITEM_SIZE * heightMultiplier,
            backgroundColor: isDark ? '#333' : '#E0E0E0',
            borderColor: isDark ? '#000' : '#FFFFFF'
          }
        ]}
        activeOpacity={0.8}
        onPress={() => setSelectedItem(item)}
      >
        {item.type === 'video' && item.videoUrl ? (
          <View style={styles.mediaContainer}>
            <Video
              source={{ uri: item.videoUrl }}
              style={styles.image}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
            />
            <View style={styles.iconTopRight}>
              <Ionicons name="volume-mute" size={16} color="rgba(255,255,255,0.8)" />
            </View>
          </View>
        ) : (
          <View style={styles.mediaContainer}>
            <Image source={{ uri: item.image }} style={styles.image} />
            {item.isHot && (
              <View style={styles.iconTopRight}>
                <Ionicons name="flame" size={20} color="#FF5A5F" />
              </View>
            )}
          </View>
        )}
        <GradientOverlay item={item} />
      </TouchableOpacity>
    );
  };

  const renderInstagramGrid = () => {
    if (isLoading) {
      return (
        <View style={{ flex: 1, padding: 40, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 10 }}>Discovering places...</Text>
        </View>
      );
    }

    if (displayData.length === 0) {
      return (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>No places found. Try another search!</Text>
        </View>
      );
    }

    // Split data into blocks of 6
    const block1 = displayData.slice(0, 6);
    const block2 = displayData.slice(6, 12);
    const block3 = displayData.slice(12, 18);

    const renderBlockLayoutA = (block: any[]) => block.length > 0 && (
      <View style={styles.blockContainer} key={`block_A_${block[0]?.id}`}>
        <View style={styles.row}>
          {renderGridItem(block[0], 2, 2)}
          <View style={{ width: ITEM_SIZE, height: ITEM_SIZE * 2 }}>
            {renderGridItem(block[1], 1, 1)}
            {renderGridItem(block[2], 1, 1)}
          </View>
        </View>
        {block.length > 3 && (
          <View style={styles.row}>
            {renderGridItem(block[3], 1, 1)}
            {renderGridItem(block[4], 1, 1)}
            {renderGridItem(block[5], 1, 1)}
          </View>
        )}
      </View>
    );

    const renderBlockLayoutB = (block: any[]) => block.length > 0 && (
      <View style={styles.blockContainer} key={`block_B_${block[0]?.id}`}>
        <View style={styles.row}>
          <View style={{ width: ITEM_SIZE, height: ITEM_SIZE * 2 }}>
            {renderGridItem(block[0], 1, 1)}
            {renderGridItem(block[1], 1, 1)}
          </View>
          {renderGridItem(block[2], 2, 2)}
        </View>
        {block.length > 3 && (
          <View style={styles.row}>
            {renderGridItem(block[3], 1, 1)}
            {renderGridItem(block[4], 1, 1)}
            {renderGridItem(block[5], 1, 1)}
          </View>
        )}
      </View>
    );

    return (
      <View style={styles.gridContainer}>
        {renderBlockLayoutA(block1)}
        {renderBlockLayoutB(block2)}
        {renderBlockLayoutA(block3)}
      </View>
    );
  };

  const renderPostModal = () => {
    if (!selectedItem) return null;

    // Generate mock social stats dynamically based on string length to remain visually consistent per-item
    const mockLikes = Math.floor((selectedItem.title.length * 123) % 5000) + 100;
    const mockComments = Math.floor((selectedItem.title.length * 42) % 300) + 10;
    const username = (selectedItem.title.split(' ')[0] || 'travel').toLowerCase() + '_explorer';

    return (
      <Modal visible={!!selectedItem} transparent animationType="fade" onRequestClose={() => setSelectedItem(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedItem(null)} />
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Ionicons name="person-circle" size={36} color={colors.textSecondary} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={[styles.modalUsername, { color: colors.text }]}>{username}</Text>
                  <Text style={styles.modalLocation}>{selectedItem.location || 'India'}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedItem(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Media */}
            <View style={styles.modalMediaContainer}>
              {selectedItem.type === 'video' && selectedItem.videoUrl ? (
                <Video
                  source={{ uri: selectedItem.videoUrl }}
                  style={styles.modalMedia}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay
                  isLooping
                />
              ) : (
                <Image source={{ uri: selectedItem.image }} style={styles.modalMedia} />
              )}
            </View>

            {/* Action Bar */}
            <View style={styles.modalActionBar}>
              <View style={styles.modalActionLeft}>
                <TouchableOpacity style={styles.modalIcon}>
                  <Ionicons name="heart-outline" size={28} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalIcon}>
                  <Ionicons name="chatbubble-outline" size={26} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalIcon}>
                  <Ionicons name="paper-plane-outline" size={26} color={colors.text} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity>
                <Ionicons name="bookmark-outline" size={26} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Details */}
            <View style={styles.modalDetails}>
              <Text style={[styles.modalLikes, { color: colors.text }]}>{mockLikes.toLocaleString()} likes</Text>
              <Text style={[styles.modalCaption, { color: colors.text }]}>
                <Text style={{ fontWeight: 'bold' }}>{username} </Text>
                Exploring the amazing vibes at {selectedItem.title}! 🌍✨
              </Text>
              <Text style={styles.modalCommentsCount}>View all {mockComments} comments</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Fixed Search Header */}
      <View style={[styles.headerContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F2' }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search communities, locations..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); fetchExploreData('', activeCategory); }}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories Horizontal Scroll */}
        <View style={styles.categoriesWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
            {CATEGORIES.map((category) => {
              const isActive = activeCategory === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    { 
                      backgroundColor: isActive ? colors.primary : (isDark ? '#1C1C1E' : '#FFFFFF'),
                      borderColor: isActive ? colors.primary : colors.border 
                    }
                  ]}
                  onPress={() => setActiveCategory(category.id)}
                >
                  <Ionicons 
                    name={category.icon as any} 
                    size={16} 
                    color={isActive ? '#FFFFFF' : colors.text} 
                    style={{ marginRight: 6 }} 
                  />
                  <Text style={[
                    styles.categoryText, 
                    { 
                      color: isActive ? '#FFFFFF' : colors.text,
                      fontWeight: isActive ? '600' : '400'
                    }
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Main Grid Content */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {renderInstagramGrid()}
      </ScrollView>
      {renderPostModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerContainer: {
    paddingTop: 10,
    paddingBottom: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 45,
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 15,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
    ...(React.Component.prototype && { outlineStyle: 'none' } as any),
  },
  categoriesWrapper: { marginBottom: 10 },
  categoriesContainer: {
    paddingHorizontal: 15,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: { fontSize: 14 },
  scrollView: { flex: 1 },
  gridContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  blockContainer: { flexDirection: 'column' },
  row: { flexDirection: 'row' },
  gridItem: {
    borderWidth: 0.5,
  },
  mediaContainer: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'flex-end',
    padding: 10,
  },
  iconTopRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 5,
  },
  itemInfo: { width: '100%' },
  itemTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemGroupSize: {
    color: '#E0E0E0',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  modalContent: {
    marginHorizontal: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalUsername: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalLocation: {
    fontSize: 12,
    color: '#888',
  },
  modalMediaContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#000',
  },
  modalMedia: {
    width: '100%',
    height: '100%',
  },
  modalActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalIcon: {
    marginRight: 15,
  },
  modalDetails: {
    paddingHorizontal: 12,
    paddingBottom: 15,
  },
  modalLikes: {
    fontWeight: '600',
    marginBottom: 4,
    fontSize: 14,
  },
  modalCaption: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  modalCommentsCount: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
});
