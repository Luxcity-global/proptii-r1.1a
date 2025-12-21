import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { PricingRule } from '../App';
import { Plus, Trash2, Edit2, DollarSign, Calendar, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Textarea } from './ui/textarea';

interface PricingRulesProps {
  rules: PricingRule[];
  onRulesChange: (rules: PricingRule[]) => void;
  basePrice: number;
}

export function PricingRules({ rules = [], onRulesChange, basePrice }: PricingRulesProps) {
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [ruleForm, setRuleForm] = useState<Partial<PricingRule>>({
    name: '',
    type: 'seasonal',
    priority: 1,
    enabled: true,
    adjustmentType: 'fixed',
    adjustmentValue: 0
  });

  const openAddDialog = () => {
    setEditingRule(null);
    setRuleForm({
      name: '',
      type: 'seasonal',
      priority: rules.length > 0 ? Math.max(...rules.map(r => r.priority)) + 1 : 1,
      enabled: true,
      adjustmentType: 'fixed',
      adjustmentValue: 0
    });
    setShowRuleDialog(true);
  };

  const openEditDialog = (rule: PricingRule) => {
    setEditingRule(rule);
    setRuleForm(rule);
    setShowRuleDialog(true);
  };

  const saveRule = () => {
    if (!ruleForm.name || !ruleForm.type || !ruleForm.adjustmentType || ruleForm.adjustmentValue === undefined) {
      return;
    }

    const newRule: PricingRule = {
      id: editingRule?.id || `rule-${Date.now()}`,
      name: ruleForm.name,
      type: ruleForm.type as PricingRule['type'],
      priority: ruleForm.priority || 1,
      enabled: ruleForm.enabled ?? true,
      adjustmentType: ruleForm.adjustmentType as PricingRule['adjustmentType'],
      adjustmentValue: ruleForm.adjustmentValue,
      startDate: ruleForm.startDate,
      endDate: ruleForm.endDate,
      daysOfWeek: ruleForm.daysOfWeek,
      minNights: ruleForm.minNights,
      maxNights: ruleForm.maxNights,
      specificDate: ruleForm.specificDate
    };

    let updatedRules: PricingRule[];
    if (editingRule) {
      updatedRules = rules.map(r => r.id === editingRule.id ? newRule : r);
    } else {
      updatedRules = [...rules, newRule];
    }

    // Sort by priority (higher priority first)
    updatedRules.sort((a, b) => b.priority - a.priority);
    onRulesChange(updatedRules);
    setShowRuleDialog(false);
    setEditingRule(null);
  };

  const deleteRule = (ruleId: string) => {
    onRulesChange(rules.filter(r => r.id !== ruleId));
  };

  const toggleRule = (ruleId: string) => {
    onRulesChange(rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
  };

  const calculatePrice = (rule: PricingRule): string => {
    let price = basePrice;
    
    if (rule.adjustmentType === 'fixed') {
      price = rule.adjustmentValue;
    } else if (rule.adjustmentType === 'percentage') {
      price = basePrice * (1 + rule.adjustmentValue / 100);
    } else if (rule.adjustmentType === 'multiplier') {
      price = basePrice * rule.adjustmentValue;
    }

    return `£${Math.round(price).toLocaleString()}`;
  };

  const getRuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'seasonal': 'Seasonal',
      'weekend': 'Weekend',
      'weekday': 'Weekday',
      'length-of-stay': 'Length of Stay',
      'last-minute': 'Last Minute',
      'special-date': 'Special Date',
      'custom': 'Custom'
    };
    return labels[type] || type;
  };

  const getRuleDescription = (rule: PricingRule): string => {
    switch (rule.type) {
      case 'seasonal':
        if (rule.startDate && rule.endDate) {
          return `${new Date(rule.startDate).toLocaleDateString('en-GB')} - ${new Date(rule.endDate).toLocaleDateString('en-GB')}`;
        }
        return 'Date range not set';
      case 'weekend':
        return 'Applies to weekends';
      case 'weekday':
        return 'Applies to weekdays';
      case 'length-of-stay':
        if (rule.minNights && rule.maxNights) {
          return `${rule.minNights}-${rule.maxNights} nights`;
        } else if (rule.minNights) {
          return `${rule.minNights}+ nights`;
        }
        return 'Length not set';
      case 'last-minute':
        return 'Bookings within 7 days';
      case 'special-date':
        if (rule.specificDate) {
          return new Date(rule.specificDate).toLocaleDateString('en-GB');
        }
        return 'Date not set';
      default:
        return 'Custom rule';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pricing Rules
          </CardTitle>
          <Button size="sm" onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Rule
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Base price: £{basePrice.toLocaleString()}/night. Rules are applied in priority order (higher priority first).
        </p>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No pricing rules configured</p>
            <Button onClick={openAddDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Rule
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map(rule => (
              <div
                key={rule.id}
                className={`p-4 border rounded-lg ${
                  rule.enabled ? 'bg-white' : 'bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{rule.name}</h3>
                      <Badge variant="outline">{getRuleTypeLabel(rule.type)}</Badge>
                      <Badge variant="outline">Priority: {rule.priority}</Badge>
                      {!rule.enabled && (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {getRuleDescription(rule)}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium">
                        {rule.adjustmentType === 'fixed' && `Fixed: ${calculatePrice(rule)}`}
                        {rule.adjustmentType === 'percentage' && `Adjustment: ${rule.adjustmentValue > 0 ? '+' : ''}${rule.adjustmentValue}%`}
                        {rule.adjustmentType === 'multiplier' && `Multiplier: ${rule.adjustmentValue}x`}
                      </span>
                      <span className="text-muted-foreground">
                        → {calculatePrice(rule)}/night
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => toggleRule(rule.id)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(rule)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRule(rule.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Rule Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" style={{ top: '90%', transform: 'translate(-50%, -50%)' }}>
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Edit Pricing Rule' : 'Create Pricing Rule'}
            </DialogTitle>
            <DialogDescription>
              Configure when and how pricing should be adjusted
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Rule Name *</Label>
              <Input
                value={ruleForm.name || ''}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                placeholder="e.g., Summer High Season"
              />
            </div>

            <div>
              <Label>Rule Type *</Label>
              <Select
                value={ruleForm.type}
                onValueChange={(value: any) => setRuleForm({ ...ruleForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seasonal">Seasonal (Date Range)</SelectItem>
                  <SelectItem value="weekend">Weekend</SelectItem>
                  <SelectItem value="weekday">Weekday</SelectItem>
                  <SelectItem value="length-of-stay">Length of Stay</SelectItem>
                  <SelectItem value="last-minute">Last Minute Discount</SelectItem>
                  <SelectItem value="special-date">Special Date</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range (for seasonal) */}
            {ruleForm.type === 'seasonal' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={ruleForm.startDate || ''}
                    onChange={(e) => setRuleForm({ ...ruleForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={ruleForm.endDate || ''}
                    onChange={(e) => setRuleForm({ ...ruleForm, endDate: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Days of Week (for weekend/weekday) */}
            {(ruleForm.type === 'weekend' || ruleForm.type === 'weekday') && (
              <div>
                <Label>Days of Week</Label>
                <div className="flex gap-2 mt-2">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                    <label key={day} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ruleForm.daysOfWeek?.includes(index) || false}
                        onChange={(e) => {
                          const currentDays = ruleForm.daysOfWeek || [];
                          if (e.target.checked) {
                            setRuleForm({ ...ruleForm, daysOfWeek: [...currentDays, index] });
                          } else {
                            setRuleForm({ ...ruleForm, daysOfWeek: currentDays.filter(d => d !== index) });
                          }
                        }}
                      />
                      <span className="text-sm">{day.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Length of Stay */}
            {ruleForm.type === 'length-of-stay' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Minimum Nights</Label>
                  <Input
                    type="number"
                    value={ruleForm.minNights || ''}
                    onChange={(e) => setRuleForm({ ...ruleForm, minNights: parseInt(e.target.value) || undefined })}
                    placeholder="e.g., 3"
                  />
                </div>
                <div>
                  <Label>Maximum Nights</Label>
                  <Input
                    type="number"
                    value={ruleForm.maxNights || ''}
                    onChange={(e) => setRuleForm({ ...ruleForm, maxNights: parseInt(e.target.value) || undefined })}
                    placeholder="e.g., 7"
                  />
                </div>
              </div>
            )}

            {/* Special Date */}
            {ruleForm.type === 'special-date' && (
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={ruleForm.specificDate || ''}
                  onChange={(e) => setRuleForm({ ...ruleForm, specificDate: e.target.value })}
                />
              </div>
            )}

            {/* Pricing Adjustment */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Pricing Adjustment</h4>
              
              <div className="space-y-4">
                <div>
                  <Label>Adjustment Type *</Label>
                  <Select
                    value={ruleForm.adjustmentType}
                    onValueChange={(value: any) => setRuleForm({ ...ruleForm, adjustmentType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Price</SelectItem>
                      <SelectItem value="percentage">Percentage Change</SelectItem>
                      <SelectItem value="multiplier">Multiplier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>
                    {ruleForm.adjustmentType === 'fixed' && 'Price (£)'}
                    {ruleForm.adjustmentType === 'percentage' && 'Percentage (%)'}
                    {ruleForm.adjustmentType === 'multiplier' && 'Multiplier'}
                  </Label>
                  <Input
                    type="number"
                    step={ruleForm.adjustmentType === 'percentage' ? 1 : ruleForm.adjustmentType === 'multiplier' ? 0.1 : 1}
                    value={ruleForm.adjustmentValue || ''}
                    onChange={(e) => setRuleForm({ ...ruleForm, adjustmentValue: parseFloat(e.target.value) || 0 })}
                    placeholder={
                      ruleForm.adjustmentType === 'fixed' ? 'e.g., 150' :
                      ruleForm.adjustmentType === 'percentage' ? 'e.g., 20 (for +20%)' :
                      'e.g., 1.2 (for 20% increase)'
                    }
                  />
                  {ruleForm.adjustmentType === 'percentage' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Positive for increase, negative for decrease
                    </p>
                  )}
                  {ruleForm.adjustmentType === 'multiplier' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      1.0 = same price, 1.2 = 20% increase, 0.8 = 20% decrease
                    </p>
                  )}
                </div>

                {ruleForm.adjustmentValue !== undefined && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium">
                      Result: {calculatePrice({
                        ...ruleForm,
                        adjustmentValue: ruleForm.adjustmentValue || 0,
                        adjustmentType: ruleForm.adjustmentType || 'fixed'
                      } as PricingRule)}/night
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={ruleForm.priority || 1}
                  onChange={(e) => setRuleForm({ ...ruleForm, priority: parseInt(e.target.value) || 1 })}
                  min={1}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Higher priority rules are applied first
                </p>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={ruleForm.enabled ?? true}
                  onCheckedChange={(checked) => setRuleForm({ ...ruleForm, enabled: checked })}
                />
                <Label>Enabled</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRuleDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveRule}
              disabled={!ruleForm.name || !ruleForm.type || ruleForm.adjustmentValue === undefined}
            >
              {editingRule ? 'Save Changes' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

