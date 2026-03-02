import { Navigate, Route, Routes } from "react-router-dom";
import { useContext } from "react";
import "./App.css";

import { AuthProvider } from "./context/AuthContext";
import AuthContext from "./context/AuthContext";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Note from "./pages/Note";
import NoteList from "./pages/NoteList";
import PageNotFound from "./utils/PageNotFound";
import Register from "./pages/Register";

function PrivateRoute({ children }) {
	const { authTokens } = useContext(AuthContext);
	return authTokens?.access ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
	return (
		<Routes>
			{/* Public */}
			<Route path="/" element={<Landing />} />
			<Route path="/login" element={<Login />} />
			<Route path="/register" element={<Register />} />

			{/* Private app under /notes */}
			<Route
				path="/notes"
				element={
					<PrivateRoute>
						<Layout />
					</PrivateRoute>
				}
			>
				<Route index element={<NoteList />} />
				<Route path="new" element={<Note />} />
				<Route path=":noteId" element={<Note />} />
			</Route>

			{/* Convenience redirect */}
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
