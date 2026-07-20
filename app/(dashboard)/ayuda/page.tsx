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
    info: { icon: Info, color: '#3b82f6', label: 'Note' },
    warning: { icon: AlertTriangle, color: '#f59e0b', label: 'Important' },
    success: { icon: CheckCircle, color: '#22c55e', label: 'Best practice' },
    admin: { icon: ShieldCheck, color: '#ef4444', label: 'ADMIN only' },
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

// ─── ADMIN GUIDE ─────────────────────────────────────────────────────────────

function GuiaAdmin() {
  return (
    <div className="space-y-2">

      {/* Dashboard */}
      <SectionCard icon={LayoutDashboard} title="Dashboard" color="#8b5cf6" roles={['ADMIN']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Executive real-time inventory view. Displays key metrics and active alerts.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          {[
            { label: 'Total items', icon: Package, color: '#3b82f6' },
            { label: 'Valued stock', icon: TrendingUp, color: '#22c55e' },
            { label: 'Recent entries', icon: ArrowDownToLine, color: '#f97316' },
            { label: 'Stock alerts', icon: AlertTriangle, color: '#ef4444' },
          ].map(m => (
            <div key={m.label} className="flex flex-col items-center gap-2 p-3 rounded-lg"
              style={{ background: 'var(--bg-tertiary)' }}>
              <m.icon size={22} style={{ color: m.color }} />
              <span className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>{m.label}</span>
            </div>
          ))}
        </div>
        <TipBox type="success">Check the dashboard every morning to identify items with low stock before they become a problem.</TipBox>
      </SectionCard>

      {/* Warehouse */}
      <SectionCard icon={Warehouse} title="Warehouse View" color="#06b6d4" roles={['ADMIN', 'ALMACENISTA', 'USUARIO']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Complete visualization of the warehouse organized by racks and levels. See the contents of each location at a glance.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Layers size={16} style={{ color: '#06b6d4' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Rack View</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Each card is a location. Displays items per level with available quantity.</p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Search size={16} style={{ color: '#06b6d4' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Search items</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Use the search to locate an item and see which levels it is distributed across.</p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <QrCode size={16} style={{ color: '#06b6d4' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>QR Code</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Each location has a unique QR code for physical identification in the warehouse.</p>
          </div>
        </div>
        <TipBox type="admin">Only ADMIN can configure dividers between rows (aisles and walls) using the buttons between rack groups.</TipBox>
        <TipBox type="info">Click on a level to open the detail of that location with all its items and quantities.</TipBox>
      </SectionCard>

      {/* Items */}
      <SectionCard icon={Package} title="Item Catalog" color="#10b981" roles={['ADMIN', 'ALMACENISTA', 'USUARIO']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Master registry of all inventory items with their complete information.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Available functions</p>
            {[
              { label: 'Search by name, brand, or part number', roles: ['ADMIN', 'ALMACENISTA', 'USUARIO'] as Rol[] },
              { label: 'View FIFO lot history per item', roles: ['ADMIN', 'ALMACENISTA', 'USUARIO'] as Rol[] },
              { label: 'Create and edit items', roles: ['ADMIN', 'ALMACENISTA'] as Rol[] },
              { label: 'Set minimum stock for alerts', roles: ['ADMIN'] as Rol[] },
            ].map(f => (
              <div key={f.label} className="flex items-center justify-between gap-2 text-xs p-2 rounded"
                style={{ background: 'var(--bg-tertiary)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
                <RolBadge rol={f.roles} />
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Item detail includes:</p>
            <ul className="space-y-1.5">
              {['Ordered FIFO lots (oldest → newest)', 'Total and reserved stock', 'Price per lot (no price = pending)', 'Movement history between levels'].map(i => (
                <li key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <CheckCircle size={12} style={{ color: '#10b981' }} />{i}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <TipBox type="success">Always assign a part number to facilitate searches and avoid duplicates when loading CSV.</TipBox>
      </SectionCard>

      {/* Entries */}
      <SectionCard icon={ArrowDownToLine} title="Inventory Entries" color="#f97316" roles={['ADMIN', 'ALMACENISTA']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Register the arrival of new items to the warehouse. Each entry generates lots that the system manages with FIFO.
        </p>
        <p className="text-xs font-semibold uppercase tracking-wider mt-3 mb-2" style={{ color: 'var(--text-muted)' }}>Manual entry workflow</p>
        <FlowStep steps={[
          { icon: ArrowDownToLine, label: 'New entry', color: '#f97316' },
          { icon: Package, label: 'Select items', color: '#3b82f6' },
          { icon: MapPin, label: 'Assign location/level', color: '#06b6d4' },
          { icon: CheckCircle, label: 'Confirm', color: '#22c55e' },
        ]} />
        <p className="text-xs font-semibold uppercase tracking-wider mt-3 mb-2" style={{ color: 'var(--text-muted)' }}>Bulk load via CSV</p>
        <FlowStep steps={[
          { icon: FileSpreadsheet, label: 'Prepare CSV', color: '#8b5cf6' },
          { icon: Upload, label: 'Drag file', color: '#f97316' },
          { icon: Filter, label: 'Review and fix', color: '#f59e0b' },
          { icon: CheckCircle, label: 'Process', color: '#22c55e' },
        ]} />
        <div className="p-3 rounded-lg mt-2" style={{ background: 'var(--bg-tertiary)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Entry CSV columns:</p>
          <div className="grid grid-cols-2 gap-1">
            {['articulo_nombre', 'numero_parte', 'cantidad', 'ubicacion', 'nivel', 'marca'].map(col => (
              <code key={col} className="text-xs px-2 py-0.5 rounded font-mono"
                style={{ background: 'var(--bg-primary)', color: 'var(--accent-primary)' }}>{col}</code>
            ))}
          </div>
        </div>
        <TipBox type="admin">Only ADMIN can assign prices to lots after registering an entry. Lots without a price are marked as "pending".</TipBox>
        <TipBox type="success">The system automatically detects if an item already exists by part number. If it does not exist, it creates it automatically when processing the CSV.</TipBox>
      </SectionCard>

      {/* Exits */}
      <SectionCard icon={ArrowUpFromLine} title="Inventory Exits" color="#ef4444" roles={['ADMIN', 'ALMACENISTA']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Register the dispatch of items from the warehouse. The system automatically applies FIFO: oldest lot is deducted first.
        </p>
        <div className="p-3 rounded-lg mt-2" style={{ background: 'var(--bg-tertiary)', border: '1px solid #ef444433' }}>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} style={{ color: '#f59e0b' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Automatic FIFO System</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            FIFO (First In, First Out): the first item that entered is the first to leave. Guarantees correct inventory rotation and accurate costs.
          </p>
          <div className="flex items-center gap-2 mt-2">
            {['Oldest lot', 'Second lot', 'Newest lot'].map((l, i) => (
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
        <TipBox type="info">You can associate each exit with a project to track costs by project.</TipBox>
        <TipBox type="warning">If an item has lots without a price, the total exit cost will remain "pending" until prices are assigned.</TipBox>
      </SectionCard>

      {/* Reserves */}
      <SectionCard icon={Bookmark} title="Reserves" color="#8b5cf6" roles={['ADMIN', 'ALMACENISTA', 'USUARIO']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Reserve items for a future project without generating an immediate exit. Reserved stock is marked and cannot be dispatched to another destination.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          {[
            { icon: Bookmark, color: '#8b5cf6', estado: 'ACTIVE', desc: 'Reserved items, current' },
            { icon: ArrowUpFromLine, color: '#22c55e', estado: 'CONVERTED', desc: 'Converted to actual exit' },
            { icon: AlertTriangle, color: '#ef4444', estado: 'EXPIRED', desc: 'Exceeded 30 days of validity' },
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
        <TipBox type="warning">Reserves expire automatically after 30 days. Periodically review active ones to free up unused stock.</TipBox>
      </SectionCard>

      {/* Projects */}
      <SectionCard icon={FolderOpen} title="Projects" color="#f59e0b" roles={['ADMIN', 'ALMACENISTA', 'USUARIO']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Organize exits and reserves by project for traceability and material costing.
        </p>
        <div className="flex gap-3 mt-2">
          {[
            { label: 'ACTIVE', color: '#22c55e' },
            { label: 'PAUSED', color: '#f59e0b' },
            { label: 'CLOSED', color: '#6b7280' },
          ].map(e => (
            <span key={e.label} className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: e.color + '22', color: e.color, border: `1px solid ${e.color}44` }}>
              {e.label}
            </span>
          ))}
        </div>
        <TipBox type="success">Close projects when they finish to keep the active list clean and facilitate historical reports.</TipBox>
      </SectionCard>

      {/* Locations */}
      <SectionCard icon={MapPin} title="Location Management" color="#06b6d4" roles={['ADMIN', 'ALMACENISTA']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Manage the warehouse racks and physical locations. Each location has configurable levels.
        </p>
        <div className="p-3 rounded-lg mt-2" style={{ background: 'var(--bg-tertiary)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Location structure:</p>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded" style={{ background: '#06b6d422', color: '#06b6d4' }}>Rack E1</span>
            <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
            <span className="px-2 py-1 rounded" style={{ background: '#8b5cf622', color: '#8b5cf6' }}>N1 (Level 1)</span>
            <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
            <span className="px-2 py-1 rounded" style={{ background: '#22c55e22', color: '#22c55e' }}>Items</span>
          </div>
        </div>
        <TipBox type="admin">Only ADMIN can create new locations. The default number of levels is 6 and can be changed when creating the location.</TipBox>
      </SectionCard>

      {/* Users */}
      <SectionCard icon={Users} title="User Management" color="#ef4444" roles={['ADMIN']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Manage access accounts to the system. Only available to ADMIN.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          {[
            { rol: 'ADMIN' as Rol, color: '#ef4444', permisos: ['Full access', 'Reports', 'Users', 'Dashboard', 'Prices', 'Settings'] },
            { rol: 'ALMACENISTA' as Rol, color: '#f97316', permisos: ['Entries and exits', 'Reserves', 'Items', 'Locations', 'Warehouse'] },
            { rol: 'USUARIO' as Rol, color: '#3b82f6', permisos: ['View warehouse', 'View items', 'Create reserves', 'View projects'] },
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
        <TipBox type="warning">Assign the minimum required role for each user. The USUARIO role is the most restrictive and suitable for inquiries.</TipBox>
      </SectionCard>

      {/* Reports */}
      <SectionCard icon={BarChart3} title="Reports" color="#8b5cf6" roles={['ADMIN']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Generate data exports for external analysis. Available in Excel format (.xlsx).
        </p>
        <div className="flex items-center gap-3 mt-2 p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
          <FileSpreadsheet size={28} style={{ color: '#22c55e' }} />
          <div>
            <p className="text-sm font-medium">Entry Report</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Complete history with date, item, quantity, price and operator</p>
          </div>
        </div>
        <TipBox type="info">Use date filters to narrow the report range before downloading.</TipBox>
      </SectionCard>

      {/* Profile */}
      <SectionCard icon={User} title="My Profile" color="#6b7280" roles={['ADMIN', 'ALMACENISTA', 'USUARIO']}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Lock size={14} style={{ color: '#ef4444' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Change Password</span>
            </div>
            <ul className="space-y-1">
              {['Minimum 10 characters', 'Uppercase and lowercase', 'Number', 'Special character'].map(r => (
                <li key={r} className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <CheckCircle size={10} style={{ color: '#22c55e' }} />{r}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Bell size={14} style={{ color: '#3b82f6' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Link Telegram</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Receive notifications about entries, low stock, and movements directly on Telegram.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Best practices */}
      <div className="card-industrial p-5">
        <div className="flex items-center gap-3 mb-4">
          <Star size={20} style={{ color: '#f59e0b' }} />
          <h3 className="font-display font-semibold text-lg">Best Practices</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: '📦', title: 'Unique part numbers', desc: 'Always assign a part number to each item. Facilitates searches and avoids duplicates in CSV loads.' },
            { icon: '💰', title: 'Up-to-date prices', desc: 'Assign prices to lots as soon as they arrive. Lots without prices affect exit costing.' },
            { icon: '📍', title: 'Specific locations', desc: 'Always assign location and level when registering entries. Facilitates physical location and inventory reporting.' },
            { icon: '🔄', title: 'Reserve review', desc: 'Review active reserves weekly. Unused ones unnecessarily block stock.' },
            { icon: '👥', title: 'Correct roles', desc: 'Never assign ADMIN to operational staff. Use ALMACENISTA for those who record movements.' },
            { icon: '📊', title: 'Monthly reports', desc: 'Generate the entry report monthly to reconcile physical inventory with the system.' },
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

// ─── USER/WAREHOUSE OPERATOR GUIDE ────────────────────────────────────────────

function GuiaUsuario({ rol }: { rol: 'ALMACENISTA' | 'USUARIO' }) {
  const esAlmacenista = rol === 'ALMACENISTA'

  return (
    <div className="space-y-2">

      <SectionCard icon={Warehouse} title="Warehouse View" color="#06b6d4" roles={['ALMACENISTA', 'USUARIO']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          View inventory organized by racks and levels. Click on any level to see its detailed content.
        </p>
        <div className="space-y-2 mt-2">
          <Step n={1} text="Identify the rack in the main view (E1, E2, F1, etc.)" />
          <Step n={2} text="Click on the level number (N1, N2...) to open the detail" />
          <Step n={3} text="Inside you will see all items with their available quantities" />
          <Step n={4} text="Use the search to locate a specific item in the warehouse" />
        </div>
        <TipBox type="info">Each location's QR code allows you to physically identify the rack in the warehouse.</TipBox>
      </SectionCard>

      <SectionCard icon={Package} title="Item Catalog" color="#10b981" roles={['ALMACENISTA', 'USUARIO']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Browse the complete item catalog, their current stock, and distribution in the warehouse.
        </p>
        <div className="space-y-1.5 mt-2">
          {[
            'Search by name, brand, or part number',
            'Check total available stock per item',
            'Review lot history (oldest to newest)',
            esAlmacenista ? 'Create and edit catalog items' : 'View only — you cannot edit items',
          ].map(f => (
            <div key={f} className="flex items-center gap-2 text-xs p-2 rounded"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
              <CheckCircle size={12} style={{ color: '#10b981' }} />{f}
            </div>
          ))}
        </div>
      </SectionCard>

      {esAlmacenista && (
        <SectionCard icon={ArrowDownToLine} title="Register Entries" color="#f97316" roles={['ALMACENISTA']}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Register the receipt of new items to the warehouse.
          </p>
          <p className="text-xs font-semibold uppercase tracking-wider mt-3 mb-2" style={{ color: 'var(--text-muted)' }}>Manual entry step by step</p>
          <div className="space-y-2">
            <Step n={1} text='Go to Entries → "New Entry"' />
            <Step n={2} text="Add the received items with their quantity" />
            <Step n={3} text="Assign location and level to each item" />
            <Step n={4} text='Click "Record Entry"' />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider mt-3 mb-2" style={{ color: 'var(--text-muted)' }}>Bulk load via CSV</p>
          <div className="space-y-2">
            <Step n={1} text="Prepare your CSV file with the columns: articulo_nombre, numero_parte, cantidad, ubicacion, nivel, marca" />
            <Step n={2} text='Click "Upload CSV" and drag the file' />
            <Step n={3} text="Review the rows: green = valid, yellow = warning, red = error" />
            <Step n={4} text="Select the rows to process and click Process" />
          </div>
          <TipBox type="warning">If a row does not have a location assigned in the CSV, you can select it manually on the review screen.</TipBox>
        </SectionCard>
      )}

      {esAlmacenista && (
        <SectionCard icon={ArrowUpFromLine} title="Register Exits" color="#ef4444" roles={['ALMACENISTA']}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Register the dispatch of items. The system applies FIFO automatically.
          </p>
          <div className="p-3 rounded-lg mt-2" style={{ background: 'var(--bg-tertiary)', border: '1px solid #ef444433' }}>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={14} style={{ color: '#f59e0b' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Automatic FIFO</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              You do not need to select which lot to use. The system automatically deducts from the oldest lot.
            </p>
          </div>
          <div className="space-y-2 mt-3">
            <Step n={1} text='Go to Exits → "New Exit"' />
            <Step n={2} text="Select the item and the quantity to dispatch" />
            <Step n={3} text="Optionally associate with a project" />
            <Step n={4} text="Confirm the exit" />
          </div>
          <TipBox type="info">If the item has reserved stock, that stock is not available for direct exits.</TipBox>
        </SectionCard>
      )}

      <SectionCard icon={Bookmark} title="Reserves" color="#8b5cf6" roles={['ALMACENISTA', 'USUARIO']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Reserve items to ensure their availability for a future project.
        </p>
        <div className="space-y-2 mt-2">
          <Step n={1} text='Go to Reserves → "New Reserve"' />
          <Step n={2} text="Select the items and quantities to reserve" />
          <Step n={3} text="Associate with a project (optional)" />
          <Step n={4} text="The reserve stays active for 30 days" />
        </div>
        <TipBox type="warning">Reserves expire after 30 days. Request conversion to exit before it expires.</TipBox>
        <TipBox type="info">Reserved stock appears marked in the catalog and cannot be dispatched by another exit.</TipBox>
      </SectionCard>

      <SectionCard icon={FolderOpen} title="Projects" color="#f59e0b" roles={['ALMACENISTA', 'USUARIO']}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Organize and view active projects. You can associate exits and reserves with projects for traceability.
        </p>
        <div className="flex gap-3 mt-2">
          {[
            { label: 'ACTIVE', color: '#22c55e', desc: 'In progress' },
            { label: 'PAUSED', color: '#f59e0b', desc: 'Temporarily stopped' },
            { label: 'CLOSED', color: '#6b7280', desc: 'Completed' },
          ].map(e => (
            <div key={e.label} className="flex-1 p-2 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)' }}>
              <span className="text-xs font-bold" style={{ color: e.color }}>{e.label}</span>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{e.desc}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={User} title="My Profile" color="#6b7280" roles={['ALMACENISTA', 'USUARIO']}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Lock size={14} style={{ color: '#ef4444' }} />
              <span className="text-xs font-semibold">Change Password</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Click the "Password" button next to your name. The new password must have at least 10 characters with uppercase, lowercase, number, and special character.
            </p>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Bell size={14} style={{ color: '#3b82f6' }} />
              <span className="text-xs font-semibold">Telegram Notifications</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Link your Telegram account to receive stock and movement alerts in real time.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Quick tips */}
      <div className="card-industrial p-5">
        <div className="flex items-center gap-3 mb-4">
          <Star size={20} style={{ color: '#f59e0b' }} />
          <h3 className="font-display font-semibold text-lg">Quick Tips</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: '🔍', title: 'Quick search', desc: 'Use the part number to find items instantly in the catalog.' },
            { icon: '📍', title: 'Physically locate', desc: 'From the warehouse, click on a level to see exactly what is there and where.' },
            { icon: '⏰', title: 'Reserve expiration', desc: 'Review your reserves every week. They expire automatically in 30 days.' },
            { icon: '📱', title: 'Active Telegram', desc: 'Link Telegram to receive important alerts without needing to be in the app.' },
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

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

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
              {esAdmin ? 'Complete Guide — Administrator' : `User Guide — ${rol}`}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {esAdmin
                ? 'Complete manual of all functions, windows, and best practices of the system.'
                : 'Guide to the functions available for your role in InventaPro.'}
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
