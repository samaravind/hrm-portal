  "use client"

  import { useEffect, useState } from "react"
  import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
  import { Input } from "@/components/ui/input"
  import { Button } from "@/components/ui/button"
  import { getPasswordStrength } from "@/lib/password"

  type EmployeeFormProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
  }

  export default function EmployeeForm({
    open,
    onOpenChange,
  }: EmployeeFormProps) {
    const [passwordError, setPasswordError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
      fullName: "",
      email: "",
      password: "",
      phone: "",
      dob: "",
      address: "",
    })

    useEffect(() => {
      if (!open) {
        setPasswordError(null)
      }
    }, [open])

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      if (e.target.name === "password") {
        setPasswordError(null)
      }
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      })
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
      setFormData({
        ...formData,
        phone: digits,
      })
    }

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      const strength = getPasswordStrength(formData.password)
      if (!strength.isStrong) {
        setPasswordError("Password is weak. Use uppercase, lowercase, numbers, and symbols.")
        return
      }

      console.log(formData)

      // later connect convex here

      onOpenChange(false)
    }

    const passwordStrength = getPasswordStrength(formData.password)

    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-[450px] sm:w-[540px] overflow-y-auto border-l border-neutral-900 bg-black text-white"
        >
          <SheetHeader>
            <SheetTitle className="text-4xl font-bold">
              Add New Employee
            </SheetTitle>

            <p className="text-neutral-400 mt-3">
              Enter the employee details below to add
              them to the system.
            </p>
          </SheetHeader>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6"
          >
            {/* Full Name */}
            <div>
              <label className="text-sm font-semibold tracking-widest uppercase">
                Full Name
              </label>

              <Input
                name="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                className="mt-2 h-14 rounded-2xl border-neutral-800 bg-neutral-950 text-white"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-semibold tracking-widest uppercase">
                Email Address
              </label>

              <Input
                type="email"
                name="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                className="mt-2 h-14 rounded-2xl border-neutral-800 bg-neutral-950 text-white placeholder:text-neutral-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-semibold tracking-widest uppercase">
                Password
              </label>

              <Input
                type="password"
                name="password"
                placeholder="********"
                value={formData.password}
                onChange={handleChange}
                className="mt-2 h-14 rounded-2xl"
              />

              <div className="mt-2 space-y-2">
                <div className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${passwordStrength.isStrong ? 'bg-emerald-950 text-emerald-700' : 'bg-amber-950 text-amber-700'}`}>
                  {passwordStrength.label} password
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-neutral-900">
                  
                  <div
                    className={`h-full rounded-full transition-all ${passwordStrength.isStrong ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.max((passwordStrength.score / passwordStrength.total) * 100, formData.password ? 18 : 0)}%` }}
                  />
                </div>
                <ul className="grid gap-1 text-[11px] text-neutral-400">
                  {passwordStrength.criteria.map((criterion) => (
                    <li key={criterion.label} className={`flex items-center gap-2 ${criterion.met ? 'text-emerald-600' : ''}`}>
                      <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${criterion.met ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-900 text-neutral-500'}`}>
                        {criterion.met ? '+' : '-'}
                      </span>
                      {criterion.label}
                    </li>
                  ))}
                </ul>
                <p className={`text-[11px] font-medium ${passwordStrength.isStrong ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {passwordStrength.message}
                </p>
              </div>
              {passwordError && (
                <p className="mt-1 text-[11px] text-rose-500">{passwordError}</p>
              )}
            </div>

            {/* Phone + DOB */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold tracking-widest uppercase">
                  Phone Number
                </label>

              <Input
                name="phone"
                placeholder="Enter 10-digit number"
                value={formData.phone}
                onChange={handlePhoneChange}
                inputMode="numeric"
                maxLength={10}
                className="mt-2 h-14 rounded-2xl"
              />
            </div>

              <div>
                <label className="text-sm font-semibold tracking-widest uppercase">
                  Date Of Birth
                </label>

                <Input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="mt-2 h-14 rounded-2xl"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-sm font-semibold tracking-widest uppercase">
                Home Address
              </label>

              <Input
                name="address"
                placeholder="Enter address"
                value={formData.address}
                onChange={handleChange}
                className="mt-2 h-14 rounded-2xl"
              />
            </div>

            {/* Button */}
            <Button
              type="submit"
              className="w-full h-14 rounded-2xl text-lg bg-white text-black hover:bg-neutral-200"
            >
              Add Employee
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    )
  }
