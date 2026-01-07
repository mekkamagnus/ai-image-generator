// src/test-utils/test-helpers.tsx
import { render, type RenderOptions } from '@testing-library/react'
import { type JSX } from 'react'
import type { GenerationStatus } from '@/hooks/useImageGeneration'

/**
 * Custom render with providers (if needed in the future)
 * For now, this is a simple wrapper around React Testing Library's render
 */
export function renderWithProviders(
  ui: JSX.Element,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // In the future, add providers like Context, Theme, etc. here
  return render(ui, options)
}

/**
 * Wait for a specific status in useImageGeneration hook
 * This is useful for testing async state changes
 */
export async function waitForStatus(
  getStatus: () => GenerationStatus,
  expectedStatus: GenerationStatus,
  timeout: number = 5000
): Promise<boolean> {
  const startTime = Date.now()

  return new Promise((resolve) => {
    const checkStatus = () => {
      if (getStatus() === expectedStatus) {
        resolve(true)
        return
      }

      if (Date.now() - startTime > timeout) {
        resolve(false)
        return
      }

      // Check again in 100ms
      setTimeout(checkStatus, 100)
    }

    checkStatus()
  })
}

/**
 * Wait for an error to be set
 */
export async function waitForError(
  getError: () => { code: string } | null,
  timeout: number = 5000
): Promise<boolean> {
  const startTime = Date.now()

  return new Promise((resolve) => {
    const checkError = () => {
      if (getError() !== null) {
        resolve(true)
        return
      }

      if (Date.now() - startTime > timeout) {
        resolve(false)
        return
      }

      // Check again in 100ms
      setTimeout(checkError, 100)
    }

    checkError()
  })
}

/**
 * Wait for an image URL to be set
 */
export async function waitForImage(
  getImageUrl: () => string | null,
  timeout: number = 5000
): Promise<boolean> {
  const startTime = Date.now()

  return new Promise((resolve) => {
    const checkImage = () => {
      if (getImageUrl() !== null) {
        resolve(true)
        return
      }

      if (Date.now() - startTime > timeout) {
        resolve(false)
        return
      }

      // Check again in 100ms
      setTimeout(checkImage, 100)
    }

    checkImage()
  })
}
