import { createContext, useContext } from "react";

export const DialogContext = createContext(null);
export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used inside <DialogProvider>");
  return ctx; // { toast(message, "success"|"error"|"info"), confirm(opts), prompt(opts) }
};