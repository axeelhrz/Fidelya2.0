'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { getFirebaseErrorMessage } from '@/lib/firebase-errors';

import { ZodTypeAny, TypeOf } from 'zod';

interface AuthFormProps<TSchema extends ZodTypeAny> {
  schema: TSchema;
  onSubmit: (data: TypeOf<TSchema>) => Promise<void>;
  fields: Array<{
    name: import('react-hook-form').Path<TypeOf<TSchema>>;
    label: string;
    type: string;
    icon?: React.ReactNode;
    placeholder?: string;
  }>;
  submitText: string;
  loading?: boolean;
}

export function AuthForm<TSchema extends ZodTypeAny>({ 
  schema, 
  onSubmit, 
  fields, 
  submitText, 
  loading 
}: AuthFormProps<TSchema>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors
  } = useForm<TypeOf<TSchema>>({
    resolver: zodResolver(schema)
  });

  const handleFormSubmit = async (data: TypeOf<TSchema>) => {
    try {
      setIsSubmitting(true);
      clearErrors('root');
      setSubmitSuccess(false);
      
      await onSubmit(data);
      setSubmitSuccess(true);
    } catch (error: unknown) {
      // Use the centralized error handling from firebase-errors.ts
      const message = getFirebaseErrorMessage(error);
      setError('root', { message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit(handleFormSubmit)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {fields.map((field, index) => (
        <motion.div
          key={field.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <Input
            {...register(field.name)}
            type={field.type}
            label={field.label}
            placeholder={field.placeholder}
            icon={field.icon}
            error={errors[field.name]?.message as string}
            autoComplete={
              field.type === 'email' ? 'email' : 
              field.type === 'password' ? 'current-password' : 
              'off'
            }
          />
        </motion.div>
      ))}
      
      <AnimatePresence>
        {errors.root && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl bg-red-50 border border-red-200 p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 font-medium">{errors.root.message as string}</p>
            </div>
          </motion.div>
        )}
        
        {submitSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl bg-green-50 border border-green-200 p-4"
          >
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-700 font-medium">¡Operación exitosa!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: fields.length * 0.1 }}
      >
        <Button
          type="submit"
          fullWidth
          loading={isSubmitting || loading}
          disabled={isSubmitting || loading}
          className="mt-2 shadow-lg hover:shadow-xl transition-shadow duration-300"
        >
          {submitText}
        </Button>
      </motion.div>
    </motion.form>
  );
}