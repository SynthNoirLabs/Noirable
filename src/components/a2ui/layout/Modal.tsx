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

  // eslint-disable-next-line react-hooks/static-components
  const TriggerComponent = useMemo(() => getComponent(node.trigger.type), [node.trigger.type]);
  // eslint-disable-next-line react-hooks/static-components
  const ContentComponent = useMemo(() => getComponent(node.content.type), [node.content.type]);

  return (
    <>
      <div onClick={openModal} className="inline-block cursor-pointer">
        {/* eslint-disable-next-line react-hooks/static-components */}
        <TriggerComponent node={node.trigger} theme={theme} />
      </div>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-noir-black/80 backdrop-blur-sm p-4">
            <div
              className={cn(
                "relative bg-noir-dark border border-noir-gray/50 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 rounded-sm",
                getCommonStyles(node)
              )}
            >
              <button
                onClick={closeModal}
                className="absolute top-2 right-2 text-noir-paper/50 hover:text-noir-red transition-colors"
              >
                ✕
              </button>
              {/* eslint-disable-next-line react-hooks/static-components */}
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
