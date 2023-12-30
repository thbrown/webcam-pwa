import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";

// Assuming your HTML file has a div with an id of 'root'
const container = document.getElementById("app");

// Create a root.
const root = ReactDOM.createRoot(container);

// Initial render: Render the <App /> into the root.
root.render(<App />);
