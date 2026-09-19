import { Car, Cpu, Building, Circle } from "lucide-react";

export const typeStyles: Record<string, { icon: typeof Car; bg: string; text: string }> = {
  vehicle: { icon: Car, bg: "bg-blue-500", text: "text-white" },
  iot: { icon: Cpu, bg: "bg-purple-500", text: "text-white" },
  facility: { icon: Building, bg: "bg-green-500", text: "text-white" },
  other: { icon: Circle, bg: "bg-gray-500", text: "text-white" },
};

export const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-500",
  maintenance: "bg-amber-100 text-amber-700",
};

export const statusDot: Record<string, string> = {
  active: "bg-green-500",
  inactive: "bg-red-500",
  maintenance: "bg-amber-500",
};
