import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import ProjectGenerator from "./components/ProjectGenerator/ProjectGenerator";
import ClientOnboarding from "./components/ClientOnboarding/ClientOnboarding";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="shell">
        <header className="app-header">
          <div className="brand">
            <span className="logo-dot" aria-hidden />
            <h1>DPW Project Initializer</h1>
          </div>
          <nav className="app-nav">
            <NavLink
              to="/"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              Project Generator
            </NavLink>
            <NavLink
              to="/onboarding"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              Client Onboarding
            </NavLink>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<ProjectGenerator />} />
          <Route path="/onboarding" element={<ClientOnboarding />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
