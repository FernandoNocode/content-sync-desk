import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { MemberAuthProvider } from "@/contexts/MemberAuthContext";
import { MemberProvider } from "@/contexts/MemberContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { MemberKanban } from "@/components/kanban/MemberKanban";
import DebugLocalStorage from "@/components/DebugLocalStorage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <MemberAuthProvider>
        <AppProvider>
          <MemberProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={<Index />} />
                  <Route path="/member-area" element={<MemberKanban />} />
                  <Route path="/debug" element={<DebugLocalStorage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </MemberProvider>
        </AppProvider>
      </MemberAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
