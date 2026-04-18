import React, { useState } from 'react';
import { 
  FilePlus, 
  FolderPlus, 
  ChevronDown, 
  ChevronRight, 
  FileCode, 
  Folder, 
  Trash2, 
  MoreVertical 
} from 'lucide-react';

// --- Interfaces ---
interface FileSystemItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  isOpen?: boolean;
}

interface SidebarProps {
  items: FileSystemItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: (name: string, type: 'file' | 'folder', parentId: string | null) => void;
  onDelete: (id: string) => void;
  onToggleFolder: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  items, 
  activeId, 
  onSelect, 
  onAdd, 
  onDelete, 
  onToggleFolder 
}) => {
  // Local state for the creation input
  const [isNaming, setIsNaming] = useState<'file' | 'folder' | null>(null);
  const [newName, setNewName] = useState('');

  // Handle creating a new item when 'Enter' is pressed
  const handleCreate = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (newName.trim()) {
        onAdd(newName.trim(), isNaming!, null); // Currently adding to root
        setNewName('');
        setIsNaming(null);
      }
    } else if (e.key === 'Escape') {
      setIsNaming(null);
      setNewName('');
    }
  };

  // Helper to render the tree recursively (supporting 1-level for now as per App.tsx)
  const renderTree = (parentId: string | null, level: number = 0) => {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => {
        const isActive = activeId === item.id;
        const isFolder = item.type === 'folder';

        return (
          <React.Fragment key={item.id}>
            <div 
              className={`tree-item ${isActive ? 'active' : ''}`}
              style={{ paddingLeft: `${level * 12 + 12}px` }}
              onClick={() => {
                if (isFolder) {
                  onToggleFolder(item.id);
                } else {
                  onSelect(item.id);
                }
              }}
            >
              <div className="item-main">
                {isFolder ? (
                  item.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                ) : (
                  <FileCode size={14} className="file-icon" />
                )}
                
                {isFolder && <Folder size={14} className="folder-icon" />}
                <span className="item-name">{item.name}</span>
              </div>

              <div className="item-actions">
                <Trash2 
                  size={13} 
                  className="delete-action" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }} 
                />
              </div>
            </div>

            {/* If folder is open, render its children */}
            {isFolder && item.isOpen && renderTree(item.id, level + 1)}
          </React.Fragment>
        );
      });
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="explorer-label">EXPLORER</span>
        <div className="header-tools">
          <button 
            className="icon-btn" 
            title="New File"
            onClick={() => setIsNaming('file')}
          >
            <FilePlus size={16} />
          </button>
          <button 
            className="icon-btn" 
            title="New Folder"
            onClick={() => setIsNaming('folder')}
          >
            <FolderPlus size={16} />
          </button>
          <button className="icon-btn">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      <div className="explorer-body">
        <div className="workspace-label">
          <ChevronDown size={14} />
          <span>AIRLOCK_PROJECT</span>
        </div>

        <div className="tree-container">
          {/* Inline naming input */}
          {isNaming && (
            <div className="naming-row" style={{ paddingLeft: '24px' }}>
              {isNaming === 'file' ? <FileCode size={14} /> : <Folder size={14} />}
              <input
                autoFocus
                className="naming-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleCreate}
                onBlur={() => setIsNaming(null)}
                placeholder={`name your ${isNaming}...`}
              />
            </div>
          )}

          {/* Recursive Tree Render */}
          {items.length === 0 && !isNaming ? (
            <div className="empty-state">
              <p>  No files yet.</p>
            </div>
          ) : (
            renderTree(null)
          )}
        </div>
      </div>
      
      
    </div>
  );
};

export default Sidebar;