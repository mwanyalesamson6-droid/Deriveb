import { DerivAccount, SyntheticIndex, TickData } from '../types/deriv';
import { extractLastDigit } from './technicalAnalysis';
import { getIndexBySymbol } from './derivIndices';

type MessageHandler = (data: any) => void;
type TickListener = (tick: TickData) => void;

class DerivWebSocketService {
  private ws: WebSocket | null = null;
  private appId: string = '1089';
  private pingInterval: any = null;
  private messageListeners: Map<string, MessageHandler[]> = new Map();
  private tickListeners: Map<string, TickListener[]> = new Map();
  private isConnecting: boolean = false;
  private reconnectTimeout: any = null;
  private currentSubscribedSymbol: string | null = null;
  private token: string | null = null;

  public isConnected: boolean = false;
  public account: DerivAccount = {
    isAuthorized: false,
    isVirtual: true,
    loginId: 'VRTC_DEMO',
    balance: 10000.0,
    currency: 'USD',
  };

  constructor() {
    // Load saved token from localStorage if available
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('deriv_api_token');
      if (savedToken) {
        this.token = savedToken;
      }
    }
  }

  public connect(appId: string = '1089'): Promise<boolean> {
    this.appId = appId;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve(true);
    }

    this.isConnecting = true;

    return new Promise((resolve) => {
      try {
        const wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${this.appId}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.isConnecting = false;
          this.startPing();

          // If we have a saved token, try to authorize immediately
          if (this.token) {
            this.authorize(this.token);
          }

          // If we had a previously subscribed symbol, re-subscribe
          if (this.currentSubscribedSymbol) {
            this.subscribeTicks(this.currentSubscribedSymbol);
          }

          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (e) {
            console.error('Error parsing Deriv WS message:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.warn('Deriv WS error (using robust auto-recovery):', error);
          this.isConnecting = false;
          resolve(false);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.isConnecting = false;
          this.stopPing();
          // Auto-reconnect after 4s
          if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = setTimeout(() => {
            this.connect(this.appId);
          }, 4000);
        };
      } catch (err) {
        console.error('WebSocket connection failed:', err);
        this.isConnecting = false;
        resolve(false);
      }
    });
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ ping: 1 });
      }
    }, 25000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public send(payload: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  private handleMessage(data: any) {
    const msgType = data.msg_type;

    // Handle incoming live tick
    if (msgType === 'tick' && data.tick) {
      const raw = data.tick;
      const index = getIndexBySymbol(raw.symbol);
      const digit = extractLastDigit(raw.quote, index.decimals);

      const tickData: TickData = {
        epoch: raw.epoch,
        quote: raw.quote,
        lastDigit: digit,
        symbol: raw.symbol,
      };

      // Notify symbol-specific listeners
      const listeners = this.tickListeners.get(raw.symbol);
      if (listeners) {
        listeners.forEach(cb => cb(tickData));
      }

      // Notify wildcard listeners
      const wildcard = this.tickListeners.get('*');
      if (wildcard) {
        wildcard.forEach(cb => cb(tickData));
      }
    }

    // Handle authorize response
    if (msgType === 'authorize') {
      if (data.error) {
        console.warn('Deriv authorization error:', data.error.message);
        this.account.isAuthorized = false;
      } else if (data.authorize) {
        const auth = data.authorize;
        this.account = {
          isAuthorized: true,
          isVirtual: Boolean(auth.is_virtual),
          loginId: auth.loginid,
          balance: parseFloat(auth.balance),
          currency: auth.currency,
          email: auth.email,
          token: this.token || undefined,
        };
        // Also subscribe to balance updates
        this.send({ balance: 1, subscribe: 1 });
      }
    }

    // Handle balance updates
    if (msgType === 'balance' && data.balance) {
      this.account.balance = parseFloat(data.balance.balance);
      this.account.currency = data.balance.currency;
    }

    // Notify registered message listeners
    if (msgType && this.messageListeners.has(msgType)) {
      this.messageListeners.get(msgType)!.forEach(fn => fn(data));
    }
  }

  public authorize(token: string): Promise<{ success: boolean; error?: string }> {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('deriv_api_token', token);
    }

    return new Promise((resolve) => {
      const onAuth = (data: any) => {
        this.removeMessageListener('authorize', onAuth);
        if (data.error) {
          resolve({ success: false, error: data.error.message });
        } else {
          resolve({ success: true });
        }
      };

      this.addMessageListener('authorize', onAuth);
      this.send({ authorize: token });

      // Safety timeout after 8 seconds
      setTimeout(() => {
        this.removeMessageListener('authorize', onAuth);
        if (!this.account.isAuthorized) {
          resolve({ success: false, error: 'Authorization timed out. Check your token or network.' });
        }
      }, 8000);
    });
  }

  public disconnectAccount() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('deriv_api_token');
    }
    this.account = {
      isAuthorized: false,
      isVirtual: true,
      loginId: 'VRTC_DEMO',
      balance: 10000.0,
      currency: 'USD',
    };
  }

  public subscribeTicks(symbol: string) {
    if (this.currentSubscribedSymbol && this.currentSubscribedSymbol !== symbol) {
      // Unsubscribe from previous symbol ticks to save bandwidth
      this.send({ forget_all: 'ticks' });
    }
    this.currentSubscribedSymbol = symbol;
    this.send({ ticks: symbol, subscribe: 1 });
  }

  public onTick(symbol: string, callback: TickListener) {
    if (!this.tickListeners.has(symbol)) {
      this.tickListeners.set(symbol, []);
    }
    this.tickListeners.get(symbol)!.push(callback);

    return () => {
      const list = this.tickListeners.get(symbol);
      if (list) {
        this.tickListeners.set(symbol, list.filter(cb => cb !== callback));
      }
    };
  }

  public addMessageListener(msgType: string, handler: MessageHandler) {
    if (!this.messageListeners.has(msgType)) {
      this.messageListeners.set(msgType, []);
    }
    this.messageListeners.get(msgType)!.push(handler);
  }

  public removeMessageListener(msgType: string, handler: MessageHandler) {
    const list = this.messageListeners.get(msgType);
    if (list) {
      this.messageListeners.set(msgType, list.filter(h => h !== handler));
    }
  }

  public adjustVirtualBalance(delta: number) {
    if (this.account.isVirtual) {
      this.account.balance = Math.max(0, Math.round((this.account.balance + delta) * 100) / 100);
    }
  }

  public resetVirtualBalance(initial: number = 10000) {
    if (this.account.isVirtual) {
      this.account.balance = initial;
    }
  }
}

export const derivWs = new DerivWebSocketService();
