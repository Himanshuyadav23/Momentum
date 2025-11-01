'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface Insight {
  type: 'positive' | 'warning' | 'negative' | 'recommendation';
  category?: 'productivity' | 'habits' | 'expenses' | 'overall';
  title: string;
  message: string;
  priority?: number;
}

interface InsightsPanelProps {
  refreshKey?: number;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ refreshKey }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, [refreshKey]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getInsights();
      if (response.success && response.data) {
        const normalized = response.data.insights.map((i: any) => {
          const t = i?.type;
          const type: Insight['type'] = 
            t === 'positive' || t === 'warning' || t === 'negative' || t === 'recommendation' 
              ? t 
              : 'recommendation';
          return {
            type,
            category: i?.category,
            title: String(i?.title ?? ''),
            message: String(i?.message ?? ''),
            priority: i?.priority || 0,
          } as Insight;
        });
        // Sort by priority (highest first)
        normalized.sort((a: Insight, b: Insight) => (b.priority || 0) - (a.priority || 0));
        setInsights(normalized);
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'negative':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      case 'recommendation':
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
    }
  };

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-green-600 text-white';
      case 'warning':
        return 'bg-yellow-600 text-white';
      case 'negative':
        return 'bg-red-600 text-white';
      case 'recommendation':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getCategoryBadge = (category?: string) => {
    if (!category) return null;
    const categoryColors: { [key: string]: string } = {
      productivity: 'bg-purple-600 text-white',
      habits: 'bg-orange-600 text-white',
      expenses: 'bg-green-600 text-white',
      overall: 'bg-blue-600 text-white'
    };
    return (
      <Badge className={categoryColors[category] || 'bg-gray-600 text-white'} variant="outline">
        {category}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-300">Loading insights...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <Lightbulb className="h-5 w-5" />
          <span>Smart Insights</span>
          <Badge variant="secondary" className="bg-gray-600 text-gray-200">
            {insights.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No insights available yet</p>
            <p className="text-sm text-gray-500">Keep tracking to get personalized insights</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Group insights by type */}
            {['positive', 'warning', 'negative', 'recommendation'].map((insightType) => {
              const filteredInsights = insights.filter(i => i.type === insightType);
              if (filteredInsights.length === 0) return null;

              const typeLabels: { [key: string]: string } = {
                positive: '✅ What\'s Going Well',
                warning: '⚠️ Areas to Improve',
                negative: '❌ Needs Attention',
                recommendation: '💡 Recommendations'
              };

              return (
                <div key={insightType} className="space-y-3">
                  <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                    {getInsightIcon(insightType)}
                    <span>{typeLabels[insightType]}</span>
                  </h3>
                  {filteredInsights.map((insight, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${
                        insightType === 'positive' 
                          ? 'bg-green-900/20 border-green-500'
                          : insightType === 'warning'
                          ? 'bg-yellow-900/20 border-yellow-500'
                          : insightType === 'negative'
                          ? 'bg-red-900/20 border-red-500'
                          : 'bg-blue-900/20 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2 flex-wrap">
                            <h4 className="font-medium text-white">{insight.title}</h4>
                            {insight.category && getCategoryBadge(insight.category)}
                            {insight.priority && insight.priority >= 8 && (
                              <Badge className="bg-orange-600 text-white text-xs">
                                High Priority
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-300 leading-relaxed">{insight.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

      </CardContent>
    </Card>
  );
};



