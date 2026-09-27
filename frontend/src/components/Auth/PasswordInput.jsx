import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '../ui';
import { useLanguage } from '../../locales/LanguageContext.jsx';

/** Password field with a show/hide toggle. Props pass through to the input (id, aria-* from Field). */
export default function PasswordInput(props) {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? 'text' : 'password'} className="pr-10" />
      <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}
        aria-pressed={show} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted hover:text-fg">
        {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
