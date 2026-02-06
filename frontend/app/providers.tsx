"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Web3Provider } from "@/lib/web3/providers";
import { NexusProvider } from "@/lib/avail/NexusProvider";
import { useState } from "react";

// Import RainbowKit styles
import '@rainbow-me/rainbowkit/styles.css';

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <Web3Provider>
                <NexusProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="dark"
                        enableSystem
                        disableTransitionOnChange
                    >
                        {children}
                    </ThemeProvider>
                </NexusProvider>
            </Web3Provider>
        </QueryClientProvider>
    );
}
