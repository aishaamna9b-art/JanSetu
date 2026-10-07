import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface RegionContextType {
  state: string;
  setState: (state: string) => void;
  district: string;
  setDistrict: (district: string) => void;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export function RegionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState('Uttar Pradesh');
  const [district, setDistrict] = useState('');

  return (
    <RegionContext.Provider value={{ state, setState, district, setDistrict }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const context = useContext(RegionContext);
  if (context === undefined) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
}
