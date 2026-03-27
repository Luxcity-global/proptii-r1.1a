import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DASHBOARD_SECTIONS } from "../Dashboard";
import { ChevronLeft, ChevronRight, Home, User } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface DashboardSidebarProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeSection,
  onSectionChange,
  isCollapsed,
  onToggleCollapse,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNavClick = (sectionId: string, path: string) => {
    onSectionChange(sectionId);
    navigate(path);
  };

  const handleLogoClick = () => {
    window.location.href = '/';
  };

  return (
    <div 
      className="group peer hidden md:block"
      style={{ color: '#374957' }}
    >
      {/* Sidebar Container */}
      <div 
        className="fixed inset-y-0 left-0 z-10 h-screen transition-all duration-300 ease-out bg-white border-r"
        style={{ 
          width: isCollapsed ? '56px' : '200px',
          borderColor: '#ebebeb',
          fontFamily: 'Archivo, sans-serif'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b" style={{ borderColor: '#ebebeb' }}>
            <div className={`pt-2 pb-2 ${isCollapsed ? 'px-2' : 'pl-4 pr-2'}`}>
              <div className={`flex items-center h-8 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
                {isCollapsed ? (
                  <img 
                    src="/images/Proptii ico.png" 
                    alt="Proptii Logo" 
                    className="w-8 h-8 object-contain flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={handleLogoClick}
                    title="Go to Home"
                  />
                ) : (
                  <img 
                    src="/images/proptii-logo.png" 
                    alt="Proptii Logo" 
                    className="h-8 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={handleLogoClick}
                    title="Go to Home"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-auto">
            <div className="pt-2 pb-2 pl-4 pr-2">
              <div className="space-y-3">
                {DASHBOARD_SECTIONS.map((section) => {
                  const isActive = activeSection === section?.id;
                  return (
                    <button
                      key={section?.id ?? ''}
                      onClick={() => section && handleNavClick(section.id, section.path)}
                      className={`
                        w-full flex items-center h-10 px-3 rounded-md text-sm font-medium transition-colors
                        ${isCollapsed ? 'justify-center' : 'justify-start'}
                      `}
                      style={{ 
                        alignItems: 'center',
                        color: isActive ? '#136C9E' : '#374957',
                        backgroundColor: isActive ? '#E6F3FF' : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = '#F3F4F6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <div className="relative flex-shrink-0">
                        {section?.icon?.(isActive)}
                      </div>
                      {!isCollapsed && (
                        <span className="ml-2 truncate">{section?.label ?? ''}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* User Profile */}
          {user && (
            <div className="border-t" style={{ borderColor: '#ebebeb' }}>
              <div className="pt-2 pb-2 pl-4 pr-2">
                <div className="flex items-center h-8 px-2">
                  <div className="h-4 w-4 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <User className="h-2 w-2" style={{ color: '#374957' }} />
                  </div>
                  {!isCollapsed && (
                    <div className="ml-2 min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold" style={{ color: '#374957' }}>
                        {user.name || user.givenName || 'User'}
                      </div>
                      <div className="truncate text-xs opacity-70" style={{ color: '#374957' }}>
                        {user.email || ''}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Trigger */}
          <div className="border-t" style={{ borderColor: '#ebebeb' }}>
            <div className="pt-2 pb-2 px-4 space-y-2">
              {/* Collapse/Expand Trigger */}
              <button
                onClick={onToggleCollapse}
                className="w-full flex items-center justify-center h-8 px-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" style={{ color: '#374957' }} />
                ) : (
                  <ChevronLeft className="h-4 w-4" style={{ color: '#374957' }} />
                )}
              </button>
              
              {/* Proptii Home Button */}
              {isCollapsed ? (
                <button 
                  onClick={handleLogoClick}
                  className="w-full flex items-center justify-center h-8 px-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                  title="Go to Home"
                >
                  <Home className="h-4 w-4" />
                </button>
              ) : (
                <button 
                  onClick={handleLogoClick}
                  className="w-full flex items-center justify-center h-8 px-2 rounded-full border-2 border-orange-400 text-orange-600 hover:bg-orange-50 transition-colors text-sm font-medium"
                  title="Go to Home"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Proptii Home
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Spacer for content */}
      <div 
        className="transition-all duration-300 ease-out"
        style={{
          width: isCollapsed ? '56px' : '200px'
        }}
      />
    </div>
  );
};

export default DashboardSidebar;
