import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Inbox, 
  Search, 
  Filter,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wrench,
  FileText,
  Phone,
  Send,
  Archive,
  Star,
  Paperclip,
  User,
  MapPin,
  Calendar
} from 'lucide-react';
import { TenantMessage } from '../App';

interface TenantInboxProps {
  onBack: () => void;
}

export function TenantInbox({ onBack }: TenantInboxProps) {
  const [selectedMessage, setSelectedMessage] = useState<TenantMessage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [replyText, setReplyText] = useState('');
  const [showSmartReplies, setShowSmartReplies] = useState(false);

  // Mock messages data
  const mockMessages: TenantMessage[] = [
    {
      id: '1',
      tenantId: 't1',
      tenantName: 'Sarah Johnson',
      propertyAddress: '123 Regent Street, London W1B 4EA',
      subject: 'Boiler making strange noises',
      content: 'Hi, the boiler in the flat has been making some unusual gurgling sounds for the past few days. It\'s still heating the water but I\'m concerned it might be a sign of a problem. Could someone take a look at it please?',
      timestamp: new Date('2024-12-08T09:30:00'),
      direction: 'inbound',
      status: 'new',
      category: 'maintenance',
      priority: 'medium',
      attachments: [
        { id: 'a1', name: 'boiler_photo.jpg', url: '#', type: 'image/jpeg' }
      ]
    },
    {
      id: '2',
      tenantId: 't2',
      tenantName: 'Michael Chen',
      propertyAddress: '45 Victoria Park Road, London E9 7JN',
      subject: 'Lease renewal inquiry',
      content: 'Hello, my current lease expires in March 2025. I\'d like to discuss renewal options and any potential rent adjustments. I\'ve been a good tenant and would prefer to stay. When would be a good time to discuss this?',
      timestamp: new Date('2024-12-07T14:22:00'),
      direction: 'inbound',
      status: 'read',
      category: 'lease-query',
      priority: 'low'
    },
    {
      id: '3',
      tenantId: 't3',
      tenantName: 'Emma Watson',
      propertyAddress: '78 Oak Gardens, London SW4 9AL',
      subject: 'Payment confirmation needed',
      content: 'I transferred the rent payment yesterday but haven\'t received confirmation. The reference was RENT-DEC-2024. Could you please confirm receipt? My bank shows it went through successfully.',
      timestamp: new Date('2024-12-07T11:45:00'),
      direction: 'inbound',
      status: 'replied',
      category: 'payment',
      priority: 'high'
    },
    {
      id: '4',
      tenantId: 't1',
      tenantName: 'Sarah Johnson',
      propertyAddress: '123 Regent Street, London W1B 4EA',
      subject: 'Water leak in bathroom',
      content: 'URGENT: There\'s a significant water leak coming from behind the toilet. Water is spreading across the bathroom floor. I\'ve turned off the water supply to the toilet but need immediate assistance.',
      timestamp: new Date('2024-12-06T22:15:00'),
      direction: 'inbound',
      status: 'resolved',
      category: 'emergency',
      priority: 'high'
    },
    {
      id: '5',
      tenantId: 't4',
      tenantName: 'David Rodriguez',
      propertyAddress: '92 Maple Court, London N1 5QT',
      subject: 'Parking permit application',
      content: 'Hi, I need to apply for a resident parking permit. Could you provide me with a letter confirming my tenancy? The council requires this as proof of residence. Thanks!',
      timestamp: new Date('2024-12-06T16:30:00'),
      direction: 'inbound',
      status: 'new',
      category: 'general',
      priority: 'low'
    }
  ];

  const filteredMessages = mockMessages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || message.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getCategoryIcon = (category: TenantMessage['category']) => {
    switch (category) {
      case 'maintenance': return <Wrench className="h-4 w-4 text-blue-600" />;
      case 'emergency': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'payment': return <FileText className="h-4 w-4 text-green-600" />;
      case 'lease-query': return <FileText className="h-4 w-4 text-purple-600" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: TenantMessage['category']) => {
    switch (category) {
      case 'maintenance': return 'bg-blue-100 text-blue-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'payment': return 'bg-green-100 text-green-800';
      case 'lease-query': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: TenantMessage['status']) => {
    switch (status) {
      case 'new': return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
      case 'read': return <div className="w-2 h-2 bg-orange-500 rounded-full"></div>;
      case 'replied': return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getPriorityColor = (priority: TenantMessage['priority']) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-orange-500';
      default: return 'border-l-blue-500';
    }
  };

  const getSmartReplies = (message: TenantMessage) => {
    switch (message.category) {
      case 'maintenance':
        return [
          'Acknowledge Receipt',
          'Schedule Inspection',
          'Request More Details',
          'Arrange Contractor Visit'
        ];
      case 'payment':
        return [
          'Confirm Payment Received',
          'Request Bank Reference',
          'Schedule Payment Call',
          'Send Payment Instructions'
        ];
      case 'lease-query':
        return [
          'Schedule Renewal Meeting',
          'Send Renewal Forms',
          'Discuss Terms',
          'Request Current Lease Review'
        ];
      case 'emergency':
        return [
          'Emergency Response Initiated',
          'Contractor Dispatched',
          'Temporary Solution Provided',
          'Follow-up Required'
        ];
      default:
        return [
          'Acknowledge Receipt',
          'More Information Needed',
          'Will Follow Up',
          'Issue Resolved'
        ];
    }
  };

  const handleResolve = (messageId: string) => {
    // In real app, update message status
    console.log('Resolving message:', messageId);
  };

  const handleSendReply = () => {
    if (replyText.trim() && selectedMessage) {
      // In real app, send reply
      console.log('Sending reply to:', selectedMessage.id, replyText);
      setReplyText('');
      setShowSmartReplies(false);
    }
  };

  const handleSmartReply = (replyText: string) => {
    setReplyText(replyText);
    setShowSmartReplies(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Inbox className="h-6 w-6 text-primary" />
              <div>
                <h1 className="mb-1">Tenant Communication Hub</h1>
                <p className="text-muted-foreground">
                  Unified inbox for all tenant communications
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {filteredMessages.filter(m => m.status === 'new').length} New
              </Badge>
              <Badge variant="outline">
                {filteredMessages.length} Total
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Conversations List */}
          <div className="col-span-4 flex flex-col">
            {/* Filters */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search messages..."
                      className="pl-10 focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none"
                      style={{
                        '--tw-ring-color': '#8FCDFF',
                        '--tw-ring-opacity': '0.5'
                      } as React.CSSProperties}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="replied">Replied</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                        <SelectItem value="lease-query">Lease Query</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredMessages.map((message) => (
                <Card 
                  key={message.id} 
                  className={`cursor-pointer transition-colors hover:bg-muted/50 border-l-4 ${getPriorityColor(message.priority)} ${
                    selectedMessage?.id === message.id ? 'bg-muted/50 ring-2 ring-primary/20' : ''
                  }`}
                  onClick={() => setSelectedMessage(message)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        {getStatusIcon(message.status)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{message.tenantName}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {message.propertyAddress}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${getCategoryColor(message.category)} border-0 text-xs`}>
                        {message.category.replace('-', ' ')}
                      </Badge>
                    </div>
                    
                    <h4 className="font-medium mb-1 truncate">{message.subject}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {message.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(message.category)}
                        {message.attachments && message.attachments.length > 0 && (
                          <Paperclip className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Center Panel - Message Thread */}
          <div className="col-span-5 flex flex-col">
            {selectedMessage ? (
              <>
                <Card className="mb-4">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{selectedMessage.subject}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-muted-foreground">
                            From: {selectedMessage.tenantName}
                          </span>
                          <Badge className={`${getCategoryColor(selectedMessage.category)} border-0 text-xs`}>
                            {selectedMessage.category.replace('-', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleResolve(selectedMessage.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                        <Button variant="outline" size="sm">
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{selectedMessage.timestamp.toLocaleString('en-GB')}</span>
                        <span>Priority: {selectedMessage.priority.toUpperCase()}</span>
                      </div>
                      
                      <div className="prose max-w-none">
                        <p>{selectedMessage.content}</p>
                      </div>

                      {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                        <div className="border-t pt-4">
                          <h4 className="mb-2">Attachments</h4>
                          <div className="space-y-2">
                            {selectedMessage.attachments.map((attachment) => (
                              <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-muted rounded">
                                <Paperclip className="h-4 w-4" />
                                <span className="text-sm">{attachment.name}</span>
                                <Button variant="ghost" size="sm" className="ml-auto">
                                  View
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Smart Replies */}
                {!showSmartReplies && (
                  <Card className="mb-4">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Smart Replies:</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowSmartReplies(true)}
                        >
                          Show All
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {getSmartReplies(selectedMessage).slice(0, 2).map((reply, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSmartReply(reply)}
                          >
                            {reply}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {showSmartReplies && (
                  <Card className="mb-4">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Smart Reply Options:</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowSmartReplies(false)}
                        >
                          Hide
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {getSmartReplies(selectedMessage).map((reply, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSmartReply(reply)}
                            className="justify-start"
                          >
                            {reply}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Reply Box */}
                <Card className="mt-auto">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Type your reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={4}
                      />
                      <div className="flex justify-between">
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Paperclip className="h-4 w-4 mr-1" />
                            Attach
                          </Button>
                          <Button variant="outline" size="sm">
                            <Phone className="h-4 w-4 mr-1" />
                            Call
                          </Button>
                        </div>
                        <Button onClick={handleSendReply} disabled={!replyText.trim()}>
                          <Send className="h-4 w-4 mr-2" />
                          Send Reply
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="flex-1 flex items-center justify-center">
                <CardContent className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="mb-2">Select a Message</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to view details and respond
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Context Information */}
          <div className="col-span-3">
            {selectedMessage ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Context Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tenant Info */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Tenant Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span>{selectedMessage.tenantName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lease Ends:</span>
                        <span>Mar 2025</span>
                      </div>
                    </div>
                  </div>

                  {/* Property Info */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Property Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">{selectedMessage.propertyAddress}</p>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span>2 Bed Flat</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rent:</span>
                        <span>£2,400/month</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Recent Activity
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <p>Rent paid on time</p>
                          <p className="text-muted-foreground text-xs">1 Dec 2024</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p>Maintenance request resolved</p>
                          <p className="text-muted-foreground text-xs">15 Nov 2024</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <div>
                          <p>Property inspection completed</p>
                          <p className="text-muted-foreground text-xs">1 Nov 2024</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h4 className="font-medium mb-2">Quick Actions</h4>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Phone className="h-4 w-4 mr-2" />
                        Call Tenant
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Visit
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        View Lease
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center pt-8">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Select a message to view context information
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}