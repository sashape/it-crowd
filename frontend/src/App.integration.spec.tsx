import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('./features/office/OfficeScene', () => ({
  OfficeScene: () => <div data-testid="office-scene" />, 
}));

class MockWebSocket {
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;

  public constructor(_url: string) {
    window.setTimeout(() => {
      this.onopen?.(new Event('open'));
    }, 0);
  }

  public close(): void {
    this.onclose?.(new CloseEvent('close'));
  }
}

const initialNotFound = new Response(
  JSON.stringify({ success: false, code: 'NOT_FOUND', message: 'Company is not bootstrapped yet.' }),
  { status: 404, headers: { 'Content-Type': 'application/json' } },
);

const officeStateResponse = new Response(
  JSON.stringify({
    success: true,
    company: {
      id: 'company-1',
      name: 'Test Company',
      prompt: 'Prompt',
      language: 'en',
      blueprintStatus: 'blueprint_confirmed',
      createdAt: '2026-04-08T00:00:00.000Z',
    },
    agents: [
      {
        id: 'agent-1',
        companyId: 'company-1',
        role: 'pm',
        name: 'Anna',
        managerAgentId: null,
        status: 'idle',
        specializationHint: 'roadmap',
        responsibilities: [],
      },
    ],
    tasks: [],
    approvals: [],
    recent_events: [],
    runs: [],
    messages: [],
  }),
  { status: 200, headers: { 'Content-Type': 'application/json' } },
);

describe('App integration', () => {
  const originalWebSocket = globalThis.WebSocket;

  beforeEach(() => {
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.WebSocket = originalWebSocket;
  });

  it('switches from bootstrap screen to office screen after bootstrap', async () => {
    let stateCalls = 0;

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/api/company/state')) {
        stateCalls += 1;
        return stateCalls === 1 ? initialNotFound : officeStateResponse.clone();
      }

      if (url.includes('/api/company/bootstrap') && init?.method === 'POST') {
        return new Response(JSON.stringify({ success: true }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    });

    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText('IT-CROWD Command Deck')).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: 'Launch Office' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Test Company')).toBeInTheDocument();
      expect(screen.getByTestId('office-scene')).toBeInTheDocument();
    });
  });

  it('shows error screen for unrelated 404 route-not-found responses', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/company/state')) {
        return new Response(
          JSON.stringify({
            message: 'The route api/company/state could not be found.',
            exception: 'Symfony\\\\Component\\\\HttpKernel\\\\Exception\\\\NotFoundHttpException',
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    });

    vi.stubGlobal('fetch', fetchMock);
    render(<App />);

    expect(await screen.findByText('Unable to load office')).toBeInTheDocument();
    expect(screen.getByText('The route api/company/state could not be found.')).toBeInTheDocument();
  });
});
