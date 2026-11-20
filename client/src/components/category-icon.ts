import {
  Aperture,
  Camera,
  Film,
  Gamepad,
  Headphones,
  Laptop,
  Package,
  Plane,
  type LucideIcon,
} from 'lucide-react'

/** One Lucide icon per category slug. Lucide has no drone, so Drones use `plane`. */
const icons: Record<string, LucideIcon> = {
  cameras: Camera,
  lenses: Aperture,
  drones: Plane,
  audio: Headphones,
  projectors: Film,
  laptops: Laptop,
  'gaming-consoles': Gamepad,
}

/** The icon for a category, or a package for a category added later. */
export function categoryIcon(slug: string | undefined): LucideIcon {
  return (slug && icons[slug]) || Package
}
