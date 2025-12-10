import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Home,
  Calendar,
  BarChart3,
  X,
  RefreshCw
} from 'lucide-react';

interface HomeValueData {
  date: string;
  estimatedValue: number;
  equity: number;
  mortgageBalance?: number;
  appreciation?: number;
}

interface HomeValueProps {
  onBack: () => void;
}

export function HomeValue({ onBack }: HomeValueProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'1y' | '5y' | '10y' | 'all'>('1y');

  // Mock data - will be replaced with real estate API data
  const [homeValue] = useState<HomeValueData>({
    date: '2024-12-09',
    estimatedValue: 450000,
    equity: 320000,
    mortgageBalance: 130000,
    appreciation: 8.5, // percentage
  });

  const [historicalData] = useState<HomeValueData[]>([
    { date: '2023-12-09', estimatedValue: 415000, equity: 285000, mortgageBalance: 130000, appreciation: 5.2 },
    { date: '2022-12-09', estimatedValue: 395000, equity: 265000, mortgageBalance: 130000, appreciation: 3.8 },
    { date: '2021-12-09', estimatedValue: 380000, equity: 250000, mortgageBalance: 130000, appreciation: 4.1 },
    { date: '2020-12-09', estimatedValue: 365000, equity: 235000, mortgageBalance: 130000, appreciation: 2.5 },
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateEquityPercentage = () => {
    if (!homeValue.mortgageBalance) return 100;
    return ((homeValue.equity / homeValue.estimatedValue) * 100).toFixed(1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-[#374957] mb-2">Home Value & Equity</h1>
          <p className="text-gray-600">Track your home's value and build equity over time</p>
        </div>
        <button
          onClick={() => {
            // TODO: Refresh home value data
            console.log('Refresh home value');
          }}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Estimated Home Value</h3>
            <Home className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-[#374957] mb-2">
            {formatCurrency(homeValue.estimatedValue)}
          </p>
          <div className="flex items-center gap-2">
            {homeValue.appreciation && homeValue.appreciation > 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">
                  +{homeValue.appreciation}% this year
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600 font-medium">
                  {homeValue.appreciation}% this year
                </span>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Home Equity</h3>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-[#374957] mb-2">
            {formatCurrency(homeValue.equity)}
          </p>
          <p className="text-sm text-gray-600">
            {calculateEquityPercentage()}% of home value
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Mortgage Balance</h3>
            <BarChart3 className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-[#374957] mb-2">
            {homeValue.mortgageBalance ? formatCurrency(homeValue.mortgageBalance) : 'N/A'}
          </p>
          {homeValue.mortgageBalance && (
            <p className="text-sm text-gray-600">
              {((homeValue.mortgageBalance / homeValue.estimatedValue) * 100).toFixed(1)}% of home value
            </p>
          )}
        </div>
      </div>

      {/* Value History Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#374957]">Value History</h2>
          <div className="flex items-center gap-2">
            {(['1y', '5y', '10y', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  selectedPeriod === period
                    ? 'bg-[#DC5F12] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period === '1y' ? '1 Year' : period === '5y' ? '5 Years' : period === '10y' ? '10 Years' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Simple Chart Representation */}
        <div className="space-y-4">
          {[...historicalData].reverse().map((data, index) => {
            const maxValue = Math.max(...historicalData.map(d => d.estimatedValue), homeValue.estimatedValue);
            const barWidth = (data.estimatedValue / maxValue) * 100;
            
            return (
              <div key={data.date} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {new Date(data.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-[#374957]">
                    {formatCurrency(data.estimatedValue)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-[#DC5F12] h-3 rounded-full transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                {data.appreciation && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    {data.appreciation > 0 ? (
                      <>
                        <TrendingUp className="w-3 h-3 text-green-600" />
                        <span className="text-green-600">+{data.appreciation}%</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-3 h-3 text-red-600" />
                        <span className="text-red-600">{data.appreciation}%</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Current Value */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#DC5F12]" />
                <span className="text-sm font-medium text-[#374957]">
                  {new Date(homeValue.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short' })} (Current)
                </span>
              </div>
              <span className="text-sm font-semibold text-[#DC5F12]">
                {formatCurrency(homeValue.estimatedValue)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-[#DC5F12] h-3 rounded-full"
                style={{ width: '100%' }}
              />
            </div>
            {homeValue.appreciation && (
              <div className="flex items-center gap-1 text-xs">
                {homeValue.appreciation > 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-green-600 font-medium">+{homeValue.appreciation}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-red-600" />
                    <span className="text-red-600 font-medium">{homeValue.appreciation}%</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Equity Growth */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-[#374957] mb-4">Equity Growth</h2>
        <div className="space-y-4">
          {[...historicalData].reverse().map((data) => (
            <div key={data.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {new Date(data.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short' })}
                </p>
                <p className="text-xs text-gray-500">Equity</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-[#374957]">
                  {formatCurrency(data.equity)}
                </p>
                <p className="text-xs text-gray-500">
                  {((data.equity / data.estimatedValue) * 100).toFixed(1)}% of value
                </p>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between p-3 bg-[#DC5F12] bg-opacity-10 rounded-lg border-2 border-[#DC5F12]">
            <div>
              <p className="text-sm font-medium text-[#374957]">
                {new Date(homeValue.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short' })} (Current)
              </p>
              <p className="text-xs text-gray-500">Equity</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-[#DC5F12]">
                {formatCurrency(homeValue.equity)}
              </p>
              <p className="text-xs text-gray-500">
                {calculateEquityPercentage()}% of value
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

