// src/lib/validations/password.ts
import { z } from "zod";

// Validación de contraseña segura
// Requisitos:
// - Al menos 8 caracteres
// - Al menos una letra mayúscula
// - Al menos una letra minúscula
// - Al menos un número
// - Al menos un carácter especial
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "La contraseña actual es requerida"),

    newPassword: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(
        passwordRegex,
        "La contraseña debe contener al menos: una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&#)"
      ),

    confirmPassword: z
      .string()
      .min(1, "La confirmación de contraseña es requerida"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"], // Mostrar el error en el campo confirmPassword
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "La nueva contraseña debe ser diferente a la actual",
    path: ["newPassword"],
  });

// Tipo derivado del esquema
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Helper para validar la fortaleza de la contraseña manualmente
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Debe tener al menos 8 caracteres");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Debe contener al menos una mayúscula");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Debe contener al menos una minúscula");
  }

  if (!/\d/.test(password)) {
    errors.push("Debe contener al menos un número");
  }

  if (!/[@$!%*?&#]/.test(password)) {
    errors.push("Debe contener al menos un carácter especial (@$!%*?&#)");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
