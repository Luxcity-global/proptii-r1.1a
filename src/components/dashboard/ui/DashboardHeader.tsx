import React from 'react';
import { Phone, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useIsMobile } from './use-mobile';
import PlanBadgePopover from '../PlanBadgePopover';

interface DashboardHeaderProps {
  userName: string;
  userEmail?: string;
  userPhone?: string;
}

/**
 * Dashboard header component with user information and welcome message
 */
const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName, userEmail, userPhone }) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  return (
    <div 
      className={`bg-white shadow-lg rounded-xl ${isMobile ? 'px-4 py-4' : 'px-4 md:px-8 py-4 md:py-6'}`}
      style={{ fontFamily: 'Archivo, sans-serif' }}
    >
      {isMobile ? (
        // Mobile Header - Streamlined
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-base mr-3">
                {(userName || "User").charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 
                  className="text-lg font-semibold"
                  style={{ 
                    color: '#374957',
                    fontFamily: 'Archivo, sans-serif'
                  }}
                >
                  Welcome <span style={{ color: '#136C9E' }}>{userName}</span>
                </h1>
                <span className="inline-flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  <span className="text-xs font-normal text-green-600">Verified</span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="bg-white rounded-lg border border-gray-200 px-4 py-2 cursor-pointer transition-all duration-300 flex items-center justify-center flex-1"
              style={{ boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4" style={{ color: '#136C9E' }} />
                <span className="text-sm font-medium" style={{ color: '#374957' }}>PropWise</span>
              </div>
            </div>
            <PlanBadgePopover />
          </div>
        </div>
      ) : (
        // Desktop Header
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Welcome Message */}
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-lg mr-3">
              {(userName || "User").charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 
                className="text-xl font-semibold mb-1"
                style={{ 
                  color: '#374957',
                  fontFamily: 'Archivo, sans-serif'
                }}
              >
                Welcome <span style={{ color: '#136C9E' }}>{userName}</span>
              </h1>
              <p 
                className="text-sm"
                style={{ color: '#717182' }}
              >
                Here's what's happening with your property search
              </p>
              <span className="inline-flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                <span className="text-sm font-normal text-green-600">Verified</span>
              </span>
            </div>
          </div>

          {/* Middle Column - Contact Info */}
          <div className="flex flex-col justify-center space-y-2">
            <div 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg"
              style={{ backgroundColor: '#F7F7F7', width: '280px' }}
            >
              <Phone className="w-4 h-4 flex-shrink-0" style={{ color: '#374957' }} />
              <span className="text-sm" style={{ color: '#374957' }}>
                {userPhone || user?.phone || '+44 7911 123456'}
              </span>
            </div>
            
            <div 
              className="flex items-center space-x-2 px-3 py-2 rounded-lg"
              style={{ backgroundColor: '#F7F7F7', width: '280px' }}
            >
              <Mail className="w-4 h-4 flex-shrink-0" style={{ color: '#374957' }} />
              <span className="text-sm" style={{ color: '#374957' }}>
                {userEmail || user?.email || 'user@example.com'}
              </span>
            </div>
          </div>
          
          {/* Right Column - PropWise + Plan Badge */}
          <div className="flex justify-end items-center gap-3">
            <div
              className="bg-white rounded-2xl border border-gray-200 px-6 py-4 cursor-pointer transition-all duration-300 min-h-[3.5rem] flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 248, 220, 0.6), 0 4px 10px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #F3FFDD 0%, #EEFFFF 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(0px)';
                e.currentTarget.style.background = 'white';
              }}
            >
              <div className="flex items-center space-x-3">
                <div className="text-left">
                  <p className="text-sm leading-tight font-medium" style={{ color: '#374957' }}>PropWise</p>
                  <p className="text-xs leading-tight" style={{ color: '#717182' }}>AI Powered</p>
                </div>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#136C9E' }}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            <PlanBadgePopover />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHeader; 