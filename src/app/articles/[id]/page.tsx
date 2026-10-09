'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Heart, MessageSquare, Share2, Bookmark, Clock } from 'lucide-react';
import { useAuth } from '../../../lib/authContext';
import { getArticle, Article } from '../../../lib/communityDb';

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getArticle(id as string);
      setArticle(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setLiked(!liked);
    if (article) {
      setArticle({
        ...article,
        likesCount: liked ? article.likesCount - 1 : article.likesCount + 1
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060E1E] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#060E1E] flex flex-col items-center justify-center text-white">
        <p className="text-xl font-bold mb-4">Article Not Found</p>
        <Link href="/articles" className="text-emerald-400 hover:underline">← Back to Articles</Link>
      </div>
    );
  }

  const date = new Date(article.publishedAt?.seconds ? article.publishedAt.seconds * 1000 : article.publishedAt).toLocaleDateString(undefined, {
    month: 'long', day: 'numeric', year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#060E1E] text-white">
      {/* Top Nav */}
      <div className="bg-slate-900/80 border-b border-white/5 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/articles" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
            <ArrowLeft size={20} /> <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className={`p-2 rounded-full transition-colors flex items-center gap-2 ${liked ? 'text-rose-500 bg-rose-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <Heart size={20} fill={liked ? "currentColor" : "none"} />
            </button>
            <button className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
              <Bookmark size={20} />
            </button>
            <button className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-lg mb-6">
            {article.category}
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            {article.title}
          </h1>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
              {article.authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-white font-bold">{article.authorName}</div>
              <div className="text-sm text-slate-400 flex items-center gap-2">
                {date} • <Clock size={14} /> {article.readTimeMinutes} min read • {article.views} views
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-emerald max-w-none text-slate-300 mb-12">
          <div dangerouslySetInnerHTML={{ __html: article.bodyRichText }} />
        </div>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-8 border-t border-white/5">
            {article.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-slate-800 text-slate-300 text-sm font-medium rounded-lg">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Comments Section */}
        <div className="mt-16 pt-8 border-t border-white/5">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <MessageSquare size={24} className="text-slate-400" /> Comments (0)
          </h3>
          
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 mb-8">
            <textarea
              placeholder={user ? "Share your thoughts..." : "Sign in to leave a comment..."}
              disabled={!user}
              className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none resize-none"
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <button disabled={!user} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all">
                Post Comment
              </button>
            </div>
          </div>

          <div className="text-center py-12 text-slate-500 text-sm">
            No comments yet. Be the first to start the discussion!
          </div>
        </div>
      </main>
    </div>
  );
}
