import { Outlet, useLocation } from "react-router-dom";
import Menu from "../menu/Menu";
import "./Layout.css";

export default function Layout() {
  const { pathname } = useLocation();
  const isLoginPage = pathname === "/login";
  const isDashboardPage = pathname === "/dashboard";
  const isHomePage = pathname === "/";

  return (
    <div className={`layout ${isLoginPage ? "layout--login" : ""} ${isDashboardPage ? "layout--dashboard" : ""}`}>
      {!isDashboardPage && <Menu />}

      <main
        id="layout-main"
        className={`layout-main${isHomePage && !isDashboardPage ? " layout-main--home-fill" : ""}`}
      >
        <div className="layout-main-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
