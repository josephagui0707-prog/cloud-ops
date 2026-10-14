import { awsServices } from '../data/awsServices';
import { motion, type TargetAndTransition, type Variants } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';

/* ---------- Formato monetario ---------- */

export const usd = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

/* ---------- Variantes de animación reutilizables ---------- */

export const pageVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
  },

  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const staggerContainer: Variants = {
  hidden: {},

  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },

  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const cardHover: TargetAndTransition = {
  y: -4,
  transition: {
    duration: 0.2,
    ease: 'easeOut',
  },
};

export const tapScale: TargetAndTransition = {
  scale: 0.97,
};
/* ---------- Wrapper de página ---------- */
type PageProps = {
  children: ReactNode;
};

export const Page = ({
  children,
}: PageProps) => (
  <motion.div
    variants={pageVariants}
    initial="hidden"
    animate="show"
  >
    {children}
  </motion.div>
);

/* ---------- Título reutilizable ---------- */

type TitleProps = {
  t: string;
  s: string;
  tag?: string;
};

export const Title = ({
  t,
  s,
  tag = 'AWS CLOUD',
}: TitleProps) => (
  <motion.div
    className="page-heading"
    variants={staggerItem}
  >
    <div>
      <span className="page-kicker">
        {tag}
      </span>

      <h1>{t}</h1>

      <p>{s}</p>
    </div>

    <div className="page-heading-badge">
      <span />
      Entorno simulado
    </div>
  </motion.div>
);
/* ---------- Card reutilizable ---------- */

type CardProps = {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  variants?: Variants;
  style?: CSSProperties;
};

export const Card = ({
  children,
  className = '',
  hoverable = false,
  variants,
  style,
}: CardProps) => (
  <motion.div
    className={`card ${className}`}
    variants={variants ?? staggerItem}
    whileHover={
      hoverable
        ? cardHover
        : undefined
    }
    style={style}
  >
    {children}
  </motion.div>
);
/* ---------- Servicios AWS ---------- */
export const services = awsServices;