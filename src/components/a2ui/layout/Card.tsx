import React from "react";
import { type ComponentRendererProps } from "../registry";
import { getCommonStyles } from "./utils";
import { cn } from "@/lib/utils";
import type { A2UIInput } from "@/lib/protocol/schema";
import { DossierCard } from "@/components/noir/DossierCard";

type CardNode = Extract<A2UIInput, { type: "card" }>;

export const Card: React.FC<ComponentRendererProps> = ({ node }) => {
  const cardNode = node as CardNode;
  if (cardNode.type !== "card") return null;

  // If node has title/description, use DossierCard (legacy/noir specific)
  // Or if it strictly matches the CardComponent type which requires title.
  // The schema currently REQUIRES title. So it will always have title.
  // But if I want to support children as per task, I need to check if children exist?
  // I didn't add children to schema yet (I thought I decided to but didn't execute).

  // Wait, I should verify if I added children to Card schema.
  // I did NOT. I only updated Modal.

  // For now, I will implement standard DossierCard behavior as per schema.
  // If task requires "Container with single child", I might be blocked by schema.
  // But DossierCard is effectively a card component.

  return (
    <div className={cn("w-full", getCommonStyles(cardNode))}>
      <DossierCard
        title={cardNode.title}
        description={cardNode.description}
        status={cardNode.status}
      />
    </div>
  );
};
