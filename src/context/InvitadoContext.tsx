import React, { createContext, useContext, useState } from "react";

type InvitadoContextType = {
  role: string | null; setRole: (role: string | null) => void;
  invitadoEmail: string | null;
  setInvitadoEmail: (email: string | null) => void;
  nombreInvitado: string | null;
  setNombreInvitado: (nombreInvitado: string | null) => void;
  nombreEstilista: string | null;
  setNombreEstilista: (nombreEstilista: string | null) => void;
};

const InvitadoContext = createContext<InvitadoContextType | undefined>(undefined);

export const InvitadoProvider = ({ children }: { children: React.ReactNode }) => {
  const [invitadoEmail, setInvitadoEmail] = useState<string | null>(null);
  const [nombreInvitado, setNombreInvitado] = useState<string | null>(null);
  const [nombreEstilista, setNombreEstilista] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  return (
    <InvitadoContext.Provider
    value={{
    role,
    setRole,
    invitadoEmail,
    setInvitadoEmail,
    nombreInvitado,
    setNombreInvitado,
    nombreEstilista,
    setNombreEstilista,
  }}
>

      {children}
    </InvitadoContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(InvitadoContext);
  if (!context) {
    throw new Error("useRole must be used within an InvitadoProvider");
  }
  return { role: context.role, setRole: context.setRole };
};

export const useInvitado = () => {
  const context = useContext(InvitadoContext);
  if (!context) {
    throw new Error("useInvitado must be used within a InvitadoProvider");
  }
  return context;
};

export const useNombreInvitado = () => { 
  const context = useContext(InvitadoContext); 
  if (!context) { 
    throw new Error("useNombreInvitado must be used within an InvitadoProvider"); 
  } 
  return { nombreInvitado: context.nombreInvitado, setNombreInvitado: context.setNombreInvitado, }; 
};
export const useNombreEstilista = () => { 
  const context = useContext(InvitadoContext); 
  if (!context) { throw new Error("useNombreEstilista must be used within an InvitadoProvider"); 

  } 
  return { nombreEstilista: context.nombreEstilista, setNombreEstilista: context.setNombreEstilista, }; 
};
