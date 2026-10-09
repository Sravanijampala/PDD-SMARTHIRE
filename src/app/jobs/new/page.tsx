'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, Building, MapPin, Briefcase } from 'lucide-react';
import { useAuth } from '../../../lib/authContext';
import { postJob, JobPosting } from '../../../lib/communityDb';

export default function NewJobPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    locationType: 'onsite' as JobPosting['locationType'],
    experienceLevel: 'entry' as JobPosting['experienceLevel'],
    description: '',
    applyMethod: 'in_app' as JobPosting['applyMethod'],
    applyUrl: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user === null) {
      router.push('/login');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!formData.title || !formData.company || !formData.description) {
      alert('Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Expires in 30 days by default

      await postJob({
        postedByUserId: user.id,
        ...formData,
        expiresAt
      });

      router.push('/jobs');
    } catch (e: any) {
      alert(`Error posting job: ${e.message}`);
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#060E1E] text-white">
      {/* Top Nav */}
      <div className="bg-slate-900/80 border-b border-white/5 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/jobs" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <span className="font-bold">Post a Job Opening</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white mb-4">Job Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Company Name *</label>
                  <div className="relative">
                    <Building size={18} className="absolute left-4 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Corp"
                      value={formData.company}
                      onChange={e => setFormData({ ...formData, company: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Location</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-4 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. San Francisco, CA"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Workplace Type</label>
                  <select
                    value={formData.locationType}
                    onChange={e => setFormData({ ...formData, locationType: e.target.value as JobPosting['locationType'] })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 appearance-none"
                  >
                    <option value="onsite">On-site</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Experience Level</label>
                  <select
                    value={formData.experienceLevel}
                    onChange={e => setFormData({ ...formData, experienceLevel: e.target.value as JobPosting['experienceLevel'] })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 appearance-none"
                  >
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="lead">Lead / Manager</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white mb-4">Job Description</h2>
            <div>
              <textarea
                required
                rows={8}
                placeholder="Describe the responsibilities, requirements, and benefits..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 resize-y"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white mb-4">Application Method</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`p-4 border rounded-xl cursor-pointer transition-colors ${formData.applyMethod === 'in_app' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-slate-950 hover:bg-slate-800'}`}>
                <input 
                  type="radio" 
                  name="applyMethod" 
                  checked={formData.applyMethod === 'in_app'}
                  onChange={() => setFormData({ ...formData, applyMethod: 'in_app' })}
                  className="sr-only" 
                />
                <div className="font-bold text-white mb-1">Easy Apply (In-App)</div>
                <div className="text-xs text-slate-400">Receive applications and resumes directly in your dashboard.</div>
              </label>
              
              <label className={`p-4 border rounded-xl cursor-pointer transition-colors ${formData.applyMethod === 'external_url' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-slate-950 hover:bg-slate-800'}`}>
                <input 
                  type="radio" 
                  name="applyMethod" 
                  checked={formData.applyMethod === 'external_url'}
                  onChange={() => setFormData({ ...formData, applyMethod: 'external_url' })}
                  className="sr-only" 
                />
                <div className="font-bold text-white mb-1">External Link</div>
                <div className="text-xs text-slate-400">Direct applicants to your company's career page or ATS.</div>
              </label>
            </div>
            
            {formData.applyMethod === 'external_url' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-300 mb-1">External Application URL *</label>
                <input
                  type="url"
                  required={formData.applyMethod === 'external_url'}
                  placeholder="https://careers.acmecorp.com/..."
                  value={formData.applyUrl}
                  onChange={e => setFormData({ ...formData, applyUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Link href="/jobs">
              <button type="button" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all">
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              Post Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
