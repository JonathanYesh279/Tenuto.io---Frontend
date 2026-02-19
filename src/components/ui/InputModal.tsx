import React, { useState } from 'react';
import { XIcon } from '@phosphor-icons/react';

interface InputModalProps {
  isOpen: boolean;
  title: string;
  placeholder?: string;
  initialValue?: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}

export const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  title,
  placeholder = '',
  initialValue = '',
  onSubmit,
  onClose
}) => {
  const [value, setValue] = useState(initialValue);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
      setValue('');
      onClose();
    }
  };

  const handleCancel = () => {
    setValue('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-background rounded border border-border max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <button
            onClick={handleCancel}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
          >
            <XIcon className="w-5 h-5" weight="regular" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <input
              type="url"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-foreground border border-border rounded hover:bg-muted transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-neutral-800 transition-colors"
            >
              הוסף
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
