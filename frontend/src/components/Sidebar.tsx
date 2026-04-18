import { Play, AlertTriangle, Download, Settings } from 'lucide-react';

interface SidebarProps {
  onRun: () => void;
  onDownload: () => void;
  onShowErrors: () => void; // New prop for showing the error panel
}

const Sidebar = ({ onRun, onDownload, onShowErrors }: SidebarProps) => {
  return (
    <div className="sidebar">
      <div className="sidebar-buttons">
        <button
          className="sidebar-button"
          onClick={onRun}
          title="Run Code Analysis"
        >
          <Play size={20} />
        </button>

        <button
          className="sidebar-button"
          onClick={onShowErrors} // Trigger the panel opening
          title="View Errors"
        >
          <AlertTriangle size={20} />
        </button>

        <button
          className="sidebar-button"
          title="Settings"
        >
          <Settings size={20} />
        </button>

        <button
          className="sidebar-button"
          onClick={onDownload}
          title="Download PDF Report"
        >
          <Download size={20} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;