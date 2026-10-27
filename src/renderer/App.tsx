import PaneContainer from './PaneContainer';
import { useLayout } from './useLayout';

const App: React.FC = () => {
  const layout = useLayout();

  return (
    <div className="app">
      <PaneContainer layout={layout} />
    </div>
  )
}

export default App;
