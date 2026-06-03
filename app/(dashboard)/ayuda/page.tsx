'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard, Warehouse, ArrowDownToLine, ArrowUpFromLine,
  Bookmark, Package, MapPin, FolderOpen, BarChart3, Users, User,
  CheckCircle, AlertTriangle, Info, Star, ArrowRight, Upload,
  Search, Filter, QrCode, Bell, Lock, FileSpreadsheet, Layers,
  TrendingUp, ShieldCheck, ChevronDown, ChevronUp, Zap,
} from 'lucide-react'

type Rol = 'ADMIN' | 'ALMACENISTA' | 'USUARIO'

function RolBadge({ rol }: { rol: Rol | Rol[] }) {
  const roles = Array.isArray(rol) ? rol : [rol]
  const colors: Record<Rol, string> = {
    ADMIN: '#ef4444',
    ALMACENISTA: '#f97316',
    USUARIO: '#3b82f6',
  }
  return (
    <span className="flex gap-1 flex-wrap">
      {roles.map(r => (
        <span key={r} className="text-xs font-mono px-2 py-0.5 rounded-full font-semibold"
          style={{ background: colors[r] + '22', color: colors[r], border: `1px solid ${colors[r]}44` }}>
          {r}
        </span>
      ))}
    </span>
  )
}

function TipBox({ type = 'info', children }: { type?: 'info' | 'warning' | 'success' | 'admin'; children: React.ReactNode }) {
  const config = {
    info: { icon: Info, color: '#3b82f6', label: 'Nota' },
    warning: { icon: AlertTriangle, color: '#f59e0b', label: 'Importante' },
    success: { icon: CheckCircle, color: '#22c55e', label: 'Buena práctica' },
    admin: { icon: ShieldCheck, color: '#ef4444', label: 'Solo ADMIN' },
  }
  const { icon: Icon, color, label } = config[type]
  return (
    <div className="flex gap-3 p-3 rounded-lg mt-3"
      style={{ background: color + '11', border: `1px solid ${color}33` }}>
      <Icon size={16} style={{ color, flexShrink: 0, marginTop: 2 }} />
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        <span className="font-semibold" style={{ color }}>{label}: </span>
        {children}
      </div>
    </div>
  )
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
        style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)' }}>
        {n}
      </span>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{text}</p>
    </div>
  )
}

function SectionCard({ icon: Icon, title, color, children, roles }: {
  icon: React.ElementType; title: string; color: string; children: React.ReactNode; roles?: Rol[]
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="card-industrial overflow-hidden mb-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-4 text-left"
        style={{ borderBottom: open ? '1px solid var(--border)' : 'none' }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: color + '22' }}>
          <Icon size={20} style={{ color }} />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-semibold">{title}</h3>
          {roles && <div className="mt-1"><RolBadge rol={roles} /></div>}
        </div>
        {open ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  )
}

function FlowStep({ steps }: { steps: { icon: React.ElementType; label: string; color: string }[] }) {
  return (
    <div className="flex items-center gap-2 flex-wrap my-3">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: s.color + '15', border: `1px solid ${s.color}33` }}>
            <s.icon size={14} style={{ color: s.color }} />
            <span className="text-xs font-medium" style={{ color: s.color }}>{s.label}</span>
          </div>
          {i < steps.length - 1 && <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />}
        </div>
      ))}
    </div>
  )
}

// ─── GUÍA ADMIN ─────────────────────────────────────────────────────────────

function GuiaAdmin() {
  return (
    <div className="space-y-2">

      {/* Dashboard */}
      <SectionCard icon={LayoutDashboard} title="Dashboard" color="#8b5cf6" roles={['ADMIN']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Vista ejecutiva del inventario en tiempo real. Muestra métricas clave y alertas activas.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          {[
            { label: 'Total artículos', icon: Package, color: '#3b82f6' },
            { label: 'Stock valorizado', icon: TrendingUp, color: '#22c55e' },
            { label: 'Entradas recientes', icon: ArrowDownToLine, color: '#f97316' },
            { label: 'Alertas de stock', icon: AlertTriangle, color: '#ef4444' },
          ].map(m => (
            <div key={m.label} className="flex flex-col items-center gap-2 p-3 rounded-lg"
              style={{ background: 'var(--bg-tertiary)' }}>
              <m.icon size={22} style={{ color: m.color }} />
              <span className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>{m.label}</span>
            </div>
          ))}
        </div>
        <TipBox type="success">Revisa el dashboard cada mañana para identificar artículos con stock bajo antes de que sean un problema.</TipBox>
      </SectionCard>

      {/* Almacén */}
      <SectionCard icon={Warehouse} title="Vista del Almacén" color="#06b6d4" roles={['ADMIN', 'ALMACENISTA', 'USUARIO']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Visualización completa del almacén organizado por racks y niveles. Permite ver el contenido de cada ubicación de un vistazo.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Layers size={16} style={{ color: '#06b6d4' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Vista de Racks</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Cada tarjeta es una ubicación. Muestra artículos por nivel con cantidad disponible.</p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Search size={16} style={{ color: '#06b6d4' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Buscar artículos</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Usa el buscador para localizar un artículo y ver en qué niveles está distribuido.</p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <QrCode size={16} style={{ color: '#06b6d4' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Código QR</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Cada ubicación tiene un QR único para identificación física en el almacén.</p>
          </div>
        </div>
        <TipBox type="admin">Solo el ADMIN puede configurar los separadores entre filas (pasillos y muros) usando los botones entre grupos de racks.</TipBox>
        <TipBox type="info">Haz clic en un nivel para abrir el detalle de esa ubicación con todos sus artículos y cantidades.</TipBox>
      </SectionCard>

      {/* Artículos */}
      <SectionCard icon={Package} title="Catálogo de Artículos" color="#10b981" roles={['ADMIN', 'ALMACENISTA', 'USUARIO']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Registro maestro de todos los artículos del inventario con su información completa.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Funciones disponibles</p>
            {[
              { label: 'Buscar por nombre, marca o número de parte', roles: ['ADMIN', 'ALMACENISTA', 'USUARIO'] as Rol[] },
              { label: 'Ver historial FIFO de lotes por artículo', roles: ['ADMIN', 'ALMACENISTA', 'USUARIO'] as Rol[] },
              { label: 'Crear y editar artículos', roles: ['ADMIN', 'ALMACENISTA'] as Rol[] },
              { label: 'Definir stock mínimo para alertas', roles: ['ADMIN'] as Rol[] },
            ].map(f => (
              <div key={f.label} className="flex items-center justify-between gap-2 text-xs p-2 rounded"
                style={{ background: 'var(--bg-tertiary)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
                <RolBadge rol={f.roles} />
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Detalle de artículo incluye:</p>
            <ul className="space-y-1.5">
              {['Lotes FIFO ordenados (más antiguo → más nuevo)', 'Stock total y apartado', 'Precio por lote (sin precio = pendiente)', 'Historial de movimientos entre niveles'].map(i => (
                <li key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <CheckCircle size={12} style={{ color: '#10b981' }} />{i}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <TipBox type="success">Asigna siempre el número de parte para facilitar búsquedas y evitar duplicados al cargar CSV.</TipBox>
      </SectionCard>

      {/* Entradas */}
      <SectionCard icon={ArrowDownToLine} title="Entradas de Inventario" color="#f97316" roles={['ADMIN', 'ALMACENISTA']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Registra la llegada de nuevos artículos al almacén. Cada entrada genera lotes que el sistema gestiona con FIFO.
        </p>
        <p className="text-xs font-semibold uppercase tracking-wider mt-3 mb-2" style={{ color: 'var(--text-muted)' }}>Flujo de entrada manual</p>
        <FlowStep steps={[
          { icon: ArrowDownToLine, label: 'Nueva entrada', color: '#f97316' },
          { icon: Package, label: 'Seleccionar artículos', color: '#3b82f6' },
          { icon: MapPin, label: 'Asignar ubicación/nivel', color: '#06b6d4' },
          { icon: CheckCircle, label: 'Confirmar', color: '#22c55e' },
        ]} />
        <p className="text-xs font-semibold uppercase tracking-wider mt-3 mb-2" style={{ color: 'var(--text-muted)' }}>Carga masiva por CSV</p>
        <FlowStep steps={[
          { icon: FileSpreadsheet, label: 'Preparar CSV', color: '#8b5cf6' },
          { icon: Upload, label: 'Arrastrar archivo', color: '#f97316' },
          { icon: Filter, label: 'Revisar y corregir', color: '#f59e0b' },
          { icon: CheckCircle, label: 'Procesar', color: '#22c55e' },
        ]} />
        <div className="p-3 rounded-lg mt-2" style={{ background: 'var(--bg-tertiary)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Columnas del CSV de entradas:</p>
          <div className="grid grid-cols-2 gap-1">
            {['articulo_nombre', 'numero_parte', 'cantidad', 'ubicacion', 'nivel', 'marca'].map(col => (
              <code key={col} className="text-xs px-2 py-0.5 rounded font-mono"
                style={{ background: 'var(--bg-primary)', color: 'var(--accent-primary)' }}>{col}</code>
            ))}
          </div>
        </div>
        <TipBox type="admin">Solo el ADMIN puede asignar precios a los lotes después de registrar una entrada. Los lotes sin precio quedan marcados como "pendiente".</TipBox>
        <TipBox type="success">El sistema detecta automáticamente si un artículo ya existe por número de parte. Si no existe, lo crea automáticamente al procesar el CSV.</TipBox>
      </SectionCard>

      {/* Salidas */}
      <SectionCard icon={ArrowUpFromLine} title="Salidas de Inventario" color="#ef4444" roles={['ADMIN', 'ALMACENISTA']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Registra el despacho de artículos del almacén. El sistema aplica FIFO automáticamente: descuenta primero del lote más antiguo.
        </p>
        <div className="p-3 rounded-lg mt-2" style={{ background: 'var(--bg-tertiary)', border: '1px solid #ef444433' }}>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} style={{ color: '#f59e0b' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Sistema FIFO Automático</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            FIFO (First In, First Out): el artículo que entró primero es el primero en salir. Garantiza rotación correcta del inventario y costos precisos.
          </p>
          <div className="flex items-center gap-2 mt-2">
            {['Lote más antiguo', 'Segundo lote', 'Lote más nuevo'].map((l, i) => (
              <div key={l} className="flex items-center gap-1">
                <div className={`text-xs px-2 py-1 rounded flex items-center gap-1`}
                  style={{ background: i === 0 ? '#22c55e22' : 'var(--bg-primary)', border: `1px solid ${i === 0 ? '#22c55e44' : 'var(--border)'}`, color: i === 0 ? '#22c55e' : 'var(--text-muted)' }}>
                  {i === 0 && <ArrowRight size={10} />}{l}
                </div>
                {i < 2 && <ArrowRight size={10} style={{ color: 'var(--text-muted)' }} />}
              </div>
            ))}
          </div>
        </div>
        <TipBox type="info">Puedes asociar cada salida a un proyecto para llevar control de costos por proyecto.</TipBox>
        <TipBox type="warning">Si un artículo tiene lotes sin precio, el costo total de la salida quedará como "pendiente" hasta asignar precios.</TipBox>
      </SectionCard>

      {/* Apartados */}
      <SectionCard icon={Bookmark} title="Apartados (Reservas)" color="#8b5cf6" roles={['ADMIN', 'ALMACENISTA', 'USUARIO']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Reserva artículos para un proyecto futuro sin generar salida inmediata. El stock apartado queda marcado y no se puede despachar a otro destino.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          {[
            { icon: Bookmark, color: '#8b5cf6', estado: 'ACTIVO', desc: 'Artículos reservados, vigentes' },
            { icon: ArrowUpFromLine, color: '#22c55e', estado: 'CONVERTIDO', desc: 'Convertido en salida real' },
            { icon: AlertTriangle, color: '#ef4444', estado: 'VENCIDO', desc: 'Superó los 30 días de vigencia' },
          ].map(e => (
            <div key={e.estado} className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="flex items-center gap-2 mb-1">
                <e.icon size={14} style={{ color: e.color }} />
                <span className="text-xs font-semibold" style={{ color: e.color }}>{e.estado}</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{e.desc}</p>
            </div>
          ))}
        </div>
        <TipBox type="warning">Los apartados vencen automáticamente a los 30 días. Revisa periódicamente los activos para liberar stock no utilizado.</TipBox>
      </SectionCard>

      {/* Proyectos */}
      <SectionCard icon={FolderOpen} title="Proyectos" color="#f59e0b" roles={['ADMIN', 'ALMACENISTA', 'USUARIO']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Organiza salidas y apartados por proyecto para llevar trazabilidad y costeo de materiales.
        </p>
        <div className="flex gap-3 mt-2">
          {[
            { label: 'ACTIVO', color: '#22c55e' },
            { label: 'PAUSADO', color: '#f59e0b' },
            { label: 'CERRADO', color: '#6b7280' },
          ].map(e => (
            <span key={e.label} className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: e.color + '22', color: e.color, border: `1px solid ${e.color}44` }}>
              {e.label}
            </span>
          ))}
        </div>
        <TipBox type="success">Cierra los proyectos cuando terminen para mantener limpia la lista activa y facilitar reportes históricos.</TipBox>
      </SectionCard>

      {/* Ubicaciones */}
      <SectionCard icon={MapPin} title="Gestión de Ubicaciones" color="#06b6d4" roles={['ADMIN', 'ALMACENISTA']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Administra los racks y ubicaciones físicas del almacén. Cada ubicación tiene niveles configurables.
        </p>
        <div className="p-3 rounded-lg mt-2" style={{ background: 'var(--bg-tertiary)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Estructura de ubicación:</p>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded" style={{ background: '#06b6d422', color: '#06b6d4' }}>Rack E1</span>
            <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
            <span className="px-2 py-1 rounded" style={{ background: '#8b5cf622', color: '#8b5cf6' }}>N1 (Nivel 1)</span>
            <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
            <span className="px-2 py-1 rounded" style={{ background: '#22c55e22', color: '#22c55e' }}>Artículos</span>
          </div>
        </div>
        <TipBox type="admin">Solo el ADMIN puede crear nuevas ubicaciones. El número de niveles por defecto es 6 y se puede cambiar al crear la ubicación.</TipBox>
      </SectionCard>

      {/* Usuarios */}
      <SectionCard icon={Users} title="Gestión de Usuarios" color="#ef4444" roles={['ADMIN']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Administra las cuentas de acceso al sistema. Solo disponible para ADMIN.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          {[
            { rol: 'ADMIN' as Rol, color: '#ef4444', permisos: ['Acceso total', 'Reportes', 'Usuarios', 'Dashboard', 'Precios', 'Configuración'] },
            { rol: 'ALMACENISTA' as Rol, color: '#f97316', permisos: ['Entradas y salidas', 'Apartados', 'Artículos', 'Ubicaciones', 'Almacén'] },
            { rol: 'USUARIO' as Rol, color: '#3b82f6', permisos: ['Ver almacén', 'Ver artículos', 'Crear apartados', 'Ver proyectos'] },
          ].map(r => (
            <div key={r.rol} className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: r.color + '22', color: r.color, border: `1px solid ${r.color}44` }}>
                {r.rol}
              </span>
              <ul className="mt-2 space-y-1">
                {r.permisos.map(p => (
                  <li key={p} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <CheckCircle size={10} style={{ color: r.color }} />{p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <TipBox type="warning">Asigna el rol mínimo necesario para cada usuario. El rol USUARIO es el más restrictivo y el adecuado para consultas.</TipBox>
      </SectionCard>

      {/* Reportes */}
      <SectionCard icon={BarChart3} title="Reportes" color="#8b5cf6" roles={['ADMIN']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Genera exportaciones de datos para análisis externo. Disponible en formato Excel (.xlsx).
        </p>
        <div className="flex items-center gap-3 mt-2 p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
          <FileSpreadsheet size={28} style={{ color: '#22c55e' }} />
          <div>
            <p className="text-sm font-medium">Reporte de Entradas</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Historial completo con fecha, artículo, cantidad, precio y almacenista</p>
          </div>
        </div>
        <TipBox type="info">Usa los filtros de fecha para acotar el rango del reporte antes de descargar.</TipBox>
      </SectionCard>

      {/* Perfil */}
      <SectionCard icon={User} title="Mi Perfil" color="#6b7280" roles={['ADMIN', 'ALMACENISTA', 'USUARIO']}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Lock size={14} style={{ color: '#ef4444' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Cambiar Contraseña</span>
            </div>
            <ul className="space-y-1">
              {['Mínimo 10 caracteres', 'Mayúscula y minúscula', 'Número', 'Carácter especial'].map(r => (
                <li key={r} className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <CheckCircle size={10} style={{ color: '#22c55e' }} />{r}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Bell size={14} style={{ color: '#3b82f6' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Vincular Telegram</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Recibe notificaciones de entradas, stock bajo y movimientos directamente en Telegram.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Mejores prácticas */}
      <div className="card-industrial p-5">
        <div className="flex items-center gap-3 mb-4">
          <Star size={20} style={{ color: '#f59e0b' }} />
          <h3 className="font-display font-semibold text-lg">Mejores Prácticas</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: '📦', title: 'Números de parte únicos', desc: 'Asigna siempre número de parte a cada artículo. Facilita búsquedas y evita duplicados en cargas CSV.' },
            { icon: '💰', title: 'Precios al día', desc: 'Asigna precios a los lotes apenas lleguen. Los lotes sin precio afectan el costeo de salidas.' },
            { icon: '📍', title: 'Ubicaciones específicas', desc: 'Siempre asigna ubicación y nivel al registrar entradas. Facilita localización física y el reporte de inventario.' },
            { icon: '🔄', title: 'Revisión de apartados', desc: 'Revisa semanalmente los apartados activos. Los no utilizados bloquean stock innecesariamente.' },
            { icon: '👥', title: 'Roles correctos', desc: 'Nunca asignes ADMIN a personal operativo. Usa ALMACENISTA para quienes registran movimientos.' },
            { icon: '📊', title: 'Reportes mensuales', desc: 'Genera el reporte de entradas mensualmente para conciliar inventario físico con el sistema.' },
          ].map(p => (
            <div key={p.title} className="flex gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <span className="text-2xl">{p.icon}</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{p.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── GUÍA USUARIO/ALMACENISTA ────────────────────────────────────────────────

function GuiaUsuario({ rol }: { rol: 'ALMACENISTA' | 'USUARIO' }) {
  const esAlmacenista = rol === 'ALMACENISTA'

  return (
    <div className="space-y-2">

      <SectionCard icon={Warehouse} title="Vista del Almacén" color="#06b6d4" roles={['ALMACENISTA', 'USUARIO']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Visualiza el inventario organizado por racks y niveles. Haz clic en cualquier nivel para ver su contenido detallado.
        </p>
        <div className="space-y-2 mt-2">
          <Step n={1} text="Identifica el rack en la vista principal (E1, E2, F1, etc.)" />
          <Step n={2} text="Haz clic en el número de nivel (N1, N2...) para abrir el detalle" />
          <Step n={3} text="Dentro verás todos los artículos con sus cantidades disponibles" />
          <Step n={4} text="Usa el buscador para localizar un artículo específico en el almacén" />
        </div>
        <TipBox type="info">El código QR de cada ubicación te permite identificar físicamente el rack en el almacén.</TipBox>
      </SectionCard>

      <SectionCard icon={Package} title="Catálogo de Artículos" color="#10b981" roles={['ALMACENISTA', 'USUARIO']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Consulta el catálogo completo de artículos, su stock actual y distribución en el almacén.
        </p>
        <div className="space-y-1.5 mt-2">
          {[
            'Busca por nombre, marca o número de parte',
            'Consulta el stock total disponible por artículo',
            'Revisa el historial de lotes (más antiguo al más nuevo)',
            esAlmacenista ? 'Crea y edita artículos del catálogo' : 'Solo consulta — no puedes editar artículos',
          ].map(f => (
            <div key={f} className="flex items-center gap-2 text-xs p-2 rounded"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
              <CheckCircle size={12} style={{ color: '#10b981' }} />{f}
            </div>
          ))}
        </div>
      </SectionCard>

      {esAlmacenista && (
        <SectionCard icon={ArrowDownToLine} title="Registrar Entradas" color="#f97316" roles={['ALMACENISTA']}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Registra la recepción de nuevos artículos al almacén.
          </p>
          <p className="text-xs font-semibold uppercase tracking-wider mt-3 mb-2" style={{ color: 'var(--text-muted)' }}>Entrada manual paso a paso</p>
          <div className="space-y-2">
            <Step n={1} text='Ve a Entradas → "Nueva entrada"' />
            <Step n={2} text="Agrega los artículos recibidos con su cantidad" />
            <Step n={3} text="Asigna ubicación y nivel a cada artículo" />
            <Step n={4} text='Haz clic en "Registrar entrada"' />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider mt-3 mb-2" style={{ color: 'var(--text-muted)' }}>Carga masiva por CSV</p>
          <div className="space-y-2">
            <Step n={1} text="Prepara tu archivo CSV con las columnas: articulo_nombre, numero_parte, cantidad, ubicacion, nivel, marca" />
            <Step n={2} text='Haz clic en "Cargar CSV" y arrastra el archivo' />
            <Step n={3} text="Revisa las filas: verde = válida, amarillo = advertencia, rojo = error" />
            <Step n={4} text="Selecciona las filas a procesar y haz clic en Procesar" />
          </div>
          <TipBox type="warning">Si una fila no tiene ubicación asignada en el CSV, podrás seleccionarla manualmente en la pantalla de revisión.</TipBox>
        </SectionCard>
      )}

      {esAlmacenista && (
        <SectionCard icon={ArrowUpFromLine} title="Registrar Salidas" color="#ef4444" roles={['ALMACENISTA']}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Registra el despacho de artículos. El sistema aplica FIFO automáticamente.
          </p>
          <div className="p-3 rounded-lg mt-2" style={{ background: 'var(--bg-tertiary)', border: '1px solid #ef444433' }}>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={14} style={{ color: '#f59e0b' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>FIFO automático</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              No necesitas seleccionar de qué lote salir. El sistema descuenta automáticamente del lote más antiguo.
            </p>
          </div>
          <div className="space-y-2 mt-3">
            <Step n={1} text='Ve a Salidas → "Nueva salida"' />
            <Step n={2} text="Selecciona el artículo y la cantidad a despachar" />
            <Step n={3} text="Asocia opcionalmente a un proyecto" />
            <Step n={4} text="Confirma la salida" />
          </div>
          <TipBox type="info">Si el artículo tiene stock apartado, ese stock no está disponible para salidas directas.</TipBox>
        </SectionCard>
      )}

      <SectionCard icon={Bookmark} title="Apartados (Reservas)" color="#8b5cf6" roles={['ALMACENISTA', 'USUARIO']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Reserva artículos para asegurar su disponibilidad para un proyecto futuro.
        </p>
        <div className="space-y-2 mt-2">
          <Step n={1} text='Ve a Apartados → "Nuevo apartado"' />
          <Step n={2} text="Selecciona los artículos y cantidades a reservar" />
          <Step n={3} text="Asocia a un proyecto (opcional)" />
          <Step n={4} text="El apartado queda activo por 30 días" />
        </div>
        <TipBox type="warning">Los apartados vencen a los 30 días. Solicita la conversión a salida antes de que expire.</TipBox>
        <TipBox type="info">El stock apartado aparece marcado en el catálogo y no puede ser despachado por otra salida.</TipBox>
      </SectionCard>

      <SectionCard icon={FolderOpen} title="Proyectos" color="#f59e0b" roles={['ALMACENISTA', 'USUARIO']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Organiza y consulta los proyectos activos. Puedes asociar salidas y apartados a proyectos para trazabilidad.
        </p>
        <div className="flex gap-3 mt-2">
          {[
            { label: 'ACTIVO', color: '#22c55e', desc: 'En curso' },
            { label: 'PAUSADO', color: '#f59e0b', desc: 'Temporalmente detenido' },
            { label: 'CERRADO', color: '#6b7280', desc: 'Finalizado' },
          ].map(e => (
            <div key={e.label} className="flex-1 p-2 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)' }}>
              <span className="text-xs font-bold" style={{ color: e.color }}>{e.label}</span>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{e.desc}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={User} title="Mi Perfil" color="#6b7280" roles={['ALMACENISTA', 'USUARIO']}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Lock size={14} style={{ color: '#ef4444' }} />
              <span className="text-xs font-semibold">Cambiar Contraseña</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Haz clic en el botón "Contraseña" junto a tu nombre. La nueva contraseña debe tener mínimo 10 caracteres con mayúscula, minúscula, número y carácter especial.
            </p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Bell size={14} style={{ color: '#3b82f6' }} />
              <span className="text-xs font-semibold">Notificaciones Telegram</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Vincula tu cuenta de Telegram para recibir alertas de stock y movimientos en tiempo real.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Tips rápidos */}
      <div className="card-industrial p-5">
        <div className="flex items-center gap-3 mb-4">
          <Star size={20} style={{ color: '#f59e0b' }} />
          <h3 className="font-display font-semibold text-lg">Tips Rápidos</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: '🔍', title: 'Buscar rápido', desc: 'Usa el número de parte para encontrar artículos al instante en el catálogo.' },
            { icon: '📍', title: 'Localizar físicamente', desc: 'Desde el almacén, haz clic en un nivel para ver exactamente qué hay y dónde.' },
            { icon: '⏰', title: 'Vigencia de apartados', desc: 'Revisa tus apartados cada semana. Expiran en 30 días automáticamente.' },
            { icon: '📱', title: 'Telegram activo', desc: 'Vincula Telegram para recibir alertas importantes sin tener que estar en la app.' },
          ].map(p => (
            <div key={p.title} className="flex gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <span className="text-2xl">{p.icon}</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{p.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────────────────────────

export default function AyudaPage() {
  const { data: session } = useSession()
  const rol = (session?.user as any)?.rol as Rol ?? 'USUARIO'
  const esAdmin = rol === 'ADMIN'

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="card-industrial p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: esAdmin ? '#ef444422' : '#3b82f622' }}>
            {esAdmin
              ? <ShieldCheck size={28} style={{ color: '#ef4444' }} />
              : <User size={28} style={{ color: '#3b82f6' }} />}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">
              {esAdmin ? 'Guía Completa — Administrador' : `Guía de Usuario — ${rol}`}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {esAdmin
                ? 'Manual completo de todas las funciones, ventanas y mejores prácticas del sistema.'
                : 'Guía de las funciones disponibles para tu rol en InventaPro.'}
            </p>
            <div className="mt-2">
              <RolBadge rol={rol} />
            </div>
          </div>
        </div>
      </div>

      {esAdmin ? <GuiaAdmin /> : <GuiaUsuario rol={rol as 'ALMACENISTA' | 'USUARIO'} />}
    </div>
  )
}
