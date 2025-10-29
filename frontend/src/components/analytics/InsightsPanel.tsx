'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface Insight {
  type: 'positive' | 'warning' | 'negative';
  title: string;
  message: string;
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
          const type: Insight['type'] = t === 'positive' || t === 'warning' || t === 'negative' ? t : 'positive';
          return {
            type,
            title: String(i?.title ?? ''),
            message: String(i?.message ?? ''),
          } as Insight;
        });
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
      default:
        return 'bg-blue-600 text-white';
    }
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
          insights.map((insight, index) => (
            <div
              key={index}
              className="p-4 bg-gray-700 rounded-lg space-y-3"
            >
              <div className="flex items-start space-x-3">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-medium text-white">{insight.title}</h3>
                    <Badge className={getInsightBadgeColor(insight.type)}>
                      {insight.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-300">{insight.message}</p>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Sample insights for demonstration */}
        {insights.length === 0 && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-700 rounded-lg space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-medium text-white">Great Start!</h3>
                    <Badge className="bg-green-600 text-white">positive</Badge>
                  </div>
                  <p className="text-sm text-gray-300">
                    You've been consistent with your habits this week. Keep up the momentum!
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-700 rounded-lg space-y-3">
              <div className="flex items-start space-x-3">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-medium text-white">Productivity Trend</h3>
                    <Badge className="bg-blue-600 text-white">insight</Badge>
                  </div>
                  <p className="text-sm text-gray-300">
                    Your most productive hours are between 9-11 AM. Schedule important tasks during this time.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-700 rounded-lg space-y-3">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-medium text-white">Spending Alert</h3>
                    <Badge className="bg-yellow-600 text-white">warning</Badge>
                  </div>
                  <p className="text-sm text-gray-300">
                    You've spent 80% of your weekly budget. Consider reducing non-essential expenses.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};



