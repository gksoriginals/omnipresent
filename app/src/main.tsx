import { createRoot } from "react-dom/client";
import ReplayTrial from "./ReplayTrial";
import { AudienceView } from "./AudienceView";
import App from "./App";
import "./style.css";

const params = new URLSearchParams(location.search);
createRoot(document.getElementById("root")!).render(
  params.has("trial") ? <ReplayTrial /> : params.has("audience") ? <AudienceView /> : <App />
);
