import { useCallback, useEffect, useState } from 'react';
import PaneContainer from './PaneContainer';
import SideBar from './SideBar';
import AddPaneDialog from './AddPaneDialog';
import { useLayout } from './useLayout';

const App: React.FC = () => {
  const layout = useLayout();
  // undefined while the dialog is closed. null opens it without a preselected account.
  const [addPaneSessionId, setAddPaneSessionId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    return window.decktron.on("open-add-pane-dialog", setAddPaneSessionId);
  }, []);

  const openAddPaneDialog = useCallback(() => setAddPaneSessionId(null), []);
  const closeAddPaneDialog = useCallback(() => setAddPaneSessionId(undefined), []);

  return (
    <div className="app">
      <SideBar sessions={layout.sessions} onAddPane={openAddPaneDialog} />
      <PaneContainer layout={layout} onAddPane={openAddPaneDialog} />
      {addPaneSessionId !== undefined && (
        <AddPaneDialog
          sessions={layout.sessions}
          initialSessionId={addPaneSessionId}
          onClose={closeAddPaneDialog} />
      )}
    </div>
  )
}

export default App;
