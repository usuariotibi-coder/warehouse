import { z } from 'zod'

export const ArticuloSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  marca: z.string().optional(),
  numeroParte: z.string().optional(),
  unidad: z.string().min(1).default('pza'),
  stockMinimo: z.number().int().min(0).optional().nullable(),
})

export const UbicacionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(20),
  descripcion: z.string().optional(),
})


export const ProyectoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  responsable: z.string().optional(),
  estado: z.enum(['ACTIVO', 'PAUSADO', 'CERRADO']).default('ACTIVO'),
  fechaInicio: z.string().optional(),
  fechaCierre: z.string().optional(),
})

export const LoteEntradaSchema = z.object({
  articuloId: z.string().min(1),
  ubicacionId: z.string().optional(),
  nivelId: z.string().optional(),
  cantidadOriginal: z.number().positive(),
})

export const EntradaSchema = z.object({
  notas: z.string().optional(),
  lotes: z.array(LoteEntradaSchema).min(1, 'Debe haber al menos un artículo'),
})

export const SalidaItemSchema = z.object({
  articuloId: z.string().min(1),
  cantidad: z.number().positive(),
})

export const SalidaSchema = z.object({
  proyectoId: z.string().optional(),
  notas: z.string().optional(),
  items: z.array(SalidaItemSchema).min(1),
  apartadoId: z.string().optional(),
})

export const ApartadoItemSchema = z.object({
  articuloId: z.string().min(1),
  cantidad: z.number().positive(),
})

export const ApartadoSchema = z.object({
  proyectoId: z.string().optional(),
  notas: z.string().optional(),
  items: z.array(ApartadoItemSchema).min(1),
})

export const UsuarioSchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  rol: z.enum(['ADMIN', 'ALMACENISTA', 'USUARIO']),
})

export const PrecioLoteSchema = z.object({
  precioUnitario: z.number().positive(),
})

export const CambiarPasswordSchema = z
  .object({
    passwordActual: z.string().min(1, 'La contraseña actual es requerida'),
    passwordNueva: z
      .string()
      .min(10, 'Mínimo 10 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número')
      .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
    passwordConfirmar: z.string().min(1, 'Confirma la nueva contraseña'),
  })
  .refine((d) => d.passwordNueva === d.passwordConfirmar, {
    message: 'Las contraseñas no coinciden',
    path: ['passwordConfirmar'],
  })
  .refine((d) => d.passwordActual !== d.passwordNueva, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['passwordNueva'],
  })
