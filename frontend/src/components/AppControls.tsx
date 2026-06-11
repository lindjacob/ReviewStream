type AppControlsProps = {
  apps: string[]
  selectedAppId: string
  onSelectApp: (appId: string) => void
}

export function AppControls({
  apps,
  selectedAppId,
  onSelectApp,
}: AppControlsProps) {
  const showAppSelector = apps.length > 1

  return (
    <section className="app-controls" aria-label="App selection">
      {showAppSelector ? (
        <label className="app-selector">
          <span className="app-selector__label">App</span>
          <select
            className="app-selector__select"
            value={selectedAppId}
            onChange={(event) => onSelectApp(event.target.value)}
          >
            {apps.map((appId) => (
              <option key={appId} value={appId}>
                {appId}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="app-current" role="status">
          Viewing reviews for{' '}
          <code className="app-current__id">{apps[0]}</code>
        </p>
      )}
    </section>
  )
}
