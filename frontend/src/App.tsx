import { Routes, Route } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import SearchPage from './pages/SearchPage'
import ArticleDetailPage from './pages/ArticleDetail'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/article/:id" element={<ArticleDetailPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}
