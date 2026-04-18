import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Moon, Sun } from 'lucide-react';
import Editor from './components/Editor.tsx';
import Sidebar from './components/Sidebar.tsx';
import OutputPanel from './components/OutputPanel.tsx';
// @ts-ignore
import './App.css';

// --- Interfaces ---
interface FileItem {
  id: string;
  name: string;
  content: string;
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
  // --- State Management ---
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showFlowchart, setShowFlowchart] = useState(false);
  const [openFiles, setOpenFiles] = useState<FileItem[]>([]);
  const [activeFileId, setActiveFileId] = useState('');
  const [creatingFile, setCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileError, setNewFileError] = useState('');
  
  // Execution & Repair State
  const [output, setOutput] = useState('');
  const [errors, setErrors] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedCode, setSuggestedCode] = useState<string | null>(null);
  const [allErrors, setAllErrors] = useState<string[]>([]);
  const [allAttempts, setAllAttempts] = useState<Attempt[]>([]);

  const activeFile = openFiles.find((file) => file.id === activeFileId);

  // --- File Operations ---
  const createFile = () => {
    const name = newFileName.trim();
    if (!name) {
      setNewFileError('File name is required.');
      return;
    }
    if (openFiles.some((file) => file.name === name)) {
      setNewFileError('A file with that name already exists.');
      return;
    }

    const file: FileItem = { id: name, name, content: '' };
    setOpenFiles((current) => [...current, file]);
    setActiveFileId(file.id);
    setCreatingFile(false);
    setNewFileName('');
    setNewFileError('');
  };

  const cancelCreateFile = () => {
    setCreatingFile(false);
    setNewFileName('');
    setNewFileError('');
  };

  const closeFile = (fileId: string) => {
    setOpenFiles((files) => {
      const nextFiles = files.filter((file) => file.id !== fileId);
      if (nextFiles.length === 0) {
        setActiveFileId('');
      } else if (fileId === activeFileId) {
        setActiveFileId(nextFiles[nextFiles.length - 1].id);
      }
      return nextFiles;
    });
  };

  const updateFileContent = (fileId: string, content: string) => {
    setOpenFiles((files) =>
      files.map((file) =>
        file.id === fileId ? { ...file, content } : file
      )
    );
  };

  // --- Core Logic: Run & Repair ---
  const handleRun = async () => {
    if (!activeFile) {
      alert('Please open a file first');
      return;
    }

    setIsLoading(true);
    setOutput('Running analysis...');
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
        setAllErrors(data.attempts.map((a) => `Attempt ${a.attempt}:\n${a.error}`));
        setOutput('Errors were detected and fixed. See the Errors and Fix tabs.');
        setErrors(data.attempts[0].error || data.error || 'Unknown error');
        setSuggestedCode(data.attempts[data.attempts.length - 1].fixed_code);
      } else if (data.success) {
        setAllAttempts([]);
        setAllErrors([]);
        setOutput(data.output || 'Code executed successfully!');
        setErrors('');
        setSuggestedCode(null);
      } else {
        setAllAttempts([]);
        setAllErrors([data.error || 'Unknown error']);
        setOutput('Code has errors. No fix could be suggested.');
        setErrors(data.error || 'Unknown error');
        setSuggestedCode(null);
      }
    } catch (error) {
      setOutput('Error connecting to backend');
      setErrors(String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptFix = () => {
    if (suggestedCode && activeFileId) {
      updateFileContent(activeFileId, suggestedCode);
      setSuggestedCode(null);
      setOutput('Fix applied! Click Run to test again.');
      setErrors('');
    }
  };

  const handleRejectFix = () => {
    setSuggestedCode(null);
    setOutput('Fix rejected. Original code preserved.');
  };

  const handleDownload = () => {
    alert('PDF Audit Trail generation starting...');
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`app ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="title-bar">
        <div className="title-logo">
          <img src="/logo.png" alt="Airlock logo" className="app-logo" />
          <h1>Airlock - AI Code Debugger</h1>
        </div>
        
        <div className="header-actions">
          <button
            className={`visualize-btn ${showFlowchart ? 'active' : ''}`}
            onClick={() => setShowFlowchart(!showFlowchart)}
            title="Visualize Debugging Logic"
          >
            <span>Visualize</span>
          </button>

          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      <PanelGroup direction="horizontal" className="main-layout">
        {/* Left Sidebar */}
        <Panel defaultSize={10} minSize={8} maxSize={18}>
          <Sidebar 
            onRun={handleRun} 
            onDownload={handleDownload} 
            // This allows the sidebar to toggle the error panel open
            onShowErrors={() => setShowOutput(true)} 
          />
        </Panel>

        <PanelResizeHandle className="resize-handle" />

        {/* Main Editor Area */}
        <Panel defaultSize={70} minSize={40}>
          <div className="editor-panel">
            <div className="tab-bar">
              {openFiles.map((file) => (
                <button
                  key={file.id}
                  className={`file-tab ${file.id === activeFileId ? 'active' : ''}`}
                  onClick={() => setActiveFileId(file.id)}
                >
                  <span>{file.name}</span>
                  <span
                    className="close-tab"
                    onClick={(event) => {
                      event.stopPropagation();
                      closeFile(file.id);
                    }}
                  >
                    ×
                  </span>
                </button>
              ))}

              <button
                className="new-file-action"
                onClick={() => {
                  setCreatingFile(true);
                  setNewFileError('');
                }}
              >
                + New File
              </button>
            </div>

            {creatingFile && (
              <div className="new-file-row">
                <input
                  className="new-file-input"
                  value={newFileName}
                  onChange={(event) => setNewFileName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      createFile();
                    }
                  }}
                  placeholder="Enter file name..."
                  autoFocus
                />
                <button className="new-file-confirm" onClick={createFile}>Create</button>
                <button className="new-file-cancel" onClick={cancelCreateFile}>Cancel</button>
                {newFileError && <div className="new-file-error">{newFileError}</div>}
              </div>
            )}

            {openFiles.length === 0 ? (
              <div className="editor-placeholder">
                <p className="editor-placeholder-text">No file open. Create a new file to start debugging.</p>
                <button
                  className="new-file-action large"
                  onClick={() => setCreatingFile(true)}
                >
                  Create a file
                </button>
              </div>
            ) : (
              <div className="editor-container">
                <Editor
                  value={activeFile?.content ?? ''}
                  onChange={(value: string | undefined) => updateFileContent(activeFileId, value || '')}
                  theme={isDarkMode ? 'vs-dark' : 'light'}
                />
              </div>
            )}
          </div>
        </Panel>

        {showOutput && (
          <>
            <PanelResizeHandle className="resize-handle" />
            <Panel defaultSize={30} minSize={20}>
              <OutputPanel 
                output={output} 
                errors={errors} 
                allErrors={allErrors}
                allAttempts={allAttempts}
                suggestedCode={suggestedCode}
                originalCode={activeFile?.content || null}
                onAccept={handleAcceptFix}
                onReject={handleRejectFix}
                isLoading={isLoading}
                onClose={() => setShowOutput(false)} 
              />
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}

export default App;