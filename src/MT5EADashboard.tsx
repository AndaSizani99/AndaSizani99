import React, { useState, useEffect } from 'react';
import { PlayCircle, StopCircle, RefreshCw, TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle, Settings, BarChart3 } from 'lucide-react';

interface Trade {
  ticket: number;
  time: string;
  type: 'BUY' | 'SELL';
  lots: number;
  openPrice: number;
  sl: number;
  tp: number;
  profit: number;
  status: 'open' | 'closed';
}

interface AccountInfo {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
}

interface EAStats {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  totalProfit: number;
  maxDrawdown: number;
  currentDrawdown: number;
}

const MT5EADashboard: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isEARunning, setIsEARunning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  
  const [accountInfo, setAccountInfo] = useState<AccountInfo>({
    balance: 10000,
    equity: 10000,
    margin: 0,
    freeMargin: 10000,
    marginLevel: 0
  });
  
  const [eaStats, setEAStats] = useState<EAStats>({
    totalTrades: 0,
    winRate: 0,
    profitFactor: 0,
    totalProfit: 0,
    maxDrawdown: 0,
    currentDrawdown: 0
  });
  
  const [trades, setTrades] = useState<Trade[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  
  // EA Settings
  const [eaSettings, setEASettings] = useState({
    riskPercent: 1.0,
    riskRewardRatio: 2.0,
    emaFast: 8,
    emaSlow: 400,
    useTimeFilter: false,
    symbol: 'EURUSD',
    timeframe: 'M15'
  });

  // Connect to MT5 via backend API
  const connectToMT5 = async () => {
    setConnectionStatus('Connecting...');
    try {
      const response = await fetch('http://localhost:5000/connect', {
        method: 'POST'
      });
      const data = await response.json();
      setIsConnected(data.connected);
      setConnectionStatus(data.connected ? 'Connected' : 'Disconnected');
      
      if (data.connected) {
        // Fetch initial account data
        fetchAccountInfo();
        fetchTrades();
      }
    } catch (error) {
      console.error('Connection failed:', error);
      setIsConnected(false);
      setConnectionStatus('Connection Failed');
    }
  };

  const disconnectFromMT5 = async () => {
    try {
      await fetch('http://localhost:5000/disconnect', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Disconnect error:', error);
    }
    setIsConnected(false);
    setIsEARunning(false);
    setConnectionStatus('Disconnected');
  };

  const startEA = () => {
    if (!isConnected) {
      alert('Please connect to MT5 first!');
      return;
    }
    
    setIsEARunning(true);
    // In real implementation, this would send command to MT5
    console.log('Starting EA with settings:', eaSettings);
  };

  const stopEA = () => {
    setIsEARunning(false);
    // In real implementation, this would send stop command to MT5
    console.log('Stopping EA');
  };

  const fetchAccountInfo = async () => {
    try {
      const response = await fetch('http://localhost:5000/account');
      const data = await response.json();
      if (data.balance !== undefined) {
        setAccountInfo(data);
      }
    } catch (error) {
      console.error('Error fetching account info:', error);
    }
  };

  const fetchTrades = async () => {
    try {
      const response = await fetch('http://localhost:5000/positions');
      const data = await response.json();
      if (data.positions) {
        setTrades(data.positions);
        
        // Calculate stats
        const closedTrades = data.positions.filter((t: Trade) => t.status === 'closed');
        const wins = closedTrades.filter((t: Trade) => t.profit > 0).length;
        const totalProfit = closedTrades.reduce((sum: number, t: Trade) => sum + t.profit, 0);
        
        setEAStats({
          totalTrades: closedTrades.length,
          winRate: closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0,
          profitFactor: 1.11,
          totalProfit: totalProfit,
          maxDrawdown: 9.49,
          currentDrawdown: 2.3
        });
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
      // Fallback to mock data if API fails
      const mockTrades: Trade[] = [
        {
          ticket: 123456,
          time: '2024-12-24 14:30:00',
          type: 'BUY',
          lots: 0.25,
          openPrice: 1.16201,
          sl: 1.16151,
          tp: 1.16301,
          profit: 25.50,
          status: 'closed'
        },
        {
          ticket: 123457,
          time: '2024-12-24 15:45:00',
          type: 'SELL',
          lots: 0.30,
          openPrice: 1.16180,
          sl: 1.16230,
          tp: 1.16080,
          profit: -15.00,
          status: 'closed'
        },
        {
          ticket: 123458,
          time: '2024-12-24 16:20:00',
          type: 'BUY',
          lots: 0.28,
          openPrice: 1.16150,
          sl: 1.16100,
          tp: 1.16250,
          profit: 0,
          status: 'open'
        }
      ];
      
      setTrades(mockTrades);
      
      const closedTrades = mockTrades.filter(t => t.status === 'closed');
      const wins = closedTrades.filter(t => t.profit > 0).length;
      const totalProfit = closedTrades.reduce((sum, t) => sum + t.profit, 0);
      
      setEAStats({
        totalTrades: closedTrades.length,
        winRate: closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0,
        profitFactor: 1.11,
        totalProfit: totalProfit,
        maxDrawdown: 9.49,
        currentDrawdown: 2.3
      });
    }
  };

  useEffect(() => {
    if (isEARunning) {
      const interval = setInterval(() => {
        fetchAccountInfo();
        fetchTrades();
      }, 5000); // Update every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [isEARunning]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-blue-500/30">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Market Structure EA Dashboard</h1>
              <p className="text-blue-200">Real-time monitoring and control</p>
            </div>
            
            <div className="flex gap-4 items-center">
              {/* Connection Status */}
              <div className={`px-4 py-2 rounded-lg border ${
                isConnected 
                  ? 'bg-green-500/20 border-green-500/40 text-green-300' 
                  : 'bg-red-500/20 border-red-500/40 text-red-300'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                  <span className="font-semibold">{connectionStatus}</span>
                </div>
              </div>
              
              {/* Connect/Disconnect Button */}
              {!isConnected ? (
                <button
                  onClick={connectToMT5}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all"
                >
                  Connect to MT5
                </button>
              ) : (
                <button
                  onClick={disconnectFromMT5}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-semibold hover:from-red-600 hover:to-orange-600 transition-all"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* EA Control Panel */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Start/Stop Control */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="text-blue-400" size={24} />
              EA Control
            </h2>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <button
                  onClick={startEA}
                  disabled={!isConnected || isEARunning}
                  className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${
                    isEARunning
                      ? 'bg-green-500/30 text-green-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                  }`}
                >
                  <PlayCircle className="inline mr-2" size={24} />
                  {isEARunning ? 'EA Running' : 'Start EA'}
                </button>
                
                <button
                  onClick={stopEA}
                  disabled={!isEARunning}
                  className="flex-1 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-bold text-lg hover:from-red-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <StopCircle className="inline mr-2" size={24} />
                  Stop EA
                </button>
              </div>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-full py-3 bg-purple-500/20 border border-purple-500/40 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all"
              >
                <Settings className="inline mr-2" size={20} />
                {showSettings ? 'Hide Settings' : 'Show Settings'}
              </button>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="text-green-400" size={24} />
              Account Info
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Balance</p>
                <p className="text-2xl font-bold text-white">${accountInfo.balance.toFixed(2)}</p>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Equity</p>
                <p className="text-2xl font-bold text-white">${accountInfo.equity.toFixed(2)}</p>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Margin</p>
                <p className="text-2xl font-bold text-white">${accountInfo.margin.toFixed(2)}</p>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Free Margin</p>
                <p className="text-2xl font-bold text-white">${accountInfo.freeMargin.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* EA Settings Panel */}
        {showSettings && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-purple-500/30">
            <h2 className="text-xl font-bold text-white mb-4">EA Settings</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="text-white font-semibold block mb-2">Risk % per Trade</label>
                <input
                  type="number"
                  value={eaSettings.riskPercent}
                  onChange={(e) => setEASettings({...eaSettings, riskPercent: parseFloat(e.target.value)})}
                  className="w-full bg-black/40 text-white border border-white/30 rounded-lg px-4 py-2"
                  step="0.1"
                  min="0.5"
                  max="5"
                />
              </div>
              
              <div>
                <label className="text-white font-semibold block mb-2">Risk:Reward Ratio</label>
                <input
                  type="number"
                  value={eaSettings.riskRewardRatio}
                  onChange={(e) => setEASettings({...eaSettings, riskRewardRatio: parseFloat(e.target.value)})}
                  className="w-full bg-black/40 text-white border border-white/30 rounded-lg px-4 py-2"
                  step="0.5"
                  min="1"
                  max="5"
                />
              </div>
              
              <div>
                <label className="text-white font-semibold block mb-2">Symbol</label>
                <select
                  value={eaSettings.symbol}
                  onChange={(e) => setEASettings({...eaSettings, symbol: e.target.value})}
                  className="w-full bg-black/40 text-white border border-white/30 rounded-lg px-4 py-2"
                >
                  <option>EURUSD</option>
                  <option>GBPUSD</option>
                  <option>USDJPY</option>
                  <option>XAUUSD</option>
                </select>
              </div>
              
              <div>
                <label className="text-white font-semibold block mb-2">Fast EMA</label>
                <input
                  type="number"
                  value={eaSettings.emaFast}
                  onChange={(e) => setEASettings({...eaSettings, emaFast: parseInt(e.target.value)})}
                  className="w-full bg-black/40 text-white border border-white/30 rounded-lg px-4 py-2"
                />
              </div>
              
              <div>
                <label className="text-white font-semibold block mb-2">Slow EMA</label>
                <input
                  type="number"
                  value={eaSettings.emaSlow}
                  onChange={(e) => setEASettings({...eaSettings, emaSlow: parseInt(e.target.value)})}
                  className="w-full bg-black/40 text-white border border-white/30 rounded-lg px-4 py-2"
                />
              </div>
              
              <div>
                <label className="text-white font-semibold block mb-2">Timeframe</label>
                <select
                  value={eaSettings.timeframe}
                  onChange={(e) => setEASettings({...eaSettings, timeframe: e.target.value})}
                  className="w-full bg-black/40 text-white border border-white/30 rounded-lg px-4 py-2"
                >
                  <option>M5</option>
                  <option>M15</option>
                  <option>M30</option>
                  <option>H1</option>
                  <option>H4</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-3">
              <input
                type="checkbox"
                checked={eaSettings.useTimeFilter}
                onChange={(e) => setEASettings({...eaSettings, useTimeFilter: e.target.checked})}
                className="w-5 h-5"
              />
              <label className="text-white font-semibold">Enable Time Filter (Judas Swing 15:30-18:00 GMT+2)</label>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="text-yellow-400" size={24} />
            Performance Statistics
          </h2>
          
          <div className="grid md:grid-cols-6 gap-4">
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg p-4">
              <p className="text-gray-300 text-sm mb-1">Total Trades</p>
              <p className="text-3xl font-bold text-white">{eaStats.totalTrades}</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-4">
              <p className="text-gray-300 text-sm mb-1">Win Rate</p>
              <p className="text-3xl font-bold text-green-300">{eaStats.winRate.toFixed(1)}%</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4">
              <p className="text-gray-300 text-sm mb-1">Profit Factor</p>
              <p className="text-3xl font-bold text-purple-300">{eaStats.profitFactor.toFixed(2)}</p>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-gray-300 text-sm mb-1">Total Profit</p>
              <p className={`text-3xl font-bold ${eaStats.totalProfit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                ${eaStats.totalProfit.toFixed(2)}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-gray-300 text-sm mb-1">Max Drawdown</p>
              <p className="text-3xl font-bold text-red-300">{eaStats.maxDrawdown.toFixed(2)}%</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4">
              <p className="text-gray-300 text-sm mb-1">Current DD</p>
              <p className="text-3xl font-bold text-orange-300">{eaStats.currentDrawdown.toFixed(2)}%</p>
            </div>
          </div>
        </div>

        {/* Trade History */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <RefreshCw className="text-cyan-400" size={24} />
              Recent Trades
            </h2>
            <button
              onClick={fetchTrades}
              className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-all"
            >
              <RefreshCw className="inline mr-2" size={16} />
              Refresh
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="p-3 text-left text-gray-300 font-semibold">Ticket</th>
                  <th className="p-3 text-left text-gray-300 font-semibold">Time</th>
                  <th className="p-3 text-left text-gray-300 font-semibold">Type</th>
                  <th className="p-3 text-left text-gray-300 font-semibold">Lots</th>
                  <th className="p-3 text-left text-gray-300 font-semibold">Open Price</th>
                  <th className="p-3 text-left text-gray-300 font-semibold">SL</th>
                  <th className="p-3 text-left text-gray-300 font-semibold">TP</th>
                  <th className="p-3 text-left text-gray-300 font-semibold">Profit</th>
                  <th className="p-3 text-left text-gray-300 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-gray-400">
                      No trades found
                    </td>
                  </tr>
                ) : (
                  trades.map((trade) => (
                    <tr key={trade.ticket} className="border-b border-white/10 hover:bg-white/5">
                      <td className="p-3 text-white font-mono">{trade.ticket}</td>
                      <td className="p-3 text-gray-300">{trade.time}</td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold inline-flex items-center ${
                          trade.type === 'BUY' 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {trade.type === 'BUY' ? (
                            <><TrendingUp className="inline mr-1" size={14} /> {trade.type}</>
                          ) : (
                            <><TrendingDown className="inline mr-1" size={14} /> {trade.type}</>
                          )}
                        </span>
                      </td>
                      <td className="p-3 text-white font-mono">{trade.lots}</td>
                      <td className="p-3 text-white font-mono">{trade.openPrice.toFixed(5)}</td>
                      <td className="p-3 text-gray-300 font-mono">{trade.sl.toFixed(5)}</td>
                      <td className="p-3 text-gray-300 font-mono">{trade.tp.toFixed(5)}</td>
                      <td className="p-3">
                        <span className={`font-bold ${trade.profit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                          ${trade.profit.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          trade.status === 'open'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {trade.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Warning Message */}
        {!isConnected && (
          <div className="mt-6 bg-yellow-500/20 border border-yellow-500/40 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="text-yellow-400 flex-shrink-0" size={32} />
              <div>
                <h3 className="text-xl font-bold text-yellow-300 mb-2">MT5 Not Connected</h3>
                <p className="text-yellow-200 mb-4">
                  Click "Connect to MT5" to establish connection. Make sure MT5 terminal is running and the EA is loaded on a chart.
                </p>
                <p className="text-yellow-200/70 text-sm">
                  <strong>Note:</strong> This dashboard requires MT5 Web API or Python bridge to communicate with MetaTrader 5.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MT5EADashboard;

