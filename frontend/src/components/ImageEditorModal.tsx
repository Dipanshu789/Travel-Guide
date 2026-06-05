import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, TextInput, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useTheme } from '../config/ThemeContext';

interface ImageEditorModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
  onUpload: (brightness: number, contrast: number, saturation: number, caption: string) => Promise<void>;
  isStory?: boolean;
}

export default function ImageEditorModal({ visible, imageUri, onClose, onUpload, isStory = false }: ImageEditorModalProps) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  
  const [brightness, setBrightness] = useState(0); // -100 to 100
  const [contrast, setContrast] = useState(0); // -100 to 100
  const [saturation, setSaturation] = useState(0); // -100 to 100
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      await onUpload(brightness, contrast, saturation, caption);
      // Reset state after success
      setBrightness(0);
      setContrast(0);
      setSaturation(0);
      setCaption('');
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!imageUri) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>New {isStory ? 'Story' : 'Post'}</Text>
            <TouchableOpacity onPress={handleShare} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={[styles.shareText, { color: colors.primary }]}>Share</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={[styles.imageContainer, { width: width, height: isStory ? (width * 16 / 9) : width }]}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <View style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: brightness > 0 ? 'white' : 'black',
                  opacity: Math.abs(brightness) / 300,
                }
              ]} pointerEvents="none" />
            </View>

            {!isStory && (
              <View style={styles.captionContainer}>
                <TextInput
                  style={[styles.captionInput, { color: colors.text }]}
                  placeholder="Write a caption or add hashtags..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  value={caption}
                  onChangeText={setCaption}
                />
              </View>
            )}

            <View style={styles.slidersContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Edit Filters (Cloudinary Powered)</Text>
              
              <View style={styles.sliderRow}>
                <Ionicons name="sunny-outline" size={24} color={colors.textSecondary} />
                <Slider
                  style={styles.slider}
                  minimumValue={-100}
                  maximumValue={100}
                  value={brightness}
                  onValueChange={setBrightness}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.primary}
                />
                <Text style={[styles.sliderValue, { color: colors.textSecondary }]}>{Math.round(brightness)}</Text>
              </View>

              <View style={styles.sliderRow}>
                <Ionicons name="contrast-outline" size={24} color={colors.textSecondary} />
                <Slider
                  style={styles.slider}
                  minimumValue={-100}
                  maximumValue={100}
                  value={contrast}
                  onValueChange={setContrast}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.primary}
                />
                <Text style={[styles.sliderValue, { color: colors.textSecondary }]}>{Math.round(contrast)}</Text>
              </View>

              <View style={styles.sliderRow}>
                <Ionicons name="color-palette-outline" size={24} color={colors.textSecondary} />
                <Slider
                  style={styles.slider}
                  minimumValue={-100}
                  maximumValue={100}
                  value={saturation}
                  onValueChange={setSaturation}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.primary}
                />
                <Text style={[styles.sliderValue, { color: colors.textSecondary }]}>{Math.round(saturation)}</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#33333333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  shareText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageContainer: {
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  captionContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#33333333',
  },
  captionInput: {
    fontSize: 16,
    minHeight: 60,
    ...(React.Component.prototype && { outlineStyle: 'none' } as any),
  },
  slidersContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 15,
  },
  sliderValue: {
    width: 35,
    textAlign: 'right',
  }
});
