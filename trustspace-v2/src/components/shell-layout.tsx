"use client";

import { AppSidebar } from "./app-sidebar";
import { Bell, MessageCircle, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ShellLayoutProps {
  children: React.ReactNode;
}

export function ShellLayout({ children }: ShellLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <AppSidebar />
      <div className="flex-1 ml-72">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {/* Breadcrumb placeholder */}
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <MessageCircle className="w-5 h-5 text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full relative">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <span className="text-sm font-medium text-gray-700">Omer Faruk Yildiz</span>
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gray-200 text-gray-600 text-sm">OY</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
