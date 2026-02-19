import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  ArrowLeft, 
  AlertCircle, 
  Calendar, 
  PoundSterling,
  FileText,
  Clock,
  Phone,
  Mail,
  User,
  Download
} from 'lucide-react';
import { ArrearsAlert, Tenant } from '../App';
import { paymentScheduleService, RentPaymentPeriod } from '../services/paymentScheduleService';

interface ArrearsManagementProps {
  alert: ArrearsAlert;
  tenant: Tenant;
  onBack: () => void;
  onInitiateWorkflow: (workflowType: 'reminder' | 'payment-plan' | 'legal', details?: any) => void;
}

export function ArrearsManagement({ alert, tenant, onBack, onInitiateWorkflow }: ArrearsManagementProps) {
  const [paymentPeriods, setPaymentPeriods] = useState<RentPaymentPeriod[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);

  // Fetch real payment history from payment periods
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (!tenant.id) {
        setIsLoadingPayments(false);
        return;
      }
      
      try {
        setIsLoadingPayments(true);
        const periods = await paymentScheduleService.getTenantPeriods(tenant.id);
        // Get the last 6 months of payment periods, sorted by due date (newest first)
        const sortedPeriods = periods
          .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime())
          .slice(0, 6);
        setPaymentPeriods(sortedPeriods);
      } catch (error) {
        console.error('[ArrearsManagement] Error fetching payment history:', error);
      } finally {
        setIsLoadingPayments(false);
      }
    };

    fetchPaymentHistory();
  }, [tenant.id]);

  const getDaysOverdueColor = (days: number) => {
    if (days >= 30) return 'text-red-600 bg-red-50 border-red-200';
    if (days >= 14) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };


  // Convert payment periods to payment history format
  const formatPaymentHistory = () => {
    return paymentPeriods.map((period) => {
      const now = new Date();
      const dueDate = period.dueDate;
      const isOverdue = period.status === 'overdue' || (dueDate < now && period.status !== 'paid');
      const daysLate = period.status === 'paid' && period.paidAt
        ? Math.max(0, Math.ceil((period.paidAt.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
        : isOverdue
        ? Math.max(0, Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      return {
        date: period.dueDate,
        amount: period.amountDue,
        status: period.status === 'paid' ? 'paid' : isOverdue ? 'overdue' : 'pending',
        method: period.notes || 'Not specified',
        daysLate: daysLate > 0 ? daysLate : undefined,
        paidDate: period.paidAt
      };
    });
  };

  const paymentHistory = formatPaymentHistory();

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
                <div className="grid md:grid-cols-2 gap-6">
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
                {isLoadingPayments ? (
                  <div className="flex items-center justify-center py-8">
                    <Clock className="w-6 h-6 mr-2 animate-spin text-gray-400" />
                    <p className="text-muted-foreground">Loading payment history...</p>
                  </div>
                ) : paymentHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-muted-foreground font-medium">No payment history available</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Payment history will appear here once payment periods are generated.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentHistory.map((payment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            payment.status === 'paid' ? 'bg-green-500' : 
                            payment.status === 'overdue' ? 'bg-red-500' : 'bg-orange-500'
                          }`}></div>
                          <div>
                            <p className="font-medium">{payment.date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
                            <p className="text-sm text-muted-foreground">
                              {payment.method}
                              {payment.daysLate && ` • ${payment.daysLate} days late`}
                              {payment.paidDate && ` • Paid: ${payment.paidDate.toLocaleDateString('en-GB')}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">£{payment.amount.toLocaleString()}</p>
                          <Badge variant={payment.status === 'paid' ? 'default' : payment.status === 'overdue' ? 'destructive' : 'secondary'} className="text-xs">
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                  {tenant.lastPaymentDate && (
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Last successful payment</p>
                        <p className="text-muted-foreground">
                          {tenant.lastPaymentDate.toLocaleDateString('en-GB')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}