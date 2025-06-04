import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 px-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="text-white text-2xl" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">RetailTracker</h1>
            <p className="text-gray-600 mt-2">Track your sales and expenses</p>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleLogin} 
              className="w-full bg-primary text-white hover:bg-blue-700 transition-colors font-medium"
            >
              Sign In with Replit
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Secure authentication powered by Replit
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
