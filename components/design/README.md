# Design Components

## DesignStudio

A comprehensive AI design generation interface that allows customers to create custom T-shirt designs using text prompts.

### Features

- **Prompt Input Interface**: Text area for entering design descriptions with character count
- **Pre-Prompt Selection**: Integrated PrePromptGallery for inspiration
- **Aspect Ratio Selection**: Support for 1:1, 16:9, 9:16, 4:3, and 3:4 ratios
- **Real-time Generation Status**: Loading states with progress tracking
- **Job Status Polling**: Automatic polling of generation job status every 2 seconds
- **Generated Design Display**: Preview of completed designs with metadata
- **Error Handling**: Comprehensive error messages with retry functionality
- **Recent Designs Gallery**: Display of user's 10 most recent designs
- **Responsive Design**: Mobile-first layout that works on all screen sizes

### Usage

```tsx
import DesignStudio from '@/components/design/DesignStudio';

export default function DesignPage() {
  return (
    <div>
      <DesignStudio />
    </div>
  );
}
```

### Component States

1. **Initial State**: Shows prompt input, aspect ratio selector, and pre-prompt gallery
2. **Generating State**: Displays loading spinner with progress bar and status messages
3. **Success State**: Shows generated design with preview, metadata, and action buttons
4. **Error State**: Displays error message with retry and reset options
5. **Recent Designs**: Grid of user's previous designs for quick access

### API Integration

The component integrates with the following endpoints:
- `POST /api/designs/generate` - Queue design generation job
- `GET /api/designs/job/:jobId` - Poll job status (every 2 seconds)
- `GET /api/designs` - Fetch recent designs

### Authentication

Requires JWT token stored in `localStorage` with key `token`. All API requests include the token in the Authorization header.

### Validation

- Minimum prompt length: 3 characters
- Maximum prompt length: 1000 characters
- Empty prompt validation before submission

### Styling

Uses Tailwind CSS with a clean, modern design:
- Blue color scheme for primary actions
- Green for success states
- Red for error states
- Responsive grid layouts
- Smooth transitions and hover effects

---

## PrePromptGallery

A gallery component that displays curated example prompts to inspire customer designs.

### Features

- Displays pre-prompts with preview images
- Category filtering (Space, Nature, Abstract, Animals, Fantasy, Urban, Retro, Minimalist, etc.)
- Responsive grid layout (1-4 columns based on screen size)
- Click to select and use a prompt
- Loading and error states
- Hover effects for better UX

### Usage

```tsx
import PrePromptGallery from '@/components/design/PrePromptGallery';

export default function DesignPage() {
  const handleSelectPrompt = (prompt: string) => {
    // Use the selected prompt for design generation
    console.log('Selected prompt:', prompt);
  };

  return (
    <div>
      <h1>Choose a Prompt</h1>
      <PrePromptGallery onSelectPrompt={handleSelectPrompt} />
    </div>
  );
}
```

### Props

- `onSelectPrompt: (prompt: string) => void` - Callback function called when a user selects a pre-prompt

### API Endpoint

The component fetches data from `GET /api/designs/pre-prompts` which supports:
- Optional `category` query parameter for filtering
- Returns `{ prePrompts: PrePrompt[], categories: string[] }`

### Styling

The component uses Tailwind CSS classes and is fully responsive:
- Mobile: 1 column
- Tablet (sm): 2 columns
- Desktop (lg): 3 columns
- Large Desktop (xl): 4 columns
