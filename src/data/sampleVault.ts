import { KnowledgeNote, Flashcard } from '../types';

export const INITIAL_NOTES: KnowledgeNote[] = [
  {
    id: 'note-second-brain',
    title: 'Second Brain & Knowledge Systems',
    folder: 'Knowledge Systems',
    tags: ['pkm', 'productivity', 'cognition', 'workflows'],
    status: 'evergreen',
    pinned: true,
    favorite: true,
    createdAt: '2026-08-10T10:00:00.000Z',
    updatedAt: '2026-09-02T14:30:00.000Z',
    summary: 'A methodology for externalizing memory, cultivating connected thinking, and synthesizing raw information into actionable creative output.',
    content: `# Second Brain & Knowledge Systems

A **Second Brain** is an external, dynamic digital repository where ideas, observations, and research interlink to augment biological memory.

Rather than treating digital notes as static archives (a digital graveyard), a mature knowledge system treats them as an associative network.

## Core Pillars
1. **Externalization**: Offloading high-dimensional storage from working memory to free cognitive bandwidth for synthesis.
2. **Associative Topology**: Connecting ideas across disparate disciplines via [[Bi-directional Linking]] rather than rigid hierarchical folders.
3. **Atomic Distillation**: Deconstructing complex insights into [[Atomic Notes]] to maximize combinatorial reuse.
4. **Active Synthesis**: Periodically reviewing and transforming notes into articles, models, or implementations via [[Spaced Repetition & Active Recall]].

## Foundational Frameworks
- The [[Zettelkasten Method]] pioneered by Niklas Luhmann for serendipitous insight.
- Application of [[Mental Models]] to filter signals from noise.
- Grounding in [[Cognitive Load Theory]] to avoid mental exhaustion.

> *"Knowledge is not a collection of isolated facts, but a mesh of interconnected concepts that compound over time."*`
  },
  {
    id: 'note-zettelkasten',
    title: 'Zettelkasten Method',
    folder: 'Knowledge Systems',
    tags: ['pkm', 'zettelkasten', 'methodology'],
    status: 'evergreen',
    pinned: true,
    favorite: true,
    createdAt: '2026-08-12T11:15:00.000Z',
    updatedAt: '2026-09-01T09:20:00.000Z',
    summary: 'The slip-box technique emphasizing atomic notes, unique referencing, and bidirectional links to generate serendipitous connections.',
    content: `# Zettelkasten Method

The **Zettelkasten** (German for "slip box") is a knowledge management framework developed by sociologist Niklas Luhmann, who credited it for authoring over 70 books and 400 academic articles.

## Cardinal Rules of Zettelkasten
1. **Principle of Atomicity**: Each note must contain only *one* self-contained thought. See [[Atomic Notes]].
2. **Autonomous Comprehensibility**: A note must make sense on its own without requiring the context of its parent document.
3. **Bi-directional Connection**: Every new note should link to at least one existing note using [[Bi-directional Linking]].
4. **Organic Growth**: Structure emerges bottom-up from links rather than predetermined top-down categories.

## Note Categories
- **Fleeting Notes**: Quick thoughts scribbled during reading or walking; discarded after processing.
- **Literature Notes**: Summaries of books or papers written strictly in your own words.
- **Permanent Notes**: Evergreen conceptual nodes integrated into the core [[Second Brain & Knowledge Systems]] graph.

## Emergence
When atomic notes are densely linked, unexpected clusters emerge through [[Emergent Synthesis]].`
  },
  {
    id: 'note-atomic-notes',
    title: 'Atomic Notes',
    folder: 'Knowledge Systems',
    tags: ['pkm', 'writing', 'modular-thinking'],
    status: 'evergreen',
    createdAt: '2026-08-14T14:20:00.000Z',
    updatedAt: '2026-08-28T16:00:00.000Z',
    summary: 'Single-concept notes that are modular, composable, and easily cross-referenced across different contexts.',
    content: `# Atomic Notes

An **Atomic Note** is a note restricted to a single concept, proposition, or mechanism.

## Why Atomicity Matters
- **High Combinatorial Value**: A note that only discusses one concept can be linked from ten different topics without bringing irrelevant noise.
- **Reduced Cognitive Friction**: Reading or editing an atomic card respects [[Cognitive Load Theory]].
- **Clear References**: When linking with [[Bi-directional Linking]], the link title represents a distinct idea rather than a sprawling document.

## Anatomy of a Great Atomic Note
1. **Descriptive Title**: Phrased as a claim or concept (e.g., *"Eventual consistency favors availability over strict consensus"*).
2. **Concise Body**: 100–300 words clearly explaining the premise.
3. **Connections**: Direct outgoing links to related [[Mental Models]] or foundations.

See how this integrates with the [[Zettelkasten Method]].`
  },
  {
    id: 'note-bidirectional-linking',
    title: 'Bi-directional Linking',
    folder: 'Knowledge Systems',
    tags: ['graph', 'hypertext', 'network-theory'],
    status: 'evergreen',
    createdAt: '2026-08-15T09:40:00.000Z',
    updatedAt: '2026-09-05T18:10:00.000Z',
    summary: 'Two-way hypertext associations that expose backlinks and reveal unmapped connections across your thought graph.',
    content: `# Bi-directional Linking

Traditional web links are unidirectional: Page A points to Page B, but Page B has no native awareness of Page A.

**Bi-directional linking** establishes a mutual relationship:
\`\`\`
[Page A]  <=======>  [Page B]
\`\`\`

## Functional Advantages
- **Automatic Backlinks**: When you view a note, you immediately discover all other documents in your vault that reference it.
- **Unlinked Mentions**: The system identifies instances where a concept name is typed without explicit syntax, allowing one-click connection.
- **Network Density**: Generates a rich knowledge topology where [[Emergent Synthesis]] can happen naturally.

This is the technical backbone of modern tools and powers the core graph of the [[Second Brain & Knowledge Systems]].`
  },
  {
    id: 'note-mental-models',
    title: 'Mental Models',
    folder: 'Mental Models',
    tags: ['thinking', 'decision-making', 'heuristics'],
    status: 'evergreen',
    pinned: true,
    favorite: true,
    createdAt: '2026-08-16T12:00:00.000Z',
    updatedAt: '2026-09-08T11:00:00.000Z',
    summary: 'A latticework of foundational concepts across physics, biology, and systems theory used to clarify thinking and decision making.',
    content: `# Mental Models

A **Mental Model** is a conceptual representation of how something works in reality. Charlie Munger advocated for a "latticework of mental models" drawn from multiple disciplines.

## Essential Models in This Vault
- [[First Principles Thinking]]: Deconstructing problems into basic truths.
- [[Inversion Principle]]: Approaching problems backwards to avoid failure modes.
- [[Second-Order Thinking]]: Anticipating downstream consequences beyond immediate outcomes.
- [[Feedback Loops & Emergence]]: Understanding non-linear dynamics in complex systems.

## Cognitive Utility
Combining models prevents the *"man with a hammer"* syndrome. When applied to software architecture, mental models directly inform [[System Design Principles]].`
  },
  {
    id: 'note-first-principles',
    title: 'First Principles Thinking',
    folder: 'Mental Models',
    tags: ['philosophy', 'physics', 'problem-solving'],
    status: 'evergreen',
    createdAt: '2026-08-17T15:30:00.000Z',
    updatedAt: '2026-08-30T10:15:00.000Z',
    summary: 'The practice of boiling a problem down to its most fundamental truths and reasoning up from there.',
    content: `# First Principles Thinking

Attributed to Aristotle and famously practiced by physicists, **First Principles Thinking** is the act of boiling a system down to its most fundamental truths that cannot be deduced any further, then reasoning upwards from there.

## Contrast with Reasoning by Analogy
- **Reasoning by Analogy**: "We do this because that's how everyone else does it with small tweaks."
- **First Principles**: "What are the physical constraints, raw material costs, and mathematical invariants?"

## Application in Technology
In distributed systems, instead of copying existing architectures, one analyzes physical limitations: latency (speed of light in optical fiber), disk I/O, and CPU caching.
This directly explains constraints like the [[CAP Theorem & Distributed Consensus]].

Pairs powerfully with [[Second-Order Thinking]] and [[Inversion Principle]].`
  },
  {
    id: 'note-inversion-principle',
    title: 'Inversion Principle',
    folder: 'Mental Models',
    tags: ['heuristics', 'risk-management', 'algebra'],
    status: 'growing',
    createdAt: '2026-08-18T16:00:00.000Z',
    updatedAt: '2026-08-25T14:00:00.000Z',
    summary: 'Solving difficult challenges by turning them upside down—identifying what causes failure rather than what achieves success.',
    content: `# Inversion Principle

*"Invert, always invert."* — Carl Jacobi

The **Inversion Principle** dictates that instead of asking how to succeed, you systematically ask how to guarantee failure—and then rigorously avoid those conditions.

## Practical Examples
- **In Knowledge Work**: Instead of asking "How do I remember everything?", ask "What guarantees I will forget everything?" (Answer: reading passively without notes, zero recall, disconnected storage). Hence, [[Spaced Repetition & Active Recall]] is born.
- **In Architecture**: Instead of asking "How do we make the service 100% reliable?", ask "What single points of failure will crash the entire cluster?"

Works hand-in-hand with [[Mental Models]] and [[Second-Order Thinking]].`
  },
  {
    id: 'note-second-order-thinking',
    title: 'Second-Order Thinking',
    folder: 'Mental Models',
    tags: ['strategy', 'systems', 'consequences'],
    status: 'growing',
    createdAt: '2026-08-19T13:45:00.000Z',
    updatedAt: '2026-09-04T17:20:00.000Z',
    summary: 'Evaluating decisions by examining long-term cascading repercussions instead of immediate first-order rewards.',
    content: `# Second-Order Thinking

First-order thinking is simplistic and immediate: *"I am hungry, so I will eat this entire chocolate cake."*
**Second-order thinking** asks: *"And then what happens next? And after that?"*

## Characteristics
- First-order solutions often produce negative second- and third-order consequences.
- Conversely, activities with painful first-order consequences (like deliberate practice or maintaining [[Atomic Notes]]) yield exponential compound returns.

## Intersecting Models
Second-order effects in large networks trigger unintended [[Feedback Loops & Emergence]], which is critical when designing resilient [[System Design Principles]].`
  },
  {
    id: 'note-system-design',
    title: 'System Design Principles',
    folder: 'Engineering & Systems',
    tags: ['architecture', 'scalability', 'distributed-systems'],
    status: 'evergreen',
    pinned: true,
    createdAt: '2026-08-20T10:00:00.000Z',
    updatedAt: '2026-09-09T08:30:00.000Z',
    summary: 'Core engineering heuristics for building decoupled, fault-tolerant, and high-throughput software architectures.',
    content: `# System Design Principles

Robust systems prioritize maintainability, graceful degradation, and clear communication boundaries.

## Foundational Heuristics
1. **Decouple Producers from Consumers**: Utilize [[Event-Driven Architecture]] to prevent synchronous bottleneck cascades.
2. **Embrace Network Partitions**: Recognize the reality of the [[CAP Theorem & Distributed Consensus]].
3. **Stateless Compute**: Push persistent state to specialized stores to scale worker nodes elastically.
4. **Idempotency**: Ensure operations can be retried safely without duplicating side-effects.

## Non-Linear Dynamics
In high-scale platforms, small failures trigger cascading outages due to positive [[Feedback Loops & Emergence]]. Understanding [[First Principles Thinking]] helps distinguish true bottlenecks from speculative optimization.`
  },
  {
    id: 'note-cap-theorem',
    title: 'CAP Theorem & Distributed Consensus',
    folder: 'Engineering & Systems',
    tags: ['distributed-systems', 'consensus', 'database'],
    status: 'evergreen',
    createdAt: '2026-08-21T11:30:00.000Z',
    updatedAt: '2026-08-29T15:10:00.000Z',
    summary: 'Eric Brewer’s theorem proving distributed data stores can only simultaneously guarantee two of Consistency, Availability, and Partition Tolerance.',
    content: `# CAP Theorem & Distributed Consensus

Formulated by Eric Brewer and proven by Gilbert & Lynch, the **CAP Theorem** asserts that across an unreliable network partition ($P$), a distributed system must choose between:

1. **Consistency (C)**: Every read receives the most recent write or an error.
2. **Availability (A)**: Every non-failing node returns a reasonable response, but might not be the latest data.
3. **Partition Tolerance (P)**: The system continues operating despite dropped or delayed messages between nodes.

## The Reality of Networks
Because physical hardware and networks *will* partition, the real trade-off in production is **CP vs AP**:
- **CP (e.g., Raft, Spanner)**: Sacrifice availability to prevent stale reads.
- **AP (e.g., Cassandra, Dynamo)**: Return available data immediately and reconcile via eventual consistency.

Relates closely to [[System Design Principles]] and [[Event-Driven Architecture]].`
  },
  {
    id: 'note-event-driven',
    title: 'Event-Driven Architecture',
    folder: 'Engineering & Systems',
    tags: ['microservices', 'events', 'kafka', 'messaging'],
    status: 'growing',
    createdAt: '2026-08-22T14:15:00.000Z',
    updatedAt: '2026-09-06T12:00:00.000Z',
    summary: 'A software design pattern where decoupled services react asynchronously to immutable state changes (events).',
    content: `# Event-Driven Architecture

In an **Event-Driven Architecture (EDA)**, system components interact by publishing and subscribing to immutable records of events that already occurred.

## Core Advantages
- **Temporal Decoupling**: The producer does not care when, how, or if a subscriber processes the message.
- **Replayability**: With event logs, services can rebuild internal projections from historic streams.
- **Elastic Scalability**: Independent worker groups scale dynamically according to consumer lag.

## Challenges
- Eventual consistency requires careful design around the [[CAP Theorem & Distributed Consensus]].
- Risk of unintended cascading ripples in complex [[Feedback Loops & Emergence]].

A staple in modern [[System Design Principles]].`
  },
  {
    id: 'note-feedback-loops',
    title: 'Feedback Loops & Emergence',
    folder: 'Mental Models',
    tags: ['complexity', 'systems-thinking', 'cybernetics'],
    status: 'growing',
    createdAt: '2026-08-23T16:20:00.000Z',
    updatedAt: '2026-09-07T14:40:00.000Z',
    summary: 'How reinforcing and balancing loops generate non-linear outcomes and emergent macro properties from micro rules.',
    content: `# Feedback Loops & Emergence

A **Feedback Loop** occurs when outputs of a system are circled back as inputs:
- **Balancing (Negative) Feedback**: Drives stability and equilibrium (e.g., thermostats, biological homeostasis).
- **Reinforcing (Positive) Feedback**: Amplifies change, leading to exponential growth or runaway crashes (e.g., compounding interest, bank runs, viral flywheels).

## Emergence
Emergence occurs when a complex entity has properties that its individual parts do not have on their own:
> *"The whole is something besides the parts."*

In knowledge systems, dense [[Bi-directional Linking]] produces [[Emergent Synthesis]]—ideas connect that you never consciously anticipated.`
  },
  {
    id: 'note-cognitive-load',
    title: 'Cognitive Load Theory',
    folder: 'Cognitive Science',
    tags: ['psychology', 'learning', 'memory', 'ergonomics'],
    status: 'evergreen',
    createdAt: '2026-08-24T09:15:00.000Z',
    updatedAt: '2026-09-03T16:00:00.000Z',
    summary: 'John Sweller’s theory on working memory constraints and optimizing learning by minimizing extraneous mental effort.',
    content: `# Cognitive Load Theory

Developed by John Sweller, **Cognitive Load Theory** addresses the finite capacity of human working memory (typically holding 4±1 chunks of active information).

## Three Types of Cognitive Load
1. **Intrinsic Load**: The inherent difficulty of the topic itself.
2. **Extraneous Load**: Mental effort wasted due to poor formatting, clutter, or ambiguous UI.
3. **Germane Load**: Productive mental effort directed toward constructing schemas and long-term mental models.

## Practical Knowledge Management Takeaways
- Use [[Atomic Notes]] to reduce intrinsic complexity into bite-sized units.
- Offload memorization to a [[Second Brain & Knowledge Systems]].
- Use active recall techniques like [[Spaced Repetition & Active Recall]] to consolidate schemas permanently into long-term memory.`
  },
  {
    id: 'note-spaced-repetition',
    title: 'Spaced Repetition & Active Recall',
    folder: 'Cognitive Science',
    tags: ['learning', 'anki', 'memory-retention'],
    status: 'evergreen',
    favorite: true,
    createdAt: '2026-08-25T11:00:00.000Z',
    updatedAt: '2026-09-10T19:00:00.000Z',
    summary: 'The gold-standard cognitive technique for flattening the Ebbinghaus forgetting curve via timed retrieval testing.',
    content: `# Spaced Repetition & Active Recall

The combination of **Active Recall** (testing oneself rather than passively re-reading) and **Spaced Repetition** (increasing intervals between review sessions) is mathematically proven to produce optimal long-term retention.

## The Ebbinghaus Forgetting Curve
Without review, biological memory decays exponentially over days. Each time you successfully retrieve an idea just as it was about to be forgotten, the memory trace strengthens and the decay slope flattens.

## Integration with Knowledge Vaults
A common flaw in personal knowledge management is collecting notes without internalizing them.
By extracting flashcards from our [[Second Brain & Knowledge Systems]], we close the loop between external storage and internal mental clarity.

Directly informed by [[Cognitive Load Theory]].`
  },
  {
    id: 'note-emergent-synthesis',
    title: 'Emergent Synthesis',
    folder: 'Knowledge Systems',
    tags: ['creativity', 'synthesis', 'emergence'],
    status: 'seed',
    createdAt: '2026-08-26T17:30:00.000Z',
    updatedAt: '2026-09-11T13:00:00.000Z',
    summary: 'The spontaneous formation of novel insights at the intersection of previously unrelated concepts.',
    content: `# Emergent Synthesis

**Emergent Synthesis** occurs when two distinct domains collide inside an associative web, giving birth to a completely original perspective.

For example, applying the biological principles of [[Feedback Loops & Emergence]] to distributed [[System Design Principles]], or using the [[Inversion Principle]] to redesign [[Cognitive Load Theory]] interfaces.

Enabled by [[Bi-directional Linking]] and cross-disciplinary curiosity.`
  }
];

export const INITIAL_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    noteId: 'note-zettelkasten',
    noteTitle: 'Zettelkasten Method',
    question: 'What is the Principle of Atomicity in a Zettelkasten note system?',
    answer: 'Each note must capture exactly one self-contained concept or proposition so it can be combined flexibly across multiple topics.',
    interval: 3,
    repetition: 2,
    easeFactor: 2.5,
    dueDate: new Date(Date.now() - 1000 * 3600 * 5).toISOString(), // due now
  },
  {
    id: 'fc-2',
    noteId: 'note-cap-theorem',
    noteTitle: 'CAP Theorem & Distributed Consensus',
    question: 'In a distributed system experiencing network partitioning, why must you choose between Consistency and Availability?',
    answer: 'Because messages between partitioned nodes cannot arrive; if nodes accept writes, they become inconsistent. If they reject writes to preserve consistency, they lose availability.',
    interval: 5,
    repetition: 3,
    easeFactor: 2.6,
    dueDate: new Date(Date.now() - 1000 * 3600 * 12).toISOString(), // due now
  },
  {
    id: 'fc-3',
    noteId: 'note-first-principles',
    noteTitle: 'First Principles Thinking',
    question: 'What is the core distinction between First Principles Thinking and Reasoning by Analogy?',
    answer: 'Reasoning by analogy copies standard practices with slight variations; first principles decomposes a problem to indisputable physical/mathematical truths and builds upwards.',
    interval: 2,
    repetition: 1,
    easeFactor: 2.4,
    dueDate: new Date(Date.now() + 1000 * 3600 * 24).toISOString(), // due tomorrow
  },
  {
    id: 'fc-4',
    noteId: 'note-cognitive-load',
    noteTitle: 'Cognitive Load Theory',
    question: 'What are the three types of cognitive load defined by John Sweller?',
    answer: '1) Intrinsic Load (inherent difficulty), 2) Extraneous Load (inefficient presentation/formatting), and 3) Germane Load (effort dedicated to schema construction).',
    interval: 1,
    repetition: 0,
    easeFactor: 2.5,
    dueDate: new Date(Date.now() - 1000 * 3600 * 2).toISOString(), // due now
  },
  {
    id: 'fc-5',
    noteId: 'note-inversion-principle',
    noteTitle: 'Inversion Principle',
    question: 'How does the Inversion Principle solve complex problems?',
    answer: 'Instead of seeking success directly, it identifies what causes guaranteed failure and systematically builds safeguards to avoid those conditions.',
    interval: 4,
    repetition: 2,
    easeFactor: 2.5,
    dueDate: new Date(Date.now() - 1000 * 3600 * 8).toISOString(), // due now
  }
];

export const ARABIC_SAMPLE_NOTES: KnowledgeNote[] = [
  {
    id: 'note-ar-second-brain',
    title: 'الدماغ الثاني وهندسة المعرفة',
    folder: 'أنظمة المعرفة',
    tags: ['إدارة-المعرفة', 'إنتاجية', 'تفكير-مركب'],
    status: 'evergreen',
    pinned: true,
    favorite: true,
    createdAt: '2026-08-10T10:00:00.000Z',
    updatedAt: '2026-09-02T14:30:00.000Z',
    summary: 'منهجية لتحرير الذاكرة البيولوجية، وبناء شبكة تفكير مترابطة، وتوليف المعلومات الأولية في نواتج إبداعية.',
    content: `# الدماغ الثاني وهندسة المعرفة

**الدماغ الثاني** هو مستودع رقمي ديناميكي خارجي تتشابك فيه الأفكار والملاحظات والبحوث لتعزيز الذاكرة البيولوجية.

بدلاً من التعامل مع الملاحظات الرقمية كأرشيفات ميتة (مقبرة رقمية)، يتعامل نظام إدارة المعرفة الناضج معها كشبكة ترابطية حية.

## الركائز الأساسية
1. **التفريغ الخارجي**: تفريغ التخزين عالي الكثافة من الذاكرة العاملة لتحرير السعة الإدراكية للتوليف والابتكار.
2. **الطوبولوجيا الترابطية**: ربط الأفكار عبر مختلف التخصصات عبر [[الروابط ثنائية الاتجاه]] بدلاً من التسلسلات الهرمية الصارمة.
3. **التقطير الذري**: تفكيك الرؤى المعقدة إلى [[الملاحظات الذرية]] لتسهيل إعادة التركيب والاستخدام.
4. **الاسترجاع النشط**: مراجعة دورية للأفكار عبر [[التكرار المتباعد والاسترجاع النشط]].

## الأطر التأسيسية
- [[طريقة زيتلكاستن]] التي ابتكرها نيكلاس لومان لإنتاج أفكار غير متوقعة.
- تطبيق [[النماذج الذهنية]] لفرز الإشارات الحقيقية من الضوضاء.
- الاستناد إلى [[نظرية الحمل الإدراكي]] لتجنب الإرهاق الذهني.

> *"المعرفة ليست مجموعة من الحقائق المعزولة، بل هي شبكة من المفاهيم المترابطة التي تتضاعف قيمتها بمرور الوقت."*`
  },
  {
    id: 'note-ar-zettelkasten',
    title: 'طريقة زيتلكاستن',
    folder: 'أنظمة المعرفة',
    tags: ['زيتلكاستن', 'منهجية', 'إدارة-المعرفة'],
    status: 'evergreen',
    pinned: true,
    favorite: true,
    createdAt: '2026-08-12T11:15:00.000Z',
    updatedAt: '2026-09-01T09:20:00.000Z',
    summary: 'تقنية صندوق البطاقات التي تركز على الملاحظات الذرية والروابط الثنائية لتوليد روابط إبداعية غير مسبوقة.',
    content: `# طريقة زيتلكاستن

**زيتلكاستن** (Zettelkasten وتعني بالألمانية "صندوق البطاقات") هي تقنية لإدارة المعرفة طورها عالم الاجتماع نيكلاس لومان، والتي مكنته من تأليف أكثر من 70 كتاباً و400 مقالة علمية.

## القواعد الأساسية لزيتلكاستن
1. **مبدأ الذرية**: يجب أن تحتوي كل بطاقة على فكرة مستقلة واحدة فقط. راجع [[الملاحظات الذرية]].
2. **الفهم الذاتي المستقل**: يجب أن تكون الملاحظة مفهومة بذاتها دون الحاجة لسياق الوثيقة الأصلية.
3. **الربط ثنائي الاتجاه**: يجب أن ترتبط كل ملاحظة جديدة بملاحظة سابقة واحدة على الأقل عبر [[الروابط ثنائية الاتجاه]].
4. **النمو العضوي**: يبرز الهيكل العام تصاعدياً من الروابط وليس من تصنيفات مفروضة مسبقاً.

ترتبط هذه الطريقة مباشرة بنظام [[الدماغ الثاني وهندسة المعرفة]].`
  },
  {
    id: 'note-ar-atomic-notes',
    title: 'الملاحظات الذرية',
    folder: 'أنظمة المعرفة',
    tags: ['ملاحظات-ذرية', 'كتابة', 'تركيب'],
    status: 'evergreen',
    pinned: false,
    favorite: true,
    createdAt: '2026-08-14T08:30:00.000Z',
    updatedAt: '2026-08-28T16:45:00.000Z',
    summary: 'الوحدة البنائية الأساسية للمعرفة المركبة: فكرة واحدة مصاغة بأسلوبك الخاص يمكن دمجها في أي سياق.',
    content: `# الملاحظات الذرية

الملاحظة الذرية هي وحدة معرفية مصغرة تركز على طرح أو فكرة رئيسية واحدة.

## لماذا الملاحظات الذرية؟
- **القدرة على إعادة التركيب**: عندما تكون الأفكار مجزأة ومستقلة، يمكن ربطها في سياقات جديدة ومختلفة.
- **سهولة الربط**: يسهل ربط مفهوم واحد محدد باستخدام [[الروابط ثنائية الاتجاه]] مقارنة بصفحة طويلة تحتوي أفكاراً متعددة.
- **أساس متين في [[طريقة زيتلكاستن]]**: كل بطاقة في صندوق لومان كانت ذرية بطبيعتها.

كما تساهم الملاحظات الذرية في تخفيف الجهد على الذاكرة وتطبيق مبادئ [[نظرية الحمل الإدراكي]].`
  },
  {
    id: 'note-ar-bidirectional-linking',
    title: 'الروابط ثنائية الاتجاه',
    folder: 'أنظمة المعرفة',
    tags: ['روابط', 'طوبولوجيا', 'شبكات'],
    status: 'evergreen',
    pinned: false,
    favorite: false,
    createdAt: '2026-08-15T14:20:00.000Z',
    updatedAt: '2026-09-02T11:10:00.000Z',
    summary: 'روابط ويكي التي تتيح التدفق المعرفي بالاتجاهين واكتشاف العلاقات التلقائية بين المفاهيم.',
    content: `# الروابط ثنائية الاتجاه

على عكس روابط الويب التقليدية أحادية الاتجاه، تتيح الروابط ثنائية الاتجاه لكل وثيقة معرفة الوثائق الأخرى التي تشير إليها (Backlinks).

## المزايا المعرفية
- بناء شبكة عصبية للأفكار كما في [[الدماغ الثاني وهندسة المعرفة]].
- استكشاف العلاقات غير المتوقعة بين المفاهيم المتفرقة.
- تحويل الملاحظات المعزولة إلى سياقات تفاعلية غنية.
- تجسيد عملي لجوهر [[طريقة زيتلكاستن]].`
  },
  {
    id: 'note-ar-spaced-repetition',
    title: 'التكرار المتباعد والاسترجاع النشط',
    folder: 'علوم الإدراك',
    tags: ['ذاكرة', 'تعلم', 'إدراك'],
    status: 'evergreen',
    pinned: true,
    favorite: false,
    createdAt: '2026-08-18T09:00:00.000Z',
    updatedAt: '2026-08-30T10:15:00.000Z',
    summary: 'خوارزمية نفسية لمقاومة منحنى النسيان عن طريق اختبار الذاكرة في فترات متباعدة تدريجياً.',
    content: `# التكرار المتباعد والاسترجاع النشط

يُعد الاسترجاع النشط (Active Recall) والتكرار المتباعد (Spaced Repetition) من أقوى الاستراتيجيات المثبتة علمياً لترسيخ المعرفة في الذاكرة طويلة المدى.

## منحنى النسيان لهيرمان إبنجهاوس
تتلاشى المعلومات غير المراجعة بسرعة مذهلة. يؤدي استدعاء المعلومة النشط قبل نسيانها مباشرة إلى إعادة ضبط المنحنى وزيادة ثباتها.

## التكامل مع الخزانة
عند تدوين [[الملاحظات الذرية]]، يمكن استخلاص بطاقات استذكار لترسيخ المفاهيم الجوهرية.
هذا النهج يساعد في تقليل الضغط على الذهن وفق [[نظرية الحمل الإدراكي]].`
  },
  {
    id: 'note-ar-mental-models',
    title: 'النماذج الذهنية',
    folder: 'التفكير والاستدلال',
    tags: ['نماذج-ذهنية', 'استدلال', 'قرارات'],
    status: 'growing',
    pinned: false,
    favorite: true,
    createdAt: '2026-08-20T12:00:00.000Z',
    updatedAt: '2026-09-01T15:00:00.000Z',
    summary: 'تمثيلات وتصورات عقلية لكيفية عمل الأشياء في العالم، تساعد في اتخاذ قرارات دقيقة وحل المشكلات.',
    content: `# النماذج الذهنية

النماذج الذهنية هي تمثيلات مجردة لكيفية عمل منظومات الواقع.

## نماذج شهيرة
- **مبدأ الانعكاس**: حل المشكلات بالعكس (تجنب الفشل بدلاً من مطاردة النجاح فقط).
- **التفكير من المبادئ الأولى**: تفكيك المسائل إلى حقائقها الأساسية التي لا جدال فيها.
- **حلقات التغذية الراجعة**: فهم كيف تؤثر المخرجات مجدداً في المدخلات.

ترتبط النماذج الذهنية بنظام [[الدماغ الثاني وهندسة المعرفة]] لتنظيم الأفكار المعقدة وتخفيف [[نظرية الحمل الإدراكي]].`
  },
  {
    id: 'note-ar-cognitive-load',
    title: 'نظرية الحمل الإدراكي',
    folder: 'علوم الإدراك',
    tags: ['علم-نفس', 'إدراك', 'تصميم'],
    status: 'growing',
    pinned: false,
    favorite: false,
    createdAt: '2026-08-22T15:30:00.000Z',
    updatedAt: '2026-08-29T14:20:00.000Z',
    summary: 'نظرية جون سويلر حول قيود الذاكرة العاملة وكيفية تحسين معالجة واستيعاب المعلومات.',
    content: `# نظرية الحمل الإدراكي

صاغ جون سويلر نظرية الحمل الإدراكي لتوضيح أن الذاكرة العاملة للإنسان محدودة السعة للغاية.

## أقسام الحمل الإدراكي
1. **الحمل الجوهري**: الصعوبة الملازمة للموضوع نفسه.
2. **الحمل الدخيل**: التشتت الناتج عن سوء تقديم المعلومات أو الفوضى البصرية.
3. **الحمل الوثيق**: الطاقة الذهنية الموجهة لبناء المخططات العقلية وفهم الأنماط.

## التطبيق في إدارة المعرفة
باستخدام [[الملاحظات الذرية]] و[[الروابط ثنائية الاتجاه]] في [[الدماغ الثاني وهندسة المعرفة]]، نخفف الحمل الدخيل ونركز الجهد المعرفي على التوليف الحقيقي.`
  }
];

export const ARABIC_SAMPLE_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-ar-1',
    noteId: 'note-ar-zettelkasten',
    noteTitle: 'طريقة زيتلكاستن',
    question: 'ما هو مبدأ الذرية في نظام تدوين زيتلكاستن؟',
    answer: 'أن تلتقط كل بطاقة فكرة مستقلة واحدة فقط لتسهيل دمجها وإعادة ربطها عبر مواضيع وسياقات متعددة.',
    interval: 3,
    repetition: 2,
    easeFactor: 2.5,
    dueDate: new Date(Date.now() - 1000 * 3600 * 5).toISOString(),
  },
  {
    id: 'fc-ar-2',
    noteId: 'note-ar-spaced-repetition',
    noteTitle: 'التكرار المتباعد والاسترجاع النشط',
    question: 'كيف يتغلب الاسترجاع النشط على منحنى النسيان لهيرمان إبنجهاوس؟',
    answer: 'عبر استدعاء المعلومة من الذاكرة بجهد نشط قبل لحظة نسيانها، مما يعيد ضبط المنحنى ويزيد ثباتها في الذاكرة طويلة المدى.',
    interval: 4,
    repetition: 2,
    easeFactor: 2.5,
    dueDate: new Date(Date.now() - 1000 * 3600 * 10).toISOString(),
  },
  {
    id: 'fc-ar-3',
    noteId: 'note-ar-cognitive-load',
    noteTitle: 'نظرية الحمل الإدراكي',
    question: 'ما هي الأنواع الثلاثة للحمل الإدراكي بحسب جون سويلر؟',
    answer: '1) الحمل الجوهري (صعوبة المفهوم الأصلية)، 2) الحمل الدخيل (سوء التنظيم والتشتت)، 3) الحمل الوثيق (بناء المخططات الذهنية).',
    interval: 2,
    repetition: 1,
    easeFactor: 2.4,
    dueDate: new Date(Date.now() + 1000 * 3600 * 24).toISOString(),
  }
];
