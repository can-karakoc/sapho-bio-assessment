import { loadInfluencers, loadDiscovery } from '@/lib/data';
import ValidationClient from '@/components/ValidationClient';

export default function ValidationPage() {
  const curated = loadInfluencers();
  const discovered = loadDiscovery();

  return <ValidationClient curated={curated} discovered={discovered} />;
}
