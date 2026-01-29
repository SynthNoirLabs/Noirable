# AI Fine-Tuning Proposal for synthNoirUI

> Design document for training custom models on A2UI generation patterns

## Executive Summary

This proposal outlines a strategy for fine-tuning language models to improve A2UI JSON generation quality, consistency, and adherence to the noir aesthetic theme.

---

## Problem Statement

Current challenges with generic LLMs generating A2UI:

1. **Schema Compliance**: Models sometimes generate invalid JSON or use non-existent component types
2. **Aesthetic Inconsistency**: Noir theme styling varies between generations
3. **Context Loss**: Long conversations lose sight of the A2UI protocol constraints
4. **Verbose Output**: Models often generate unnecessary explanations alongside JSON

---

## Proposed Solution

### Phase 1: Data Collection Pipeline

#### 1.1 Training Data Sources

| Source | Description | Volume Target |
|--------|-------------|---------------|
| **Prompt History** | User prompts + successful A2UI outputs | 1,000+ pairs |
| **Template Library** | Curated high-quality templates | 50+ examples |
| **Manual Curation** | Expert-crafted prompt/output pairs | 200+ pairs |
| **Synthetic Generation** | GPT-4 generated variations | 500+ pairs |

#### 1.2 Data Schema

```typescript
interface TrainingExample {
  id: string;
  prompt: string;                    // User's natural language request
  output: A2UIInput;                 // Valid A2UI JSON
  metadata: {
    category: "form" | "dashboard" | "card" | "layout" | "data";
    complexity: "simple" | "moderate" | "complex";
    components_used: string[];       // List of component types
    created_at: number;
    quality_score?: number;          // 1-5 human rating
  };
}
```

#### 1.3 Collection Implementation

```typescript
// Add to useA2UIStore.ts
interface TrainingData {
  examples: TrainingExample[];
  addExample: (prompt: string, output: A2UIInput, metadata: Partial<TrainingExample["metadata"]>) => void;
  exportDataset: () => string;       // JSONL export
}

// Hook into successful generations
const handleSuccessfulGeneration = (prompt: string, output: A2UIInput) => {
  if (isValidA2UI(output)) {
    addExample(prompt, output, {
      category: inferCategory(output),
      complexity: inferComplexity(output),
      components_used: extractComponentTypes(output),
    });
  }
};
```

### Phase 2: Data Quality Pipeline

#### 2.1 Validation Steps

1. **Schema Validation**: Zod parse against `a2uiInputSchema`
2. **Render Test**: Attempt to render in A2UIRenderer
3. **Completeness Check**: Verify all required fields present
4. **Aesthetic Score**: Manual review for noir theme adherence

#### 2.2 Filtering Criteria

```typescript
interface QualityFilter {
  minComponentCount: 2;              // Reject trivial examples
  maxComponentCount: 50;             // Reject overly complex
  requiresValidRender: true;         // Must render without errors
  minQualityScore: 3;                // Human rating threshold
  noEmptyContent: true;              // Reject empty text/labels
}
```

### Phase 3: Fine-Tuning Strategy

#### 3.1 Model Selection

| Model | Use Case | Cost |
|-------|----------|------|
| **GPT-4o-mini (fine-tuned)** | Primary production model | ~$0.01/1K tokens |
| **Claude Haiku (if available)** | Alternative provider | TBD |
| **Llama 3.1 8B (self-hosted)** | Cost-sensitive / offline | Infrastructure |

#### 3.2 Training Configuration

```json
{
  "model": "gpt-4o-mini-2024-07-18",
  "training_file": "file-abc123",
  "hyperparameters": {
    "n_epochs": 3,
    "batch_size": 8,
    "learning_rate_multiplier": 1.5
  },
  "suffix": "synthnoirui-v1"
}
```

#### 3.3 Prompt Template (System Message)

```
You are synthNoirUI, a noir-themed UI generation assistant. 

RULES:
1. Output ONLY valid A2UI JSON - no explanations, no markdown
2. Use ONLY these component types: text, card, container, row, column, grid, heading, paragraph, callout, badge, divider, list, table, stat, tabs, image, input, textarea, select, checkbox, button
3. Maintain noir aesthetic: dark themes, amber accents, typewriter fonts, detective terminology
4. Keep responses concise and structured
5. For images, use the "prompt" field with noir-themed descriptions

STYLE GUIDELINES:
- Use "CASE FILE", "DOSSIER", "EVIDENCE" in headings
- Status values: "active", "archived", "missing", "redacted"
- Priority values: "low", "normal", "high", "critical"
```

### Phase 4: Evaluation Framework

#### 4.1 Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Schema Compliance** | >99% | Zod validation pass rate |
| **Render Success** | >98% | A2UIRenderer error rate |
| **Theme Consistency** | >90% | Human evaluation sample |
| **Response Time** | <2s | P95 latency |
| **Token Efficiency** | -30% | Avg tokens vs base model |

#### 4.2 A/B Testing

```typescript
interface ABTestConfig {
  control: "gpt-4o";                 // Base model
  treatment: "gpt-4o-mini-synthnoirui-v1";  // Fine-tuned
  traffic_split: 0.5;                // 50/50 split
  metrics: ["schema_compliance", "user_rating", "render_success"];
  duration_days: 14;
}
```

### Phase 5: Deployment

#### 5.1 Integration Points

1. **Model Registry**: Add fine-tuned model to `model-registry.ts`
2. **Provider Factory**: Route to fine-tuned model when available
3. **Fallback Chain**: Base model → Fine-tuned → Error handling

#### 5.2 Configuration

```typescript
// src/lib/ai/model-registry.ts
{
  id: "synthnoirui-v1",
  provider: "openai",
  modelId: "ft:gpt-4o-mini-2024-07-18:org::synthnoirui-v1",
  name: "synthNoirUI Custom",
  contextWindow: 128000,
  supportsImages: false,
  supportsTools: true,
  isFineTuned: true,
}
```

---

## Implementation Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Phase 1**: Data Collection | 2 weeks | 1,500+ training examples |
| **Phase 2**: Quality Pipeline | 1 week | Validated dataset |
| **Phase 3**: Fine-Tuning | 1 week | Trained model |
| **Phase 4**: Evaluation | 2 weeks | A/B test results |
| **Phase 5**: Deployment | 1 week | Production rollout |

**Total: ~7 weeks**

---

## Cost Estimate

| Item | One-Time | Monthly |
|------|----------|---------|
| Training (OpenAI) | ~$50-100 | - |
| Evaluation inference | ~$20 | - |
| Production inference | - | ~$50-200 (usage dependent) |
| Human annotation (optional) | ~$200 | - |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Model drift | Medium | Regular evaluation, version pinning |
| Training data bias | High | Diverse prompt collection, augmentation |
| API cost overrun | Medium | Usage monitoring, rate limits |
| Schema evolution | Medium | Versioned training data, retraining pipeline |

---

## Success Criteria

1. Fine-tuned model achieves >99% schema compliance
2. User preference rate >70% vs base model in blind test
3. Average response length reduced by >25%
4. No increase in error rate vs base model

---

## Future Enhancements

1. **Multi-turn fine-tuning**: Train on conversation context for better "update" commands
2. **Style transfer**: Train variants for different aesthetic themes
3. **Component-specific models**: Specialized models for forms, dashboards, etc.
4. **Self-improving loop**: Automatic retraining on high-rated generations

---

*Last updated: 2026-01-29*
