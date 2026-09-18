export function formatLabel(value: string): string {
  if (value === "iot") return "IoT";
  return value.charAt(0).toUpperCase() + value.slice(1);
}
