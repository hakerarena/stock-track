import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Stock } from '../../models/stock.model';

@Component({
  selector: 'app-stock-card',
  imports: [CommonModule],
  templateUrl: './stock-card.component.html',
  styleUrl: './stock-card.component.scss',
})
export class StockCardComponent {
  @Input() stock!: Stock;
  @Output() removeStock = new EventEmitter<string>();
  @Output() refreshStock = new EventEmitter<string>();

  onRemove(): void {
    this.removeStock.emit(this.stock.symbol);
  }

  onRefresh(): void {
    this.refreshStock.emit(this.stock.symbol);
  }

  getChangeClass(): string {
    return this.stock.change >= 0 ? 'positive' : 'negative';
  }

  getChangeIcon(): string {
    return this.stock.change >= 0 ? '↗' : '↘';
  }

  formatNumber(num: number, decimals: number = 2): string {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  formatVolume(volume?: number): string {
    if (!volume) return 'N/A';

    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  }

  formatMarketCap(marketCap?: number): string {
    if (!marketCap) return 'N/A';

    if (marketCap >= 1000000000000) {
      return `$${(marketCap / 1000000000000).toFixed(2)}T`;
    } else if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(2)}B`;
    } else if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(2)}M`;
    }
    return `$${marketCap.toLocaleString()}`;
  }
}
