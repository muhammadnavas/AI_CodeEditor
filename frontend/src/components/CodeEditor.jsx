'use client';

import Editor from '@monaco-editor/react';
import { useEffect, useRef, useState } from 'react';

const SUPPORTED_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', icon: '🟨' },
  { id: 'python', name: 'Python', icon: '🐍' },
  { id: 'java', name: 'Java', icon: '☕' },
  { id: 'cpp', name: 'C++', icon: '⚡' }
];

export default function CodeEditor({ 
  value, 
  onChange, 
  language = 'javascript',
  onLanguageChange,
  signatures = {},
  theme = 'vs-dark',
  height = '400px',
  showLanguageSelector = false
}) {
  console.log('CodeEditor component rendering with value:', value?.substring(0, 50) + '...');
  const editorRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState(language);

  // Update internal language state when prop changes
  useEffect(() => {
    setCurrentLanguage(language);
  }, [language]);

  // Update editor language when currentLanguage changes
  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const monaco = window.monaco;
        if (monaco) {
          console.log('Setting Monaco editor language to:', currentLanguage);
          monaco.editor.setModelLanguage(model, currentLanguage);
        }
      }
    }
  }, [currentLanguage]);

  // Handle language switching
  const handleLanguageSwitch = (newLanguage) => {
    setCurrentLanguage(newLanguage);
    
    // Load signature for new language
    const newSignature = signatures[newLanguage] || '';
    if (newSignature && editorRef.current) {
      editorRef.current.setValue(newSignature);
    }
    
    // Notify parent component
    if (onLanguageChange) {
      onLanguageChange(newLanguage, newSignature);
    }
  };

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

    // Set initial language
    const model = editor.getModel();
    if (model && currentLanguage) {
      console.log('Setting initial Monaco editor language to:', currentLanguage);
      monaco.editor.setModelLanguage(model, currentLanguage);
    }
  };

  const handleEditorChange = (value) => {
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className="relative w-full h-full border rounded-lg overflow-hidden">
      {/* Language Selector */}
      {showLanguageSelector && (
        <div className="absolute top-2 right-2 z-20 bg-gray-800 rounded-md shadow-lg">
          <div className="flex space-x-1 p-1">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => handleLanguageSwitch(lang.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  currentLanguage === lang.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                title={lang.name}
              >
                <span className="mr-1">{lang.icon}</span>
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-10">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Loading editor...</span>
          </div>
        </div>
      )}

      {/* Monaco Editor */}
      <Editor
        height={height}
        defaultLanguage={currentLanguage}
        language={currentLanguage}
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
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto'
          },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          acceptSuggestionOnCommitCharacter: true
        }}
      />

      {/* Language Info Footer */}
      {showLanguageSelector && (
        <div className="absolute bottom-2 right-2 z-20">
          <div className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs">
            {SUPPORTED_LANGUAGES.find(l => l.id === currentLanguage)?.name || currentLanguage}
          </div>
        </div>
      )}
    </div>
  );
}