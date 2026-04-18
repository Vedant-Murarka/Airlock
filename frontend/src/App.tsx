import { useState, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Moon, Sun, Play, AlertTriangle, Settings, Download, Layout, X } from 'lucide-react';
import Editor from './components/Editor.tsx';
import Sidebar from './components/Sidebar.tsx';
import OutputPanel from './components/OutputPanel.tsx';
// @ts-ignore
import './App.css';

// --- Interfaces ---
interface FileSystemItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  parentId: string | null;
  isOpen?: boolean;
}

interface Attempt {
  attempt: number;
  error: string;
  fixed_code: string;
  explanation: string;
  confidence: number;
}

interface ApiResponse {
  success: boolean;
  final_code: string;
  output?: string;
  error?: string;
  attempts: Attempt[];
}

function App() {
  // --- UI & Theme State ---
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showFlowchart, setShowFlowchart] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  
  // --- File System & Tab State ---
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>([]);
  const [openFileIds, setOpenFileIds] = useState<string[]>([]); // Tracks open tabs
  const [activeFileId, setActiveFileId] = useState('');
  
  // --- Execution & Repair State ---
  const [output, setOutput] = useState('');
  const [errors, setErrors] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedCode, setSuggestedCode] = useState<string | null>(null);
  const [allErrors, setAllErrors] = useState<string[]>([]);
  const [allAttempts, setAllAttempts] = useState<Attempt[]>([]);

  // Derived State: Current Active File Object
  const activeFile = fileSystem.find((f) => f.id === activeFileId && f.type === 'file');

  // --- Persistence ---
  useEffect(() => {
    const savedFs = localStorage.getItem('airlock_fs');
    if (savedFs) {
      try {
        setFileSystem(JSON.parse(savedFs));
      } catch (e) {
        console.error("Failed to load file system", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('airlock_fs', JSON.stringify(fileSystem));
  }, [fileSystem]);

  // --- Tab Management Logic ---
  const handleFileSelect = (id: string) => {
    setActiveFileId(id);
    if (!openFileIds.includes(id)) {
      setOpenFileIds((prev) => [...prev, id]);
    }
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const filteredTabs = openFileIds.filter(tabId => tabId !== id);
    setOpenFileIds(filteredTabs);
    
    // Logic to handle active tab focus after closing
    if (id === activeFileId) {
      if (filteredTabs.length > 0) {
        setActiveFileId(filteredTabs[filteredTabs.length - 1]);
      } else {
        setActiveFileId('');
      }
    }
  };

  // --- File System Operations ---
  const addItem = (name: string, type: 'file' | 'folder', parentId: string | null = null) => {
    const newItem: FileSystemItem = {
      id: `${Date.now()}`,
      name: name.trim(),
      type,
      content: type === 'file' ? '# New Python file\n' : undefined,
      parentId,
      isOpen: true
    };

    setFileSystem((prev) => [...prev, newItem]);
    if (type === 'file') {
      handleFileSelect(newItem.id);
    }
  };

  const deleteItem = (id: string) => {
    const idsToDelete = new Set([id]);
    const findChildren = (pid: string) => {
      fileSystem.forEach(item => {
        if (item.parentId === pid) {
          idsToDelete.add(item.id);
          if (item.type === 'folder') findChildren(item.id);
        }
      });
    };
    findChildren(id);

    setFileSystem((prev) => prev.filter(item => !idsToDelete.has(item.id)));
    // Clean up closed tabs
    setOpenFileIds((prev) => prev.filter(tabId => !idsToDelete.has(tabId)));
    if (idsToDelete.has(activeFileId)) setActiveFileId('');
  };

  const updateFileContent = (fileId: string, content: string) => {
    setFileSystem((prev) =>
      prev.map((item) => (item.id === fileId ? { ...item, content } : item))
    );
  };

  const toggleFolder = (id: string) => {
    setFileSystem(prev => prev.map(item => 
      item.id === id ? { ...item, isOpen: !item.isOpen } : item
    ));
  };

  // --- Core Execution Logic ---
  const handleRun = async () => {
    if (!activeFile) {
      alert('Please select an active file tab to analyze.');
      return;
    }

    setIsLoading(true);
    setOutput('Mentor is analyzing your logic...');
    setErrors('');
    setSuggestedCode(null);
    setShowOutput(true);

    try {
      const response = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: activeFile.content }),
      });

      const data: ApiResponse = await response.json();

      if (data.attempts && data.attempts.length > 0) {
        setAllAttempts(data.attempts);
        setAllErrors(data.attempts.map((a) => `Attempt ${a.attempt}: ${a.error}`));
        setOutput('Bugs were detected and fixed. Check the "Fix" tab.');
        setErrors(data.attempts[data.attempts.length - 1].error || 'Error detected');
        setSuggestedCode(data.attempts[data.attempts.length - 1].fixed_code);
      } else {
        setOutput(data.output || 'Execution successful! No errors found.');
        setErrors('');
        setSuggestedCode(null);
        setAllAttempts([]);
      }
    } catch (error) {
      setOutput('Error: Could not connect to the analysis backend.');
      setErrors(String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptFix = () => {
    if (suggestedCode && activeFileId) {
      updateFileContent(activeFileId, suggestedCode);
      setSuggestedCode(null);
      setOutput('Fix applied successfully!');
      setErrors('');
    }
  };

  const handleRejectFix = () => setSuggestedCode(null);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div className={`app ${isDarkMode ? 'dark' : 'light'}`}>
      {/* 1. Header Area */}
      <div className="title-bar">
        <div className="title-logo">
          <img src="/logo.png" alt="logo" className="app-logo" />
          <h1>Airlock</h1>
        </div>

        <div className="center-actions">
          <button className="tool-btn run-main" onClick={handleRun} disabled={isLoading}>
            <Play size={14} fill={isLoading ? "gray" : "#4ade80"} /> 
            <span>{isLoading ? '...' : 'Run'}</span>
          </button>
          <button className="tool-btn" onClick={() => setShowOutput(true)}>
            <AlertTriangle size={14} /> <span>Errors</span>
          </button>
          <button 
            className={`tool-btn ${showFlowchart ? 'active' : ''}`}
            onClick={() => setShowFlowchart(!showFlowchart)}
          >
            <Layout size={14} /> <span>Visualize</span>
          </button>
        </div>
        
        <div className="header-actions">
          <button className="tool-btn icon-only" title="Settings"><Settings size={14} /></button>
          <button className="tool-btn icon-only" title="Download"><Download size={14} /></button>
          <div className="divider-v" />
          <button className="theme-toggle" onClick={toggleTheme}>
            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>

      {/* 2. Main Layout Area */}
      <PanelGroup direction="horizontal" className="main-layout">
        <Panel defaultSize={18} minSize={12} maxSize={30}>
          <Sidebar 
            items={fileSystem} 
            activeId={activeFileId}
            onSelect={handleFileSelect} // Pass handleFileSelect to open tabs
            onAdd={addItem}
            onDelete={deleteItem}
            onToggleFolder={toggleFolder}
          />
        </Panel>

        <PanelResizeHandle className="resize-handle" />

        <Panel defaultSize={82}>
          <div className="editor-panel">
            {/* 3. VS Code-style Tabs Bar */}
            <div className="tabs-container">
              {openFileIds.map(id => {
                const file = fileSystem.find(f => f.id === id);
                if (!file) return null;
                return (
                  <div 
                    key={id} 
                    className={`tab-item ${activeFileId === id ? 'active' : ''}`}
                    onClick={() => setActiveFileId(id)}
                  >
                    <span className="tab-name">{file.name}</span>
                    <X 
                      size={14} 
                      className="tab-close" 
                      onClick={(e) => closeTab(e, id)} 
                    />
                  </div>
                );
              })}
            </div>

            <PanelGroup direction="vertical">
              <Panel defaultSize={70}>
                <div className="editor-container">
                  {activeFile ? (
                    <Editor
                      value={activeFile.content ?? ''}
                      onChange={(val: string | undefined) => updateFileContent(activeFileId, val || '')}
                      theme={isDarkMode ? 'vs-dark' : 'light'}
                    />
                  ) : (
                    <div className="editor-placeholder">
                      <div className="placeholder-content">
                        <p>Select a file to begin debugging</p>
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
              
              {showOutput && (
                <>
                  <PanelResizeHandle className="resize-handle-h" />
                  <Panel defaultSize={30}>
                    <OutputPanel 
                      output={output} 
                      errors={errors}
                      allErrors={allErrors}
                      allAttempts={allAttempts}
                      suggestedCode={suggestedCode}
                      originalCode={activeFile?.content || null}
                      onAccept={handleAcceptFix}
                      onReject={handleRejectFix}
                      onClose={() => setShowOutput(false)}
                      isLoading={isLoading}
                    />
                  </Panel>
                </>
              )}
            </PanelGroup>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}

export default App;