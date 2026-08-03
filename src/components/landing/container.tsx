import { cn } from '@/lib/utils';
import React from 'react'

export const Container = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={cn("max-w-3xl m-auto", className)}>{children}</div>;
};