import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DASHBOARD_SECTIONS } from '../Dashboard';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';

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

  const handleNavClick = (sectionId: string, path: string) => {
    onSectionChange(sectionId);
    navigate(path);
  };

  return (
    <div 
      className="fixed left-0 top-0 h-full bg-white border-r transition-all duration-300 ease-out flex flex-col"
      style={{ 
        width: isCollapsed ? '56px' : '220px',
        borderColor: '#ebebeb',
        fontFamily: 'Archivo, sans-serif'
      }}
    >
      {/* Logo */}
      <div 
        className={`flex items-center ${isCollapsed ? 'px-2 pt-4 pb-4' : 'pl-4 pr-2 pt-4 pb-4'}`}
      >
        <button onClick={() => navigate('/referencing')}>
          <img
            src={isCollapsed ? '/images/Proptii ico.png' : '/images/proptii-logo.png'}
            alt="Proptii"
            className="h-8 object-contain"
          />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 pt-2 pb-2 pl-4 pr-2 space-y-2">
        {DASHBOARD_SECTIONS.map((section) => (
          <div key={section?.id ?? ''}>
            <button
              onClick={() => section && handleNavClick(section.id, section.path)}
              className={`w-full h-10 px-3 rounded-md text-sm font-medium flex items-center transition-all duration-300 ${
                activeSection === section?.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={{
                justifyContent: isCollapsed ? 'center' : 'flex-start'
              }}
            >
              <div className={`w-5 h-5 flex items-center justify-center ${
                activeSection === section?.id 
                  ? '' 
                  : 'bg-gray-100 rounded-full p-1'
              }`}>
                {section?.icon?.(activeSection === section?.id)}
              </div>
              {!isCollapsed && (
                <span className="ml-3 whitespace-nowrap">{section?.label ?? ''}</span>
              )}
            </button>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-4 py-2">
        <div className="border-t border-gray-200 pt-2">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center h-6 text-gray-400 hover:text-gray-600 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Proptii Home Button */}
      <div className="p-4">
        <button
          onClick={() => navigate('/')}
          className={`w-full h-10 px-3 rounded-lg border-2 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
            isCollapsed 
              ? 'bg-orange-500 text-white hover:bg-orange-600 border-orange-500' 
              : 'border-orange-400 text-orange-600 hover:bg-orange-50 bg-white'
          }`}
        >
          <Home className="w-4 h-4" />
          {!isCollapsed && 'Proptii Home'}
        </button>
      </div>
    </div>
  );
};

export default DashboardSidebar;
