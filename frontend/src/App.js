// import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap-icons/font/bootstrap-icons.css";
import 'leaflet/dist/leaflet.css';

import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import LoginSignup from "./pages/LoginSignup";
import MainMenu from "./pages/main_menu";
import CreateJournal from "./pages/CreateJournal";
import About from './pages/About';
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function App() {

  return (
    <Router>
      <Routes>
        <Route path='/' element={<LoginSignup />} />
        <Route path='/main_menu' element={<MainMenu />} />
        <Route path='/login' element={<LoginSignup />} />
        <Route path="/journal" element={<CreateJournal />} />
        <Route path="/journal/:id" element={<CreateJournal />} />
        <Route path='/about' element={<About />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
