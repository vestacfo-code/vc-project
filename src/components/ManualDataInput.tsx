import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, DollarSign } from 'lucide-react';

interface ManualDataInputProps {
  onSubmit: (data: FinancialData) => void;
  isAnalyzing: boolean;
}

interface FinancialData {
  revenue: number;
  expenses: number;
  profit: number;
  cashFlow: number;
}

export default function ManualDataInput({ onSubmit, isAnalyzing }: ManualDataInputProps) {
  const { user } = useAuth();
  const [data, setData] = useState<FinancialData>({
    revenue: 0,
    expenses: 0,
    profit: 0,
    cashFlow: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trigger strategic alerts when manual data is submitted
    if (user && (data.revenue || data.expenses || data.profit || data.cashFlow)) {
      try {
        const { generateStrategicAlerts } = await import('@/lib/strategicAlertsHelper');
        generateStrategicAlerts(user.id, true); // Silent generation
        console.log('✅ Strategic alerts triggered from manual data input');
      } catch (error) {
        console.warn('⚠️ Failed to generate strategic alerts:', error);
      }
    }
    
    onSubmit(data);
  };

  const formatCurrency = (value: string) => {
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    return parseFloat(numericValue) || 0;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Manual Financial Data Input
        </CardTitle>
        <CardDescription>
          Enter your financial data manually for AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="revenue">Revenue</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="revenue"
                  type="text"
                  placeholder="250,000"
                  className="pl-10"
                  onChange={(e) => setData(prev => ({ ...prev, revenue: formatCurrency(e.target.value) }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expenses">Expenses</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="expenses"
                  type="text"
                  placeholder="180,000"
                  className="pl-10"
                  onChange={(e) => setData(prev => ({ ...prev, expenses: formatCurrency(e.target.value) }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profit">Profit</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="profit"
                  type="text"
                  placeholder="70,000"
                  className="pl-10"
                  onChange={(e) => setData(prev => ({ ...prev, profit: formatCurrency(e.target.value) }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cashFlow">Cash Flow</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cashFlow"
                  type="text"
                  placeholder="85,000"
                  className="pl-10"
                  onChange={(e) => setData(prev => ({ ...prev, cashFlow: formatCurrency(e.target.value) }))}
                />
              </div>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isAnalyzing || Object.values(data).every(val => val === 0)}
          >
            {isAnalyzing ? "Analyzing..." : "Analyze Financial Data"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}