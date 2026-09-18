import React from 'react';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  HelpCircle,
  Clock,
  UserPlus,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Award,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { currentUser, stats, templates = [] } = usePortal();

  const getNavItems = () => {
    switch (currentUser?.role) {
      case 'student':
        return [
          { id: 'dashboard', label: 'Student Dashboard', icon: LayoutDashboard, description: 'Overview & academic dossier' },
          { id: 'templates', label: 'University Documents', icon: FolderOpen, count: templates.length, description: 'Official forms & download' },
          { id: 'submissions', label: 'My Submissions & Sign', icon: ShieldCheck, description: 'Track signatures & approvals' },
        ];
      case 'supervisor':
        return [
          { id: 'dashboard', label: 'Supervisor Overview', icon: LayoutDashboard, description: 'Dashboard & stats' },
          { id: 'my_students', label: 'Supervised Students', icon: Users, description: 'Your assigned students' },
          { id: 'sign_queue', label: 'Review & Sign Queue', icon: ShieldCheck, badge: stats.pendingSupervisor > 0 ? stats.pendingSupervisor : null, description: 'Pending signatures' },
          { id: 'templates', label: 'University Forms', icon: FolderOpen, count: templates.length, description: 'Official forms' },
        ];
      case 'incharge':
        return [
          { id: 'dashboard', label: 'Incharge Dashboard', icon: LayoutDashboard, description: 'Overview & analytics' },
          { id: 'allocation', label: 'Student-Supervisor Allocation', icon: UserPlus, description: 'Assign supervisors & clearance' },
          { id: 'fully_endorsed', label: 'Fully Endorsed Students', icon: CheckCircle2, badge: stats.completed > 0 ? stats.completed : null, description: 'View cleared student dossiers' },
          { id: 'template_manager', label: 'Manage Document Repository', icon: FolderOpen, count: templates.length, description: 'Templates & forms' },
          { id: 'incharge_signatures', label: 'Incharge Endorsement Queue', icon: ShieldCheck, badge: stats.pendingIncharge > 0 ? stats.pendingIncharge : null, description: 'Sign & endorse' },
        ];
      case 'hod':
        return [
          { id: 'dashboard', label: 'HOD Overview', icon: LayoutDashboard, description: 'Profile, details & department stats' },
          { id: 'faculty_workload', label: 'Faculty Supervision Workload', icon: Award, description: 'Supervision distribution analysis' },
          { id: 'department_students', label: 'Department Roster & Filter', icon: Users, badge: stats.pendingHod > 0 ? stats.pendingHod : null, description: 'Candidate dossiers & final clearance' },
          { id: 'fully_endorsed', label: 'Fully Endorsed Students', icon: CheckCircle2, badge: stats.completed > 0 ? stats.completed : null, description: 'View cleared student dossiers' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto space-y-4">
      {/* ═══ PORTAL NAVIGATION CARD ═══ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Nav Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#001530] via-[#002147] to-[#0b3569] border-b-2 border-[#c29b38]">
          <h2 className="font-serif font-bold text-base text-white flex items-center gap-2 tracking-wide uppercase">
            <LayoutDashboard className="w-5 h-5 text-[#c29b38]" />
            Portal Navigation
          </h2>
          <p className="text-xs text-slate-300 mt-0.5 tracking-wide">COMSATS Official Dossier Management</p>
        </div>

        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(isActive ? '' : item.id)}
                className={`portal-nav-item w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group ${isActive
                    ? 'bg-gradient-to-r from-[#001530] to-[#002b5c] text-white shadow-md border border-[#c29b38]/40'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-[#002147] border border-transparent hover:border-slate-200'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-[#c29b38]/20 text-[#facc15]' : 'bg-slate-100 group-hover:bg-blue-50 text-slate-500 group-hover:text-[#002147]'
                    }`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm leading-tight">{item.label}</div>
                    <div className={`text-xs mt-0.5 ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                      {item.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {item.badge && (
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${isActive ? 'bg-[#c29b38] text-[#001530]' : 'bg-red-500 text-white shadow-sm'
                      }`}>
                      {item.badge}
                    </span>
                  )}
                  {item.count && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                      {item.count}
                    </span>
                  )}
                  {isActive
                    ? <ChevronDown className="w-4 h-4 text-[#c29b38]" />
                    : <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#002147]" />
                  }
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
