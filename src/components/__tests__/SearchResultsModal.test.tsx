import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SearchResultsModal from '../SearchResultsModal';

describe('SearchResultsModal XSS and Sanitization', () => {
  it('renders safe markdown headings and valid links', () => {
    const mockResults = {
      choices: [
        {
          message: {
            content: `### OPENRENT LISTINGS\n### Safe Heading\n[View Listing](https://openrent.co.uk/property/123)`,
          },
        },
      ],
    };

    render(
      <SearchResultsModal
        isOpen={true}
        onClose={vi.fn()}
        searchQuery="London"
        searchResults={mockResults}
        selectedProperty="openrent"
      />
    );

    expect(screen.getByText('Safe Heading')).toBeDefined();
    const link = screen.getByText('View Listing') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('https://openrent.co.uk/property/123');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('sanitizes and strips malicious script tags and event handlers', () => {
    const mockMalicious = {
      choices: [
        {
          message: {
            content: `### OPENRENT LISTINGS\n<script>window.pwned=true;</script><img src="x" onerror="alert(1)">[Click Me](javascript:alert(1))`,
          },
        },
      ],
    };

    const { container } = render(
      <SearchResultsModal
        isOpen={true}
        onClose={vi.fn()}
        searchQuery="London"
        searchResults={mockMalicious}
        selectedProperty="openrent"
      />
    );

    // Ensure no <script> or onerror attributes exist in DOM
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img[onerror]')).toBeNull();
    // Ensure javascript: link was purged by DOMPurify
    const maliciousLink = container.querySelector('a[href^="javascript:"]');
    expect(maliciousLink).toBeNull();
  });
});
