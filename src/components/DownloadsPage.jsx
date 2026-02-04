import React, { useState } from 'react';
import { Download, Folder, Pause, Play, RefreshCw, Search, File, X, Trash2 } from 'lucide-react';
import './DownloadsPage.css';

const DownloadsPage = ({ downloads, pauseDownload, resumeDownload, cancelDownload, openDownloadFolder, deleteDownload, t }) => {
    const [searchText, setSearchText] = useState('');

    const filteredDownloads = downloads.filter(item => 
        item.filename.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div className="downloads-page">
            <div className="downloads-header">
                <div className="downloads-title">
                    <Download size={24} />
                    <h1>{t.downloads}</h1>
                </div>
                <div className="downloads-search">
                    <Search size={16} />
                    <input 
                        placeholder={t.searchDownloads}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
                <button className="open-folder-btn" onClick={() => openDownloadFolder()}>
                    <Folder size={16} /> {t.openDownloadsFolder}
                </button>
            </div>

            <div className="downloads-content">
                {filteredDownloads.length === 0 ? (
                    <div className="empty-downloads">
                        <Download size={48} opacity={0.2} />
                        <p>{t.noDownloads}</p>
                    </div>
                ) : (
                    <div className="downloads-list">
                        {filteredDownloads.map(item => (
                            <div key={item.id} className="download-item">
                                <div className="download-icon">
                                    <File size={24} color="#666" />
                                </div>
                                <div className="download-info">
                                    <div className="download-filename">{item.filename}</div>
                                    <div className="download-url">{item.url}</div>
                                    <div className="download-meta">
                                        {item.state === 'progressing' && (
                                            <span className="download-status progressing">
                                                {Math.round(item.receivedBytes / 1024)}KB / {Math.round(item.totalBytes / 1024)}KB
                                            </span>
                                        )}
                                        {item.state === 'interrupted' && <span className="download-status interrupted">{t.interrupted}</span>}
                                        {item.state === 'completed' && <span className="download-status completed">{t.completed}</span>}
                                        <span className="download-date">{new Date(item.startTime).toLocaleDateString()}</span>
                                    </div>
                                    {item.state === 'progressing' && (
                                        <div className="progress-bar-bg">
                                            <div 
                                                className="progress-bar-fill" 
                                                style={{width: `${(item.receivedBytes / item.totalBytes) * 100}%`}}
                                            ></div>
                                        </div>
                                    )}
                                </div>
                                <div className="download-actions">
                                    {item.state === 'progressing' && (
                                        <button className="action-btn" onClick={() => pauseDownload(item.id)} title={t.pause}>
                                            <Pause size={16} />
                                        </button>
                                    )}
                                    {item.state === 'interrupted' && (
                                        <button className="action-btn" onClick={() => resumeDownload(item.id)} title={t.resume}>
                                            <Play size={16} />
                                        </button>
                                    )}
                                    {item.state === 'completed' && (
                                        <button className="action-btn" onClick={() => openDownloadFolder(item.path)} title={t.showInFolder}>
                                            <Folder size={16} />
                                        </button>
                                    )}
                                    {(item.state === 'progressing' || item.state === 'interrupted') && (
                                        <button className="action-btn delete" onClick={() => cancelDownload(item.id)} title={t.cancel}>
                                            <X size={16} />
                                        </button>
                                    )}
                                    {/* Delete Button for all states */}
                                    <button className="action-btn delete" onClick={() => deleteDownload(item.id)} title={t.delete}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DownloadsPage;
