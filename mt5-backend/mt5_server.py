# mt5_server.py
from flask import Flask, jsonify, request
from flask_cors import CORS
from mt5_connection import mt5_conn
import json

app = Flask(__name__)

# Enable CORS for React frontend
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "https://*.vercel.app"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Store EA running state
ea_state = {
    'running': False,
    'symbol': 'EURUSD',
    'timeframe': 'H1',
    'settings': {}
}

@app.route('/')
def home():
    """API root endpoint"""
    return jsonify({
        'status': 'running',
        'message': 'MT5 Backend API',
        'version': '1.0.0',
        'endpoints': {
            'connect': 'POST /api/connect',
            'disconnect': 'POST /api/disconnect',
            'account': 'GET /api/account',
            'start-ea': 'POST /api/start-ea',
            'stop-ea': 'POST /api/stop-ea',
            'positions': 'GET /api/positions',
            'history': 'GET /api/history',
            'stats': 'GET /api/stats'
        }
    })

@app.route('/api/connect', methods=['POST', 'OPTIONS'])
def connect():
    """Connect to MT5 terminal"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        result = mt5_conn.connect()
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'connected': False,
            'error': str(e)
        }), 500

@app.route('/api/disconnect', methods=['POST', 'OPTIONS'])
def disconnect():
    """Disconnect from MT5"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        result = mt5_conn.disconnect()
        ea_state['running'] = False
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/status', methods=['GET'])
def status():
    """Check connection status"""
    try:
        is_connected = mt5_conn.is_connected()
        return jsonify({
            'connected': is_connected,
            'ea_running': ea_state['running']
        })
    except Exception as e:
        return jsonify({
            'connected': False,
            'error': str(e)
        }), 500

@app.route('/api/account', methods=['GET'])
def get_account():
    """Get account information"""
    try:
        if not mt5_conn.is_connected():
            return jsonify({
                'error': 'Not connected to MT5'
            }), 400
        
        account_info = mt5_conn.get_account_info()
        return jsonify(account_info)
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@app.route('/api/start-ea', methods=['POST', 'OPTIONS'])
def start_ea():
    """Start the Expert Advisor"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        if not mt5_conn.is_connected():
            return jsonify({
                'success': False,
                'error': 'Not connected to MT5. Please connect first.'
            }), 400
        
        # Get settings from request
        data = request.get_json() or {}
        
        symbol = data.get('symbol', 'EURUSD')
        timeframe = data.get('timeframe', 'H1')
        ea_name = data.get('ea_name', 'Market_Structure_Engulf_EA')
        
        # Store settings
        ea_state['settings'] = data.get('settings', {})
        ea_state['symbol'] = symbol
        ea_state['timeframe'] = timeframe
        
        # Start EA
        result = mt5_conn.start_ea(symbol, timeframe, ea_name)
        
        if result.get('success'):
            ea_state['running'] = True
            
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/stop-ea', methods=['POST', 'OPTIONS'])
def stop_ea():
    """Stop the Expert Advisor"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        if not mt5_conn.is_connected():
            return jsonify({
                'success': False,
                'error': 'Not connected to MT5'
            }), 400
        
        result = mt5_conn.stop_ea()
        
        if result.get('success'):
            ea_state['running'] = False
            
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/positions', methods=['GET'])
def get_positions():
    """Get all open positions"""
    try:
        if not mt5_conn.is_connected():
            return jsonify({
                'error': 'Not connected to MT5'
            }), 400
        
        positions = mt5_conn.get_positions()
        return jsonify({
            'positions': positions,
            'count': len(positions) if isinstance(positions, list) else 0
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    """Get trade history"""
    try:
        if not mt5_conn.is_connected():
            return jsonify({
                'error': 'Not connected to MT5'
            }), 400
        
        # Get days parameter (default 7)
        days = request.args.get('days', 7, type=int)
        
        history = mt5_conn.get_history(days)
        return jsonify({
            'history': history,
            'count': len(history) if isinstance(history, list) else 0
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@app.route('/api/trades', methods=['GET'])
def get_trades():
    """Get all trades (positions + recent history)"""
    try:
        if not mt5_conn.is_connected():
            return jsonify({
                'error': 'Not connected to MT5'
            }), 400
        
        # Get open positions
        positions = mt5_conn.get_positions()
        
        # Get recent history
        history = mt5_conn.get_history(days=7)
        
        # Combine and format
        all_trades = []
        
        # Add open positions
        if isinstance(positions, list):
            for pos in positions:
                all_trades.append({
                    'ticket': pos['ticket'],
                    'time': pos['time'],
                    'type': pos['type'],
                    'lots': pos['volume'],
                    'openPrice': pos['price_open'],
                    'sl': pos['sl'],
                    'tp': pos['tp'],
                    'profit': pos['profit'],
                    'status': 'open'
                })
        
        # Add closed trades from history
        if isinstance(history, list):
            for trade in history:
                all_trades.append({
                    'ticket': trade['ticket'],
                    'time': trade['time'],
                    'type': trade['type'],
                    'lots': trade['volume'],
                    'openPrice': trade['price'],
                    'sl': 0,
                    'tp': 0,
                    'profit': trade['profit'],
                    'status': 'closed'
                })
        
        return jsonify(all_trades)
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Calculate and return EA statistics"""
    try:
        if not mt5_conn.is_connected():
            return jsonify({
                'error': 'Not connected to MT5'
            }), 400
        
        # Get history
        history = mt5_conn.get_history(days=30)
        
        if not isinstance(history, list) or len(history) == 0:
            return jsonify({
                'totalTrades': 0,
                'winRate': 0,
                'profitFactor': 0,
                'totalProfit': 0,
                'maxDrawdown': 0,
                'currentDrawdown': 0
            })
        
        # Calculate statistics
        total_trades = len(history)
        winning_trades = [t for t in history if t.get('profit', 0) > 0]
        losing_trades = [t for t in history if t.get('profit', 0) < 0]
        
        win_rate = (len(winning_trades) / total_trades * 100) if total_trades > 0 else 0
        
        total_profit = sum(t.get('profit', 0) for t in history)
        gross_profit = sum(t.get('profit', 0) for t in winning_trades)
        gross_loss = abs(sum(t.get('profit', 0) for t in losing_trades))
        
        profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else 0
        
        # Calculate drawdown (simplified)
        balance_curve = []
        running_balance = 10000  # Starting balance
        peak_balance = running_balance
        max_drawdown = 0
        
        for trade in sorted(history, key=lambda x: x['time']):
            running_balance += trade.get('profit', 0)
            balance_curve.append(running_balance)
            
            if running_balance > peak_balance:
                peak_balance = running_balance
            
            drawdown = ((peak_balance - running_balance) / peak_balance * 100) if peak_balance > 0 else 0
            if drawdown > max_drawdown:
                max_drawdown = drawdown
        
        current_drawdown = ((peak_balance - running_balance) / peak_balance * 100) if peak_balance > 0 else 0
        
        return jsonify({
            'totalTrades': total_trades,
            'winRate': round(win_rate, 2),
            'profitFactor': round(profit_factor, 2),
            'totalProfit': round(total_profit, 2),
            'maxDrawdown': round(max_drawdown, 2),
            'currentDrawdown': round(current_drawdown, 2),
            'winningTrades': len(winning_trades),
            'losingTrades': len(losing_trades),
            'grossProfit': round(gross_profit, 2),
            'grossLoss': round(gross_loss, 2)
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@app.route('/api/ea-state', methods=['GET'])
def get_ea_state():
    """Get current EA state"""
    return jsonify({
        'running': ea_state['running'],
        'symbol': ea_state['symbol'],
        'timeframe': ea_state['timeframe'],
        'settings': ea_state['settings']
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 MT5 Backend Server Starting...")
    print("=" * 50)
    print("📡 Server: http://localhost:5000")
    print("🔗 API Endpoints:")
    print("   - POST /api/connect")
    print("   - POST /api/start-ea")
    print("   - POST /api/stop-ea")
    print("   - GET  /api/account")
    print("   - GET  /api/trades")
    print("   - GET  /api/stats")
    print("=" * 50)
    print("⚠️  Make sure MT5 terminal is running!")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5000, debug=True)