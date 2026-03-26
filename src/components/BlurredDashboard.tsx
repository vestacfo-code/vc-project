import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Upload, TrendingUp, DollarSign, Target, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BlurredDashboardProps {
  onUploadClick?: () => void;
}

const BlurredDashboard = ({ onUploadClick }: BlurredDashboardProps) => {
  const navigate = useNavigate();

  const handleUploadClick = () => {
    // Navigate to the dashboard and set the AI Hub tab as active
    navigate('/dashboard', { state: { activeTab: 'intelligence' } });
  };

  return (
    <div className="space-y-6">
      {/* Upload CTA - Moved to Top for Immediate Visibility */}
      <div className="flex justify-center">
        <Card className="max-w-md w-full bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-8 text-center space-y-6">
            <div className="relative">
              <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-4 border-primary/20 flex items-center justify-center">
                <FileText className="w-12 h-12 text-primary" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2">
                <Upload className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold">Unlock Your Financial Insights</h3>
              <p className="text-muted-foreground">
                Upload your financial data to unlock AI-powered insights, projections, and personalized recommendations.
              </p>
            </div>

            <Button 
              onClick={onUploadClick || handleUploadClick}
              size="lg" 
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Financial Data
            </Button>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>✓ Secure & encrypted storage</p>
              <p>✓ AI-powered analysis</p>
              <p>✓ Personalized recommendations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats - Blurred */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { title: "Health Score", value: "••/100", icon: Target },
          { title: "Monthly Revenue", value: "$•••K", icon: DollarSign },
          { title: "Profit Margin", value: "••%", icon: TrendingUp },
          { title: "Cash Runway", value: "• months", icon: TrendingUp },
        ].map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-muted-foreground" />
            </div>
            <CardContent className="p-6 blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                    <Badge variant="secondary" className="text-xs">
                      +••
                    </Badge>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-muted/10">
                  <stat.icon className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Dashboard Content - Blurred */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardContent className="p-6 blur-sm">
              <div className="text-center space-y-4">
                <div className="text-8xl font-black text-muted-foreground">
                  ••
                  <span className="text-3xl">/100</span>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded-full" />
                  <p className="text-sm text-muted-foreground">
                    Business Health Score
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardHeader className="blur-sm">
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Financial performance over time</CardDescription>
            </CardHeader>
            <CardContent className="blur-sm">
              <div className="h-[300px] bg-muted/20 rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </div>


      {/* Additional Blurred Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
          <CardHeader className="blur-sm">
            <CardTitle>Financial Metrics</CardTitle>
          </CardHeader>
          <CardContent className="blur-sm">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-muted/10 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-xl font-semibold">$•••,•••</p>
              </div>
              <div className="bg-muted/10 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Expenses</p>
                <p className="text-xl font-semibold">$•••,•••</p>
              </div>
              <div className="bg-muted/10 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Profit</p>
                <p className="text-xl font-semibold">$••,•••</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
          <CardHeader className="blur-sm">
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="blur-sm">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">•••••••• Analysis</span>
                <span>+••% improvement</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">•••• Flow Projection</span>
                <span>• months runway</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">•••• Optimization</span>
                <span>Review recommended</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BlurredDashboard;