import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, TrendingDown, RefreshCw, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScenarioData {
  currentRevenue: number;
  currentExpenses: number;
  currentProfit: number;
  currentHealthScore: number;
}

interface SimulationResult {
  newRevenue: number;
  newExpenses: number;
  newProfit: number;
  newHealthScore: number;
  profitChange: number;
  scoreChange: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

const ScenarioSimulator = () => {
  const { toast } = useToast();
  const [currentData] = useState<ScenarioData>({
    currentRevenue: 145000,
    currentExpenses: 119000,
    currentProfit: 26000,
    currentHealthScore: 78,
  });

  const [revenueChange, setRevenueChange] = useState([0]);
  const [expenseChange, setExpenseChange] = useState([0]);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const calculateSimulation = async () => {
    setIsSimulating(true);

    // Simulate calculation delay
    setTimeout(() => {
      const revenueMultiplier = 1 + (revenueChange[0] / 100);
      const expenseMultiplier = 1 + (expenseChange[0] / 100);

      const newRevenue = currentData.currentRevenue * revenueMultiplier;
      const newExpenses = currentData.currentExpenses * expenseMultiplier;
      const newProfit = newRevenue - newExpenses;
      
      const profitChange = newProfit - currentData.currentProfit;
      const profitChangePercent = (profitChange / currentData.currentProfit) * 100;

      // Calculate new health score based on changes
      let scoreAdjustment = 0;
      if (profitChangePercent > 20) scoreAdjustment += 15;
      else if (profitChangePercent > 10) scoreAdjustment += 10;
      else if (profitChangePercent > 0) scoreAdjustment += 5;
      else if (profitChangePercent < -20) scoreAdjustment -= 15;
      else if (profitChangePercent < -10) scoreAdjustment -= 10;
      else if (profitChangePercent < 0) scoreAdjustment -= 5;

      const newHealthScore = Math.max(0, Math.min(100, currentData.currentHealthScore + scoreAdjustment));
      const scoreChange = newHealthScore - currentData.currentHealthScore;

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (newProfit < currentData.currentProfit * 0.5) riskLevel = 'high';
      else if (newProfit < currentData.currentProfit * 0.8) riskLevel = 'medium';

      // Generate recommendations
      const recommendations = [];
      if (revenueChange[0] < -10) {
        recommendations.push("Consider diversifying revenue streams to mitigate risk");
        recommendations.push("Focus on customer retention to maintain stable income");
      }
      if (expenseChange[0] > 20) {
        recommendations.push("Implement cost controls to manage expense growth");
        recommendations.push("Review vendor contracts for potential savings");
      }
      if (newProfit < 0) {
        recommendations.push("Critical: Immediate action needed to avoid losses");
        recommendations.push("Consider emergency cost reduction measures");
      }
      if (recommendations.length === 0) {
        recommendations.push("Scenario looks sustainable with current projections");
        recommendations.push("Monitor key metrics closely during implementation");
      }

      setSimulation({
        newRevenue,
        newExpenses,
        newProfit,
        newHealthScore,
        profitChange,
        scoreChange,
        riskLevel,
        recommendations,
      });

      setIsSimulating(false);
    }, 1500);
  };

  const resetSimulation = () => {
    setRevenueChange([0]);
    setExpenseChange([0]);
    setSimulation(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      default: return 'success';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Calculator className="w-6 h-6 text-primary" />
            <CardTitle>What-If Scenario Simulator</CardTitle>
          </div>
          <CardDescription>
            Simulate changes to your business and see projected impacts on health score and profitability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Baseline */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Current Financial Position</h3>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="font-semibold text-success">{formatCurrency(currentData.currentRevenue)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Expenses</p>
                <p className="font-semibold text-destructive">{formatCurrency(currentData.currentExpenses)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Profit</p>
                <p className="font-semibold text-primary">{formatCurrency(currentData.currentProfit)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Health Score</p>
                <p className="font-semibold">{currentData.currentHealthScore}/100</p>
              </div>
            </div>
          </div>

          {/* Scenario Controls */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Revenue Change</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  What if revenue changes by {revenueChange[0] > 0 ? '+' : ''}{revenueChange[0]}%?
                </p>
                <div className="px-3">
                  <Slider
                    value={revenueChange}
                    onValueChange={setRevenueChange}
                    max={50}
                    min={-50}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>-50%</span>
                    <span>0%</span>
                    <span>+50%</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Expense Change</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  What if expenses change by {expenseChange[0] > 0 ? '+' : ''}{expenseChange[0]}%?
                </p>
                <div className="px-3">
                  <Slider
                    value={expenseChange}
                    onValueChange={setExpenseChange}
                    max={50}
                    min={-50}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>-50%</span>
                    <span>0%</span>
                    <span>+50%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={calculateSimulation} disabled={isSimulating} className="flex-1">
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Run Simulation
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={resetSimulation}>
                Reset
              </Button>
            </div>
          </div>

          {/* Simulation Results */}
          {simulation && (
            <div className="space-y-4 pt-4 border-t animate-fade-in">
              <h3 className="font-semibold">Simulation Results</h3>
              
              {/* Projected Metrics */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-4">
                  <h4 className="font-medium mb-3">Projected Financials</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-semibold">{formatCurrency(simulation.newRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expenses</span>
                      <span className="font-semibold">{formatCurrency(simulation.newExpenses)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profit</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{formatCurrency(simulation.newProfit)}</span>
                        <Badge variant={simulation.profitChange >= 0 ? "default" : "secondary"}>
                          {simulation.profitChange >= 0 ? "+" : ""}{formatCurrency(simulation.profitChange)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-3">Impact Assessment</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Health Score</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{simulation.newHealthScore}/100</span>
                        <Badge variant={simulation.scoreChange >= 0 ? "default" : "secondary"}>
                          {simulation.scoreChange >= 0 ? "+" : ""}{simulation.scoreChange}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Risk Level</span>
                      <Badge variant={getRiskColor(simulation.riskLevel) as any}>
                        {simulation.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Trend</span>
                      <div className="flex items-center space-x-1">
                        {simulation.scoreChange >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-success" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-destructive" />
                        )}
                        <span className="text-sm">
                          {simulation.scoreChange >= 0 ? 'Improving' : 'Declining'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="font-medium mb-3">AI Recommendations</h4>
                <div className="space-y-2">
                  {simulation.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Target className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScenarioSimulator;