import React, { createContext, useContext, useState } from "react";

type InvitadoContextType = {
  invitadoEmail: string | null;
  setInvitadoEmail: (email: string | null) => void;
};

const InvitadoContext = createContext<InvitadoContextType | undefined>(undefined);

export const InvitadoProvider = ({ children }: { children: React.ReactNode }) => {
  const [invitadoEmail, setInvitadoEmail] = useState<string | null>(null);

  return (
    <InvitadoContext.Provider value={{ invitadoEmail, setInvitadoEmail }}>
      {children}
    </InvitadoContext.Provider>
  );
};

export const useInvitado = () => {
  const context = useContext(InvitadoContext);
  if (!context) {
    throw new Error("useInvitado must be used within a InvitadoProvider");
  }
  return context;
};
