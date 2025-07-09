import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, MapPin, Clock, Star, Lightbulb, Target, BarChart3 } from 'lucide-react';

interface MarketInsight {
  type: 'trend' | 'recommendation' | 'alert' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
  action?: string;
  icon: React.ReactNode;
}

interface AIIntelligencePanelProps {
  searchQuery: string;
  propertyCount: number;
  isVisible: boolean;
  onClose: () => void;
  onInsightAction?: (insight: MarketInsight) => void;
}

const AIIntelligencePanel: React.FC<AIIntelligencePanelProps> = ({
  searchQuery,
  propertyCount,
  isVisible,
  onClose,
  onInsightAction,
}) => {
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Generate AI insights based on search patterns and market data
  useEffect(() => {
    if (!isVisible) return;

    setIsAnalyzing(true);
    
    // Simulate AI analysis delay
    const timer = setTimeout(() => {
      const newInsights: MarketInsight[] = [];
      const lowerQuery = searchQuery.toLowerCase();

      // Market trend insights
      if (propertyCount > 20) {
        newInsights.push({
          type: 'trend',
          title: 'High Inventory Alert',
          description: `${propertyCount} properties available in this area. Market is favoring buyers with more options.`,
          confidence: 0.85,
          action: 'View all properties',
          icon: <TrendingUp style={{ width: 20, height: 20, color: '#10B981' }} />,
        });
      }

      if (propertyCount < 5) {
        newInsights.push({
          type: 'alert',
          title: 'Limited Availability',
          description: 'Only a few properties match your criteria. Consider expanding your search area.',
          confidence: 0.9,
          action: 'Expand search',
          icon: <Target style={{ width: 20, height: 20, color: '#F59E0B' }} />,
        });
      }

      // Location-based insights
      if (lowerQuery.includes('bromley')) {
        newInsights.push({
          type: 'recommendation',
          title: 'Bromley Market Insight',
          description: 'Average prices in Bromley are 12% below London average. Great value for money.',
          confidence: 0.78,
          action: 'View Bromley properties',
          icon: <MapPin style={{ width: 20, height: 20, color: '#3B82F6' }} />,
        });
      }

      if (lowerQuery.includes('rent')) {
        newInsights.push({
          type: 'opportunity',
          title: 'Rental Market Opportunity',
          description: 'Rental demand is high in this area. Properties typically let within 2 weeks.',
          confidence: 0.82,
          action: 'Set up alerts',
          icon: <Clock style={{ width: 20, height: 20, color: '#8B5CF6' }} />,
        });
      }

      // Price-based insights
      const priceMatch = lowerQuery.match(/£?(\d+)(k|m)?/i);
      if (priceMatch) {
        const amount = parseInt(priceMatch[1]);
        const unit = priceMatch[2]?.toLowerCase();
        const maxPrice = unit === 'k' ? amount * 1000 : unit === 'm' ? amount * 1000000 : amount;
        
        if (maxPrice < 1500) {
          newInsights.push({
            type: 'recommendation',
            title: 'Budget-Friendly Options',
            description: `Properties under £${unit === 'k' ? amount + 'k' : unit === 'm' ? amount + 'm' : amount.toLocaleString()} are in high demand.`,
            confidence: 0.75,
            action: 'View similar properties',
            icon: <Star style={{ width: 20, height: 20, color: '#F59E0B' }} />,
          });
        }
      }

      // Bedroom-based insights
      const bedroomMatch = lowerQuery.match(/(\d+)\s*(bed|bedroom)/);
      if (bedroomMatch) {
        const beds = parseInt(bedroomMatch[1]);
        if (beds >= 3) {
          newInsights.push({
            type: 'trend',
            title: 'Family Home Demand',
            description: `${beds}+ bedroom properties are popular with families. Competition may be higher.`,
            confidence: 0.7,
            action: 'View family homes',
            icon: <BarChart3 style={{ width: 20, height: 20, color: '#EF4444' }} />,
          });
        }
      }

      // General market insights
      newInsights.push({
        type: 'recommendation',
        title: 'Market Timing',
        description: 'Property prices typically dip 3-5% in winter months. Consider timing your purchase.',
        confidence: 0.65,
        action: 'Learn more',
        icon: <Lightbulb style={{ width: 20, height: 20, color: '#E65D24' }} />,
      });

      setInsights(newInsights);
      setIsAnalyzing(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [searchQuery, propertyCount, isVisible]);

  const handleInsightAction = (insight: MarketInsight) => {
    console.log('🎯 [AI_INTELLIGENCE] Insight action triggered:', insight);
    if (onInsightAction) {
      onInsightAction(insight);
    }
  };

  const getInsightColor = (type: MarketInsight['type']) => {
    switch (type) {
      case 'trend': return '#10B981';
      case 'recommendation': return '#3B82F6';
      case 'alert': return '#F59E0B';
      case 'opportunity': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '20px',
    }} onClick={onClose}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Brain style={{ width: 24, height: 24, color: '#E65D24' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#23272f', margin: 0 }}>
              AI Market Intelligence
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
            }}
          >
            <span style={{ fontSize: '24px', color: '#888' }}>×</span>
          </button>
        </div>

        {/* Loading State */}
        {isAnalyzing && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px 20px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #f3f4f6',
              borderTop: '3px solid #E65D24',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '16px',
            }} />
            <div style={{ fontSize: '16px', color: '#6B7280', textAlign: 'center' }}>
              Analyzing market data...
            </div>
            <div style={{ fontSize: '14px', color: '#9CA3AF', textAlign: 'center', marginTop: '8px' }}>
              AI is processing your search and market trends
            </div>
          </div>
        )}

        {/* Insights */}
        {!isAnalyzing && insights.length > 0 && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
            }}>
              <Target style={{ width: 16, height: 16, color: '#E65D24' }} />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#23272f' }}>
                {insights.length} AI Insights Found
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {insights.map((insight, index) => (
                <div
                  key={index}
                  style={{
                    border: `1px solid ${getInsightColor(insight.type)}20`,
                    borderRadius: '12px',
                    padding: '16px',
                    background: `${getInsightColor(insight.type)}05`,
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}>
                    <div style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: `${getInsightColor(insight.type)}10`,
                    }}>
                      {insight.icon}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px',
                      }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#23272f',
                        }}>
                          {insight.title}
                        </span>
                        <span style={{
                          background: getInsightColor(insight.type),
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                        }}>
                          {Math.round(insight.confidence * 100)}%
                        </span>
                      </div>
                      
                      <p style={{
                        fontSize: '14px',
                        color: '#6B7280',
                        margin: '0 0 12px 0',
                        lineHeight: '1.5',
                      }}>
                        {insight.description}
                      </p>
                      
                      {insight.action && (
                        <button
                          onClick={() => handleInsightAction(insight)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: getInsightColor(insight.type),
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            padding: 0,
                          }}
                        >
                          {insight.action}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Insights */}
        {!isAnalyzing && insights.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#6B7280',
          }}>
            <Brain style={{ width: 48, height: 48, color: '#D1D5DB', marginBottom: '16px' }} />
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>
              No insights available
            </div>
            <div style={{ fontSize: '14px' }}>
              Try searching for a specific area or property type
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f8f9fa',
          borderRadius: '12px',
          fontSize: '12px',
          color: '#6B7280',
          textAlign: 'center',
        }}>
          <div style={{ marginBottom: '4px' }}>
            AI insights are based on market data and search patterns
          </div>
          <div>
            Confidence scores indicate AI certainty in recommendations
          </div>
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default AIIntelligencePanel; 