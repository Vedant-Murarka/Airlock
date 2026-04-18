import { useState } from 'react';
import { Terminal, AlertCircle, CheckCircle, Check, X, Loader2 } from 'lucide-react';

interface OutputPanelProps {
  output: string;
  errors: string;
  allErrors?: string[];
  allAttempts?: { attempt: number; error: string; fixed_code: string; explanation: string; confidence: number }[];
  suggestedCode?: string | null;
  originalCode?: string | null;
  onAccept?: () => void;
  onReject?: () => void;
  isLoading?: boolean;
  loadingStatus?: string;
  optimization?: {code: string, explanation: string} | null;
  isOptimizing?: boolean;
}

// Function to compare lines and find changed ones
const getChangedLines = (original: string, fixed: string): Set<number> => {
  const originalLines = original.split('\n');
  const fixedLines = fixed.split('\n');
  const changedLines = new Set<number>();
  
  const maxLines = Math.max(originalLines.length, fixedLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const origLine = originalLines[i] || '';
    const fixedLine = fixedLines[i] || '';
    
    if (origLine.trim() !== fixedLine.trim()) {
      changedLines.add(i + 1); // 1-indexed line numbers
    }
  }
  
  return changedLines;
};

const OutputPanel = ({ output, allErrors = [], suggestedCode, originalCode, onAccept, onReject, isLoading, loadingStatus, optimization, isOptimizing }: OutputPanelProps) => {
  // Default to Fix tab if there was a fix, else Output
  const [activeTab, setActiveTab] = useState<'output' | 'errors' | 'suggestion' | 'optimization'>(suggestedCode ? 'suggestion' : 'output');

  // Get changed lines if we have both original and suggested code
  const changedLines = (originalCode && suggestedCode) 
    ? getChangedLines(originalCode, suggestedCode) 
    : new Set<number>();

  // Render code with line numbers and highlighting
  const renderCodeWithHighlights = (code: string) => {
    const lines = code.split('\n');
    return lines.map((line, index) => {
      const lineNumber = index + 1;
      const isChanged = changedLines.has(lineNumber);
      
      return (
        <div 
          key={index} 
          className={`code-line ${isChanged ? 'changed' : ''}`}
        >
          <span className="line-number">{lineNumber}</span>
          <span className="line-content">{line || ' '}</span>
        </div>
      );
    });
  };

  return (
    <div className="output-panel">
      <div className="output-tabs">
        <button
          className={`tab ${activeTab === 'output' ? 'active' : ''}`}
          onClick={() => setActiveTab('output')}
        >
          <Terminal size={14} />
          Output
        </button>
        <button
          className={`tab ${activeTab === 'errors' ? 'active' : ''}`}
          onClick={() => setActiveTab('errors')}
        >
          <AlertCircle size={14} />
          Errors
        </button>
        {suggestedCode && (
          <button
            className={`tab ${activeTab === 'suggestion' ? 'active' : ''}`}
            onClick={() => setActiveTab('suggestion')}
          >
            <CheckCircle size={14} />
            Fix
          </button>
        )}
        <button
          className={`tab ${activeTab === 'optimization' ? 'active' : ''}`}
          onClick={() => setActiveTab('optimization')}
        >
          {isOptimizing ? <Loader2 size={14} className="spinner" /> : <Terminal size={14} />}
          Optimization
        </button>
      </div>

      <div className="output-content">
        {isLoading && (
          <div className="loading-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', color: '#a0a0a0' }}>
            <Loader2 size={32} className="spinner" style={{ animation: 'spin 2s linear infinite' }} />
            <div style={{ fontSize: '1.1rem', fontFamily: 'monospace' }}>{loadingStatus || "Analyzing code..."}</div>
          </div>
        )}

        {activeTab === 'output' && !isLoading && (
          <div className="output-section">
            <pre className="output-text">{output || 'No output yet. Click Run to analyze your code.'}</pre>
          </div>
        )}

        {activeTab === 'errors' && !isLoading && (
          <div className="error-section">
            {allErrors.length > 0 ? (
              <div className="error-list">
                {allErrors.map((err, idx) => (
                  <div className="error-item" key={idx}>
                    <AlertCircle size={16} className="error-icon" />
                    <div className="error-details">
                      <div className="error-message">{err}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-errors">
                <CheckCircle size={20} className="success-icon" />
                <span>No errors found</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'suggestion' && !isLoading && suggestedCode && (
          <div className="suggestion-section">
            <div className="suggestion-header">
              <span>Suggested Fix</span>
              {changedLines.size > 0 && (
                <span className="changed-count">({changedLines.size} line(s) changed)</span>
              )}
            </div>
            <div className="suggested-code-container">
              {renderCodeWithHighlights(suggestedCode)}
            </div>
            <div className="suggestion-actions">
              <button className="accept-btn" onClick={onAccept}>
                <Check size={16} />
                Accept Fix
              </button>
              <button className="reject-btn" onClick={onReject}>
                <X size={16} />
                Reject
              </button>
            </div>
          </div>
        )}

        {activeTab === 'optimization' && (
          <div className="optimization-section">
            {isOptimizing ? (
              <div className="loading-section">
                <Loader2 size={24} className="spinner" />
                <span>Analyzing Time & Space Complexity...</span>
              </div>
            ) : optimization ? (
              <div className="suggestion-section">
                <div className="suggestion-header">
                  <span>Optimized Code & Analysis</span>
                </div>
                <div className="output-text" style={{ whiteSpace: 'pre-wrap', marginBottom: '1rem', color: '#a0a0a0' }}>
                  {optimization.explanation}
                </div>
                <div className="suggested-code-container">
                  {renderCodeWithHighlights(optimization.code)}
                </div>
              </div>
            ) : (
              <div className="output-text">No optimization analysis available. Run the code first.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;