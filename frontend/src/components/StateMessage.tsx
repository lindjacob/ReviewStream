type StateMessageProps = {
  message: string
}

export function StateMessage({ message }: StateMessageProps) {
  return (
    <p className="state-message" role="status">
      {message}
    </p>
  )
}
