import './App.css'
import { AppControls } from './components/AppControls'
import { AppHeader } from './components/AppHeader'
import { ReviewList } from './components/ReviewList'
import { StateMessage } from './components/StateMessage'
import { StatePanel } from './components/StatePanel'
import { useApps } from './hooks/useApps'
import { useReviews } from './hooks/useReviews'

function App() {
  const { appsLoad, selectedAppId, setSelectedAppId, retry: retryApps } =
    useApps()
  const { reviewsLoad, retry: retryReviews } = useReviews(selectedAppId)

  const appsReady = appsLoad.status === 'ready' ? appsLoad.apps : []

  return (
    <div className="app">
      <AppHeader />

      {appsLoad.status === 'loading' ? (
        <StateMessage message="Loading apps..." />
      ) : null}

      {appsLoad.status === 'error' ? (
        <StatePanel
          variant="error"
          role="alert"
          message={appsLoad.message}
          onRetry={retryApps}
        />
      ) : null}

      {appsLoad.status === 'empty' ? (
        <StatePanel message="No apps are configured. Add an app on the backend to see reviews." />
      ) : null}

      {appsLoad.status === 'ready' && selectedAppId !== null ? (
        <>
          <AppControls
            apps={appsReady}
            selectedAppId={selectedAppId}
            onSelectApp={setSelectedAppId}
          />
          <ReviewList reviewsLoad={reviewsLoad} onRetry={retryReviews} />
        </>
      ) : null}
    </div>
  )
}

export default App
