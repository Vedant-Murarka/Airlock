import { useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  theme: 'vs-dark' | 'light';
}

const Editor = ({ value, onChange, theme }: CodeEditorProps) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  return (
    <div className="code-editor">
      <MonacoEditor
        height="100%"
        language="python"
        value={value}
        theme={theme}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          tabSize: 4,
          insertSpaces: true,
          detectIndentation: false,
        }}
      />
    </div>
  );
};

export default Editor;