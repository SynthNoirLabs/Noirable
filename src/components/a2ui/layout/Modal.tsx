/* eslint-disable react-hooks/static-components -- Dynamic component registry pattern */
import React, { useState, useMemo } from "react";
import { type ComponentRendererProps, getComponent } from "../registry";
import { getCommonStyles } from "./utils";
import { cn } from "@/lib/utils";
import type { A2UIInput } from "@/lib/protocol/schema";
import { createPortal } from "react-dom";

// Note: ModalInputComponent was added to schema manually
type ModalNode = Extract<A2UIInput, { type: "modal" }>;

const ModalContent: React.FC<{
  node: ModalNode;
  theme?: "noir" | "standard";
}> = ({ node, theme }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const TriggerComponent = useMemo(() => getComponent(node.trigger.type), [node.trigger.type]);
  const ContentComponent = useMemo(() => getComponent(node.content.type), [node.content.type]);

  return (
    <>
      <div onClick={openModal} className="inline-block cursor-pointer">
        <TriggerComponent node={node.trigger} theme={theme} />
      </div>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--aesthetic-background)]/80 backdrop-blur-sm p-4">
            <div
              className={cn(
                "relative bg-[var(--aesthetic-surface)] border border-[var(--aesthetic-border)]/50 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 rounded-sm",
                getCommonStyles(node)
              )}
            >
              <button
                onClick={closeModal}
                className="absolute top-2 right-2 text-[var(--aesthetic-text)]/50 hover:text-[var(--aesthetic-error)] transition-colors"
              >
                ✕
              </button>
              <ContentComponent node={node.content} theme={theme} />
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export const Modal: React.FC<ComponentRendererProps> = ({ node, theme }) => {
  const modalNode = node as ModalNode;

  if (modalNode.type !== "modal") return null;

  return <ModalContent node={modalNode} theme={theme} />;
};
