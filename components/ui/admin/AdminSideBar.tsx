const menuItems = [
  "Dashboard",
  "Employees",
  "Attendance",
  "Reports",
  "Settings",
];

export default function AdminSidebar() {
  return (
    <div className="w-64 h-screen border-r p-4">
      <h2 className="text-xl font-bold mb-4">
        Admin Panel
      </h2>

      {menuItems.map((item) => (
        <div
          key={item}
          className="p-2 cursor-pointer hover:bg-gray-100"
        >
          {item}
        </div>
      ))}
    </div>
  );
}