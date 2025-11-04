"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Crown, 
  Check, 
  Star, 
  Zap, 
  FileText, 
  Calculator, 
  Target, 
  BookOpen,
  Calendar,
  X,
  Upload,
  MessageSquare,
  TrendingUp,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (tier: 'basic' | 'pro') => void;
}

export function PricingModal({ isOpen, onClose, onUpgrade }: PricingModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  const handleUpgrade = (tier: 'basic' | 'pro') => {
    toast.success(`Upgrading to ${tier.charAt(0).toUpperCase() + tier.slice(1)}! Redirecting to payment...`);
    onUpgrade(tier);
    onClose();
  };

  const freePlanFeatures = [
    { icon: BookOpen, text: "Basic Study Guides", included: true },
    { icon: Calendar, text: "Simple Study Schedule", included: true },
    { icon: Zap, text: "Up to 20 Flashcards", included: true },
    { icon: Target, text: "Up to 15 Practice Questions", included: true },
    { icon: Upload, text: "3 Files, 5MB each (10MB total)", included: true },
    { icon: FileText, text: "Practice Exams", included: false },
    { icon: Calculator, text: "Formula Sheets", included: false },
    { icon: MessageSquare, text: "Homework Feedback", included: false },
    { icon: TrendingUp, text: "Advanced Analytics", included: false }
  ];

  const basicPlanFeatures = [
    { icon: BookOpen, text: "Enhanced Study Guides", included: true },
    { icon: Calendar, text: "Smart Study Scheduling", included: true },
    { icon: Zap, text: "Up to 50 Flashcards", included: true },
    { icon: Target, text: "Up to 40 Practice Questions", included: true },
    { icon: Upload, text: "10 Files, 25MB each (50MB total)", included: true },
    { icon: FileText, text: "1 Practice Exam per week", included: true },
    { icon: Calculator, text: "Basic Formula Sheets", included: true },
    { icon: MessageSquare, text: "Basic Homework Feedback", included: true },
    { icon: TrendingUp, text: "Performance Analytics", included: true }
  ];

  const proPlanFeatures = [
    { icon: BookOpen, text: "Advanced Study Guides", included: true },
    { icon: Calendar, text: "AI-Optimized Scheduling", included: true },
    { icon: Zap, text: "Unlimited Flashcards", included: true },
    { icon: Target, text: "Unlimited Practice Questions", included: true },
    { icon: Upload, text: "25 Files, 100MB each (200MB total)", included: true },
    { icon: FileText, text: "Unlimited Practice Exams", included: true },
    { icon: Calculator, text: "Advanced Formula Sheets", included: true },
    { icon: MessageSquare, text: "Detailed Homework Feedback", included: true },
    { icon: TrendingUp, text: "Advanced Analytics & Insights", included: true },
    { icon: Shield, text: "Priority Support", included: true }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            Choose Your <span className="gradient-text">Syllabus AI Plan</span>
          </DialogTitle>
          <DialogDescription className="text-center">
            Unlock powerful AI study tools tailored to your learning needs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Toggle */}
          <div className="flex justify-center">
            <div className="bg-gray-100 p-1 rounded-lg">
              <Button
                variant={selectedPlan === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedPlan('monthly')}
                className="rounded-md"
              >
                Monthly
              </Button>
              <Button
                variant={selectedPlan === 'yearly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedPlan('yearly')}
                className="rounded-md"
              >
                Yearly
                <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-800">
                  Save 20%
                </Badge>
              </Button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Free Plan */}
            <Card className="border-2 border-gray-200">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-gray-600" />
                </div>
                <CardTitle className="text-xl">Free</CardTitle>
                <CardDescription>Perfect for getting started</CardDescription>
                <div className="text-3xl font-bold">$0</div>
                <div className="text-sm text-muted-foreground">Forever free</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {freePlanFeatures.map((feature, index) => {
                    const IconComponent = feature.icon;
                    return (
                      <div key={index} className="flex items-center gap-3">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                        <IconComponent className="h-4 w-4 text-gray-500" />
                        <span className={`text-sm ${!feature.included ? 'text-gray-400' : ''}`}>
                          {feature.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              </CardContent>
            </Card>

            {/* Basic Plan */}
            <Card className="border-2 border-blue-400 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1">
                  <Zap className="h-3 w-3 mr-1" />
                  Great Value
                </Badge>
              </div>
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Basic</CardTitle>
                <CardDescription>For regular students</CardDescription>
                <div className="text-3xl font-bold">
                  ${selectedPlan === 'monthly' ? '5' : '4'}
                  <span className="text-lg font-normal text-muted-foreground">
                    /{selectedPlan === 'monthly' ? 'month' : 'month'}
                  </span>
                </div>
                {selectedPlan === 'yearly' && (
                  <div className="text-sm text-emerald-600 font-medium">
                    Billed annually ($48/year)
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {basicPlanFeatures.map((feature, index) => {
                    const IconComponent = feature.icon;
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-emerald-500" />
                        <IconComponent className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">{feature.text}</span>
                      </div>
                    );
                  })}
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  onClick={() => handleUpgrade('basic')}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Upgrade to Basic
                </Button>
              </CardContent>
            </Card>

            {/* PRO Plan */}
            <Card className="border-2 border-yellow-400 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1">
                  <Crown className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">PRO</CardTitle>
                <CardDescription>For serious students</CardDescription>
                <div className="text-3xl font-bold">
                  ${selectedPlan === 'monthly' ? '10' : '8'}
                  <span className="text-lg font-normal text-muted-foreground">
                    /{selectedPlan === 'monthly' ? 'month' : 'month'}
                  </span>
                </div>
                {selectedPlan === 'yearly' && (
                  <div className="text-sm text-emerald-600 font-medium">
                    Billed annually ($96/year)
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {proPlanFeatures.map((feature, index) => {
                    const IconComponent = feature.icon;
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-emerald-500" />
                        <IconComponent className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">{feature.text}</span>
                      </div>
                    );
                  })}
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  onClick={() => handleUpgrade('pro')}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to PRO
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Feature Comparison */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
            <h3 className="font-semibold mb-4 text-blue-900 text-center">
              🚀 What makes each plan special
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <h4 className="font-medium text-gray-700 mb-2">Free Plan</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Basic AI study tools</li>
                  <li>• Limited file uploads</li>
                  <li>• Essential features only</li>
                </ul>
              </div>
              <div className="text-center">
                <h4 className="font-medium text-blue-700 mb-2">Basic Plan</h4>
                <ul className="space-y-1 text-blue-600">
                  <li>• Enhanced AI capabilities</li>
                  <li>• More file storage</li>
                  <li>• Practice exams included</li>
                  <li>• Homework feedback</li>
                </ul>
              </div>
              <div className="text-center">
                <h4 className="font-medium text-yellow-700 mb-2">PRO Plan</h4>
                <ul className="space-y-1 text-yellow-600">
                  <li>• Unlimited everything</li>
                  <li>• Maximum file uploads</li>
                  <li>• Advanced analytics</li>
                  <li>• Priority support</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Money Back Guarantee */}
          <div className="text-center text-sm text-muted-foreground">
            <p>💰 30-day money-back guarantee • 🔒 Secure payment • ❌ Cancel anytime</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}