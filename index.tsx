import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";

// --- SYSTEM CONFIG CONTEXT ---
const SystemConfigContext = createContext({
  isSystemGodMode: false,
  setSystemGodMode: (val: boolean) => {},
  accentColor: '#0a84ff',
  setAccentColor: (val: string) => {},
  systemName: 'IanOS',
  setSystemName: (val: string) => {}
});

const useSystemConfig = () => useContext(SystemConfigContext);

const SystemConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSystemGodMode, setIsSystemGodModeState] = useState(() => JSON.parse(localStorage.getItem('ianOS-system-god-mode') || 'false'));
    const [accentColor, setAccentColorState] = useState(() => localStorage.getItem('ianOS-accent-color') || '#0a84ff');
    const [systemName, setSystemNameState] = useState(() => localStorage.getItem('ianOS-system-name') || 'IanOS');

    useEffect(() => {
        document.documentElement.style.setProperty('--accent-color', accentColor);
    }, [accentColor]);

    const setSystemGodMode = (val: boolean) => {
        localStorage.setItem('ianOS-system-god-mode', JSON.stringify(val));
        setIsSystemGodModeState(val);
    };

    const setAccentColor = (val: string) => {
        localStorage.setItem('ianOS-accent-color', val);
        setAccentColorState(val);
    };

    const setSystemName = (val: string) => {
        localStorage.setItem('ianOS-system-name', val);
        setSystemNameState(val);
    };

    return (
        <SystemConfigContext.Provider value={{ isSystemGodMode, setSystemGodMode, accentColor, setAccentColor, systemName, setSystemName }}>
            {children}
        </SystemConfigContext.Provider>
    );
};

// --- APP CONTEXT ---
const ALL_AVAILABLE_APPS: AppConfig[] = [
  { id: 'telefone', name: 'Telefone', icon: '📞', description: 'Faça chamadas e gerencie contatos.' },
  { id: 'email', name: 'Email', icon: '✉️', description: 'Conecte-se às suas caixas de entrada.' },
  { id: 'mensagens', name: 'Mensagens', icon: '💬', description: 'Envie mensagens de texto e converse com a IA.' },
  { id: 'musica', name: 'Música', icon: '🎵', description: 'Ouça suas playlists favoritas.' },
  { id: 'navegador', name: 'Navegador', icon: '🌐', description: 'Navegue na web com busca por IA.' },
  { id: 'navegador-pro', name: 'Navegador Pro', icon: '💎', description: 'Melhoria oficial para o Navegador com interface híbrida, abas e Modo Deus.' },
  { id: 'fotos', name: 'Fotos', icon: '🖼️', description: 'Visualize e gerencie suas fotos.' },
  { id: 'camera', name: 'Câmera', icon: '📷', description: 'Capture fotos com a câmera do dispositivo.' },
  { id: 'notas', name: 'Notas', icon: '📝', description: 'Anote suas ideias rapidamente.' },
  { id: 'ajustes', name: 'Ajustes', icon: '⚙️', description: 'Personalize as configurações do sistema.' },
  { id: 'ian-help', name: 'Ian-help', icon: '🤖', description: 'Seu assistente pessoal de IA.' },
  { id: 'bloquear', name: 'Bloquear', icon: '🔒', description: 'Acesse as opções de energia e bloqueio.' },
  { id: 'midi', name: 'MIDI', icon: '🎹', description: 'Conecte dispositivos MIDI e toque.' },
  { id: 'ian-store', name: 'Ian Store', icon: '🛍️', description: 'Descubra e instale novos aplicativos.' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', description: 'Assista seus vídeos favoritos.' },
  { id: 'calculadora', name: 'Calculadora', icon: '🔢', description: 'Realize cálculos simples e complexos.' },
  { id: 'calendario', name: 'Calendário', icon: '📅', description: 'Organize seus eventos e compromissos.' },
  { id: 'about-ianos', name: 'About IanOS', icon: 'ℹ️', description: 'Informações sobre o sistema operacional.' },
  { id: 'app-drawer', name: 'Apps', icon: '⠿', description: 'Veja todos os seus aplicativos.' },
  { id: 'system-trap', name: 'System Trap', icon: '🧩', description: 'Um aplicativo do qual você só pode sair com um botão.' },
  { id: 'ian-defender', name: 'Ian Defender', icon: '🛡️', description: 'Proteja seu sistema contra ameaças.' },
  { id: 'paint', name: 'Paint', icon: '🎨', description: 'Desenhe e rabisque suas ideias.' },
];

const DEFAULT_INSTALLED_APPS = [
    'telefone', 'email', 'mensagens', 'musica', 'navegador',
    'fotos', 'camera', 'notas', 'ajustes', 'ian-help', 'midi', 'ian-store',
    'calculadora', 'calendario', 'bloquear', 'about-ianos', 'app-drawer', 'ian-defender', 'paint'
];
const dockApps: string[] = ['telefone', 'mensagens', 'navegador', 'app-drawer'];

const AppContext = createContext<{
    apps: AppConfig[];
    installApp: (id: string) => void;
    uninstallApp: (id: string) => void;
    isAppInstalled: (id: string) => boolean;
    reorderApps: (draggedId: string, targetId: string) => void;
}>({
    apps: [],
    installApp: () => {},
    uninstallApp: () => {},
    isAppInstalled: () => false,
    reorderApps: () => {},
});

const useApps = () => useContext(AppContext);

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [installedAppIds, setInstalledAppIds] = useState(() => {
        const saved = localStorage.getItem('ianOS-installed-apps');
        return saved ? JSON.parse(saved) : DEFAULT_INSTALLED_APPS;
    });

    useEffect(() => {
        localStorage.setItem('ianOS-installed-apps', JSON.stringify(installedAppIds));
    }, [installedAppIds]);

    const installApp = (id: string) => {
        if (!installedAppIds.includes(id)) {
            setInstalledAppIds([...installedAppIds, id]);
        }
    };

    const uninstallApp = (id: string) => {
        if (['ajustes', 'ian-store', 'ian-defender'].includes(id)) return;
        setInstalledAppIds(installedAppIds.filter((appId: string) => appId !== id));
    };

    const isAppInstalled = (id: string) => installedAppIds.includes(id);

    const reorderApps = useCallback((draggedId: string, targetId: string) => {
        setInstalledAppIds(currentIds => {
            const fromIndex = currentIds.indexOf(draggedId);
            const toIndex = currentIds.indexOf(targetId);
            if (fromIndex === -1 || toIndex === -1 || dockApps.includes(targetId)) return currentIds;
            const newIds = [...currentIds];
            const [removed] = newIds.splice(fromIndex, 1);
            newIds.splice(toIndex, 0, removed);
            return newIds;
        });
    }, []);

    const apps = installedAppIds
        .map((id: string) => ALL_AVAILABLE_APPS.find(app => app.id === id))
        .filter((app): app is AppConfig => !!app);

    return (
        <AppContext.Provider value={{ apps, installApp, uninstallApp, isAppInstalled, reorderApps }}>
            {children}
        </AppContext.Provider>
    );
};


// --- WALLPAPER CONTEXT ---
const DEFAULT_LOCK_WALLPAPER = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop';
const DEFAULT_HOME_WALLPAPER = '';

const WallpaperContext = createContext({
  lockWallpaper: DEFAULT_LOCK_WALLPAPER,
  setLockWallpaper: (url: string) => {},
  homeWallpaper: DEFAULT_HOME_WALLPAPER,
  setHomeWallpaper: (url: string) => {},
});

const useWallpaper = () => useContext(WallpaperContext);

const WallpaperProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lockWallpaper, setLockWallpaperState] = useState(() => {
        return localStorage.getItem('ianOS-lock-wallpaper') || DEFAULT_LOCK_WALLPAPER;
    });
    const [homeWallpaper, setHomeWallpaperState] = useState(() => {
        return localStorage.getItem('ianOS-home-wallpaper') || DEFAULT_HOME_WALLPAPER;
    });

    const setLockWallpaper = (url: string) => {
        localStorage.setItem('ianOS-lock-wallpaper', url);
        setLockWallpaperState(url);
    };

    const setHomeWallpaper = (url: string) => {
        localStorage.setItem('ianOS-home-wallpaper', url);
        setHomeWallpaperState(url);
    };
    
    return (
        <WallpaperContext.Provider value={{ lockWallpaper, setLockWallpaper, homeWallpaper, setHomeWallpaper }}>
            {children}
        </WallpaperContext.Provider>
    );
};


// --- SOUND CONTEXT ---
const SoundContext = createContext({
  playSound: (type: string) => {},
  isSoundEnabled: true,
  setIsSoundEnabled: (value: boolean) => {},
  volume: 0.5,
  setVolume: (value: number) => {}
});

const useSounds = () => useContext(SoundContext);

const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSoundEnabled, setIsSoundEnabledState] = useState(() => {
    const saved = localStorage.getItem('ianOS-sound-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem('ianOS-sound-volume');
    return saved !== null ? JSON.parse(saved) : 0.5;
  });
  
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const initAudio = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        document.removeEventListener('click', initAudio);
    };
    document.addEventListener('click', initAudio);
  }, []);

  const playSound = (type: string) => {
    if (!isSoundEnabled || !audioCtxRef.current) return;
    const audioCtx = audioCtxRef.current;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
    oscillator.connect(gainNode);
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    switch(type) {
      case 'open':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440.0, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.2);
        break;
      case 'close':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(330.0, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.2);
        break;
      case 'click':
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(880.0, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
        break;
      case 'camera-shutter':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        break;
      case 'notification':
         oscillator.type = 'triangle';
         oscillator.frequency.setValueAtTime(1046.50, audioCtx.currentTime);
         gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.3);
         break;
    }
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.2);
  };
  
  const setIsSoundEnabled = (value: boolean) => {
      localStorage.setItem('ianOS-sound-enabled', JSON.stringify(value));
      setIsSoundEnabledState(value);
  };
  
  const setVolume = (value: number) => {
      localStorage.setItem('ianOS-sound-volume', JSON.stringify(value));
      setVolumeState(value);
  };

  return (
    <SoundContext.Provider value={{ playSound, isSoundEnabled, setIsSoundEnabled, volume, setVolume }}>
      {children}
    </SoundContext.Provider>
  );
};

// --- BETA MODE CONTEXT ---
const BetaModeContext = createContext({
  isBetaMode: false,
  setIsBetaMode: (value: boolean) => {},
});

const useBetaMode = () => useContext(BetaModeContext);

const BetaModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isBetaMode, setIsBetaModeState] = useState(() => {
        const saved = localStorage.getItem('ianOS-beta-mode');
        return saved ? JSON.parse(saved) : false;
    });
    // Fix: Using correct parameter 'value' instead of undefined 'val'
    const setIsBetaMode = (value: boolean) => {
        localStorage.setItem('ianOS-beta-mode', JSON.stringify(value));
        setIsBetaModeState(value);
    };
    return (
        <BetaModeContext.Provider value={{ isBetaMode, setIsBetaMode }}>
            {children}
        </BetaModeContext.Provider>
    );
};

// --- DEFENDER CONTEXT ---
const DefenderContext = createContext({
  isDefenderEnabled: true,
  setIsDefenderEnabled: (value: boolean) => {},
});

const useDefender = () => useContext(DefenderContext);

const DefenderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDefenderEnabled, setIsDefenderEnabledState] = useState(() => {
        const saved = localStorage.getItem('ianOS-defender-enabled');
        return saved ? JSON.parse(saved) : true;
    });
    const setIsDefenderEnabled = (value: boolean) => {
        localStorage.setItem('ianOS-defender-enabled', JSON.stringify(value));
        setIsDefenderEnabledState(value);
    };
    return (
        <DefenderContext.Provider value={{ isDefenderEnabled, setIsDefenderEnabled }}>
            {children}
        </DefenderContext.Provider>
    );
};

// --- PERMISSIONS CONTEXT ---
type PermissionType = 'camera' | 'midi';
type PermissionRequest = { appName: string; permission: PermissionType; onResolve: (granted: boolean) => void; };

const PermissionsContext = createContext<{
  hasPermission: (permission: PermissionType) => boolean;
  requestPermission: (appName: string, permission: PermissionType) => Promise<boolean>;
}>({
  hasPermission: () => false,
  requestPermission: () => Promise.resolve(false),
});

const usePermissions = () => useContext(PermissionsContext);

const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [permissions, setPermissions] = useState<Record<PermissionType, boolean>>(() => {
        const saved = localStorage.getItem('ianOS-permissions');
        return saved ? JSON.parse(saved) : {};
    });
    const [permissionRequest, setPermissionRequest] = useState<PermissionRequest | null>(null);
    const { playSound } = useSounds();
    useEffect(() => {
        localStorage.setItem('ianOS-permissions', JSON.stringify(permissions));
    }, [permissions]);
    const hasPermission = (permission: PermissionType) => !!permissions[permission];
    const requestPermission = (appName: string, permission: PermissionType): Promise<boolean> => {
        return new Promise((resolve) => {
            if (hasPermission(permission)) {
                resolve(true);
            } else {
                playSound('notification');
                setPermissionRequest({ appName, permission, onResolve: resolve });
            }
        });
    };
    const handlePermissionResponse = (granted: boolean) => {
        if (!permissionRequest) return;
        if (granted) {
            playSound('open');
            setPermissions(prev => ({ ...prev, [permissionRequest.permission]: true }));
        } else {
            playSound('close');
        }
        permissionRequest.onResolve(granted);
        setPermissionRequest(null);
    };
    const PermissionModal = () => {
      if (!permissionRequest) return null;
      const permissionTextMap = { camera: 'Câmera', midi: 'Dispositivos MIDI' };
      return (
        <div className="permission-modal-overlay">
          <div className="permission-modal-content">
            <h3>Solicitação de Permissão</h3>
            <p>O aplicativo "<strong>{permissionRequest.appName}</strong>" deseja acessar seu/sua <strong>{permissionTextMap[permissionRequest.permission]}</strong>.</p>
            <div className="permission-modal-buttons">
              <button className="permission-deny-btn" onClick={() => handlePermissionResponse(false)}>Negar</button>
              <button className="permission-allow-btn" onClick={() => handlePermissionResponse(true)}>Permitir</button>
            </div>
          </div>
        </div>
      );
    };
    return (
        <PermissionsContext.Provider value={{ hasPermission, requestPermission }}>
            {children}
            <PermissionModal />
        </PermissionsContext.Provider>
    );
};

// --- PIN CONTEXT ---
const PinContext = createContext<{
  pin: string | null;
  setPin: (pin: string) => void;
  removePin: () => void;
}>({ pin: null, setPin: () => {}, removePin: () => {} });

const usePin = () => useContext(PinContext);

const PinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [pin, setPinState] = useState<string | null>(() => localStorage.getItem('ianOS-pin'));
    const setPin = (newPin: string) => {
        localStorage.setItem('ianOS-pin', newPin);
        setPinState(newPin);
    };
    const removePin = () => {
        localStorage.removeItem('ianOS-pin');
        setPinState(null);
    };
    return (
        <PinContext.Provider value={{ pin, setPin, removePin }}>
            {children}
        </PinContext.Provider>
    );
};

// --- SVG ICONS ---
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

const FullscreenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const BackspaceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>
);

// --- LOCK SCREEN ---
const LockScreen = ({ onUnlock }: { onUnlock: () => void }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const { pin: storedPin } = usePin();
  const { lockWallpaper } = useWallpaper();
  const handlePinInput = (num: string) => { if (pin.length < 4) setPin(pin + num); };
  const handleBackspace = () => { setPin(pin.slice(0, -1)); };
  useEffect(() => {
    if (pin.length === 4) {
      if(pin === storedPin) onUnlock();
      else { setError(true); setPin(''); setTimeout(() => setError(false), 500); }
    }
  }, [pin, storedPin, onUnlock]);
  const PinPad = () => (
    <div className={`pin-pad ${error ? 'shake' : ''}`}>
      <div className="pin-dots">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`}></div>))}</div>
       <p className="pin-prompt">Digite o PIN</p>
      <div className="pin-keypad">
        {'123456789'.split('').map(num => (<button key={num} onClick={() => handlePinInput(num)}>{num}</button>))}
        <div></div><button onClick={() => handlePinInput('0')}>0</button><button onClick={handleBackspace}><BackspaceIcon/></button>
      </div>
    </div>
  );
  return (
    <div className="lock-screen" onClick={!storedPin ? onUnlock : undefined} style={{ backgroundImage: `url(${lockWallpaper})`}}>
      <div className="lock-screen-content">
        <div className="time-display">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        <div className="date-display">{new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        {storedPin ? <PinPad/> : <p className="unlock-prompt">Toque para desbloquear</p>}
      </div>
    </div>
  );
};

// --- STATUS BAR ---
const StatusBar = () => {
  const [time, setTime] = useState(new Date());
  const { isSystemGodMode, systemName } = useSystemConfig();
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="status-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {isSystemGodMode && <span style={{ color: 'gold', fontSize: '0.8rem' }}>👑</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{systemName}</span>
          <span>📶</span><span>🔋</span>
      </div>
    </div>
  );
};

// --- APP WINDOW ---
type AppWindowProps = {
  app: AppConfig;
  onClose: (id: string) => void;
  setActiveApp: (id: string | null) => void;
  onAppOpen: (id: string) => void;
  onLock: () => void;
  onRestart: () => void;
  onShutdown: () => void;
  onReset: () => void;
};
const AppWindow: React.FC<AppWindowProps> = ({ app, onClose, setActiveApp, onAppOpen, onLock, onRestart, onShutdown, onReset }) => {
  const [isClosing, setIsClosing] = useState(false);
  const { playSound } = useSounds();
  const handleClose = () => { setIsClosing(true); playSound('close'); setTimeout(() => onClose(app.id), 300); };
  const getAppComponent = () => {
    switch(app.id) {
        case 'notas': return <NotesApp/>;
        case 'camera': return <CameraApp />;
        case 'fotos': return <PhotosApp />;
        case 'ian-help': return <IanHelpApp />;
        case 'telefone': return <PhoneApp setActiveApp={setActiveApp} />;
        case 'email': return <EmailApp />;
        case 'mensagens': return <IanHelpApp />;
        case 'musica': return <MusicApp />;
        case 'navegador': return <BrowserApp />;
        case 'ajustes': return <SettingsApp />;
        case 'midi': return <MidiApp />;
        case 'ian-store': return <IanStoreApp />;
        case 'youtube': return <YouTubeApp />;
        case 'calculadora': return <CalculatorApp />;
        case 'calendario': return <CalendarApp />;
        case 'about-ianos': return <AboutIanOSApp />;
        case 'app-drawer': return <AppDrawerApp onAppOpen={onAppOpen} onClose={handleClose} />;
        case 'system-trap': return <SystemTrapApp onReset={onReset} />;
        case 'ian-defender': return <IanDefenderApp />;
        case 'paint': return <PaintApp />;
        case 'bloquear': return <LockApp onLock={onLock} onRestart={onRestart} onShutdown={onShutdown} onReset={onReset} />;
        default: return <div className="app-placeholder"><p>{app.name}</p><p>App em construção.</p></div>;
    }
  }
  const isFullScreen = ['camera', 'fotos', 'telefone', 'email', 'musica', 'navegador', 'midi', 'youtube', 'app-drawer', 'system-trap', 'paint'].includes(app.id);
  return (
    <div className={`app-window-container ${isClosing ? 'modernFadeOut' : 'modernFadeIn'}`}>
      <div className="app-window">
        <div className="app-header">
            <div className="app-header-handle"></div><span>{app.name}</span>
            {app.id !== 'system-trap' && <button onClick={handleClose} className="close-btn">×</button>}
        </div>
        <div className={`app-content ${isFullScreen ? 'fullscreen' : ''}`}>{getAppComponent()}</div>
      </div>
    </div>
  );
};

// --- APP DEFINITIONS ---
type AppConfig = { id: string; name: string; icon: string; description?: string; };

// --- GENERIC APP COMPONENTS ---
const PermissionRequired: React.FC<{ appName: string, permission: string, onGrant: () => void }> = ({ appName, permission, onGrant }) => (
  <div className="permission-required-view">
    <div className="permission-required-icon">🚫</div>
    <h2>Permissão Necessária</h2>
    <p>O aplicativo "{appName}" precisa de acesso ao seu/sua {permission} para funcionar.</p>
    <button onClick={onGrant}>Conceder Permissão</button>
  </div>
);

// --- INDIVIDUAL APP COMPONENTS ---

const LockApp = ({ onLock, onRestart, onShutdown, onReset }: { onLock: () => void, onRestart: () => void, onShutdown: () => void, onReset: () => void }) => (
    <div className="lock-app-container">
        <button className="lock-app-button" onClick={onLock}><span>🔒</span> Bloquear Tela</button>
        <button className="lock-app-button" onClick={onRestart}><span>🔄</span> Reiniciar</button>
        <button className="lock-app-button" onClick={onShutdown}><span>🔌</span> Desligar</button>
        <button className="lock-app-button danger" onClick={onReset}><span>🗑️</span> Resetar Sistema</button>
    </div>
);

const IanDefenderApp = () => {
    const { isDefenderEnabled, setIsDefenderEnabled } = useDefender();
    return (
        <div className="ian-defender-app">
            <div className="ian-defender-header"><div className="ian-defender-icon">🛡️</div><h2>Ian Defender</h2></div>
            <div className="settings-section">
                <h3>Proteção em Tempo Real</h3>
                <div className="settings-item"><span>Verificar aplicativos</span><label className="switch"><input type="checkbox" checked={isDefenderEnabled} onChange={() => setIsDefenderEnabled(!isDefenderEnabled)} /><span className="slider round"></span></label></div>
            </div>
        </div>
    );
};

const SystemTrapApp: React.FC<{ onReset: () => void; }> = ({ onReset }) => {
    return (
        <div className="system-trap-app">
            <h1>System Trap</h1>
            <div className="button-container">
                <button onClick={() => window.location.reload()}>leave to sistem</button>
                <button className="factory-reset-btn" onClick={onReset}>factory reset</button>
            </div>
        </div>
    );
};

const AppDrawerApp: React.FC<{ onAppOpen: (id: string) => void; onClose: () => void; }> = ({ onAppOpen, onClose }) => {
    const { apps } = useApps();
    const [searchTerm, setSearchTerm] = useState('');
    const filteredApps = apps.filter(app => app.name.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name));
    return (
        <div className="app-drawer-app">
            <div className="app-drawer-search"><SearchIcon /><input type="text" placeholder="Pesquisar aplicativos" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus /></div>
            <div className="app-drawer-grid">
                {filteredApps.map(app => (<div key={app.id} className="app-icon" onClick={() => { onClose(); setTimeout(() => onAppOpen(app.id), 300); }}><div className="icon">{app.icon}</div><span>{app.name}</span></div>))}
            </div>
        </div>
    );
};

const IanStoreApp = () => {
    const { installApp, uninstallApp, isAppInstalled } = useApps();
    const { playSound } = useSounds();
    const { isDefenderEnabled } = useDefender();
    const [showAntivirusWarning, setShowAntivirusWarning] = useState(false);
    const handleInstall = (id: string) => {
        if (id === 'system-trap' && isDefenderEnabled) setShowAntivirusWarning(true);
        else { playSound('open'); installApp(id); }
    };
    return (
        <div className="ian-store-app">
            {showAntivirusWarning && <div className="antivirus-modal-overlay"><div className="antivirus-modal-content"><h3>🛡️ IAN DEFENDER</h3><p>O aplicativo "System Trap" é perigoso.</p><button onClick={() => { setShowAntivirusWarning(false); installApp('system-trap'); }}>Instalar Mesmo Assim</button><button onClick={() => setShowAntivirusWarning(false)}>Cancelar</button></div></div>}
            <h2>Ian Store</h2>
            <div className="store-app-list">
                {ALL_AVAILABLE_APPS.map(app => (
                    <div key={app.id} className="store-app-item">
                        <div className="store-app-icon">{app.icon}</div>
                        <div className="store-app-details"><h3>{app.name}</h3><p>{app.description}</p></div>
                        <div className="store-app-action">
                            {isAppInstalled(app.id) ? <button className="uninstall-btn" onClick={() => uninstallApp(app.id)} disabled={['ajustes', 'ian-store'].includes(app.id)}>Desinstalar</button> : <button className="install-btn" onClick={() => handleInstall(app.id)}>Instalar</button>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const NotesApp = () => {
  type Note = { id: string; title: string; content: string; };
  const [notes, setNotes] = useState<Note[]>(() => JSON.parse(localStorage.getItem('ianOS-notes') || '[]'));
  const [activeNoteId, setActiveNoteId] = useState<string | null>(notes.length > 0 ? notes[0].id : null);
  useEffect(() => localStorage.setItem('ianOS-notes', JSON.stringify(notes)), [notes]);
  const activeNote = notes.find(n => n.id === activeNoteId);
  return (
    <div className="notes-app">
      <div className="notes-sidebar">
        <button onClick={() => { const n = { id: Date.now().toString(), title: '', content: '' }; setNotes([n, ...notes]); setActiveNoteId(n.id); }}>+</button>
        <div className="notes-list">{notes.map(n => (<div key={n.id} className={`note-item ${n.id === activeNoteId ? 'active' : ''}`} onClick={() => setActiveNoteId(n.id)}><h3>{n.title || 'Nova Nota'}</h3></div>))}</div>
      </div>
      <div className="note-editor">
        {activeNote && <textarea className="note-content-textarea" value={activeNote.content} onChange={e => setNotes(notes.map(n => n.id === activeNote.id ? {...n, content: e.target.value} : n))} />}
      </div>
    </div>
  );
};

const CameraApp = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const { hasPermission, requestPermission } = usePermissions();
    const granted = hasPermission('camera');
    useEffect(() => {
        if (!granted) return;
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(s => { if(videoRef.current) videoRef.current.srcObject = s; });
    }, [granted]);
    if (!granted) return <PermissionRequired appName="Câmera" permission="Câmera" onGrant={() => requestPermission('Câmera', 'camera')} />;
    return <div className="camera-app"><video ref={videoRef} autoPlay playsInline className="camera-feed" /><button className="shutter-btn" onClick={() => {}} /></div>;
};

const PhotosApp = () => {
    const photos = JSON.parse(localStorage.getItem('ianOS-photos') || '[]');
    return <div className="photos-grid">{photos.map((p: any) => (<div key={p.id} className="photo-item"><img src={p.src} /></div>))}</div>;
};

const IanHelpApp = () => {
  const [messages, setMessages] = useState([{ text: 'Olá! Como posso ajudar?', sender: 'bot' }]);
  const [input, setInput] = useState('');
  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { text: input, sender: 'user' }]);
    setInput('');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: input });
    setMessages(prev => [...prev, { text: res.text || 'Erro.', sender: 'bot' }]);
  };
  return (
    <div className="ian-help-app">
      <div className="chat-messages">{messages.map((m, i) => (<div key={i} className={`message ${m.sender}`}><p>{m.text}</p></div>))}</div>
      <div className="chat-input-area"><input type="text" value={input} onChange={e => setInput(e.target.value)} /><button onClick={handleSend}>Enviar</button></div>
    </div>
  );
};

const PhoneApp = ({ setActiveApp }: any) => <div className="app-placeholder">Telefone</div>;
const EmailApp = () => <div className="app-placeholder">Email</div>;
const MusicApp = () => <div className="music-app"><iframe src="https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M" width="100%" height="100%" frameBorder="0" loading="lazy"></iframe></div>;

const BROWSER_PRO_HTML = `<!DOCTYPE html>
<html lang="pt-PT">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Ian Navegador - Pro</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        :root {
            --safe-bottom: env(safe-area-inset-bottom, 0px);
            --header-height: 60px;
            --footer-height: 65px;
        }

        body, html {
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            transition: background-color 0.3s;
        }

        #godModeOverlay {
            position: fixed;
            inset: 0;
            background: #000;
            z-index: 9999;
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 20px;
        }

        .god-btn {
            padding: 16px 32px;
            border: 1px solid #333;
            background: #111;
            color: #eee;
            cursor: pointer;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
            width: 250px; text-align: center;
        }

        .god-btn:hover {
            background: #222;
            border-color: #555;
            transform: scale(1.05);
        }

        .god-btn.active-feature {
            border-color: #8ab4f8;
            color: #8ab4f8;
            background: #1a222f;
        }

        .browser-ui {
            height: 100%;
            display: flex;
            flex-direction: column;
            background-color: #1a1a1a;
            color: #e8eaed;
        }

        #deviceSelector {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.95);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(15px);
        }

        .selector-card {
            background: #2d2d2d;
            padding: 40px;
            border-radius: 32px;
            text-align: center;
            max-width: 450px;
            width: 90%;
            color: white;
        }

        .device-option {
            background: #3c4043;
            border: 2px solid #444;
            transition: all 0.3s;
        }

        .device-option:hover {
            border-color: #8ab4f8;
        }

        .is-desktop .bottom-nav { display: none; }
        .is-desktop .desktop-tabs { display: flex; }
        .is-mobile .desktop-tabs { display: none; }
        .is-mobile .bottom-nav { display: flex; }

        .desktop-tabs {
            background: #000;
            padding: 8px 8px 0;
            display: flex;
            align-items: flex-end;
            border-bottom: 1px solid #333;
            overflow-x: auto;
        }

        .d-tab {
            background: #222;
            padding: 8px 16px;
            border-radius: 8px 8px 0 0;
            font-size: 13px;
            min-width: 140px;
            max-width: 200px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #9aa0a6;
            cursor: pointer;
            margin-right: 2px;
            white-space: nowrap;
        }

        .d-tab.active { background: #1a1a1a; color: #fff; }
        .d-tab .close-btn { margin-left: 8px; opacity: 0.6; }
        .d-tab .close-btn:hover { opacity: 1; }

        .header { height: var(--header-height); border-bottom: 1px solid #333; background: #1a1a1a; }
        .search-container { background: #2d2d2d; border-radius: 24px; }
        .search-input { background: transparent; color: #fff; outline: none; width: 100%; }

        .content-area { flex: 1; position: relative; background: #fff; }
        .tab-view { position: absolute; inset: 0; display: none; }
        .tab-view.active { display: flex; }
        iframe { width: 100%; height: 100%; border: none; }

        .bottom-nav {
            height: calc(var(--footer-height) + var(--safe-bottom));
            background: #1a1a1a;
            border-top: 1px solid #333;
            display: flex;
            justify-content: space-around;
            align-items: center;
            padding-bottom: var(--safe-bottom);
        }

        .nav-item { color: #9aa0a6; cursor: pointer; padding: 10px; }
        .nav-item.active { color: #8ab4f8; }

        .full-button-mode .config-item {
            cursor: pointer !important;
            transition: all 0.2s;
        }
        .full-button-mode #darkConfigItem.active-state {
            background: #1a73e8 !important;
            color: white !important;
        }
        .full-button-mode #interfaceConfigItem.active-state {
            background: #8e44ad !important;
            color: white !important;
        }
        .full-button-mode .config-item .toggle-ui {
            display: none !important; 
        }

        #tabsManager {
            position: fixed;
            inset: 0;
            background: #121212;
            z-index: 1000;
            display: none;
            flex-direction: column;
            padding: 20px;
        }

        .tabs-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            overflow-y: auto;
            padding-bottom: 100px;
        }

        .tab-card {
            background: #2d2d2d;
            border-radius: 12px;
            height: 150px;
            display: flex;
            flex-direction: column;
            border: 2px solid transparent;
            position: relative;
        }
        .tab-card.active { border-color: #8ab4f8; }
        .tab-card-close {
            position: absolute;
            top: 5px;
            right: 5px;
            background: rgba(0,0,0,0.5);
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            z-index: 10;
        }

        .tabs-badge {
            width: 22px; height: 22px;
            border: 2px solid currentColor;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
        }

        body.light-mode .browser-ui { background: #f8f9fa; color: black; }
        body.light-mode .header, body.light-mode .bottom-nav { background: white; border-color: #dee2e6; }
        body.light-mode .search-container { background: #f1f3f4; }
        body.light-mode .search-input { color: black; }
        body.light-mode .desktop-tabs { background: #dee1e6; }
        body.light-mode .d-tab { background: #cfd3d7; color: #495057; }
        body.light-mode .d-tab.active { background: #f8f9fa; color: black; }
    </style>
</head>
<body class="is-mobile">
    <div id="godModeOverlay" tabindex="-1">
        <button id="toggleFullBtnFeature" onclick="toggleFullButtonFeature()" class="god-btn">
            Alternar Estilo de Controlos
        </button>
        <button onclick="exitGodMode()" class="god-btn" style="border-color: #ff4444; color: #ff4444;">
            Sair do Modo Deus
        </button>
    </div>
    <div id="deviceSelector">
        <div class="selector-card">
            <h2 class="text-3xl font-bold mb-4">Ian Navegador</h2>
            <p class="text-gray-400">Selecione o modo de visualização:</p>
            <div class="grid grid-cols-2 gap-6 mt-10">
                <div onclick="setDevice('mobile')" class="device-option p-6 rounded-2xl cursor-pointer">
                    <div class="text-5xl mb-4">📱</div>
                    <div class="font-bold">Telemóvel</div>
                </div>
                <div onclick="setDevice('desktop')" class="device-option p-6 rounded-2xl cursor-pointer">
                    <div class="text-5xl mb-4">💻</div>
                    <div class="font-bold">Computador</div>
                </div>
            </div>
        </div>
    </div>
    <div class="browser-ui">
        <div class="desktop-tabs" id="desktopTabs"></div>
        <header class="header flex items-center p-3 gap-3">
            <div class="flex gap-2 px-2" id="navButtons">
                <button onclick="goBack()" class="p-1 hover:bg-gray-700 rounded-full"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg></button>
                <button onclick="goForward()" class="p-1 hover:bg-gray-700 rounded-full"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></button>
            </div>
            <div class="search-container flex-1 flex items-center gap-2 px-4 py-2">
                <svg width="16" height="16" fill="none" stroke="#9aa0a6" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input type="text" id="urlInput" class="search-input text-sm" placeholder="Pesquisar ou digitar URL" onkeydown="handleInput(event)">
            </div>
            <button onclick="refresh()" class="p-2 text-gray-400"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8m0-5v5h-5"/></svg></button>
        </header>
        <main class="content-area" id="tabsViewport"></main>
        <footer class="bottom-nav">
            <div class="nav-item" onclick="goBack()"><svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg></div>
            <div class="nav-item" onclick="goHome()"><svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg></div>
            <div class="nav-item" onclick="toggleTabsManager()"><div class="tabs-badge" id="tabsBadgeCount">1</div></div>
            <div class="nav-item" id="settingsTrigger" onclick="toggleSettings()"><svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg></div>
        </footer>
    </div>
    <div id="settingsMenu" class="fixed inset-0 bg-black/95 z-[3000] hidden flex-col p-8 text-white backdrop-blur-xl">
        <div class="flex justify-between items-center mb-12">
            <h2 class="text-3xl font-bold">Definições</h2>
            <button onclick="toggleSettings()" class="text-4xl">&times;</button>
        </div>
        <div id="settingsContainer" class="space-y-6">
            <div id="darkConfigItem" class="config-item active-state flex justify-between items-center p-6 bg-white/5 rounded-2xl" onclick="handleConfigClick('dark')">
                <div class="flex flex-col">
                    <span class="text-lg font-medium">Modo Escuro</span>
                    <span class="text-xs text-gray-400">Alternar tema visual do browser</span>
                </div>
                <div class="toggle-ui w-14 h-7 bg-blue-600 rounded-full relative flex items-center px-1 transition-colors" id="darkToggleTrack">
                    <div id="darkThumb" class="w-5 h-5 bg-white rounded-full transition-all translate-x-7"></div>
                </div>
            </div>
            <div id="interfaceConfigItem" class="config-item flex justify-between items-center p-6 bg-white/5 rounded-2xl" onclick="handleConfigClick('interface')">
                <div class="flex flex-col">
                    <span class="text-lg font-medium">Mudar Interface</span>
                    <span class="text-xs text-gray-400">Alternar entre Desktop e Mobile</span>
                </div>
                <span id="currentDeviceLabel" class="text-blue-400 font-bold toggle-ui">Telemóvel</span>
            </div>
        </div>
    </div>
    <div id="tabsManager">
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-white">Abas Abertas</h2>
            <button onclick="toggleTabsManager()" class="text-blue-400">Concluído</button>
        </div>
        <div class="tabs-grid" id="tabsGrid"></div>
        <div class="fixed bottom-0 left-0 right-0 h-24 bg-[#1a1a1a] flex justify-center items-center border-t border-white/5 gap-4">
            <button onclick="addTab()" class="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg">＋ Nova Aba</button>
        </div>
    </div>
    <script>
        const GOD_MODE_KEY = "good-mode-navegar-a-internet";
        let tabs = [{ id: Date.now(), url: '', title: 'Nova Aba' }];
        let activeId = tabs[0].id;
        let isDarkMode = true;
        let isFullButtonMode = false;

        function setDevice(type) {
            document.body.classList.remove('is-mobile', 'is-desktop');
            document.body.classList.add(type === 'mobile' ? 'is-mobile' : 'is-desktop');
            document.getElementById('deviceSelector').style.display = 'none';
            document.getElementById('currentDeviceLabel').innerText = type === 'mobile' ? 'Telemóvel' : 'Computador';
            if(isFullButtonMode) {
                document.getElementById('interfaceConfigItem').classList.toggle('active-state', type === 'desktop');
            }
            render();
        }

        function handleInput(e) {
            if (e.key === 'Enter') {
                let val = e.target.value.trim();
                if (val === GOD_MODE_KEY) { 
                    e.target.blur();
                    enterGodMode(); 
                    e.target.value = ""; 
                    return; 
                }
                if (!val) return;
                let url = val.includes('.') ? (val.startsWith('http') ? val : \`https://\${val}\`) : \`https://www.google.com/search?q=\${encodeURIComponent(val)}&igu=1\`;
                loadUrl(url);
                e.target.blur();
            }
        }

        function enterGodMode() { 
            const overlay = document.getElementById('godModeOverlay');
            overlay.style.display = 'flex'; 
            overlay.focus();
        }

        function exitGodMode() { document.getElementById('godModeOverlay').style.display = 'none'; }

        function toggleFullButtonFeature() {
            isFullButtonMode = !isFullButtonMode;
            const btn = document.getElementById('toggleFullBtnFeature');
            const container = document.getElementById('settingsContainer');
            btn.classList.toggle('active-feature', isFullButtonMode);
            container.classList.toggle('full-button-mode', isFullButtonMode);
        }

        function handleConfigClick(type) {
            if (type === 'dark') {
                isDarkMode = !isDarkMode;
                document.body.classList.toggle('light-mode', !isDarkMode);
                document.getElementById('darkThumb').style.transform = isDarkMode ? 'translateX(28px)' : 'translateX(0px)';
                document.getElementById('darkToggleTrack').style.backgroundColor = isDarkMode ? '#2563eb' : '#4b5563';
                document.getElementById('darkConfigItem').classList.toggle('active-state', isDarkMode);
            } else if (type === 'interface') {
                const current = document.body.classList.contains('is-mobile') ? 'desktop' : 'mobile';
                setDevice(current);
            }
        }

        function render() {
            const viewport = document.getElementById('tabsViewport');
            const dTabs = document.getElementById('desktopTabs');
            viewport.innerHTML = ''; 
            dTabs.innerHTML = '';
            tabs.forEach(tab => {
                const dTab = document.createElement('div');
                dTab.className = \`d-tab \${tab.id === activeId ? 'active' : ''}\`;
                dTab.onclick = () => switchTab(tab.id);
                dTab.innerHTML = \`
                    <span class="truncate">\${tab.title}</span>
                    <span class="close-btn" onclick="event.stopPropagation(); closeTab(\${tab.id})">&times;</span>
                \`;
                dTabs.appendChild(dTab);
                const view = document.createElement('div');
                view.className = \`tab-view h-full w-full \${tab.id === activeId ? 'active' : ''}\`;
                if (tab.url === '') {
                    view.innerHTML = \`
                        <div class="flex flex-col items-center justify-center h-full bg-[#1a1a1a] text-white w-full">
                            <h1 class="text-6xl font-black text-blue-500 mb-4 italic">Ian Navegador</h1>
                            <div class="w-16 h-1 bg-blue-500 rounded-full mb-8"></div>
                            <p class="text-gray-500 tracking-widest uppercase text-xs">Hybrid Browser Pro</p>
                        </div>\`;
                } else {
                    const ifr = document.createElement('iframe'); 
                    ifr.id = \`frame-\${tab.id}\`;
                    ifr.src = tab.url; 
                    view.appendChild(ifr);
                }
                viewport.appendChild(view);
                if (tab.id === activeId) {
                    document.getElementById('urlInput').value = tab.url;
                }
            });
            document.getElementById('tabsBadgeCount').innerText = tabs.length;
        }

        function switchTab(id) {
            activeId = id;
            render();
        }

        function loadUrl(url) {
            const tab = tabs.find(t => t.id === activeId);
            tab.url = url; 
            tab.title = url.replace('https://', '').replace('http://', '').split('/')[0] || 'A carregar...'; 
            render();
        }

        function closeTab(id) {
            if (tabs.length === 1) {
                tabs = [{ id: Date.now(), url: '', title: 'Nova Aba' }];
            } else {
                tabs = tabs.filter(t => t.id !== id);
            }
            if (activeId === id) activeId = tabs[0].id;
            render();
            if(document.getElementById('tabsManager').style.display === 'flex') renderTabsGrid();
        }

        function toggleSettings() {
            const s = document.getElementById('settingsMenu');
            s.classList.toggle('hidden'); 
            s.classList.toggle('flex');
        }

        function toggleTabsManager() {
            const mgr = document.getElementById('tabsManager');
            const isOpen = mgr.style.display === 'flex';
            if (!isOpen) renderTabsGrid();
            mgr.style.display = isOpen ? 'none' : 'flex';
        }

        function renderTabsGrid() {
            const grid = document.getElementById('tabsGrid');
            grid.innerHTML = '';
            tabs.forEach(tab => {
                const card = document.createElement('div');
                card.className = \`tab-card \${tab.id === activeId ? 'active' : ''}\`;
                card.onclick = () => { switchTab(tab.id); toggleTabsManager(); };
                card.innerHTML = \`
                    <div class="tab-card-close" onclick="event.stopPropagation(); closeTab(\${tab.id})">&times;</div>
                    <div class="flex-1 bg-white/5 flex items-center justify-center text-3xl opacity-20">📄</div>
                    <div class="p-3 bg-black/40 text-white text-[10px] truncate font-bold">\${tab.title}</div>
                \`;
                grid.appendChild(card);
            });
        }

        function addTab() {
            const id = Date.now(); 
            tabs.push({ id, url: '', title: 'Nova Aba' });
            activeId = id; 
            render(); 
            if(document.getElementById('tabsManager').style.display === 'flex') renderTabsGrid();
        }

        function goHome() { 
            const tab = tabs.find(t => t.id === activeId); 
            tab.url = ''; 
            tab.title = 'Nova Aba';
            render(); 
        }

        function refresh() {
            const ifr = document.querySelector(\`.tab-view.active iframe\`);
            if(ifr) ifr.src = ifr.src;
        }

        function goBack() {
            const ifr = document.querySelector(\`.tab-view.active iframe\`);
            if(ifr) try { ifr.contentWindow.history.back(); } catch(e) {}
        }

        function goForward() {
            const ifr = document.querySelector(\`.tab-view.active iframe\`);
            if(ifr) try { ifr.contentWindow.history.forward(); } catch(e) {}
        }
    </script>
</body>
</html>`;

const BrowserApp = () => {
    const { isAppInstalled } = useApps();
    const isPro = isAppInstalled('navegador-pro');
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<any>(null);
    const handleSearch = async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: searchTerm, config: { tools: [{googleSearch:{}}] } });
        setResults({ summary: res.text, sources: res.candidates?.[0]?.groundingMetadata?.groundingChunks || [] });
    };
    if (isPro) return <div className="browser-app pro-mode"><iframe srcDoc={BROWSER_PRO_HTML} style={{ width: '100%', height: '100%', border: 'none' }} /></div>;
    return (
        <div className="browser-app">
            <div className="browser-toolbar"><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSearch()} /><button onClick={handleSearch}>Ir</button></div>
            <div className="browser-content">{results && <div><p>{results.summary}</p></div>}</div>
        </div>
    );
};

const SettingsApp = () => {
    const { isSoundEnabled, setIsSoundEnabled, volume, setVolume } = useSounds();
    const { isSystemGodMode, setSystemGodMode, accentColor, setAccentColor, systemName, setSystemName } = useSystemConfig();
    const [secretInput, setSecretInput] = useState('');

    const handleSecretChange = (val: string) => {
        setSecretInput(val);
        if (val === 'good-mode-sistema-operativo') {
            setSystemGodMode(true);
            setSecretInput('');
        }
    };

    return (
        <div className="settings-app">
            <h2 style={{ color: isSystemGodMode ? 'gold' : 'inherit' }}>Ajustes {isSystemGodMode && 'Pro'}</h2>
            
            <div className="settings-section">
                <h3>Som</h3>
                <div className="settings-item">
                    <span>Som</span>
                    <label className="switch">
                        <input type="checkbox" checked={isSoundEnabled} onChange={() => setIsSoundEnabled(!isSoundEnabled)} />
                        <span className="slider round"></span>
                    </label>
                </div>
            </div>

            {isSystemGodMode && (
                <div className="settings-section" style={{ border: '2px solid gold', padding: '15px', borderRadius: '15px', background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(0,0,0,0) 100%)' }}>
                    <h3 style={{ color: 'gold' }}>🛠️ Opções de Administrador (Modo Deus)</h3>
                    
                    <div className="settings-item">
                        <span>Cor de Destaque</span>
                        <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} style={{ background: 'none', border: 'none', width: '40px', height: '40px', cursor: 'pointer' }} />
                    </div>

                    <div className="settings-item">
                        <span>Nome do Sistema</span>
                        <input 
                            type="text" 
                            value={systemName} 
                            onChange={(e) => setSystemName(e.target.value)} 
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid gold', color: 'white', borderRadius: '8px', padding: '4px 8px', width: '120px' }} 
                        />
                    </div>

                    <div className="settings-item">
                        <span>Desativar Modo Deus</span>
                        <button className="danger-btn" onClick={() => {
                            setSystemGodMode(false);
                            setAccentColor('#0a84ff'); // Reset standard accent
                            setSystemName('IanOS');     // Reset standard name
                        }}>Sair</button>
                    </div>
                </div>
            )}

            <div className="settings-section">
                <h3>Dispositivo</h3>
                <p className="setting-description">O IanOS usa agora os teclados nativos do seu dispositivo para maior compatibilidade e rapidez.</p>
                
                <div style={{ marginTop: '20px', opacity: 0.5 }}>
                    <input 
                        type="password" 
                        placeholder="Código de acesso" 
                        value={secretInput} 
                        onChange={(e) => handleSecretChange(e.target.value)}
                        style={{ background: 'none', border: 'none', color: 'white', fontSize: '0.7rem', width: '100%' }}
                    />
                </div>
            </div>
        </div>
    );
};

const MidiApp = () => <div className="midi-app"><h2>MIDI</h2><p>Conecte dispositivos MIDI.</p></div>;
const YouTubeApp = () => <div className="music-app"><iframe width="100%" height="100%" src="https://www.youtube.com/embed/videoseries?list=PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG" frameBorder="0" allowFullScreen></iframe></div>;
const CalculatorApp = () => <div className="app-placeholder">Calculadora</div>;
const CalendarApp = () => <div className="calendar-app">Calendário</div>;
const AboutIanOSApp = () => <div className="about-ianos-app"><h2>IanOS 1.0</h2><p>Desenvolvido com IA.</p></div>;
const PaintApp = () => <div className="paint-app"><canvas width="350" height="500" style={{background:'#fff'}} /></div>;

// --- Main OS Component ---
const IanOS = () => {
  const [isLocked, setIsLocked] = useState(true);
  const [openApps, setOpenApps] = useState<string[]>([]);
  const { apps } = useApps();
  const { homeWallpaper } = useWallpaper();

  const handleFullReset = () => {
    if (confirm("Tem a certeza que deseja restaurar o telemóvel? Todos os dados serão apagados e o Modo Deus será desativado.")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  if (isLocked) return <LockScreen onUnlock={() => setIsLocked(false)} />;
  return (
    <div className="ianos" style={{ backgroundImage: `url(${homeWallpaper})` }}>
      <StatusBar />
      <div className="home-screen-content">
          <div className="app-grid">{apps.filter(app => !dockApps.includes(app.id)).map(app => (<div key={app.id} className="app-icon" onClick={() => setOpenApps([app.id, ...openApps])}><div className="icon">{app.icon}</div><span>{app.name}</span></div>))}</div>
          <div className="dock">{dockApps.map(appId => { const app = apps.find(a => a.id === appId); if(!app) return null; return <div key={app.id} className="app-icon" onClick={() => setOpenApps([app.id, ...openApps])}><div className="icon">{app.icon}</div></div>; })}</div>
      </div>
      {openApps.map(id => { const a = apps.find(x => x.id === id); if(!a) return null; return <AppWindow key={id} app={a} onClose={(id) => setOpenApps(openApps.filter(x => x !== id))} setActiveApp={()=>{}} onAppOpen={()=>{}} onLock={()=>setIsLocked(true)} onRestart={()=>{}} onShutdown={()=>{}} onReset={handleFullReset} />; })}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('app')!);
root.render(
  <React.StrictMode>
    <SystemConfigProvider>
      <AppProvider>
        <WallpaperProvider>
          <SoundProvider>
            <BetaModeProvider>
              <DefenderProvider>
                <PinProvider>
                  <PermissionsProvider>
                    <IanOS />
                  </PermissionsProvider>
                </PinProvider>
              </DefenderProvider>
            </BetaModeProvider>
          </SoundProvider>
        </WallpaperProvider>
      </AppProvider>
    </SystemConfigProvider>
  </React.StrictMode>
);