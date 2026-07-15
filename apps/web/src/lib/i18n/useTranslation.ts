"use client"

import { useContext } from "react"
import { TranslationContext } from "./TranslationProvider"

export function useTranslation() {
  return useContext(TranslationContext)
}
