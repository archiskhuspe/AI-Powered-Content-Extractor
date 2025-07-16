import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '../pages/index';

// Mock fetch (resettable)
const mockFetch = (ok, data) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(data)
    })
  );
};

describe('AI-powered Content Extractor App', () => {
  it('renders the main UI and handles API error', async () => {
    mockFetch(false, { error: 'Failed to extract content.' });
    render(<Home />);
    expect(screen.getByText(/AI-powered Content Extractor/i)).toBeInTheDocument();
    const input = screen.getByPlaceholderText(/Enter a public URL/i);
    fireEvent.change(input, { target: { value: 'https://example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Extract/i }));
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    await waitFor(() => {
      // Use getAllByText to allow for multiple matches
      expect(screen.getAllByText(/Failed to extract content/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders summary and key points on successful API call', async () => {
    mockFetch(true, {
      summary: 'This is a test summary.\n\nSecond paragraph.',
      keyPoints: ['Point 1', 'Point 2']
    });
    render(<Home />);
    const input = screen.getByPlaceholderText(/Enter a public URL/i);
    fireEvent.change(input, { target: { value: 'https://example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Extract/i }));
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('heading', { name: /Summary/i })).toBeInTheDocument());
    expect(screen.getByText('This is a test summary.')).toBeInTheDocument();
    expect(screen.getByText('Second paragraph.')).toBeInTheDocument();
    expect(screen.getByText('Key Points')).toBeInTheDocument();
    expect(screen.getByText('Point 1')).toBeInTheDocument();
    expect(screen.getByText('Point 2')).toBeInTheDocument();
  });
}); 