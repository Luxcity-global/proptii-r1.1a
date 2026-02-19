"use client"

import { useState, useRef, useEffect } from "react"
import {
  Search,
  Home,
  CalendarCheck,
  FileCheck,
  FileSignature,
  Building2,
  Users,
  BarChart3,
  Shield,
  ChevronDown,
  Sparkles,
} from "lucide-react"

type Mode = "search" | "list"

interface MenuItem {
  icon: React.ReactNode
  label: string
  description: string
}

const searchMenuItems: MenuItem[] = [
  {
    icon: <Search className="h-4 w-4" />,
    label: "Search Properties",
    description: "AI-powered property search across multiple platforms",
  },
  {
    icon: <CalendarCheck className="h-4 w-4" />,
    label: "Book Viewings",
    description: "Schedule and manage property viewings instantly",
  },
  {
    icon: <FileCheck className="h-4 w-4" />,
    label: "Referencing",
    description: "Complete tenant referencing online, hassle-free",
  },
  {
    icon: <FileSignature className="h-4 w-4" />,
    label: "Sign Contracts",
    description: "Digital contract signing, legally binding",
  },
]

const listMenuItems: MenuItem[] = [
  {
    icon: <Building2 className="h-4 w-4" />,
    label: "List Property",
    description: "Advertise your property to verified tenants",
  },
  {
    icon: <Users className="h-4 w-4" />,
    label: "Manage Tenants",
    description: "Tenant communication and management tools",
  },
  {
    icon: <BarChart3 className="h-4 w-4" />,
    label: "Analytics",
    description: "Track listing performance and enquiries",
  },
  {
    icon: <Shield className="h-4 w-4" />,
    label: "Verify Tenants",
    description: "Run background and credit checks securely",
  },
]

export function HeroToggle() {
  const [activeMode, setActiveMode] = useState<Mode>("search")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLDivElement>(null)

  const menuItems = activeMode === "search" ? searchMenuItems : listMenuItems

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        toggleRef.current &&
        !toggleRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleModeSwitch(mode: Mode) {
    if (mode === activeMode) {
      setIsDropdownOpen(!isDropdownOpen)
    } else {
      setActiveMode(mode)
      setIsDropdownOpen(true)
    }
  }

  return (
    <div className="relative inline-flex flex-col items-center">
      {/* Toggle Pill Container */}
      <div ref={toggleRef} className="relative">
        {/* Outer glow */}
        <div
          className="absolute -inset-1 rounded-full opacity-40 blur-lg transition-all duration-700"
          style={{
            background:
              activeMode === "search"
                ? "linear-gradient(135deg, #E8713A 0%, #D4622F 100%)"
                : "linear-gradient(135deg, #E8D5B0 0%, #D4C4A0 100%)",
          }}
        />

        {/* Glass container */}
        <div
          className="relative flex items-stretch rounded-full border border-white/[0.12] p-1"
          style={{
            background: "rgba(255, 255, 255, 0.06)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            boxShadow:
              "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Search / Renters Button */}
          <button
            onClick={() => handleModeSwitch("search")}
            className="group relative flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-500 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            style={
              activeMode === "search"
                ? {
                    background:
                      "linear-gradient(135deg, #E8713A 0%, #D4622F 80%, #C45520 100%)",
                    color: "#FFFFFF",
                    boxShadow:
                      "0 4px 16px rgba(232, 113, 58, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -2px 4px rgba(0, 0, 0, 0.1)",
                    transform: "translateY(-1px)",
                  }
                : {
                    background: "transparent",
                    color: "rgba(255, 255, 255, 0.55)",
                  }
            }
            aria-pressed={activeMode === "search"}
          >
            <Home
              className="h-4 w-4 transition-transform duration-300 group-hover:scale-110"
              strokeWidth={2.5}
            />
            <span className="whitespace-nowrap tracking-wide">
              Search Properties Free
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-all duration-300 ${
                activeMode === "search" && isDropdownOpen
                  ? "rotate-180 opacity-100"
                  : activeMode === "search"
                    ? "rotate-0 opacity-70"
                    : "rotate-0 opacity-0"
              }`}
              strokeWidth={2.5}
            />
            {/* Shine overlay */}
            {activeMode === "search" && (
              <div
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%)",
                }}
              />
            )}
          </button>

          {/* Divider */}
          <div className="my-2.5 w-px bg-white/10" />

          {/* List / Landlords Button */}
          <button
            onClick={() => handleModeSwitch("list")}
            className="group relative flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-500 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            style={
              activeMode === "list"
                ? {
                    background:
                      "linear-gradient(135deg, #F5E6CC 0%, #E8D5B0 80%, #DBC8A0 100%)",
                    color: "#3D2E1A",
                    boxShadow:
                      "0 4px 16px rgba(232, 213, 176, 0.35), 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -2px 4px rgba(0, 0, 0, 0.05)",
                    transform: "translateY(-1px)",
                  }
                : {
                    background: "transparent",
                    color: "rgba(255, 255, 255, 0.55)",
                  }
            }
            aria-pressed={activeMode === "list"}
          >
            <Building2
              className="h-4 w-4 transition-transform duration-300 group-hover:scale-110"
              strokeWidth={2.5}
            />
            <span className="whitespace-nowrap tracking-wide">
              {"List & Manage Properties"}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-all duration-300 ${
                activeMode === "list" && isDropdownOpen
                  ? "rotate-180 opacity-100"
                  : activeMode === "list"
                    ? "rotate-0 opacity-70"
                    : "rotate-0 opacity-0"
              }`}
              strokeWidth={2.5}
            />
            {/* Shine overlay */}
            {activeMode === "list" && (
              <div
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)",
                }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Contextual Dropdown */}
      <div
        ref={dropdownRef}
        className="absolute top-full z-50 mt-3 w-[420px] overflow-hidden transition-all duration-400 ease-out"
        style={{
          opacity: isDropdownOpen ? 1 : 0,
          transform: isDropdownOpen
            ? "translateY(0) scale(1)"
            : "translateY(-8px) scale(0.97)",
          pointerEvents: isDropdownOpen ? "auto" : "none",
        }}
      >
        {/* Dropdown glass container */}
        <div
          className="relative overflow-hidden rounded-2xl border border-white/[0.1]"
          style={{
            background: "rgba(15, 15, 20, 0.75)",
            backdropFilter: "blur(40px) saturate(200%)",
            WebkitBackdropFilter: "blur(40px) saturate(200%)",
            boxShadow:
              "0 24px 48px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
          }}
        >
          {/* Top accent bar */}
          <div
            className="h-[2px] w-full transition-all duration-700"
            style={{
              background:
                activeMode === "search"
                  ? "linear-gradient(90deg, transparent, #E8713A, transparent)"
                  : "linear-gradient(90deg, transparent, #E8D5B0, transparent)",
            }}
          />

          {/* Header */}
          <div className="flex items-center gap-2 px-5 pt-4 pb-2">
            <Sparkles
              className="h-3.5 w-3.5 transition-colors duration-500"
              style={{
                color:
                  activeMode === "search"
                    ? "#E8713A"
                    : "#D4C090",
              }}
            />
            <p
              className="text-xs font-medium uppercase tracking-widest transition-colors duration-500"
              style={{
                color:
                  activeMode === "search"
                    ? "rgba(232, 113, 58, 0.8)"
                    : "rgba(212, 192, 144, 0.8)",
              }}
            >
              {activeMode === "search"
                ? "For Renters & Buyers"
                : "For Landlords & Agents"}
            </p>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {menuItems.map((item, index) => (
              <button
                key={`${activeMode}-${index}`}
                className="group relative flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition-all duration-200"
                style={{
                  background:
                    hoveredItem === index
                      ? activeMode === "search"
                        ? "rgba(232, 113, 58, 0.1)"
                        : "rgba(232, 213, 176, 0.08)"
                      : "transparent",
                }}
                onMouseEnter={() => setHoveredItem(index)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Icon container */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300"
                  style={{
                    borderColor:
                      hoveredItem === index
                        ? activeMode === "search"
                          ? "rgba(232, 113, 58, 0.3)"
                          : "rgba(232, 213, 176, 0.2)"
                        : "rgba(255, 255, 255, 0.08)",
                    background:
                      hoveredItem === index
                        ? activeMode === "search"
                          ? "rgba(232, 113, 58, 0.15)"
                          : "rgba(232, 213, 176, 0.1)"
                        : "rgba(255, 255, 255, 0.04)",
                    color:
                      hoveredItem === index
                        ? activeMode === "search"
                          ? "#E8713A"
                          : "#E8D5B0"
                        : "rgba(255, 255, 255, 0.5)",
                    boxShadow:
                      hoveredItem === index
                        ? activeMode === "search"
                          ? "0 0 20px rgba(232, 113, 58, 0.15)"
                          : "0 0 20px rgba(232, 213, 176, 0.1)"
                        : "none",
                  }}
                >
                  {item.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium transition-colors duration-200"
                    style={{
                      color:
                        hoveredItem === index
                          ? "rgba(255, 255, 255, 0.95)"
                          : "rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    {item.label}
                  </p>
                  <p
                    className="mt-0.5 text-xs leading-relaxed transition-colors duration-200"
                    style={{
                      color:
                        hoveredItem === index
                          ? "rgba(255, 255, 255, 0.5)"
                          : "rgba(255, 255, 255, 0.35)",
                    }}
                  >
                    {item.description}
                  </p>
                </div>

                {/* Arrow indicator */}
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300"
                  style={{
                    opacity: hoveredItem === index ? 1 : 0,
                    transform:
                      hoveredItem === index
                        ? "translateX(0)"
                        : "translateX(-4px)",
                    background:
                      activeMode === "search"
                        ? "rgba(232, 113, 58, 0.2)"
                        : "rgba(232, 213, 176, 0.12)",
                    color:
                      activeMode === "search"
                        ? "#E8713A"
                        : "#E8D5B0",
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4.5 2.5L8 6L4.5 9.5" />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="border-t border-white/[0.06] px-5 py-3.5">
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold tracking-wide uppercase transition-all duration-300"
              style={{
                background:
                  activeMode === "search"
                    ? "rgba(232, 113, 58, 0.12)"
                    : "rgba(232, 213, 176, 0.08)",
                color:
                  activeMode === "search"
                    ? "#E8713A"
                    : "#E8D5B0",
                border:
                  activeMode === "search"
                    ? "1px solid rgba(232, 113, 58, 0.2)"
                    : "1px solid rgba(232, 213, 176, 0.12)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  activeMode === "search"
                    ? "rgba(232, 113, 58, 0.2)"
                    : "rgba(232, 213, 176, 0.15)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  activeMode === "search"
                    ? "rgba(232, 113, 58, 0.12)"
                    : "rgba(232, 213, 176, 0.08)"
              }}
            >
              {activeMode === "search"
                ? "Get Started Free"
                : "Start Listing Today"}
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 3L10 7L5 11" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
