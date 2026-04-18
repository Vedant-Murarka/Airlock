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
  onClose: () => void; // Added onClose prop
  isLoading?: boolean;
}

const getChangedLines = (original: string, fixed: string): Set<number> => {
  const originalLines = original.split('\n');
  const fixedLines = fixed.split('\n');
  const changedLines = new Set<number>();
  const maxLines = Math.max(originalLines.length, fixedLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const origLine = originalLines[i] || '';
    const fixedLine = fixedLines[i] || '';
    if (origLine.trim() !== fixedLine.trim()) {
      changedLines.add(i + 1);
    }
  }
  return changedLines;
};

const OutputPanel = ({ 
  output, 
  allErrors = [], 
  suggestedCode, 
  originalCode, 
  onAccept, 
  onReject, 
  onClose, // Destructured
  isLoading 
}: OutputPanelProps) => {
  const [activeTab, setActiveTab] = useState<'output' | 'errors' | 'suggestion'>(suggestedCode ? 'suggestion' : 'output');

  const changedLines = (originalCode && suggestedCode) 
    ? getChangedLines(originalCode, suggestedCode) 
    : new Set<number>();

  const renderCodeWithHighlights = (code: string) => {
    const lines = code.split('\n');
    return lines.map((line, index) => {
      const lineNumber = index + 1;
      const isChanged = changedLines.has(lineNumber);
      return (
        <div key={index} className={`code-line ${isChanged ? 'changed' : ''}`}>
          <span className="line-number">{lineNumber}</span>
          <span className="line-content">{line || ' '}</span>
        </div>
      );
    });
  };

  return (
    <div className="output-panel">
      {/* HEADER SECTION WITH TABS AND CLOSE BUTTON */}
      <div className="output-panel-header">
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
        </div>

        {/* CLOSE ACTION */}
        <button 
          className="close-panel-btn" 
          onClick={onClose} 
          title="Close Panel"
        >
          <X size={16} />
        </button>
      </div>

      <div className="output-content">
        {isLoading && (
          <div className="loading-section">
            <Loader2 size={24} className="spinner" />
            <span>Analyzing code...</span>
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
      </div>
    </div>
  );
};

export default OutputPanel;