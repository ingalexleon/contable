import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CreditCard,
  BarChart3,
  Settings,
  UserCog,
  Calculator,
} from 'lucide-react'

interface SidebarProps {
  collapsed?: boolean
  onNavigate?: () => void
}

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/', adminOnly: false },
  { label: 'Clientes', icon: Users, path: '/clientes', adminOnly: false },
  { label: 'Servicios', icon: Briefcase, path: '/servicios', adminOnly: false },
  { label: 'Pagos', icon: CreditCard, path: '/pagos', adminOnly: false },
  { label: 'Reportes', icon: BarChart3, path: '/reportes', adminOnly: false },
  { label: 'Usuarios', icon: UserCog, path: '/usuarios', adminOnly: true },
  { label: 'Configuracion', icon: Settings, path: '/configuracion', adminOnly: true },
]

export default function Sidebar({ collapsed = false, onNavigate }: SidebarProps) {
  const location = useLocation()
  const { isAdmin } = useAuth()

  const filteredNav = navItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <div className="flex flex-col h-full">
      <div className={cn("flex items-center gap-2 px-4 py-6", collapsed && "justify-center")}>
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Calculator className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-lg">Contable</span>
        )}
      </div>
      <nav className="flex-1 px-2 space-y-1">
        {filteredNav.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed && "justify-center"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
