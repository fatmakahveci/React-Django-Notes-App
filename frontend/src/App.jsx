import { Redirect, Route, Switch } from "wouter";
import "./App.css";

import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Note from "./pages/Note";
import NoteList from "./pages/NoteList";
import Register from "./pages/Register";
import PageNotFound from "./utils/PageNotFound";

const ProtectedPage = ({ children }) => (
	<PrivateRoute>
		<Layout>{children}</Layout>
	</PrivateRoute>
);

function AppRoutes() {
	return (
		<Switch>
			<Route path="/" component={Landing} />
			<Route path="/login" component={Login} />
			<Route path="/register" component={Register} />
			<Route path="/notes">
				<ProtectedPage><NoteList /></ProtectedPage>
			</Route>
			<Route path="/notes/new">
				<ProtectedPage><Note /></ProtectedPage>
			</Route>
			<Route path="/notes/:noteId">
				<ProtectedPage><Note /></ProtectedPage>
			</Route>
			<Route path="/app"><Redirect to="/notes" replace /></Route>
			<Route><PageNotFound /></Route>
		</Switch>
	);
}

export default function App() {
	return <AuthProvider><AppRoutes /></AuthProvider>;
}
