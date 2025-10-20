import React from 'react';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  User, 
  Briefcase,
  ChevronRight
} from 'lucide-react';

/**
 * Tenant Referencing page - matches the exact design from the image
 */
const TenantReferencing: React.FC = () => {
  return (
    <div className="space-y-6 pb-8" style={{ fontFamily: 'Archivo, sans-serif' }}>
      {/* Header Section */}
      <div className="flex items-center justify-between mt-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#374957' }}>
            Tenant Referencing
          </h1>
          <p className="text-base" style={{ color: '#717182' }}>
            Complete your referencing to proceed with your tenancy application
          </p>
        </div>
        <button 
          className="px-12 py-3 text-white rounded-full text-sm font-medium transition-all duration-300 hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)',
            border: '1px solid #DC5F12',
            minHeight: '3.5rem',
            minWidth: '180px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #FF6B1A 0%, #DC5F12 100%)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(220, 95, 18, 0.4), 0 6px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          }}
        >
          Go To Referencing
        </button>
      </div>

      {/* Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Overall Progress Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Overall Progress</h3>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#374957' }}>50%</p>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>3 of 6 sections</p>
          </div>
        </div>

        {/* Completed Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Completed</h3>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#374957' }}>3</p>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>Sections verified</p>
          </div>
        </div>

        {/* Pending Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Pending</h3>
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#374957' }}>2</p>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>Awaiting completion</p>
          </div>
        </div>

        {/* Documents Uploaded Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: '#374957' }}>Documents Uploaded</h3>
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#374957' }}>8</p>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#717182' }}>Total files</p>
          </div>
        </div>
      </div>

      {/* Progress Bar Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-100">
        <div className="flex items-center gap-6">
          {/* Circular Progress - Made bigger */}
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="#e5e7eb"
                strokeWidth="6"
                fill="transparent"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="#136C9E"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - 0.5)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold" style={{ color: '#374957' }}>50%</span>
              <span className="text-xs font-medium" style={{ color: '#717182' }}>Complete</span>
            </div>
          </div>

          {/* Progress Text and Bar */}
          <div className="flex-1">
            <p className="text-base mb-4" style={{ color: '#374957' }}>
              You have completed 3 out of 6 referencing sections. Complete all sections to finalize your application.
            </p>
            
            {/* Horizontal Progress Bar */}
            <div className="flex items-center gap-4 mb-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full" style={{ width: '50%', backgroundColor: '#136C9E' }}></div>
              </div>
              <span className="text-sm font-medium" style={{ color: '#374957' }}>3 completed</span>
            </div>
          </div>

          {/* Resume Button */}
          <button 
            className="px-6 py-3 rounded-lg text-base font-medium text-white transition-colors"
            style={{ backgroundColor: '#DC5F12' }}
          >
            Resume Process
          </button>
        </div>
      </div>

      {/* Referencing Details Cards - 6 different card types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Define the 6 different card types */}
        {[
          {
            title: "Identity",
            icon: <User className="w-5 h-5 text-blue-600" />,
            progress: "7",
            status: "Complete",
            items: [
              { name: "First Name", description: "Personal identification", status: "complete" },
              { name: "Last Name", description: "Personal identification", status: "complete" },
              { name: "Email Address", description: "Contact information", status: "complete" },
              { name: "Phone Number", description: "Contact information", status: "complete" },
              { name: "Date of Birth", description: "Personal details", status: "complete" },
              { name: "Nationality", description: "Citizenship details", status: "complete" },
              { name: "Passport or ID Card", description: "Identity verification", status: "complete" }
            ]
          },
          {
            title: "Employment",
            icon: <Briefcase className="w-5 h-5 text-blue-600" />,
            progress: "8",
            status: "Incomplete",
            items: [
              { name: "Employment Status", description: "Current employment", status: "complete" },
              { name: "Company Details", description: "Employer information", status: "complete" },
              { name: "Length of Employment", description: "Employment duration", status: "incomplete" },
              { name: "Job Position", description: "Current role", status: "incomplete" },
              { name: "Referee - Full Name", description: "Employment referee", status: "incomplete" },
              { name: "Referee - Email Address", description: "Referee contact", status: "incomplete" },
              { name: "Proof of Employment", description: "Employment verification", status: "incomplete" },
              { name: "Referee - Phone Number", description: "Referee contact", status: "incomplete" }
            ]
          },
          {
            title: "Residential",
            icon: <FileText className="w-5 h-5 text-orange-600" />,
            progress: "7",
            status: "Incomplete",
            items: [
              { name: "Property Interest", description: "Do you already have a property you're interested in renting?", status: "incomplete" },
              { name: "Reason for leaving", description: "Previous Address", status: "incomplete" },
              { name: "Current Address", description: "Current residence", status: "incomplete" },
              { name: "Previous Address", description: "If less than 3 yrs at current", status: "incomplete" },
              { name: "How long at this Address?", description: "Duration at current address", status: "incomplete" },
              { name: "Proof of Address", description: "Address verification", status: "incomplete" },
              { name: "Select exact duration", description: "At this address", status: "incomplete" }
            ]
          },
          {
            title: "Financial",
            icon: <FileText className="w-5 h-5 text-orange-600" />,
            progress: "3",
            status: "Incomplete",
            items: [
              { name: "Monthly Income (£)", description: "Monthly earnings", status: "incomplete" },
              { name: "Proof of income", description: "Income verification", status: "incomplete" },
              { name: "Proof of Income", description: "Income documentation", status: "incomplete" }
            ]
          },
          {
            title: "Guarantor",
            icon: <User className="w-5 h-5 text-amber-600" />,
            progress: "6",
            status: "Incomplete",
            items: [
              { name: "Guarantor's First Name", description: "Guarantor personal details", status: "incomplete" },
              { name: "Guarantor's Last Name", description: "Guarantor personal details", status: "incomplete" },
              { name: "Guarantor's Email Address", description: "Guarantor contact", status: "incomplete" },
              { name: "Guarantor's Phone Number", description: "Guarantor contact", status: "incomplete" },
              { name: "Guarantor's Address", description: "Guarantor address", status: "incomplete" },
              { name: "Guarantor's ID Document", description: "Guarantor identification", status: "incomplete" }
            ]
          },
          {
            title: "Agent Details",
            icon: <User className="w-5 h-5 text-amber-600" />,
            progress: "4",
            status: "Incomplete",
            items: [
              { name: "Agent's First Name", description: "Agent personal details", status: "incomplete" },
              { name: "Agent's Last Name", description: "Agent personal details", status: "incomplete" },
              { name: "Agent's Email Address", description: "Agent contact", status: "incomplete" },
              { name: "Agent's Phone Number", description: "Agent contact", status: "incomplete" }
            ]
          }
        ].map((card, index) => {
          // Define gradient styles based on card type
          const getCardStyle = (title: string) => {
            if (title === "Residential" || title === "Financial") {
              // Orange gradient for Residential and Financial
              return {
                background: 'linear-gradient(to bottom, #FFF7ED, #FFEDD5)',
                border: '1px solid #FB923C',
                height: '320px',
                borderRadius: '20px'
              };
            } else if (title === "Guarantor" || title === "Agent Details") {
              // Cream gradient for Guarantor and Agent Details
              return {
                background: 'linear-gradient(to bottom, #FFFBEB, #FEF3C7)',
                border: '1px solid #F59E0B',
                height: '320px',
                borderRadius: '20px'
              };
            } else {
              // Default blue gradient for Identity and Employment
              return {
                background: 'linear-gradient(to bottom, #EEF9FF, #DDE4FF)',
                border: '1px solid #80B2FF',
                height: '320px',
                borderRadius: '20px'
              };
            }
          };

          return (
          <div
            key={`${card.title.toLowerCase()}-${index}`}
            className="shadow-sm overflow-hidden"
            style={getCardStyle(card.title)}
          >
            <div className="flex h-full">
              {/* Left Panel */}
              <div
                className="p-6 flex flex-col items-start min-w-[200px]"
                style={{
                  background: card.title === "Residential" || card.title === "Financial" 
                    ? 'linear-gradient(to bottom, #FFF7ED, #FFEDD5)'
                    : card.title === "Guarantor" || card.title === "Agent Details"
                    ? 'linear-gradient(to bottom, #FFFBEB, #FEF3C7)'
                    : 'linear-gradient(to bottom, #EEF9FF, #DDE4FF)',
                  color: '#374957'
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    {card.icon}
                  </div>
                  <h2 className="text-lg font-semibold">{card.title}</h2>
                </div>
                <div className="mt-auto">
                  <div 
                    className="text-4xl font-bold"
                    style={{
                      color: card.title === "Residential" || card.title === "Financial" 
                        ? '#C2410C'
                        : card.title === "Guarantor" || card.title === "Agent Details"
                        ? '#B45309'
                        : '#1E40AF'
                    }}
                  >
                    {card.progress}
                  </div>
                  <div className="flex items-center mt-2">
                    {card.status === "Complete" ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-orange-600" />
                    )}
                  </div>
                  <div className="text-xs opacity-75">As of 11/10/2025</div>
                </div>
              </div>

              {/* Right White Panel */}
              <div
                className="flex-1 p-4 bg-white"
                style={{
                  borderRadius: '20px',
                  boxShadow: '-4px 0 24px rgba(70, 95, 194, 0.4)',
                  overflow: 'hidden'
                }}
              >
                <div className="flex justify-end mb-4">
                  <a href="#" className="text-sm font-medium text-blue-600 hover:underline">
                    Go to Referencing →
                  </a>
                </div>
                <div 
                  className="space-y-3 max-h-56 overflow-y-auto thin-scrollbar pb-4"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e1 transparent'
                  }}
                >
                  {card.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="p-4 border-0 bg-white hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {item.status === "complete" ? (
                            <CheckCircle className="w-4 h-4 text-green-600 mt-1" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-orange-600 mt-1" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium mb-1 text-sm ${
                              item.status === "complete" ? "text-green-600" : "text-orange-600"
                            }`}>
                              {item.name}
                            </h4>
                            <p className="text-xs text-gray-700 mb-2">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <div className={`border rounded px-3 py-1 ${
                          item.status === "complete" ? "border-green-300" : "border-orange-300"
                        }`}>
                          <span className={`text-xs font-bold ${
                            item.status === "complete" ? "text-green-600" : "text-orange-600"
                          }`}>
                            {item.status === "complete" ? "Complete" : "Incomplete"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default TenantReferencing;
