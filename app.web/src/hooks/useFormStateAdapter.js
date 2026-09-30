import { useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";

export function useFormStateAdapter(defaultValues) {
  const form = useForm({
    defaultValues,
    mode: "onSubmit",
  });
  const values = useWatch({ control: form.control }) ?? defaultValues;
  const { getValues, reset, setValue } = form;

  const setValues = useCallback(
    (nextValues) => {
      const resolvedValues =
        typeof nextValues === "function" ? nextValues(getValues()) : nextValues;

      reset(resolvedValues);
    },
    [getValues, reset]
  );

  const resetValues = useCallback(
    (nextValues = defaultValues) => {
      reset(nextValues);
    },
    [defaultValues, reset]
  );

  const setFieldValue = useCallback(
    (fieldName, value) => {
      setValue(fieldName, value, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: false,
      });
    },
    [setValue]
  );

  return {
    ...form,
    values,
    setValues,
    resetValues,
    setFieldValue,
  };
}
