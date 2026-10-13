import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import AccountLayout from './components/account/AccountLayout'
import RequireAuth from './components/account/RequireAuth'
import { useAuth } from './context/AuthContext'
import HomePage from './pages/HomePage'
import LoggedHome from './pages/LoggedHome'
import SearchPage from './pages/SearchPage'
import ArticleDetailPage from './pages/ArticleDetail'
import RevistasPage from './pages/RevistasPage'
import AreasPage from './pages/AreasPage'
import SobrePage from './pages/SobrePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HistoryPage from './pages/HistoryPage'
import SavedPage from './pages/SavedPage'
import AlertsPage from './pages/AlertsPage'
import ProfilePage from './pages/ProfilePage'

// Entrar e Cadastrar ocupam a tela inteira, sem cabecalho nem rodape
const BARE_ROUTES = ['/entrar', '/cadastrar']

// Logado, o Inicio vira o painel do usuario
function Home() {
  const { user } = useAuth()
  return user ? <LoggedHome /> : <HomePage />
}

export default function App() {
  const { pathname } = useLocation()
  const bare = BARE_ROUTES.includes(pathname)

  return (
    <div className="min-h-screen flex flex-col">
      {!bare && <Header />}
      <div className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/artigos" element={<SearchPage />} />
          <Route path="/article/:id" element={<ArticleDetailPage />} />
          <Route path="/revistas" element={<RevistasPage />} />
          <Route path="/areas" element={<AreasPage />} />
          <Route path="/sobre" element={<SobrePage />} />
          <Route path="/entrar" element={<LoginPage />} />
          <Route path="/cadastrar" element={<RegisterPage />} />
          <Route
            path="/conta"
            element={
              <RequireAuth>
                <LoggedHome />
              </RequireAuth>
            }
          />
          <Route
            element={
              <RequireAuth>
                <AccountLayout />
              </RequireAuth>
            }
          >
            <Route path="/conta/historico" element={<HistoryPage />} />
            <Route path="/conta/salvos" element={<SavedPage />} />
            <Route path="/conta/alertas" element={<AlertsPage />} />
            <Route path="/conta/perfil" element={<ProfilePage />} />
          </Route>
        </Routes>
      </div>
      {!bare && <Footer />}
    </div>
  )
}
