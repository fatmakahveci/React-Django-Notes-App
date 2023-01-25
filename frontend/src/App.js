import './App.css';
import Header from './components/Header';
import { 
  Routes,
  Route
} from "react-router-dom";
import NoteList from './pages/NoteList';
import Note from './pages/Note';

function App() {
  return (
      <div className="container dark">
        <div className="app">
          <header className="App-header">  
            <Header />
            <Routes>
              <Route path="/" element={<NoteList />} />
              <Route path="/notes/:noteId/" element={<Note />} />
            </Routes>
          </header>
        </div>
      </div>
  );
}

export default App;
