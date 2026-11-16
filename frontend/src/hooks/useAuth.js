import React from 'react'

export default function useAuth() {
  const [user, setUser] = React.useState(null)
  const [loading, setLoading] = React.useState(false)

  return { user, loading }
}