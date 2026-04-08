import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, bootstrapCompany, fetchCompanyState, getEventSocketUrl } from './api/client';
import { BootstrapForm } from './features/bootstrap/BootstrapForm';
import { OfficeScreen } from './features/office/OfficeScreen';
import type { CompanyState, DomainEvent } from './types/domain';

const STATE_INCLUDE = ['agents', 'tasks', 'approvals', 'recent_events', 'runs', 'messages'];

type AppMode = 'loading' | 'bootstrap' | 'office' | 'error';

function isCompanyNotBootstrappedError(error: ApiError): boolean {
  const normalized = error.message.toLowerCase();
  return error.code === 'NOT_FOUND' || normalized.includes('not bootstrapped');
}

function isDomainEvent(value: unknown): value is DomainEvent {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<DomainEvent>;
  return typeof candidate.eventId === 'string' && typeof candidate.eventType === 'string';
}

export default function App(): JSX.Element {
  const [mode, setMode] = useState<AppMode>('loading');
  const [workspace, setWorkspace] = useState<CompanyState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBootstrapSubmitting, setBootstrapSubmitting] = useState(false);
  const [isSocketConnected, setSocketConnected] = useState(false);

  const refreshTimerRef = useRef<number | null>(null);

  const loadState = useCallback(async (): Promise<void> => {
    try {
      const state = await fetchCompanyState(STATE_INCLUDE);
      setWorkspace(state);
      setMode('office');
      setErrorMessage(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404 && isCompanyNotBootstrappedError(error)) {
        setMode('bootstrap');
        setWorkspace(null);
        setErrorMessage(null);
        return;
      }

      const fallback = error instanceof Error ? error.message : 'Failed to load company state.';
      setMode('error');
      setErrorMessage(fallback);
    }
  }, []);

  const scheduleRefresh = useCallback(
    (delayMs = 450) => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = window.setTimeout(() => {
        void loadState();
      }, delayMs);
    },
    [loadState],
  );

  useEffect(() => {
    void loadState();

    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, [loadState]);

  useEffect(() => {
    if (mode !== 'office') {
      setSocketConnected(false);
      return undefined;
    }

    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let isCancelled = false;

    const connect = (): void => {
      if (isCancelled) {
        return;
      }

      socket = new WebSocket(getEventSocketUrl());
      socket.onopen = () => {
        setSocketConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data as string) as unknown;
          if (!isDomainEvent(payload)) {
            return;
          }

          setWorkspace((current) => {
            if (!current) {
              return current;
            }

            const nextEvents = [payload, ...current.recent_events].slice(0, 200);
            return {
              ...current,
              recent_events: nextEvents,
            };
          });

          scheduleRefresh();
        } catch {
          // Skip malformed frames.
        }
      };

      socket.onerror = () => {
        setSocketConnected(false);
      };

      socket.onclose = () => {
        setSocketConnected(false);
        if (isCancelled) {
          return;
        }

        reconnectTimer = window.setTimeout(connect, 1_200);
      };
    };

    connect();

    return () => {
      isCancelled = true;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      socket?.close();
      setSocketConnected(false);
    };
  }, [mode, scheduleRefresh]);

  const handleBootstrapSubmit = useCallback(
    async (payload: { company_name: string; company_prompt: string; language: 'ru' | 'en' }) => {
      try {
        setBootstrapSubmitting(true);
        setErrorMessage(null);
        await bootstrapCompany(payload);
        await loadState();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Bootstrap failed.';
        setErrorMessage(message);
      } finally {
        setBootstrapSubmitting(false);
      }
    },
    [loadState],
  );

  if (mode === 'loading') {
    return (
      <main className="status-screen">
        <h1>Syncing founder office...</h1>
      </main>
    );
  }

  if (mode === 'bootstrap') {
    return <BootstrapForm isSubmitting={isBootstrapSubmitting} error={errorMessage} onSubmit={handleBootstrapSubmit} />;
  }

  if (mode === 'error' || !workspace) {
    return (
      <main className="status-screen">
        <h1>Unable to load office</h1>
        <p>{errorMessage ?? 'Unknown error.'}</p>
        <button type="button" onClick={() => void loadState()}>
          Retry
        </button>
      </main>
    );
  }

  return <OfficeScreen state={workspace} isSocketConnected={isSocketConnected} onRefresh={loadState} />;
}
