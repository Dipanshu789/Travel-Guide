import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, TextInput, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/ThemeContext';

interface PostDetailModalProps {
  visible: boolean;
  post: any;
  onClose: () => void;
}

export default function PostDetailModal({ visible, post, onClose }: PostDetailModalProps) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [mockComments, setMockComments] = useState([
    { id: '1', user: 'wanderlust_jane', text: 'Stunning view! 😍' },
    { id: '2', user: 'travel_with_mark', text: 'I need to go there someday.' }
  ]);

  if (!post) return null;

  const handlePostComment = () => {
    if (commentText.trim()) {
      setMockComments([...mockComments, { id: Date.now().toString(), user: 'You', text: commentText.trim() }]);
      setCommentText('');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="chevron-down" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Post</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* Post Author Info */}
            <View style={styles.userInfo}>
              <Image source={{ uri: post.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' }} style={styles.avatar} />
              <View>
                <Text style={[styles.username, { color: colors.text }]}>{post.username || 'Traveler'}</Text>
                {post.location && <Text style={[styles.location, { color: colors.textSecondary }]}>{post.location}</Text>}
              </View>
            </View>

            {/* Zoomable Image Area */}
            <ScrollView 
              horizontal={false} 
              maximumZoomScale={3} 
              minimumZoomScale={1} 
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.imageScrollContainer, { width: width, height: width }]}
            >
              <Image source={{ uri: post.image || post.postImage }} style={{ width: width, height: width }} resizeMode="contain" />
            </ScrollView>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <View style={styles.actionGroup}>
                <TouchableOpacity onPress={() => setIsLiked(!isLiked)} style={styles.actionBtn}>
                  <Ionicons name={isLiked ? "heart" : "heart-outline"} size={28} color={isLiked ? "#FF3B30" : colors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="chatbubble-outline" size={26} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="paper-plane-outline" size={26} color={colors.text} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity>
                <Ionicons name="bookmark-outline" size={26} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Likes count */}
            <Text style={[styles.likesText, { color: colors.text }]}>
              {post.likes ? (isLiked ? post.likes + 1 : post.likes).toLocaleString() : (isLiked ? 1 : 0)} likes
            </Text>

            {/* Caption */}
            {(post.caption || post.text) && (
              <View style={styles.captionContainer}>
                <Text style={[styles.captionText, { color: colors.text }]}>
                  <Text style={{ fontWeight: 'bold' }}>{post.username || 'Traveler'}</Text> {post.caption || post.text}
                </Text>
              </View>
            )}

            {/* Comments List */}
            <View style={styles.commentsSection}>
              {mockComments.map(comment => (
                <View key={comment.id} style={styles.commentRow}>
                  <Text style={[styles.commentText, { color: colors.text }]}>
                    <Text style={{ fontWeight: 'bold' }}>{comment.user}</Text> {comment.text}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Comment Input */}
          <View style={[styles.commentInputContainer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' }} style={styles.smallAvatar} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity onPress={handlePostComment} disabled={!commentText.trim()}>
              <Text style={[styles.postButton, { color: commentText.trim() ? colors.primary : colors.textSecondary }]}>Post</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  location: {
    fontSize: 12,
    marginTop: 2,
  },
  imageScrollContainer: {
    backgroundColor: '#000',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    marginRight: 15,
  },
  likesText: {
    fontWeight: 'bold',
    fontSize: 14,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  captionContainer: {
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  captionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentsSection: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  commentRow: {
    marginBottom: 6,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 80,
    ...(React.Component.prototype && { outlineStyle: 'none' } as any),
  },
  postButton: {
    fontWeight: 'bold',
    marginLeft: 10,
  }
});
