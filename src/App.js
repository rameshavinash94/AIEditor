import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Header from "./Header";
import HeroSection from "./HeroSection";
import FeaturesSection from "./FeaturesSection";
import HowItWorksSection from "./HowItWorksSection";
import SummarySection from "./SummarySection";
import Footer from "./Footer";
import EditorPage from "./EditorPage";

const HomePage = () => {
  return (
    <>
    <Header />
      {/* <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SummarySection />
      <Footer /> */}
    </>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/editor" element={<EditorPage />} />
      </Routes>
    </Router>
  );
};

export default App;