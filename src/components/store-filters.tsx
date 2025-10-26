'use client';

import { Button } from "@/components/ui/button";

interface StoreFiltersProps {
  stores: string[];
  selectedStore: string;
  onSelectStore: (store: string) => void;
}

export function StoreFilters({ stores, selectedStore, onSelectStore }: StoreFiltersProps) {
  const allStores = [...stores, 'Todos'];

  return (
    <div className="w-full overflow-x-auto pb-2 mb-6">
      <div className="flex flex-row gap-2">
        {allStores.map(store => (
          <Button
            key={store}
            variant={selectedStore === store ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelectStore(store)}
            className="whitespace-nowrap rounded-full px-4"
          >
            {store}
          </Button>
        ))}
      </div>
    </div>
  );
}
