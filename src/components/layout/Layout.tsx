import { Outlet } from "react-router-dom";
import Menu from "../menu/Menu";
import "./Layout.css";

export default function Layout() {
  return (
    <div className="layout">
      <Menu />

      <main className="layout-main">
        <div className="layout-main-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
