import { Duffel } from '@duffel/api';

let duffelClient: Duffel | null = null;

export function getDuffel(): Duffel | null {
  if (!process.env.DUFFEL_API_TOKEN) return null;
  if (!duffelClient) {
    duffelClient = new Duffel({ token: process.env.DUFFEL_API_TOKEN });
  }
  return duffelClient;
}

export function isDuffelConfigured(): boolean {
  return !!process.env.DUFFEL_API_TOKEN;
}
