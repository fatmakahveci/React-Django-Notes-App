import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useContext } from "react";
import "./App.css";

import { AuthProvider } from "./context/AuthContext";
import AuthContext from "./context/AuthContext";

import Landing from "./pages/Landing";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Note from "./pages/Note";
import NoteList from "./pages/NoteList";
import PageNotFound from "./utils/PageNotFound";
import Register from "./pages/Register";

function PrivateRoute() {
	const { authTokens } = useContext(AuthContext);
	return authTokens?.access ? <Outlet /> : <Navigate to="/login" replace />;
}

function AppRoutes() {
	return (
		<Routes>
			{/* Public */}
			<Route path="/" element={<Landing />} />
			<Route path="/login" element={<Login />} />
			<Route path="/register" element={<Register />} />

			{/* Protected layout route */}
			<Route element={<PrivateRoute />}>
				<Route element={<Layout />}>
					<Route path="/notes" element={<NoteList />} />
					<Route
						path="/notes/new"
						element={<Note key="new" isNew />}
					/>
					<Route
						path="/notes/:noteId"
						element={<Note key="edit" />}
					/>
				</Route>
			</Route>

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
