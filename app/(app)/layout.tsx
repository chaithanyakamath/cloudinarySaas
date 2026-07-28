"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  LogOutIcon,
  MenuIcon,
  LayoutDashboardIcon,
  Share2Icon,
  UploadIcon,
  Wand2,
  Scissors,
  Type,
  Video,
  Sparkles,
  Zap,
  Palette,
} from "lucide-react";

const sidebarItems = [
  { href: "/home", icon: LayoutDashboardIcon, label: "Dashboard", badge: null },
  { href: "/video-upload", icon: UploadIcon, label: "Upload Video", badge: "Fast" },
  { href: "/ai-background", icon: Scissors, label: "AI Background", badge: "AI" },
  { href: "/ai-editor", icon: Wand2, label: "AI Photo Studio", badge: "AI" },
  { href: "/watermark", icon: Type, label: "Watermark Studio", badge: "Pro" },
  { href: "/video-studio", icon: Video, label: "Smart Video Studio", badge: "Shorts" },
  { href: "/social-share", icon: Share2Icon, label: "Social Crop", badge: null },
];

const daisyThemes = ["dark", "night", "dim", "synthwave", "black"];

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("dark");
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();

  const handleLogoClick = () => {
    router.push("/");
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const changeTheme = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute("data-theme", theme);
  };

  return (
    <div className="drawer lg:drawer-open min-h-screen bg-base-300">
      <input
        id="sidebar-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={sidebarOpen}
        onChange={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="drawer-content flex flex-col min-h-screen">
        {/* Sticky Glassmorphic Top Navbar */}
        <header className="sticky top-0 z-30 w-full glass-card border-b border-base-200/50">
          <div className="navbar max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex-none lg:hidden">
              <label
                htmlFor="sidebar-drawer"
                className="btn btn-square btn-ghost drawer-button text-primary"
              >
                <MenuIcon className="w-6 h-6" />
              </label>
            </div>

            <div className="flex-1 flex items-center gap-2">
              <Link href="/" onClick={handleLogoClick}>
                <div className="flex items-center gap-2 font-extrabold text-xl sm:text-2xl tracking-tight cursor-pointer">
                  <div className="p-2 bg-gradient-to-tr from-primary to-secondary rounded-xl text-white shadow-lg shadow-primary/20">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <span className="gradient-text-primary">Cloudinary</span>
                  <span className="hidden sm:inline-block text-base-content font-semibold text-sm px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                    AI Studio
                  </span>
                </div>
              </Link>
            </div>

            {/* Right Navbar Controls */}
            <div className="flex-none flex items-center space-x-3">
              {/* Theme Switcher Dropdown */}
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-ghost btn-circle btn-sm text-base-content">
                  <Palette className="w-5 h-5" />
                </label>
                <ul
                  tabIndex={0}
                  className="dropdown-content z-[1] menu p-2 shadow-2xl bg-base-100 rounded-box w-36 border border-base-200 mt-2"
                >
                  {daisyThemes.map((t) => (
                    <li key={t}>
                      <button
                        onClick={() => changeTheme(t)}
                        className={`capitalize text-xs font-semibold ${
                          currentTheme === t ? "text-primary font-bold" : ""
                        }`}
                      >
                        {t}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* User Avatar & Details */}
              {user && (
                <div className="flex items-center gap-3 pl-2 border-l border-base-content/10">
                  <div className="avatar">
                    <div className="w-9 h-9 rounded-full ring-2 ring-primary/40 ring-offset-base-100 ring-offset-2">
                      <img
                        src={user.imageUrl || "/avatar-placeholder.png"}
                        alt={user.username || user.firstName || "User"}
                      />
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold truncate max-w-[120px]">
                      {user.username || user.firstName || "Creator"}
                    </span>
                    <span className="text-[10px] text-base-content/60 truncate max-w-[120px]">
                      {user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || ""}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="btn btn-ghost btn-circle btn-sm text-error hover:bg-error/10"
                    title="Sign Out"
                  >
                    <LogOutIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Page Content */}
        <main className="flex-grow pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar (Visible only on screens < 1024px) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-base-100/90 backdrop-blur-lg border-t border-base-200 py-2 px-3 flex justify-around items-center">
          {sidebarItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
                  isActive ? "text-primary scale-110" : "text-base-content/60 hover:text-base-content"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop Sidebar Drawer */}
      <div className="drawer-side z-40">
        <label htmlFor="sidebar-drawer" className="drawer-overlay"></label>
        <aside className="bg-base-200/90 backdrop-blur-xl border-r border-base-300/50 w-72 h-full flex flex-col justify-between">
          <div>
            {/* Sidebar Brand Header */}
            <div className="p-6 pb-4 flex items-center gap-3 border-b border-base-300/50">
              <div className="p-2.5 bg-gradient-to-br from-primary via-indigo-600 to-secondary rounded-2xl text-white shadow-xl shadow-primary/25">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-extrabold text-lg tracking-tight gradient-text-primary">
                  Cloudinary SaaS
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[11px] font-medium text-emerald-400">AI Active Engine</span>
                </div>
              </div>
            </div>

            {/* Sidebar Menu Items */}
            <ul className="menu p-4 w-full space-y-1">
              <li className="menu-title text-[11px] font-bold text-base-content/40 uppercase tracking-wider mb-1">
                Media Modules
              </li>
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${
                        isActive
                          ? "bg-primary text-white font-bold shadow-lg shadow-primary/30"
                          : "text-base-content/80 hover:bg-base-300 hover:text-base-content"
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-primary"}`} />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isActive
                              ? "bg-white/20 text-white"
                              : item.badge === "AI"
                              ? "bg-secondary/20 text-secondary border border-secondary/30"
                              : "bg-primary/20 text-primary border border-primary/30"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* User Sign Out Card at bottom of sidebar */}
          {user && (
            <div className="p-4 border-t border-base-300/50">
              <button
                onClick={handleSignOut}
                className="btn btn-outline btn-error btn-sm w-full rounded-xl flex items-center justify-center gap-2"
              >
                <LogOutIcon className="w-4 h-4" />
                Sign Out Account
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
