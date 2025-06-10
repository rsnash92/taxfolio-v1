// backend/src/services/exchanges/ExchangeFactory.ts
import { CoinbaseClient } from './coinbase/CoinbaseClient';
import { ExchangeClient } from './types';

export class ExchangeFactory {
  static create(
    exchange: string,
    encryptedCredentials: string,
    encryptionKey: string
  ): ExchangeClient {
    switch (exchange.toLowerCase()) {
      case 'coinbase':
        return new CoinbaseClient(encryptedCredentials, encryptionKey);
      // Add more exchanges here
      // case 'binance':
      //   return new BinanceClient(encryptedCredentials, encryptionKey);
      // case 'kraken':
      //   return new KrakenClient(encryptedCredentials, encryptionKey);
      default:
        throw new Error(`Unsupported exchange: ${exchange}`);
    }
  }
}