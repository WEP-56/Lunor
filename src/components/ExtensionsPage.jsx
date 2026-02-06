import React, { useState, useEffect } from 'react';
import { Puzzle, Trash2, FolderPlus, AlertCircle, Download, ExternalLink, Search } from 'lucide-react';
import './ExtensionsPage.css';

const RECOMMENDED_EXTENSIONS = [
  {
    id: 'simple-translate',
    name: 'Simple Translate',
    description: 'Quickly translate selected text on web pages. Lightweight and works well without complex background services.',
    url: 'https://github.com/sienori/simple-translate/releases',
    icon: '🌐'
  },
  {
    id: 'ublock-origin',
    name: 'uBlock Origin Lite (MV3)',
    description: 'A permission-less content blocker. Best for basic ad blocking without complex permissions.',
    url: 'https://github.com/uBlockOrigin/uBOL-home/releases',
    icon: '🛡️'
  },
  {
    id: 'dark-reader',
    name: 'Dark Reader',
    description: 'Dark mode for every website. Take care of your eyes, use dark theme for night and daily browsing.',
    url: 'https://github.com/darkreader/darkreader/releases',
    icon: '🌙'
  },
  {
    id: 'react-devtools',
    name: 'React Developer Tools',
    description: 'Adds React debugging tools to the Chrome Developer Tools.',
    url: 'https://github.com/facebook/react/tree/main/packages/react-devtools-extensions',
    icon: '⚛️'
  },
  {
    id: 'redux-devtools',
    name: 'Redux DevTools',
    description: 'Redux DevTools for debugging application\'s state changes.',
    url: 'https://github.com/reduxjs/redux-devtools/tree/main/extension',
    icon: '🔄'
  },
  {
    id: 'vue-devtools',
    name: 'Vue.js devtools',
    description: 'Browser devtools extension for debugging Vue.js applications.',
    url: 'https://github.com/vuejs/devtools',
    icon: '🟢'
  }
];

const ExtensionsPage = ({ t, onOpenUrl }) => { // eslint-disable-line no-unused-vars
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchExtensions();
  }, []);

  const fetchExtensions = async () => {
    if (window.electronAPI && window.electronAPI.getExtensions) {
      try {
        setLoading(true);
        const exts = await window.electronAPI.getExtensions();
        setExtensions(exts);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch extensions:', err);
        setError('Failed to load extensions list.');
      } finally {
        setLoading(false);
      }
    } else {
        setLoading(false);
    }
  };

  const handleLoadUnpacked = async () => {
    if (!window.electronAPI) return;
    
    try {
      const result = await window.electronAPI.selectFolder();
      if (!result.canceled && result.filePaths.length > 0) {
        const loadResult = await window.electronAPI.loadExtension(result.filePaths[0]);
        if (loadResult.success) {
            fetchExtensions();
            // alert('Extension loaded successfully!');
        } else {
            alert(`Failed to load extension: ${loadResult.error}`);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error selecting folder');
    }
  };

  const handleLoadFile = async () => {
    if (!window.electronAPI) return;

    try {
        const result = await window.electronAPI.selectExtensionFile();
        if (!result.canceled && result.filePaths.length > 0) {
            const loadResult = await window.electronAPI.loadExtension(result.filePaths[0]);
            if (loadResult.success) {
                fetchExtensions();
            } else {
                alert(`Failed to load extension: ${loadResult.error}`);
            }
        }
    } catch (err) {
        console.error(err);
        alert('Error selecting file');
    }
  };

  const handleRemove = async (id) => {
      if (!window.electronAPI) return;
      if (!confirm(t.confirmRemove || 'Are you sure you want to remove this extension?')) return;

      try {
          const result = await window.electronAPI.removeExtension(id);
          if (result.success) {
              fetchExtensions();
          } else {
              alert(`Failed to remove extension: ${result.error}`);
          }
      } catch (err) {
          console.error(err);
          alert('Error removing extension');
      }
  };

  const handleToggle = async (ext) => {
      if (!window.electronAPI) return;
      
      try {
          const result = await window.electronAPI.toggleExtension({
              id: ext.id,
              path: ext.path,
              enabled: !ext.enabled
          });
          
          if (result.success) {
              fetchExtensions();
          } else {
              alert(`Failed to toggle extension: ${result.error}`);
          }
      } catch (err) {
          console.error(err);
          alert('Error toggling extension');
      }
  };

  const openOptionsPage = (url) => {
      if (window.electronAPI && window.electronAPI.openNewTab) {
          window.electronAPI.openNewTab(url);
      } else {
          onOpenUrl(url);
      }
  };

  const filteredExtensions = extensions.filter(ext => 
      ext.name.toLowerCase().includes(searchText.toLowerCase()) || 
      (ext.description && ext.description.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <div className="extensions-page">
      <div className="extensions-header">
        <div className="extensions-title">
            <Puzzle size={24} />
            <h1>{t.extensions || 'Extensions'}</h1>
        </div>
        <div className="extensions-search">
            <Search size={16} />
            <input 
                placeholder={t.searchExtensions || "Search extensions"}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
            />
        </div>
        <div className="extensions-actions">
            <button className="btn-primary" onClick={handleLoadUnpacked} style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <FolderPlus size={16} />
                {t.loadUnpacked || 'Load Unpacked'}
            </button>
            <button className="btn-secondary" onClick={handleLoadFile} style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <Puzzle size={16} />
                {t.loadCrx || 'Load CRX/Zip'}
            </button>
        </div>
      </div>
      
      <div className="extensions-content">
        {error && (
            <div className="error-message" style={{color: 'red', padding: 20, display: 'flex', alignItems: 'center', gap: 10}}>
                <AlertCircle size={20} />
                {error}
            </div>
        )}

        {loading ? (
            <div style={{padding: 20}}>Loading...</div>
        ) : filteredExtensions.length === 0 && extensions.length > 0 ? (
             <div className="empty-state" style={{padding: 40, textAlign: 'center', color: '#888'}}>
                <Search size={48} style={{marginBottom: 16, opacity: 0.5}} />
                <h3>No extensions found</h3>
             </div>
        ) : filteredExtensions.length === 0 ? (
            <div className="empty-extensions">
                <Puzzle size={48} opacity={0.2} />
                <h3>{t.noExtensions || 'No extensions installed'}</h3>
                <p>{t.installTip || 'Load an extension to get started.'}</p>
            </div>
        ) : (
            <div className="extensions-list">
                {filteredExtensions.map(ext => (
                    <div key={ext.path} className={`extension-item ${!ext.enabled ? 'disabled' : ''}`}>
                        <div className="extension-icon">
                            {/* Try to use extension icon if available, otherwise default */}
                            <Puzzle size={24} color="#666" />
                        </div>
                        <div className="extension-info">
                            <div className="extension-name">
                                {ext.name}
                                {!ext.enabled && <span className="extension-status-badge">DISABLED</span>}
                            </div>
                            <div className="extension-version">{ext.version}</div>
                            <div className="extension-description">{ext.description}</div>
                        </div>
                        
                        <div className="extension-actions">
                            <label style={{display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13}}>
                                <div className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={ext.enabled} 
                                        onChange={() => handleToggle(ext)}
                                    />
                                    <span className="slider"></span>
                                </div>
                                {ext.enabled ? (t.enabled || 'Enabled') : (t.disabled || 'Disabled')}
                            </label>
                            
                            {ext.enabled && ext.optionsPage && (
                                <button className="icon-btn" title="Settings" onClick={() => openOptionsPage(ext.optionsPage)}>
                                    <ExternalLink size={16} />
                                </button>
                            )}
                            <button className="icon-btn" title="Remove" onClick={() => handleRemove(ext.id || ext.path)} style={{color: '#ff4d4f'}}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        <div className="recommended-section">
            <h3>{t.recommendedExtensions || 'Recommended Extensions'}</h3>
            <p style={{marginBottom: 20, opacity: 0.7, fontSize: 14}}>
                {t.recommendedExtensionsDesc || 'These extensions are known to work well. Click download to get the source code, then unzip and load it above.'}
            </p>
            
            <div className="recommended-grid">
                {RECOMMENDED_EXTENSIONS.map(rec => (
                    <div key={rec.id} className="extension-item" style={{display: 'flex', alignItems: 'center', gap: 16}}>
                        <div style={{fontSize: 24, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.05)', borderRadius: 8}}>
                            {rec.icon}
                        </div>
                        <div className="extension-info">
                            <div className="extension-name">{rec.name}</div>
                            <div className="extension-description" style={{whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                                {rec.description}
                            </div>
                        </div>
                        <div className="extension-actions">
                            <button 
                                className="btn-secondary" 
                                onClick={() => onOpenUrl(rec.url)}
                                style={{display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '6px 12px'}}
                            >
                                <Download size={14} />
                                Download
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ExtensionsPage;
