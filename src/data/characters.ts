import type { CharacterDef, CharId } from '../game/types'

export const CHARACTERS: Record<CharId, CharacterDef> = {
  haneul: {
    id: 'haneul',
    name: '정하늘',
    age: 22,
    role: '소꿉친구 · 상시 핵심 인물',
    image: 'characters/c01_haneul.png',
    preference: { personality: 0.5, popularity: 0.5 },
    initial: { h: 35, t: 70 },
  },
  seorin: {
    id: 'seorin',
    name: '강서린',
    age: 23,
    role: '센 누나 · 첫 시즌 주요 게스트',
    image: 'characters/c02_seorin.png',
    preference: { personality: 1 },
  },
  seoyun: {
    id: 'seoyun',
    name: '한서윤',
    age: 21,
    role: '교양 수업 옆자리 · 선택 인물',
    image: 'characters/c03_seoyun.png',
    preference: { personality: 1 },
  },
}

export const CHAR_IDS: CharId[] = ['haneul', 'seorin', 'seoyun']

export const PORTRAITS = {
  haneul: 'characters/c01_haneul.png',
  haneulSmile: 'characters/c01_haneul_smile.png',
  haneulPout: 'characters/c01_haneul_pout.png',
  seorin: 'characters/c02_seorin.png',
  seoyun: 'characters/c03_seoyun.png',
} as const
