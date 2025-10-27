import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Stock } from '../../models/stock.model';
import { StockService } from '../../services/stock.service';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-stock-search',
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-search.component.html',
  styleUrl: './stock-search.component.scss',
})
export class StockSearchComponent {
  @Output() stockAdded = new EventEmitter<Stock>();

  searchTerm = '';
  searchResults: any[] = [];
  isSearching = false;
  isAddingStock = false;
  error: string | null = null;
  popularStocks: string[] = [];

  private searchSubject = new Subject<string>();

  constructor(private stockService: StockService) {
    this.popularStocks = this.stockService.getPopularStocks();

    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((term) => {
          if (term.length < 1) {
            return of([]);
          }
          this.isSearching = true;
          return this.stockService.searchStocks(term);
        })
      )
      .subscribe({
        next: (results) => {
          this.searchResults = results;
          this.isSearching = false;
          this.error = null;
        },
        error: (error) => {
          this.searchResults = [];
          this.isSearching = false;
          this.error = 'Search failed. Please try again.';
          console.error('Search error:', error);
        },
      });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
    if (this.searchTerm.length === 0) {
      this.searchResults = [];
      this.error = null;
    }
  }

  addStock(symbol: string): void {
    if (this.isAddingStock) return;

    this.isAddingStock = true;
    this.error = null;

    this.stockService.addToWatchlist(symbol.toUpperCase()).subscribe({
      next: (stock) => {
        this.stockAdded.emit(stock);
        this.isAddingStock = false;
        this.searchTerm = '';
        this.searchResults = [];
      },
      error: (error) => {
        this.error = `Failed to add ${symbol}: ${error.message}`;
        this.isAddingStock = false;
        console.error('Add stock error:', error);
      },
    });
  }

  addPopularStock(symbol: string): void {
    this.addStock(symbol);
  }

  onSearchFormSubmit(): void {
    if (this.searchTerm.trim()) {
      // If there's an exact match in search results, add it
      const exactMatch = this.searchResults.find(
        (result) =>
          result['1. symbol'].toLowerCase() === this.searchTerm.toLowerCase()
      );

      if (exactMatch) {
        this.addStock(exactMatch['1. symbol']);
      } else {
        // Try to add the search term directly as a symbol
        this.addStock(this.searchTerm);
      }
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.error = null;
  }

  getResultDisplayName(result: any): string {
    return `${result['1. symbol']} - ${result['2. name']}`;
  }

  getResultType(result: any): string {
    return result['3. type'] || 'Stock';
  }

  getResultRegion(result: any): string {
    return result['4. region'] || 'US';
  }
}
