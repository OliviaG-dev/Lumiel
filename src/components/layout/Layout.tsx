import { Outlet, useLocation } from "react-router-dom";
import Menu from "../menu/Menu";
import "./Layout.css";

export default function Layout() {
  const { pathname } = useLocation();
  const isLoginPage = pathname === "/login";

  return (
    <div className={`layout ${isLoginPage ? "layout--login" : ""}`}>
      <Menu />

      <main className="layout-main">
        <div className="layout-main-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
