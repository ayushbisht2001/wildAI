import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  NativeModules,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { answerQuestion } from './src/answerQuestion';
import { loadChats, onlineHistory, saveChats, type ChatMessage, type ChatThread } from './src/chatHistory';
import { listFeedback, saveFeedback, type Feedback } from './src/feedback';
import { downloadRegionNotes, getRegionNotes, isSafetyQuestion, searchOnline, type RegionNotes } from './src/onlineKnowledge';
import { askOnlineModel } from './src/onlineModel';
import { pilotAccessCode, pilotServiceUrl } from './src/pilotConfig';
import { districtControlRooms, emergencyContacts, regions, type RegionId } from './src/regionPack';

const palette = {
  night: '#07171e',
  surface: '#102832',
  raised: '#173640',
  line: '#31545a',
  text: '#edfff6',
  muted: '#a9c1bf',
  glow: '#a2f4d0',
  amber: '#f4dba0',
  violet: '#9aa8de',
};

type PlantResult = { label: string | null; confidence: number; supportedSpecies: number };
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const onlineReady = Boolean(pilotServiceUrl && pilotAccessCode);

export default function App() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const threadsRef = useRef<ChatThread[]>([]);
  const writeQueue = useRef(Promise.resolve());
  const [loaded, setLoaded] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [regionId, setRegionId] = useState<RegionId>('uttarakhand');
  const currentRegion = useRef<RegionId>('uttarakhand');
  const [draft, setDraft] = useState('');
  const [draftPhoto, setDraftPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState<ChatMessage | null>(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [feedbackListOpen, setFeedbackListOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [regionNotes, setRegionNotes] = useState<RegionNotes | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [photoModelReady, setPhotoModelReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const drift = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const region = regions.find(item => item.id === regionId)!;
  const activeThread = threads.find(item => item.id === activeId);
  const messages = activeThread?.messages ?? [];

  useEffect(() => {
    loadChats().then(saved => {
      threadsRef.current = saved;
      setThreads(saved);
      setActiveId(saved[0]?.id ?? null);
      setRegionId(saved[0]?.regionId ?? 'uttarakhand');
      currentRegion.current = saved[0]?.regionId ?? 'uttarakhand';
      setLoaded(true);
    }).catch(() => setHistoryError('Saved chats could not be opened. Your data has not been changed.'));
    listFeedback().then(setFeedback).catch(() => {});
    NativeModules.PlantClassifier?.isAvailable()
      .then(setPhotoModelReady)
      .catch(() => setPhotoModelReady(false));
  }, []);

  useEffect(() => {
    if (!loaded) { return; }
    writeQueue.current = writeQueue.current
      .then(() => saveChats(threads))
      .catch(() => setHistoryError('This chat could not be saved on the phone.'));
  }, [loaded, threads]);

  useEffect(() => {
    currentRegion.current = regionId;
    let active = true;
    setRegionNotes(null);
    getRegionNotes(regionId).then(saved => {
      if (active) { setRegionNotes(saved); }
    }).catch(() => { if (active) { setNotice('Saved region notes could not be opened.'); } });
    return () => { active = false; };
  }, [regionId]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => listener.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) { drift.setValue(0); return; }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(drift, { toValue: 1, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(drift, { toValue: 0, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [drift, reduceMotion]);

  function commit(next: ChatThread[]) {
    threadsRef.current = next;
    setThreads(next);
  }

  function append(threadId: string, message: ChatMessage) {
    const current = threadsRef.current;
    const thread = current.find(item => item.id === threadId);
    if (!thread) { return; }
    commit([{ ...thread, messages: [...thread.messages, message] }, ...current.filter(item => item.id !== threadId)]);
  }

  function assistant(threadId: string, question: string, text: string, label: ChatMessage['label'], sources?: ChatMessage['sources']) {
    append(threadId, { id: newId(), role: 'assistant', text, label, sources, question, createdAt: new Date().toISOString() });
  }

  async function pickPhoto(camera: boolean) {
    setAttachOpen(false);
    setNotice('');
    try {
      const picked = camera
        ? await launchCamera({ mediaType: 'photo', saveToPhotos: false })
        : await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
      if (picked.didCancel) { return; }
      const uri = picked.assets?.[0]?.uri;
      if (picked.errorCode || !uri) { throw new Error(picked.errorMessage ?? 'Could not open the photo.'); }
      const saved = await NativeModules.PlantClassifier.persistPhoto(uri) as string;
      setDraftPhoto(saved);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not attach the photo.');
    }
  }

  async function send() {
    const text = draft.trim();
    const photo = draftPhoto;
    if ((!text && !photo) || busy || !loaded || historyError) { return; }
    setBusy(true);
    setDraft('');
    setDraftPhoto(null);
    setNotice('');
    if (!reduceMotion) {
      pulse.setValue(0);
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 850, useNativeDriver: true }),
      ]).start();
    }

    let thread = threadsRef.current.find(item => item.id === activeId);
    if (!thread) {
      thread = {
        id: newId(), title: (text || 'Plant photo').slice(0, 38), regionId,
        createdAt: new Date().toISOString(), messages: [],
      };
      commit([thread, ...threadsRef.current]);
      setActiveId(thread.id);
    }
    const threadId = thread.id;
    const history = onlineHistory(thread.messages);
    append(threadId, {
      id: newId(), role: 'user', text: text || 'Plant photo', photoUri: photo ?? undefined,
      createdAt: new Date().toISOString(),
    });

    try {
      if (text) {
        const answer = answerQuestion(regionId, text);
        assistant(threadId, text, `${answer.title}\n${answer.message}`,
          answer.kind === 'supported' ? 'Offline sources' : 'Notice',
          answer.kind === 'supported' ? answer.sources.map(source => ({ title: source.name, url: source.url })) : undefined);
        if (!photo && !isSafetyQuestion(text)) {
          if (onlineReady) {
            try {
              const model = await askOnlineModel(pilotServiceUrl, pilotAccessCode, text, regionId, history);
              assistant(threadId, text, model.answer, 'Online · unreviewed',
                model.sources.map(source => ({ title: source.title, url: source.url })));
            } catch {
              setNotice('Online research is unavailable. Your offline answer is still available.');
            }
          } else if (answer.kind === 'abstain') {
            try {
              const pages = await searchOnline(text, regionId);
              if (pages.length) {
                assistant(threadId, text, pages.slice(0, 2).map(page => `${page.title}: ${page.extract}`).join('\n\n'),
                  'Online · unreviewed', pages.map(page => ({ title: page.title, url: page.url })));
              }
            } catch { /* Offline remains usable. */ }
          }
        }
      }
      if (photo) {
        if (!photoModelReady) {
          assistant(threadId, text || 'Plant photo', 'Photo identification is not available in this build. The photo remains in your chat.', 'Notice');
        } else {
          try {
            const prediction = await NativeModules.PlantClassifier.classify(photo) as PlantResult;
            const message = prediction.label
              ? `Possible match: ${prediction.label}. This experimental model covers ${prediction.supportedSpecies} species and can be wrong.`
              : 'No reliable match. Treat this plant as unknown.';
            assistant(threadId, text || 'Plant photo', `${message}\nNever use this result to decide edibility, toxicity, or treatment.`, 'Photo · experimental');
          } catch {
            assistant(threadId, text || 'Plant photo', 'Photo identification could not complete. Try a clear, close photo.', 'Notice');
          }
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function submitFeedback() {
    if (!feedbackTarget || !feedbackNote.trim() || feedbackBusy) { return; }
    setFeedbackBusy(true);
    try {
      const saved = await saveFeedback({
        regionId,
        question: feedbackTarget.question ?? 'Plant photo identification',
        answer: {
          kind: feedbackTarget.label === 'Offline sources' ? 'supported' : 'abstain',
          title: feedbackTarget.label ?? 'Answer', message: feedbackTarget.text,
        },
        onlineSources: feedbackTarget.sources?.map(source => ({ title: source.title, url: source.url, extract: '' })),
        modelAnswer: feedbackTarget.label === 'Online · unreviewed'
          ? { model: 'online model', text: feedbackTarget.text } : undefined,
        note: feedbackNote.trim(),
      });
      setFeedback(current => [saved, ...current]);
      setFeedbackTarget(null);
      setFeedbackNote('');
      setNotice('Feedback saved on this phone.');
    } catch {
      setNotice('Feedback could not be saved. Please try again.');
    } finally {
      setFeedbackBusy(false);
    }
  }

  async function downloadNotes() {
    if (downloadBusy) { return; }
    const requestedRegion = regionId;
    setDownloadBusy(true);
    try {
      const saved = await downloadRegionNotes(requestedRegion);
      if (currentRegion.current === requestedRegion) { setRegionNotes(saved); }
      setNotice(`${saved.pages.length} region notes saved for offline use.`);
    } catch {
      setNotice('Region download failed. Earlier notes, if any, remain saved.');
    } finally {
      setDownloadBusy(false);
    }
  }

  async function shareFeedback() {
    try { await Share.share({ title: 'WILD-AI feedback', message: JSON.stringify(feedback, null, 2) }); }
    catch { setNotice('Could not open sharing.'); }
  }

  const glowOpacity = drift.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.95] });
  const glowY = drift.interpolate({ inputRange: [0, 1], outputRange: [5, -16] });
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.page} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView style={styles.fill} behavior="padding">
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Open menu" onPress={() => setDrawerOpen(true)} style={styles.menuButton}>
              <Text style={styles.menuIcon}>☰</Text>
            </Pressable>
            <View style={styles.headerCenter}>
              <Text style={styles.brand}>WILD.AI</Text>
              <Text style={styles.regionCaption}>{region.name} · {onlineReady ? 'offline + online' : 'offline first'}</Text>
            </View>
            <View style={styles.headerLight} />
          </View>

          <ScrollView ref={scrollRef} style={styles.fill} contentContainerStyle={styles.chatContent}
            keyboardShouldPersistTaps="handled" onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
            {messages.length === 0 && (
              <View style={styles.welcome}>
                <View style={styles.scene} accessible accessibilityLabel="Glowing forest canopy">
                  <View style={styles.canopyBack} />
                  <View style={styles.canopyLeft} />
                  <View style={styles.canopyRight} />
                  <View style={styles.trunk} />
                  <Animated.View style={[styles.spore, styles.sporeOne, { opacity: glowOpacity, transform: [{ translateY: glowY }] }]} />
                  <Animated.View style={[styles.spore, styles.sporeTwo, { opacity: glowOpacity, transform: [{ translateY: glowY }] }]} />
                  <Animated.View style={[styles.spore, styles.sporeThree, { opacity: glowOpacity, transform: [{ translateY: glowY }] }]} />
                  <Animated.View style={[styles.spore, styles.sporeFour, { opacity: glowOpacity, transform: [{ translateY: glowY }] }]} />
                  <View style={styles.horizon} />
                </View>
                <Text style={styles.welcomeEyebrow}>YOUR FIELD COMPANION</Text>
                <Text style={styles.welcomeTitle}>A quieter way to explore.</Text>
                <Text style={styles.welcomeText}>Ask about documented plants, local guidance, or your route. Add a photo when you want a possible plant match.</Text>
                <View style={styles.suggestions}>
                  {['Plants in Corbett', 'What grows near Landour?', 'Emergency number'].map(example => (
                    <Pressable key={example} accessibilityRole="button" onPress={() => setDraft(example)} style={styles.suggestion}>
                      <Text style={styles.suggestionText}>{example} ↗</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
            {messages.map(message => (
              <View key={message.id} style={[styles.messageRow, message.role === 'user' && styles.userRow]}>
                <View style={[styles.bubble, message.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
                  {message.label && <Text style={styles.messageLabel}>{message.label.toUpperCase()}</Text>}
                  {message.photoUri && <Image source={{ uri: message.photoUri }} style={styles.messagePhoto} accessibilityLabel="Attached plant photo" />}
                  <Text style={styles.messageText}>{message.text}</Text>
                  {message.sources?.slice(0, 3).map(source => (
                    <Pressable key={source.url} accessibilityRole="link" onPress={() => {
                      if (/^https:\/\//.test(source.url)) { Linking.openURL(source.url).catch(() => setNotice('Could not open source.')); }
                    }}>
                      <Text style={styles.sourceText}>↗ {source.title}</Text>
                    </Pressable>
                  ))}
                  {message.role === 'assistant' && (
                    <Pressable accessibilityRole="button" onPress={() => setFeedbackTarget(message)} style={styles.reportButton}>
                      <Text style={styles.reportText}>Report answer</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
            {busy && <Text style={styles.thinking}>✦ Exploring the forest…</Text>}
          </ScrollView>

          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          {historyError ? <Text style={styles.notice}>{historyError}</Text> : null}
          <View style={styles.composerWrap}>
            {draftPhoto && (
              <View style={styles.attachmentPreview}>
                <Image source={{ uri: draftPhoto }} style={styles.attachmentThumb} accessibilityLabel="Photo ready to send" />
                <Text style={styles.attachmentText}>Photo attached</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Remove photo" onPress={() => setDraftPhoto(null)}>
                  <Text style={styles.removePhoto}>×</Text>
                </Pressable>
              </View>
            )}
            <View style={styles.composer}>
              <Pressable accessibilityRole="button" accessibilityLabel="Attach photo" onPress={() => setAttachOpen(true)} style={styles.attachButton}>
                <Text style={styles.attachIcon}>＋</Text>
              </Pressable>
              <TextInput accessibilityLabel="Message WILD-AI" multiline maxLength={300} onChangeText={setDraft}
                placeholder="Ask the forest…" placeholderTextColor={palette.muted} style={styles.chatInput} value={draft} />
              <Animated.View style={{ opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.65] }) }}>
                <Pressable accessibilityRole="button" accessibilityLabel="Send message" accessibilityState={{ disabled: (!draft.trim() && !draftPhoto) || busy || !loaded }}
                  disabled={(!draft.trim() && !draftPhoto) || busy || !loaded || Boolean(historyError)} onPress={send} style={styles.sendButton}>
                  <Text style={styles.sendIcon}>➤</Text>
                </Pressable>
              </Animated.View>
            </View>
            <Text style={styles.composerHint}>Field information is limited. Never use a photo match to decide if a plant is safe.</Text>
          </View>
        </KeyboardAvoidingView>

        <Modal visible={drawerOpen} animationType="fade" transparent onRequestClose={() => setDrawerOpen(false)}>
          <View style={styles.drawerBackdrop}>
            <View style={styles.drawer}>
              <View style={styles.drawerTop}>
                <Text style={styles.drawerTitle}>Explore WILD.AI</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={() => setDrawerOpen(false)}><Text style={styles.close}>×</Text></Pressable>
              </View>
              <Pressable accessibilityRole="button" style={styles.drawerPrimary} onPress={() => { setActiveId(null); setDraft(''); setDraftPhoto(null); setDrawerOpen(false); }}>
                <Text style={styles.drawerPrimaryText}>＋  New conversation</Text>
              </Pressable>
              <Text style={styles.drawerSection}>REGION & OFFLINE</Text>
              <Pressable accessibilityRole="button" style={styles.drawerItem} onPress={() => { setDrawerOpen(false); setRegionOpen(true); }}>
                <Text style={styles.drawerItemText}>⌖  {region.name}</Text><Text style={styles.drawerArrow}>›</Text>
              </Pressable>
              <Pressable accessibilityRole="button" style={styles.drawerItem} onPress={downloadNotes}>
                <Text style={styles.drawerItemText}>↓  {downloadBusy ? 'Downloading…' : regionNotes ? 'Refresh region notes' : 'Download region notes'}</Text>
              </Pressable>
              {regionNotes && <Pressable accessibilityRole="button" style={styles.drawerItem} onPress={() => { setDrawerOpen(false); setNotesOpen(true); }}><Text style={styles.drawerItemText}>▤  View saved notes</Text></Pressable>}
              <View style={styles.emergencyBox}>
                <Text style={styles.emergencyTitle}>EMERGENCY · CELLULAR SERVICE NEEDED</Text>
                <Text style={styles.emergencyNumber}>{emergencyContacts.statewide.emergency}</Text>
                <Text style={styles.emergencyDetails}>State {emergencyContacts.statewide.stateControlRoom} · District {emergencyContacts.statewide.districtControlRoom}{regionId !== 'uttarakhand' ? ` · Local ${districtControlRooms[regionId]}` : ''}</Text>
              </View>
              <Text style={styles.drawerSection}>CONVERSATIONS</Text>
              <ScrollView style={styles.drawerScroll}>
                {threads.map(thread => (
                  <Pressable key={thread.id} accessibilityRole="button" style={[styles.threadItem, activeId === thread.id && styles.activeThread]}
                    onPress={() => { setActiveId(thread.id); setRegionId(thread.regionId); setDrawerOpen(false); }}>
                    <Text style={styles.threadTitle} numberOfLines={1}>{thread.title}</Text>
                    <Text style={styles.threadMeta}>{new Date(thread.createdAt).toLocaleDateString()} · {thread.messages.length} messages</Text>
                  </Pressable>
                ))}
                {!threads.length && <Text style={styles.emptyHistory}>Your conversations will appear here.</Text>}
              </ScrollView>
              <Pressable accessibilityRole="button" style={styles.drawerItem} onPress={() => { setDrawerOpen(false); setFeedbackListOpen(true); listFeedback().then(setFeedback).catch(() => setNotice('Could not open feedback.')); }}>
                <Text style={styles.drawerItemText}>✎  Saved feedback ({feedback.length})</Text>
              </Pressable>
              {onlineReady && <Text style={styles.drawerPrivacy}>Online summaries send your question, region, and recent text turns to the pilot service, Wikimedia, and NVIDIA. Photos stay on this phone.</Text>}
            </View>
            <Pressable style={styles.drawerDismiss} accessibilityLabel="Close menu" onPress={() => setDrawerOpen(false)} />
          </View>
        </Modal>

        <Modal visible={attachOpen} animationType="fade" transparent onRequestClose={() => setAttachOpen(false)}>
          <View style={styles.sheetBackdrop}>
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>Add a plant photo</Text>
              <Text style={styles.sheetText}>Photos stay on this phone. Identification is an experimental suggestion.</Text>
              <Pressable accessibilityRole="button" onPress={() => pickPhoto(true)} style={styles.sheetChoice}><Text style={styles.sheetChoiceText}>◎  Take photo</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => pickPhoto(false)} style={styles.sheetChoice}><Text style={styles.sheetChoiceText}>▧  Choose from gallery</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => setAttachOpen(false)}><Text style={styles.sheetCancel}>Cancel</Text></Pressable>
            </View>
          </View>
        </Modal>

        <Modal visible={regionOpen} animationType="slide" transparent onRequestClose={() => setRegionOpen(false)}>
          <View style={styles.sheetBackdrop}><View style={styles.listSheet}>
            <View style={styles.modalTop}><Text style={styles.sheetTitle}>Choose region</Text><Pressable accessibilityRole="button" onPress={() => setRegionOpen(false)}><Text style={styles.close}>×</Text></Pressable></View>
            <Text style={styles.sheetText}>Changing region starts a new conversation. Earlier chats stay saved.</Text>
            <ScrollView>{regions.map(item => (
              <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: item.id === regionId }} style={styles.regionChoice}
                onPress={() => { setRegionId(item.id); setActiveId(null); setRegionOpen(false); }}>
                <Text style={styles.drawerItemText}>{item.name}</Text>{item.id === regionId && <Text style={styles.selected}>Selected</Text>}
              </Pressable>
            ))}</ScrollView>
          </View></View>
        </Modal>

        <Modal visible={Boolean(feedbackTarget)} animationType="slide" transparent onRequestClose={() => setFeedbackTarget(null)}>
          <View style={styles.sheetBackdrop}><View style={styles.sheet}>
            <View style={styles.modalTop}><Text style={styles.sheetTitle}>Report an answer</Text><Pressable accessibilityRole="button" onPress={() => setFeedbackTarget(null)}><Text style={styles.close}>×</Text></Pressable></View>
            <Text style={styles.sheetText}>Tell us what was wrong or missing. This report stays on your phone until you share it.</Text>
            <TextInput accessibilityLabel="What was wrong or missing?" multiline value={feedbackNote} onChangeText={setFeedbackNote}
              placeholder="What should we correct?" placeholderTextColor={palette.muted} style={styles.feedbackInput} />
            <Pressable accessibilityRole="button" disabled={!feedbackNote.trim() || feedbackBusy} onPress={submitFeedback} style={styles.drawerPrimary}>
              <Text style={styles.drawerPrimaryText}>{feedbackBusy ? 'Saving…' : 'Save feedback'}</Text>
            </Pressable>
          </View></View>
        </Modal>

        <Modal visible={feedbackListOpen} animationType="slide" transparent onRequestClose={() => setFeedbackListOpen(false)}>
          <View style={styles.sheetBackdrop}><View style={styles.listSheet}>
            <View style={styles.modalTop}><Text style={styles.sheetTitle}>Saved feedback</Text><Pressable accessibilityRole="button" onPress={() => setFeedbackListOpen(false)}><Text style={styles.close}>×</Text></Pressable></View>
            <ScrollView>{feedback.length ? feedback.map(item => (
              <View key={item.id} style={styles.feedbackCard}><Text style={styles.threadMeta}>{new Date(item.createdAt).toLocaleString()}</Text><Text style={styles.drawerItemText}>{item.question}</Text><Text style={styles.sheetText}>{item.note}</Text></View>
            )) : <Text style={styles.sheetText}>No feedback saved yet.</Text>}</ScrollView>
            {feedback.length > 0 && <Pressable accessibilityRole="button" onPress={shareFeedback} style={styles.drawerPrimary}><Text style={styles.drawerPrimaryText}>Share feedback for review</Text></Pressable>}
          </View></View>
        </Modal>

        <Modal visible={notesOpen} animationType="slide" transparent onRequestClose={() => setNotesOpen(false)}>
          <View style={styles.sheetBackdrop}><View style={styles.listSheet}>
            <View style={styles.modalTop}><Text style={styles.sheetTitle}>Saved region notes</Text><Pressable accessibilityRole="button" onPress={() => setNotesOpen(false)}><Text style={styles.close}>×</Text></Pressable></View>
            <Text style={styles.sheetText}>Encyclopedia notes are unreviewed. They are available offline after download.</Text>
            <ScrollView>{regionNotes?.pages.map(page => <View key={page.url} style={styles.feedbackCard}><Text style={styles.drawerItemText}>{page.title}</Text><Text style={styles.sheetText}>{page.extract}</Text></View>)}</ScrollView>
          </View></View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  page: { flex: 1, backgroundColor: palette.night },
  header: { height: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: '#17353d' },
  menuButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' },
  menuIcon: { color: palette.glow, fontSize: 21 },
  headerCenter: { flex: 1, alignItems: 'center' },
  brand: { color: palette.text, fontSize: 18, fontWeight: '800', letterSpacing: 3 },
  regionCaption: { color: palette.muted, fontSize: 11, marginTop: 4 },
  headerLight: { width: 9, height: 9, borderRadius: 5, backgroundColor: palette.glow, shadowColor: palette.glow, shadowOpacity: 0.9, shadowRadius: 10, elevation: 4 },
  chatContent: { paddingHorizontal: 16, paddingBottom: 22, flexGrow: 1 },
  welcome: { paddingTop: 24, alignItems: 'center' },
  scene: { width: '100%', height: 188, borderRadius: 26, overflow: 'hidden', backgroundColor: '#103241', borderWidth: 1, borderColor: '#28525b', marginBottom: 22 },
  canopyBack: { position: 'absolute', top: -112, left: '10%', width: '80%', height: 210, borderRadius: 150, backgroundColor: '#235867' },
  canopyLeft: { position: 'absolute', top: -58, left: -60, width: 280, height: 165, borderRadius: 140, backgroundColor: '#174a48', transform: [{ rotate: '-17deg' }] },
  canopyRight: { position: 'absolute', top: -55, right: -90, width: 300, height: 175, borderRadius: 140, backgroundColor: '#14615b', transform: [{ rotate: '20deg' }] },
  trunk: { position: 'absolute', bottom: 0, left: '48%', width: 14, height: 116, borderTopLeftRadius: 12, borderTopRightRadius: 12, backgroundColor: '#0c2832' },
  horizon: { position: 'absolute', bottom: -47, left: -15, right: -15, height: 85, borderRadius: 80, backgroundColor: '#092632' },
  spore: { position: 'absolute', width: 8, height: 8, borderRadius: 5, backgroundColor: palette.glow, shadowColor: palette.glow, shadowOpacity: 1, shadowRadius: 12, elevation: 8 },
  sporeOne: { top: 62, left: '17%' }, sporeTwo: { top: 104, left: '37%', width: 6, height: 6 },
  sporeThree: { top: 55, right: '19%', backgroundColor: palette.amber }, sporeFour: { top: 118, right: '31%', width: 5, height: 5 },
  welcomeEyebrow: { color: palette.glow, fontSize: 11, fontWeight: '700', letterSpacing: 2.5 },
  welcomeTitle: { color: palette.text, fontSize: 28, fontWeight: '700', marginTop: 11, textAlign: 'center' },
  welcomeText: { color: palette.muted, fontSize: 15, lineHeight: 23, textAlign: 'center', marginTop: 10, maxWidth: 320 },
  suggestions: { width: '100%', marginTop: 24, gap: 8 },
  suggestion: { borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 16, paddingVertical: 13 },
  suggestionText: { color: palette.text, fontSize: 14 },
  messageRow: { flexDirection: 'row', marginTop: 16, justifyContent: 'flex-start' },
  userRow: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '88%', borderRadius: 20, padding: 15, borderWidth: 1 },
  assistantBubble: { backgroundColor: palette.surface, borderColor: palette.line, borderBottomLeftRadius: 5 },
  userBubble: { backgroundColor: '#1c524e', borderColor: '#37796a', borderBottomRightRadius: 5 },
  messageLabel: { color: palette.glow, fontSize: 10, letterSpacing: 1.4, fontWeight: '800', marginBottom: 8 },
  messageText: { color: palette.text, fontSize: 15, lineHeight: 22 },
  messagePhoto: { width: 220, height: 170, borderRadius: 12, marginBottom: 10 },
  sourceText: { color: palette.violet, fontSize: 12, marginTop: 10, textDecorationLine: 'underline' },
  reportButton: { alignSelf: 'flex-start', marginTop: 12 },
  reportText: { color: palette.muted, fontSize: 12, textDecorationLine: 'underline' },
  thinking: { color: palette.glow, marginTop: 16, fontSize: 13 },
  notice: { color: palette.amber, fontSize: 12, paddingHorizontal: 19, paddingVertical: 7 },
  composerWrap: { borderTopWidth: 1, borderTopColor: '#21434a', backgroundColor: '#0a2028', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: palette.surface, borderWidth: 1, borderColor: '#3c6467', borderRadius: 24, padding: 6 },
  attachButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  attachIcon: { color: palette.glow, fontSize: 25 },
  chatInput: { flex: 1, color: palette.text, fontSize: 15, maxHeight: 112, minHeight: 42, paddingVertical: 9, paddingHorizontal: 5, textAlignVertical: 'center' },
  sendButton: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.glow },
  sendIcon: { color: palette.night, fontSize: 21 },
  composerHint: { color: palette.muted, fontSize: 10, textAlign: 'center', marginTop: 7 },
  attachmentPreview: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  attachmentThumb: { width: 48, height: 48, borderRadius: 10 },
  attachmentText: { color: palette.text, fontSize: 12, flex: 1 },
  removePhoto: { color: palette.text, fontSize: 28, paddingHorizontal: 7 },
  drawerBackdrop: { flex: 1, flexDirection: 'row', backgroundColor: '#0009' },
  drawer: { width: '84%', backgroundColor: '#0c242d', paddingTop: 42, paddingHorizontal: 18, paddingBottom: 28 },
  drawerDismiss: { flex: 1 },
  drawerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  drawerTitle: { color: palette.text, fontSize: 22, fontWeight: '700' },
  close: { color: palette.muted, fontSize: 29, lineHeight: 32 },
  drawerPrimary: { backgroundColor: palette.glow, padding: 14, borderRadius: 15, alignItems: 'center', marginVertical: 10 },
  drawerPrimaryText: { color: palette.night, fontSize: 15, fontWeight: '700' },
  drawerSection: { color: palette.glow, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginTop: 17, marginBottom: 8 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#254049' },
  drawerItemText: { color: palette.text, fontSize: 14, flexShrink: 1 },
  drawerArrow: { color: palette.muted, fontSize: 20 },
  emergencyBox: { backgroundColor: '#173438', borderWidth: 1, borderColor: '#476659', borderRadius: 16, padding: 13, marginTop: 18 },
  emergencyTitle: { color: palette.amber, fontSize: 10, fontWeight: '700' },
  emergencyNumber: { color: palette.text, fontSize: 30, fontWeight: '800', marginTop: 4 },
  emergencyDetails: { color: palette.muted, fontSize: 11, lineHeight: 17 },
  drawerScroll: { flex: 1 },
  threadItem: { borderBottomWidth: 1, borderBottomColor: '#254049', paddingVertical: 11, paddingHorizontal: 6 },
  activeThread: { backgroundColor: palette.surface, borderRadius: 9 },
  threadTitle: { color: palette.text, fontSize: 14 },
  threadMeta: { color: palette.muted, fontSize: 11, marginTop: 5 },
  emptyHistory: { color: palette.muted, fontSize: 13, paddingVertical: 12 },
  drawerPrivacy: { color: palette.muted, fontSize: 10, lineHeight: 15, marginTop: 10 },
  sheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0009' },
  sheet: { backgroundColor: '#102832', paddingHorizontal: 22, paddingTop: 24, paddingBottom: 34, borderTopLeftRadius: 26, borderTopRightRadius: 26 },
  listSheet: { backgroundColor: '#102832', paddingHorizontal: 22, paddingTop: 24, paddingBottom: 34, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '82%' },
  modalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { color: palette.text, fontSize: 21, fontWeight: '700' },
  sheetText: { color: palette.muted, fontSize: 13, lineHeight: 20, marginTop: 10 },
  sheetChoice: { backgroundColor: palette.raised, padding: 16, borderRadius: 14, marginTop: 13 },
  sheetChoiceText: { color: palette.text, fontSize: 16 },
  sheetCancel: { color: palette.muted, textAlign: 'center', paddingTop: 19, fontSize: 15 },
  regionChoice: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: palette.line },
  selected: { color: palette.glow, fontSize: 12 },
  feedbackInput: { minHeight: 100, color: palette.text, backgroundColor: palette.raised, borderRadius: 14, padding: 12, marginTop: 14, textAlignVertical: 'top' },
  feedbackCard: { borderBottomWidth: 1, borderBottomColor: palette.line, paddingVertical: 13 },
});
