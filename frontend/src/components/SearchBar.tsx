// File: src/pages/components/SearchBar.tsx
import { h } from 'preact';
import { useRef } from 'preact/hooks';
import 'ojs/ojinputsearch';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string; 
}

const SearchBar = ({ value, onChange,  placeholder = 'Search...' }: SearchBarProps) => {
  const handleRawValueChange = (event: CustomEvent) => {
    const newRawValue = event.detail.value;
    onChange(newRawValue || '');
  };

  const handleInput = (event: CustomEvent) => {
    const newValue = event.detail.value;
    onChange(newValue);
  };

  return (
    <div class="oj-flex oj-sm-align-items-center" style="flex: 1 1 auto;">
      <oj-input-search
        value={value}
        placeholder={placeholder}
        onojValueAction={handleInput}
        onrawValueChanged={handleRawValueChange}
        style="width: 100%;"
        // style="height: 2.375rem;" 
        // class="oj-form-control-max-width-md"
      ></oj-input-search>
    </div>
  );
};

export default SearchBar;