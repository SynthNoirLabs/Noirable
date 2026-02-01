"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type FormValues = Record<string, string | boolean>;

interface FormContextValue {
  values: FormValues;
  setValue: (name: string, value: string | boolean) => void;
  getValues: () => FormValues;
  reset: () => void;
  onSubmit?: (values: FormValues) => void;
}

const FormContext = createContext<FormContextValue | null>(null);

interface FormProviderProps {
  children: React.ReactNode;
  initialValues?: FormValues;
  onSubmit?: (values: FormValues) => void;
}

export function FormProvider({ children, initialValues = {}, onSubmit }: FormProviderProps) {
  const [values, setValues] = useState<FormValues>(initialValues);

  const setValue = useCallback((name: string, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const getValues = useCallback(() => values, [values]);

  const reset = useCallback(() => {
    setValues(initialValues);
  }, [initialValues]);

  return (
    <FormContext.Provider value={{ values, setValue, getValues, reset, onSubmit }}>
      {children}
    </FormContext.Provider>
  );
}

export function useFormContext() {
  const context = useContext(FormContext);
  return context;
}
