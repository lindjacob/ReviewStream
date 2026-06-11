type StatePanelProps = {
  message: string
  variant?: 'default' | 'error'
  role?: 'alert' | 'status'
  onRetry?: () => void
}

export function StatePanel({
  message,
  variant = 'default',
  role = 'status',
  onRetry,
}: StatePanelProps) {
  const className =
    variant === 'error'
      ? 'state-panel state-panel--error'
      : 'state-panel'

  return (
    <div className={className} role={role}>
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="button" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  )
}
