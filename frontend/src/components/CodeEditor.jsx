'use client';

import Editor from '@monaco-editor/react';
import { useRef, useState } from 'react';

export default function CodeEditor({ 
  value, 
  onChange, 
  language = 'javascript',
  theme = 'vs-dark',
  height = '400px'
}) {
  console.log('CodeEditor component rendering with value:', value?.substring(0, 50) + '...');
  const editorRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleEditorDidMount = (editor, monaco) => {
    console.log('Monaco Editor mounted successfully!');
    editorRef.current = editor;
    setIsLoading(false);

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      tabSize: 2,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'on',
    });

    // Add custom keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      // Trigger code execution or analysis
      const code = editor.getValue();
      if (onChange) {
        onChange(code, 'execute');
      }
    });
  };

  const handleEditorChange = (value) => {
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className="relative w-full h-full border rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-10">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Loading editor...</span>
          </div>
        </div>
      )}
      <Editor
        height={height}
        defaultLanguage={language}
        value={value}
        theme={theme}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          tabSize: 2,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
        }}
      />
    </div>
  );
}