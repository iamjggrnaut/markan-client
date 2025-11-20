import { useState, useCallback } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

interface ValidationRules {
  [key: string]: ValidationRule;
}

interface FormErrors {
  [key: string]: string;
}

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationRules?: ValidationRules,
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = useCallback(
    (fieldName?: string): boolean => {
      if (!validationRules) return true;

      const fieldsToValidate = fieldName
        ? [fieldName]
        : Object.keys(validationRules);

      const newErrors: FormErrors = {};

      fieldsToValidate.forEach((field) => {
        const rule = validationRules[field];
        const value = values[field];

        if (rule.required && (!value || value === '')) {
          newErrors[field] = 'Это поле обязательно';
          return;
        }

        if (rule.minLength && value && value.length < rule.minLength) {
          newErrors[field] = `Минимальная длина: ${rule.minLength}`;
          return;
        }

        if (rule.maxLength && value && value.length > rule.maxLength) {
          newErrors[field] = `Максимальная длина: ${rule.maxLength}`;
          return;
        }

        if (rule.pattern && value && !rule.pattern.test(value)) {
          newErrors[field] = 'Неверный формат';
          return;
        }

        if (rule.custom) {
          const customError = rule.custom(value);
          if (customError) {
            newErrors[field] = customError;
            return;
          }
        }
      });

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [values, validationRules],
  );

  const handleChange = useCallback(
    (name: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.value;
      setValues((prev) => ({ ...prev, [name]: value }));

      if (touched[name]) {
        validate(name as string);
      }
    },
    [touched, validate],
  );

  const handleBlur = useCallback(
    (name: keyof T) => () => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      validate(name as string);
    },
    [validate],
  );

  const setValue = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setError = useCallback((name: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const handleSubmit = useCallback(
    (onSubmit: (values: T) => void | Promise<void>) => {
      return async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(
          Object.keys(validationRules || {}).reduce(
            (acc, key) => ({ ...acc, [key]: true }),
            {},
          ),
        );

        if (validate()) {
          await onSubmit(values);
        }
      };
    },
    [values, validate],
  );

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setValue,
    setError,
    reset,
    validate,
    handleSubmit,
  };
}

