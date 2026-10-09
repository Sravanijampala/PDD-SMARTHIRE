'use client';

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { 
  Bold, Italic, List, ListOrdered, Quote, 
  Heading2, Heading3, Link as LinkIcon, Image as ImageIcon 
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    
    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-slate-900 border-b border-white/10 rounded-t-xl sticky top-0 z-10">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-slate-800 transition-colors ${editor.isActive('bold') ? 'text-indigo-400 bg-slate-800' : 'text-slate-400'}`}
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-slate-800 transition-colors ${editor.isActive('italic') ? 'text-indigo-400 bg-slate-800' : 'text-slate-400'}`}
      >
        <Italic size={16} />
      </button>
      
      <div className="w-px h-6 bg-white/10 self-center mx-1" />
      
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-slate-800 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'text-indigo-400 bg-slate-800' : 'text-slate-400'}`}
      >
        <Heading2 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-2 rounded hover:bg-slate-800 transition-colors ${editor.isActive('heading', { level: 3 }) ? 'text-indigo-400 bg-slate-800' : 'text-slate-400'}`}
      >
        <Heading3 size={16} />
      </button>
      
      <div className="w-px h-6 bg-white/10 self-center mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-slate-800 transition-colors ${editor.isActive('bulletList') ? 'text-indigo-400 bg-slate-800' : 'text-slate-400'}`}
      >
        <List size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-slate-800 transition-colors ${editor.isActive('orderedList') ? 'text-indigo-400 bg-slate-800' : 'text-slate-400'}`}
      >
        <ListOrdered size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded hover:bg-slate-800 transition-colors ${editor.isActive('blockquote') ? 'text-indigo-400 bg-slate-800' : 'text-slate-400'}`}
      >
        <Quote size={16} />
      </button>
      
      <div className="w-px h-6 bg-white/10 self-center mx-1" />

      <button onClick={setLink} className={`p-2 rounded hover:bg-slate-800 transition-colors ${editor.isActive('link') ? 'text-indigo-400 bg-slate-800' : 'text-slate-400'}`}>
        <LinkIcon size={16} />
      </button>
      <button onClick={addImage} className="p-2 rounded hover:bg-slate-800 transition-colors text-slate-400">
        <ImageIcon size={16} />
      </button>
    </div>
  );
};

export default function RichTextEditor({ content, onChange, placeholder = 'Write your article here...' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] p-4 text-slate-300',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-slate-900/50">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
