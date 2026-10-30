import SideBar from './SideBar';
import { useLayout } from './useLayout';

// The content of the side bar view, which is shown over the pane views.
const SideBarApp: React.FC = () => {
  const layout = useLayout();

  return (
    <div className="app">
      <SideBar sessions={layout.sessions} onAddPane={() => window.decktron.send("open-add-pane-dialog")} />
    </div>
  )
}

export default SideBarApp;
