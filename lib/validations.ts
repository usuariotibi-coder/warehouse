import { z } from 'zod'

export const ArticuloSchema = z.object({
  nombre: z.string().min(1, 'Name is required'),
  descripcion: z.string().optional(),
  marca: z.string().optional(),
  numeroParte: z.string().optional(),
  unidad: z.string().min(1).default('pza'),
  stockMinimo: z.number().int().min(0).optional().nullable(),
})

export const UbicacionSchema = z.object({
  nombre: z.string().min(1, 'Name is required').max(20),
  descripcion: z.string().optional(),
})


export const ProyectoSchema = z.object({
  nombre: z.string().min(1, 'Name is required'),
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
  proveedorId: z.string().optional(),
  cantidadOriginal: z.number().positive(),
})

export const EntradaSchema = z.object({
  proyectoId: z.string().optional(),
  lotes: z.array(LoteEntradaSchema).min(1, 'At least one item is required'),
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
  activo: z.boolean().optional(),
})

export const PrecioLoteSchema = z.object({
  precioUnitario: z.number().positive(),
})

export const CambiarPasswordSchema = z
  .object({
    passwordActual: z.string().min(1, 'Current password is required'),
    passwordNueva: z
      .string()
      .min(10, 'Minimum 10 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
    passwordConfirmar: z.string().min(1, 'Confirm new password'),
  })
  .refine((d) => d.passwordNueva === d.passwordConfirmar, {
    message: 'Passwords do not match',
    path: ['passwordConfirmar'],
  })
  .refine((d) => d.passwordActual !== d.passwordNueva, {
    message: 'New password must be different from current',
    path: ['passwordNueva'],
  })
