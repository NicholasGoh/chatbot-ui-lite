import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
const inter = Inter({ subsets: ["latin"] });
const queryClient = new QueryClient()

export default function App({ Component, pageProps }: AppProps<{}>) {
  return (
    <QueryClientProvider client={queryClient}>
      <main className={inter.className}>
        <Component {...pageProps} />
        <ReactQueryDevtools initialIsOpen={false} />
      </main>
    </QueryClientProvider>
  );
}
