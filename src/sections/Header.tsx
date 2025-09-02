'use client';

import Image from 'next/image';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header = ({ activeTab, setActiveTab }: HeaderProps) => {
  const tabs = [
    { id: 'patients', label: 'Patients', icon: '👥' },
    { id: 'visits', label: 'Visits', icon: '🏥' },
  ];

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4">
            <div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex-shrink-0">
                  <Image 
                    src="/logo.png" 
                    alt="ClinicClerk Logo" 
                    width={40}
                    height={40}
                    className="w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 object-contain"
                    priority
                  />
                </div>
                <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold truncate">
                  <span className="text-gray-900">Clinic</span>
                  <span className="text-blue-800">Clerk</span>
                </h1>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <span className="hidden sm:inline text-xs sm:text-sm text-gray-500">Patient Records Management</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="grid grid-cols-2 gap-2 sm:flex sm:gap-0 sm:space-x-4 lg:space-x-6 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 sm:px-4 sm:py-2 font-medium text-sm flex items-center justify-center sm:justify-start space-x-2 transition-colors whitespace-nowrap rounded-full ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-sm sm:text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};