import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import SideBarApp from './SideBarApp';

const rootContainer = document.getElementById("root");

if (rootContainer) {
  const root = createRoot(rootContainer);
  root.render(window.location.hash === "#side-bar" ? <SideBarApp /> : <App />);
}
