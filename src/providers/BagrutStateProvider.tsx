/**
 * Bagrut State Provider
 * Wraps the application with the enhanced Bagrut state management
 */

import React from 'react';
import { BagrutProvider } from '../contexts/BagrutContext';

interface BagrutStateProviderProps {
  children: React.ReactNode;
}

/**
 * Main provider component that wraps the application with Bagrut state management
 */
export const BagrutStateProvider: React.FC<BagrutStateProviderProps> = ({ children }) => {
  return (
    <BagrutProvider>
      {children}
    </BagrutProvider>
  );
};

export default BagrutStateProvider;