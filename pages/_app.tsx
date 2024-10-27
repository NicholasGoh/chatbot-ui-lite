import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/clerk-react";

const inter = Inter({ subsets: ["latin"] });
const queryClient = new QueryClient();
const PUBLISHABLE_KEY = process.env.VITE_CLERK_PUBLISHABLE_KEY || "";

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

export default function App({ Component, pageProps }: AppProps<{}>) {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <QueryClientProvider client={queryClient}>
        <main className={inter.className}>
          <Component {...pageProps} />
          <ReactQueryDevtools initialIsOpen={false} />
        </main>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
