import { Component } from '@angular/core';
import { StockDashboardComponent } from './components/stock-dashboard/stock-dashboard.component';

@Component({
  selector: 'app-root',
  imports: [StockDashboardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'Stock Tracker';
}
