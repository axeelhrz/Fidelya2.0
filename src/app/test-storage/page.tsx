import { StorageConnectionTest } from '@/components/debug/StorageConnectionTest';

export default function TestStoragePage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <StorageConnectionTest />
      </div>
    </div>
  );
}