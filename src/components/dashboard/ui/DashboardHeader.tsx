import React from 'react';
import { Phone, Mail, Sparkles } from 'lucide-react';

interface DashboardHeaderProps {
  userName: string;
}

/**
 * Dashboard header component with user information and welcome message
 */
const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName }) => {
  return (
    <div 
      className="bg-white shadow-lg rounded-xl px-8 py-6"
      style={{ fontFamily: 'Archivo, sans-serif' }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Welcome Message */}
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-lg mr-3">
            T
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
            <span className="inline-flex items-center ml-2">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              <span className="text-sm font-normal text-green-600">Verified</span>
            </span>
          </div>
        </div>

        {/* Middle Column - Contact Info */}
        <div className="flex flex-col justify-center space-y-2">
          <div 
            className="flex items-center space-x-2 px-3 py-2 rounded-lg"
            style={{ backgroundColor: '#F7F7F7' }}
          >
            <Phone className="w-4 h-4" style={{ color: '#374957' }} />
            <span className="text-sm" style={{ color: '#374957' }}>
              +44 7911 123456
            </span>
          </div>
          
          <div 
            className="flex items-center space-x-2 px-3 py-2 rounded-lg"
            style={{ backgroundColor: '#F7F7F7' }}
          >
            <Mail className="w-4 h-4" style={{ color: '#374957' }} />
            <span className="text-sm" style={{ color: '#374957' }}>
              TosinLanipekun@Luxcity.omnicrosoft
            </span>
          </div>
        </div>

        {/* Right Column - PropWise Button */}
        <div className="flex justify-end items-center">
          <div
            className="bg-white rounded-2xl border border-gray-200 px-6 py-4 cursor-pointer transition-all duration-300 min-h-[3.5rem] flex items-center justify-center flex-shrink-0"
            style={{
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
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
                <p className="text-xs leading-tight" style={{ color: '#717182' }}>AI Assistant</p>
              </div>
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#136C9E' }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader; 