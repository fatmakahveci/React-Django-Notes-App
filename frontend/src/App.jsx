import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";

import { AuthProvider } from "./context/AuthContext";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Layout from "./components/Layout";
import Note from "./pages/Note";
import NoteList from "./pages/NoteList";
import PageNotFound from "./utils/PageNotFound";

import PrivateRoute from "./components/PrivateRoute";

function AppRoutes() {
	return (
		<Routes>
			{/* Public */}
			<Route path="/" element={<Landing />} />
			<Route path="/login" element={<Login />} />
			<Route path="/register" element={<Register />} />

			{/* Protected */}
			<Route element={<PrivateRoute />}>
				<Route element={<Layout />}>
					<Route path="/notes" element={<NoteList />} />
					<Route path="/notes/new" element={<Note />} />
					<Route path="/notes/:noteId" element={<Note />} />
				</Route>
			</Route>

			{/* Convenience */}
			<Route path="/app" element={<Navigate to="/notes" replace />} />

			{/* 404 */}
			<Route path="*" element={<PageNotFound />} />
		</Routes>
	);
}

export default function App() {
	return (
		<AuthProvider>
			<AppRoutes />
		</AuthProvider>
	);
}
