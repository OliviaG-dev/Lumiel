import { describe, expect, it } from 'vitest'
import { slugifyTitle } from '@/lib/blogPosts'

describe('slugifyTitle', () => {
  it('removes accents and lowercases', () => {
    expect(slugifyTitle('Été à Crécy')).toBe('ete-a-crecy')
  })

  it('replaces non-alphanumeric runs with single hyphen', () => {
    expect(slugifyTitle('Hello   World!!!')).toBe('hello-world')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugifyTitle('---Bonjour---')).toBe('bonjour')
  })

  it('returns article when result would be empty', () => {
    expect(slugifyTitle('!!!')).toBe('article')
    expect(slugifyTitle('')).toBe('article')
  })
})
