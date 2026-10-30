import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { StatCard } from '../components/shared/StatCard';
import { Sprout, Trees } from 'lucide-react';

describe('UI Primitives & Accessibility', () => {
  it('renders Button with proper attributes and handles clicks', () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} variant="primary">
        Save Farm
      </Button>
    );

    const button = screen.getByRole('button', { name: /save farm/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders Button in loading state with disabled attribute and aria-busy', () => {
    render(
      <Button isLoading variant="primary">
        Submitting...
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('renders Input with explicit matching <label for="id"> (WCAG 2.1 AA)', () => {
    render(
      <Input
        id="farm-name-input"
        label="Farm Name"
        placeholder="Enter farm name"
        required
      />
    );

    const label = screen.getByText(/farm name/i);
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute('for', 'farm-name-input');

    const input = screen.getByPlaceholderText('Enter farm name');
    expect(input).toHaveAttribute('id', 'farm-name-input');
    expect(input).toBeRequired();
  });

  it('renders Input error message with role="alert" when error is passed', () => {
    render(
      <Input
        label="Total Area"
        error="Area must be greater than 0"
      />
    );

    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent(/area must be greater than 0/i);
  });

  it('renders EmptyState with icon, title, description, and action button', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        icon={Trees}
        title="No Farms Found"
        description="Please register your first land holding"
        actionLabel="Add Farm Now"
        onAction={handleAction}
      />
    );

    expect(screen.getByText('No Farms Found')).toBeInTheDocument();
    expect(screen.getByText('Please register your first land holding')).toBeInTheDocument();
    
    const actionBtn = screen.getByRole('button', { name: /add farm now/i });
    fireEvent.click(actionBtn);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('renders StatCard with label, value, and subtext', () => {
    render(
      <StatCard
        label="Active Plots"
        value={12}
        subtext="Across 3 farms"
        icon={Sprout}
      />
    );

    expect(screen.getByText('Active Plots')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Across 3 farms')).toBeInTheDocument();
  });
});
