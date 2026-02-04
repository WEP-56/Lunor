import React, { useState } from 'react';
import { Settings, Cpu, Shield, Monitor, Info, RefreshCcw, ArrowRight, Trash2, Plus, Edit, Save, X } from 'lucide-react';
import './SettingsPage.css';

const SettingsPage = ({ settings, saveSettings, bookmarks, saveBookmarks, resetSettings, clearHistory, openProxySettings, t, searchEngines, onOpenUrl }) => {
    const [activeTab, setActiveTab] = useState('general');
    const [editingBookmarkId, setEditingBookmarkId] = useState(null);

    const handleExternalLink = (e, url) => {
        e.preventDefault();
        if (window.electronAPI && window.electronAPI.openPath) {
             window.electronAPI.openPath(url); // Re-use openPath for external URLs if supported, or use a new API
        } else if (onOpenUrl) {
             onOpenUrl(url); // Fallback to new tab
        }
    };
    const [editBookmarkForm, setEditBookmarkForm] = useState({ title: '', url: '' });

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

    const deleteBookmark = (id) => {
        saveBookmarks(bookmarks.filter(bm => bm.id !== id));
    };

    const addBookmark = () => {
        const newId = Date.now().toString();
        const newBm = { id: newId, title: 'New Bookmark', url: 'https://', icon: null };
        saveBookmarks([...bookmarks, newBm]);
        startEditBookmark(newBm);
    };

    return (
        <div className="settings-page">
            <div className="settings-sidebar">
                <div className="settings-sidebar-header">{t.settings}</div>
                <button className={`settings-sidebar-item ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
                    <Settings size={18} /> {t.general}
                </button>
                <button className={`settings-sidebar-item ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>
                    <Cpu size={18} /> {t.performance}
                </button>
                <button className={`settings-sidebar-item ${activeTab === 'privacy' ? 'active' : ''}`} onClick={() => setActiveTab('privacy')}>
                    <Shield size={18} /> {t.privacy}
                </button>
                <button className={`settings-sidebar-item ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>
                    <Monitor size={18} /> {t.system}
                </button>
                <button className={`settings-sidebar-item ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>
                    <Info size={18} /> {t.about}
                </button>
            </div>

            <div className="settings-content">
                <h1 className="settings-title">{t[activeTab]}</h1>

                {activeTab === 'general' && (
                    <div className="settings-section">
                        {/* Home Page setting removed */}
                        
                        <div className="settings-group">
                            <label>{t.searchEngine}</label>
                            <select 
                                className="settings-input" 
                                value={searchEngines?.find(e => e.url === settings.searchEngine)?.url || settings.searchEngine} 
                                onChange={(e) => saveSettings({...settings, searchEngine: e.target.value})}
                            >
                                {searchEngines?.map(engine => (
                                    <option key={engine.id} value={engine.url}>
                                        {engine.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="settings-group">
                            <label>{t.appearance}</label>
                            <select 
                                className="settings-input"
                                value={settings.theme}
                                onChange={(e) => saveSettings({...settings, theme: e.target.value})}
                            >
                                <option value="auto">{t.themeAuto}</option>
                                <option value="light">{t.themeLight}</option>
                                <option value="dark">{t.themeDark}</option>
                            </select>
                        </div>
                        <div className="settings-group">
                            <label>{t.language}</label>
                            <select 
                                className="settings-input"
                                value={settings.language}
                                onChange={(e) => saveSettings({...settings, language: e.target.value})}
                            >
                                <option value="en">English</option>
                                <option value="zh">中文</option>
                            </select>
                        </div>
                        <div className="settings-group">
                            <label>{t.userAgent}</label>
                            <input 
                                className="settings-input" 
                                value={settings.userAgent} 
                                onChange={(e) => saveSettings({...settings, userAgent: e.target.value})}
                                placeholder="Custom User Agent string"
                            />
                        </div>

                        <div className="settings-group">
                            <label>{t.downloadPath}</label>
                            <div style={{display: 'flex', gap: '8px'}}>
                                <input 
                                    className="settings-input" 
                                    value={settings.downloadPath} 
                                    readOnly
                                    placeholder="Click button to select folder"
                                />
                                <button className="btn-primary" onClick={async () => {
                                    if (window.electronAPI && window.electronAPI.selectFolder) {
                                        const result = await window.electronAPI.selectFolder();
                                        if (!result.canceled && result.filePaths.length > 0) {
                                            saveSettings({...settings, downloadPath: result.filePaths[0]});
                                        }
                                    } else {
                                        alert('Folder selection is not available in this environment.');
                                    }
                                }}>
                                    {t.select}
                                </button>
                            </div>
                        </div>

                        <div className="settings-divider"></div>
                        
                        <div className="settings-header-sub">
                            <h3>{t.bookmarksManager}</h3>
                            <button className="add-btn" onClick={addBookmark}>
                                <Plus size={16} /> {t.add}
                            </button>
                        </div>
                        
                        <div className="bookmarks-list">
                            {bookmarks.map(bm => (
                                <div key={bm.id} className="bookmark-row">
                                    {editingBookmarkId === bm.id ? (
                                        <div className="bookmark-edit-row">
                                            <input 
                                                className="edit-input"
                                                value={editBookmarkForm.title}
                                                onChange={e => setEditBookmarkForm({...editBookmarkForm, title: e.target.value})}
                                                placeholder="Title"
                                            />
                                            <input 
                                                className="edit-input"
                                                value={editBookmarkForm.url}
                                                onChange={e => setEditBookmarkForm({...editBookmarkForm, url: e.target.value})}
                                                placeholder="URL"
                                            />
                                            <div className="bookmark-actions">
                                                <button className="action-btn save" onClick={saveEditBookmark}><Save size={16} /></button>
                                                <button className="action-btn cancel" onClick={() => setEditingBookmarkId(null)}><X size={16} /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="bookmark-info">
                                                <div className="bookmark-title">{bm.title}</div>
                                                <div className="bookmark-url">{bm.url}</div>
                                            </div>
                                            <div className="bookmark-actions">
                                                <button className="action-btn edit" onClick={() => startEditBookmark(bm)}><Edit size={16} /></button>
                                                <button className="action-btn delete" onClick={() => deleteBookmark(bm.id)}><Trash2 size={16} /></button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {bookmarks.length === 0 && <div className="no-bookmarks">No bookmarks yet</div>}
                        </div>
                    </div>
                )}

                {activeTab === 'performance' && (
                    <div className="settings-section">
                        <div className="settings-card">
                            <div className="settings-toggle">
                                <div className="toggle-label-group">
                                    <label>{t.memorySaver}</label>
                                    <span className="settings-description">{t.memorySaverDesc}</span>
                                </div>
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={settings.memorySaver !== 'off'}
                                        onChange={(e) => saveSettings({...settings, memorySaver: e.target.checked ? 'balanced' : 'off'})}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            
                            {settings.memorySaver !== 'off' && (
                                <div className="radio-group indented">
                                    <label className="radio-option">
                                        <input 
                                            type="radio" 
                                            name="memorySaver" 
                                            checked={settings.memorySaver === 'moderate'}
                                            onChange={() => saveSettings({...settings, memorySaver: 'moderate'})}
                                        />
                                        <div className="radio-content">
                                            <div>{t.modeModerate}</div>
                                            <div>{t.modeModerateDesc}</div>
                                        </div>
                                    </label>
                                    <label className="radio-option">
                                        <input 
                                            type="radio" 
                                            name="memorySaver" 
                                            checked={settings.memorySaver === 'balanced'}
                                            onChange={() => saveSettings({...settings, memorySaver: 'balanced'})}
                                        />
                                        <div className="radio-content">
                                            <div>{t.modeBalanced}</div>
                                            <div>{t.modeBalancedDesc}</div>
                                        </div>
                                    </label>
                                    <label className="radio-option">
                                        <input 
                                            type="radio" 
                                            name="memorySaver" 
                                            checked={settings.memorySaver === 'max'}
                                            onChange={() => saveSettings({...settings, memorySaver: 'max'})}
                                        />
                                        <div className="radio-content">
                                            <div>{t.modeMax}</div>
                                            <div>{t.modeMaxDesc}</div>
                                        </div>
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className="settings-card">
                            <div className="settings-toggle">
                                <span>{t.tabHoverPreview}</span>
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={settings.tabHoverPreview}
                                        onChange={(e) => saveSettings({...settings, tabHoverPreview: e.target.checked})}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            <div className="settings-toggle">
                                <span>{t.tabMemoryUsage}</span>
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={settings.tabMemoryUsage}
                                        onChange={(e) => saveSettings({...settings, tabMemoryUsage: e.target.checked})}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        </div>

                        <div className="settings-group">
                            <label>{t.fontSize}</label>
                            <select 
                                className="settings-input"
                                value={settings.fontSize}
                                onChange={(e) => saveSettings({...settings, fontSize: e.target.value})}
                            >
                                <option value="small">Small</option>
                                <option value="medium">Medium (Recommended)</option>
                                <option value="large">Large</option>
                                <option value="xlarge">Extra Large</option>
                            </select>
                        </div>
                    </div>
                )}

                {activeTab === 'system' && (
                    <div className="settings-section">
                        <div className="settings-card">
                            <div className="settings-toggle">
                                <div className="toggle-label-group">
                                    <label>{t.graphicsAcceleration}</label>
                                    <span className="settings-description">Requires restart to take effect.</span>
                                </div>
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={settings.graphicsAcceleration}
                                        onChange={(e) => saveSettings({...settings, graphicsAcceleration: e.target.checked})}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        </div>

                        <div className="settings-group">
                            <label>{t.proxySettings}</label>
                            <button className="settings-action-row" onClick={openProxySettings}>
                                <span>Open your computer's proxy settings</span>
                                <ArrowRight size={16} />
                            </button>
                        </div>

                        <div className="settings-divider"></div>
                        
                        <div className="settings-group">
                            <label>{t.resetSettings}</label>
                            <button className="btn-danger" onClick={resetSettings}>
                                <RefreshCcw size={14} style={{marginRight: 6}} />
                                {t.resetConfirm}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'privacy' && (
                    <div className="settings-section">
                        <div className="settings-group">
                            <label>{t.clearHistory}</label>
                            <button className="btn-danger" onClick={clearHistory}>
                                <Trash2 size={14} style={{marginRight: 6}} />
                                {t.clearHistory}
                            </button>
                        </div>

                        <div className="settings-divider"></div>

                        <div className="settings-group">
                            <label>{t.sitePermissions}</label>
                            
                            <div className="permission-row">
                                <div className="permission-label">
                                    <Settings size={14}/> {t.location}
                                </div>
                                <select 
                                    className="settings-input"
                                    value={settings.locationPermission}
                                    onChange={(e) => saveSettings({...settings, locationPermission: e.target.value})}
                                >
                                    <option value="ask">{t.askEveryTime}</option>
                                    <option value="allow">{t.alwaysAllow}</option>
                                    <option value="block">{t.block}</option>
                                </select>
                            </div>

                            <div className="permission-row">
                                <div className="permission-label">
                                    <Settings size={14}/> {t.camera}
                                </div>
                                <select 
                                    className="settings-input"
                                    value={settings.cameraPermission}
                                    onChange={(e) => saveSettings({...settings, cameraPermission: e.target.value})}
                                >
                                    <option value="ask">{t.askEveryTime}</option>
                                    <option value="allow">{t.alwaysAllow}</option>
                                    <option value="block">{t.block}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'about' && (
                    <div className="settings-section about-section">
                        <Monitor size={64} color="#2196F3" />
                        <h1 className="app-name">BrowserMos</h1>
                        <p className="app-version">Version 1.0.0 (Beta)</p>
                        
                        <div className="settings-divider"></div>
                        
                        <div className="about-details">
                            <h4>Privacy Notice</h4>
                            <p>
                                BrowserMos prioritizes your privacy. We do not collect personal data. 
                                All history and settings are stored locally on your device.
                            </p>

                            <h4>Open Source</h4>
                            <p>
                                This project is open source. You can contribute or report issues on GitHub.
                            </p>
                            <a href="https://github.com/yourusername/browsermos" onClick={(e) => handleExternalLink(e, 'https://github.com/yourusername/browsermos')} className="about-link">
                                Visit GitHub Repository
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;
