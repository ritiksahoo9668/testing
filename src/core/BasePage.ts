import type { Locator, Page } from '@playwright/test';
import { e2eConfig } from '../config/environment.js';
import { NetworkMonitor } from '../utils/network.js';
import { attachPerformanceObserver } from '../utils/performance.js';
import { waitForPageReady } from '../utils/waits.js';

export abstract class BasePage {
  protected readonly networkMonitor: NetworkMonitor;

  constructor(readonly page: Page) {
    this.networkMonitor = new NetworkMonitor(page);
    this.networkMonitor.attach();
    attachPerformanceObserver(page);
  }

  async goto(path = '/'): Promise<void> {
    await this.page.goto(path);
    await waitForPageReady(this.page);
  }

  get url(): string {
    return this.page.url();
  }

  locator(selector: string): Locator {
    return this.page.locator(selector);
  }

  protected get baseUrl(): string {
    return e2eConfig.erp.uiBaseUrl;
  }
}
