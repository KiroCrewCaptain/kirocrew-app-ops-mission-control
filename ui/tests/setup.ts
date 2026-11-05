import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { bindAppApi } from '../src/appApi'
import { resetStubSdk, useAppApi } from './stubs/app-sdk'

// The page root binds the host's scoped client before the first request
// (`index.tsx`); a test that renders a panel directly gets the same binding here.
beforeEach(() => {
  bindAppApi(useAppApi())
})

afterEach(() => {
  cleanup()
  resetStubSdk()
})
