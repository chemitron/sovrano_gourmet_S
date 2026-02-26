import React, { createContext, useContext, useState } from "react";

type StationContextType = {
  stationEmail: string | null;
  setStationEmail: (email: string | null) => void;
};

const StationContext = createContext<StationContextType | undefined>(undefined);

export const StationProvider = ({ children }: { children: React.ReactNode }) => {
  const [stationEmail, setStationEmail] = useState<string | null>(null);

  return (
    <StationContext.Provider value={{ stationEmail, setStationEmail }}>
      {children}
    </StationContext.Provider>
  );
};

export const useStation = () => {
  const context = useContext(StationContext);
  if (!context) {
    throw new Error("useStation must be used within a StationProvider");
  }
  return context;
};
