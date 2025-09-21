'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/sections/Header';
import AdminPatients from '@/components/Patients';
import AdminVisits from '@/components/Visits';
import LandingPage from './landing/page';

export default function Home() {
  const [activeTab, setActiveTab] = useState('patients');
  const [visitedTabs, setVisitedTabs] = useState(new Set(['patients'])); // Track which tabs have been visited
  const { user, loading } = useAuth();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setVisitedTabs(prev => new Set([...prev, tab]));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f3f3f7' }}>
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show landing page for all unauthenticated users (standard SaaS approach)
  if (!user) {
    return <LandingPage />;
  }

  // Show dashboard for authenticated users
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f3f3f7' }}>
      <Header activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Only render components that have been visited */}
          {activeTab === 'patients' && <AdminPatients />}
          {activeTab === 'visits' && visitedTabs.has('visits') && <AdminVisits />}
        </motion.div>
      </div>
    </div>
  );
}