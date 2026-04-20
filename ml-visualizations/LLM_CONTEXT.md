# ML Visualizations - Interactive Machine Learning Education

## Project Overview
Interactive educational website teaching machine learning concepts through visual, hands-on exploration. Part of the larger Interactive Educational Platform collection.

## Inspiration & Goals
Inspired by BrrrViz, this site aims to make complex ML concepts intuitive through:
- **Interactive visualizations** - not static diagrams
- **Progressive learning** - chapters building on each other
- **Mental models first** - understanding before implementation
- **Clean, focused design** - minimal distractions

## Target Audience
- Students learning ML theory who want visual intuition
- Developers using ML frameworks who want to understand what's happening under the hood
- Anyone curious about neural networks, backpropagation, or transformers
- No prior ML experience required for fundamentals

## Topics Covered (Chapters)

### Chapter 1: Neural Network Foundations
- Interactive single neuron visualization
- Understanding weights, biases, and activation functions
- Visualizing forward pass through a simple network
- **Interactive**: Adjust weights/biases, see output changes in real-time

### Chapter 2: Backpropagation Deep Dive
- Watch gradients flow backward through the network
- Understand chain rule visually
- See how each weight contributes to the error
- **Interactive**: Step through backprop, hover to see gradient calculations

### Chapter 3: Gradient Descent Visualization
- Visualize loss landscapes in 2D/3D
- Compare SGD, Momentum, Adam optimizers
- See learning rate effects and convergence
- **Interactive**: Adjust learning rate, momentum, watch optimization path

### Chapter 4: Attention Mechanisms
- Understand self-attention in transformer models
- Visualize attention weights between tokens
- See multi-head attention in action
- **Interactive**: Input sentences, adjust attention heads, visualize weights

### Chapter 5: Transformer Architecture
- Complete walkthrough of transformer components
- Positional encoding visualization
- Layer normalization and residual connections
- **Interactive**: Explore full transformer forward pass with sliders

## Technical Architecture

### Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Visualizations**: D3.js + React-Spring
- **Math**: MathJax for equations rendering

### Key Components
```typescript
// Component structure
/app
  /layout.tsx          # Main layout with sidebar navigation
  /page.tsx            # Landing page (Who, Why, Who It's For)
  /chapters
    /chapter-1         # Neural network foundations
    /chapter-2         # Backpropagation
    /chapter-3         # Gradient descent
    /chapter-4         # Attention mechanisms
    /chapter-5         # Transformers
  /components
    /Sidebar.tsx       # Chapter navigation
    /Visualization.tsx # Interactive demo container
    /Controls.tsx      # Sliders, toggles
    /Explanation.tsx   # Contextual learning content
```

## Design Patterns

### 1. Sidebar Navigation
- List of chapters with progress indicators
- Current chapter highlighted
- Collapsible sections
- Progress saved to localStorage

### 2. Visualization Container
```typescript
interface VisualizationProps {
  title: string;
  controls: ControlConfig[];
  renderVisualization: (params: VisualizationParams) => JSX.Element;
  explanation: string;
}
```

### 3. Interactive Controls
- Sliders with real-time value display
- Toggle buttons for mode switching
- Hover tooltips for additional context
- Reset button to return to defaults

### 4. Progressive Disclosure
- Start with simple explanation
- Reveal complexity as user interacts
- "Learn more" expandable sections
- Math equations shown on demand

## Color Scheme & Styling
- **Primary**: Deep blue (#1e3a8a) - trust, intelligence
- **Accent**: Bright blue (#3b82f6) - interactivity
- **Success**: Green (#10b981) - correct answers, gradients
- **Warning**: Amber (#f59e0b) - optimization warnings
- **Background**: Clean white/gray for focus
- **Dark mode support**: Toggle available

## State Management
```typescript
// Global state for progress
interface LearningState {
  currentChapter: number;
  completedChapters: number[];
  visualizationParams: Record<string, any>;
}
```

## Data Flow
1. User lands on intro page → understands value proposition
2. Selects chapter or starts at beginning
3. Reads brief explanation → sees interactive visualization
4. Manipulates controls → sees immediate visual feedback
5. Builds mental model → progresses to next concept
6. Progress tracked → can resume where left off

## Deployment
- **Platform**: Vercel
- **Domain**: ml-viz.vercel.app (or similar)
- **Analytics**: Vercel Analytics for engagement tracking
- **Performance**: Optimized with Next.js static generation where possible

## Development Commands
```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Lint
npm run lint
```

## Success Metrics
- Users complete multiple chapters (engagement)
- Time spent on visualizations (value)
- Return visits (learning reinforcement)
- Feedback on clarity and usefulness

## Future Enhancements
- Quiz questions between chapters
- User-submitted visualization ideas
- Export visualization as GIF for sharing
- Colaboratory-style code notebooks alongside visualizations
- Multi-language support

## Related Projects
- Main platform: [../](../) - Interactive Educational Platform
- Sister sites: Database Internals, Distributed Systems, etc.

## Credits
Inspired by [BrrrViz](https://brrr-viz.vercel.app/) by Kyle Yu
Built with Next.js, React, D3.js, and the amazing ML education community
