import type { Translations } from './en'

/** Estonian UI text. A missing or extra key is a type error. */
export const et: Translations = {
  nav: {
    home: 'Avaleht',
    catalogue: 'Kataloog',
    rentals: 'Minu laenutused',
  },
  layout: {
    mainNav: 'Peamenüü',
    mobileNav: 'Mobiilimenüü',
    footerNav: 'Jaluse lingid',
    breadcrumb: 'Navigeerimisrada',
    openMenu: 'Ava menüü',
    closeMenu: 'Sulge',
    logIn: 'Logi sisse',
    tagline:
      'Laenuta kaameraid, droone, sülearvuteid ja muud — päevade kaupa ning pikemaks ajaks soodsamalt.',
    usefulLinks: 'Kasulikud lingid',
    copyright: '© {{year}} Prokat Hub',
  },
  language: {
    label: 'Keel',
  },
  home: {
    title: 'Laenuta kaameraid, droone, sülearvuteid ja muud',
    lead: 'Vali kuupäevad, vaata hinda koos pikema laenutuse soodustusega ja broneeri minutiga.',
    browse: 'Sirvi kataloogi',
    apiStatus: {
      checking: 'Kontrollin API-t aadressil',
      online: 'API töötab aadressil',
      offline: 'API ei vasta aadressil',
    },
    apiUnreachable: 'API-ga ei saa ühendust',
  },
  catalogue: {
    title: 'Kataloog',
    placeholder: 'Otsing, filtrid ja lehekülgedeks jagamine tulevad ülesandes #26.',
  },
  login: {
    title: 'Logi sisse',
    placeholder: 'Sisselogimine ja registreerimine tulevad ülesandes #23.',
  },
  rentals: {
    title: 'Minu laenutused',
    placeholder: 'Siin kuvatakse sinu broneeringud (#30).',
  },
  notFound: {
    title: 'Lehte ei leitud',
    description: 'Otsitud lehte ei ole olemas.',
    backHome: 'Tagasi avalehele',
  },
  error: {
    title: 'Midagi läks valesti',
    unknown: 'Tundmatu viga',
    backHome: 'Tagasi avalehele',
  },
  errors: {
    unauthorized: 'Jätkamiseks logi sisse.',
    forbidden: 'Sul pole selleks õigust.',
    conflict: 'Need kuupäevad kattuvad teise broneeringuga. Vali teised kuupäevad.',
    validation: 'Mõni väli on vigane. Kontrolli vormi ja proovi uuesti.',
    network: 'Serveriga ei saa ühendust. Proovi hiljem uuesti.',
    unknown: 'Midagi läks valesti. Proovi uuesti.',
  },
}
