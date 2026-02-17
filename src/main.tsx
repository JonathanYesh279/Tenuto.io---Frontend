import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DirectionProvider } from '@radix-ui/react-direction'
import { enableMapSet } from 'immer'
import App from './App.tsx'
import './index.css'

// Enable Immer MapSet plugin for Zustand stores
enableMapSet()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: (failureCount, error: unknown) => {
        if ((error as { status?: number })?.status === 404 || (error as { status?: number })?.status === 403) {
          return false
        }
        return failureCount < 3
      },
    },
  },
})

document.documentElement.setAttribute('dir', 'rtl')
document.documentElement.setAttribute('lang', 'he')

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <DirectionProvider dir="rtl">
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <App />
        </BrowserRouter>
      </DirectionProvider>
    </QueryClientProvider>
  </React.StrictMode>
)