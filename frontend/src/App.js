import './App.css';

import { 
  Routes,
  Route
} from "react-router-dom";
import PrivateRoute from './utils/PrivateRoute';

import Header from './components/Header';
import Note from './pages/Note';
import NoteList from './pages/NoteList';
import LoginPage from './pages/LoginPage';

function App() {
  return (
      <div className="container dark">
        <div className="app">
          <header className="App-header">  
            <Header />
            <Routes>
              <Route element={<PrivateRoute />}>
                <Route path="/" element={<NoteList />} exact />
                <Route path="/notes/" element={<NoteList />} />
                <Route path="/notes/:noteId/" element={<Note />} />
              </Route>
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </header>
        </div>
      </div>
  );
}

export default App;
