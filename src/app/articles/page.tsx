'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, TrendingUp, Clock, Plus, ChevronRight, MessageSquare, Heart, Bookmark } from 'lucide-react';
import { getPublishedArticles, Article } from '../../lib/communityDb';

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await getPublishedArticles();
      setArticles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060E1E] text-white">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-slate-900 border-b border-white/5 pt-12 pb-16 px-4">
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
              <BookOpen size={16} /> Community Knowledge
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
              Learn from the <span className="text-emerald-400">Best.</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-xl">
              Read interview experiences, system design tutorials, and career advice written by the SmartHire community.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link href="/articles/new">
              <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                <Plus size={18} /> Write an Article
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Filters */}
        <div className="flex items-center gap-4 border-b border-white/5 pb-4 mb-8 overflow-x-auto">
          <button className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold whitespace-nowrap">
            Latest
          </button>
          <button className="px-4 py-2 text-slate-400 hover:text-white rounded-lg text-sm font-bold flex items-center gap-2 whitespace-nowrap">
            <TrendingUp size={16} /> Trending
          </button>
          <div className="w-px h-6 bg-white/10 mx-2" />
          {['Engineering', 'Product Management', 'Interview Experience'].map(tag => (
            <button key={tag} className="px-4 py-2 text-slate-400 hover:text-white rounded-lg text-sm font-medium whitespace-nowrap">
              {tag}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-slate-800/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 border border-white/5 rounded-2xl">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen size={24} className="text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No articles yet</h3>
            <p className="text-slate-400 mb-6">Be the first to share your knowledge with the community!</p>
            <Link href="/articles/new">
              <button className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all">
                Write an Article
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article) => {
              const date = new Date(article.publishedAt?.seconds ? article.publishedAt.seconds * 1000 : article.publishedAt).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric'
              });
              
              return (
                <Link key={article.id} href={`/articles/${article.id}`}>
                  <div className="group h-full bg-slate-900 border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-black/20 flex flex-col cursor-pointer">
                    
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                        {article.authorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{article.authorName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                          {date} • {article.readTimeMinutes} min read
                        </div>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    
                    {/* Extract a short snippet from HTML body for preview */}
                    <div className="text-sm text-slate-400 mb-6 line-clamp-3 flex-1" 
                         dangerouslySetInnerHTML={{ __html: article.bodyRichText.replace(/<[^>]+>/g, ' ') }} 
                    />

                    <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs font-medium rounded-md">
                          {article.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-slate-500">
                        <span className="flex items-center gap-1 text-xs hover:text-emerald-400 transition-colors"><Heart size={14} /> {article.likesCount}</span>
                        <span className="flex items-center gap-1 text-xs hover:text-white transition-colors"><Bookmark size={14} /></span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
