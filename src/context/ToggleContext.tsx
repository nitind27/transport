'use client';
import { createContext, useState, ReactNode, useContext } from 'react';

// Type Definitions
type ToggleContextType = {
  isActive: boolean;
  setIsActive: (value: boolean) => void;
  isEditMode: boolean;
  setIsEditmode: (value: boolean) => void;
  isModelopen: boolean;
  setIsmodelopen: (value: boolean) => void;
  isglobleloading: boolean;
  setIsglobleloading: (value: boolean) => void;
  isvalidation: boolean;
  setisvalidation: (value: boolean) => void;
};

// Context Creation
const ToggleContext = createContext<ToggleContextType | undefined>(undefined);

// Custom Hook for Safe Access
export function useToggleContext() {
  const context = useContext(ToggleContext);
  if (!context) {
    throw new Error('useToggleContext must be used within a ToggleProvider');
  }
  return context;
}

// Provider Component
type ToggleProviderProps = {
  children: ReactNode;
};

export function ToggleProvider({ children }: ToggleProviderProps) {
  const [isActive, setIsActive] = useState(false);
  const [isEditMode, setIsEditmode] = useState(false);
  const [isModelopen, setIsmodelopen] = useState(false);
  const [isglobleloading, setIsglobleloading] = useState(false);
  const [isvalidation, setisvalidation] = useState(false);

  return (
    <ToggleContext.Provider value={{ isActive, setIsActive, isEditMode, setIsEditmode, isModelopen, setIsmodelopen, isglobleloading, setIsglobleloading, isvalidation, setisvalidation }}>
      {children}
    </ToggleContext.Provider>
  );
}
