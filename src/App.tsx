import { useCallback, useEffect, useRef, useState } from 'react';
import { AchievementsModal } from './components/AchievementsModal';
import { AchievementToast, ActiveToast } from './components/AchievementToast';
import { BossIntroOverlay } from './components/BossIntroOverlay';
import { GameHud } from './components/GameHud';
import { GameModal } from './components/GameModal';
import { MobileOrientationOverlay } from './components/MobileOrientationOverlay';
import { StageLoadingScreen } from './components/StageLoadingScreen';
import { TitleScreen } from './components/TitleScreen';
import { ACHIEVEMENTS, AchievementDef, AchievementStoreData, loadAchievements } from './game/achievements';
import { NinjaAudio } from './game/audio';
import { BestiaryStoreData, loadBestiary } from './game/bestiary';
import { NinjaGameEngine } from './game/engine';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from './game/renderer';
import { Difficulty, GameScreenState, HudSnapshot, NinjutsuType, STAGES, StageId } from './game/types';

const INITIAL_HUD: HudSnapshot = {
  stageId: 'village',
  stageIndex: 0,
  stageTitle: STAGES[0].title,
  difficulty: 'normal',
  hp: 100,
  maxHp: 100,
  chi: 100,
  maxChi: 100,
  shurikens: 8,
  maxShurikens: 8,
  activeNinjutsu: 'ikazuchi',
  requiredJutsu: 'ikazuchi',
  requiredJutsuBroken: false,
  clonesCount: 0,
  shieldHits: 0,
  fushinTimer: 0,
  nightVisionTimer: 0,
  denseFog: false,
  weatherKind: 'rain',
  weatherLabel: 'Chuva',
  weatherEffect: '-Visib. / Detecção 55%',
  weatherDetectionPct: 55,
  weatherDetectionRange: 460,
  weatherTacticalTip: 'Chuva abafa passos · Distância média',
  activeHazardWarning: null,
  score: 0,
  comboCount: 0,
  comboDecayPct: 0,
  maxCombo: 0,
  comboDamageMult: 1,
  comboRank: '',
  moonFury: 0,
  maxMoonFury: 100,
  waveIndex: 1,
  totalWaves: 3,
  zoneName: 'Entrada da Vila',
  enemiesDefeated: 0,
  elapsedSeconds: 0,
  goPrompt: false,
  boss: null,
  bossIntro: null,
  bannerText: null,
  karma: 0,
  karmaLabel: 'NEUTRO',
  karmaAlignment: 'neutral',
  karmaReward: null,
  civiliansRescued: 0,
  civiliansHarmed: 0,
  stageCiviliansRescued: 0,
  stageCiviliansHarmed: 0,
  stageCiviliansTotal: 3,
  performance: {
    rank: 'S',
    performanceScore: 100,
    elapsedSeconds: 0,
    damageTaken: 0,
    comboAccuracy: 100,
    maxCombo: 0,
    timeGrade: 'S',
    damageGrade: 'S',
    comboGrade: 'S',
  },
};

function readBestScore(): number {
  try {
    const raw = localStorage.getItem('kage_best_score');
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function writeBestScore(score: number): void {
  try {
    localStorage.setItem('kage_best_score', String(score));
  } catch {
    // Ignore storage failures
  }
}

function detectTouchCapable(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
}

function detectPortraitMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerHeight > window.innerWidth && window.innerWidth < 820;
}

export default function App() {
  const [screen, setScreen] = useState<GameScreenState>('TITLE_MENU');
  const [selectedStage, setSelectedStage] = useState<StageId>('village');
  const [selectedNinjutsu, setSelectedNinjutsu] = useState<NinjutsuType>(STAGES[0].requiredJutsu);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [bestScore, setBestScore] = useState<number>(() => readBestScore());
  const [achievementStore, setAchievementStore] = useState<AchievementStoreData>(() => loadAchievements());
  const [bestiaryStore, setBestiaryStore] = useState<BestiaryStoreData>(() => loadBestiary());
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);

  const selectedNinjutsuRef = useRef<NinjutsuType>(selectedNinjutsu);
  selectedNinjutsuRef.current = selectedNinjutsu;

  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(() => detectTouchCapable());
  const [isPortraitMobile, setIsPortraitMobile] = useState<boolean>(() => detectPortraitMobile());
  const [forcedLandscape, setForcedLandscape] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showTouchControls, setShowTouchControls] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return detectTouchCapable() || window.innerWidth < 1024 || window.innerHeight < 540;
  });

  const audioRef = useRef<NinjaAudio | null>(null);
  if (!audioRef.current) {
    audioRef.current = new NinjaAudio();
  }
  const [muted, setMuted] = useState<boolean>(() => audioRef.current?.isMuted() ?? false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<NinjaGameEngine | null>(null);
  const toastIdRef = useRef(1);

  const handleAchievementUnlock = useCallback((achievement: AchievementDef) => {
    setAchievementStore(loadAchievements());
    const instanceId = toastIdRef.current++;
    setToasts((prev) => [...prev.slice(-2), { instanceId, achievement }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.instanceId !== instanceId));
    }, 4200);
  }, []);

  const updateBestScoreIfHigher = useCallback((candidate: number) => {
    setBestScore((prev) => {
      if (candidate > prev) {
        writeBestScore(candidate);
        return candidate;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    if (screen === 'TITLE_MENU') {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio) return;

    if (!engineRef.current) {
      const engine = new NinjaGameEngine(
        canvas,
        audio,
        selectedStage,
        difficulty,
        (snapshot) => {
          setHud(snapshot);
          setSelectedNinjutsu(snapshot.activeNinjutsu);
        },
        (outcome, finalSnap) => {
          setHud(finalSnap);
          updateBestScoreIfHigher(finalSnap.score);
          setScreen(outcome);
        },
        handleAchievementUnlock,
        () => setBestiaryStore(loadBestiary())
      );
      engineRef.current = engine;
      engine.selectNinjutsu(selectedNinjutsuRef.current);
      engine.start();
      if (screen === 'LOADING_STAGE') {
        engine.setPaused(true);
      }
    }
  }, [screen, selectedStage, difficulty, updateBestScoreIfHigher, handleAchievementUnlock]);

  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleViewportUpdate = () => {
      const touch = detectTouchCapable();
      const portrait = detectPortraitMobile();
      setIsTouchDevice(touch);
      setIsPortraitMobile(portrait);
      if (!portrait) {
        setForcedLandscape(false);
      }
      if (touch || window.innerHeight < 540) {
        setShowTouchControls(true);
      }
      engineRef.current?.clearTouchInputs();
    };

    const handleFullscreenChange = () => {
      const fsEl =
        document.fullscreenElement ??
        (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement;
      setIsFullscreen(Boolean(fsEl));
    };

    window.addEventListener('resize', handleViewportUpdate);
    window.addEventListener('orientationchange', handleViewportUpdate);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange as EventListener);
    return () => {
      window.removeEventListener('resize', handleViewportUpdate);
      window.removeEventListener('orientationchange', handleViewportUpdate);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange as EventListener);
    };
  }, []);

  const tryLockLandscapeOrientation = useCallback(async () => {
    try {
      const orientation = window.screen.orientation as ScreenOrientation & {
        lock?: (orientation: 'landscape' | 'landscape-primary') => Promise<void>;
      };
      if (orientation && typeof orientation.lock === 'function') {
        await orientation.lock('landscape');
      }
    } catch {
      // Orientation lock requires fullscreen on some browsers or is unsupported on iOS Safari
    }
  }, []);

  const handleRequestLandscapeFullscreen = useCallback(async () => {
    audioRef.current?.unlock();
    try {
      const rootEl = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
      };
      if (!document.fullscreenElement) {
        if (typeof rootEl.requestFullscreen === 'function') {
          await rootEl.requestFullscreen();
        } else if (typeof rootEl.webkitRequestFullscreen === 'function') {
          await rootEl.webkitRequestFullscreen();
        }
      }
    } catch {
      // Ignore fullscreen denial
    }
    await tryLockLandscapeOrientation();
    // If device still stays portrait after fullscreen attempt (e.g. iOS Safari), activate forced landscape
    window.setTimeout(() => {
      if (detectPortraitMobile()) {
        setForcedLandscape(true);
        setShowTouchControls(true);
      }
    }, 260);
  }, [tryLockLandscapeOrientation]);

  const handleToggleFullscreen = useCallback(async () => {
    try {
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
        webkitExitFullscreen?: () => Promise<void> | void;
      };
      if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        if (typeof doc.exitFullscreen === 'function') {
          await doc.exitFullscreen();
        } else if (typeof doc.webkitExitFullscreen === 'function') {
          await doc.webkitExitFullscreen();
        }
      } else {
        await handleRequestLandscapeFullscreen();
      }
    } catch {
      // Ignore fullscreen toggle errors
    }
  }, [handleRequestLandscapeFullscreen]);

  const handleEnableForcedLandscape = useCallback(() => {
    audioRef.current?.unlock();
    setForcedLandscape(true);
    setShowTouchControls(true);
  }, []);

  const handleToggleMute = useCallback(() => {
    if (!audioRef.current) return;
    const next = audioRef.current.toggleMute();
    setMuted(next);
  }, []);

  const handleSelectStageFromMenu = useCallback((stageId: StageId) => {
    setSelectedStage(stageId);
    const meta = STAGES.find((s) => s.id === stageId);
    if (meta) {
      setSelectedNinjutsu(meta.requiredJutsu);
    }
  }, []);

  const handleStartGame = useCallback(() => {
    audioRef.current?.unlock();
    if (detectTouchCapable()) {
      setShowTouchControls(true);
      void tryLockLandscapeOrientation();
    }
    const stMeta = STAGES.find((s) => s.id === selectedStage) ?? STAGES[0];
    setHud({
      ...INITIAL_HUD,
      stageId: selectedStage,
      stageIndex: stMeta.index,
      stageTitle: stMeta.title,
      activeNinjutsu: selectedNinjutsu,
      requiredJutsu: stMeta.requiredJutsu,
      requiredJutsuBroken: false,
      clonesCount: 0,
      nightVisionTimer: 0,
      denseFog: Boolean(stMeta.denseFog),
      weatherKind: 'rain',
      weatherLabel: 'Chuva',
      weatherEffect: '-Visib. / Detecção 55%',
      weatherDetectionPct: 55,
      weatherDetectionRange: 460,
      weatherTacticalTip: 'Chuva abafa passos · Distância média',
      activeHazardWarning: null,
      difficulty,
      performance: INITIAL_HUD.performance,
    });
    setScreen('LOADING_STAGE');
  }, [selectedStage, selectedNinjutsu, difficulty, tryLockLandscapeOrientation]);

  const handleFinishStageLoading = useCallback(() => {
    engineRef.current?.selectNinjutsu(selectedNinjutsuRef.current);
    engineRef.current?.setPaused(false);
    setScreen('PLAYING');
  }, []);

  const handlePause = useCallback(() => {
    if (screen !== 'PLAYING') return;
    engineRef.current?.clearTouchInputs();
    engineRef.current?.setPaused(true);
    setScreen('PAUSED');
  }, [screen]);

  const handleResume = useCallback(() => {
    if (screen !== 'PAUSED') return;
    engineRef.current?.setPaused(false);
    setScreen('PLAYING');
  }, [screen]);

  const handleSwitchStage = useCallback(
    (nextStageId: StageId, carryScore = 0, carryCampaign = false) => {
      audioRef.current?.unlock();
      setSelectedStage(nextStageId);
      const artToUse = selectedNinjutsuRef.current;
      if (engineRef.current) {
        engineRef.current.resetStage(nextStageId, difficulty, carryScore, carryCampaign);
        engineRef.current.selectNinjutsu(artToUse);
        engineRef.current.start();
        engineRef.current.setPaused(true);
      }
      setScreen('LOADING_STAGE');
    },
    [difficulty]
  );

  const handleNextStage = useCallback(() => {
    const idx = STAGES.findIndex((s) => s.id === hud.stageId);
    const nextStage = STAGES[Math.min(STAGES.length - 1, idx + 1)];
    handleSwitchStage(nextStage.id, hud.score, true);
  }, [hud.stageId, hud.score, handleSwitchStage]);

  const handleRestart = useCallback(() => {
    handleSwitchStage(hud.stageId, 0, false);
  }, [hud.stageId, handleSwitchStage]);

  const handleReturnTitle = useCallback(() => {
    updateBestScoreIfHigher(hud.score);
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    setScreen('TITLE_MENU');
  }, [hud.score, updateBestScoreIfHigher]);

  const handleSelectNinjutsu = useCallback((kind: NinjutsuType) => {
    setSelectedNinjutsu(kind);
    engineRef.current?.selectNinjutsu(kind);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (showAchievements) {
          e.preventDefault();
          setShowAchievements(false);
          return;
        }
        if (screen === 'PLAYING') {
          e.preventDefault();
          handlePause();
        } else if (screen === 'PAUSED') {
          e.preventDefault();
          handleResume();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screen, showAchievements, handlePause, handleResume]);

  const handleTouchMove = useCallback((dir: 'left' | 'right' | 'up' | 'down', active: boolean) => {
    engineRef.current?.setTouchMove(dir, active);
  }, []);

  const handleTouchAction = useCallback(
    (action: 'attack' | 'shuriken' | 'jump' | 'dash' | 'special' | 'moonFury') => {
      engineRef.current?.triggerTouchAction(action);
    },
    []
  );

  const unlockedCount = ACHIEVEMENTS.filter((a) => Boolean(achievementStore.unlocked[a.id])).length;
  const isRotated90 = isPortraitMobile && forcedLandscape;
  const showRotatePrompt = isPortraitMobile && !forcedLandscape;

  return (
    <main className="relative w-[100dvw] h-[100dvh] overflow-hidden bg-[#070B14]">
      <div
        className="relative overflow-hidden bg-[#070B14]"
        style={
          isRotated90
            ? {
                position: 'fixed',
                top: 0,
                left: '100dvw',
                width: '100dvh',
                height: '100dvw',
                transform: 'rotate(90deg)',
                transformOrigin: 'top left',
              }
            : {
                width: '100%',
                height: '100%',
              }
        }
      >
        {screen === 'TITLE_MENU' ? (
          <TitleScreen
            selectedStage={selectedStage}
            selectedNinjutsu={selectedNinjutsu}
            difficulty={difficulty}
            bestScore={bestScore}
            muted={muted}
            isFullscreen={isFullscreen}
            isTouchDevice={isTouchDevice}
            unlockedAchievements={unlockedCount}
            totalAchievements={ACHIEVEMENTS.length}
            achievementsModalOpen={showAchievements}
            onSelectStage={handleSelectStageFromMenu}
            onSelectNinjutsu={handleSelectNinjutsu}
            onSelectDifficulty={setDifficulty}
            onToggleMute={handleToggleMute}
            onToggleFullscreen={handleToggleFullscreen}
            onOpenAchievements={() => setShowAchievements(true)}
            onStart={handleStartGame}
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center bg-[#070B14]">
            <canvas
              ref={canvasRef}
              width={LOGICAL_WIDTH}
              height={LOGICAL_HEIGHT}
              className="touch-control-surface w-full h-full object-contain block"
            />

            {screen !== 'LOADING_STAGE' && (
              <GameHud
                hud={hud}
                muted={muted}
                showTouchControls={showTouchControls}
                rotated90={isRotated90}
                isFullscreen={isFullscreen}
                onToggleTouchControls={() => setShowTouchControls((prev) => !prev)}
                onToggleFullscreen={handleToggleFullscreen}
                onToggleMute={handleToggleMute}
                onPause={handlePause}
                onSelectNinjutsu={handleSelectNinjutsu}
                onTouchMove={handleTouchMove}
                onTouchAction={handleTouchAction}
              />
            )}

            {screen === 'LOADING_STAGE' && (
              <StageLoadingScreen
                stageId={selectedStage}
                difficulty={difficulty}
                selectedNinjutsu={selectedNinjutsu}
                isTouchDevice={isTouchDevice}
                onSelectNinjutsu={handleSelectNinjutsu}
                onComplete={handleFinishStageLoading}
              />
            )}

            {screen !== 'LOADING_STAGE' && <BossIntroOverlay bossIntro={hud.bossIntro} />}

            {(screen === 'PAUSED' ||
              screen === 'STAGE_CLEAR' ||
              screen === 'VICTORY' ||
              screen === 'GAME_OVER') && (
              <GameModal
                mode={screen}
                hud={hud}
                unlockedAchievements={unlockedCount}
                totalAchievements={ACHIEVEMENTS.length}
                onOpenAchievements={() => setShowAchievements(true)}
                onResume={screen === 'PAUSED' ? handleResume : undefined}
                onNextStage={screen === 'STAGE_CLEAR' ? handleNextStage : undefined}
                onSelectStage={(stageId) => handleSwitchStage(stageId, 0)}
                onRestart={handleRestart}
                onReturnTitle={handleReturnTitle}
              />
            )}
          </div>
        )}

        <AchievementToast toasts={toasts} />

        {showAchievements && (
          <AchievementsModal
            store={achievementStore}
            bestiaryStore={bestiaryStore}
            onClose={() => setShowAchievements(false)}
          />
        )}
      </div>

      {showRotatePrompt && (
        <MobileOrientationOverlay
          onRequestLandscapeFullscreen={handleRequestLandscapeFullscreen}
          onEnableForcedLandscape={handleEnableForcedLandscape}
        />
      )}
    </main>
  );
}
