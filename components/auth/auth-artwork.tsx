'use client'

import {
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  Database,
  FileBarChart2,
  LockKeyhole,
  Settings,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react'

const dashboardStats = [
  { label: 'Total Employees', value: '245', helper: '+12 this month' },
  { label: 'Attendance Rate', value: '96.5%', helper: '+2.4% this month' },
  { label: 'On Leave', value: '18', helper: '+3 this month' },
  { label: 'Open Positions', value: '6', helper: '+2 new' },
]

const featureCards = [
  { icon: CalendarCheck, label: 'Attendance Tracking', className: 'left-3 top-[33%]' },
  { icon: BriefcaseBusiness, label: 'Payroll Management', className: 'right-4 top-[18%]' },
  { icon: Users, label: 'Recruitment & Onboarding', className: 'left-4 bottom-[32%]' },
  { icon: FileBarChart2, label: 'Reports & Analytics', className: 'right-3 bottom-[28%]' },
]

const bottomFeatures = [
  { icon: Users, label: 'Centralized Employee Data' },
  { icon: ShieldCheck, label: 'Secure & Reliable' },
  { icon: Settings, label: 'Automate HR Processes' },
  { icon: BarChart3, label: 'Data-Driven Decisions' },
]

function MiniPerson({ side }: { side: 'left' | 'right' }) {
  const isLeft = side === 'left'

  return (
    <div
      className={`absolute bottom-[4.25rem] ${isLeft ? 'left-[18%]' : 'right-[12%]'} hidden h-24 w-16 sm:block`}
      aria-hidden="true"
    >
      <div
        className={`absolute top-0 size-7 rounded-full bg-[#183f73] shadow-sm ${isLeft ? 'left-7' : 'left-4'}`}
      />
      <div
        className={`absolute top-5 h-12 w-10 rounded-t-full bg-[linear-gradient(180deg,#2563eb,#17447c)] shadow-[0_16px_28px_rgba(30,64,175,0.2)] ${
          isLeft ? 'left-5' : 'left-3'
        }`}
      />
      <div
        className={`absolute top-[3.25rem] h-3.5 w-14 rounded-full bg-[#dbeafe] ${
          isLeft ? 'left-0 rotate-[-10deg]' : 'left-3 rotate-[10deg]'
        }`}
      />
      <div className="absolute bottom-0 left-7 h-10 w-2.5 rounded-full bg-[#1e3a5f]" />
      <div className="absolute bottom-0 left-11 h-10 w-2.5 rounded-full bg-[#315984]" />
    </div>
  )
}

export function AuthArtwork() {
  return (
    <div className="relative min-h-[30rem] overflow-hidden bg-[linear-gradient(180deg,#cfe6ff_0%,#9fc8f6_52%,#72a8e9_100%)] sm:min-h-[34rem] lg:min-h-full">
      <div className="absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(180deg,transparent,rgba(239,246,255,0.82))]" />
      <div className="absolute bottom-14 left-0 h-40 w-full opacity-45">
        <div className="absolute bottom-0 left-4 h-24 w-10 rounded-t-sm bg-white/36" />
        <div className="absolute bottom-0 left-16 h-32 w-12 rounded-t-sm bg-white/28" />
        <div className="absolute bottom-0 right-14 h-36 w-12 rounded-t-sm bg-white/30" />
        <div className="absolute bottom-0 right-2 h-24 w-10 rounded-t-sm bg-white/34" />
      </div>

      <div className="relative z-10 flex min-h-[30rem] flex-col px-5 py-6 text-slate-950 sm:min-h-[34rem] sm:px-6 lg:min-h-full">
        <div className="max-w-[17rem] xl:max-w-[18rem]">
          <h2 className="text-xl font-semibold leading-tight tracking-tight text-[#102a55] sm:text-2xl xl:text-[1.7rem]">
            Smart HR Management for a Better Workplace
          </h2>
          <p className="mt-3 max-w-[15.5rem] text-xs leading-5 text-[#17365f]/82">
            Streamline your HR processes, empower your team, and build a better workplace with one HRM solution.
          </p>
        </div>

        <div className="relative mt-4 flex flex-1 items-center justify-center pb-[5.5rem] pt-5 sm:pb-24">
          <div className="absolute left-[8%] top-[7%] h-[68%] w-[84%] rounded-full border border-dashed border-white/70" />

          {featureCards.map(({ icon: Icon, label, className }) => (
            <div
              key={label}
              className={`absolute ${className} hidden max-w-[7.5rem] items-center gap-2 rounded-xl border border-white/75 bg-white/88 px-2.5 py-2 text-[9px] font-semibold text-[#17365f] shadow-[0_16px_38px_rgba(30,64,175,0.16)] backdrop-blur-xl sm:flex`}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Icon className="size-3.5" />
              </span>
              <span className="leading-tight">{label}</span>
            </div>
          ))}

          <div className="relative w-[82%] max-w-[23.5rem] rounded-2xl border border-white/80 bg-white/88 p-3.5 shadow-[0_26px_70px_rgba(30,64,175,0.2)] backdrop-blur-2xl xl:max-w-[25rem]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#102a55]">HRM Dashboard</p>
                <p className="text-[10px] text-slate-400">Workforce overview</p>
              </div>
              <div className="flex gap-1">
                <span className="size-1.5 rounded-full bg-slate-300" />
                <span className="size-1.5 rounded-full bg-slate-300" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {dashboardStats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-slate-100 bg-blue-50/70 p-2">
                  <p className="text-[8px] font-semibold text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-sm font-bold text-blue-700">{stat.value}</p>
                  <p className="text-[8px] text-emerald-600">{stat.helper}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-xl border border-slate-100 bg-white p-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-slate-600">Monthly Attendance</p>
                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[8px] font-semibold text-white">96.5%</span>
                </div>
                <div className="mt-3 flex h-16 items-end gap-2">
                  {[48, 74, 78, 76, 68, 78, 90].map((height, index) => (
                    <div key={index} className="flex flex-1 items-end">
                      <div
                        className="w-full rounded-t bg-[linear-gradient(180deg,#5b8ff0,#2f6fd6)]"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-7 text-center text-[7px] text-slate-400">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((month) => (
                    <span key={month}>{month}</span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-2.5">
                <p className="text-[10px] font-semibold text-slate-600">Department Overview</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="relative size-16 rounded-full bg-[conic-gradient(#2f6fd6_0_32%,#56b6f7_32%_54%,#7b5ce1_54%_76%,#d75bd7_76%_100%)]">
                    <div className="absolute inset-4 rounded-full bg-white" />
                  </div>
                  <div className="space-y-1 text-[8px] text-slate-500">
                    {['Engineering', 'Marketing', 'Sales', 'HR', 'Others'].map((item, index) => (
                      <div key={item} className="flex items-center gap-1">
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: ['#2f6fd6', '#56b6f7', '#7b5ce1', '#d75bd7', '#94a3b8'][index] }}
                        />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-white p-2.5">
                <p className="text-[10px] font-semibold text-slate-600">Upcoming Birthdays</p>
                <div className="mt-3 space-y-2">
                  {['Aanya Mehta', 'Neha Sharma'].map((name) => (
                    <div key={name} className="flex items-center justify-between text-[8px] text-slate-500">
                      <span className="flex items-center gap-2">
                        <span className="size-5 rounded-full bg-blue-100" />
                        {name}
                      </span>
                      <span>May 24</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-2.5">
                <p className="text-[10px] font-semibold text-slate-600">Recent Activities</p>
                <div className="mt-3 space-y-2 text-[8px] text-slate-500">
                  {['John Doe applied for leave', 'Payroll approved', 'New employee joined'].map((item) => (
                    <p key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="size-3 text-blue-600" />
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <MiniPerson side="left" />
          <MiniPerson side="right" />
        </div>

        <div className="absolute inset-x-7 bottom-5 rounded-2xl border border-white/70 bg-white/42 px-3 py-3 shadow-[0_22px_55px_rgba(30,64,175,0.22)] backdrop-blur-2xl">
          <div className="grid grid-cols-4 gap-2">
            {bottomFeatures.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 text-center text-[8px] font-medium text-[#17365f] sm:text-[10px]">
                <span className="flex size-8 items-center justify-center rounded-full bg-white/72 text-blue-600 shadow-sm">
                  <Icon className="size-4" />
                </span>
                <span className="leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-[7.5rem] left-5 hidden sm:block" aria-hidden="true">
          <div className="h-20 w-1.5 rounded-full bg-emerald-500/70" />
          <div className="absolute bottom-8 left-1 h-8 w-4 -rotate-45 rounded-full bg-emerald-300/80" />
          <div className="absolute bottom-10 right-1 h-9 w-5 rotate-45 rounded-full bg-emerald-400/80" />
          <div className="mt-1 h-8 w-9 rounded-b-xl bg-white/70" />
        </div>

        <div className="absolute left-[19%] bottom-[6.6rem] hidden h-5 w-40 rounded-full bg-[#5f8fca]/25 blur-sm sm:block" />
        <div className="absolute right-[9%] bottom-[6.6rem] hidden h-5 w-36 rounded-full bg-[#5f8fca]/25 blur-sm sm:block" />

        <div className="pointer-events-none absolute left-6 bottom-[32%] hidden items-center gap-1 rounded-xl border border-white/75 bg-white/90 px-3 py-2 shadow-[0_16px_36px_rgba(30,64,175,0.15)] sm:flex">
          <div className="flex gap-0.5 text-amber-400">
            {[0, 1, 2, 3, 4].map((star) => (
              <Star key={star} className="size-3 fill-current" />
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute right-7 bottom-[34%] hidden size-12 items-center justify-center rounded-xl border border-white/75 bg-white/90 text-blue-600 shadow-[0_16px_36px_rgba(30,64,175,0.15)] sm:flex">
          <Database className="size-5" />
        </div>

        <div className="pointer-events-none absolute right-[19%] bottom-[11.5rem] hidden size-10 items-center justify-center rounded-xl border border-white/75 bg-white/82 text-blue-600 shadow-sm sm:flex">
          <LockKeyhole className="size-4" />
        </div>
      </div>
    </div>
  )
}
