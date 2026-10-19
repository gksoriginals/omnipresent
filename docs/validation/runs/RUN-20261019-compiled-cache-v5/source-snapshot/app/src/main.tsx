import { createRoot } from "react-dom/client";
import ReplayTrial from "./ReplayTrial";
import App from "./App";
import "./style.css";

createRoot(document.getElementById("root")!).render(new URLSearchParams(location.search).has("trial") ? <ReplayTrial /> : <App />);
