import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/libs/query";
import { Toaster } from "@/components/ui/sonner";
import { Entities } from "@/features/entities/Entities";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-screen h-screen relative overflow-hidden">
        <Entities />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
