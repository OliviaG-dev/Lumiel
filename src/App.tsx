import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import HomePage from '@/page/home/HomePage'
import AboutPage from '@/page/about/AboutPage'
import PrestationsPage from '@/page/prestations/PrestationsPage'
import TemoignagesPage from '@/page/temoignages/TemoignagesPage'
import ContactFaqPage from '@/page/contact/ContactFaqPage'
import ConfidentialitePage from '@/page/confidentialite/ConfidentialitePage'
import LoginPage from '@/page/login/LoginPage'

const BlogPage = lazy(() => import('@/page/blog/BlogPage'))
const BlogArticlePage = lazy(() => import('@/page/blog/BlogArticlePage'))
const DashboardPage = lazy(() => import('@/page/dashboard/DashboardPage'))

function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--lumiel-text-soft)',
        fontFamily: 'var(--lumiel-heading)',
      }}
    >
      Chargement...
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="a-propos" element={<AboutPage />} />
            <Route path="prestations" element={<PrestationsPage />} />
            <Route path="temoignages" element={<TemoignagesPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="blog/:slug" element={<BlogArticlePage />} />
            <Route path="contact" element={<ContactFaqPage />} />
            <Route path="confidentialite" element={<ConfidentialitePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
