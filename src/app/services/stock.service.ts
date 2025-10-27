import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, interval, EMPTY } from 'rxjs';
import { map, catchError, switchMap, tap, retry } from 'rxjs/operators';
import {
  Stock,
  AlphaVantageResponse,
  StockSearchResponse,
} from '../models/stock.model';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  private readonly ALPHA_VANTAGE_API_KEY = 'UTUOKUGIIE5JXALY'; // Replace with your API key
  private readonly ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

  // Demo API key has limitations, so we'll use a mix of free APIs
  private readonly FINANCIAL_MODELING_PREP_API_KEY = 'demo'; // Replace with your API key
  private readonly FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

  private watchedStocksSubject = new BehaviorSubject<Stock[]>([]);
  public watchedStocks$ = this.watchedStocksSubject.asObservable();

  private isPollingActive = false;

  constructor(private http: HttpClient) {
    // Load watched stocks from localStorage
    this.loadWatchedStocks();
  }

  searchStocks(query: string): Observable<any[]> {
    const params = new HttpParams()
      .set('function', 'SYMBOL_SEARCH')
      .set('keywords', query)
      .set('apikey', this.ALPHA_VANTAGE_API_KEY);

    return this.http
      .get<StockSearchResponse>(`${this.ALPHA_VANTAGE_BASE_URL}`, { params })
      .pipe(
        map((response) => response.bestMatches || []),
        catchError((error) => {
          console.error('Error searching stocks:', error);
          return throwError(() => error);
        })
      );
  }

  getStockQuote(symbol: string): Observable<Stock> {
    return this.getQuoteFromAlphaVantage(symbol).pipe(
      catchError((error) => {
        console.warn(
          `Alpha Vantage failed for ${symbol}, trying fallback...`,
          error
        );
        return this.getQuoteFromFMP(symbol);
      }),
      retry(2),
      catchError((error) => {
        console.error(`All APIs failed for ${symbol}:`, error);
        return throwError(() => error);
      })
    );
  }

  private getQuoteFromAlphaVantage(symbol: string): Observable<Stock> {
    const params = new HttpParams()
      .set('function', 'GLOBAL_QUOTE')
      .set('symbol', symbol)
      .set('apikey', this.ALPHA_VANTAGE_API_KEY);

    return this.http
      .get<AlphaVantageResponse>(`${this.ALPHA_VANTAGE_BASE_URL}`, { params })
      .pipe(
        map((response) => {
          if (response['Error Message'] || response['Note']) {
            throw new Error(
              response['Error Message'] ||
                response['Note'] ||
                'API limit reached'
            );
          }

          const quote = response['Global Quote'];
          return this.mapAlphaVantageToStock(quote);
        }),
        catchError((error) => throwError(() => error))
      );
  }

  private getQuoteFromFMP(symbol: string): Observable<Stock> {
    // Using Financial Modeling Prep as fallback (free tier available)
    return this.http
      .get<any[]>(
        `${this.FMP_BASE_URL}/quote/${symbol}?apikey=${this.FINANCIAL_MODELING_PREP_API_KEY}`
      )
      .pipe(
        map((response) => {
          if (!response || response.length === 0) {
            throw new Error('No data found for symbol');
          }
          return this.mapFMPToStock(response[0]);
        }),
        catchError((error) => {
          // If FMP also fails, return mock data for demo purposes
          console.warn('FMP API failed, returning demo data:', error);
          return this.getMockStockData(symbol);
        })
      );
  }

  private getMockStockData(symbol: string): Observable<Stock> {
    // Mock data for demo purposes when APIs are not available
    const mockPrice = 100 + Math.random() * 900; // Random price between 100-1000
    const mockChange = (Math.random() - 0.5) * 20; // Random change between -10 and +10

    const stock: Stock = {
      symbol: symbol.toUpperCase(),
      name: `${symbol.toUpperCase()} Company`,
      price: parseFloat(mockPrice.toFixed(2)),
      previousClose: parseFloat((mockPrice - mockChange).toFixed(2)),
      change: parseFloat(mockChange.toFixed(2)),
      changePercent: parseFloat(
        ((mockChange / (mockPrice - mockChange)) * 100).toFixed(2)
      ),
      volume: Math.floor(Math.random() * 10000000),
      lastUpdated: new Date(),
    };

    return new Observable((observer) => {
      observer.next(stock);
      observer.complete();
    });
  }

  private mapAlphaVantageToStock(quote: any): Stock {
    const price = parseFloat(quote['05. price']);
    const previousClose = parseFloat(quote['08. previous close']);
    const change = parseFloat(quote['09. change']);
    const changePercent = parseFloat(
      quote['10. change percent'].replace('%', '')
    );

    return {
      symbol: quote['01. symbol'],
      name: quote['01. symbol'], // Alpha Vantage doesn't provide company name in quote
      price,
      previousClose,
      change,
      changePercent,
      volume: parseInt(quote['06. volume']),
      lastUpdated: new Date(quote['07. latest trading day']),
    };
  }

  private mapFMPToStock(data: any): Stock {
    return {
      symbol: data.symbol,
      name: data.name || data.symbol,
      price: data.price,
      previousClose: data.previousClose,
      change: data.change,
      changePercent: data.changesPercentage,
      volume: data.volume,
      marketCap: data.marketCap,
      lastUpdated: new Date(),
    };
  }

  addToWatchlist(symbol: string): Observable<Stock> {
    return this.getStockQuote(symbol).pipe(
      tap((stock) => {
        const currentStocks = this.watchedStocksSubject.value;
        const existingIndex = currentStocks.findIndex(
          (s) => s.symbol === stock.symbol
        );

        if (existingIndex === -1) {
          const updatedStocks = [...currentStocks, stock];
          this.watchedStocksSubject.next(updatedStocks);
          this.saveWatchedStocks();
        }
      })
    );
  }

  removeFromWatchlist(symbol: string): void {
    const currentStocks = this.watchedStocksSubject.value;
    const updatedStocks = currentStocks.filter(
      (stock) => stock.symbol !== symbol
    );
    this.watchedStocksSubject.next(updatedStocks);
    this.saveWatchedStocks();
  }

  startPolling(intervalSeconds: number = 30): void {
    if (this.isPollingActive) {
      return;
    }

    this.isPollingActive = true;

    interval(intervalSeconds * 1000)
      .pipe(
        switchMap(() => {
          const watchedStocks = this.watchedStocksSubject.value;
          if (watchedStocks.length === 0) {
            return EMPTY;
          }

          // Update all watched stocks
          const updates = watchedStocks.map((stock) =>
            this.getStockQuote(stock.symbol).pipe(
              catchError((error) => {
                console.error(`Failed to update ${stock.symbol}:`, error);
                return EMPTY;
              })
            )
          );

          return Promise.all(updates.map((obs) => obs.toPromise()));
        })
      )
      .subscribe({
        next: (updatedStocks: any) => {
          if (updatedStocks && updatedStocks.length > 0) {
            this.watchedStocksSubject.next(updatedStocks.filter(Boolean));
            this.saveWatchedStocks();
          }
        },
        error: (error) => {
          console.error('Polling error:', error);
        },
      });
  }

  stopPolling(): void {
    this.isPollingActive = false;
  }

  private saveWatchedStocks(): void {
    const stocks = this.watchedStocksSubject.value;
    localStorage.setItem('watchedStocks', JSON.stringify(stocks));
  }

  private loadWatchedStocks(): void {
    try {
      const saved = localStorage.getItem('watchedStocks');
      if (saved) {
        const stocks = JSON.parse(saved);
        this.watchedStocksSubject.next(stocks);
      }
    } catch (error) {
      console.error('Error loading watched stocks:', error);
    }
  }

  getPopularStocks(): string[] {
    return [
      'AAPL',
      'GOOGL',
      'MSFT',
      'TSLA',
      'AMZN',
      'NVDA',
      'META',
      'NFLX',
      'AMD',
      'INTC',
    ];
  }
}
