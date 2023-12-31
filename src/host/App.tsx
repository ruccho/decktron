import * as ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import PaneContainer from './PaneContainer';
import Header from './Header';

const App: React.FC = () => {
  return (
    <div className="app">
      <PaneContainer />
    </div>
  )
}

document.body.innerHTML = `<div id="root"></div>`;

const rootContainer = document.getElementById("root");

if (rootContainer) {
  const root = createRoot(rootContainer);
  root.render(<App />);
}