import React from 'react';
import {
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle2,
  Users,
  ShieldCheck,
  UserCheck,
  X
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';

export default function StudentFilterBar({ showSupervisorSelect = true }) {
  const {
    submissionFilter,
    setSubmissionFilter,
    searchQuery,
    setSearchQuery,
    selectedSupervisorFilter,
    setSelectedSupervisorFilter,
    supervisors,
    stats
  } = usePortal();

  const filterOptions = [
    {
      id: 'all',
      label: 'All Students',
      icon: Users,
      color: 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50',
      activeColor: 'bg-cui-navy text-white border-cui-navy',
    },
    {
      id: 'pending_submission',
      label: 'Pending Document Submission',
      icon: AlertCircle,
      color: 'border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100',
      activeColor: 'bg-amber-600 text-white border-amber-600 shadow-sm',
      badge: 'Action Required',
    },
    {
      id: 'pending_supervisor',
      label: 'Pending Supervisor Review',
      icon: Clock,
      color: 'border-sky-300 text-sky-900 bg-sky-50 hover:bg-sky-100',
      activeColor: 'bg-sky-600 text-white border-sky-600 shadow-sm',
    },
    {
      id: 'pending_incharge',
      label: 'Pending Incharge Endorsement',
      icon: UserCheck,
      color: 'border-indigo-300 text-indigo-900 bg-indigo-50 hover:bg-indigo-100',
      activeColor: 'bg-indigo-600 text-white border-indigo-600 shadow-sm',
    },
    {
      id: 'pending_hod',
      label: 'Pending HOD Approval',
      icon: ShieldCheck,
      color: 'border-purple-300 text-purple-900 bg-purple-50 hover:bg-purple-100',
      activeColor: 'bg-purple-700 text-white border-purple-700 shadow-sm',
    },
    {
      id: 'completed',
      label: 'Completed & Endorsed',
      icon: CheckCircle2,
      color: 'border-emerald-300 text-emerald-900 bg-emerald-50 hover:bg-emerald-100',
      activeColor: 'bg-emerald-700 text-white border-emerald-700 shadow-sm',
    },
    {
      id: 'supervisor_endorsed',
      label: 'Supervisor Endorsed',
      icon: CheckCircle2,
      color: 'border-teal-300 text-teal-900 bg-teal-50 hover:bg-teal-100',
      activeColor: 'bg-teal-700 text-white border-teal-700 shadow-sm',
    }
  ];

  const hasActiveFilters = submissionFilter !== 'all' || searchQuery !== '' || selectedSupervisorFilter !== 'all';

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-sis-card space-y-3">
      {/* Top Search & Filter Bar Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            id="student-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, roll no, company..."
            aria-label="Search students by name, registration number, or company"
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-cui-navy text-slate-800 bg-slate-50/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Filter controls row */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {showSupervisorSelect && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 w-full md:w-auto min-w-0">
              <span className="font-semibold text-slate-500 whitespace-nowrap">Supervisor:</span>
              <select
                value={selectedSupervisorFilter}
                onChange={(e) => setSelectedSupervisorFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-cui-navy flex-1 md:w-56 md:flex-none min-w-0"
              >
                <option value="all">All Supervisors</option>
                {supervisors.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name} ({sup.regNo})
                  </option>
                ))}
              </select>
            </div>
          )}

          {hasActiveFilters && (
            <button
              onClick={() => {
                setSubmissionFilter('all');
                setSearchQuery('');
                setSelectedSupervisorFilter('all');
              }}
              className="px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 font-semibold border border-red-200 hover:bg-red-50 rounded transition-colors whitespace-nowrap"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Category / Status Filter Pills */}
      <div>
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5" aria-hidden="true">
          <Filter className="w-3.5 h-3.5 text-cui-navy" aria-hidden="true" />
          <span>Filter by Submission &amp; Clearance Status:</span>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter students by submission and clearance status">
          {filterOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = submissionFilter === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSubmissionFilter(opt.id)}
                aria-pressed={isSelected}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${isSelected ? opt.activeColor : opt.color}`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{opt.label}</span>
                {opt.badge && !isSelected && (
                  <span className="text-[9px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter" aria-hidden="true">
                    {opt.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
