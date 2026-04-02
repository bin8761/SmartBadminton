import type { PaymentProvider } from './provider.types';

type ProviderName = PaymentProvider['name'];

const providers = new Map<ProviderName, PaymentProvider>();

export const registerProvider = (provider: PaymentProvider) => {
  providers.set(provider.name, provider);
};

export const getProvider = (name: ProviderName) => providers.get(name);

export const getProviderOrThrow = (name: ProviderName) => {
  const provider = providers.get(name);
  if (!provider) {
    throw new Error(`Payment provider not registered: ${name}`);
  }
  return provider;
};
