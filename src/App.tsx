import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './page/home/HomePage'
import AboutPage from './page/about/AboutPage'
import PrestationsPage from './page/prestations/PrestationsPage'
import TemoignagesPage from './page/temoignages/TemoignagesPage'
import BlogPage from './page/blog/BlogPage'
import BlogArticlePage from './page/blog/BlogArticlePage'
import ContactFaqPage from './page/contact/ContactFaqPage'
import LoginPage from './page/login/LoginPage'
import DashboardPage from './page/dashboard/DashboardPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="a-propos" element={<AboutPage />} />
          <Route path="prestations" element={<PrestationsPage />} />
          <Route path="temoignages" element={<TemoignagesPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="blog/:slug" element={<BlogArticlePage />} />
          <Route path="contact" element={<ContactFaqPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
