import { createRoot } from "react-dom/client";
import { App } from "./app/App.tsx"; // <── Cukup tambahkan kurung kurawal { } di sini!
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(<App />);
