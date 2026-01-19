import { DeskLayout } from '@/components/layout/DeskLayout'
import { DossierCard } from '@/components/noir/DossierCard'
import { TypewriterText } from '@/components/noir/TypewriterText'

export default function Home() {
  return (
    <DeskLayout
      editor={
        <div className="font-mono text-xs text-noir-paper/70">
          {JSON.stringify({
            type: "card",
            title: "John Doe",
            status: "active"
          }, null, 2)}
        </div>
      }
      preview={
        <div className="flex flex-col gap-8 items-center">
          <TypewriterText content="CLASSIFIED EVIDENCE" priority="critical" />
          <DossierCard 
            title="Subject: 'The Architect'" 
            description="Suspect is believed to be constructing a hybrid UI system."
            status="active"
          />
          <DossierCard 
            title="Project: GEMINI" 
            status="redacted"
          />
        </div>
      }
    />
  );
}
