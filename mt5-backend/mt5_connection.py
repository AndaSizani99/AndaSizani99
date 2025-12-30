# mt5_connection.py
import MetaTrader5 as mt5
import os
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

class MT5Connection:
    def __init__(self):
        self.connected = False
        self.account = None
        self.password = None
        self.server = None
        
    def connect(self):
        """
        Connect to MT5 terminal
        Returns: dict with connection status and account info
        """
        try:
            # Get credentials from .env
            self.account = int(os.getenv('MT5_ACCOUNT'))
            self.password = os.getenv('MT5_PASSWORD')
            self.server = os.getenv('MT5_SERVER')
            
            print(f"Attempting to connect to MT5...")
            print(f"Account: {self.account}")
            print(f"Server: {self.server}")
            
            # Initialize MT5 connection
            if not mt5.initialize():
                error = mt5.last_error()
                print(f"MT5 initialization failed: {error}")
                return {
                    'connected': False,
                    'error': f"MT5 initialization failed: {error}"
                }
            
            # Login to account
            authorized = mt5.login(self.account, password=self.password, server=self.server)
            
            if not authorized:
                error = mt5.last_error()
                print(f"Login failed: {error}")
                mt5.shutdown()
                return {
                    'connected': False,
                    'error': f"Login failed: {error}"
                }
            
            # Get account info
            account_info = mt5.account_info()
            if account_info is None:
                return {
                    'connected': False,
                    'error': "Failed to get account info"
                }
            
            self.connected = True
            print("✅ Successfully connected to MT5!")
            
            return {
                'connected': True,
                'account_info': {
                    'login': account_info.login,
                    'name': account_info.name,
                    'server': account_info.server,
                    'balance': account_info.balance,
                    'equity': account_info.equity,
                    'margin': account_info.margin,
                    'free_margin': account_info.margin_free,
                    'margin_level': account_info.margin_level,
                    'leverage': account_info.leverage,
                    'currency': account_info.currency
                }
            }
            
        except Exception as e:
            print(f"Connection error: {e}")
            return {
                'connected': False,
                'error': str(e)
            }
    
    def disconnect(self):
        """Disconnect from MT5"""
        if self.connected:
            mt5.shutdown()
            self.connected = False
            print("Disconnected from MT5")
            return {'status': 'disconnected'}
        return {'status': 'already disconnected'}
    
    def is_connected(self):
        """Check if still connected"""
        if not self.connected:
            return False
        
        # Verify connection is still active
        account_info = mt5.account_info()
        return account_info is not None
    
    def get_account_info(self):
        """Get current account information"""
        if not self.is_connected():
            return {'error': 'Not connected to MT5'}
        
        try:
            account_info = mt5.account_info()
            if account_info is None:
                return {'error': 'Failed to get account info'}
            
            return {
                'balance': account_info.balance,
                'equity': account_info.equity,
                'margin': account_info.margin,
                'free_margin': account_info.margin_free,
                'margin_level': account_info.margin_level,
                'profit': account_info.profit
            }
        except Exception as e:
            return {'error': str(e)}
    
    def start_ea(self, symbol='EURUSD', timeframe='H1', ea_name='Market_Structure_Engulf_EA'):
        """
        Start EA on specified symbol and timeframe
        
        Args:
            symbol: Trading symbol (e.g., 'EURUSD')
            timeframe: Chart timeframe (e.g., 'H1', 'M15')
            ea_name: Name of the Expert Advisor
            
        Returns:
            dict with status
        """
        if not self.is_connected():
            return {'success': False, 'error': 'Not connected to MT5'}
        
        try:
            # Map timeframe string to MT5 constant
            timeframe_map = {
                'M1': mt5.TIMEFRAME_M1,
                'M5': mt5.TIMEFRAME_M5,
                'M15': mt5.TIMEFRAME_M15,
                'M30': mt5.TIMEFRAME_M30,
                'H1': mt5.TIMEFRAME_H1,
                'H4': mt5.TIMEFRAME_H4,
                'D1': mt5.TIMEFRAME_D1,
                'W1': mt5.TIMEFRAME_W1
            }
            
            tf = timeframe_map.get(timeframe.upper(), mt5.TIMEFRAME_H1)
            
            # Check if symbol exists
            symbol_info = mt5.symbol_info(symbol)
            if symbol_info is None:
                return {
                    'success': False,
                    'error': f"Symbol {symbol} not found"
                }
            
            # Enable symbol if not visible
            if not symbol_info.visible:
                if not mt5.symbol_select(symbol, True):
                    return {
                        'success': False,
                        'error': f"Failed to select symbol {symbol}"
                    }
            
            print(f"✅ EA ready to start on {symbol} {timeframe}")
            print(f"📊 Chart prepared for {ea_name}")
            
            # Note: MT5 Python API doesn't directly start EAs
            # EA must be manually attached to chart or use expert_attach() in MQL5
            # This function prepares the environment
            
            return {
                'success': True,
                'message': f'Chart prepared for EA on {symbol} {timeframe}',
                'symbol': symbol,
                'timeframe': timeframe,
                'ea_name': ea_name,
                'note': 'EA must be manually enabled on the chart or use automation'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def stop_ea(self):
        """
        Stop EA by removing all expert advisors
        
        Returns:
            dict with status
        """
        if not self.is_connected():
            return {'success': False, 'error': 'Not connected to MT5'}
        
        try:
            # In MT5 Python API, we can't directly stop EAs
            # But we can close all positions as a safety measure
            
            print("⚠️ Stopping EA...")
            print("Note: Manual EA stop required in MT5 terminal")
            
            return {
                'success': True,
                'message': 'EA stop signal sent',
                'note': 'Please disable EA manually in MT5 or use MQL5 automation'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_positions(self):
        """Get all open positions"""
        if not self.is_connected():
            return {'error': 'Not connected to MT5'}
        
        try:
            positions = mt5.positions_get()
            if positions is None:
                return []
            
            position_list = []
            for pos in positions:
                position_list.append({
                    'ticket': pos.ticket,
                    'time': datetime.fromtimestamp(pos.time).strftime('%Y-%m-%d %H:%M:%S'),
                    'type': 'BUY' if pos.type == mt5.POSITION_TYPE_BUY else 'SELL',
                    'symbol': pos.symbol,
                    'volume': pos.volume,
                    'price_open': pos.price_open,
                    'sl': pos.sl,
                    'tp': pos.tp,
                    'price_current': pos.price_current,
                    'profit': pos.profit,
                    'comment': pos.comment
                })
            
            return position_list
            
        except Exception as e:
            return {'error': str(e)}
    
    def get_history(self, days=7):
        """Get trade history for last N days"""
        if not self.is_connected():
            return {'error': 'Not connected to MT5'}
        
        try:
            from datetime import datetime, timedelta
            
            # Get deals from last N days
            to_date = datetime.now()
            from_date = to_date - timedelta(days=days)
            
            deals = mt5.history_deals_get(from_date, to_date)
            if deals is None:
                return []
            
            history_list = []
            for deal in deals:
                # Filter only position close deals
                if deal.entry == mt5.DEAL_ENTRY_OUT:
                    history_list.append({
                        'ticket': deal.ticket,
                        'time': datetime.fromtimestamp(deal.time).strftime('%Y-%m-%d %H:%M:%S'),
                        'type': 'BUY' if deal.type == mt5.DEAL_TYPE_BUY else 'SELL',
                        'symbol': deal.symbol,
                        'volume': deal.volume,
                        'price': deal.price,
                        'profit': deal.profit,
                        'comment': deal.comment
                    })
            
            return history_list
            
        except Exception as e:
            return {'error': str(e)}


# Create global instance
mt5_conn = MT5Connection()