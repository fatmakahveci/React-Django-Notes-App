import { Link as WouterLink, Redirect, useLocation, useParams, useRoute } from "wouter";

export const Link = WouterLink;

export const NavLink = ({ to, className, ...props }) => {
	const [isActive] = useRoute(to);
	const resolvedClassName =
		typeof className === "function" ? className({ isActive }) : className;
	return <WouterLink to={to} className={resolvedClassName} {...props} />;
};

export const Navigate = ({ to, replace = false }) => (
	<Redirect to={to} replace={replace} />
);

export const useNavigate = () => {
	const [, navigate] = useLocation();
	return (to, options = {}) => navigate(to, options);
};

export { useParams };
