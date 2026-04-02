import { Routes, Route } from 'react-router-dom'
import SearchPage from './pages/SearchPage'
import ArticleDetail from './pages/ArticleDetail'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="/article/:id" element={<ArticleDetail />} />
    </Routes>
  )
}
