import React, { useState } from 'react';
import { 
  MessageSquare, 
  Search, 
  Filter,
  Send,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wrench,
  FileText,
  User,
  Paperclip,
  X,
  ArrowLeft
} from 'lucide-react';

export interface HomeownerMessage {
  id: string;
  contactId: string;
  contactName: string;
  contactType: 'contractor' | 'vendor' | 'service-provider' | 'insurance' | 'other';
  subject: string;
  content: string;
  timestamp: Date;
  direction: 'inbound' | 'outbound';
  status: 'new' | 'read' | 'replied' | 'resolved';
  category: 'maintenance' | 'project' | 'general' | 'emergency' | 'billing';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
  relatedTo?: {
    type: 'maintenance' | 'project' | 'document';
    id: string;
    name: string;
  };
}

interface CommunicationHubProps {
  onBack: () => void;
  onSendMessage: (message: Omit<HomeownerMessage, 'id' | 'timestamp'>) => void;
}

export function CommunicationHub({ onBack, onSendMessage }: CommunicationHubProps) {
  const [selectedMessage, setSelectedMessage] = useState<HomeownerMessage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [replyText, setReplyText] = useState('');

  // Mock data - will be replaced with Firebase data
  const [messages] = useState<HomeownerMessage[]>([
    {
      id: '1',
      contactId: 'c1',
      contactName: 'ABC Heating & Cooling',
      contactType: 'contractor',
      subject: 'HVAC Service Scheduled',
      content: 'Hi, we have scheduled your annual HVAC service for December 15th at 10:00 AM. Please confirm if this time works for you.',
      timestamp: new Date('2024-12-08T09:30:00'),
      direction: 'inbound',
      status: 'new',
      category: 'maintenance',
      priority: 'medium',
      relatedTo: {
        type: 'maintenance',
        id: 'm1',
        name: 'HVAC Annual Service',
      },
    },
    {
      id: '2',
      contactId: 'c2',
      contactName: 'Quick Fix Plumbing',
      contactType: 'contractor',
      subject: 'Water Leak Repair Update',
      content: 'We have completed the repair on your leaky faucet. The issue was a worn-out washer. Total cost: £85. Invoice attached.',
      timestamp: new Date('2024-12-07T14:22:00'),
      direction: 'inbound',
      status: 'read',
      category: 'maintenance',
      priority: 'high',
      attachments: [
        { id: 'a1', name: 'invoice.pdf', url: '#', type: 'application/pdf' }
      ],
      relatedTo: {
        type: 'maintenance',
        id: 'm2',
        name: 'Water Leak Repair',
      },
    },
    {
      id: '3',
      contactId: 'c3',
      contactName: 'Home Insurance Co.',
      contactType: 'insurance',
      subject: 'Policy Renewal Reminder',
      content: 'Your home insurance policy is due for renewal on November 1st, 2025. Please review your coverage options and let us know if you have any questions.',
      timestamp: new Date('2024-12-06T11:15:00'),
      direction: 'inbound',
      status: 'read',
      category: 'billing',
      priority: 'low',
      relatedTo: {
        type: 'document',
        id: 'd1',
        name: 'Home Insurance Policy',
      },
    },
  ]);

  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || message.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getCategoryIcon = (category: HomeownerMessage['category']) => {
    switch (category) {
      case 'maintenance': return <Wrench className="h-4 w-4 text-blue-600" />;
      case 'project': return <FileText className="h-4 w-4 text-purple-600" />;
      case 'emergency': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'billing': return <FileText className="h-4 w-4 text-green-600" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: HomeownerMessage['category']) => {
    switch (category) {
      case 'maintenance': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'project': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'emergency': return 'bg-red-50 text-red-700 border-red-200';
      case 'billing': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: HomeownerMessage['status']) => {
    switch (status) {
      case 'new': return <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>;
      case 'read': return <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div>;
      case 'replied': return <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getPriorityColor = (priority: HomeownerMessage['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 text-red-700 border-red-200';
      case 'high': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleSendReply = () => {
    if (!selectedMessage || !replyText.trim()) return;

    const newMessage: Omit<HomeownerMessage, 'id' | 'timestamp'> = {
      contactId: selectedMessage.contactId,
      contactName: selectedMessage.contactName,
      contactType: selectedMessage.contactType,
      subject: `Re: ${selectedMessage.subject}`,
      content: replyText,
      direction: 'outbound',
      status: 'replied',
      category: selectedMessage.category,
      priority: selectedMessage.priority,
      relatedTo: selectedMessage.relatedTo,
    };

    onSendMessage(newMessage);
    setReplyText('');
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 mb-3 flex items-center gap-2 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>
        <h1 className="text-3xl font-bold text-[#374957] mb-2">Communication Hub</h1>
        <p className="text-gray-600">Manage all your home-related communications</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Messages List */}
        <div className="lg:col-span-1 space-y-4 flex flex-col min-h-0">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent transition-all text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent transition-all bg-white"
                >
                  <option value="all">All</option>
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent transition-all bg-white"
                >
                  <option value="all">All</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="project">Project</option>
                  <option value="general">General</option>
                  <option value="emergency">Emergency</option>
                  <option value="billing">Billing</option>
                </select>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-3 overflow-y-auto flex-1 pr-2">
            {filteredMessages.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600">No messages found</p>
              </div>
            ) : (
              filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 ${
                    selectedMessage?.id === message.id 
                      ? 'border-[#DC5F12] shadow-lg ring-2 ring-[#DC5F12] ring-opacity-20' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                  onClick={() => setSelectedMessage(message)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                        {getCategoryIcon(message.category)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-sm text-[#374957] truncate">
                          {message.contactName}
                        </h3>
                        {getStatusIcon(message.status)}
                      </div>
                      <p className="text-xs font-medium text-gray-800 mb-1.5 truncate">
                        {message.subject}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2.5 leading-relaxed">
                        {message.content}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${getCategoryColor(message.category)}`}>
                          {message.category}
                        </span>
                        {message.priority !== 'low' && (
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${getPriorityColor(message.priority)}`}>
                            {message.priority}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {message.timestamp.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          {selectedMessage ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
              <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-2xl font-bold text-[#374957] pr-4">{selectedMessage.subject}</h2>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-[#374957]">{selectedMessage.contactName}</span>
                      <span className="text-xs text-gray-500 ml-2 capitalize">({selectedMessage.contactType.replace('-', ' ')})</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-md border ${getCategoryColor(selectedMessage.category)}`}>
                    {selectedMessage.category}
                  </span>
                  <span className={`px-3 py-1 text-xs font-medium rounded-md border ${getPriorityColor(selectedMessage.priority)}`}>
                    {selectedMessage.priority}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedMessage.timestamp.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedMessage.content}</p>
                </div>

                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Attachments</h3>
                    <div className="space-y-2">
                      {selectedMessage.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[#374957]">{attachment.name}</p>
                            <p className="text-xs text-gray-500">{attachment.type}</p>
                          </div>
                          <button className="px-3 py-1.5 text-sm text-white bg-[#DC5F12] hover:bg-[#c54f0f] rounded-lg font-medium transition-colors">
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMessage.relatedTo && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Related To</h3>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-[#374957]">
                        <span className="font-semibold capitalize">{selectedMessage.relatedTo.type}:</span>{' '}
                        {selectedMessage.relatedTo.name}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t border-gray-200 p-5 bg-gray-50">
                <div className="space-y-3">
                  <textarea
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DC5F12] focus:border-transparent resize-none text-sm"
                  />
                  <div className="flex items-center justify-between">
                    <button className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      Attach
                    </button>
                    <button
                      onClick={handleSendReply}
                      disabled={!replyText.trim()}
                      className="px-5 py-2.5 bg-[#DC5F12] text-white rounded-lg font-medium hover:bg-[#c54f0f] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                      <Send className="w-4 h-4" />
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex items-center justify-center">
              <div className="text-center p-12">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium mb-1">Select a message to view details</p>
                <p className="text-sm text-gray-500">Choose a message from the list to read and reply</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
