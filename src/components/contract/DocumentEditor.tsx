import React, { useState, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered } from 'lucide-react';

interface DocumentEditorProps {
  initialContent: string;
  onContentChange: (content: string) => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ initialContent, onContentChange }) => {
  const [content, setContent] = useState(initialContent);
  const [fontFamily, setFontFamily] = useState('Roboto');
  const [fontSize, setFontSize] = useState(12);
  
  // Update parent component when content changes
  useEffect(() => {
    onContentChange(content);
  }, [content, onContentChange]);

  // Handle font size changes
  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 1, 24));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 1, 8));
  };

  // Execute document commands for formatting
  const formatText = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    // Force focus back to the editor
    const editor = document.getElementById('contract-editor');
    if (editor) editor.focus();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Formatting Toolbar */}
      <div className="mb-4 p-2 bg-gray-50 border border-gray-200 rounded-md flex flex-wrap items-center gap-2">
        {/* Font Family */}
        <select 
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="bg-white border border-gray-300 text-gray-700 py-1 px-3 rounded text-sm"
        >
          <option value="Roboto">Roboto</option>
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Georgia">Georgia</option>
        </select>
        
        {/* Font Size */}
        <div className="inline-flex border border-gray-300 rounded bg-white">
          <button 
            onClick={decreaseFontSize}
            className="px-2 py-1 border-r border-gray-300 hover:bg-gray-100"
          >
            <span className="text-sm">−</span>
          </button>
          <span className="px-3 py-1">{fontSize}</span>
          <button 
            onClick={increaseFontSize}
            className="px-2 py-1 border-l border-gray-300 hover:bg-gray-100"
          >
            <span className="text-sm">+</span>
          </button>
        </div>
        
        {/* Text Formatting */}
        <button 
          onClick={() => formatText('bold')}
          className="p-1 border border-gray-300 rounded hover:bg-gray-100" 
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button 
          onClick={() => formatText('italic')}
          className="p-1 border border-gray-300 rounded hover:bg-gray-100" 
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button 
          onClick={() => formatText('underline')}
          className="p-1 border border-gray-300 rounded hover:bg-gray-100" 
          title="Underline"
        >
          <Underline size={16} />
        </button>
        
        {/* Text Alignment */}
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        <button 
          onClick={() => formatText('justifyLeft')}
          className="p-1 border border-gray-300 rounded hover:bg-gray-100" 
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        <button 
          onClick={() => formatText('justifyCenter')}
          className="p-1 border border-gray-300 rounded hover:bg-gray-100" 
          title="Align Center"
        >
          <AlignCenter size={16} />
        </button>
        <button 
          onClick={() => formatText('justifyRight')}
          className="p-1 border border-gray-300 rounded hover:bg-gray-100" 
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>
        
        {/* Lists */}
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        <button 
          onClick={() => formatText('insertUnorderedList')}
          className="p-1 border border-gray-300 rounded hover:bg-gray-100" 
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button 
          onClick={() => formatText('insertOrderedList')}
          className="p-1 border border-gray-300 rounded hover:bg-gray-100" 
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
      </div>
      
      {/* Editable Document Area */}
      <div 
        id="contract-editor"
        className="border border-gray-300 rounded-md p-6 min-h-[400px] max-h-[500px] overflow-y-auto"
        contentEditable={true}
        suppressContentEditableWarning={true}
        style={{ fontFamily, fontSize: `${fontSize}px` }}
        onInput={(e) => setContent((e.target as HTMLDivElement).innerHTML)}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};

export default DocumentEditor;