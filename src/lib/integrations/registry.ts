import { IntegrationAdapter } from './types'

const adapters = new Map<string, IntegrationAdapter>()

export function registerAdapter(adapter: IntegrationAdapter): void {
  adapters.set(adapter.provider, adapter)
}

export function getAdapter(provider: string): IntegrationAdapter | undefined {
  return adapters.get(provider)
}

export function getRegisteredProviders(): string[] {
  return Array.from(adapters.keys())
}
