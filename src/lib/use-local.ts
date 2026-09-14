import { useEffect, useState } from 'react'
export function useLocal<T>(key:string, initial:T) {
  const [value,setValue] = useState<T>(initial)
  useEffect(() => { const saved=localStorage.getItem(key); if(saved) try { setValue(JSON.parse(saved) as T) } catch {} },[key])
  useEffect(() => { localStorage.setItem(key,JSON.stringify(value)) },[key,value])
  return [value,setValue] as const
}
