'use client';

import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings } from 'lucide-react';
import { UserGroupIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAIClick?: () => void;
}

export const Header = ({ activeTab, setActiveTab, onAIClick }: HeaderProps) => {
  const { user, doctor, doctorLoading, signOut } = useAuth();
  const router = useRouter();
  
  const tabs = [
    { id: 'patients', label: 'Patients', icon: UserGroupIcon },
    { id: 'visits', label: 'Visits', icon: ClockIcon },
  ];

  // Get doctor display name
  const doctorName = doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : '';
  const isLoadingDoctor = doctorLoading;

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch {
      toast.error('Error signing out');
    }
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center py-3 sm:py-6">
            {/* Logo and Title */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="shrink-0">
                <Image 
                  src="/logo.png" 
                  alt="ClinicClerk Logo" 
                  width={96}
                  height={96}
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain"
                  priority
                  quality={100}
                />
              </div>
              <h1 className="text-lg sm:text-3xl font-bold truncate">
                <span className="text-gray-900">Clinic</span>
                <span className="text-blue-800">Clerk</span>
              </h1>
            </div>
            
            {/* AI Assistant Button, Welcome Message and Avatar Dropdown */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* AI Assistant Button */}
              {onAIClick && (
                <button
                  onClick={onAIClick}
                  className="relative flex items-center gap-1 px-[7px] py-[7px] rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-colors group"
                  title="AI Assistant"
                >
                  <SparklesIcon className="w-5 h-5 text-blue-600" />
                  <span className="hidden sm:inline text-sm font-medium text-blue-700">
                    AI
                  </span>
                </button>
              )}
              
              {/* Welcome message - hidden on xs screens */}
              <div className="hidden sm:block text-right">
                <div className="text-xs sm:text-sm font-medium text-gray-900">
                  Welcome back!
                </div>
                <div className="text-xs text-gray-600 max-w-32 truncate">
                  {isLoadingDoctor ? (
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    doctorName || user?.email
                  )}
                </div>
              </div>

              {/* Avatar Dropdown for all screens */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 hover:opacity-80 transition-opacity focus:outline-none rounded-full">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                      <AvatarImage src="" alt={doctorName || user?.email || ''} />
                      <AvatarFallback className="bg-blue-600 text-white font-semibold text-sm">
                        {isLoadingDoctor ? (
                          <div className="h-4 w-4 bg-blue-400 rounded animate-pulse"></div>
                        ) : (
                          doctorName ? getInitials(doctorName) : user?.email?.[0]?.toUpperCase() || 'U'
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-56 bg-white border border-gray-200 shadow-lg rounded-md p-1"
                  sideOffset={5}
                >
                  <DropdownMenuLabel className="px-2 py-1.5 text-sm font-semibold text-gray-900">
                    My Account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  <DropdownMenuItem 
                    disabled 
                    className="px-2 py-2 text-sm text-gray-700 cursor-default focus:bg-transparent"
                  >
                    <User className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="truncate">
                      {isLoadingDoctor ? (
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        doctorName || user?.email
                      )}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  <DropdownMenuItem 
                    onClick={() => router.push('/profile')} 
                    className="px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="px-2 py-2 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};