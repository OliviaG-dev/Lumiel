import { Outlet } from 'react-router-dom'
import Menu from '../menu/Menu'
import './Layout.css'

export default function Layout() {
  return (
    <div className="layout">
      <Menu />

      <main className="layout-main">
        <div className="layout-main-bg">
          <span className="layout-orb layout-orb--1" aria-hidden />
          <span className="layout-orb layout-orb--2" aria-hidden />
          <span className="layout-orb layout-orb--3" aria-hidden />
          <span className="layout-orb layout-orb--4" aria-hidden />
          <span className="layout-orb layout-orb--5" aria-hidden />
          <span className="layout-orb layout-orb--6" aria-hidden />
          <span className="layout-orb layout-orb--7" aria-hidden />
          <span className="layout-orb layout-orb--8" aria-hidden />
          <span className="layout-orb layout-orb--9" aria-hidden />
          <span className="layout-orb layout-orb--10" aria-hidden />
        </div>
        <div className="layout-main-content">
          <Outlet />
        </div>
      </main>

    </div>
  )
}
