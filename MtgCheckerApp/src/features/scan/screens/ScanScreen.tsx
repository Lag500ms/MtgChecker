import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardArt } from '@/components/CardArt';
import { SetSymbol } from '@/components/SetSymbol';
import { useToast } from '@/components/Toast';
import {
  findCardBySetAndNumber,
  scanCardBase64,
  ScanCardResult,
} from '@/features/cards/api/cardsApi';
import type { Card } from '@/features/cards/types/card';
import { CardDetailSheet } from '@/features/search/components/CardDetailSheet';
import { borderRadius, spacing, typography } from '@/lib/theme';

import {
  captureCardOutline,
  CardOutlineCamera,
  isCardOutlineAvailable,
} from '../components/CardOutlineCamera';
import { parseMtgCardCode } from '../utils/ocrParser';

export function ScanScreen() {
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<any>(null);
  const outlineRef = useRef<any>(null);
  const lockGuard = useRef(false);

  const [permission, requestPermission] = useCameraPermissions();
  const [enableTorch, setEnableTorch] = useState(false);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');

  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [lastScannedCard, setLastScannedCard] = useState<Card | null>(null);
  const [confidence, setConfidence] = useState<'HIGH' | 'MEDIUM' | 'LOW' | undefined>(undefined);
  const [recognizedText, setRecognizedText] = useState<string | undefined>(undefined);
  const [showDetailSheet, setShowDetailSheet] = useState(false);

  const [showManualModal, setShowManualModal] = useState(false);
  const [manualSet, setManualSet] = useState('');
  const [manualNumber, setManualNumber] = useState('');
  const [manualRawText, setManualRawText] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  const isBusyRef = useRef(false);
  isBusyRef.current = isProcessing;

  const autoScanRef = useRef(autoScanEnabled);
  autoScanRef.current = autoScanEnabled;

  const isSheetOpenRef = useRef(false);
  isSheetOpenRef.current = showDetailSheet || showManualModal;

  const [isFocused, setIsFocused] = useState(false);
  const isFocusedRef = useRef(false);
  isFocusedRef.current = isFocused;

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => {
        setIsFocused(false);
        setEnableTorch(false);
        setIsProcessing(false);
        lockGuard.current = false;
        isBusyRef.current = false;
      };
    }, [])
  );

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate('/(tabs)');
    }
  };

  useEffect(() => {
    if (!isFocused) return;
    if (isCardOutlineAvailable) return;
    if (!autoScanEnabled || !permission?.granted) return;

    const liveScanInterval = setInterval(async () => {
      if (
        !isFocusedRef.current ||
        isBusyRef.current ||
        !autoScanRef.current ||
        isSheetOpenRef.current ||
        !cameraRef.current
      ) {
        return;
      }

      try {
        isBusyRef.current = true;
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
          skipProcessing: true,
        });

        if (photo && photo.base64 && isFocusedRef.current && !isSheetOpenRef.current) {
          const result: ScanCardResult = await scanCardBase64(photo.base64);
          if (result && result.card && isFocusedRef.current && !isSheetOpenRef.current) {
            setConfidence(result.confidence);
            setRecognizedText(result.recognizedText);
            setCurrentCard(result.card);
            setLastScannedCard(result.card);
            setShowDetailSheet(true);
          }
        }
      } catch {
      } finally {
        isBusyRef.current = false;
      }
    }, 1800);

    return () => clearInterval(liveScanInterval);
  }, [isFocused, autoScanEnabled, permission?.granted]);

  const handlePhotoScan = async (
    base64: string,
    uri: string,
    width?: number,
    height?: number,
  ) => {
    setIsProcessing(true);
    setStatusText('Reading card…');

    try {
      const result: ScanCardResult = await scanCardBase64(base64);

      if (result && result.card) {
        setStatusText('Card recognized!');
        setConfidence(result.confidence);
        setRecognizedText(result.recognizedText);
        setCurrentCard(result.card);
        setLastScannedCard(result.card);
        setShowDetailSheet(true);
      } else {
        throw new Error('Could not identify card from image.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Could not recognize card.';
      setStatusText('Scan incomplete: ' + msg);

      const parsed = parseMtgCardCode(msg);
      if (parsed) {
        setManualSet(parsed.setCode.toUpperCase());
        setManualNumber(parsed.collectorNumber);
      }
      setShowManualModal(true);
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        lockGuard.current = false;
      }, 900);
    }
  };

  const handleCardLocked = (event: {
    nativeEvent: { base64: string; width: number; height: number };
  }) => {
    if (!isFocusedRef.current || lockGuard.current || isProcessing || showDetailSheet || showManualModal) return;
    const { base64, width, height } = event.nativeEvent;
    if (!base64) return;
    lockGuard.current = true;
    void handlePhotoScan(base64, `data:image/jpeg;base64,${base64}`, width, height);
  };

  const captureCard = async () => {
    if (isProcessing) return;

    if (isCardOutlineAvailable) {
      captureCardOutline(outlineRef);
      return;
    }

    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: true,
      });

      if (photo && photo.base64) {
        await handlePhotoScan(photo.base64, photo.uri, photo.width, photo.height);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Could not capture photo at this moment.', 'Capture Error');
    }
  };

  const handlePickImage = async () => {
    if (isProcessing) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        base64: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          await handlePhotoScan(asset.base64, asset.uri, asset.width, asset.height);
        }
      }
    } catch (e: any) {
      toast.error(e?.message || 'Could not pick image from library.', 'Photo Library Error');
    }
  };

  const handleManualLookup = async (setCode: string, collectorNumber: string) => {
    const cleanSet = setCode.trim().toLowerCase();
    const cleanNum = collectorNumber.trim();
    if (!cleanSet || !cleanNum) {
      toast.info('Please enter Set Code and Collector Number.', 'Missing info');
      return;
    }

    setManualLoading(true);
    try {
      const card = await findCardBySetAndNumber(cleanSet, cleanNum);
      if (card) {
        setCurrentCard(card);
        setLastScannedCard(card);
        setConfidence(undefined);
        setRecognizedText(`${cleanSet.toUpperCase()} #${cleanNum}`);
        setShowManualModal(false);
        setShowDetailSheet(true);
      } else {
        toast.error(`No card found for ${cleanSet.toUpperCase()} #${cleanNum}`, 'Not Found');
      }
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || e?.message || 'Check Set code and Number.',
        'Card Not Found'
      );
    } finally {
      setManualLoading(false);
    }
  };

  const handleParseRawText = () => {
    if (!manualRawText.trim()) return;
    const parsed = parseMtgCardCode(manualRawText);
    if (parsed) {
      setManualSet(parsed.setCode.toUpperCase());
      setManualNumber(parsed.collectorNumber);
      handleManualLookup(parsed.setCode, parsed.collectorNumber);
    } else {
      toast.info(
        'Could not detect pattern. Use format like "FDN 125" or "ONE 157".',
        'Parse Result'
      );
    }
  };

  const hasCameraPermission = Boolean(permission?.granted);

  return (
    <View style={styles.root}>
      {!hasCameraPermission ? (
        <View style={styles.permissionWrap}>
          <View style={styles.permissionIconCircle}>
            <Feather name="camera-off" size={44} color="#E0AD62" />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionSubtitle}>
            Camera permission is required to detect MTG cards in real-time.
          </Text>
          <Pressable
            onPress={requestPermission}
            style={styles.permissionButton}
          >
            <Feather name="camera" size={18} color="#0E2A2C" />
            <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
          </Pressable>
        </View>
      ) : isFocused ? (
        isCardOutlineAvailable ? (
          <CardOutlineCamera
            ref={outlineRef}
            style={StyleSheet.absoluteFill}
            enabled={autoScanEnabled && !isProcessing && !showDetailSheet && !showManualModal}
            torch={enableTorch}
            onCardLocked={handleCardLocked}
          />
        ) : (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={enableTorch}
          />
        )
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />
      )}

      {hasCameraPermission && (
        <View style={styles.reticleContainer} pointerEvents="none">
          <View style={styles.cardReticle}>
            <View style={styles.reticleCornerTL} />
            <View style={styles.reticleCornerTR} />
            <View style={styles.reticleCornerBL} />
            <View style={styles.reticleCornerBR} />
            <View style={styles.reticleZone}>
              <Text style={styles.reticleZoneText}>COLLECTOR CODE</Text>
            </View>
          </View>
          <Text style={styles.reticleHintText}>
            {isProcessing
              ? 'Recognizing card code…'
              : isCardOutlineAvailable
                ? 'Align card in view — border hugs 4 corners & auto-captures'
                : 'Bring card close — border locks & scans automatically'}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.topBar,
          { top: Math.max(insets.top, 16) + 6 },
        ]}
      >
        <Pressable
          onPress={handleClose}
          style={styles.topCircleBtn}
          hitSlop={12}
        >
          <Feather name="x" size={22} color="#F3E7CF" />
        </Pressable>

        <Pressable
          onPress={() => setAutoScanEnabled((v) => !v)}
          style={[
            styles.topBadge,
            autoScanEnabled ? styles.topBadgeActive : styles.topBadgeInactive,
          ]}
          hitSlop={8}
        >
          <View
            style={[
              styles.topBadgeDot,
              { backgroundColor: autoScanEnabled ? '#22C55E' : '#94A3B8' },
            ]}
          />
          <Text
            style={[
              styles.topBadgeText,
              { color: autoScanEnabled ? '#E0AD62' : '#B9C9C4' },
            ]}
          >
            {isCardOutlineAvailable
              ? autoScanEnabled
                ? 'DOCUMENT MODE'
                : 'MANUAL'
              : autoScanEnabled
                ? 'AUTO SCAN'
                : 'MANUAL SCAN'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setEnableTorch((t) => !t)}
          style={[
            styles.topCircleBtn,
            enableTorch && styles.topCircleBtnActive,
          ]}
          hitSlop={12}
        >
          <Feather
            name={enableTorch ? 'zap' : 'zap-off'}
            size={20}
            color={enableTorch ? '#0E2A2C' : '#F3E7CF'}
          />
        </Pressable>
      </View>

      {isProcessing && (
        <View style={styles.processingHUD}>
          <ActivityIndicator size="small" color="#0E2A2C" />
          <Text style={styles.processingHUDText}>{statusText || 'Scanning…'}</Text>
        </View>
      )}

      <View
        style={[
          styles.bottomFloatingArea,
          { bottom: Math.max(insets.bottom, 16) + 12 },
        ]}
      >
        {lastScannedCard && !isProcessing && (
          <Pressable
            onPress={() => {
              setCurrentCard(lastScannedCard);
              setShowDetailSheet(true);
            }}
            style={styles.miniPreviewPill}
          >
            <CardArt
              card={lastScannedCard}
              size="small"
              contentFit="cover"
              style={styles.miniPreviewThumb}
            />
            <View style={styles.miniPreviewInfo}>
              <Text style={styles.miniPreviewTag}>LAST SCANNED</Text>
              <Text style={styles.miniPreviewTitle} numberOfLines={1}>
                {lastScannedCard.name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <SetSymbol setCode={lastScannedCard.set} rarity={lastScannedCard.rarity} size={13} />
                <Text style={styles.miniPreviewSub}>
                  {lastScannedCard.set.toUpperCase()} #{lastScannedCard.collectorNumber}
                </Text>
              </View>
            </View>
            <View style={styles.miniPreviewAction}>
              <Text style={styles.miniPreviewActionText}>View</Text>
            </View>
          </Pressable>
        )}

        <View style={styles.controlsBar}>
          <Pressable
            onPress={handlePickImage}
            disabled={isProcessing}
            style={({ pressed }) => [
              styles.actionBtn,
              { opacity: pressed || isProcessing ? 0.6 : 1 },
            ]}
          >
            <Feather name="image" size={22} color="#E0AD62" />
          </Pressable>

          <Pressable
            onPress={captureCard}
            disabled={isProcessing}
            style={({ pressed }) => [
              styles.shutterBtn,
              { opacity: pressed || isProcessing ? 0.8 : 1 },
            ]}
          >
            <View style={styles.shutterRing} />
            <View style={styles.shutterInner}>
              <Feather name="camera" size={26} color="#0E2A2C" />
            </View>
          </Pressable>

          <Pressable
            onPress={() => setShowManualModal(true)}
            disabled={isProcessing}
            style={({ pressed }) => [
              styles.actionBtn,
              { opacity: pressed || isProcessing ? 0.6 : 1 },
            ]}
          >
            <Feather name="hash" size={22} color="#E0AD62" />
          </Pressable>
        </View>
      </View>

      <Modal
        visible={showManualModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowManualModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowManualModal(false)}
          />

          <View style={styles.manualCard}>
            <View style={styles.manualHeader}>
              <View style={styles.manualHeaderLeft}>
                <Feather name="hash" size={18} color="#E0AD62" />
                <Text style={styles.manualTitle}>Manual Card Entry</Text>
              </View>
              <Pressable
                onPress={() => setShowManualModal(false)}
                hitSlop={8}
              >
                <Feather name="x" size={20} color="#B9C9C4" />
              </Pressable>
            </View>

            <Text style={styles.manualSub}>
              Enter Set code and Collector number, or paste raw OCR footer text.
            </Text>

            <View style={styles.manualRow}>
              <View style={styles.manualCol}>
                <Text style={styles.manualLabel}>SET CODE</Text>
                <TextInput
                  value={manualSet}
                  onChangeText={(t) => setManualSet(t.toUpperCase())}
                  placeholder="e.g. FDN"
                  placeholderTextColor="#B9C9C4"
                  autoCapitalize="characters"
                  maxLength={6}
                  style={styles.manualField}
                />
              </View>

              <View style={styles.manualCol}>
                <Text style={styles.manualLabel}>NUMBER</Text>
                <TextInput
                  value={manualNumber}
                  onChangeText={setManualNumber}
                  placeholder="e.g. 125"
                  placeholderTextColor="#B9C9C4"
                  keyboardType="numeric"
                  maxLength={6}
                  style={styles.manualField}
                />
              </View>

              <Pressable
                onPress={() => handleManualLookup(manualSet, manualNumber)}
                disabled={manualLoading}
                style={[styles.manualSubmit, { backgroundColor: '#E0AD62' }]}
              >
                {manualLoading ? (
                  <ActivityIndicator size="small" color="#0E2A2C" />
                ) : (
                  <Feather name="search" size={20} color="#0E2A2C" />
                )}
              </Pressable>
            </View>

            <View style={styles.rawRow}>
              <TextInput
                value={manualRawText}
                onChangeText={setManualRawText}
                placeholder="Or text: U 0125 FDN DE"
                placeholderTextColor="#B9C9C4"
                style={styles.rawField}
              />
              <Pressable
                onPress={handleParseRawText}
                disabled={manualLoading}
                style={styles.rawBtn}
              >
                <Text style={styles.rawBtnText}>Parse</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CardDetailSheet
        card={currentCard}
        visible={showDetailSheet}
        confidence={confidence}
        recognizedText={recognizedText}
        onOpenManualCorrection={(text) => {
          if (text) setManualRawText(text);
          setShowManualModal(true);
        }}
        onClose={() => {
          setShowDetailSheet(false);
          lockGuard.current = false;
        }}
        onSelectPrinting={(p) => setCurrentCard(p)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#071A1B',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  permissionIconCircle: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(224, 173, 98, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F3E7CF',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  permissionSubtitle: {
    fontSize: 14,
    color: '#B9C9C4',
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#E0AD62',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  permissionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E2A2C',
  },
  reticleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  cardReticle: {
    width: 260,
    height: 364,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(224, 173, 98, 0.35)',
    borderStyle: 'dashed',
    position: 'relative',
    justifyContent: 'flex-end',
    padding: 12,
  },
  reticleCornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 24,
    height: 24,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderColor: '#E0AD62',
    borderTopLeftRadius: 16,
  },
  reticleCornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 24,
    height: 24,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderColor: '#E0AD62',
    borderTopRightRadius: 16,
  },
  reticleCornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 24,
    height: 24,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderColor: '#E0AD62',
    borderBottomLeftRadius: 16,
  },
  reticleCornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderColor: '#E0AD62',
    borderBottomRightRadius: 16,
  },
  reticleZone: {
    width: '65%',
    height: 36,
    borderWidth: 1.5,
    borderColor: '#E0AD62',
    borderRadius: 6,
    backgroundColor: 'rgba(224, 173, 98, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleZoneText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E0AD62',
    letterSpacing: 0.6,
  },
  reticleHintText: {
    marginTop: spacing.lg,
    fontSize: 13,
    fontWeight: '600',
    color: '#F3E7CF',
    backgroundColor: 'rgba(7, 26, 27, 0.78)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(224, 173, 98, 0.3)',
    textAlign: 'center',
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  topCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(7, 26, 27, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(224, 173, 98, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCircleBtnActive: {
    backgroundColor: '#E0AD62',
    borderColor: '#E0AD62',
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(7, 26, 27, 0.75)',
    borderWidth: 1,
  },
  topBadgeActive: {
    borderColor: '#E0AD62',
  },
  topBadgeInactive: {
    borderColor: '#2D5C5E',
  },
  topBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: borderRadius.full,
  },
  topBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  processingHUD: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E0AD62',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    zIndex: 15,
  },
  processingHUDText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E2A2C',
  },
  bottomFloatingArea: {
    position: 'absolute',
    left: 20,
    right: 20,
    gap: spacing.sm,
    zIndex: 10,
  },
  miniPreviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 42, 44, 0.92)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(224, 173, 98, 0.4)',
    padding: spacing.xs,
    gap: spacing.sm,
  },
  miniPreviewThumb: {
    width: 38,
    height: 52,
    borderRadius: borderRadius.sm,
    backgroundColor: '#071A1B',
  },
  miniPreviewInfo: {
    flex: 1,
    gap: 1,
  },
  miniPreviewTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E0AD62',
    letterSpacing: 0.5,
  },
  miniPreviewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F3E7CF',
  },
  miniPreviewSub: {
    fontSize: 11,
    color: '#B9C9C4',
  },
  miniPreviewAction: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: '#E0AD62',
    marginRight: 4,
  },
  miniPreviewActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0E2A2C',
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(7, 26, 27, 0.75)',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(224, 173, 98, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
  },
  actionBtn: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(19, 58, 61, 0.85)',
    borderWidth: 1,
    borderColor: '#2D5C5E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterBtn: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(224, 173, 98, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  shutterRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: '#E0AD62',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: '#E0AD62',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalBackdrop: {
    flex: 1,
  },
  manualCard: {
    backgroundColor: '#133A3D',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: 1,
    borderColor: '#2D5C5E',
    padding: spacing.lg,
    gap: spacing.md,
  },
  manualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manualHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  manualTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F3E7CF',
  },
  manualSub: {
    fontSize: 13,
    color: '#B9C9C4',
    lineHeight: 18,
  },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  manualCol: {
    flex: 1,
    gap: 4,
  },
  manualLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E0AD62',
    letterSpacing: 0.5,
  },
  manualField: {
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: '#071A1B',
    borderWidth: 1,
    borderColor: '#2D5C5E',
    paddingHorizontal: spacing.md,
    fontSize: 15,
    fontWeight: '700',
    color: '#F3E7CF',
  },
  manualSubmit: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rawRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rawField: {
    flex: 1,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: '#071A1B',
    borderWidth: 1,
    borderColor: '#2D5C5E',
    paddingHorizontal: spacing.md,
    fontSize: 13,
    color: '#F3E7CF',
  },
  rawBtn: {
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: '#2D5C5E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rawBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F3E7CF',
  },
});
