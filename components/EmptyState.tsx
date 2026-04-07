// components/EmptyState.tsx
// Reusable empty state component

import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("bg-muted/50", className)}>
      <CardHeader className="text-center">
        {icon || <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />}
        <CardTitle className="mt-4">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {action && (
        <CardContent className="text-center">
          <Button onClick={action.onClick}>{action.label}</Button>
        </CardContent>
      )}
    </Card>
  );
}

export default EmptyState;
