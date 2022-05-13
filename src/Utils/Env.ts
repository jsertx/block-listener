export const getEnv = (name: string, defValue?: string): string => {
  const value = process.env[name] || defValue
  if (typeof value === 'undefined') {
    throw new Error(`[ENV] variable "${name}" not found`)
  }

  return value
}
