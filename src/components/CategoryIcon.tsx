import React from 'react';
import {
  Utensils,
  Car,
  Home,
  Gamepad2,
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  TrendingUp,
  MoreHorizontal,
  Briefcase,
  Award,
  LineChart,
  Laptop,
  PiggyBank,
  Banknote,
  CreditCard,
  Smartphone,
  Building2,
  LucideProps,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  Utensils,
  Car,
  Home,
  Gamepad2,
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  TrendingUp,
  MoreHorizontal,
  Briefcase,
  Award,
  LineChart,
  Laptop,
  PiggyBank,
  Banknote,
  CreditCard,
  Smartphone,
  Building2,
};

interface Props extends LucideProps {
  name: string;
}

export const CategoryIcon: React.FC<Props> = ({ name, ...props }) => {
  const IconComponent = iconMap[name] || MoreHorizontal;
  return <IconComponent {...props} />;
};
