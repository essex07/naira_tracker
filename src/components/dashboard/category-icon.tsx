import {
  Bus,
  CreditCard,
  LayoutGrid,
  PiggyBank,
  Shapes,
  ShieldCheck,
  ShoppingBasket,
} from "lucide-react";

import type { CategoryKey } from "@/lib/types";

const ICONS = {
  survival: ShieldCheck,
  transport: Bus,
  food: ShoppingBasket,
  debt: CreditCard,
  savings: PiggyBank,
  others: LayoutGrid,
  miscellaneous: Shapes,
} as const;

export function CategoryIcon({
  category,
  className,
}: {
  category: CategoryKey;
  className?: string;
}) {
  const Icon = ICONS[category];
  return <Icon className={className} aria-hidden="true" />;
}
