// File: src/pages/components/SearchBar.tsx
import { h } from 'preact';
import { useRef } from 'preact/hooks';
import 'ojs/ojinputsearch';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar = ({ value, onChange, placeholder = 'Search...' }: SearchBarProps) => {
  const handleRawValueChange = (event: CustomEvent) => {
    const newRawValue = event.detail.value;
    onChange(newRawValue || '');
  };

  const handleInput = (event: CustomEvent) => {
    const newValue = event.detail.value;
    onChange(newValue);
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div class="oj-flex oj-sm-align-items-center oj-sm-flex-wrap-nowrap" style="flex: 1 1 auto; gap: 8px;">
      <oj-input-search
        value={value}
        placeholder={placeholder}
        onojValueAction={handleInput}
        onrawValueChanged={handleRawValueChange}
        style="width: 100%;"
      ></oj-input-search>

      {value?.trim() && (
        <oj-button chroming="borderless" onojAction={handleClear}>
          Clear
        </oj-button>
      )}
    </div>
  );
};

export default SearchBar;
