import React, { useState, useEffect, useRef } from 'react';
import './NewTab.css';
import { Search, ChevronDown, Globe, Zap, Search as SearchIcon } from 'lucide-react';

const ENGINES = [
    { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', icon: <Globe size={18} color="#4285F4"/> },
    { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=', icon: <Zap size={18} color="#008080"/> },
    { id: 'baidu', name: 'Baidu', url: 'https://www.baidu.com/s?wd=', icon: <div style={{width:18, height:18, background:'#2932E1', borderRadius: '50%', color:'white', fontSize:10, display:'flex', alignItems:'center', justifyContent:'center'}}>度</div> },
    { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', icon: <div style={{width:18, height:18, background:'#DE5833', borderRadius: '50%', color:'white', fontSize:10, display:'flex', alignItems:'center', justifyContent:'center'}}>D</div> },
];

const NewTab = ({ onSearch, t }) => {
    const [searchText, setSearchText] = useState('');
    const [selectedEngine, setSelectedEngine] = useState(ENGINES[0]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleSearch = () => {
        if (!searchText.trim()) return;

        let url = searchText.trim();
        // Check if it's a URL
        const isUrl = /^(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/g.test(url);
        
        if (isUrl) {
            if (!url.startsWith('http')) {
                url = 'https://' + url;
            }
        } else {
            // Use search engine
            url = selectedEngine.url + encodeURIComponent(url);
        }
        
        onSearch(url);
    };

    return (
        <div className="new-tab-container">
            <div className="new-tab-bg"></div>
            
            <div className="new-tab-content">
                <h1 className="greeting">{t.greeting}</h1>
                
                <div className="search-container">
                    <div className="engine-selector" ref={dropdownRef} onClick={() => setShowDropdown(!showDropdown)}>
                        <div className="current-engine">
                            {selectedEngine.icon}
                            <ChevronDown size={14} color="#666" />
                        </div>
                        
                        {showDropdown && (
                            <div className="engine-dropdown">
                                {ENGINES.map(engine => (
                                    <div 
                                        key={engine.id} 
                                        className="engine-option"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedEngine(engine);
                                            setShowDropdown(false);
                                        }}
                                    >
                                        {engine.icon}
                                        <span>{engine.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <input 
                        className="search-input"
                        placeholder={`${t.searchWith} ${selectedEngine.name} ${t.orEnterAddress}`}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                    
                    <button className="search-btn" onClick={handleSearch}>
                        <SearchIcon size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewTab;
