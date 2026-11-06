import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/lib/ThemeProvider';
import { apiClient } from '@/lib/apiClient';
import { parseDeckText } from '../utils/deckTextParser';
import type { DeckFormat } from '../types/deck';

interface CreateDeckModalProps {
  visible: boolean;
  formats: DeckFormat[];
  onClose: () => void;
  onCreate: (
    name: string,
    formatId: string,
    description?: string,
    commanderCardId?: string,
    commanderCardName?: string,
    commanderColorIdentity?: string[],
    coverCardUri?: string,
    partnerCommanderCardId?: string,
    partnerCommanderCardName?: string,
    partnerCoverCardUri?: string,
    visibility?: string
  ) => Promise<void>;
}

const COLOR_MAP: Record<string, { label: string; bg: string; text: string }> = {
  W: { label: 'Trắng', bg: '#F9FAF4', text: '#222222' },
  U: { label: 'Xanh lam', bg: '#0E68AB', text: '#FFFFFF' },
  B: { label: 'Đen', bg: '#1E1B18', text: '#FFFFFF' },
  R: { label: 'Đỏ', bg: '#D3202A', text: '#FFFFFF' },
  G: { label: 'Xanh lục', bg: '#00733E', text: '#FFFFFF' },
  C: { label: 'Không màu', bg: '#A69F9D', text: '#111111' },
};

const DEFAULT_FALLBACK_FORMAT: DeckFormat = {
  id: 'commander',
  name: 'Commander',
  scryfallKey: 'commander',
  minCards: 100,
  maxCards: 100,
  maxCopies: 1,
  hasCommander: true,
  hasSideboard: false,
  active: true,
};

type PartnerType = 'NONE' | 'PARTNER' | 'PARTNER_WITH' | 'BACKGROUND' | 'FRIENDS_FOREVER' | 'DOCTOR';

interface PartnerCapability {
  type: PartnerType;
  label: string;
  targetName?: string;
}

function detectPartnerCapability(card: any): PartnerCapability | null {
  if (!card) return null;
  const oracle = (card.oracleText || card.oracle_text || '').toLowerCase();
  const typeLine = (card.typeLine || card.type_line || '').toLowerCase();

  if (oracle.includes('choose a background')) {
    return { type: 'BACKGROUND', label: 'Choose a Background' };
  }

  const partnerWithMatch = (card.oracleText || card.oracle_text || '').match(/partner with ([^\n.,]+)/i);
  if (partnerWithMatch && partnerWithMatch[1]) {
    return {
      type: 'PARTNER_WITH',
      targetName: partnerWithMatch[1].trim(),
      label: `Partner with ${partnerWithMatch[1].trim()}`,
    };
  }

  if (typeLine.includes('time lord doctor') || (typeLine.includes('doctor') && !typeLine.includes("doctor's companion"))) {
    return { type: 'DOCTOR', label: "Doctor's Companion Pair" };
  }

  if (oracle.includes('friends forever')) {
    return { type: 'FRIENDS_FOREVER', label: 'Friends Forever' };
  }

  if (oracle.includes('partner') || (card.keywords && card.keywords.map((k: string) => k.toLowerCase()).includes('partner'))) {
    return { type: 'PARTNER', label: 'Partner' };
  }

  return null;
}

function isLegalCommander(card: any): boolean {
  if (!card) return false;
  const legalities = card.legalities || {};
  const status = legalities['commander'];
  if (status && status !== 'legal' && status !== 'restricted') {
    return false;
  }

  const type = (card.typeLine || card.type_line || '').toLowerCase();
  const oracle = (card.oracleText || card.oracle_text || '').toLowerCase();
  const name = (card.name || '').toLowerCase();

  if (name.includes('grist, the hunger tide')) return true;
  if (oracle.includes('can be your commander')) return true;
  if (type.includes('legendary') && (type.includes('creature') || type.includes('planeswalker') || type.includes('vehicle'))) {
    return true;
  }

  return false;
}

export function CreateDeckModal({ visible, formats, onClose, onCreate }: CreateDeckModalProps) {
  const { theme } = useAppTheme();
  const [name, setName] = useState('');
  const [selectedFormatId, setSelectedFormatId] = useState(formats[0]?.id || 'commander');
  const [formatDropdownOpen, setFormatDropdownOpen] = useState(false);

  const [commanderSearchQuery, setCommanderSearchQuery] = useState('');
  const [isSearchingCommander, setIsSearchingCommander] = useState(false);
  const [commanderCandidates, setCommanderCandidates] = useState<any[]>([]);
  const [selectedCommander, setSelectedCommander] = useState<any | null>(null);

  const [hasPartnerEnabled, setHasPartnerEnabled] = useState(false);
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
  const [isSearchingPartner, setIsSearchingPartner] = useState(false);
  const [partnerCandidates, setPartnerCandidates] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [folder, setFolder] = useState('No Folder');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'UNLISTED' | 'PRIVATE'>('PUBLIC');
  const [importOption, setImportOption] = useState<'NONE' | 'PASTE' | 'FILE' | 'URL'>('NONE');
  const [pastedDeckList, setPastedDeckList] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const selectedFormat =
    formats.find((f) => f.id === selectedFormatId) || formats[0] || DEFAULT_FALLBACK_FORMAT;
  const isCommanderFormat = selectedFormat?.hasCommander || selectedFormat?.id === 'commander';

  useEffect(() => {
    if (formats.length > 0 && !formats.some((f) => f.id === selectedFormatId)) {
      setSelectedFormatId(formats[0].id);
    }
  }, [formats, selectedFormatId]);

  const commanderPartnerCap = useMemo(() => {
    return detectPartnerCapability(selectedCommander);
  }, [selectedCommander]);

  const combinedColorIdentity = useMemo(() => {
    const list1: string[] = selectedCommander?.colorIdentity || selectedCommander?.color_identity || [];
    const list2: string[] = hasPartnerEnabled && selectedPartner ? (selectedPartner?.colorIdentity || selectedPartner?.color_identity || []) : [];
    const union = Array.from(new Set([...list1, ...list2]));
    const order = ['W', 'U', 'B', 'R', 'G', 'C'];
    return union.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }, [selectedCommander, selectedPartner, hasPartnerEnabled]);

  const handleSearchPrimaryCommander = async (query: string) => {
    if (!query.trim()) return;
    setIsSearchingCommander(true);
    try {
      const response = await apiClient.get<any[]>('/cards/local-cache', {
        params: { query: query.trim(), limit: 14 },
      });
      const items = response.data || [];
      const matched = items.filter(isLegalCommander);
      setCommanderCandidates(matched.length > 0 ? matched : items.slice(0, 6));
    } catch {
      try {
        const fallback = await apiClient.get<any>('/cards/search', {
          params: { q: `${query.trim()} is:commander f:commander` },
        });
        setCommanderCandidates(fallback.data?.cards?.slice(0, 8) || []);
      } catch {
        setCommanderCandidates([]);
      }
    } finally {
      setIsSearchingCommander(false);
    }
  };

  const handleSearchPartnerCard = async (query: string) => {
    if (!query.trim()) return;
    setIsSearchingPartner(true);
    try {
      const response = await apiClient.get<any[]>('/cards/local-cache', {
        params: { query: query.trim(), limit: 14 },
      });
      const items = response.data || [];

      let filterFn = (c: any) => {
        const leg = c.legalities?.commander;
        if (leg && leg !== 'legal' && leg !== 'restricted') return false;
        const type = (c.typeLine || c.type_line || '').toLowerCase();
        const oracle = (c.oracleText || c.oracle_text || '').toLowerCase();

        if (commanderPartnerCap?.type === 'BACKGROUND') {
          return type.includes('background');
        }
        if (commanderPartnerCap?.type === 'PARTNER_WITH' && commanderPartnerCap.targetName) {
          return c.name.toLowerCase().includes(commanderPartnerCap.targetName.toLowerCase());
        }
        if (commanderPartnerCap?.type === 'DOCTOR') {
          return oracle.includes("doctor's companion");
        }
        if (commanderPartnerCap?.type === 'FRIENDS_FOREVER') {
          return oracle.includes('friends forever');
        }
        if (commanderPartnerCap?.type === 'PARTNER') {
          return oracle.includes('partner') || (c.keywords && c.keywords.includes('Partner'));
        }
        return type.includes('background') || oracle.includes('partner') || oracle.includes('friends forever');
      };

      const matched = items.filter(filterFn);
      setPartnerCandidates(matched.length > 0 ? matched : items.slice(0, 6));
    } catch {
      try {
        let scryfallQuery = `${query.trim()} f:commander`;
        if (commanderPartnerCap?.type === 'BACKGROUND') {
          scryfallQuery += ' t:background';
        } else if (commanderPartnerCap?.type === 'PARTNER_WITH' && commanderPartnerCap.targetName) {
          scryfallQuery = `!"${commanderPartnerCap.targetName}" f:commander`;
        } else if (commanderPartnerCap?.type === 'DOCTOR') {
          scryfallQuery += ' o:"doctor\'s companion"';
        } else if (commanderPartnerCap?.type === 'FRIENDS_FOREVER') {
          scryfallQuery += ' o:"friends forever"';
        } else {
          scryfallQuery += ' (o:partner or t:background or o:"friends forever")';
        }

        const fallback = await apiClient.get<any>('/cards/search', {
          params: { q: scryfallQuery },
        });
        setPartnerCandidates(fallback.data?.cards?.slice(0, 8) || []);
      } catch {
        setPartnerCandidates([]);
      }
    } finally {
      setIsSearchingPartner(false);
    }
  };

  const handleSelectPrimaryCommander = (card: any) => {
    setSelectedCommander(card);
    setCommanderCandidates([]);
    setCommanderSearchQuery('');

    const cap = detectPartnerCapability(card);
    if (cap != null) {
      setHasPartnerEnabled(true);
      if (cap.type === 'PARTNER_WITH' && cap.targetName) {
        setPartnerSearchQuery(cap.targetName);
        handleSearchPartnerCard(cap.targetName);
      }
    }

    if (!name.trim()) {
      setName(selectedPartner && hasPartnerEnabled ? `${card.name} & ${selectedPartner.name}` : `${card.name} Deck`);
    }
  };

  const handleSelectPartnerCommander = (card: any) => {
    setSelectedPartner(card);
    setPartnerCandidates([]);
    setPartnerSearchQuery('');
    if (selectedCommander && (!name.trim() || name.includes(selectedCommander.name))) {
      setName(`${selectedCommander.name} & ${card.name}`);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập tên bộ bài');
      return;
    }

    if (isCommanderFormat && !selectedCommander) {
      setErrorMessage('Thể thức Commander yêu cầu bạn phải chọn 1 Vị Tướng (Commander)');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const coverUri =
        selectedCommander?.imageUris?.artCrop ||
        selectedCommander?.imageUris?.normal ||
        selectedCommander?.image_uris?.art_crop ||
        selectedCommander?.image_uris?.normal;

      const partnerCoverUri =
        hasPartnerEnabled && selectedPartner
          ? selectedPartner?.imageUris?.artCrop ||
            selectedPartner?.imageUris?.normal ||
            selectedPartner?.image_uris?.art_crop ||
            selectedPartner?.image_uris?.normal
          : undefined;

      await onCreate(
        name.trim(),
        selectedFormat.id,
        folder !== 'No Folder' ? `Folder: ${folder}` : undefined,
        selectedCommander?.id,
        selectedCommander?.name,
        combinedColorIdentity,
        coverUri,
        hasPartnerEnabled && selectedPartner ? selectedPartner?.id : undefined,
        hasPartnerEnabled && selectedPartner ? selectedPartner?.name : undefined,
        partnerCoverUri,
        visibility
      );

      setName('');
      setSelectedCommander(null);
      setSelectedPartner(null);
      setHasPartnerEnabled(false);
      setCommanderSearchQuery('');
      setPartnerSearchQuery('');
      setCommanderCandidates([]);
      setPartnerCandidates([]);
      setShowAdvanced(false);
      setPastedDeckList('');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.dialogCard, { backgroundColor: '#16161A', borderColor: '#2E3039' }]}>
          <View style={styles.dialogHeader}>
            <Text style={[styles.dialogTitle, { color: theme.text }]}>Create New Deck</Text>
            <Pressable hitSlop={12} onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Name</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: '#0F1014', borderColor: '#2A2B34', color: theme.text },
                ]}
                placeholder="Enter deck name..."
                placeholderTextColor={theme.textSecondary}
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  setErrorMessage('');
                }}
              />
              <View style={styles.helperRow}>
                <Feather name="shield" size={13} color={theme.accent} style={{ marginTop: 2 }} />
                <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                  MtgChecker bảo vệ bộ bài của bạn và tự động đồng bộ khi có kết nối mạng.
                </Text>
              </View>
            </View>

            <View style={styles.rowTwoCols}>
              <View style={styles.colFormat}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>Format</Text>
                <Pressable
                  style={[
                    styles.dropdownTrigger,
                    { backgroundColor: '#0F1014', borderColor: '#2A2B34' },
                  ]}
                  onPress={() => setFormatDropdownOpen(!formatDropdownOpen)}
                >
                  <Text style={[styles.dropdownValueText, { color: theme.text }]} numberOfLines={1}>
                    {selectedFormat?.name || 'Commander'}
                  </Text>
                  <Feather
                    name={formatDropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={theme.textSecondary}
                  />
                </Pressable>

                {formatDropdownOpen ? (
                  <View
                    style={[
                      styles.dropdownMenu,
                      { backgroundColor: '#1A1B22', borderColor: '#333542' },
                    ]}
                  >
                    {formats.map((f) => {
                      const isCur = f.id === selectedFormatId;
                      return (
                        <Pressable
                          key={f.id}
                          style={[
                            styles.dropdownMenuItem,
                            isCur ? { backgroundColor: 'rgba(224, 173, 98, 0.15)' } : null,
                          ]}
                          onPress={() => {
                            setSelectedFormatId(f.id);
                            setFormatDropdownOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownMenuItemText,
                              { color: isCur ? theme.accent : theme.text },
                            ]}
                            numberOfLines={1}
                          >
                            {f.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>

              {isCommanderFormat ? (
                <View style={styles.colCommander}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Commander</Text>
                  {selectedCommander ? (
                    <View
                      style={[
                        styles.commanderSelectedPill,
                        { backgroundColor: '#0F1014', borderColor: '#2A2B34' },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.selectedCardName, { color: theme.text }]} numberOfLines={1}>
                          {selectedCommander.name}
                        </Text>
                        <Text style={[styles.selectedCardType, { color: theme.textSecondary }]} numberOfLines={1}>
                          {selectedCommander.typeLine || selectedCommander.type_line || 'Commander'}
                        </Text>
                      </View>
                      <Pressable
                        hitSlop={10}
                        onPress={() => {
                          setSelectedCommander(null);
                          setSelectedPartner(null);
                          setHasPartnerEnabled(false);
                        }}
                      >
                        <Feather name="x" size={16} color={theme.textSecondary} />
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.searchWrap}>
                      <TextInput
                        style={[
                          styles.searchFieldInput,
                          { backgroundColor: '#0F1014', borderColor: '#2A2B34', color: theme.text },
                        ]}
                        placeholder="Who is your commander?"
                        placeholderTextColor={theme.textSecondary}
                        value={commanderSearchQuery}
                        onChangeText={(txt) => {
                          setCommanderSearchQuery(txt);
                          if (txt.trim().length >= 2) {
                            handleSearchPrimaryCommander(txt);
                          }
                        }}
                        onSubmitEditing={() => handleSearchPrimaryCommander(commanderSearchQuery)}
                        returnKeyType="search"
                      />
                      <Pressable
                        style={styles.innerSearchIcon}
                        onPress={() => handleSearchPrimaryCommander(commanderSearchQuery)}
                      >
                        {isSearchingCommander ? (
                          <ActivityIndicator size="small" color={theme.accent} />
                        ) : (
                          <Feather name="search" size={15} color={theme.textSecondary} />
                        )}
                      </Pressable>
                    </View>
                  )}

                  {commanderCandidates.length > 0 && !selectedCommander ? (
                    <View
                      style={[
                        styles.candidatesDropdown,
                        { backgroundColor: '#1A1B22', borderColor: '#333542' },
                      ]}
                    >
                      {commanderCandidates.map((c) => (
                        <Pressable
                          key={c.id}
                          style={styles.candidateRow}
                          onPress={() => handleSelectPrimaryCommander(c)}
                        >
                          <Text style={[styles.candidateName, { color: theme.text }]} numberOfLines={1}>
                            {c.name}
                          </Text>
                          <Text style={[styles.candidateSub, { color: theme.textSecondary }]} numberOfLines={1}>
                            {c.typeLine || c.type_line || ''} {c.manaCost || c.mana_cost || ''}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}

                  <View style={styles.partnerOptionContainer}>
                    <Pressable
                      style={styles.checkboxRow}
                      onPress={() => {
                        const next = !hasPartnerEnabled;
                        setHasPartnerEnabled(next);
                        if (!next) {
                          setSelectedPartner(null);
                        }
                      }}
                    >
                      <View
                        style={[
                          styles.checkboxBox,
                          {
                            borderColor: hasPartnerEnabled ? theme.accent : '#4E505E',
                            backgroundColor: hasPartnerEnabled ? theme.accent : 'transparent',
                          },
                        ]}
                      >
                        {hasPartnerEnabled ? <Feather name="check" size={12} color="#000" /> : null}
                      </View>
                      <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                        Has a partner or background?
                      </Text>
                    </Pressable>

                    {commanderPartnerCap ? (
                      <View style={[styles.partnerCapPill, { backgroundColor: 'rgba(224, 173, 98, 0.14)' }]}>
                        <Feather name="link" size={11} color={theme.accent} />
                        <Text style={[styles.partnerCapText, { color: theme.accent }]}>
                          {commanderPartnerCap.label}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {hasPartnerEnabled ? (
                    <View style={styles.partnerInputArea}>
                      {selectedPartner ? (
                        <View
                          style={[
                            styles.commanderSelectedPill,
                            { backgroundColor: '#0F1014', borderColor: '#2A2B34' },
                          ]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.selectedCardName, { color: theme.text }]} numberOfLines={1}>
                              {selectedPartner.name}
                            </Text>
                            <Text style={[styles.selectedCardType, { color: theme.textSecondary }]} numberOfLines={1}>
                              {selectedPartner.typeLine || selectedPartner.type_line || 'Partner Commander'}
                            </Text>
                          </View>
                          <Pressable hitSlop={10} onPress={() => setSelectedPartner(null)}>
                            <Feather name="x" size={16} color={theme.textSecondary} />
                          </Pressable>
                        </View>
                      ) : (
                        <View style={styles.searchWrap}>
                          <TextInput
                            style={[
                              styles.searchFieldInput,
                              { backgroundColor: '#0F1014', borderColor: '#2A2B34', color: theme.text },
                            ]}
                            placeholder={
                              commanderPartnerCap?.type === 'BACKGROUND'
                                ? 'Search Background enchantment...'
                                : commanderPartnerCap?.targetName
                                ? `Partner: ${commanderPartnerCap.targetName}`
                                : 'Who is the partner?'
                            }
                            placeholderTextColor={theme.textSecondary}
                            value={partnerSearchQuery}
                            onChangeText={(txt) => {
                              setPartnerSearchQuery(txt);
                              if (txt.trim().length >= 2) {
                                handleSearchPartnerCard(txt);
                              }
                            }}
                            onSubmitEditing={() => handleSearchPartnerCard(partnerSearchQuery)}
                            returnKeyType="search"
                          />
                          <Pressable
                            style={styles.innerSearchIcon}
                            onPress={() => handleSearchPartnerCard(partnerSearchQuery)}
                          >
                            {isSearchingPartner ? (
                              <ActivityIndicator size="small" color={theme.accent} />
                            ) : (
                              <Feather name="search" size={15} color={theme.textSecondary} />
                            )}
                          </Pressable>
                        </View>
                      )}

                      {partnerCandidates.length > 0 && !selectedPartner ? (
                        <View
                          style={[
                            styles.candidatesDropdown,
                            { backgroundColor: '#1A1B22', borderColor: '#333542' },
                          ]}
                        >
                          {partnerCandidates.map((c) => (
                            <Pressable
                              key={c.id}
                              style={styles.candidateRow}
                              onPress={() => handleSelectPartnerCommander(c)}
                            >
                              <Text style={[styles.candidateName, { color: theme.text }]} numberOfLines={1}>
                                {c.name}
                              </Text>
                              <Text style={[styles.candidateSub, { color: theme.textSecondary }]} numberOfLines={1}>
                                {c.typeLine || c.type_line || ''} {c.manaCost || c.mana_cost || ''}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  {combinedColorIdentity.length > 0 ? (
                    <View style={styles.identityRow}>
                      <Text style={[styles.identityLabel, { color: theme.textSecondary }]}>
                        Color Identity:
                      </Text>
                      <View style={styles.colorPillsGroup}>
                        {combinedColorIdentity.map((c) => {
                          const info = COLOR_MAP[c] || { label: c, bg: '#555', text: '#FFF' };
                          return (
                            <View key={c} style={[styles.colorPill, { backgroundColor: info.bg }]}>
                              <Text style={[styles.colorPillText, { color: info.text }]}>{c}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>

            <Pressable
              style={styles.advancedAccordionHeader}
              onPress={() => setShowAdvanced(!showAdvanced)}
            >
              <View style={styles.advancedDivider} />
              <View style={styles.advancedHeaderInner}>
                <Feather
                  name={showAdvanced ? 'chevron-down' : 'chevron-right'}
                  size={15}
                  color={theme.accent}
                />
                <Text style={[styles.advancedHeaderText, { color: theme.accent }]}>
                  Advanced options
                </Text>
              </View>
              <View style={styles.advancedDivider} />
            </Pressable>

            {showAdvanced ? (
              <View style={styles.advancedSection}>
                <View style={styles.advancedField}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Folder</Text>
                  <View
                    style={[
                      styles.folderSelector,
                      { backgroundColor: '#0F1014', borderColor: '#2A2B34' },
                    ]}
                  >
                    <Text style={[styles.folderSelectorText, { color: theme.text }]}>{folder}</Text>
                    <Feather name="chevron-down" size={16} color={theme.textSecondary} />
                  </View>
                </View>

                <View style={styles.advancedField}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Visibility</Text>
                  <View style={styles.segmentedRow}>
                    {(['PUBLIC', 'UNLISTED', 'PRIVATE'] as const).map((v) => {
                      const isSel = visibility === v;
                      const label = v === 'PUBLIC' ? 'Public' : v === 'UNLISTED' ? 'Unlisted' : 'Private';
                      return (
                        <Pressable
                          key={v}
                          style={[
                            styles.segmentBtn,
                            {
                              backgroundColor: isSel ? 'rgba(224, 173, 98, 0.18)' : '#0F1014',
                              borderColor: isSel ? theme.accent : '#2A2B34',
                            },
                          ]}
                          onPress={() => setVisibility(v)}
                        >
                          <View
                            style={[
                              styles.radioCircle,
                              {
                                borderColor: isSel ? theme.accent : '#555',
                                backgroundColor: isSel ? theme.accent : 'transparent',
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.segmentBtnText,
                              { color: isSel ? theme.accent : theme.textSecondary },
                            ]}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.advancedField}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>
                    Existing Deck List <Text style={styles.italicOpt}>(optional)</Text>
                  </Text>
                  <View style={styles.segmentedRowWrap}>
                    {(
                      [
                        { id: 'NONE', label: 'None' },
                        { id: 'PASTE', label: 'Paste in List' },
                        { id: 'FILE', label: 'From File' },
                        { id: 'URL', label: 'From URL' },
                      ] as const
                    ).map((opt) => {
                      const isSel = importOption === opt.id;
                      return (
                        <Pressable
                          key={opt.id}
                          style={[
                            styles.segmentPillBtn,
                            {
                              backgroundColor: isSel ? 'rgba(224, 173, 98, 0.18)' : '#0F1014',
                              borderColor: isSel ? theme.accent : '#2A2B34',
                            },
                          ]}
                          onPress={() => setImportOption(opt.id)}
                        >
                          <View
                            style={[
                              styles.radioCircle,
                              {
                                borderColor: isSel ? theme.accent : '#555',
                                backgroundColor: isSel ? theme.accent : 'transparent',
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.segmentBtnText,
                              { color: isSel ? theme.accent : theme.textSecondary },
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {importOption === 'PASTE' ? (
                    <View style={styles.pasteAreaContainer}>
                      <TextInput
                        style={[
                          styles.pasteInput,
                          { backgroundColor: '#0F1014', borderColor: '#2A2B34', color: theme.text },
                        ]}
                        multiline
                        numberOfLines={5}
                        placeholder={'1 Sol Ring\n1 Command Tower\n1 Arcane Signet\n...'}
                        placeholderTextColor={theme.textSecondary}
                        value={pastedDeckList}
                        onChangeText={setPastedDeckList}
                        textAlignVertical="top"
                      />
                      {pastedDeckList.trim().length > 0 ? (
                        <Text style={[styles.pasteHint, { color: theme.accent, fontWeight: '700' }]}>
                          ✓ Đã nhận diện: {parseDeckText(pastedDeckList).totalCards} lá bài
                        </Text>
                      ) : (
                        <Text style={[styles.pasteHint, { color: theme.textSecondary }]}>
                          Chức năng import tự động sẽ phân tích cú pháp bài dạng văn bản.
                        </Text>
                      )}
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.dialogFooter}>
            <Pressable
              style={[
                styles.createActionBtn,
                { backgroundColor: theme.accent, opacity: isSubmitting ? 0.7 : 1 },
              ]}
              onPress={handleCreate}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text
                  style={styles.createActionBtnText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  Create
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#262832',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeBtn: {
    padding: 4,
  },
  bodyScroll: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  fieldBlock: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 6,
  },
  helperText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  rowTwoCols: {
    flexDirection: 'column',
    gap: 14,
    marginBottom: 16,
  },
  colFormat: {
    width: '100%',
  },
  colCommander: {
    width: '100%',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownValueText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownMenu: {
    borderWidth: 1,
    borderRadius: 6,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownMenuItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchFieldInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingRight: 36,
    paddingVertical: 9,
    fontSize: 13,
  },
  innerSearchIcon: {
    position: 'absolute',
    right: 10,
    padding: 4,
  },
  candidatesDropdown: {
    borderWidth: 1,
    borderRadius: 6,
    marginTop: 4,
    maxHeight: 180,
  },
  candidateRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#252733',
  },
  candidateName: {
    fontSize: 13,
    fontWeight: '700',
  },
  candidateSub: {
    fontSize: 11,
    marginTop: 1,
  },
  commanderSelectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedCardName: {
    fontSize: 13,
    fontWeight: '700',
  },
  selectedCardType: {
    fontSize: 11,
    marginTop: 2,
  },
  partnerOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  partnerCapPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  partnerCapText: {
    fontSize: 10,
    fontWeight: '700',
  },
  partnerInputArea: {
    marginTop: 8,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  identityLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  colorPillsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  colorPill: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  advancedAccordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 8,
  },
  advancedDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#2A2C37',
  },
  advancedHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  advancedHeaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  advancedSection: {
    paddingBottom: 8,
  },
  advancedField: {
    marginBottom: 14,
  },
  folderSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  folderSelectorText: {
    fontSize: 13,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentedRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 6,
  },
  segmentPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 6,
  },
  radioCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  italicOpt: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#888',
  },
  pasteAreaContainer: {
    marginTop: 8,
  },
  pasteInput: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    fontSize: 12,
    fontFamily: 'monospace',
    height: 80,
  },
  pasteHint: {
    fontSize: 11,
    marginTop: 4,
  },
  dialogFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#262832',
  },
  createActionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 84,
  },
  createActionBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
});