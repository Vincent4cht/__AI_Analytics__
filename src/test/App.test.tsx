import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  it('renders the app title', () => {
    render(<App />);
    const titleElement = screen.getByText(/智匯會議 AI 秘書/i);
    expect(titleElement).toBeDefined();
  });

  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeDefined();
  });
});
