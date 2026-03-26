import React, { createContext, useContext, useState, useCallback } from 'react';

export interface DashboardReference {
  id: string;
  name: string;
  type: string;
  data: string;
  icon?: string;
}

interface DashboardReferenceContextType {
  pendingReference: DashboardReference | null;
  setPendingReference: (ref: DashboardReference | null) => void;
  addedReferences: DashboardReference[];
  addReference: (ref: DashboardReference) => void;
  removeReference: (id: string) => void;
  clearReferences: () => void;
  availableReferences: DashboardReference[];
  setAvailableReferences: (refs: DashboardReference[]) => void;
}

const DashboardReferenceContext = createContext<DashboardReferenceContextType | undefined>(undefined);

export const DashboardReferenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingReference, setPendingReference] = useState<DashboardReference | null>(null);
  const [addedReferences, setAddedReferences] = useState<DashboardReference[]>([]);
  const [availableReferences, setAvailableReferences] = useState<DashboardReference[]>([]);

  const addReference = useCallback((ref: DashboardReference) => {
    setAddedReferences(prev => {
      if (prev.find(r => r.id === ref.id)) return prev;
      return [...prev, ref];
    });
  }, []);

  const removeReference = useCallback((id: string) => {
    setAddedReferences(prev => prev.filter(r => r.id !== id));
  }, []);

  const clearReferences = useCallback(() => {
    setAddedReferences([]);
    setPendingReference(null);
  }, []);

  return (
    <DashboardReferenceContext.Provider
      value={{
        pendingReference,
        setPendingReference,
        addedReferences,
        addReference,
        removeReference,
        clearReferences,
        availableReferences,
        setAvailableReferences,
      }}
    >
      {children}
    </DashboardReferenceContext.Provider>
  );
};

export const useDashboardReference = () => {
  const context = useContext(DashboardReferenceContext);
  if (!context) {
    throw new Error('useDashboardReference must be used within DashboardReferenceProvider');
  }
  return context;
};
