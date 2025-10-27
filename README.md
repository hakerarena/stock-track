# Stock Tracker Angular Application

A modern, responsive Angular application for tracking stock prices with real-time updates and running differences using free stock APIs.

## Features

- **Real-time Stock Tracking**: Monitor stock prices with automatic updates every 30 seconds
- **Stock Search**: Search for stocks by symbol or company name
- **Watchlist Management**: Add/remove stocks from your personal watchlist
- **Price Differences**: View current price, change amount, and percentage change
- **Portfolio Summary**: See total portfolio value and overall performance
- **Responsive Design**: Works great on desktop, tablet, and mobile devices
- **Local Storage**: Your watchlist is saved locally and persists between sessions

## Technology Stack

- **Framework**: Angular 19.2
- **Language**: TypeScript
- **Styling**: SCSS with CSS Variables
- **HTTP Client**: Angular HttpClient
- **State Management**: RxJS Observables
- **APIs Used**: Alpha Vantage API, Financial Modeling Prep API, Mock data for demo

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
