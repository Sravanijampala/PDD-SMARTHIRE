'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Briefcase, Building, MapPin, Search, Plus, Filter, Clock } from 'lucide-react';
import { getPublishedJobs, JobPosting } from '../../lib/communityDb';

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await getPublishedJobs();
      setJobs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    j.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#060E1E] text-white">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-slate-900 border-b border-white/5 pt-12 pb-16 px-4">
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
              <Briefcase size={16} /> Job Board
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
              Find Your <span className="text-indigo-400">Next Role.</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-xl">
              Discover openings from top tech companies and apply directly through SmartHire.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link href="/jobs/new">
              <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2">
                <Plus size={18} /> Post a Job
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Sidebar Filters */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 text-white font-bold mb-4">
              <Filter size={18} className="text-slate-400" /> Filters
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-300 mb-3">Workplace Type</h4>
                <div className="space-y-2">
                  {['On-site', 'Hybrid', 'Remote'].map(type => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded bg-slate-800 border-white/10 text-indigo-500 focus:ring-0 focus:ring-offset-0" />
                      <span className="text-sm text-slate-400">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-300 mb-3">Experience Level</h4>
                <div className="space-y-2">
                  {['Entry Level', 'Mid Level', 'Senior Level', 'Lead / Manager'].map(level => (
                    <label key={level} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded bg-slate-800 border-white/10 text-indigo-500 focus:ring-0 focus:ring-offset-0" />
                      <span className="text-sm text-slate-400">{level}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job Feed */}
        <div className="flex-1">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search size={20} className="absolute left-4 top-3.5 text-slate-500" />
            <input 
              type="text"
              placeholder="Search by title or company..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-800/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/50 border border-white/5 rounded-2xl">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase size={24} className="text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No jobs found</h3>
              <p className="text-slate-400">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => {
                const date = new Date(job.createdAt?.seconds ? job.createdAt.seconds * 1000 : job.createdAt).toLocaleDateString();
                
                return (
                  <div key={job.id} className="group bg-slate-900 border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-black/20 flex flex-col md:flex-row md:items-center gap-6 cursor-pointer">
                    
                    <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10">
                      <Building size={24} className="text-slate-400" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors truncate">
                        {job.title}
                      </h3>
                      <div className="text-lg text-slate-300 font-medium mb-3 truncate">
                        {job.company}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <MapPin size={14} /> {job.location || 'Remote'}
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Clock size={14} /> {date}
                        </span>
                        <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded capitalize">
                          {job.locationType}
                        </span>
                        <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded capitalize">
                          {job.experienceLevel}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 mt-4 md:mt-0">
                      <button className="w-full md:w-auto px-6 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg transition-colors border border-white/10">
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
