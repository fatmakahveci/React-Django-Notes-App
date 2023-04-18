import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";

import { AuthProvider } from "./context/AuthContext";

import Header from "./components/Header";
import PageNotFound from "./utils/PageNotFound";

import Note from "./pages/Note";
import NoteList from "./pages/NoteList";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="container root">
      <div className="app">
        <header className="App-header">
          <AuthProvider>
            <Header setIsLoggedIn={setIsLoggedIn} />
            <Routes>
              <Route path="*" element={<PageNotFound />} />
              <Route exact path="/" element={<Home />} />
              <Route exact path="/register" element={<Register />} />
              {isLoggedIn ? (
                <>
                  <Route exact path="/notes/" element={<NoteList />} />
                  <Route path="/notes/:noteId/" element={<Note />} />
                </>
              ) : (
                <>
                  <Route
                    path="/login"
                    element={<Login setIsLoggedIn={setIsLoggedIn} />}
                  />
                </>
              )}
            </Routes>
          </AuthProvider>
        </header>
      </div>
    </div>
  );
}

export default App;
