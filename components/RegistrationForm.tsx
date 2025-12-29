import React, { useState } from "react";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "./Form";
import { Input } from "./Input";
import { Button } from "./Button";
import { Spinner } from "./Spinner";
import styles from "./PasswordLoginForm.module.css";
import {
  schema,
  postRegister,
} from "../endpoints/auth/register_POST.schema";

export type RegistrationFormData = z.infer<typeof schema>;

interface RegistrationFormProps {
  className?: string;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const registrationSchema = schema.extend({
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      displayName: "",
      role: "admin" as const,
    },
    schema: registrationSchema,
  });

  const handleSubmit = async (data: RegistrationFormData & { confirmPassword: string }) => {
    setError(null);
    setIsLoading(true);

    try {
      const { confirmPassword, ...registrationData } = data;
      const result = await postRegister(registrationData);
      
      // Show success message and redirect to login
      alert(`Registration successful! Please log in with your credentials.`);
      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err instanceof Error ? err.message : "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={`${styles.form} ${className || ""}`}
      >
        {error && <div className={styles.errorMessage}>{error}</div>}

        <FormItem name="email">
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input
              placeholder="your@email.com"
              type="email"
              autoComplete="email"
              disabled={isLoading}
              value={form.values.email}
              onChange={(e) =>
                form.setValues((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem name="displayName">
          <FormLabel>Display Name (Optional)</FormLabel>
          <FormControl>
            <Input
              placeholder="Your Name"
              type="text"
              autoComplete="name"
              disabled={isLoading}
              value={form.values.displayName || ""}
              onChange={(e) =>
                form.setValues((prev) => ({ ...prev, displayName: e.target.value }))
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem name="password">
          <FormLabel>Password</FormLabel>
          <FormControl>
            <Input
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isLoading}
              value={form.values.password}
              onChange={(e) =>
                form.setValues((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem name="confirmPassword">
          <FormLabel>Confirm Password</FormLabel>
          <FormControl>
            <Input
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isLoading}
              value={form.values.confirmPassword}
              onChange={(e) =>
                form.setValues((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <Button
          type="submit"
          disabled={isLoading}
          className={styles.submitButton}
        >
          {isLoading ? (
            <span className={styles.loadingText}>
              <Spinner className={styles.spinner} size="sm" />
              Creating account...
            </span>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>
    </Form>
  );
};

