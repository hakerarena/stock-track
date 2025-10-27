import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Stock } from '../../models/stock.model';
import { StockService } from '../../services/stock.service';
import { StockCardComponent } from '../stock-card/stock-card.component';
import { StockSearchComponent } from '../stock-search/stock-search.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-stock-dashboard',
  imports: [CommonModule, StockCardComponent, StockSearchComponent],
  templateUrl: './stock-dashboard.component.html',
  styleUrl: './stock-dashboard.component.scss',
})
export class StockDashboardComponent implements OnInit, OnDestroy {
  watchedStocks: Stock[] = [];
  isLoading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private stockService: StockService) {}

  ngOnInit(): void {
    this.stockService.watchedStocks$
      .pipe(takeUntil(this.destroy$))
      .subscribe((stocks) => {
        this.watchedStocks = stocks;
      });

    // Start automatic updates every 30 seconds
    this.stockService.startPolling(30);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stockService.stopPolling();
  }

  onStockAdded(stock: Stock): void {
    // Stock is automatically added to the watchlist by the search component
    this.error = null;
  }

  onRemoveStock(symbol: string): void {
    this.stockService.removeFromWatchlist(symbol);
  }

  onRefreshStock(symbol: string): void {
    this.isLoading = true;
    this.stockService.getStockQuote(symbol).subscribe({
      next: (stock) => {
        this.isLoading = false;
        // The stock will be automatically updated in the watchlist
      },
      error: (error) => {
        this.isLoading = false;
        this.error = `Failed to refresh ${symbol}: ${error.message}`;
      },
    });
  }

  refreshAllStocks(): void {
    this.isLoading = true;
    this.error = null;

    const refreshPromises = this.watchedStocks.map((stock) =>
      this.stockService.getStockQuote(stock.symbol).toPromise()
    );

    Promise.allSettled(refreshPromises)
      .then(() => {
        this.isLoading = false;
      })
      .catch((error) => {
        this.isLoading = false;
        this.error = 'Failed to refresh some stocks';
      });
  }

  getTotalValue(): number {
    return this.watchedStocks.reduce((sum, stock) => sum + stock.price, 0);
  }

  getTotalChange(): number {
    return this.watchedStocks.reduce((sum, stock) => sum + stock.change, 0);
  }

  getTotalChangePercent(): number {
    if (this.watchedStocks.length === 0) return 0;
    const totalCurrent = this.getTotalValue();
    const totalChange = this.getTotalChange();
    const totalPrevious = totalCurrent - totalChange;
    return totalPrevious !== 0 ? (totalChange / totalPrevious) * 100 : 0;
  }

  trackBySymbol(index: number, stock: Stock): string {
    return stock.symbol;
  }
}
