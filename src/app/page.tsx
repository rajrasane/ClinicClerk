'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/sections/Header';
import AdminPatients from '@/components/Patients';
import AdminVisits from '@/components/Visits';

export default function Home() {
  const [activeTab, setActiveTab] = useState('patients');
  const [visitedTabs, setVisitedTabs] = useState(new Set(['patients'])); // Track which tabs have been visited

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setVisitedTabs(prev => new Set([...prev, tab]));
  };

  return (
    <div className="min-h-screen bg-gray-50">
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