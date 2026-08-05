"use client"

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react"

import type {
  R2Memory,
  R2MemoryContext,
} from "./r2-memory-types"

import {
  addR2Memory,
  createR2Memory,
} from "./r2-memory-engine"

import {
  loadR2Memory,
  saveR2Memory,
} from "./r2-memory-storage"



type R2MemoryProviderProps = {
  children: ReactNode
  userId: string
}



type R2MemoryContextValue = {

  memory:
    R2MemoryContext

  remember:
    (
      category: R2Memory["category"],
      content: string
    ) => void

}



const R2MemoryContext =
  createContext<
    R2MemoryContextValue | null
  >(null)



export function R2MemoryProvider({
  children,
  userId,
}: R2MemoryProviderProps) {


  const [memory,setMemory] =
    useState<R2MemoryContext>(
      () => loadR2Memory(userId)
    )



  function remember(
    category: R2Memory["category"],
    content: string
  ) {


    const newMemory =
      createR2Memory(
        category,
        content
      )


    setMemory(
      current => {

        const updated =
          addR2Memory(
            current,
            newMemory
          )


        saveR2Memory(
          updated
        )


        return updated

      }
    )

  }



  return (

    <R2MemoryContext.Provider
      value={{
        memory,
        remember,
      }}
    >

      {children}

    </R2MemoryContext.Provider>

  )

}



export function useR2Memory() {

  const context =
    useContext(
      R2MemoryContext
    )


  if (!context) {

    throw new Error(
      "useR2Memory precisa estar dentro do R2MemoryProvider"
    )

  }


  return context

}