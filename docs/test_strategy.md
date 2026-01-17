# Test Strategy Document: Clickable Count Cards Enhancement

## Executive Summary

As your QA Engineer, I'm establishing a comprehensive testing strategy for the clickable count cards enhancement. This strategy ensures robust quality assurance while respecting the existing codebase and maintaining all current functionality.

## Testing Strategy Overview

### Testing Pyramid Approach
- **Unit Tests (70%)**: Core logic, utilities, and individual components
- **Integration Tests (20%)**: Component interactions and state management
- **End-to-End Tests (10%)**: Full user workflows and accessibility

### Testing Framework Selection
Based on Next.js/TypeScript/React stack:
- **Jest** + **React Testing Library** for unit/integration tests
- **Playwright** for E2E testing
- **Jest Accessibility (jest-axe)** for automated accessibility testing

## Test Strategy Document

### 1. Unit Test Strategy

**Target Coverage**: 95% for new code, maintain existing coverage levels

**Key Areas**:
- Filter utilities and date calculations
- State management (Context + useReducer)
- Interactive card component logic
- Event handlers and state transitions

### 2. Integration Test Strategy

**Focus Areas**:
- Card-to-filter synchronization
- Dropdown-to-card state management
- Context provider functionality
- Component composition

### 3. End-to-End Test Strategy

**Critical User Journeys**:
- Admin clicks Today card → sees filtered results
- Admin clicks This Week card → sees filtered results
- Admin uses dropdown → cards update accordingly
- Keyboard navigation workflow
- Screen reader interaction

---

## Test Files Implementation

### Unit Tests

#### 1. Filter Context Tests
```typescript
// __tests__/contexts/FilterContext.test.tsx
import React from 'react';
import { render, act } from '@testing-library/react';
import { FilterProvider, useFilter } from '@/lib/contexts/FilterContext';
import { FilterType } from '@/lib/types/filter';

// Test component to access context
const TestComponent: React.FC = () => {
  const { state, actions } = useFilter();
  return (
    <div>
      <span data-testid="active-filter">{state.activeTimeFilter}</span>
      <button 
        data-testid="set-today" 
        onClick={() => actions.setTimeFilter('today')}
      >
        Set Today
      </button>
      <button 
        data-testid="set-week" 
        onClick={() => actions.setTimeFilter('thisWeek')}
      >
        Set Week
      </button>
      <button 
        data-testid="clear-filters" 
        onClick={() => actions.clearFilters()}
      >
        Clear
      </button>
    </div>
  );
};

describe('FilterContext', () => {
  const renderWithProvider = (initialFilter?: FilterType) => {
    return render(
      <FilterProvider initialFilter={initialFilter}>
        <TestComponent />
      </FilterProvider>
    );
  };

  describe('Initial State', () => {
    it('should have null as default active filter', () => {
      const { getByTestId } = renderWithProvider();
      expect(getByTestId('active-filter')).toHaveTextContent('');
    });

    it('should accept initial filter value', () => {
      const { getByTestId } = renderWithProvider('today');
      expect(getByTestId('active-filter')).toHaveTextContent('today');
    });
  });

  describe('Filter Actions', () => {
    it('should set today filter when setTimeFilter called with today', async () => {
      const { getByTestId } = renderWithProvider();
      
      await act(async () => {
        getByTestId('set-today').click();
      });

      expect(getByTestId('active-filter')).toHaveTextContent('today');
    });

    it('should set week filter when setTimeFilter called with thisWeek', async () => {
      const { getByTestId } = renderWithProvider();
      
      await act(async () => {
        getByTestId('set-week').click();
      });

      expect(getByTestId('active-filter')).toHaveTextContent('thisWeek');
    });

    it('should clear filter when clearFilters called', async () => {
      const { getByTestId } = renderWithProvider('today');
      
      await act(async () => {
        getByTestId('clear-filters').click();
      });

      expect(getByTestId('active-filter')).toHaveTextContent('');
    });

    it('should only allow one active filter at a time', async () => {
      const { getByTestId } = renderWithProvider('today');
      
      await act(async () => {
        getByTestId('set-week').click();
      });

      expect(getByTestId('active-filter')).toHaveTextContent('thisWeek');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when useFilter used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useFilter must be used within a FilterProvider');
      
      consoleSpy.mockRestore();
    });
  });
});
```

#### 2. Filter Utilities Tests
```typescript
// __tests__/lib/filterUtils.test.ts
import { filterUtils } from '@/lib/utils/filterUtils';
import { FilterType } from '@/lib/types/filter';

// Mock conversations data
const mockConversations = [
  {
    id: '1',
    title: 'Today Conversation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Yesterday Conversation',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'Last Week Conversation',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

describe('filterUtils', () => {
  describe('getDateRange', () => {
    beforeEach(() => {
      // Mock current date to ensure consistent tests
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return correct range for today filter', () => {
      const range = filterUtils.getDateRange('today');
      
      expect(range.start).toEqual(new Date('2024-01-15T00:00:00.000Z'));
      expect(range.end).toEqual(new Date('2024-01-15T23:59:59.999Z'));
    });

    it('should return correct range for thisWeek filter', () => {
      const range = filterUtils.getDateRange('thisWeek');
      
      // Assuming week starts on Sunday (adjust based on business logic)
      expect(range.start).toEqual(new Date('2024-01-14T00:00:00.000Z'));
      expect(range.end).toEqual(new Date('2024-01-20T23:59:59.999Z'));
    });

    it('should return null for all filter', () => {
      const range = filterUtils.getDateRange('all');
      expect(range).toBeNull();
    });
  });

  describe('filterConversations', () => {
    it('should filter conversations for today', () => {
      const filtered = filterUtils.filterConversations(mockConversations, 'today');
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should filter conversations for this week', () => {
      const filtered = filterUtils.filterConversations(mockConversations, 'thisWeek');
      
      expect(filtered).toHaveLength(2); // Today and yesterday
    });

    it('should return all conversations for all filter', () => {
      const filtered = filterUtils.filterConversations(mockConversations, 'all');
      
      expect(filtered).toHaveLength(3);
      expect(filtered).toEqual(mockConversations);
    });

    it('should handle empty conversations array', () => {
      const filtered = filterUtils.filterConversations([], 'today');
      
      expect(filtered).toHaveLength(0);
    });
  });

  describe('isFilterActive', () => {
    it('should return true when filters match', () => {
      expect(filterUtils.isFilterActive('today', 'today')).toBe(true);
      expect(filterUtils.isFilterActive('thisWeek', 'thisWeek')).toBe(true);
    });

    it('should return false when filters do not match', () => {
      expect(filterUtils.isFilterActive('today', 'thisWeek')).toBe(false);
      expect(filterUtils.isFilterActive('all', 'today')).toBe(false);
    });

    it('should handle null filters', () => {
      expect(filterUtils.isFilterActive(null, 'today')).toBe(false);
      expect(filterUtils.isFilterActive('today', null)).toBe(false);
      expect(filterUtils.isFilterActive(null, null)).toBe(true);
    });
  });
});
```

#### 3. Interactive Card Component Tests
```typescript
// __tests__/components/InteractiveCard.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { InteractiveCard } from '@/components/ui/InteractiveCard';

expect.extend(toHaveNoViolations);

describe('InteractiveCard', () => {
  const defaultProps = {
    title: 'Test Card',
    value: '42',
    ariaLabel: 'Test card with 42 items',
  };

  describe('Rendering', () => {
    it('should render title and value correctly', () => {
      render(<InteractiveCard {...defaultProps} />);
      
      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      render(<InteractiveCard {...defaultProps} className="custom-class" />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('Interactive Behavior', () => {
    it('should be clickable when isClickable is true', () => {
      const onClick = jest.fn();
      render(
        <InteractiveCard 
          {...defaultProps} 
          isClickable={true} 
          onClick={onClick} 
        />
      );
      
      const card = screen.getByRole('button');
      expect(card).toBeInTheDocument();
      
      fireEvent.click(card);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not be clickable when isClickable is false', () => {
      render(<InteractiveCard {...defaultProps} isClickable={false} />);
      
      const card = screen.queryByRole('button');
      expect(card).not.toBeInTheDocument();
    });

    it('should show active state when isActive is true', () => {
      render(
        <InteractiveCard 
          {...defaultProps} 
          isClickable={true} 
          isActive={true} 
        />
      );
      
      const card = screen.getByRole('button');
      expect(card).toHaveClass('ring-2', 'ring-blue-500', 'bg-blue-50');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable with keyboard', async () => {
      const user = userEvent.setup();
      render(
        <InteractiveCard 
          {...defaultProps} 
          isClickable={true} 
          onClick={jest.fn()} 
        />
      );
      
      await user.tab();
      
      const card = screen.getByRole('button');
      expect(card).toHaveFocus();
    });

    it('should trigger onClick when Enter is pressed', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      
      render(
        <InteractiveCard 
          {...defaultProps} 
          isClickable={true} 
          onClick={onClick} 
        />
      );
      
      await user.tab();
      await user.keyboard('{Enter}');
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should trigger onClick when Space is pressed', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      
      render(
        <InteractiveCard 
          {...defaultProps} 
          isClickable={true} 
          onClick={onClick} 
        />
      );
      
      await user.tab();
      await user.keyboard(' ');
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <InteractiveCard 
          {...defaultProps} 
          isClickable={true} 
          onClick={jest.fn()} 
        />
      );
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-label', 'Test card with 42 items');
      expect(card).toHaveAttribute('type', 'button');
    });

    it('should indicate pressed state when active', () => {
      render(
        <InteractiveCard 
          {...defaultProps} 
          isClickable={true} 
          isActive={true} 
          onClick={jest.fn()} 
        />
      );
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-pressed', 'true');
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <InteractiveCard 
          {...defaultProps} 
          isClickable={true} 
          onClick={jest.fn()} 
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Hover Effects', () => {
    it('should apply hover styles when clickable', async () => {
      render(
        <InteractiveCard 
          {...defaultProps} 
          isClickable={true} 
          onClick={jest.fn()} 
        />
      );
      
      const card = screen.getByRole('button');
      
      // Hover should be indicated by CSS classes (tested via className)
      expect(card).toHaveClass('hover:shadow-md', 'hover:scale-105');
    });
  });
});
```

### Integration Tests

#### 1. Dashboard Integration Tests
```typescript
// __tests__/dashboard/ConversationDashboard.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversationDashboard } from '@/components/dashboard/ConversationDashboard';
import { FilterProvider } from '@/lib/contexts/FilterContext';

// Mock the conversation data
const mockConversations = [
  {
    id: '1',
    title: 'Today Conv 1',
    createdAt: new Date().toISOString(),
    participantCount: 2,
  },
  {
    id: '2',
    title: 'Today Conv 2',
    createdAt: new Date().toISOString(),
    participantCount: 3,
  },
  {
    id: '3',
    title: 'Yesterday Conv',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    participantCount: 1,
  },
];

// Mock API calls
jest.mock('@/lib/api/conversations', () => ({
  getConversations: jest.fn(() => Promise.resolve(mockConversations)),
}));

const renderDashboard = () => {
  return render(
    <FilterProvider>
      <ConversationDashboard />
    </FilterProvider>
  );
};

describe('ConversationDashboard Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should render count cards and conversation list', async () => {
      renderDashboard();
      
      // Check cards are rendered
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('This Week')).toBeInTheDocument();
      
      // Wait for conversations to load
      await waitFor(() => {
        expect(screen.getByText('Today Conv 1')).toBeInTheDocument();
      });
    });

    it('should show correct counts in cards', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByTestId('today-count')).toHaveTextContent('2');
        expect(screen.getByTestId('week-count')).toHaveTextContent('3');
      });
    });
  });

  describe('Card Click Filtering', () => {
    it('should filter conversations when Today card is clicked', async () => {
      const user = userEvent.setup();
      renderDashboard();
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Today Conv 1')).toBeInTheDocument();
      });
      
      // Click Today card
      const todayCard = screen.getByTestId('today-card');
      await user.click(todayCard);
      
      // Should show only today's conversations
      await waitFor(() => {
        expect(screen.getByText('Today Conv 1')).toBeInTheDocument();
        expect(screen.getByText('Today Conv 2')).toBeInTheDocument();
        expect(screen.queryByText('Yesterday Conv')).not.toBeInTheDocument();
      });
      
      // Card should show active state
      expect(todayCard).toHaveAttribute('aria-pressed', 'true');
    });

    it('should filter conversations when This Week card is clicked', async () => {
      const user = userEvent.setup();
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Today Conv 1')).toBeInTheDocument();
      });
      
      // Click This Week card
      const weekCard = screen.getByTestId('week-card');
      await user.click(weekCard);
      
      // Should show all conversations within the week
      await waitFor(() => {
        expect(screen.getByText('Today Conv 1')).toBeInTheDocument();
        expect(screen.getByText('Today Conv 2')).toBeInTheDocument();
        expect(screen.getByText('Yesterday Conv')).toBeInTheDocument();
      });
      
      // Card should show active state
      expect(weekCard).toHaveAttribute('aria-pressed', 'true');
    });

    it('should clear filter when active card is clicked again', async () => {
      const user = userEvent.setup();
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Today Conv 1')).toBeInTheDocument();
      });
      
      const todayCard = screen.getByTestId('today-card');
      
      // Click once to activate
      await user.click(todayCard);
      await waitFor(() => {
        expect(todayCard).toHaveAttribute('aria-pressed', 'true');
      });
      
      // Click again to clear
      await user.click(todayCard);
      await waitFor(() => {
        expect(todayCard).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByText('Yesterday Conv')).toBeInTheDocument();
      });
    });
  });

  describe('Dropdown-Card Synchronization', () => {
    it('should activate card when dropdown filter is selected', async () => {
      const user = userEvent.setup();
      renderDashboard();
      
      // Select "Today" from dropdown
      const dropdown = screen.getByRole('combobox', { name: /time filter/i });
      await user.click(dropdown);
      await user.click(screen.getByText('Today'));
      
      // Today card should become active
      const todayCard = screen.getByTestId('today-card');
      expect(todayCard).toHaveAttribute('aria-pressed', 'true');
    });

    it('should deactivate cards when dropdown "All Time" is selected', async () => {
      const user = userEvent.setup();
      renderDashboard();
      
      // First activate a card
      const todayCard = screen.getByTestId('today-card');
      await user.click(todayCard);
      
      // Then select "All Time" from dropdown
      const dropdown = screen.getByRole('combobox', { name: /time filter/i });
      await user.click(dropdown);
      await user.click(screen.getByText('All Time'));
      
      // Cards should be deactivated
      expect(todayCard).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByTestId('week-card')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate between cards using Tab key', async () => {
      const user = userEvent.setup();
      renderDashboard();
      
      // Tab to first focusable element
      await user.tab();
      
      // Should focus Today card
      expect(screen.getByTestId('today-card')).toHaveFocus();
      
      // Tab to next card
      await user.tab();
      expect(screen.getByTestId('week-card')).toHaveFocus();
    });

    it('should activate filter using Enter key on cards', async () => {
      const user = userEvent.setup();
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Today Conv 1')).toBeInTheDocument();
      });
      
      // Focus and activate Today card with Enter
      await user.tab();
      await user.keyboard('{Enter}');
      
      // Should filter conversations
      await waitFor(() => {
        expect(screen.queryByText('Yesterday Conv')).not.toBeInTheDocument();
      });
    });
  });
});
```

### End-to-End Tests

#### 1. E2E User Journey Tests
```typescript
// e2e/dashboard-filtering.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard Card Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should filter conversations by clicking Today card', async ({ page }) => {
    // Wait for conversations to load
    await expect(page.locator('[data-testid="conversation-list"]')).toBeVisible();
    
    // Get initial conversation count
    const initialCount = await page.locator('[data-testid="conversation-item"]').count();
    expect(initialCount).toBeGreaterThan(0);
    
    // Click Today card
    await page.locator('[data-testid="today-card"]').click();
    
    // Wait for filter to apply
    await page.waitForTimeout(500);
    
    // Check that card is active
    await expect(page.locator('[data-testid="today-card"]')).toHaveAttribute('aria-pressed', 'true');
    
    // Check that only today's conversations are visible
    const filteredCount = await page.locator('[data-testid="conversation-item"]').count();
    const todayCount = parseInt(await page.locator('[data-testid="today-count"]').textContent() || '0');
    
    expect(filteredCount).toBe(todayCount);
  });

  test('should filter conversations by clicking This Week card', async ({ page }) => {
    // Click This Week card
    await page.locator('[data-testid="week-card"]').click();
    
    // Wait for filter to apply
    await page.waitForTimeout(500);
    
    // Check that card is active
    await expect(page.locator('[data-testid="week-card"]')).toHaveAttribute('aria-pressed', 'true');
    
    // Verify Today card is not active
    await expect(page.locator('[data-testid="today-card"]')).toHaveAttribute('aria-pressed', 'false');
    
    // Check conversation count matches week count
    const filteredCount = await page.locator('[data-testid="conversation-item"]').count();
    const weekCount = parseInt(await page.locator('[data-testid="week-count"]').textContent() || '0');
    
    expect(filteredCount).toBe(weekCount);
  });

  test('should synchronize card state with dropdown filter', async ({ page }) => {
    // Select "Today" from dropdown
    await page.locator('[data-testid="filter-dropdown"]').click();
    await page.locator('text=Today').click();
    
    // Today card should become active
    await expect(page.locator('[data-testid="today-card"]')).toHaveAttribute('aria-pressed', 'true');
    
    // Select "All Time" from dropdown
    await page.locator('[data-testid="filter-dropdown"]').click();
    await page.locator('text=All Time').click();
    
    // Cards should be inactive
    await expect(page.locator('[data-testid="today-card"]')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('[data-testid="week-card"]')).toHaveAttribute('aria-pressed', 'false');
  });

  test('should provide visual feedback on hover', async ({ page }) => {
    const todayCard = page.locator('[data-testid="today-card"]');
    
    // Hover over card
    await todayCard.hover();
    
    // Check for hover styles (shadow, scale)
    await expect(todayCard).toHaveClass(/hover:shadow-md/);
    await expect(todayCard).toHaveClass(/hover:scale-105/);
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab to first card
    await page.keyboard.press('Tab');
    
    // Today card should be focused
    await expect(page.locator('[data-testid="today-card"]')).toBeFocused();
    
    // Press Enter to activate
    await page.keyboard.press('Enter');
    
    // Card should be active
    await expect(page.locator('[data-testid="today-card"]')).toHaveAttribute('aria-pressed', 'true');
    
    // Tab to next card
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="week-card"]')).toBeFocused();
    
    // Press Space to activate
    await page.keyboard.press(' ');
    
    // Week card should be active, Today should be inactive
    await expect(page.locator('[data-testid="week-card"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-testid="today-card"]')).toHaveAttribute('aria-pressed', 'false');
  });
});
```

#### 2. Accessibility E2E Tests
```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Dashboard Accessibility', () => {
  test('should have no accessibility violations', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support screen reader navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check ARIA labels
    const todayCard = page.locator('[data-testid="today-card"]');
    await expect(todayCard).toHaveAttribute('aria-label', /Today.*conversations/);
    
    const weekCard = page.locator('[data-testid="week-card"]');
    await expect(weekCard).toHaveAttribute('aria-label', /This week.*conversations/);
    
    // Check role attributes
    await expect(todayCard).toHaveAttribute('role', 'button');
    await expect(weekCard).toHaveAttribute('role', 'button');
  });

  test('should have proper focus indicators', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Tab to cards and check focus styles
    await page.keyboard.press('Tab');
    
    const focusedCard = page.locator(':focus');
    await expect(focusedCard).toHaveClass(/ring-2/);
    await expect(focusedCard).toHaveClass(/ring-blue-500/);
  });
});
```

## Test Data and Fixtures

### Mock Data
```typescript
// __tests__/fixtures/conversations.ts
export const mockConversations = [
  {
    id: '1',
    title: 'Product Discussion',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    participantCount: 3,
    messageCount: 15,
    status: 'active',
  },
  {
    id: '2',
    title: 'Bug Report Follow-up',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
    participantCount: 2,
    messageCount: 8,
    status: 'resolved',
  },
  {
    id: '3',
    title: 'Feature Request',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    participantCount: 5,
    messageCount: 22,
    status: 'pending',
  },
  {
    id: '4',
    title: 'Weekly Sync',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    participantCount: 8,
    messageCount: 45,
    status: 'archived',
  },
];

export const getConversationsByFilter = (filter: string) => {
  const now = new Date();
  
  switch (filter) {
    case 'today':
      return mockConversations.filter(conv => {
        const convDate = new Date(conv.createdAt);
        return convDate.toDateString() === now.toDateString();
      });
    
    case 'thisWeek':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      return mockConversations.filter(conv => {
        const convDate = new Date(conv.createdAt);
        return convDate >= weekStart;
      });
    
    default:
      return mockConversations;
  }
};
```

## Test Configuration

### Jest Configuration
```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/jest.config.js',
    '!**/next.config.js',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

### Jest Setup File
```javascript
// jest.setup.js
import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/dashboard',
      pathname: '/dashboard',
      query: {},
      asPath: '/dashboard',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};
```

### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Running Tests

### Development Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:accessibility": "playwright test e2e/accessibility.spec.ts"
  }
}
```

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:coverage
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Success Metrics

### Coverage Targets
- **Unit Tests**: 95% coverage for new code
- **Integration Tests**: 100% coverage of critical user paths
- **E2E Tests**: 100% coverage of acceptance criteria

### Performance Benchmarks
- Test suite execution time < 5 minutes
- Individual test response time < 1 second
- E2E test completion < 2 minutes per scenario

### Quality Gates
- All tests must pass before merge
- No accessibility violations in E2E tests
- Code coverage cannot decrease

This comprehensive testing strategy ensures the clickable count cards enhancement maintains high quality while preserving existing functionality. The tests cover all interaction patterns, edge cases, and accessibility requirements.

**Sam**  
*Senior QA Engineer, Claude Dev Team*