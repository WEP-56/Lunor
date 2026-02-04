import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import NewTab from './components/NewTab';
import SettingsPage from './components/SettingsPage';
import HistoryPage from './components/HistoryPage';
import DownloadsPage from './components/DownloadsPage';
import { Settings, Plus, X, Minus, Maximize2, ArrowLeft, ArrowRight, RotateCw, Star, Trash2, Edit, Save, Search, Monitor, Shield, Cpu, Info, RefreshCcw, History, Download, Folder, Play, Pause, File, Globe, Zap } from 'lucide-react';

// Search Engines Configuration
const SEARCH_ENGINES = [
    { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=' },
    { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=' },
    { id: 'baidu', name: 'Baidu', url: 'https://www.baidu.com/s?wd=' },
    { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
];

// Mock data
const INITIAL_TABS = [
  { id: 1, url: 'browser://newtab', title: 'New Tab', icon: null },
];

const INITIAL_BOOKMARKS = [
  { id: 'b1', url: 'https://www.youtube.com', title: 'YouTube', icon: null },
  { id: 'b2', url: 'https://twitter.com', title: 'Twitter', icon: null },
  { id: 'b3', url: 'https://www.bilibili.com', title: 'Bilibili', icon: null }
];

const TRANSLATIONS = {
  en: {
    back: 'Back',
    forward: 'Forward',
    reload: 'Reload',
    history: 'History',
    downloads: 'Downloads',
    bookmark: 'Bookmark',
    newTab: 'New Tab',
    settings: 'Settings',
    searchPlaceholder: 'Search or enter website name',
    noHistory: 'No history',
    showAllHistory: 'Show All History',
    noDownloads: 'No downloads',
    showAllDownloads: 'Show All Downloads',
    // Settings
    general: 'General',
    performance: 'Performance',
    privacy: 'Privacy',
    system: 'System',
    about: 'About',
    homePage: 'Home Page URL',
    searchEngine: 'Search Engine URL',
    appearance: 'Appearance',
    themeAuto: 'Auto (System)',
    themeLight: 'Light',
    themeDark: 'Dark',
    userAgent: 'User Agent',
    downloadPath: 'Download Path',
    bookmarksManager: 'Bookmarks Manager',
    add: 'Add',
    memorySaver: 'Memory Saver',
    memorySaverDesc: 'Automatically suspends inactive tabs to save memory and CPU based on your selected strategy.',
    modeModerate: 'Moderate',
    modeModerateDesc: 'Suspend tabs after 1 hour of inactivity.',
    modeBalanced: 'Balanced (Recommended)',
    modeBalancedDesc: 'Suspend tabs after 30 minutes of inactivity.',
    modeMax: 'Maximum',
    modeMaxDesc: 'Suspend tabs after 5 minutes of inactivity.',
    tabHoverPreview: 'Show tab preview image',
    tabMemoryUsage: 'Show tab memory usage',
    fontSize: 'Global Font Size',
    graphicsAcceleration: 'Use Graphics Acceleration',
    proxySettings: 'Proxy Settings',
    resetSettings: 'Reset Settings',
    resetConfirm: 'Reset settings to default',
    clearHistory: 'Clear browsing history',
    sitePermissions: 'Site Permissions',
    location: 'Location',
    camera: 'Camera',
    askEveryTime: 'Ask every time',
    alwaysAllow: 'Always allow',
    block: 'Block',
    language: 'Language',
    select: 'Select',
    // Downloads Page
    openDownloadsFolder: 'Open Downloads Folder',
    pause: 'Pause',
    resume: 'Resume',
    cancel: 'Cancel',
    delete: 'Delete',
    showInFolder: 'Show in Folder',
    // History Page
    searchHistory: 'Search history',
    // New Tab
    greeting: 'Good Day',
    searchWith: 'Search with',
    orEnterAddress: 'or enter address',
    // Downloads Status
    interrupted: 'Interrupted',
    completed: 'Completed',
    failed: 'Failed',
    searchDownloads: 'Search downloads',
    // Alerts
    resetConfirmTitle: 'Are you sure you want to reset all settings to default?',
    clearHistoryConfirm: 'Are you sure you want to clear all browsing history?',
    proxyAlert: 'Proxy settings are managed by your operating system.',
    openingFolder: 'Opening folder:',
  },
  zh: {
    back: '后退',
    forward: '前进',
    reload: '刷新',
    history: '历史记录',
    downloads: '下载管理',
    bookmark: '收藏',
    newTab: '新标签页',
    settings: '设置',
    searchPlaceholder: '搜索或输入网址',
    noHistory: '暂无历史记录',
    showAllHistory: '显示所有历史记录',
    noDownloads: '暂无下载记录',
    showAllDownloads: '显示所有下载记录',
    // Settings
    general: '常规',
    performance: '性能',
    privacy: '隐私',
    system: '系统',
    about: '关于',
    homePage: '主页地址',
    searchEngine: '搜索引擎地址',
    appearance: '外观',
    themeAuto: '自动 (跟随系统)',
    themeLight: '浅色',
    themeDark: '深色',
    userAgent: '用户代理 (User Agent)',
    downloadPath: '下载路径',
    bookmarksManager: '书签管理',
    add: '添加',
    memorySaver: '内存节省模式',
    memorySaverDesc: '根据选择的策略，自动冻结非活动标签页以减少内存和CPU占用。',
    modeModerate: '适度模式',
    modeModerateDesc: '非活动状态超过 1 小时后冻结标签页。',
    modeBalanced: '平衡模式 (推荐)',
    modeBalancedDesc: '非活动状态超过 30 分钟后冻结标签页。',
    modeMax: '强力模式',
    modeMaxDesc: '非活动状态超过 5 分钟后冻结标签页。',
    tabHoverPreview: '显示标签页预览',
    tabMemoryUsage: '显示标签页内存占用',
    fontSize: '全局字体大小',
    graphicsAcceleration: '使用硬件加速',
    proxySettings: '代理设置',
    resetSettings: '重置设置',
    resetConfirm: '恢复默认设置',
    clearHistory: '清除浏览数据',
    sitePermissions: '站点权限',
    location: '位置信息',
    camera: '摄像头',
    askEveryTime: '每次询问',
    alwaysAllow: '始终允许',
    block: '禁止',
    language: '语言',
    select: '选择',
    // Downloads Page
    openDownloadsFolder: '打开下载文件夹',
    pause: '暂停',
    resume: '继续',
    cancel: '取消',
    delete: '删除',
    showInFolder: '在文件夹中显示',
    // History Page
    searchHistory: '搜索历史记录',
    // New Tab
    greeting: '你好',
    searchWith: '使用',
    orEnterAddress: '搜索或输入地址',
    // Downloads Status
    interrupted: '已中断',
    completed: '已完成',
    failed: '失败',
    searchDownloads: '搜索下载内容',
    // Alerts
    resetConfirmTitle: '您确定要将所有设置重置为默认值吗？',
    clearHistoryConfirm: '您确定要清除所有浏览历史记录吗？',
    proxyAlert: '代理设置由您的操作系统管理。',
    openingFolder: '正在打开文件夹：',
  }
};

// Helper Component for WebView
const WebViewItem = ({ url, active, onNewWindow, onRef, onDidNavigate, onPageTitleUpdated, userAgent, onEnterHtmlFullScreen, onLeaveHtmlFullScreen }) => {
    const webviewRef = useRef(null);
    const onNewWindowRef = useRef(onNewWindow);
    const onDidNavigateRef = useRef(onDidNavigate);
    const onPageTitleUpdatedRef = useRef(onPageTitleUpdated);
    const onEnterHtmlFullScreenRef = useRef(onEnterHtmlFullScreen);
    const onLeaveHtmlFullScreenRef = useRef(onLeaveHtmlFullScreen);

    useEffect(() => {
        onNewWindowRef.current = onNewWindow;
        onDidNavigateRef.current = onDidNavigate;
        onPageTitleUpdatedRef.current = onPageTitleUpdated;
        onEnterHtmlFullScreenRef.current = onEnterHtmlFullScreen;
        onLeaveHtmlFullScreenRef.current = onLeaveHtmlFullScreen;
    }, [onNewWindow, onDidNavigate, onPageTitleUpdated, onEnterHtmlFullScreen, onLeaveHtmlFullScreen]);

    useEffect(() => {
        const webview = webviewRef.current;
        if (webview) {
            if (onRef) onRef(webview);

            const handleNewWindow = (e) => {
                // ... existing code
                e.preventDefault(); 
                if (onNewWindowRef.current) onNewWindowRef.current(e.url);
            };

            const handleDidNavigate = (e) => {
               if (onDidNavigateRef.current) onDidNavigateRef.current(e.url);
            };
            
            const handleDidNavigateInPage = (e) => {
               if (onDidNavigateRef.current) onDidNavigateRef.current(e.url);
            };

            const handlePageTitleUpdated = (e) => {
               if (onPageTitleUpdatedRef.current) onPageTitleUpdatedRef.current(e.title);
            };

            const handleDidFailLoad = (e) => {
                if (e.errorCode !== -3) { // Ignore ERR_ABORTED which is harmless (often due to redirects or stop loading)
                    console.error('[WebView] Load failed:', e.errorCode, e.errorDescription, 'URL:', e.validatedURL);
                }
            };

            const handleEnterHtmlFullScreen = () => {
                if (onEnterHtmlFullScreenRef.current) onEnterHtmlFullScreenRef.current();
            };

            const handleLeaveHtmlFullScreen = () => {
                if (onLeaveHtmlFullScreenRef.current) onLeaveHtmlFullScreenRef.current();
            };
            
            // Add listeners
            webview.addEventListener('new-window', handleNewWindow);
            webview.addEventListener('did-navigate', handleDidNavigate);
            webview.addEventListener('did-navigate-in-page', handleDidNavigateInPage);
            webview.addEventListener('page-title-updated', handlePageTitleUpdated);
            webview.addEventListener('did-fail-load', handleDidFailLoad);
            webview.addEventListener('enter-html-full-screen', handleEnterHtmlFullScreen);
            webview.addEventListener('leave-html-full-screen', handleLeaveHtmlFullScreen);
            
            return () => {
                webview.removeEventListener('new-window', handleNewWindow);
                webview.removeEventListener('did-navigate', handleDidNavigate);
                webview.removeEventListener('did-navigate-in-page', handleDidNavigateInPage);
                webview.removeEventListener('page-title-updated', handlePageTitleUpdated);
                webview.removeEventListener('did-fail-load', handleDidFailLoad);
                webview.removeEventListener('enter-html-full-screen', handleEnterHtmlFullScreen);
                webview.removeEventListener('leave-html-full-screen', handleLeaveHtmlFullScreen);
            };
        }
    }, [onRef]); // Minimal dependencies to avoid re-binding

    return (
        <div className={`webview-container ${active ? 'active' : ''}`}>
             <webview 
               ref={webviewRef}
               src={url} 
               useragent={userAgent}
               style={{width: '100%', height: '100%', border: 'none'}}
               allowpopups="true"
             />
        </div>
    );
};

// Helper functions
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);
const generateMemoryUsage = () => Math.floor(Math.random() * 50 + 20);

function App() {
  const [tabs, setTabs] = useState(INITIAL_TABS);
  const [bookmarks, setBookmarks] = useState(INITIAL_BOOKMARKS);
  const [activeTabId, setActiveTabId] = useState(1);
  const [urlInput, setUrlInput] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  // showSettings removed in favor of full page settings
  const [settings, setSettings] = useState({
      // homePage removed
      searchEngine: 'https://www.google.com/search?q=',
      theme: 'auto', // auto, light, dark
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      // Performance
      memorySaver: 'balanced', // moderate, balanced, max
      tabHoverPreview: true,
      tabMemoryUsage: true,
      fontSize: 'medium', // small, medium, large
      // System
      graphicsAcceleration: true,
      // Privacy
      locationPermission: 'ask', // ask, block, allow
      cameraPermission: 'ask',
      historyEnabled: true,
      // Downloads
      downloadPath: 'Downloads',
      language: 'en'
  });
  
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;
  const [history, setHistory] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const [showDownloadsPopup, setShowDownloadsPopup] = useState(false);
  
  const historyPopupTimeoutRef = useRef(null);
  const downloadsPopupTimeoutRef = useRef(null);

  const handleHistoryMouseEnter = () => {
      if (historyPopupTimeoutRef.current) {
          clearTimeout(historyPopupTimeoutRef.current);
          historyPopupTimeoutRef.current = null;
      }
      setShowHistoryPopup(true);
  };

  const handleHistoryMouseLeave = () => {
      historyPopupTimeoutRef.current = setTimeout(() => {
          setShowHistoryPopup(false);
      }, 300);
  };

  const handleDownloadsMouseEnter = () => {
      if (downloadsPopupTimeoutRef.current) {
          clearTimeout(downloadsPopupTimeoutRef.current);
          downloadsPopupTimeoutRef.current = null;
      }
      setShowDownloadsPopup(true);
  };

  const handleDownloadsMouseLeave = () => {
      downloadsPopupTimeoutRef.current = setTimeout(() => {
          setShowDownloadsPopup(false);
      }, 300);
  };
  
  const webviewRefs = useRef({});
  const dockTimeoutRef = useRef(null);
  const isDockVisibleRef = useRef(false);

  // --- Core Functions (Moved up to fix hoisting and initialization issues) ---
  const saveSettings = (newSettings) => {
      setSettings(newSettings);
      localStorage.setItem('browsermos-settings', JSON.stringify(newSettings));
      if (window.electronAPI && window.electronAPI.setDownloadPath) {
          window.electronAPI.setDownloadPath(newSettings.downloadPath);
      }
  };

  const saveHistory = (newHistory) => {
      setHistory(newHistory);
      localStorage.setItem('browsermos-history', JSON.stringify(newHistory));
  };

  const addHistoryItem = (url, title) => {
      // Debug logging
      // console.log('[History] Adding item:', url, title, 'Enabled:', settings.historyEnabled);
      
      if (!settings.historyEnabled) return;
      if (url === 'browser://newtab' || url === 'browser://settings' || url === 'browser://history' || url === 'browser://downloads') return;
      
      setHistory(prev => {
          // Debounce duplicate entries (same URL within short time or already top)
          if (prev.length > 0 && prev[0].url === url) {
              return prev;
          }

          const newItem = {
              id: generateId(),
              url,
              title: title || url,
              timestamp: Date.now()
          };

          const updated = [newItem, ...prev];
          localStorage.setItem('browsermos-history', JSON.stringify(updated));
          return updated;
      });
  };

  const updateTabPreview = async (tabId) => {
      if (!settings.tabHoverPreview) return;
      const webview = webviewRefs.current[tabId];
      if (webview && webview.capturePage) {
          try {
              const image = await webview.capturePage();
              const dataUrl = image.toDataURL();
              setTabs(prev => prev.map(t => t.id === tabId ? { ...t, previewImage: dataUrl } : t));
          } catch (error) {
              console.error('Failed to capture preview:', error);
          }
      }
  };

  const createNewTab = (url = 'browser://newtab') => {
    const newId = generateId();
    const newTab = { 
        id: newId, 
        url: url, 
        title: 'New Tab', 
        icon: null,
        lastAccessed: Date.now(),
        suspended: false,
        memoryUsage: generateMemoryUsage() // Stable memory usage
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const closeTab = (e, id) => {
    if (e) e.stopPropagation(); 
    const newTabs = tabs.filter(t => t.id !== id);
    if (newTabs.length === 0) {
      createNewTab();
    } else {
      setTabs(newTabs);
      if (activeTabId === id) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
    }
    delete webviewRefs.current[id];
  };

  useEffect(() => {
    if (!window.electronAPI) return;

    const unsubStarted = window.electronAPI.onDownloadStarted((data) => {
        setDownloads(prev => [{
            id: data.id,
            filename: data.filename,
            totalBytes: data.totalBytes,
            receivedBytes: 0,
            state: 'progressing',
            startTime: data.startTime,
            path: data.path
        }, ...prev]);
        setShowDownloadsPopup(true);
    });

    const unsubProgress = window.electronAPI.onDownloadProgress((data) => {
        setDownloads(prev => prev.map(d => 
            d.id === data.id ? { ...d, receivedBytes: data.receivedBytes, totalBytes: data.totalBytes, state: 'progressing' } : d
        ));
    });

    const unsubPaused = window.electronAPI.onDownloadPaused((data) => {
        setDownloads(prev => prev.map(d => d.id === data.id ? { ...d, state: 'interrupted' } : d));
    });

    const unsubComplete = window.electronAPI.onDownloadComplete((data) => {
        setDownloads(prev => prev.map(d => d.id === data.id ? { ...d, state: 'completed', path: data.path } : d));
    });

    const unsubCancelled = window.electronAPI.onDownloadCancelled((data) => {
        setDownloads(prev => prev.filter(d => d.id !== data.id));
    });

    const unsubFailed = window.electronAPI.onDownloadFailed((data) => {
        setDownloads(prev => prev.map(d => d.id === data.id ? { ...d, state: 'failed' } : d));
    });

    return () => {
        unsubStarted();
        unsubProgress();
        unsubPaused();
        unsubComplete();
        unsubCancelled();
        unsubFailed();
    };
  }, []);

  const [isDockVisible, setIsDockVisible] = useState(false);
  const [isHtmlFullScreen, setIsHtmlFullScreen] = useState(false);
  
  useEffect(() => {
    isDockVisibleRef.current = isDockVisible;
  }, [isDockVisible]);

  useEffect(() => {
    // Listen for new tab requests from main process
    if (window.electronAPI && window.electronAPI.onOpenNewTab) {
      const removeListener = window.electronAPI.onOpenNewTab((url) => {
        createNewTab(url);
      });
      return () => {
        removeListener();
      };
    }
  }, []); // Remove dependency on tabs to prevent re-registration

  // Mouse move handler for dock visibility
  useEffect(() => {
    const handleMouseMove = (e) => {
      const windowHeight = window.innerHeight;
      const mouseY = e.clientY;
      const threshold = 100; // Trigger area
      const hideThreshold = 140; // Hide area

      if (mouseY >= windowHeight - threshold) {
        if (!isDockVisibleRef.current) setIsDockVisible(true);
        if (dockTimeoutRef.current) {
            clearTimeout(dockTimeoutRef.current);
            dockTimeoutRef.current = null;
        }
      } else if (mouseY < windowHeight - hideThreshold) {
        // Delay hiding slightly to prevent flickering
        if (!dockTimeoutRef.current && isDockVisibleRef.current) {
           dockTimeoutRef.current = setTimeout(() => {
             setIsDockVisible(false);
             dockTimeoutRef.current = null;
           }, 500);
        }
      } else {
        // In between area (dock area), keep it visible if it is already
        if (isDockVisibleRef.current && dockTimeoutRef.current) {
            clearTimeout(dockTimeoutRef.current);
            dockTimeoutRef.current = null;
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        if (dockTimeoutRef.current) clearTimeout(dockTimeoutRef.current);
    };
  }, []);

  // Apply Font Size
  useEffect(() => {
      const root = document.documentElement;
      const sizeMap = {
          small: '14px',
          medium: '16px',
          large: '18px',
          xlarge: '20px'
      };
      root.style.fontSize = sizeMap[settings.fontSize] || '16px';
  }, [settings.fontSize]);

  // Apply Theme
  useEffect(() => {
      const root = document.documentElement;
      if (settings.theme === 'dark') {
          root.setAttribute('data-theme', 'dark');
      } else if (settings.theme === 'light') {
          root.setAttribute('data-theme', 'light');
      } else {
          root.removeAttribute('data-theme');
      }
  }, [settings.theme]);

  // Load settings & bookmarks & history from localStorage
  useEffect(() => {
      const savedSettings = localStorage.getItem('browsermos-settings');
      if (savedSettings) {
          try {
              const parsed = JSON.parse(savedSettings);
              // Merge saved settings with current defaults to ensure new fields (like historyEnabled) exist
              setSettings(prev => ({
                  ...prev,
                  ...parsed
              }));
          } catch (e) {
              console.error('Failed to parse settings:', e);
          }
      }
      
      const savedBookmarks = localStorage.getItem('browsermos-bookmarks');
      if (savedBookmarks) {
          setBookmarks(JSON.parse(savedBookmarks));
      }

      const savedHistory = localStorage.getItem('browsermos-history');
      if (savedHistory) {
          setHistory(JSON.parse(savedHistory));
      }
  }, []);

  const saveBookmarks = (newBookmarks) => {
      setBookmarks(newBookmarks);
      localStorage.setItem('browsermos-bookmarks', JSON.stringify(newBookmarks));
  };

  // Capture preview periodically for active tab
  useEffect(() => {
      if (!settings.tabHoverPreview) return;
      
      const interval = setInterval(() => {
          updateTabPreview(activeTabId);
      }, 5000); // Capture every 5 seconds

      return () => clearInterval(interval);
  }, [activeTabId, settings.tabHoverPreview]);

  // Handle Window Controls
  const handleMinimize = () => {
    if (window.electronAPI) window.electronAPI.minimize();
  };
  
  const handleMaximize = () => {
    if (window.electronAPI) window.electronAPI.maximize();
    setIsMaximized(!isMaximized);
  };
  
  const handleClose = () => {
    if (window.electronAPI) window.electronAPI.close();
  };

  // Navigation handlers
  const getActiveWebview = () => {
      return webviewRefs.current[activeTabId];
  };

  const handleBack = () => {
      const webview = getActiveWebview();
      if (webview && webview.canGoBack()) webview.goBack();
  };

  const handleForward = () => {
      const webview = getActiveWebview();
      if (webview && webview.canGoForward()) webview.goForward();
  };

  const handleReload = () => {
      const webview = getActiveWebview();
      if (webview) webview.reload();
  };

  const handleUrlSubmit = (e) => {
    if (e.key === 'Enter') {
      let url = urlInput;
      if (!url.startsWith('http')) {
         if (url.includes('.') && !url.includes(' ')) {
             url = 'https://' + url;
         } else {
             // Search
             url = settings.searchEngine + encodeURIComponent(url);
         }
      }
      // Update current tab
      setTabs(tabs.map(tab => 
        tab.id === activeTabId ? { ...tab, url: url, title: url } : tab
      ));
    }
  };

  // Update URL input when switching tabs
  useEffect(() => {
    const currentTab = tabs.find(t => t.id === activeTabId);
    if (currentTab) {
      // Update lastAccessed and unsopsend if needed
      setTabs(prev => prev.map(t => 
          t.id === activeTabId 
          ? { ...t, lastAccessed: Date.now(), suspended: false } 
          : t
      ));

      if (currentTab.url === 'browser://newtab') {
        setUrlInput('');
      } else {
        setUrlInput(currentTab.url);
      }
    }
  }, [activeTabId]); // Remove tabs from dependency to avoid loop, we update tabs inside

  // Memory Saver Logic
  useEffect(() => {
      if (settings.memorySaver === 'off') return;

      const checkInterval = setInterval(() => {
          const now = Date.now();
          let timeout = 30 * 60 * 1000; // Balanced: 30 mins
          
          if (settings.memorySaver === 'moderate') timeout = 60 * 60 * 1000; // 1 hour
          if (settings.memorySaver === 'max') timeout = 5 * 60 * 1000; // 5 mins

          setTabs(prevTabs => prevTabs.map(tab => {
              if (tab.id === activeTabId) return { ...tab, lastAccessed: now }; // Active tab is always fresh
              if (tab.url.startsWith('browser://')) return tab; // Internal pages are cheap

              if (!tab.suspended && (now - (tab.lastAccessed || now) > timeout)) {
                  console.log(`Suspending tab: ${tab.title}`);
                  return { ...tab, suspended: true };
              }
              return tab;
          }));
      }, 60000); // Check every minute

      return () => clearInterval(checkInterval);
  }, [settings.memorySaver, activeTabId]);


  const getFavicon = (url) => {
    if (!url || url.startsWith('browser://')) return null;
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
    } catch (error) {
      return null;
    }
  };

  const toggleBookmark = () => {
    const currentTab = tabs.find(t => t.id === activeTabId);
    if (!currentTab) return;

    const exists = bookmarks.find(b => b.url === currentTab.url);
    if (exists) {
      saveBookmarks(bookmarks.filter(b => b.url !== currentTab.url));
    } else {
      const newBookmark = {
        id: generateId(),
        url: currentTab.url,
        title: currentTab.title || currentTab.url,
        icon: null
      };
      saveBookmarks([...bookmarks, newBookmark]);
    }
  };
  
  const resetSettings = () => {
      if (confirm(t.resetConfirmTitle)) {
          const defaultSettings = {
              homePage: 'https://www.google.com',
              searchEngine: 'https://www.google.com/search?q=',
              theme: 'auto',
              userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              memorySaver: 'balanced',
              tabHoverPreview: true,
              tabMemoryUsage: true,
              fontSize: 'medium',
              graphicsAcceleration: true,
              locationPermission: 'ask',
              cameraPermission: 'ask',
              historyEnabled: true,
              downloadPath: 'Downloads'
          };
          saveSettings(defaultSettings);
      }
  };

  const clearHistory = () => {
      if (confirm(t.clearHistoryConfirm)) {
          saveHistory([]);
      }
  };
  
  const deleteHistoryItem = (id) => {
      const updatedHistory = history.filter(item => item.id !== id);
      saveHistory(updatedHistory);
  };
  
  const openProxySettings = () => {
      if (window.electronAPI && window.electronAPI.openProxySettings) {
          window.electronAPI.openProxySettings();
      } else {
          alert(t.proxyAlert);
      }
  };
  
  // Download handlers
  const pauseDownload = (id) => {
      if (window.electronAPI && window.electronAPI.pauseDownload) {
          window.electronAPI.pauseDownload(id);
      } else {
          setDownloads(downloads.map(d => d.id === id ? { ...d, state: 'interrupted' } : d));
      }
  };
  
  const resumeDownload = (id) => {
      if (window.electronAPI && window.electronAPI.resumeDownload) {
          window.electronAPI.resumeDownload(id);
      } else {
          setDownloads(downloads.map(d => d.id === id ? { ...d, state: 'progressing' } : d));
      }
  };
  
  const cancelDownload = (id) => {
      if (window.electronAPI && window.electronAPI.cancelDownload) {
          window.electronAPI.cancelDownload(id);
      } else {
          setDownloads(downloads.filter(d => d.id !== id));
      }
  };
  
  const deleteDownload = (id) => {
      setDownloads(downloads.filter(d => d.id !== id));
  };
  
  const openDownloadFolder = (path) => {
      if (window.electronAPI && window.electronAPI.openPath) {
          window.electronAPI.openPath(path || settings.downloadPath);
      } else {
          alert(`${t.openingFolder} ${path || settings.downloadPath}`);
      }
  };

  // Drag and Drop for Links
  const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'link';
  };

  const handleDrop = (e) => {
      e.preventDefault();
      const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
      if (url) {
          createNewTab(url);
      }
  };

  const [editingBookmarkId, setEditingBookmarkId] = useState(null);
  const [editBookmarkForm, setEditBookmarkForm] = useState({ title: '', url: '' });

  /* Unused bookmark editing functions - kept for future implementation
  const startEditBookmark = (bm) => {
    setEditingBookmarkId(bm.id);
    setEditBookmarkForm({ title: bm.title, url: bm.url });
  };

  const saveEditBookmark = () => {
    if (!editingBookmarkId) return;
    const updated = bookmarks.map(bm => 
        bm.id === editingBookmarkId ? { ...bm, ...editBookmarkForm } : bm
    );
    saveBookmarks(updated);
    setEditingBookmarkId(null);
  };
  */

  const deleteBookmark = (id) => {
    saveBookmarks(bookmarks.filter(bm => bm.id !== id));
  };

  const addBookmark = () => {
      const newId = generateId();
      const newBm = { id: newId, title: 'New Bookmark', url: 'https://', icon: null };
      saveBookmarks([...bookmarks, newBm]);
      // startEditBookmark(newBm); // UI for editing not implemented
  };

  return (
    <div className="app-container">
      {/* TitleBar containing Controls and URL Bar */}
      {!isHtmlFullScreen && (
      <div className="titlebar">
          <div className="window-controls">
            <button className="control-btn control-close" onClick={handleClose}>
                <X size={8} strokeWidth={3} />
            </button>
            <button className="control-btn control-min" onClick={handleMinimize}>
                <Minus size={8} strokeWidth={3} />
            </button>
            <button className="control-btn control-max" onClick={handleMaximize}>
                <Maximize2 size={8} strokeWidth={3} />
            </button>
          </div>

          <div className="url-bar-container">
              <div className="url-bar-unified">
                <div className="nav-controls">
                    <button className="nav-icon-btn" onClick={handleBack} title={t.back}>
                        <ArrowLeft size={16} />
                    </button>
                    <button className="nav-icon-btn" onClick={handleForward} title={t.forward}>
                        <ArrowRight size={16} />
                    </button>
                    <button className="nav-icon-btn" onClick={handleReload} title={t.reload}>
                        <RotateCw size={14} />
                    </button>
                </div>

                <input 
                    className="url-input-transparent"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={handleUrlSubmit}
                    placeholder={t.searchPlaceholder}
                />

                <button className="nav-icon-btn" onClick={toggleBookmark} title={t.bookmark}>
                    <Star 
                      size={16} 
                      color="var(--text-color)" 
                      fill={bookmarks.some(b => tabs.find(t => t.id === activeTabId)?.url === b.url) ? "#FFC107" : "none"} 
                      stroke={bookmarks.some(b => tabs.find(t => t.id === activeTabId)?.url === b.url) ? "#FFC107" : "var(--text-color)"}
                    />
                </button>
              </div>
              
              <div className="nav-btn-wrapper" onMouseEnter={handleHistoryMouseEnter} onMouseLeave={handleHistoryMouseLeave}>
                  <button className="nav-icon-btn large" onClick={() => createNewTab('browser://history')} title={t.history}>
                    <History size={20} />
                  </button>
                  {showHistoryPopup && (
                      <div className="nav-popup visible">
                          <div className="popup-header">{t.history}</div>
                          {history.slice(0, 20).map(item => (
                              <div key={item.id} className="popup-item" onClick={() => createNewTab(item.url)}>
                                  <div className="popup-item-icon"><File size={14} /></div>
                                  <div className="popup-item-info">
                                      <div className="popup-item-title">{item.title}</div>
                                      <div className="popup-item-subtitle">{item.url}</div>
                                  </div>
                              </div>
                          ))}
                          {history.length === 0 && <div style={{padding: 20, textAlign: 'center', opacity: 0.5}}>{t.noHistory}</div>}
                          <button className="popup-footer-btn" onClick={() => createNewTab('browser://history')}>
                              {t.showAllHistory}
                          </button>
                      </div>
                  )}
              </div>

              <div className="nav-btn-wrapper" onMouseEnter={handleDownloadsMouseEnter} onMouseLeave={handleDownloadsMouseLeave}>
                  <button className="nav-icon-btn large" onClick={() => createNewTab('browser://downloads')} title={t.downloads}>
                    <Download size={20} />
                  </button>
                  {showDownloadsPopup && (
                      <div className="nav-popup visible" style={{width: 320}}>
                          <div className="popup-header">{t.downloads}</div>
                          {downloads.slice(0, 20).map(item => (
                              <div key={item.id} className="popup-item" onClick={(e) => e.stopPropagation()}>
                                  <div className="popup-item-icon"><File size={14} /></div>
                                  <div className="popup-item-info">
                                      <div className="popup-item-title">{item.filename}</div>
                                      <div className="popup-item-subtitle">
                                          {item.state === 'progressing' ? `${Math.round(item.receivedBytes/1024)}KB / ${Math.round(item.totalBytes/1024)}KB` : (t[item.state] || item.state)}
                                      </div>
                                  </div>
                                  <div style={{display:'flex', gap: 4}}>
                                      {item.state === 'progressing' && (
                                          <button className="action-btn" onClick={() => pauseDownload(item.id)} title={t.pause}><Pause size={12}/></button>
                                      )}
                                      {item.state === 'interrupted' && (
                                          <button className="action-btn" onClick={() => resumeDownload(item.id)} title={t.resume}><Play size={12}/></button>
                                      )}
                                      <button className="action-btn" onClick={() => openDownloadFolder(item.path)} title={t.showInFolder}><Folder size={12}/></button>
                                  </div>
                              </div>
                          ))}
                          {downloads.length === 0 && <div style={{padding: 20, textAlign: 'center', opacity: 0.5}}>{t.noDownloads}</div>}
                          <button className="popup-footer-btn" onClick={() => createNewTab('browser://downloads')}>
                              {t.showAllDownloads}
                          </button>
                      </div>
                  )}
              </div>
          </div>
      </div>
      )}
      
      <div className="browser-content">
        {tabs.map(tab => (
          <div key={tab.id} className={`tab-content ${tab.id === activeTabId ? 'active' : ''}`} style={{display: tab.id === activeTabId ? 'block' : 'none', width: '100%', height: '100%'}}>
            {tab.url === 'browser://newtab' ? (
                <NewTab 
                    onSearch={(url) => {
                        setTabs(tabs.map(t => t.id === tab.id ? { ...t, url: url, title: url } : t));
                    }} 
                    t={t}
                />
            ) : tab.url === 'browser://settings' ? (
                <SettingsPage 
                    settings={settings}
                    saveSettings={saveSettings}
                    bookmarks={bookmarks}
                    saveBookmarks={saveBookmarks}
                    resetSettings={resetSettings}
                    clearHistory={clearHistory}
                    openProxySettings={openProxySettings}
                    t={t}
                    searchEngines={SEARCH_ENGINES}
                    onOpenUrl={(url) => createNewTab(url)}
                />
            ) : tab.url === 'browser://history' ? (
                <HistoryPage 
                    history={history}
                    clearHistory={clearHistory}
                    deleteHistoryItem={deleteHistoryItem}
                    t={t}
                    onOpenUrl={(url) => createNewTab(url)}
                />
            ) : tab.url === 'browser://downloads' ? (
                <DownloadsPage 
                    downloads={downloads}
                    pauseDownload={pauseDownload}
                    resumeDownload={resumeDownload}
                    cancelDownload={cancelDownload}
                    openDownloadFolder={openDownloadFolder}
                    deleteDownload={deleteDownload}
                    t={t}
                />
            ) : (
               window.electronAPI ? (
                   tab.suspended ? (
                       <div className="suspended-tab-view" style={{
                           display: 'flex', 
                           flexDirection: 'column', 
                           alignItems: 'center', 
                           justifyContent: 'center', 
                           height: '100%', 
                           backgroundColor: 'var(--bg-color)',
                           color: 'var(--text-color)',
                           gap: 16
                       }}>
                           <Cpu size={64} opacity={0.5} />
                           <h2>Tab Suspended</h2>
                           <p>This tab has been suspended to save memory.</p>
                           <button 
                               className="btn-primary" 
                               onClick={() => setTabs(tabs.map(t => t.id === tab.id ? { ...t, suspended: false, lastAccessed: Date.now() } : t))}
                               style={{padding: '10px 20px', fontSize: 14, cursor: 'pointer', borderRadius: 6, border: 'none', background: '#2196F3', color: 'white'}}
                           >
                               Reload Tab
                           </button>
                       </div>
                   ) : (
                   <WebViewItem 
                     url={tab.url}
                     active={tab.id === activeTabId}
                     userAgent={settings.userAgent}
                     onNewWindow={(url) => createNewTab(url)}
                     onRef={(el) => webviewRefs.current[tab.id] = el}
                     onDidNavigate={(url) => {
                         // Update tab URL
                         setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, url: url } : t));
                         addHistoryItem(url, tab.title);
                     }}
                     onPageTitleUpdated={(title) => {
                         setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, title: title } : t));
                         // We could also update history title here if we tracked history item IDs for tabs
                     }}
                     onEnterHtmlFullScreen={() => setIsHtmlFullScreen(true)}
                     onLeaveHtmlFullScreen={() => setIsHtmlFullScreen(false)}
                   />
                   )
               ) : (
                <div className={`webview-container ${tab.id === activeTabId ? 'active' : ''}`}>
                     <iframe 
                       src={tab.url} 
                       style={{width: '100%', height: '100%', border: 'none'}} 
                       title={tab.title}
                     />
                </div>
               )
            )}
          </div>
        ))}
      </div>

      <div className={`dock-container ${isDockVisible && !isHtmlFullScreen ? 'visible' : ''}`} onDragOver={handleDragOver} onDrop={handleDrop}>
        <div className="dock">
          {/* Left: Settings & Bookmarks */}
          <div className="dock-section left">
            <button className="dock-item" title="Settings" onClick={() => createNewTab('browser://settings')}>
              <Settings size={24} className="icon-placeholder" style={{color: 'var(--text-color)'}} />
            </button>
            {bookmarks.map(bm => (
              <button 
                key={bm.id} 
                className="dock-item" 
                title={bm.title}
                onClick={() => {
                    const newId = generateId();
                    setTabs([...tabs, { id: newId, url: bm.url, title: bm.title, icon: null }]);
                    setActiveTabId(newId);
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                    if(confirm('Delete bookmark?')) deleteBookmark(bm.id);
                }}
              >
                <img 
                  src={getFavicon(bm.url)} 
                  alt={bm.title} 
                  style={{width: '24px', height: '24px', borderRadius: '50%'}}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="icon-placeholder" style={{display: 'none', color: '#E91E63'}}>{bm.title[0]}</div>
              </button>
            ))}
          </div>

          <div className="dock-divider"></div>

          {/* Right: Open Tabs */}
          <div className="dock-section right">
            {tabs.map(tab => (
              <button 
                key={tab.id} 
                className={`dock-item ${tab.id === activeTabId ? 'active' : ''}`}
                onClick={() => setActiveTabId(tab.id)}
                title={tab.title}
                onContextMenu={(e) => closeTab(e, tab.id)}
              >
                {/* Tab Hover Preview & Memory Usage */}
                <div className="dock-tooltip">
                    <div className="dock-tooltip-title">{tab.title}</div>
                    {settings.tabMemoryUsage && (
                        <div className="dock-tooltip-meta">Mem: {tab.memoryUsage || 20} MB</div>
                    )}
                    {settings.tabHoverPreview && (
                        <div className="dock-tooltip-preview">
                            {tab.previewImage ? (
                                <img src={tab.previewImage} alt="Preview" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                            ) : (
                                <div className="preview-placeholder">Preview</div>
                            )}
                        </div>
                    )}
                </div>

                {tab.url === 'browser://newtab' ? (
                  <Search size={24} className="icon-placeholder" style={{color: 'var(--text-color)'}} />
                ) : tab.url === 'browser://settings' ? (
                  <Settings size={24} className="icon-placeholder" style={{color: 'var(--text-color)'}} />
                ) : (
                 <>
                    <img 
                      src={getFavicon(tab.url)} 
                      alt={tab.title} 
                      style={{width: '24px', height: '24px', borderRadius: '50%'}}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="icon-placeholder" style={{display: 'none', color: '#2196F3'}}>{tab.title[0] || 'W'}</div>
                 </>
                )}
              </button>
            ))}
            <button className="dock-item new-tab" onClick={() => createNewTab()} title={t.newTab}>
              <Plus size={24} className="icon-placeholder" style={{color: 'var(--text-color)'}} />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal Removed */}
    </div>
  );
}

export default App;
