import "./globals.css";
import { AppSidebar } from "@/components/ui/app-sidebar";
// Import AppHeader with corrected path - updated to match actual component location in project structure
import { AppHeader } from "@/components/ui/app-header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="flex h-screen overflow-hidden">
          
          {/* Sidebar */}
          <AppSidebar />

          {/* Right Side */}
          <div className="flex flex-1 flex-col">
            
            {/* Header */}
            <AppHeader />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
              {children}
            </main>

          </div>
        </div>
      </body>
    </html>
  );
}