import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { 
  ArrowLeft, 
  AlertCircle, 
  Calendar, 
  PoundSterling,
  MessageCircle,
  FileText,
  Clock,
  TrendingDown,
  Phone,
  Mail,
  User,
  Download,
  Send,
  CreditCard,
  Scale
} from 'lucide-react';
import { ArrearsAlert, Tenant } from '../types';

interface ArrearsManagementProps {
  alert: ArrearsAlert;
  tenant: Tenant;
  onBack: () => void;
  onInitiateWorkflow: (workflowType: 'reminder' | 'payment-plan' | 'legal', details?: any) => void;
}

interface PaymentPlanDetails {
  totalAmount: number;
  installments: number;
  frequency: 'weekly' | 'monthly';
  startDate: Date;
  additionalTerms: string;
}

export function ArrearsManagement({ alert, tenant, onBack, onInitiateWorkflow }: ArrearsManagementProps) {
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<'reminder' | 'payment-plan' | 'legal'>('reminder');
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlanDetails>({
    totalAmount: alert.overdueAmount,
    installments: 4,
    frequency: 'monthly',
    startDate: new Date(),
    additionalTerms: ''
  });

  const getDaysOverdueColor = (days: number) => {
    if (days >= 30) return 'text-red-600 bg-red-50 border-red-200';
    if (days >= 14) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-yellow-600';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return 'HIGH';
    if (score >= 60) return 'MEDIUM';
    return 'LOW';
  };

  const handleWorkflowSubmit = () => {
    if (selectedWorkflow === 'payment-plan') {
      onInitiateWorkflow(selectedWorkflow, paymentPlan);
    } else {
      onInitiateWorkflow(selectedWorkflow);
    }
    setShowWorkflowDialog(false);
  };

  const paymentHistory = [
    { date: new Date('2024-11-01'), amount: 2400, status: 'paid', method: 'Bank Transfer' },
    { date: new Date('2024-10-01'), amount: 2400, status: 'paid', method: 'Bank Transfer' },
    { date: new Date('2024-09-01'), amount: 2400, status: 'paid', method: 'Bank Transfer' },
    { date: new Date('2024-08-01'), amount: 2400, status: 'paid', method: 'Bank Transfer' },
    { date: new Date('2024-07-01'), amount: 2400, status: 'late', method: 'Bank Transfer', daysLate: 5 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <div>
                  <h1 className="mb-1">Rent Arrears Management</h1>
                  <p className="text-muted-foreground">{tenant.name} • {alert.propertyAddress}</p>
                </div>
              </div>
            </div>
            <Badge className={`${getDaysOverdueColor(alert.daysPastDue)} border`}>
              {alert.daysPastDue} DAYS OVERDUE
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Arrears Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PoundSterling className="h-5 w-5 mr-2" />
                  Arrears Overview
                </CardTitle>
                <CardDescription>
                  Current outstanding balance and risk assessment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white mb-3">
                      <PoundSterling className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-red-600 mb-1">
                      £{alert.overdueAmount.toLocaleString()}
                    </h3>
                    <p className="text-sm text-muted-foreground">Outstanding Amount</p>
                  </div>

                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white mb-3">
                      <Clock className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-orange-600 mb-1">
                      {alert.daysPastDue}
                    </h3>
                    <p className="text-sm text-muted-foreground">Days Overdue</p>
                  </div>

                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white mb-3">
                      <TrendingDown className="h-8 w-8" />
                    </div>
                    <h3 className={`text-2xl font-bold mb-1 ${getRiskColor(alert.defaultRiskScore)}`}>
                      {alert.defaultRiskScore}%
                    </h3>
                    <p className="text-sm text-muted-foreground">Default Risk Score</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-4">Default Risk Analysis</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Payment History Score</span>
                        <span>75%</span>
                      </div>
                      <Progress value={75} className="h-2 [&>[data-slot=progress-indicator]]:bg-[#136C9E]" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Communication Responsiveness</span>
                        <span>45%</span>
                      </div>
                      <Progress value={45} className="h-2 [&>[data-slot=progress-indicator]]:bg-[#136C9E]" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Employment Stability</span>
                        <span>80%</span>
                      </div>
                      <Progress value={80} className="h-2 [&>[data-slot=progress-indicator]]:bg-[#136C9E]" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Economic Indicators</span>
                        <span>60%</span>
                      </div>
                      <Progress value={60} className="h-2 [&>[data-slot=progress-indicator]]:bg-[#136C9E]" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Payment History
                </CardTitle>
                <CardDescription>
                  Last 6 months of rent payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentHistory.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          payment.status === 'paid' ? 'bg-green-500' : 
                          payment.status === 'late' ? 'bg-orange-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="font-medium">{payment.date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.method}
                            {payment.daysLate && ` • ${payment.daysLate} days late`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">£{payment.amount.toLocaleString()}</p>
                        <Badge variant={payment.status === 'paid' ? 'default' : payment.status === 'late' ? 'secondary' : 'destructive'} className="text-xs">
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Intervention Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  AI Intervention Workflows
                </CardTitle>
                <CardDescription>
                  Automated intervention options based on risk assessment and payment history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-blue-200" 
                        onClick={() => { setSelectedWorkflow('reminder'); setShowWorkflowDialog(true); }}>
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-3">
                        <Send className="h-6 w-6 text-blue-600" />
                      </div>
                      <h4 className="mb-2">Smart Reminder</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Personalized, empathetic automated reminder sequence
                      </p>
                      <Badge variant="outline" className="text-xs">Recommended</Badge>
                    </div>
                  </Card>

                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-orange-200"
                        onClick={() => { setSelectedWorkflow('payment-plan'); setShowWorkflowDialog(true); }}>
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mb-3">
                        <CreditCard className="h-6 w-6 text-orange-600" />
                      </div>
                      <h4 className="mb-2">Payment Plan</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Flexible payment arrangement with automated tracking
                      </p>
                      <Badge variant="secondary" className="text-xs">Medium Risk</Badge>
                    </div>
                  </Card>

                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-red-200"
                        onClick={() => { setSelectedWorkflow('legal'); setShowWorkflowDialog(true); }}>
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
                        <Scale className="h-6 w-6 text-red-600" />
                      </div>
                      <h4 className="mb-2">Legal Action</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Pre-fill legal documents and initiate proceedings
                      </p>
                      <Badge variant="destructive" className="text-xs">High Risk</Badge>
                    </div>
                  </Card>
                </div>

                <Dialog open={showWorkflowDialog} onOpenChange={setShowWorkflowDialog}>
                  <DialogContent className="max-w-2xl">
                    <AIInterventionWorkflow
                      workflowType={selectedWorkflow}
                      alert={alert}
                      tenant={tenant}
                      paymentPlan={paymentPlan}
                      onPaymentPlanChange={setPaymentPlan}
                      onConfirm={handleWorkflowSubmit}
                      onCancel={() => setShowWorkflowDialog(false)}
                    />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tenant Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tenant Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{tenant.name}</p>
                    <p className="text-sm text-muted-foreground">Active since {tenant.leaseStart.toLocaleDateString('en-GB')}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{tenant.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{tenant.phone}</span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Monthly Rent</span>
                    <span className="font-medium">£{tenant.rentAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Lease End</span>
                    <span className="font-medium">{tenant.leaseEnd.toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Last Payment</span>
                    <span className="font-medium">
                      {tenant.lastPaymentDate?.toLocaleDateString('en-GB') || 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Tenant
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  View Lease Agreement
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Download Legal Pack
                </Button>
              </CardContent>
            </Card>

            {/* Status Updates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Payment overdue detected</p>
                      <p className="text-muted-foreground">{alert.daysPastDue} days ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Default risk score updated</p>
                      <p className="text-muted-foreground">2 days ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Last successful payment</p>
                      <p className="text-muted-foreground">
                        {tenant.lastPaymentDate?.toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AIInterventionWorkflowProps {
  workflowType: 'reminder' | 'payment-plan' | 'legal';
  alert: ArrearsAlert;
  tenant: Tenant;
  paymentPlan: PaymentPlanDetails;
  onPaymentPlanChange: (plan: PaymentPlanDetails) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function AIInterventionWorkflow({ 
  workflowType, 
  alert, 
  tenant, 
  paymentPlan, 
  onPaymentPlanChange, 
  onConfirm, 
  onCancel 
}: AIInterventionWorkflowProps) {
  const getWorkflowTitle = () => {
    switch (workflowType) {
      case 'reminder': return 'Smart Reminder Sequence';
      case 'payment-plan': return 'Flexible Payment Plan';
      case 'legal': return 'Legal Action Preparation';
    }
  };

  const getWorkflowIcon = () => {
    switch (workflowType) {
      case 'reminder': return <Send className="h-5 w-5" />;
      case 'payment-plan': return <CreditCard className="h-5 w-5" />;
      case 'legal': return <Scale className="h-5 w-5" />;
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center">
          {getWorkflowIcon()}
          <span className="ml-2">{getWorkflowTitle()}</span>
        </DialogTitle>
        <DialogDescription>
          Configure and initiate AI-powered intervention for {tenant.name}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 mt-6">
        {workflowType === 'reminder' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium mb-2">Automated Reminder Sequence</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>• Initial gentle reminder</span>
                  <span className="text-muted-foreground">Immediate</span>
                </div>
                <div className="flex justify-between">
                  <span>• Follow-up with payment options</span>
                  <span className="text-muted-foreground">3 days</span>
                </div>
                <div className="flex justify-between">
                  <span>• Final notice before escalation</span>
                  <span className="text-muted-foreground">7 days</span>
                </div>
              </div>
            </div>
            <div>
              <Label>Preview of first message:</Label>
              <Textarea
                value={`Hi ${tenant.name},

I hope you're doing well. I wanted to reach out regarding your rent payment for ${alert.propertyAddress}, which was due on the 1st and is now ${alert.daysPastDue} days overdue.

I understand that sometimes unexpected circumstances can affect our ability to make payments on time. If you're experiencing any difficulties, please don't hesitate to get in touch so we can discuss possible solutions.

The outstanding amount is £${alert.overdueAmount}. You can make your payment through your usual method, or contact me if you need alternative payment arrangements.

Thank you for your prompt attention to this matter.

Best regards,
Property Management Team`}
                rows={8}
                readOnly
                className="mt-2"
              />
            </div>
          </div>
        )}

        {workflowType === 'payment-plan' && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="total-amount">Total Outstanding Amount</Label>
                <Input
                  id="total-amount"
                  type="number"
                  value={paymentPlan.totalAmount}
                  onChange={(e) => onPaymentPlanChange({
                    ...paymentPlan,
                    totalAmount: parseInt(e.target.value)
                  })}
                />
              </div>
              <div>
                <Label htmlFor="installments">Number of Installments</Label>
                <Input
                  id="installments"
                  type="number"
                  value={paymentPlan.installments}
                  onChange={(e) => onPaymentPlanChange({
                    ...paymentPlan,
                    installments: parseInt(e.target.value)
                  })}
                />
              </div>
            </div>
            
            <div>
              <Label>Payment Frequency</Label>
              <RadioGroup
                value={paymentPlan.frequency}
                onValueChange={(value) => onPaymentPlanChange({
                  ...paymentPlan,
                  frequency: value as 'weekly' | 'monthly'
                })}
                className="flex space-x-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <Label htmlFor="weekly">Weekly</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly">Monthly</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="additional-terms">Additional Terms</Label>
              <Textarea
                id="additional-terms"
                value={paymentPlan.additionalTerms}
                onChange={(e) => onPaymentPlanChange({
                  ...paymentPlan,
                  additionalTerms: e.target.value
                })}
                placeholder="Any additional terms or conditions..."
                rows={3}
              />
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium mb-2">Payment Plan Summary</h4>
              <div className="text-sm space-y-1">
                <p>Total Amount: £{paymentPlan.totalAmount.toLocaleString()}</p>
                <p>Installment Amount: £{Math.ceil(paymentPlan.totalAmount / paymentPlan.installments).toLocaleString()}</p>
                <p>Frequency: {paymentPlan.frequency.charAt(0).toUpperCase() + paymentPlan.frequency.slice(1)}</p>
                <p>Duration: {paymentPlan.installments} {paymentPlan.frequency === 'weekly' ? 'weeks' : 'months'}</p>
              </div>
            </div>
          </div>
        )}

        {workflowType === 'legal' && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium mb-2 text-red-800">Legal Action Preparation</h4>
              <p className="text-sm text-red-700">
                This will initiate the legal process for recovering rent arrears. All necessary documentation will be automatically generated and pre-filled.
              </p>
            </div>
            
            <div className="space-y-3">
              <h4>Documents to be Generated:</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Section 8 Notice (Ground 8 & 10)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Rent Arrears Statement</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Evidence Pack (Communications, Payment History)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Court Application Forms</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Important:</strong> We recommend attempting communication and payment plan options before proceeding with legal action. Legal costs may apply.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            {workflowType === 'reminder' && 'Send Reminders'}
            {workflowType === 'payment-plan' && 'Create Payment Plan'}
            {workflowType === 'legal' && 'Generate Legal Documents'}
          </Button>
        </div>
      </div>
    </>
  );
}