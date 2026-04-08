import { type FormEvent, useState } from 'react';
import type { BootstrapPayload } from '../../types/domain';

interface BootstrapFormProps {
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (payload: BootstrapPayload) => Promise<void>;
}

export function BootstrapForm({ isSubmitting, error, onSubmit }: BootstrapFormProps): JSX.Element {
  const [companyName, setCompanyName] = useState('Retro Crowd Labs');
  const [companyPrompt, setCompanyPrompt] = useState(
    'Build a deterministic product engineering loop with PM, TL, BE, FE, and QA agents working in a visible office.',
  );
  const [language, setLanguage] = useState<'ru' | 'en'>('ru');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    await onSubmit({
      company_name: companyName,
      company_prompt: companyPrompt,
      language,
    });
  };

  return (
    <section className="bootstrap-shell">
      <div className="bootstrap-frame">
        <header>
          <h1>IT-CROWD Command Deck</h1>
          <p>Initialize the founder office and spawn your first deterministic software team.</p>
        </header>

        <form onSubmit={(event) => void handleSubmit(event)}>
          <label>
            Company name
            <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} minLength={2} required />
          </label>

          <label>
            Mission prompt
            <textarea value={companyPrompt} onChange={(event) => setCompanyPrompt(event.target.value)} minLength={20} rows={4} required />
          </label>

          <label>
            Language
            <select value={language} onChange={(event) => setLanguage(event.target.value as 'ru' | 'en')}>
              <option value="ru">Russian</option>
              <option value="en">English</option>
            </select>
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Bootstrapping...' : 'Launch Office'}
          </button>
        </form>

        {error ? <p className="bootstrap-error">{error}</p> : null}
      </div>
    </section>
  );
}
