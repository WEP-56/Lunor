import React, { useState, useMemo } from 'react';
import { Search, Clock, Calendar, Trash2, X } from 'lucide-react';
import './HistoryPage.css';

const HistoryPage = ({ history, clearHistory, deleteHistoryItem, t, onOpenUrl }) => {
    const [searchText, setSearchText] = useState('');

    const handleLinkClick = (e, url) => {
        e.preventDefault();
        if (onOpenUrl) onOpenUrl(url);
    };

    const filteredHistory = useMemo(() => {
        if (!searchText) return history;
        const lowerSearch = searchText.toLowerCase();
        return history.filter(item => 
            item.title.toLowerCase().includes(lowerSearch) || 
            item.url.toLowerCase().includes(lowerSearch)
        );
    }, [history, searchText]);

    // Group by date
    const groupedHistory = useMemo(() => {
        const groups = {};
        filteredHistory.forEach(item => {
            const date = new Date(item.timestamp).toLocaleDateString();
            if (!groups[date]) groups[date] = [];
            groups[date].push(item);
        });
        return groups;
    }, [filteredHistory]);

    return (
        <div className="history-page">
            <div className="history-header">
                <div className="history-title">
                    <Clock size={24} />
                    <h1>{t.history}</h1>
                </div>
                <div className="history-search">
                    <Search size={16} />
                    <input 
                        placeholder={t.searchHistory}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
                <button className="clear-history-btn" onClick={clearHistory}>
                    <Trash2 size={16} /> {t.clearHistory}
                </button>
            </div>

            <div className="history-content">
                {Object.keys(groupedHistory).length === 0 ? (
                    <div className="empty-history">
                        <Clock size={48} opacity={0.2} />
                        <p>{t.noHistory}</p>
                    </div>
                ) : (
                    Object.entries(groupedHistory).sort((a, b) => new Date(b[0]) - new Date(a[0])).map(([date, items]) => (
                        <div key={date} className="history-group">
                            <h3 className="history-date"><Calendar size={14} style={{marginRight: 6}}/> {date}</h3>
                            <div className="history-list">
                                {items.map(item => (
                                    <div key={item.id} className="history-item">
                                        <div className="history-time">
                                            {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                        <div className="history-info">
                                            <a href={item.url} onClick={(e) => handleLinkClick(e, item.url)} className="history-link-title">{item.title || item.url}</a>
                                            <div className="history-link-url">{item.url}</div>
                                        </div>
                                        <button className="delete-item-btn" onClick={() => deleteHistoryItem(item.id)}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HistoryPage;
