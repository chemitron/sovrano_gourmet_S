import React, { createContext, useContext, useState } from "react";

type InvitadoContextType = {
  role: string | null;
  setRole: (role: string | null) => void;

  invitadoEmail: string | null;
  setInvitadoEmail: (email: string | null) => void;

  nombreInvitado: string | null;
  setNombreInvitado: (nombreInvitado: string | null) => void;

  nombreEstilista: string | null;
  setNombreEstilista: (nombreEstilista: string | null) => void;

  resetContext: () => void;   // ⭐ NEW
};

const InvitadoContext = createContext<InvitadoContextType | undefined>(
  undefined
);

export const InvitadoProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<string | null>(null);
  const [invitadoEmail, setInvitadoEmail] = useState<string | null>(null);
  const [nombreInvitado, setNombreInvitado] = useState<string | null>(null);
  const [nombreEstilista, setNombreEstilista] = useState<string | null>(null);

  // ⭐ GLOBAL RESET FUNCTION
  const resetContext = () => {
    setRole(null);
    setInvitadoEmail(null);
    setNombreInvitado(null);
    setNombreEstilista(null);
  };

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
        resetContext,   // ⭐ expose reset
      }}
    >
      {children}
    </InvitadoContext.Provider>
  );
};

// -----------------------------
// Individual hooks (clean API)
// -----------------------------

export const useRole = () => {
  const ctx = useContext(InvitadoContext);
  if (!ctx) throw new Error("useRole must be used within an InvitadoProvider");
  return { role: ctx.role, setRole: ctx.setRole };
};

export const useInvitado = () => {
  const ctx = useContext(InvitadoContext);
  if (!ctx) throw new Error("useInvitado must be used within an InvitadoProvider");
  return { invitadoEmail: ctx.invitadoEmail, setInvitadoEmail: ctx.setInvitadoEmail };
};

export const useNombreInvitado = () => {
  const ctx = useContext(InvitadoContext);
  if (!ctx) throw new Error("useNombreInvitado must be used within an InvitadoProvider");
  return { nombreInvitado: ctx.nombreInvitado, setNombreInvitado: ctx.setNombreInvitado };
};

export const useNombreEstilista = () => {
  const ctx = useContext(InvitadoContext);
  if (!ctx) throw new Error("useNombreEstilista must be used within an InvitadoProvider");
  return { nombreEstilista: ctx.nombreEstilista, setNombreEstilista: ctx.setNombreEstilista };
};

// ⭐ NEW: clean hook for reset
export const useResetContext = () => {
  const ctx = useContext(InvitadoContext);
  if (!ctx) throw new Error("useResetContext must be used within an InvitadoProvider");
  return ctx.resetContext;
};
