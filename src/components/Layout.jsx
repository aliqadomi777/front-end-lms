import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  LayoutDashboard,
  Library,
  Users,
  Settings,
  LogOut,
  Menu,
  GraduationCap,
  BarChart3,
  UserCheck,
  Bell,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

const Layout = ({
  children,
  userRole = "student",
  userName = "John Doe",
  userEmail = "john@example.com",
  showSidebar = true,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      name: "Dashboard",
      href: (role) => {
        switch (role) {
          case "student":
            return "/student/dashboard";
          case "instructor":
            return "/instructor/dashboard";
          case "admin":
            return "/admin";
          default:
            return "/dashboard";
        }
      },
      icon: LayoutDashboard,
      roles: ["student", "instructor", "admin"],
    },
    {
      name: "Course Catalog",
      href: "/courses",
      icon: Library,
      roles: ["student", "instructor", "admin"],
    },
    {
      name: "My Courses",
      href: "/my-courses",
      icon: BookOpen,
      roles: ["student", "instructor"],
    },
    {
      name: "Instructor Panel",
      href: "/instructor",
      icon: GraduationCap,
      roles: ["instructor", "admin"],
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      roles: ["instructor", "admin"],
    },
    {
      name: "User Management",
      href: "/admin/users",
      icon: Users,
      roles: ["admin"],
    },
    {
      name: "Reports",
      href: "/admin/reports",
      icon: UserCheck,
      roles: ["admin"],
    },
  ];

  const visibleItems = navigationItems.filter((item) =>
    item.roles.includes(userRole),
  );

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "instructor":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center">
                <img
                  src="/logo.png"
                  alt="learn sphere Logo"
                  className="h-12 w-12"
                />
              </div>
              <span className="text-xl font-bold text-amber-500">
                learn sphere
              </span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="global-search"
                name="globalSearch"
                type="search"
                placeholder="Search courses, instructors..."
                className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder-avatar.jpg" alt={userName} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userEmail}
                    </p>
                    <Badge
                      className={cn("w-fit mt-2", getRoleBadgeColor(userRole))}
                    >
                      {userRole}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/login")}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <aside className="w-64 border-r bg-slate-900/50 backdrop-blur-sm min-h-[calc(100vh-4rem)]">
            <nav className="flex flex-col gap-2 p-4">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const href =
                  typeof item.href === "function"
                    ? item.href(userRole)
                    : item.href;
                const isActive = location.pathname === href;
                return (
                  <Link
                    key={href}
                    to={href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
