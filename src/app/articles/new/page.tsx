'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../../../lib/authContext';
import { publishArticle } from '../../../lib/communityDb';
import RichTextEditor from '../../../components/ui/RichTextEditor';

export default function NewArticlePage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Engineering');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user === null) {
      router.push('/login');
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      const readTime = Math.max(1, Math.ceil(content.split(' ').length / 200));

      const articleId = await publishArticle({
        authorId: user.id,
        authorName: user.name || user.email || 'Anonymous',
        title,
        bodyRichText: content,
        category,
        tags: tagList,
        readTimeMinutes: readTime,
        status: 'published' // Auto-approve for demo
      });

      router.push('/articles');
    } catch (e: any) {
      alert(`Error publishing article: ${e.message}`);
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#060E1E] text-white">
      {/* Top Nav */}
      <div className="bg-slate-900/80 border-b border-white/5 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/articles" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <span className="font-bold">Draft Article</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Publish
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <input
          type="text"
          placeholder="Article Title..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full bg-transparent text-4xl md:text-5xl font-extrabold text-white placeholder-slate-600 focus:outline-none mb-6"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
            >
              <option>Engineering</option>
              <option>Product Management</option>
              <option>Design</option>
              <option>Data Science</option>
              <option>Interview Experience</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tags (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. React, System Design, Google"
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Editor Wrapper */}
        <div className="mb-12">
          <RichTextEditor content={content} onChange={setContent} />
        </div>
      </div>
    </div>
  );
}
