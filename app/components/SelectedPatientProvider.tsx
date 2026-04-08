"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  selectedWorkspacePatientStorageKey,
  type SelectedWorkspacePatient,
} from "@/lib/workspace";

interface SelectedPatientContextValue {
  isHydrated: boolean;
  selectedPatient: SelectedWorkspacePatient | null;
  selectPatient: (patient: SelectedWorkspacePatient) => void;
  clearSelectedPatient: () => void;
}

const SelectedPatientContext = createContext<SelectedPatientContextValue | null>(null);

export function SelectedPatientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedPatient, setSelectedPatient] = useState<SelectedWorkspacePatient | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.sessionStorage.getItem(selectedWorkspacePatientStorageKey);
      if (!storedValue) {
        setIsHydrated(true);
        return;
      }

      setSelectedPatient(JSON.parse(storedValue) as SelectedWorkspacePatient);
    } catch (error) {
      console.error("Failed to restore selected workspace patient:", error);
      window.sessionStorage.removeItem(selectedWorkspacePatientStorageKey);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const value = useMemo<SelectedPatientContextValue>(
    () => ({
      isHydrated,
      selectedPatient,
      selectPatient: (patient) => {
        setSelectedPatient(patient);
        window.sessionStorage.setItem(
          selectedWorkspacePatientStorageKey,
          JSON.stringify(patient),
        );
      },
      clearSelectedPatient: () => {
        setSelectedPatient(null);
        window.sessionStorage.removeItem(selectedWorkspacePatientStorageKey);
      },
    }),
    [isHydrated, selectedPatient],
  );

  return (
    <SelectedPatientContext.Provider value={value}>
      {children}
    </SelectedPatientContext.Provider>
  );
}

export function useSelectedPatient() {
  const context = useContext(SelectedPatientContext);

  if (!context) {
    throw new Error("useSelectedPatient must be used inside SelectedPatientProvider.");
  }

  return context;
}
